// Exporta maquetas.html (cada <section class="slide"> es una página de 1080×1920) a esta carpeta:
//   · las maquetas sueltas (secciones sin la clase "deck") a PNG, para reenviar por WhatsApp;
//   · la presentación completa, en el orden del archivo, a propuesta-una-socia.pdf.
// Uso (desde la raíz del repo):  node docs/plan-producto/maquetas/render.mjs
// Si el Chromium instalado no es el que trae @playwright/test, pasar su ruta en E2E_CHROMIUM_PATH
// (la misma variable que usa playwright.config.ts).
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const executablePath = process.env.E2E_CHROMIUM_PATH || undefined;

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto("file://" + path.join(dir, "maquetas.html"));
await page.evaluate(() => document.fonts.ready);

// 1) Maquetas sueltas.
for (const slide of await page.locator("section.slide:not(.deck)").all()) {
  const id = await slide.getAttribute("id");
  await slide.screenshot({ path: path.join(dir, `${id}.png`) });
  console.log(`${id}.png`);
}

// 2) Presentación: se numeran los momentos y las páginas, y se imprime todo en orden.
const pages = await page.evaluate(() => {
  const moments = [...document.querySelectorAll("section.slide:not(.deck)")];
  moments.forEach((slide, i) => {
    const label = slide.querySelector(".tag").lastChild;
    label.textContent = `Momento ${i + 1} de ${moments.length} · ${label.textContent}`;
  });
  const all = [...document.querySelectorAll("section.slide")];
  all.forEach((slide, i) => {
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = `${i + 1} / ${all.length}`;
    slide.appendChild(num);
  });
  return all.length;
});
await page.emulateMedia({ media: "print" });
await page.pdf({ path: path.join(dir, "propuesta-una-socia.pdf"), width: "1080px", height: "1920px", printBackground: true });
console.log(`propuesta-una-socia.pdf (${pages} páginas)`);
await browser.close();
