// ─────────────────────────────────────────────────────────────────────────────
// Modo mock del panel (`VITE_MOCK_API=1`, ver lib/mockApi.ts). Vive aparte de lib/api.ts
// para que el cliente de la API no lea `import.meta.env` al cargarse: así api.ts se puede
// importar fuera de Vite (los tests de test/unit corren con tsx en Node, donde
// `import.meta.env` no existe). Vite reemplaza la variable en compilación, así que en el
// build normal esto es `false` y las ramas del mock (y el mock mismo) no viajan en el bundle.
// ─────────────────────────────────────────────────────────────────────────────

export const IS_MOCK_API = import.meta.env.VITE_MOCK_API === "1";

/**
 * Demo pública en /demo (`npm run build:demo`): mock + entrada directa como la dueña de la
 * clínica ficticia + aviso de demo con «Crear mi cuenta». Implica IS_MOCK_API.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO === "1";

/** Correo de la cuenta ficticia con la que entra la demo (dueña, plan Pro). */
export const DEMO_EMAIL = "duena@demo.test";

/** Base del router: "/panel" o "/demo" (sale del `base` de Vite). */
export const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") || "/panel";

/**
 * «Reiniciar demo»: borra lo que el visitante cambió (todos los estados del mock viven en
 * sessionStorage con el prefijo `selyon.mock.`) y recarga en el Inicio de la demo.
 */
export function resetDemo(): void {
  try {
    const keys = Object.keys(window.sessionStorage).filter((k) => k.startsWith("selyon.mock."));
    for (const k of keys) window.sessionStorage.removeItem(k);
  } catch {
    // Sin sessionStorage la demo ya arranca de cero en cada carga.
  }
  window.location.assign(`${APP_BASE}/`);
}

/**
 * WhatsApp de Selyon desde la demo: el texto prellenado le dice al dueño que el contacto
 * llegó por la demo.
 */
export const DEMO_WHATSAPP_URL =
  "https://wa.me/50683658231?text=Hola%2C%20prob%C3%A9%20la%20demo%20de%20Selyon%20CRM%20y%20quiero%20usarlo%20en%20mi%20negocio";
