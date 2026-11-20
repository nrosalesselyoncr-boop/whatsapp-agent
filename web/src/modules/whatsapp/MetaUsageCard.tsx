import { errorMessage } from "../../lib/api";
import ErrorState from "../../ui/ErrorState";
import { useMetaUsage, type MetaUsage } from "./whatsappApi";

// Lo que Meta le cobra al negocio por su WhatsApp este mes (estimado). Decisión del
// 2026-11-17: cada negocio paga su consumo directo a Meta con su método de pago; Selyon no
// lo factura. El worker además le avisa al dueño por correo y push al acercarse al fin del
// tramo gratis y al agotarlo (src/modules/whatsapp/metaCost.ts).

const count = new Intl.NumberFormat("es-CR");
const usd = new Intl.NumberFormat("es-CR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });

function statusText(u: MetaUsage): string {
  if (u.level === 2) return `Ya pasaste las ${count.format(u.freeServiceMessages)} respuestas gratis del mes: Meta cobra cada respuesta nueva.`;
  if (u.level === 1) return `Te quedan ${count.format(u.freeServiceMessages - u.serviceMessages)} respuestas gratis este mes. Después, Meta cobra cada una.`;
  return `Las primeras ${count.format(u.freeServiceMessages)} respuestas de cada mes son gratis.`;
}

export default function MetaUsageCard() {
  const query = useMetaUsage();
  return (
    <section className="card wa-settings-card" aria-labelledby="wa-meta-usage-title">
      <h2 id="wa-meta-usage-title" className="card-title">
        Consumo de WhatsApp (Meta)
      </h2>
      <p className="settings-help">
        Meta cobra los mensajes de WhatsApp directamente a tu método de pago en su plataforma; no va en la factura de Selyon. Te
        avisamos por correo antes de que se acaben las respuestas gratis del mes.
      </p>
      {query.isPending ? (
        <div className="clients-loading" role="status">
          <div className="spinner" aria-hidden="true" />
          <span>Cargando el consumo…</span>
        </div>
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error, "No pudimos cargar el consumo del mes.")} onRetry={() => void query.refetch()} />
      ) : (
        <MetaUsageBody usage={query.data} />
      )}
    </section>
  );
}

function MetaUsageBody({ usage: u }: { usage: MetaUsage }) {
  const used = Math.min(u.serviceMessages, u.freeServiceMessages);
  const pct = u.freeServiceMessages > 0 ? Math.round((used / u.freeServiceMessages) * 100) : 100;
  const warn = u.level > 0;
  return (
    <div className="wa-meta-usage">
      <div className="wa-meta-row">
        <div className="wa-meta-head">
          <span className="wa-meta-label">Respuestas del mes (bot y bandeja)</span>
          <span className={"wa-meta-value tnum" + (warn ? " warn" : "")}>
            {count.format(u.serviceMessages)} de {count.format(u.freeServiceMessages)} gratis
          </span>
        </div>
        <div
          className={"wa-meta-bar" + (warn ? " warn" : "")}
          role="progressbar"
          aria-label="Respuestas gratis usadas"
          aria-valuemin={0}
          aria-valuemax={u.freeServiceMessages}
          aria-valuenow={used}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className={"wa-meta-note" + (warn ? " warn" : "")}>{statusText(u)}</span>
      </div>

      <dl className="wa-meta-facts">
        <div>
          <dt>Respuestas cobradas</dt>
          <dd className="tnum">
            {count.format(u.chargedServiceMessages)} × {usd.format(u.rates.serviceUsd)}
          </dd>
        </div>
        <div>
          <dt>Recordatorios y seguimientos</dt>
          <dd className="tnum">
            {count.format(u.utilityTemplates)} × {usd.format(u.rates.utilityUsd)}
          </dd>
        </div>
        <div>
          <dt>Campañas y promociones</dt>
          <dd className="tnum">
            {count.format(u.marketingTemplates)} × {usd.format(u.rates.marketingUsd)}
          </dd>
        </div>
        <div className="wa-meta-total">
          <dt>Estimado del mes</dt>
          <dd className="tnum">{usd.format(u.estimatedUsd)}</dd>
        </div>
      </dl>
      <p className="muted wa-meta-footnote">
        Estimación con las tarifas de Meta para Costa Rica. Los recordatorios y las campañas se cobran desde el primero. La cifra que
        vale es la de tu cuenta de Meta.
      </p>
    </div>
  );
}
