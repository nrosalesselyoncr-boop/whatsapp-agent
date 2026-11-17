import { useLocation } from "react-router-dom";
import { navItemsFor, type NavItem } from "../navigation";
import { useSession } from "../session";
import BusinessSwitcher from "./BusinessSwitcher";
import LocationSelector from "./LocationSelector";
import NewMenu from "./NewMenu";
import UserMenu from "./UserMenu";

/** Sección del menú que contiene la ruta actual ("/" solo en el Inicio exacto). */
function currentItem(items: NavItem[], pathname: string): NavItem | undefined {
  return items
    .filter(({ section }) => (section.path === "/" ? pathname === "/" : pathname === section.path || pathname.startsWith(section.path + "/")))
    .sort((a, b) => b.section.path.length - a.section.path.length)[0];
}

/**
 * Encabezado. Escritorio: la sección actual en mono a la izquierda; sucursal, "+ Nuevo" a la
 * derecha (el usuario vive al pie del menú lateral). Móvil: la marca, la sucursal, "+ Nuevo"
 * y el avatar.
 */
export default function Topbar() {
  const me = useSession();
  const { pathname } = useLocation();
  const crumb = currentItem(navItemsFor(me), pathname)?.label;
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <BusinessSwitcher variant="compact" />
      </div>
      {/* Repite el título de la página: decorativo para los lectores de pantalla. */}
      {crumb && (
        <span className="topbar-crumb" aria-hidden="true">
          {crumb}
        </span>
      )}
      <LocationSelector />
      <div className="topbar-actions">
        <NewMenu />
        <UserMenu variant="compact" />
      </div>
    </header>
  );
}
