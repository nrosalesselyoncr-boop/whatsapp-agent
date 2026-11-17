import { useSession } from "../session";
import BusinessSwitcher from "./BusinessSwitcher";
import LocationSelector from "./LocationSelector";
import NewMenu from "./NewMenu";
import UserMenu from "./UserMenu";

/** "Martes 17 de noviembre" en la zona horaria del negocio (zona inválida → la del equipo). */
export function todayLabel(timeZone: string | undefined, now: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
  let label: string;
  try {
    label = now.toLocaleDateString("es-CR", { ...options, timeZone });
  } catch {
    label = now.toLocaleDateString("es-CR", options);
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Encabezado. Escritorio: la fecha de hoy, con el resaltador, a la izquierda (el ancla del
 * día en todas las pantallas); sucursal y "+ Nuevo" a la derecha (el usuario vive al pie del
 * menú lateral). Móvil: la marca, la sucursal, "+ Nuevo" y el avatar.
 */
export default function Topbar() {
  const me = useSession();
  const today = todayLabel(me.business?.timezone);
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <BusinessSwitcher variant="compact" />
      </div>
      <p className="topbar-today">
        <span className="visually-hidden">Hoy es </span>
        <span className="highlight">{today}</span>
      </p>
      <LocationSelector />
      <div className="topbar-actions">
        <NewMenu />
        <UserMenu variant="compact" />
      </div>
    </header>
  );
}
