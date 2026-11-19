import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { brotliDecompressSync } from "node:zlib";

// ─────────────────────────────────────────────────────────────────────────────
// Fuentes del panel (A12): Atkinson Hyperlegible no trae el colón (₡, U+20A1) en ningún
// subset; sin un @font-face que lo cubra, el ₡ de TODOS los montos cae a la fuente del
// sistema. Se verifica que global.css mande U+20A1 a un archivo que existe y que ese
// archivo trae el glifo (se lee el cmap del WOFF2, sin dependencias).
// ─────────────────────────────────────────────────────────────────────────────

const FONTS_DIR = new URL("../../src/platform/http/fonts/", import.meta.url);
const GLOBAL_CSS = new URL("../../web/src/global.css", import.meta.url);
const COLON = 0x20a1;

const KNOWN_TAGS = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill"];

/** Tabla `cmap` de un WOFF2 (formato del W3C: directorio + un único stream Brotli). */
function woff2Cmap(buf: Buffer): Buffer {
  assert.equal(buf.toString("latin1", 0, 4), "wOF2", "no es WOFF2");
  const numTables = buf.readUInt16BE(12);
  let p = 48;
  const readBase128 = () => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = buf[p++];
      value = value * 128 + (byte & 0x7f);
      if ((byte & 0x80) === 0) return value;
    }
    throw new Error("UIntBase128 inválido");
  };
  const tables: { tag: string; length: number }[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++];
    const tagIndex = flags & 0x3f;
    const tag = tagIndex === 63 ? buf.toString("latin1", p, (p += 4)) : KNOWN_TAGS[tagIndex];
    const version = flags >> 6;
    const origLength = readBase128();
    // glyf/loca con versión 0 y hmtx con versión 1 vienen transformadas (traen su largo).
    const transformed = tag === "glyf" || tag === "loca" ? version === 0 : tag === "hmtx" ? version === 1 : false;
    const length = transformed ? readBase128() : origLength;
    tables.push({ tag, length });
  }
  const totalCompressed = buf.readUInt32BE(20);
  const data = brotliDecompressSync(buf.subarray(p, p + totalCompressed));
  let offset = 0;
  for (const t of tables) {
    if (t.tag === "cmap") return data.subarray(offset, offset + t.length);
    offset += t.length;
  }
  throw new Error("sin tabla cmap");
}

/** ¿El cmap (formato 4 o 12, Unicode) tiene un glifo para `code`? */
function hasGlyph(cmap: Buffer, code: number): boolean {
  const n = cmap.readUInt16BE(2);
  for (let i = 0; i < n; i++) {
    const platform = cmap.readUInt16BE(4 + i * 8);
    const encoding = cmap.readUInt16BE(6 + i * 8);
    const sub = cmap.readUInt32BE(8 + i * 8);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;
    const format = cmap.readUInt16BE(sub);
    if (format === 12) {
      const groups = cmap.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const at = sub + 16 + g * 12;
        if (code >= cmap.readUInt32BE(at) && code <= cmap.readUInt32BE(at + 4)) return true;
      }
    } else if (format === 4) {
      const segX2 = cmap.readUInt16BE(sub + 6);
      const ends = sub + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const rangeOffsets = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = cmap.readUInt16BE(ends + s * 2);
        if (code > end) continue;
        const start = cmap.readUInt16BE(starts + s * 2);
        if (code < start) break;
        const ro = cmap.readUInt16BE(rangeOffsets + s * 2);
        if (ro === 0) return ((code + cmap.readInt16BE(deltas + s * 2)) & 0xffff) !== 0;
        const at = rangeOffsets + s * 2 + ro + (code - start) * 2;
        return cmap.readUInt16BE(at) !== 0;
      }
    }
  }
  return false;
}

/** ¿`range` (sintaxis de unicode-range) incluye `code`? */
function rangeIncludes(range: string, code: number): boolean {
  return range.split(",").some((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, "").split("-");
    const lo = parseInt(a, 16);
    const hi = b ? parseInt(b, 16) : lo;
    return code >= lo && code <= hi;
  });
}

test("fuentes del panel: el ₡ de los montos tiene un @font-face propio con el glifo (no cae a la del sistema)", () => {
  const css = readFileSync(GLOBAL_CSS, "utf8");
  const faces = [...css.matchAll(/@font-face\{([^}]*)\}/g)].map((m) => m[1]);
  for (const family of ["Atkinson Hyperlegible Next", "Atkinson Hyperlegible Mono"]) {
    const face = faces.find((f) => f.includes(`'${family}'`) && /unicode-range:([^;]+)/.test(f) && rangeIncludes(/unicode-range:([^;]+)/.exec(f)![1], COLON));
    assert.ok(face, `${family}: ningún @font-face cubre U+20A1`);
    const file = /url\('\/panel\/fonts\/([^']+)'\)/.exec(face)![1];
    const cmap = woff2Cmap(readFileSync(new URL(file, FONTS_DIR)));
    assert.ok(hasGlyph(cmap, COLON), `${file} no trae el ₡`);
  }
});

test("fuentes del panel: los archivos latin-ext de Atkinson existen y el lector de cmap los entiende", () => {
  for (const file of ["atkinson-hyperlegible-next-ext.woff2", "atkinson-hyperlegible-mono-ext.woff2"]) {
    const cmap = woff2Cmap(readFileSync(new URL(file, FONTS_DIR)));
    assert.ok(hasGlyph(cmap, "ā".codePointAt(0)!), `${file}: sin ā`);
    assert.equal(hasGlyph(cmap, COLON), false, `${file}: si un día trae el ₡, sacar Public Sans`);
  }
});

test("fuentes del panel: el archivo latin trae lo del español", () => {
  const cmap = woff2Cmap(readFileSync(new URL("atkinson-hyperlegible-next.woff2", FONTS_DIR)));
  for (const ch of "ñÑáéíóú¿¡") assert.ok(hasGlyph(cmap, ch.codePointAt(0)!), `falta ${ch}`);
});
