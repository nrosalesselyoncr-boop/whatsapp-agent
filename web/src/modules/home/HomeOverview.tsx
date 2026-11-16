import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { capitalize, navItemsFor, terminologyOf } from "../../app/navigation";
import { useSession } from "../../app/session";
import { errorMessage } from "../../lib/api";
import { formatCents } from "../../lib/money";
import ErrorState from "../../ui/ErrorState";
import { DayBarChart } from "../reports/charts";
import { addDays } from "../scheduling/agendaLayout";
import { compactCents, formatInt } from "../reports/format";
import { useHomeOverview } from "../reports/reportsApi";
import "../reports/reports.css";
import "../sales/sales.css";

// ─────────────────────────────────────────────────────────────────────────────
// Inicio completo (plan Pro, `GET /home/overview`): cobrado hoy, clientes nuevos, citas y
// no-show de hoy, alertas (sin confirmar hoy y mañana, clientes en riesgo) e ingresos de
// los últimos 14 días. Son tres piezas que el Inicio reparte en su grilla (indicadores
// arriba; ingresos en la columna principal; alertas en la lateral) y que leen la MISMA
// consulta (react-query la pide una vez). "En riesgo" es el estado del CRM: el mismo
// número que el chip «En riesgo» de Clientes, adonde lleva.
// ─────────────────────────────────────────────────────────────────────────────

function Kpi({ label, value, hint, strong = false, children }: { label: string; value: string; hint?: string; strong?: boolean; children?: ReactNode }) {
  return (
    <div className={"card sales-kpi" + (strong ? " sales-kpi-strong card-strong" : "")}>
      <span className="sales-kpi-label">{label}</span>
      <span className="sales-kpi-value tnum">{value}</span>
      {hint && <span className="muted rp-kpi-hint">{hint}</span>}
      {children}
    </div>
  );
}

const daysAgo = (iso: string): number => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

/** Indicadores del día. Muestra la carga y el error de las tres piezas (las otras dos callan). */
export function OverviewKpis() {
  const me = useSession();
  const t = terminologyOf(me);
  const query = useHomeOverview(true);
  const money = (cents: number) => formatCents(cents, me.business.currency);

  if (query.isPending) {
    return (
      <div className="clients-loading" role="status">
        <div className="spinner" aria-hidden="true" />
        <span>Cargando los números del día…</span>
      </div>
    );
  }
  if (query.isError) {
    return <ErrorState message={errorMessage(query.error, "No pudimos cargar los números del día.")} onRetry={() => void query.refetch()} />;
  }
  const o = query.data;
  const by = o.appointmentsToday.byStatus;
  const split = [
    { n: by.confirmed ?? 0, label: "confirmadas", tone: "" },
    { n: by.pending ?? 0, label: "sin confirmar", tone: " badge-warning" },
    { n: by.completed ?? 0, label: "completadas", tone: " badge-info" },
  ].filter((s) => s.n > 0);

  return (
    <section className="ho" aria-label="Indicadores del día">
      <div className="sales-kpis ho-kpis">
        <Kpi label="Cobrado hoy" value={money(o.collectedToday.netCents)} hint={`${formatInt(o.collectedToday.count)} movimientos`} strong />
        <Kpi label={`${capitalize(t.appointments)} de hoy`} value={formatInt(o.appointmentsToday.total)}>
          {split.length > 0 && (
            <span className="ho-kpi-split">
              {split.map((s) => (
                <span key={s.label} className={"badge badge-dot tnum" + s.tone}>
                  {formatInt(s.n)} {s.label}
                </span>
              ))}
            </span>
          )}
        </Kpi>
        <Kpi label={`${capitalize(t.clients)} nuevos hoy`} value={formatInt(o.newClientsToday)} />
        <Kpi label="No asistieron hoy" value={formatInt(o.noShowsToday)} />
      </div>
    </section>
  );
}

/** Ingresos netos de los últimos 14 días (las barras suben al cargar; quietas con reduced-motion). */
export function RevenueCard() {
  const me = useSession();
  const query = useHomeOverview(true);
  if (!query.isSuccess) return null;
  const currency = me.business.currency;
  const money = (cents: number) => formatCents(cents, currency);
  const o = query.data;
  const total14 = o.revenue.reduce((n, d) => n + d.netCents, 0);
  // Recepción ve el Inicio completo pero no Reportes: el enlace solo si la sección está abierta.
  const canOpenReports = navItemsFor(me).some((i) => i.section.id === "reports" && i.access === "open");
  return (
    <section className="card rp-section ho-revenue" aria-labelledby="ho-revenue-title">
      <div className="ho-card-head">
        <h2 id="ho-revenue-title" className="card-title">
          Ingresos de los últimos 14 días
        </h2>
        {canOpenReports && (
          <Link className="link" to="/reports">
            Ver reportes
          </Link>
        )}
      </div>
      <p className="ho-total tnum">
        {money(total14)} <span className="muted">neto cobrado</span>
      </p>
      <DayBarChart
        data={o.revenue.map((d) => ({ date: d.date, values: [d.netCents] }))}
        series={[{ name: "Neto cobrado", tone: "main" }]}
        label={`Neto cobrado por día en los últimos 14 días: ${money(total14)} en total`}
        format={money}
        axisFormat={(v) => compactCents(v, currency)}
        height={190}
      />
    </section>
  );
}

/** Para atender: sin confirmar hoy y mañana, y los clientes en riesgo. */
export function AlertsCard() {
  const me = useSession();
  const t = terminologyOf(me);
  const query = useHomeOverview(true);
  if (!query.isSuccess) return null;
  const o = query.data;
  const { unconfirmed, atRisk } = o.alerts;
  return (
    <section className="card rp-section" aria-labelledby="ho-alerts-title">
      <h2 id="ho-alerts-title" className="card-title">
        Para atender
      </h2>
      <div className="ho-alerts">
        <Link className="ho-alert" to={`/agenda?date=${o.date}&view=day`}>
          <span>Sin confirmar hoy</span>
          <span className={"ho-alert-count tnum" + (unconfirmed.today === 0 ? " zero" : "")}>{formatInt(unconfirmed.today)}</span>
        </Link>
        <Link className="ho-alert" to={`/agenda?date=${addDays(o.date, 1)}&view=day`}>
          <span>Sin confirmar mañana</span>
          <span className={"ho-alert-count tnum" + (unconfirmed.tomorrow === 0 ? " zero" : "")}>{formatInt(unconfirmed.tomorrow)}</span>
        </Link>
        <Link className="ho-alert" to="/clients?status=at_risk">
          <span>{capitalize(t.clients)} en riesgo</span>
          <span className={"ho-alert-count ho-alert-risk tnum" + (atRisk.count === 0 ? " zero" : "")}>{formatInt(atRisk.count)}</span>
        </Link>
        {atRisk.items.length > 0 && (
          <ul className="ho-risk" aria-label={`${capitalize(t.clients)} que hace tiempo no vienen`}>
            {atRisk.items.map((c) => (
              <li key={c.id}>
                <Link className="link" to={`/clients/${c.id}`}>
                  {c.name}
                </Link>
                <span className="muted tnum">{c.lastVisitAt ? `hace ${formatInt(daysAgo(c.lastVisitAt))} días` : "todavía no vino"}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="muted ho-note">En riesgo: hace rato que no vuelven, según las reglas de {t.clients} del negocio.</p>
      </div>
    </section>
  );
}
