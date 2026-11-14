import { capitalize, terminologyOf } from "../../app/navigation";
import { useSession } from "../../app/session";
import { isoToZoned } from "../settings/zonedTime";
import { formatLongDate, formatTime, STATUS_LABEL, todayIn } from "./format";
import type { Appointment } from "./schedulingApi";

interface Props {
  /** Días de la rejilla (semanas completas de lunes a domingo, `monthDates`). */
  days: string[];
  /** Mes que se está viendo ("AAAA-MM"): los días de otros meses van atenuados. */
  month: string;
  timeZone: string;
  appointments: Appointment[];
  staffColors: Map<string, string | null>;
  onSelect: (appointment: Appointment) => void;
  onOpenDay: (date: string) => void;
}

const WEEKDAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
/** Citas que entran en una celda; el resto queda en "+N más" (que abre el día). */
const MAX_PER_DAY = 3;

/** Hora corta para el celular: "8:00", "15:30" → "3:30" (sin "a. m." / "p. m."). */
function shortTime(iso: string, timeZone: string): string {
  const [h, m] = isoToZoned(iso, timeZone).time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}

/**
 * Vista mes: rejilla de lunes a domingo con las primeras citas de cada día. Tocar un día
 * (o "+N más") abre la vista día; tocar una cita abre su detalle. En el celular es la
 * misma rejilla, más compacta (hora corta arriba y el nombre abajo).
 */
export default function MonthView({ days, month, timeZone, appointments, staffColors, onSelect, onOpenDay }: Props) {
  const me = useSession();
  const t = terminologyOf(me);
  const today = todayIn(timeZone);
  const byDay = new Map<string, Appointment[]>(days.map((d) => [d, []]));
  for (const a of appointments) byDay.get(isoToZoned(a.startsAt, timeZone).date)?.push(a);

  return (
    <div className="month-view" role="grid" aria-label="Mes">
      <div className="month-row month-head" role="row">
        {WEEKDAYS.map((w) => (
          <div key={w} className="month-weekday" role="columnheader">
            {w}
          </div>
        ))}
      </div>
      {Array.from({ length: days.length / 7 }, (_, week) => (
        <div key={week} className="month-row" role="row">
          {days.slice(week * 7, week * 7 + 7).map((date) => {
            const list = (byDay.get(date) ?? []).sort((x, y) => x.startsAt.localeCompare(y.startsAt));
            const extra = list.length - MAX_PER_DAY;
            const label = capitalize(formatLongDate(date));
            const count = list.length === 0 ? `sin ${t.appointments}` : `${list.length} ${list.length === 1 ? t.appointment : t.appointments}`;
            const cls =
              "month-day" +
              (date.slice(0, 7) !== month ? " month-day-out" : "") +
              (date === today ? " month-day-today" : "") +
              (date < today ? " month-day-past" : "");
            return (
              <div key={date} className={cls} role="gridcell">
                <button type="button" className="month-day-link" onClick={() => onOpenDay(date)} aria-label={`Ver el día ${label}, ${count}`}>
                  <span className="month-day-num tnum">{Number(date.slice(8))}</span>
                </button>
                {list.length > 0 && (
                  <ul className="month-list">
                    {list.slice(0, MAX_PER_DAY).map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          className={`month-item status-${a.status}`}
                          style={{ ["--staff-color" as string]: staffColors.get(a.staffId) ?? a.staff?.color ?? "var(--accent)" }}
                          onClick={() => onSelect(a)}
                          title={`${formatTime(a.startsAt, timeZone)} · ${a.client?.name ?? "—"} · ${a.staff?.name ?? ""} · ${STATUS_LABEL[a.status]}`}
                        >
                          <span className="month-item-time tnum">{formatTime(a.startsAt, timeZone)}</span>
                          <span className="month-item-time-short tnum" aria-hidden="true">
                            {shortTime(a.startsAt, timeZone)}
                          </span>
                          <span className="month-item-client">{a.client?.name ?? "—"}</span>
                        </button>
                      </li>
                    ))}
                    {extra > 0 && (
                      <li>
                        <button type="button" className="month-more" onClick={() => onOpenDay(date)} aria-label={`Ver ${extra} más el ${label}`}>
                          +{extra} más
                        </button>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
