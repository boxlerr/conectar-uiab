/**
 * Rasteriza el logo de UIAB Conecta a PNG transparente para el montaje.
 *
 *   node logo.mjs
 *
 * ffmpeg no lee SVG, así que el logo hay que llevarlo a PNG antes de
 * componerlo sobre los planos aéreos. Lo hace Chromium (que ya está acá por
 * Playwright), no un binario nuevo: el mismo motor que dibuja la placa del
 * screencast, así que sale idéntico al del video.
 *
 * Se generan dos versiones:
 *   logo-blanco.png  — para el plano aéreo (fondo con imagen)
 *   logo-color.png   — el original, por si se lo quiere sobre fondo claro
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SVG = resolve(AQUI, "../../public/logo-uiab-conecta.svg");
const DESTINO = join(AQUI, "assets");

// 1400 px de ancho: en el montaje se baja a ~760, así que sobra resolución
// y los bordes quedan limpios al escalar.
const ANCHO = 1400;
const RELACION = 36.36 / 188.94; // del viewBox del SVG

if (!existsSync(SVG)) throw new Error(`No encontré el logo en ${SVG}`);
mkdirSync(DESTINO, { recursive: true });

const svg = readFileSync(SVG, "utf8");
const alto = Math.round(ANCHO * RELACION);

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}
);
const page = await navegador.newPage({
  viewport: { width: ANCHO, height: alto },
  deviceScaleFactor: 2,
});

for (const [nombre, filtro] of [
  ["logo-blanco.png", "brightness(0) invert(1)"],
  ["logo-color.png", "none"],
]) {
  // El mismo truco que usa capa-visual.js para la placa: el logo es
  // bicolor, así que para la versión blanca se lo aplasta a negro y se
  // invierte, en vez de mantener un segundo archivo a mano.
  await page.setContent(`
    <body style="margin:0;background:transparent">
      <div style="width:${ANCHO}px;height:${alto}px;filter:${filtro}">${svg}</div>
    </body>`);
  await page.locator("svg").first().waitFor();
  await page.screenshot({
    path: join(DESTINO, nombre),
    omitBackground: true,
    clip: { x: 0, y: 0, width: ANCHO, height: alto },
  });
  console.log(`✓ assets/${nombre} — ${ANCHO}x${alto}`);
}

await navegador.close();
