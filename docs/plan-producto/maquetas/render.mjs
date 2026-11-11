// Exporta cada <section class="slide"> de maquetas.html a un PNG de 1080×1920 en esta carpeta.
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

for (const slide of await page.locator("section.slide").all()) {
  const id = await slide.getAttribute("id");
  await slide.screenshot({ path: path.join(dir, `${id}.png`) });
  console.log(`${id}.png`);
}
await browser.close();
