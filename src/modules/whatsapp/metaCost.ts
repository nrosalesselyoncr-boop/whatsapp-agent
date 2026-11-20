import { sql } from "drizzle-orm";
import { getBusinessContext } from "../business";
import { listActiveOwners } from "../team";
import { withTenant, type Executor } from "../../platform/db/scope";
import { dailyUsage } from "../../platform/db/schema";
import { queueEmail } from "../../platform/email/enqueue";
import { metaFreeTierEmail } from "../../platform/email/templates";
import { publicUrl } from "../../platform/http/publicUrl";
import { startLeaderLoop } from "../../platform/net/leaderLease";
import type { Loop } from "../../platform/net/scheduler";
import { log } from "../../platform/observability/log";
import { numberFromEnv } from "../../platform/observability/rateAlert";
import { captureError } from "../../platform/observability/sentry";
import { listConnectedWhatsAppBusinessIds } from "./channels";
import { sendPushToBusiness, type PushTransport } from "./push";
import { getAiUsage, usageMonth, type AiUsageSnapshot } from "./usage";

// ─────────────────────────────────────────────────────────────────────────────
// Lo que Meta le cobra al NEGOCIO por su WhatsApp (decisión del 2026-11-17: cada negocio
// paga su consumo a Meta con su propio método de pago; Selyon no lo factura ni lo absorbe,
// y le avisa al dueño antes de que empiece a pagar las respuestas).
//
// Cómo cobra Meta (tarifas desde el 2026-10-01, región «Resto de Latinoamérica», que
// incluye Costa Rica; ver PLAN-PREVENTA.md §4.4):
//   • Servicio (respuestas libres dentro de la ventana de 24 h, del bot o de la bandeja):
//     los primeros 1.000 del mes por número son gratis; desde el 1.001, por mensaje.
//   • Plantillas de utilidad (recordatorios, seguimiento) y de marketing (campañas,
//     rescate): se cobran SIEMPRE, desde la primera.
//
// Este módulo:
//   1. `metaConsumption`: estimación del mes a partir de `ai_usage_monthly` (servicio =
//      salientes − plantillas). Es una ESTIMACIÓN: nuestro mes es el calendario UTC y Meta
//      cuenta por número en la zona de su cuenta; con varios números contamos el total del
//      negocio (avisa antes, nunca después). La cifra que vale es la de Meta.
//   2. El loop `meta_free_tier_watch` (procesos worker): cuando las respuestas del mes
//      pasan el 80 % del tramo gratis y cuando lo agotan, avisa a los DUEÑOS (correo +
//      push solo a sus dispositivos). Cada aviso sale UNA vez por mes: el nivel avisado se
//      reclama en `daily_usage` (métrica `meta_free_tier_notice`, día 1 del mes) con un
//      upsert condicional, atómico entre réplicas, sin tabla nueva.
//
// Tarifas y tramo por env (`META_*`, .env.example) para actualizarlas sin deploy.
// ─────────────────────────────────────────────────────────────────────────────

export const META_NOTICE_METRIC = "meta_free_tier_notice";

/** 0 = nada que avisar, 1 = cerca del fin del tramo gratis, 2 = Meta ya cobra las respuestas. */
export type MetaNoticeLevel = 0 | 1 | 2;

export interface MetaRates {
  /** Respuestas de servicio gratis por mes (por número, según Meta). */
  freeServiceMessages: number;
  /** Fracción del tramo gratis a la que sale el primer aviso (0.8 = 80 %). */
  warnRatio: number;
  serviceUsd: number;
  utilityUsd: number;
  marketingUsd: number;
}

export function metaRatesFromEnv(): MetaRates {
  return {
    freeServiceMessages: Math.floor(numberFromEnv("META_FREE_SERVICE_MESSAGES", 1000, 0)),
    warnRatio: Math.min(1, numberFromEnv("META_FREE_TIER_WARN_RATIO", 0.8, 0)),
    serviceUsd: numberFromEnv("META_SERVICE_USD", 0.0113, 0),
    utilityUsd: numberFromEnv("META_UTILITY_USD", 0.0113, 0),
    marketingUsd: numberFromEnv("META_MARKETING_USD", 0.074, 0),
  };
}

export interface MetaConsumption {
  /** Mes de la medición ("AAAA-MM", calendario UTC). */
  month: string;
  serviceMessages: number;
  freeServiceMessages: number;
  /** Respuestas por encima del tramo gratis (las que Meta cobra). */
  chargedServiceMessages: number;
  utilityTemplates: number;
  marketingTemplates: number;
  /** Estimación del cargo de Meta del mes, en dólares (redondeada a centavos). */
  estimatedUsd: number;
  rates: { serviceUsd: number; utilityUsd: number; marketingUsd: number };
  level: MetaNoticeLevel;
}

const cents = (usd: number) => Math.round(usd * 100) / 100;

/** Estimación de lo que Meta le cobra al negocio este mes (ver cabecera). */
export function metaConsumption(
  usage: Pick<AiUsageSnapshot, "messagesOut" | "utilityTemplates" | "marketingTemplates">,
  rates: MetaRates,
  now: Date,
): MetaConsumption {
  const serviceMessages = Math.max(0, usage.messagesOut - usage.utilityTemplates - usage.marketingTemplates);
  const chargedServiceMessages = Math.max(0, serviceMessages - rates.freeServiceMessages);
  const warnAt = Math.ceil(rates.freeServiceMessages * rates.warnRatio);
  const level: MetaNoticeLevel = chargedServiceMessages > 0 ? 2 : serviceMessages > 0 && serviceMessages >= warnAt ? 1 : 0;
  return {
    month: usageMonth(now).slice(0, 7),
    serviceMessages,
    freeServiceMessages: rates.freeServiceMessages,
    chargedServiceMessages,
    utilityTemplates: usage.utilityTemplates,
    marketingTemplates: usage.marketingTemplates,
    estimatedUsd: cents(
      chargedServiceMessages * rates.serviceUsd + usage.utilityTemplates * rates.utilityUsd + usage.marketingTemplates * rates.marketingUsd,
    ),
    rates: { serviceUsd: rates.serviceUsd, utilityUsd: rates.utilityUsd, marketingUsd: rates.marketingUsd },
    level,
  };
}

/** Consumo del mes del negocio (lo muestra la configuración del agente en el panel). */
export async function getMetaConsumption(db: Executor, businessId: string, now: Date = new Date()): Promise<MetaConsumption> {
  return metaConsumption(await getAiUsage(db, businessId, now), metaRatesFromEnv(), now);
}

/**
 * Reclama el aviso de nivel `level` del mes: true solo para quien sube el nivel guardado
 * (inserta la fila o la actualiza desde uno menor). Dos réplicas a la vez: una sola gana.
 */
async function claimNotice(db: Executor, businessId: string, monthStart: string, level: MetaNoticeLevel): Promise<boolean> {
  const rows = await withTenant(db, businessId, (tx) =>
    tx
      .insert(dailyUsage)
      .values({ businessId, date: monthStart, metric: META_NOTICE_METRIC, value: level })
      .onConflictDoUpdate({
        target: [dailyUsage.businessId, dailyUsage.date, dailyUsage.metric],
        set: { value: level, updatedAt: new Date() },
        setWhere: sql`${dailyUsage.value} < ${level}`,
      })
      .returning({ value: dailyUsage.value }),
  );
  return rows.length > 0;
}

/** Ruta del panel donde el dueño ve el consumo (configuración del agente). */
export const META_USAGE_PANEL_PATH = "/panel/whatsapp/settings";

async function notifyOwners(db: Executor, push: PushTransport | null, businessId: string, consumption: MetaConsumption): Promise<number> {
  const owners = await listActiveOwners(db, businessId);
  if (owners.length === 0) return 0;
  const ctx = await getBusinessContext(db, businessId);
  const businessName = ctx?.business.name ?? "";
  const panelUrl = publicUrl(META_USAGE_PANEL_PATH);
  const exhausted = consumption.level === 2;
  for (const owner of owners) {
    const content = metaFreeTierEmail({
      businessName,
      userName: owner.name,
      exhausted,
      serviceMessages: consumption.serviceMessages,
      freeServiceMessages: consumption.freeServiceMessages,
      serviceUsd: consumption.rates.serviceUsd,
      panelUrl,
    });
    // dedupe por mes y nivel: un reintento del loop no duplica el correo mientras viva el job.
    await queueEmail(
      db,
      { to: owner.email, ...content, tags: { kind: "meta_free_tier", business_id: businessId } },
      { businessId, dedupeKey: `meta-free-tier-${consumption.month}-${consumption.level}-${owner.userId}` },
    );
    await sendPushToBusiness(
      db,
      businessId,
      {
        title: exhausted ? "WhatsApp: Meta ya cobra las respuestas" : "WhatsApp: se acaba el tramo gratis de Meta",
        body: exhausted
          ? `Pasaste las ${consumption.freeServiceMessages} respuestas gratis del mes. Meta te cobra cada una a tu método de pago.`
          : `Van ${consumption.serviceMessages} de ${consumption.freeServiceMessages} respuestas gratis del mes. Después, Meta cobra cada una.`,
        url: META_USAGE_PANEL_PATH,
        tag: `meta-free-tier-${consumption.month}`,
      },
      { transport: push, onlyUserId: owner.userId },
    );
  }
  return owners.length;
}

export interface MetaNoticeSent {
  businessId: string;
  level: MetaNoticeLevel;
  owners: number;
}

/**
 * Un tick: revisa cada negocio con WhatsApp conectado y avisa a los dueños de los que
 * subieron de nivel este mes. Si en un mismo tick pasó de 0 a 2, sale solo el de nivel 2.
 */
export async function checkMetaFreeTier(
  db: Executor,
  options: { push?: PushTransport | null; rates?: MetaRates } = {},
  now: Date = new Date(),
): Promise<MetaNoticeSent[]> {
  const rates = options.rates ?? metaRatesFromEnv();
  if (rates.freeServiceMessages <= 0) return [];
  const sent: MetaNoticeSent[] = [];
  for (const businessId of await listConnectedWhatsAppBusinessIds(db)) {
    try {
      const consumption = metaConsumption(await getAiUsage(db, businessId, now), rates, now);
      if (consumption.level === 0) continue;
      if (!(await claimNotice(db, businessId, usageMonth(now), consumption.level))) continue;
      const owners = await notifyOwners(db, options.push ?? null, businessId, consumption);
      log.info("whatsapp_meta_free_tier_notice", { businessId, level: consumption.level, serviceMessages: consumption.serviceMessages, owners });
      sent.push({ businessId, level: consumption.level, owners });
    } catch (e) {
      // Un negocio con problemas no frena el aviso de los demás.
      log.warn("whatsapp_meta_free_tier_check_failed", { businessId, error: e instanceof Error ? e.message : String(e) });
      captureError(e, { scheduler: "meta_free_tier_watch", businessId });
    }
  }
  return sent;
}

/**
 * Loop del aviso (procesos `ROLE=worker|all`, una réplica por lease), cada
 * `META_FREE_TIER_CHECK_MIN` minutos (default 30). null con META_FREE_SERVICE_MESSAGES=0.
 */
export function startMetaFreeTierLoop(db: Executor, options: { push?: () => PushTransport | null; intervalMs?: number } = {}): Loop | null {
  if (metaRatesFromEnv().freeServiceMessages <= 0) return null;
  const intervalMs = options.intervalMs ?? numberFromEnv("META_FREE_TIER_CHECK_MIN", 30, 1) * 60_000;
  return startLeaderLoop({
    db,
    label: "meta_free_tier_watch",
    intervalMs,
    tick: async () => {
      await checkMetaFreeTier(db, { push: options.push ? options.push() : null });
    },
    onError: (e, phase) => {
      log.error("meta_free_tier_watch_failed", { phase, error: e instanceof Error ? e.message : String(e) });
      captureError(e, { scheduler: "meta_free_tier_watch", phase });
    },
    scalingHint: "Subí META_FREE_TIER_CHECK_MIN.",
  });
}
