import { useCallback, useState } from "react";
import { readStorage, writeStorage } from "./storage";

// ─────────────────────────────────────────────────────────────────────────────
// Tema claro/oscuro del panel. Se aplica con `data-theme` en <html> (ver los tokens de
// global.css). El oscuro es la identidad del producto y el default: sin preferencia
// guardada el panel abre en oscuro, sin importar el sistema operativo. El claro se elige
// desde el menú de usuario y queda guardado en este navegador.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "selyon.theme";
export type Theme = "light" | "dark";

const DEFAULT_THEME: Theme = "dark";

export function getTheme(): Theme {
  const saved = readStorage(STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : DEFAULT_THEME;
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** Llamar ANTES del primer render (main.tsx) para que no parpadee el tema equivocado. */
export function initTheme(): void {
  applyTheme(getTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  writeStorage(STORAGE_KEY, next);
  applyTheme(next);
  return next;
}

/** Para los componentes que muestran el tema actual (p. ej. el ítem del menú de usuario). */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme);
  const toggle = useCallback(() => setTheme(toggleTheme()), []);
  return { theme, toggle };
}
