// Descarga (una sola vez) los .woff2 de las fuentes del panel desde Google Fonts
// y los guarda en src/platform/http/fonts/ para SERVIRLOS NOSOTROS (sin depender del CDN
// de Google en runtime: funciona offline y detrás de firewalls corporativos).
// Panel: Atkinson Hyperlegible Next (y su Mono, solo para horas y montos alineados).
// Sitio público (landing/): Geist y Geist Mono. Todas son variables: Google devuelve el
// mismo archivo para todos los pesos, así que se guarda uno por familia
// (atkinson-hyperlegible-next.woff2, geist.woff2, …).
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../src/platform/http/fonts");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600;700" +
  "&family=Atkinson+Hyperlegible+Mono:wght@400;500;600" +
  "&family=Public+Sans:wght@400..700" +
  "&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap";

const slug = (s) => s.toLowerCase().replace(/\s+/g, "-");

const css = await (await fetch(CSS_URL, { headers: { "User-Agent": UA } })).text();

// Cada bloque viene precedido por un comentario de subset: /* latin */, /* latin-ext */, etc.
const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
const wanted = []; // { family, weight, url, ext, name }
const extRanges = new Map(); // familia → unicode-range de latin-ext (para el @font-face)
let m;
while ((m = re.exec(css))) {
  const subset = m[1];
  // latin cubre español (acentos, ñ, ¿, ¡). De Atkinson también se baja latin-ext (nombres
  // con otras letras). Atkinson NO trae el colón (₡, U+20A1) en ningún subset: sale de
  // Public Sans (solo su latin-ext, que sí lo tiene), declarada en global.css con
  // unicode-range: U+20A1 dentro de la familia de Atkinson. Sin eso, el ₡ de todos los
  // montos cae a la fuente del sistema (test/unit/panelFonts.test.ts).
  const body = m[2];
  const family = (body.match(/font-family:\s*'([^']+)'/) || [])[1];
  const weight = (body.match(/font-weight:\s*(\d+)/) || [])[1];
  const url = (body.match(/src:\s*url\(([^)]+)\)/) || [])[1];
  const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
  if (!family || !weight || !url) continue;
  const ext = subset === "latin-ext" && (family.startsWith("Atkinson") || family === "Public Sans");
  if (family === "Public Sans" && !ext) continue;
  if (subset !== "latin" && !ext) continue;
  if (ext) extRanges.set(family, range);
  wanted.push({ family, weight, url, ext, name: `${slug(family)}${ext ? "-ext" : ""}-${weight}.woff2` });
}
// Mismo archivo para todos los pesos de una familia (fuente variable) → uno solo, sin el peso.
for (const f of wanted) {
  const sameSubset = (o) => o.family === f.family && o.ext === f.ext;
  if (wanted.filter(sameSubset).every((o) => o.url === f.url)) f.name = f.name.replace(/-\d+\.woff2$/, ".woff2");
}
const unique = [...new Map(wanted.map((f) => [f.name, f])).values()];

console.log(`Encontradas ${wanted.length} variantes latin (${unique.length} archivos).`);
for (const f of unique) {
  const buf = Buffer.from(await (await fetch(f.url, { headers: { "User-Agent": UA } })).arrayBuffer());
  writeFileSync(resolve(OUT, f.name), buf);
  console.log(`  ${f.name}  (${f.family} ${f.weight}, ${(buf.length / 1024).toFixed(1)} KB)`);
}
console.log(`\nGuardadas en ${OUT}`);
for (const [family, range] of extRanges) console.log(`unicode-range de ${family} (latin-ext): ${range}`);
