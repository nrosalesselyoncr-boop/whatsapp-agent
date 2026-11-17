import assert from "node:assert/strict";
import { test } from "node:test";
import { PRODUCT_NAME as SERVER_PRODUCT_NAME } from "../../src/platform/brand";
import {
  accentFor,
  BRAND_PRESETS,
  contrastRatio,
  DEFAULT_ACCENT_DARK,
  DEFAULT_ACCENT_LIGHT,
  documentTitle,
  initials,
  mixOklab,
  PRODUCT_NAME,
  safeLogoUrl,
  SURFACE_DARK,
  SURFACE_LIGHT,
  tintFor,
} from "../../web/src/lib/branding";

// ─────────────────────────────────────────────────────────────────────────────
// Marca white-label del panel (web/src/lib/branding.ts): el acento del negocio ajustado a
// contraste AA en los dos temas, el filtro del logo (llega del negocio y va a un <img src>)
// y los textos de marca. Sin DOM (applyBranding/resetBranding tocan el documento).
// ─────────────────────────────────────────────────────────────────────────────

const AA = 4.5;

test("branding: las superficies de referencia son las de global.css (--surface de cada tema)", () => {
  assert.equal(SURFACE_LIGHT, "#ffffff");
  assert.equal(SURFACE_DARK, "#161e2e");
});

test("branding: el acento de la plataforma (pluma cobalto) pasa AA en los dos temas sin ajuste", () => {
  assert.equal(accentFor(DEFAULT_ACCENT_DARK, SURFACE_DARK, "#ffffff"), DEFAULT_ACCENT_DARK);
  assert.equal(accentFor(DEFAULT_ACCENT_LIGHT, SURFACE_LIGHT, "#000000"), DEFAULT_ACCENT_LIGHT);
  assert.ok(contrastRatio(DEFAULT_ACCENT_LIGHT, SURFACE_LIGHT) >= AA);
  assert.ok(contrastRatio(DEFAULT_ACCENT_DARK, SURFACE_DARK) >= AA);
});

test("branding: un color de marca que no llega a AA en oscuro se aclara (rosa → más claro)", () => {
  assert.ok(contrastRatio("#d6336c", SURFACE_DARK) < AA, "sin ajuste no cumple");
  const dark = accentFor("#d6336c", SURFACE_DARK, "#ffffff");
  assert.equal(dark, "#de5c89");
  assert.equal(accentFor("#d6336c", SURFACE_LIGHT, "#000000"), "#d6336c", "en claro ya cumple");
});

test("branding: contrastRatio sigue la fórmula WCAG (1 a 21, simétrica)", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff") * 100) / 100, 21);
  assert.equal(contrastRatio("#777777", "#777777"), 1);
  assert.equal(contrastRatio("#0b6b5e", "#ffffff"), contrastRatio("#ffffff", "#0b6b5e"));
  // #767676 sobre blanco es el gris AA de referencia (≈ 4,54:1).
  assert.ok(Math.abs(contrastRatio("#767676", "#ffffff") - 4.54) < 0.01);
  assert.equal(contrastRatio("#FFFFFF", "#000000"), contrastRatio("#ffffff", "#000000"), "mayúsculas valen");
  // Un color inválido no rompe: contraste mínimo.
  assert.equal(contrastRatio("rojo", "#ffffff"), 1);
  assert.equal(contrastRatio("#fff", "#000000"), 1, "solo #rrggbb");
});

/** Muestra de colores: una grilla del cubo RGB más los casos difíciles (amarillo, blanco, negro, grises). */
function sampleColors(): string[] {
  const levels = [0x00, 0x33, 0x66, 0x99, 0xcc, 0xff];
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const grid = levels.flatMap((r) => levels.flatMap((g) => levels.map((b) => `#${hex(r)}${hex(g)}${hex(b)}`)));
  return [...grid, "#ffff00", "#ff00ff", "#00ffff", "#777777", "#808080", "#16181c", "#0b6b5e", "#e91e63", "#ffeb3b", "#1a1a1a"];
}

test("branding: accentFor deja cualquier color con contraste ≥ 4,5:1 en tema claro y oscuro", () => {
  for (const color of sampleColors()) {
    const light = accentFor(color, SURFACE_LIGHT, "#000000");
    const dark = accentFor(color, SURFACE_DARK, "#ffffff");
    assert.match(light, /^#[0-9a-f]{6}$/, color);
    assert.match(dark, /^#[0-9a-f]{6}$/, color);
    assert.ok(contrastRatio(light, SURFACE_LIGHT) >= AA, `${color} → ${light} en claro: ${contrastRatio(light, SURFACE_LIGHT).toFixed(2)}`);
    assert.ok(contrastRatio(dark, SURFACE_DARK) >= AA, `${color} → ${dark} en oscuro: ${contrastRatio(dark, SURFACE_DARK).toFixed(2)}`);
  }
});

test("branding: accentFor no toca un color que ya cumple y oscurece/aclara el que no", () => {
  assert.equal(accentFor("#0b6b5e", SURFACE_LIGHT, "#000000"), "#0b6b5e", "el verde del producto ya cumple en claro");
  assert.equal(accentFor("#ffeb3b", SURFACE_DARK, "#ffffff"), "#ffeb3b", "el amarillo ya cumple en oscuro");
  // Amarillo en claro: se oscurece (cada canal baja o queda), no se reemplaza por negro.
  const yellow = accentFor("#ffeb3b", SURFACE_LIGHT, "#000000");
  assert.notEqual(yellow, "#ffeb3b");
  assert.notEqual(yellow, "#000000");
  // Un color inválido vuelve tal cual (applyBranding ya lo filtra antes).
  assert.equal(accentFor("fucsia", SURFACE_LIGHT, "#000000"), "fucsia");
});

// Espejo de [data-brand-tint] en global.css: superficie neutra y % de tinte por tema, y el
// texto que va encima (secundario y terciario de cada tema).
const TINTED = {
  dark: {
    text: ["#aeb6c6", "#8890a3"],
    surfaces: [["#0f1522", 0.25], ["#161e2e", 0.3], ["#1c2537", 0.32], ["#1a2233", 0.3], ["#131a28", 0.28]] as [string, number][],
  },
  light: {
    text: ["#4b5466", "#636b7c"],
    surfaces: [["#eef1f0", 0.18], ["#ffffff", 0.08], ["#f4f6f5", 0.18], ["#f8faf9", 0.14]] as [string, number][],
  },
} as const;

test("branding: el tinte de marca en los neutros no baja el texto secundario ni el terciario de AA", () => {
  for (const color of sampleColors()) {
    for (const theme of ["dark", "light"] as const) {
      const tint = tintFor(color, theme);
      assert.match(tint, /^#[0-9a-f]{6}$/, `${color} en ${theme}`);
      for (const [surface, pct] of TINTED[theme].surfaces) {
        const tinted = mixOklab(tint, surface, pct);
        for (const text of TINTED[theme].text) {
          const ratio = contrastRatio(text, tinted);
          assert.ok(ratio >= AA, `${color} (${theme}): ${text} sobre ${tinted} = ${ratio.toFixed(2)}`);
        }
      }
    }
  }
});

test("branding: el tinte toma el matiz de la marca, no su luminosidad ni todo su croma", () => {
  // Rojo puro y amarillo puro quedan oscuros en el tema oscuro (no se leen como un estado).
  assert.ok(contrastRatio(tintFor("#ff0000", "dark"), "#1c2537") < 1.3);
  assert.ok(contrastRatio(tintFor("#ffff00", "dark"), "#1c2537") < 1.3);
  // Y casi blancos en el claro.
  assert.ok(contrastRatio(tintFor("#1b1340", "light"), "#eef1f0") < 1.3);
  // Un gris queda gris.
  const grey = tintFor("#777777", "dark");
  assert.equal(grey.slice(1, 3), grey.slice(3, 5));
  assert.equal(tintFor("rojo", "dark"), "rojo", "un color inválido vuelve igual");
});

test("branding: los temas predeterminados (uñas, dental, tecnológico) se ven bien en los dos temas", () => {
  assert.deepEqual(BRAND_PRESETS.map((p) => p.id), ["nails", "dental", "tech"]);
  for (const p of BRAND_PRESETS) {
    assert.match(p.accentColor, /^#[0-9a-f]{6}$/, p.id);
    assert.match(p.headerColor, /^#[0-9a-f]{6}$/, p.id);
    // El acento pasa AA tal cual en oscuro (no se deforma) y apenas se oscurece en claro.
    assert.equal(accentFor(p.accentColor, SURFACE_DARK, "#ffffff"), p.accentColor, `${p.id} en oscuro`);
    assert.ok(contrastRatio(accentFor(p.accentColor, SURFACE_LIGHT, "#000000"), SURFACE_LIGHT) >= AA, `${p.id} en claro`);
    // El menú es oscuro: texto blanco con contraste de sobra.
    assert.ok(contrastRatio(p.headerColor, "#ffffff") >= 12, `${p.id}: texto del menú`);
  }
  // Cada rubro tiene a lo sumo un tema sugerido.
  const industries = BRAND_PRESETS.flatMap((p) => p.industries);
  assert.equal(new Set(industries).size, industries.length);
});

test("branding: safeLogoUrl rechaza javascript: y data: (va directo a un <img src>)", () => {
  assert.equal(safeLogoUrl("javascript:alert(1)"), null);
  assert.equal(safeLogoUrl("JavaScript:alert(1)"), null);
  assert.equal(safeLogoUrl("  javascript:alert(1)"), null);
  assert.equal(safeLogoUrl("data:image/png;base64,iVBORw0KGgo="), null);
  assert.equal(safeLogoUrl("data:image/svg+xml,<svg onload=alert(1)>"), null);
  assert.equal(safeLogoUrl("vbscript:msgbox(1)"), null);
  assert.equal(safeLogoUrl("ftp://example.com/logo.png"), null);
  assert.equal(safeLogoUrl("blob:https://example.com/abc"), null);
  assert.equal(safeLogoUrl("logo.png"), null, "relativa sin barra: ambigua, no");
  assert.equal(safeLogoUrl(""), null);
  assert.equal(safeLogoUrl(undefined), null);
});

test("branding: safeLogoUrl acepta https (y http) y rutas del mismo origen", () => {
  assert.equal(safeLogoUrl("https://cdn.example.com/logo.png"), "https://cdn.example.com/logo.png");
  assert.equal(safeLogoUrl("https://cdn.example.com/a b.png"), "https://cdn.example.com/a%20b.png", "normalizada");
  assert.equal(safeLogoUrl("http://example.com/logo.png"), "http://example.com/logo.png");
  assert.equal(safeLogoUrl("/uploads/logo.png"), "/uploads/logo.png");
  assert.equal(safeLogoUrl("/panel/icons/icon-192.png?v=2"), "/panel/icons/icon-192.png?v=2");
});

test("branding: safeLogoUrl no deja pasar una ruta que el navegador lee como otro host", () => {
  // Empiezan con "/" pero el navegador las resuelve a https://evil.example/…
  assert.equal(safeLogoUrl("//evil.example/logo.png"), null);
  assert.equal(safeLogoUrl("/\\evil.example/logo.png"), null);
  assert.equal(safeLogoUrl("/\t/evil.example/logo.png"), null);
  assert.equal(safeLogoUrl("/\n/evil.example/logo.png"), null);
});

test("branding: iniciales del chip de marca y título del documento", () => {
  assert.equal(initials("Clínica Dental Sonrisa"), "CD");
  assert.equal(initials("  estética   luna "), "EL");
  assert.equal(initials("Selyon"), "SE");
  assert.equal(initials("A"), "A");
  assert.equal(initials(""), "?");
  assert.equal(initials("   "), "?");
  assert.equal(documentTitle("Agenda"), `Agenda · ${PRODUCT_NAME}`);
  assert.equal(documentTitle(), PRODUCT_NAME);
  assert.equal(documentTitle(""), PRODUCT_NAME);
});

test("branding: el nombre del producto del panel es espejo del backend", () => {
  assert.equal(PRODUCT_NAME, SERVER_PRODUCT_NAME);
});
