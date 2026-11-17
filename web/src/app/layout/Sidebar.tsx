import { useActiveLocation } from "../location";
import type { NavItem, SectionId } from "../navigation";
import BusinessSwitcher from "./BusinessSwitcher";
import NavList from "./NavList";
import UserMenu from "./UserMenu";
import { WhatsappCount } from "./WaitingCount";

const sidebarBadge = (id: SectionId) => (id === "whatsapp" ? <WhatsappCount /> : null);

/**
 * Menú lateral (desktop): negocio y sucursal arriba, núcleo, grupo "Módulos" aparte y, al pie, Configuración y el usuario (su menú abre
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
