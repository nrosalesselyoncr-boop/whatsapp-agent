// ─────────────────────────────────────────────────────────────────────────────
// Marca: la del producto (nombre en un solo lugar, PLAN-GESTION.md §8) y la del negocio
// (white-label). El color principal reemplaza el acento (--accent en global.css: enlaces,
// foco, selección, gráficos) y, cuando el negocio lo eligió, también pinta los botones
// principales y el ítem activo del menú. Además, el color del menú (o el principal, si
// no hay) tiñe apenas los neutros —fondo, superficies, bordes, barra superior— para que la
// marca se sienta en todo el panel; el texto y los estados no cambian. El acento se
// ajusta a contraste AA (≥ 4.5:1) contra la superficie de cada tema: se oscurece en claro
// y se aclara en oscuro. El color del menú pinta el menú lateral (y la barra de abajo en
// el celular), con el texto en blanco o tinta según contraste. Cada color elegido marca
// <html> (`data-brand-accent` / `data-brand-header`) para que global.css active esas
// reglas solo con marca propia: sin marca configurada el panel queda con su paleta default.
// A diferencia del tema (lib/theme.ts), depende de datos del backend
// (`me.business.branding`), así que se aplica desde un efecto del layout autenticado y se
// limpia al salir.
// ─────────────────────────────────────────────────────────────────────────────

/** Nombre visible del producto (provisional). Espejo de src/platform/brand.ts. */
export const PRODUCT_NAME = "Selyon CRM";

/** Marca del negocio: colores `#rrggbb` y logo por URL (ver `Branding` del backend). */
export interface Branding {
  accentColor?: string;
  headerColor?: string;
  logoUrl?: string;
}

const RE_HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** Superficies de las tarjetas en claro y oscuro (espejo de --surface en global.css). */
export const SURFACE_LIGHT = "#ffffff";
export const SURFACE_DARK = "#14161a";
const INK_LIGHT = "#16181d";
const INK_DARK = "#0a0b0d";
/**
 * Acento de la plataforma (sin marca propia): menta en oscuro y su versión oscurecida en
 * claro (espejo de los defaults de --accent en global.css). Ambos pasan AA sin ajuste.
 */
export const DEFAULT_ACCENT_DARK = "#4fd1b3";
export const DEFAULT_ACCENT_LIGHT = "#2e7968";
/** Contraste mínimo del acento contra la superficie (WCAG AA, texto normal). */
const MIN_CONTRAST = 4.5;

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb | null {
  const m = RE_HEX.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function toHex([r, g, b]: Rgb): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Luminancia relativa (WCAG 2.x). */
function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contraste WCAG entre dos colores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const ra = toRgb(a);
  const rb = toRgb(b);
  if (!ra || !rb) return 1;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * `hex` mezclado de a poco hacia `toward` (negro u blanco) hasta llegar al contraste mínimo
 * contra `surface`. Si ya cumple, vuelve igual.
 */
export function accentFor(hex: string, surface: string, toward: "#000000" | "#ffffff"): string {
  const base = toRgb(hex);
  const target = toRgb(toward);
  if (!base || !target) return hex;
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const mixed = toHex([0, 1, 2].map((i) => base[i] + (target[i] - base[i]) * t) as Rgb);
    if (contrastRatio(mixed, surface) >= MIN_CONTRAST) return mixed;
  }
  return toward;
}

// ── Tinte de marca para los neutros (fondo, superficies, bordes, barra superior) ──
// La marca se siente en todo el panel tiñendo los grises en dosis bajas (ver global.css,
// [data-brand-tint]). Para no perder contraste, el tinte toma solo el MATIZ de la marca:
// en OKLCH se fija la luminosidad a la de las superficies de cada tema y se limita el
// croma (un rojo o amarillo muy saturado no tiñe como si fuera un estado).

type Lab = [number, number, number];

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
};

/** sRGB → OKLab (Björn Ottosson). */
function rgbToOklab([r8, g8, b8]: Rgb): Lab {
  const [r, g, b] = [toLinear(r8), toLinear(g8), toLinear(b8)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab → sRGB (recortado al gamut). */
function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Croma máximo del tinte (OKLCH). */
const TINT_MAX_CHROMA = 0.12;
/** Luminosidad OKLab del tinte por tema: apenas bajo --surface-sunken (oscuro) y la de --bg (claro). */
export const TINT_LIGHTNESS = { dark: 0.2, light: 0.985 } as const;

/** Tinte de `hex` para un tema: su matiz con luminosidad fija y croma limitado. */
export function tintFor(hex: string, theme: keyof typeof TINT_LIGHTNESS): string {
  const rgb = toRgb(hex);
  if (!rgb) return hex;
  const [, a, b] = rgbToOklab(rgb);
  const chroma = Math.hypot(a, b);
  const k = chroma > TINT_MAX_CHROMA ? TINT_MAX_CHROMA / chroma : 1;
  return toHex(oklabToRgb([TINT_LIGHTNESS[theme], a * k, b * k]));
}

/** `color-mix(in oklab, a p, b)` (p de 0 a 1), para verificar el contraste en los tests. */
export function mixOklab(a: string, b: string, p: number): string {
  const ra = toRgb(a);
  const rb = toRgb(b);
  if (!ra || !rb) return b;
  const la = rgbToOklab(ra);
  const lb = rgbToOklab(rb);
  return toHex(oklabToRgb([0, 1, 2].map((i) => la[i] * p + lb[i] * (1 - p)) as Lab));
}

/** Texto sobre `hex`: blanco o tinta, el que más contraste. */
function textOn(hex: string, ink: string): string {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, ink) ? "#ffffff" : ink;
}

const BRAND_PROPERTIES = [
  "--brand-accent-light",
  "--brand-on-accent-light",
  "--brand-accent-dark",
  "--brand-on-accent-dark",
  "--brand-header-bg",
  "--brand-header-fg",
  "--brand-tint-dark",
  "--brand-tint-light",
];

/** Marcas en <html> que activan en global.css las reglas de marca propia. */
const BRAND_FLAGS = ["brandAccent", "brandHeader", "brandTint"] as const;

/** Pinta el panel con la marca del negocio. Cada color ausente o inválido deja su default. */
export function applyBranding(branding: Branding | null | undefined): void {
  resetBranding();
  const html = document.documentElement;
  const root = html.style;
  if (branding?.accentColor && RE_HEX.test(branding.accentColor)) {
    html.dataset.brandAccent = "";
    const light = accentFor(branding.accentColor, SURFACE_LIGHT, "#000000");
    const dark = accentFor(branding.accentColor, SURFACE_DARK, "#ffffff");
    root.setProperty("--brand-accent-light", light);
    root.setProperty("--brand-on-accent-light", textOn(light, INK_LIGHT));
    root.setProperty("--brand-accent-dark", dark);
    root.setProperty("--brand-on-accent-dark", textOn(dark, INK_DARK));
  }
  if (branding?.headerColor && RE_HEX.test(branding.headerColor)) {
    html.dataset.brandHeader = "";
    root.setProperty("--brand-header-bg", branding.headerColor);
    root.setProperty("--brand-header-fg", textOn(branding.headerColor, INK_LIGHT));
  }
  // Tinte de los neutros: del color del menú (la identidad) o, si no hay, del principal.
  const tintSource = [branding?.headerColor, branding?.accentColor].find((c) => c && RE_HEX.test(c));
  if (tintSource) {
    html.dataset.brandTint = "";
    root.setProperty("--brand-tint-dark", tintFor(tintSource, "dark"));
    root.setProperty("--brand-tint-light", tintFor(tintSource, "light"));
  }
}

/** Vuelve a la paleta default (logout, cambio de negocio). */
export function resetBranding(): void {
  const html = document.documentElement;
  for (const property of BRAND_PROPERTIES) html.style.removeProperty(property);
  for (const flag of BRAND_FLAGS) delete html.dataset[flag];
}

/** Origen ficticio para resolver una ruta relativa y ver si se queda en el mismo origen. */
const SAME_ORIGIN_PROBE = "https://same-origin.invalid";

/** Logo utilizable: solo http(s) o una ruta del mismo origen (nunca `javascript:` ni data). */
export function safeLogoUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) {
    // Ruta del mismo origen. Se resuelve como la resolvería el navegador: "//host",
    // "/\host" o "/<tab>/host" apuntan a OTRO host aunque empiecen con una sola "/".
    try {
      return new URL(url, SAME_ORIGIN_PROBE).origin === SAME_ORIGIN_PROBE ? url : null;
    } catch {
      return null;
    }
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Iniciales para el chip de marca cuando no hay logo ("Clínica Dental Sonrisa" → "CD"). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
  return letters.toUpperCase();
}

/** Título del documento: "Agenda · Selyon CRM" (o solo el producto). */
export function documentTitle(page?: string): string {
  return page ? `${page} · ${PRODUCT_NAME}` : PRODUCT_NAME;
}
