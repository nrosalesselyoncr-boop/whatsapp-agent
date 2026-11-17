import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ALL_LOCATIONS, useActiveLocation } from "../../app/location";
import { capitalize, getSection, terminologyOf } from "../../app/navigation";
import { useSession } from "../../app/session";
import { errorMessage } from "../../lib/api";
import { readStorage, writeStorage } from "../../lib/storage";
import EmptyState from "../../ui/EmptyState";
import ErrorState from "../../ui/ErrorState";
import Icon from "../../ui/Icons";
import PageHeader from "../../ui/PageHeader";
import { isoToZoned } from "../settings/zonedTime";
import { addDays, addMonths, monthDates, weekDates } from "./agendaLayout";
import AppointmentDrawer from "./AppointmentDrawer";
import DayView from "./DayView";
import { dayRange, formatLongDate, formatMonth, formatShortDate, todayIn } from "./format";
import MonthView from "./MonthView";
import NewAppointmentDialog, { type NewAppointmentDefaults } from "./NewAppointmentDialog";
import { useAgendaSetup, useAppointments, type Appointment } from "./schedulingApi";
import WeekView from "./WeekView";
import "./agenda.css";

type View = "month" | "week" | "day";
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VIEW_KEY = "selyon.agenda.view";
const isView = (v: string | null): v is View => v === "month" || v === "week" || v === "day";

/**
 * Vista sin `view` en la URL: la última que se usó en este navegador; la primera vez, mes en
 * pantallas grandes y DÍA en el celular (la agenda de papel abierta en la página de hoy: en
 * el mes de 375 px los nombres no entran).
 */
function defaultView(): View {
  const saved = readStorage(VIEW_KEY);
  if (isView(saved)) return saved;
  return typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches ? "day" : "month";
}

/**
 * Agenda (/agenda): mes, semana y día con carriles por profesional, de la sucursal activa
 * (con "Todas" se elige una acá). URL enlazable:
 * `?date=AAAA-MM-DD&view=month|week|day&appointment=<id>` (sin `view`: ver defaultView);
 * `?new=1` abre "Nueva cita" (lo usa "+ Nuevo → Cita"). El profesional ve solo su carril.
 */
export default function AgendaPage() {
  const me = useSession();
  const t = terminologyOf(me);
  const section = getSection("agenda");
  const isStaff = me.role === "staff";
  const { selected } = useActiveLocation();
  const [params, setParams] = useSearchParams();
  const setup = useAgendaSetup();

  const locations = (setup.locations.data ?? []).filter((l) => l.active);
  const pinned = selected !== ALL_LOCATIONS ? selected : null;
  const location = locations.find((l) => l.id === (pinned ?? params.get("loc"))) ?? locations[0] ?? null;
  const tz = location?.timezone ?? me.business.timezone;
  const rawView = params.get("view");
  const [fallbackView] = useState(defaultView);
  const view: View = isView(rawView) ? rawView : fallbackView;
  useEffect(() => writeStorage(VIEW_KEY, view), [view]);
  const rawDate = params.get("date");
  const date = rawDate && RE_DATE.test(rawDate) ? rawDate : todayIn(tz);
  const days = view === "month" ? monthDates(date) : view === "week" ? weekDates(date) : [date];
  const range = useMemo(() => dayRange(days[0], tz, days.length), [days[0], tz, days.length]);

  const appointmentsQuery = useAppointments(range.from, range.to, isStaff ? (me.staffId ?? null) : null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [newDefaults, setNewDefaults] = useState<NewAppointmentDefaults | null>(null);
  const openId = params.get("appointment");

  function update(changes: Record<string, string | null>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v === null) next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );
  }

  // "+ Nuevo → Cita" llega con ?new=1: se abre el diálogo y se limpia la URL.
  useEffect(() => {
    if (params.get("new") === "1" && location) {
      setNewDefaults({ locationId: location.id, date });
      update({ new: null });
    }
  }, [params, location?.id]);

  const staffList = setup.staff.data ?? [];
  const lanes = useMemo(() => {
    if (!location) return [];
    const inView = new Set((appointmentsQuery.data ?? []).filter((a) => a.locationId === location.id).map((a) => a.staffId));
    return staffList.filter((s) => {
      if (isStaff) return s.id === me.staffId;
      return (s.active && s.hours.some((h) => h.locationId === location.id)) || inView.has(s.id);
    });
  }, [staffList, location, appointmentsQuery.data, isStaff, me.staffId]);

  const visible = (appointmentsQuery.data ?? []).filter(
    (a) =>
      a.locationId === location?.id &&
      lanes.some((l) => l.id === a.staffId) &&
      (showCancelled || a.status !== "cancelled"),
  );
  const staffColors = new Map(staffList.map((s) => [s.id, s.color]));

  function openNew(extra: Partial<NewAppointmentDefaults> = {}) {
    if (!location) return;
    setNewDefaults({ locationId: location.id, date, ...extra });
  }

  function onCreated(a: Appointment) {
    const d = isoToZoned(a.startsAt, a.location?.timezone ?? tz).date;
    update({ date: d });
  }

  const title = section.label(t, me.role);
  const canCreate = !isStaff || Boolean(me.staffId);
  const header = (
    <PageHeader
      title={title}
      // Con «Todas» arriba, la agenda igual muestra UNA sucursal: el subtítulo lo dice para que
      // no parezca que el selector de arriba y el de acá se contradicen.
      subtitle={location ? (pinned || locations.length < 2 ? `${capitalize(t.location)}: ${location.name}` : `${capitalize(t.location)}: ${location.name}. La agenda muestra una ${t.location} a la vez; elegila acá.`) : undefined}
    >
      {canCreate && location && (
        <button type="button" className="btn btn-primary" onClick={() => openNew()}>
          <Icon id="plus" size={18} strokeWidth={2.2} />
          Nueva {t.appointment}
        </button>
      )}
    </PageHeader>
  );

  if (setup.locations.isPending || setup.staff.isPending || setup.catalog.isPending) {
    return (
      <div className="page page-wide">
        {header}
        <div className="clients-loading" role="status">
          <div className="spinner" aria-hidden="true" />
          <span>Cargando la agenda…</span>
        </div>
      </div>
    );
  }
  if (setup.locations.isError || setup.staff.isError || setup.catalog.isError) {
    return (
      <div className="page page-wide">
        {header}
        <ErrorState
          message="No pudimos cargar la agenda."
          onRetry={() => {
            void setup.locations.refetch();
            void setup.staff.refetch();
            void setup.catalog.refetch();
          }}
        />
      </div>
    );
  }
  if (!location) {
    return (
      <div className="page page-wide">
        {header}
        <EmptyState icon="mapPin" title={`No hay ${t.locations} activas`} help={`Activá una ${t.location} en Configuración para usar la agenda.`} />
      </div>
    );
  }
  if (isStaff && !me.staffId) {
    return (
      <div className="page page-wide">
        {header}
        <EmptyState
          icon="calendar"
          title={`Tu usuario no está vinculado a un ${t.staffMember}`}
          help={`Pedile a quien administra el negocio que te vincule en Configuración › Equipo para ver tus ${t.appointments}.`}
        />
      </div>
    );
  }

  const label =
    view === "month"
      ? capitalize(formatMonth(date))
      : view === "week"
        ? `${formatShortDate(days[0])} – ${formatShortDate(days[6])}`
        : capitalize(formatLongDate(date));
  const today = todayIn(tz);
  const move = (n: number) => (view === "month" ? addMonths(date, n) : addDays(date, view === "week" ? 7 * n : n));
  const unit = view === "month" ? "Mes" : view === "week" ? "Semana" : "Día";
  const isCurrent = view === "month" ? date.slice(0, 7) === today.slice(0, 7) : view === "week" ? days.includes(today) : date === today;

  return (
    <div className="page page-wide">
      {header}
      <div className="agenda-toolbar">
        <div className="agenda-nav" role="group" aria-label="Fecha">
          <button type="button" className="icon-btn agenda-nav-btn" onClick={() => update({ date: move(-1) })} aria-label={`${unit} anterior`}>
            <Icon id="chevronLeft" size={18} />
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => update({ date: null })} disabled={isCurrent}>
            Hoy
          </button>
          <button type="button" className="icon-btn agenda-nav-btn agenda-next" onClick={() => update({ date: move(1) })} aria-label={`${unit} siguiente`}>
            <Icon id="chevronLeft" size={18} />
          </button>
          <h2 className="agenda-date" aria-live="polite">
            {label}
          </h2>
          <label className="agenda-jump">
            <span className="visually-hidden">Ir a la fecha</span>
            <input type="date" className="input" value={date} onChange={(e) => e.target.value && update({ date: e.target.value })} />
          </label>
        </div>
        <div className="agenda-options">
          {!pinned && locations.length > 1 && (
            <label className="agenda-location">
              <span className="field-label">{capitalize(t.location)} de la agenda</span>
              <select className="input select" value={location.id} onChange={(e) => update({ loc: e.target.value })}>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="segmented" role="group" aria-label="Vista">
            <button type="button" aria-pressed={view === "month"} onClick={() => update({ view: "month" })}>
              Mes
            </button>
            <button type="button" aria-pressed={view === "week"} onClick={() => update({ view: "week" })}>
              Semana
            </button>
            <button type="button" aria-pressed={view === "day"} onClick={() => update({ view: "day" })}>
              Día
            </button>
          </div>
          <label className="check-inline">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
            Ver canceladas
          </label>
        </div>
      </div>

      {appointmentsQuery.isError ? (
        <ErrorState message={errorMessage(appointmentsQuery.error, `No pudimos cargar las ${t.appointments}.`)} onRetry={() => void appointmentsQuery.refetch()} />
      ) : (
        <div className={appointmentsQuery.isFetching && appointmentsQuery.isPlaceholderData ? "agenda-body agenda-loading" : "agenda-body"} aria-busy={appointmentsQuery.isPending}>
          {view === "month" ? (
            <MonthView
              days={days}
              month={date.slice(0, 7)}
              timeZone={tz}
              appointments={visible}
              staffColors={staffColors}
              onSelect={(a) => update({ appointment: a.id })}
              onOpenDay={(d) => update({ date: d, view: "day" })}
            />
          ) : view === "day" ? (
            <DayView
              date={date}
              location={location}
              lanes={lanes}
              appointments={visible}
              onSelect={(a) => update({ appointment: a.id })}
              onCreateAt={canCreate ? (staffId, startsAt) => openNew({ staffId, startsAt, date }) : null}
            />
          ) : (
            <WeekView
              days={days}
              timeZone={tz}
              appointments={visible}
              staffColors={staffColors}
              onSelect={(a) => update({ appointment: a.id })}
              onOpenDay={(d) => update({ date: d, view: "day" })}
            />
          )}
        </div>
      )}

      <AppointmentDrawer
        appointmentId={openId}
        onClose={() => update({ appointment: null })}
        staff={staffList}
        onMoved={(a) => update({ date: isoToZoned(a.startsAt, a.location?.timezone ?? tz).date })}
      />
      <NewAppointmentDialog
        open={newDefaults !== null}
        onClose={() => setNewDefaults(null)}
        defaults={newDefaults ?? {}}
        locations={setup.locations.data ?? []}
        staff={staffList}
        services={setup.catalog.data?.services ?? []}
        onCreated={onCreated}
      />
    </div>
  );
}
