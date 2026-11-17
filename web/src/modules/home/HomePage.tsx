import { Link } from "react-router-dom";
import { ALL_LOCATIONS, useActiveLocation } from "../../app/location";
import { capitalize, terminologyOf } from "../../app/navigation";
import { useSession } from "../../app/session";
import { errorMessage } from "../../lib/api";
import type { Terminology } from "../../lib/contract";
import ErrorState from "../../ui/ErrorState";
import Icon from "../../ui/Icons";
import PageHeader from "../../ui/PageHeader";
import { useToast } from "../../ui/Toast";
import { isoToZoned } from "../settings/zonedTime";
import { formatLongDate, formatTime, formatWhen, STATUS_LABEL } from "../scheduling/format";
import { schedulingApi, useAppointmentStore, useHomeToday, type Appointment, type AppointmentStatus } from "../scheduling/schedulingApi";
import WaitingCard from "../whatsapp/WaitingCard";
import { AlertsCard, OverviewKpis, RevenueCard } from "./HomeOverview";
import OnboardingChecklist from "./OnboardingChecklist";
import "../scheduling/agenda.css";
import "./home.css";

const STATUS_ORDER: AppointmentStatus[] = ["pending", "confirmed", "completed", "no_show", "cancelled"];

/** Enlace a una cita en la agenda (abre su detalle en el día que corresponde). */
function agendaLink(a: Appointment, timeZone: string): string {
  const date = isoToZoned(a.startsAt, a.location?.timezone ?? timeZone).date;
  return `/agenda?date=${date}&appointment=${a.id}`;
}

/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora del negocio. */
function greeting(timeZone: string): string {
  let hour = new Date().getHours();
  try {
    hour = Number(new Intl.DateTimeFormat("es-CR", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()));
  } catch {
    // Zona inválida: la hora del navegador.
  }
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

/** Nombre de pila para el saludo ("Dra. María Vargas" → "María"); los títulos con punto se saltan. */
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/).find((w) => w && !w.endsWith(".")) ?? "";
}

/**
 * Inicio (/): el día de la sucursal activa (o de todas). Básico: citas de hoy por estado,
 * próximas, sin confirmar de hoy y mañana, no-show de hoy y lo que agendó el agente esta
 * semana (si el plan trae WhatsApp IA). Pro (módulo Reportes): arriba, el Inicio completo
 * (cobrado hoy, clientes nuevos, alertas, ingresos de 14 días; ver ./HomeOverview.tsx).
 * Escritorio: indicadores arriba y dos columnas (lo del día a la izquierda; agente,
 * pendientes y alertas a la derecha); en el celular, una sola columna en ese orden.
 */
export default function HomePage() {
  const me = useSession();
  const t = terminologyOf(me);
  const { selected, label } = useActiveLocation();
  const query = useHomeToday();
  const hasWhatsapp = me.modules.includes("whatsapp");
  const hasOverview = me.modules.includes("reports");
  const subtitle = selected === ALL_LOCATIONS ? label : `${capitalize(t.location)}: ${label}`;

  if (query.isPending) {
    return (
      <div className="page">
        <PageHeader title="Inicio" subtitle={subtitle} />
        <div className="clients-loading" role="status">
          <div className="spinner" aria-hidden="true" />
          <span>Cargando tu día…</span>
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="page">
        <PageHeader title="Inicio" subtitle={subtitle} />
        <ErrorState message={errorMessage(query.error, "No pudimos cargar el resumen del día.")} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const home = query.data;
  const tz = home.timezone;
  const name = firstName(me.user.name);
  // La fecha ya está resaltada en la barra superior (escritorio); en el celular la barra no
  // la muestra, así que solo ahí va en el subtítulo.
  const daySubtitle = (
    <>
      {greeting(tz)}
      {name ? `, ${name}` : ""}
      <span className="home-subtitle-date"> · {capitalize(formatLongDate(home.date))}</span> · {subtitle}
    </>
  );

  const todayCard = (
    <section className="card home-card home-today" aria-labelledby="home-today-title">
      <h2 id="home-today-title" className="card-title">
        {capitalize(t.appointments)} de hoy
      </h2>
      <p className="home-big tnum">{home.today.total}</p>
      <ul className="home-status-list">
        {STATUS_ORDER.map((s) => (
          <li key={s}>
            <span className={`status-badge status-${s}`}>{STATUS_LABEL[s]}</span>
            <span className="tnum">{home.today.byStatus[s] ?? 0}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  const aiBookingsCard = hasWhatsapp && (
    <section className="card home-card" aria-labelledby="home-ai-title">
      <h2 id="home-ai-title" className="card-title">
        Agendadas por el agente esta semana
      </h2>
      <p className="home-big home-big-accent tnum">{home.aiBookings.count}</p>
      {home.aiBookings.recent.length > 0 ? (
        <ul className="home-list">
          {home.aiBookings.recent.map((a) => (
            <li key={a.id}>
              <Link className="home-item home-item-simple" to={agendaLink(a, tz)}>
                <span className="home-item-main">{a.client?.name ?? "—"}</span>
                <span className="muted">{formatWhen(a.startsAt, a.location?.timezone ?? tz)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Cuando el agente de WhatsApp agende, lo vas a ver acá.</p>
      )}
    </section>
  );

  return (
    <div className="page">
      <PageHeader title="Inicio" subtitle={daySubtitle}>
        <Link className="btn btn-secondary" to="/agenda">
          <Icon id="calendar" size={18} />
          Ver agenda
        </Link>
      </PageHeader>

      <OnboardingChecklist />

      {hasOverview && <OverviewKpis />}

      <div className="home-layout">
        <div className="home-col">
          {hasOverview && <RevenueCard />}
          <AppointmentCard
            id="home-upcoming"
            className="home-upcoming"
            title={`Próximas ${t.appointments}`}
            empty={`No hay más ${t.appointments} en los próximos días.`}
            items={home.upcoming}
            timeZone={tz}
            t={t}
            showStatus
          />
          {todayCard}
        </div>
        <div className="home-col">
          {hasWhatsapp && <WaitingCard />}
          {hasOverview && <AlertsCard />}
          <AppointmentCard
            id="home-unconfirmed"
            title="Sin confirmar (hoy y mañana)"
            empty={`Todas las ${t.appointments} de hoy y mañana están confirmadas.`}
            items={home.unconfirmed}
            timeZone={tz}
            t={t}
            confirmable
          />
          <AppointmentCard id="home-noshow" title="No asistieron hoy" empty="Nadie faltó hoy." items={home.noShowsToday} timeZone={tz} t={t} />
          {aiBookingsCard}
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({
  id,
  title,
  empty,
  items,
  timeZone,
  t,
  confirmable = false,
  showStatus = false,
  className = "",
}: {
  id: string;
  /** Clase extra de la sección (orden en el celular, ver home.css). */
  className?: string;
  title: string;
  empty: string;
  items: Appointment[];
  timeZone: string;
  t: Terminology;
  confirmable?: boolean;
  /** Fila ancha con el estado de la cita (la lista principal del Inicio). */
  showStatus?: boolean;
}) {
  const store = useAppointmentStore();
  const { showToast } = useToast();
  return (
    <section className={"card home-card " + className} aria-labelledby={`${id}-title`}>
      <div className="home-card-head">
        <h2 id={`${id}-title`} className="card-title">
          {title}
        </h2>
        {items.length > 0 && <span className="home-count tnum">{items.length}</span>}
      </div>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="home-list">
          {items.map((a) => {
            const tz = a.location?.timezone ?? timeZone;
            return (
              <li key={a.id} className="home-row">
                <Link className={"home-item" + (showStatus ? " home-item-wide" : "")} to={agendaLink(a, timeZone)}>
                  <span className="home-item-time tnum">{formatTime(a.startsAt, tz)}</span>
                  <span className="home-item-main">
                    {a.client?.name ?? capitalize(t.client)}
                    <span className="muted"> · {a.services.map((l) => l.name).join(" + ")}</span>
                  </span>
                  <span className="muted home-item-meta">
                    <span className="staff-dot" style={{ background: a.staff?.color ?? "var(--accent)" }} aria-hidden="true" />
                    {a.staff?.name ?? ""} · {formatWhen(a.startsAt, tz).split(",")[0]}
                  </span>
                  {showStatus && <span className={`status-badge status-${a.status} home-item-status`}>{STATUS_LABEL[a.status]}</span>}
                </Link>
                {confirmable && a.status === "pending" && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    aria-label={`Confirmar la ${t.appointment} de ${a.client?.name ?? t.client}`}
                    onClick={() =>
                      void schedulingApi.confirm(a.id).then(
                        (updated) => {
                          store(updated);
                          showToast(`${capitalize(t.appointment)} confirmada.`);
                        },
                        (error: unknown) => showToast(errorMessage(error)),
                      )
                    }
                  >
                    Confirmar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
