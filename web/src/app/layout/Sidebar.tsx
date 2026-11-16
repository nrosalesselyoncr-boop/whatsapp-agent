import { formatInt } from "../../modules/whatsapp/format";
import { useWhatsappSummary } from "../../modules/whatsapp/whatsappApi";
import { useActiveLocation } from "../location";
import type { NavItem, SectionId } from "../navigation";
import BusinessSwitcher from "./BusinessSwitcher";
import NavList from "./NavList";
import UserMenu from "./UserMenu";

/**
 * Contador de conversaciones abiertas al lado de "WhatsApp IA" (`GET /whatsapp/summary`, el
 * mismo resumen de la tarjeta del Inicio; se refresca solo cada minuto). Sin abiertas, nada.
 * Solo se monta si la sección está abierta para la sesión (NavList no pide badge de un ítem
 * con candado), así que no consulta nada en planes sin el módulo.
 */
function OpenConversationsCount() {
  const { data } = useWhatsappSummary();
  const open = data?.openConversations ?? 0;
  if (open <= 0) return null;
  return (
    <>
      <span className="nav-count" aria-hidden="true">
        {open > 99 ? "99+" : formatInt(open)}
      </span>
      <span id="nav-count-whatsapp" hidden>
        {open === 1 ? "Una conversación abierta" : `${formatInt(open)} conversaciones abiertas`}
      </span>
    </>
  );
}

const sidebarBadge = (id: SectionId) => (id === "whatsapp" ? <OpenConversationsCount /> : null);

/**
 * Menú lateral (desktop): negocio y sucursal arriba (tarjeta con borde), núcleo, grupo
 * "Módulos" aparte (etiqueta en mono) y, al pie, Configuración y el usuario (su menú abre
 * hacia arriba).
 */
export default function Sidebar({ items }: { items: NavItem[] }) {
  const main = items.filter((i) => i.section.group === "main");
  const modules = items.filter((i) => i.section.group === "modules");
  const settings = items.filter((i) => i.section.group === "settings");
  const { label } = useActiveLocation();

  return (
    <aside className="sidebar">
      <BusinessSwitcher variant="full" subtitle={label} />
      <nav className="sidebar-nav" aria-label="Principal">
        <NavList items={main} itemClassName="nav-link" iconSize={18} />
        {modules.length > 0 && (
          <>
            <p className="nav-group-label" id="nav-group-modules">
              Módulos
            </p>
            <NavList items={modules} itemClassName="nav-link" labelledBy="nav-group-modules" iconSize={18} badge={sidebarBadge} />
          </>
        )}
        {settings.length > 0 && (
          <div className="sidebar-nav-end">
            <NavList items={settings} itemClassName="nav-link" iconSize={18} />
          </div>
        )}
      </nav>
      <div className="sidebar-footer">
        <UserMenu variant="sidebar" />
      </div>
    </aside>
  );
}
