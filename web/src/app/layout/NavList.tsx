import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import Icon from "../../ui/Icons";
import type { NavItem, SectionId } from "../navigation";
import { useUpsell } from "./upsell";

interface Props {
  items: NavItem[];
  /** Clase de cada ítem (cambia entre el menú lateral, la barra inferior y la hoja "Más"). */
  itemClassName: string;
  /** Se llama al elegir un ítem (p. ej. para cerrar la hoja "Más"). */
  onNavigate?: () => void;
  labelledBy?: string;
  /** Ítem extra al final de la lista (el botón "Más" de la barra inferior). */
  trailing?: ReactNode;
  /**
   * Contador al final de un ítem abierto (p. ej. conversaciones abiertas en WhatsApp IA). Lo
   * que devuelve va dentro del enlace; el número es aria-hidden para no cambiar el nombre del
   * enlace y se anuncia como descripción (`nav-count-<sección>`, ver NavCount).
   */
  badge?: (id: SectionId) => ReactNode;
  /** Tamaño de los íconos (18 en el menú lateral; 20 en la barra inferior y la hoja "Más"). */
  iconSize?: number;
}

/** Lista de ítems del menú: enlace si está abierto, botón con candado si es del plan Pro. */
export default function NavList({ items, itemClassName, onNavigate, labelledBy, trailing, badge, iconSize = 20 }: Props) {
  const { showUpsell } = useUpsell();
  return (
    <ul className="nav-list" aria-labelledby={labelledBy}>
      {items.map(({ section, label, access }) => {
        const count = access === "open" ? badge?.(section.id) : null;
        return (
          <li key={section.id}>
            {access === "open" ? (
              <NavLink
                to={section.path}
                end={section.path === "/"}
                className={({ isActive }) => itemClassName + (isActive ? " active" : "")}
                aria-describedby={count ? `nav-count-${section.id}` : undefined}
                onClick={onNavigate}
              >
                <Icon id={section.icon} size={iconSize} />
                <span className="nav-label">{label}</span>
                {count}
              </NavLink>
            ) : (
              <button
                type="button"
                className={itemClassName + " locked"}
                aria-haspopup="dialog"
                aria-label={`${label} (disponible en el plan Pro)`}
                onClick={() => {
                  onNavigate?.();
                  showUpsell(label);
                }}
              >
                <Icon id={section.icon} size={iconSize} />
                <span className="nav-label">{label}</span>
                <span className="nav-lock">
                  <Icon id="lock" size={14} />
                </span>
              </button>
            )}
          </li>
        );
      })}
      {trailing && <li>{trailing}</li>}
    </ul>
  );
}
