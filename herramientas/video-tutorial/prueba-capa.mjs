/**
 * Prueba de humo de la capa visual.
 *
 *   node prueba-capa.mjs        # deja las capturas en tmp-prueba/
 *
 * capa-visual.js se inyecta en la página durante la grabación: si algo falla
 * ahí, no explota nada — el video sale mudo, sin subtítulos y sin que nadie se
 * entere hasta verlo. Esto la monta sobre una página falsa, dispara todos los
 * métodos y avisa.
 *
 * Con `CHROMIUM=/ruta/al/chrome` usa ese binario en vez del de Playwright.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CAPA_VISUAL } from "./piloto.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, "tmp-prueba");
mkdirSync(SALIDA, { recursive: true });

// Página de mentira con los mismos data-tour que busca el guion, y con la
// barra fija arriba: es el caso donde el foco ocupa todo el ancho.
const PAGINA = `data:text/html;charset=utf-8,${encodeURIComponent(`
<body style="margin:0;font-family:system-ui;background:#f4f7fa;height:2000px">
  <div style="height:97px;background:#0c3c60"></div>
  <div data-tour="directorio-toolbar" style="margin:40px;padding:26px;background:#fff;border-radius:14px">
    <b style="font-size:22px">Toolbar del directorio</b> — 12 resultados
  </div>
  <div data-tour="ficha-identidad" style="margin:40px;padding:60px;background:#fff;border-radius:14px">
    <b style="font-size:28px">Ficha de la empresa</b>
  </div>
</body>`)}`;

const navegador = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}
);
const ctx = await navegador.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.addInitScript({ content: CAPA_VISUAL });
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));

await page.goto(PAGINA);
await page.evaluate(() => window.__cast.listo());
const cast = (m, ...a) => page.evaluate(([m, a]) => window.__cast[m](...a), [m, a]);

await cast("chip", "01 · Directorio");
await cast("progreso", 38);
await cast("sub", "Resultados en vivo", "El contador se actualiza <b>mientras escribís</b>.");
await cast("foco", '[data-tour="directorio-toolbar"]', {});
await page.waitForTimeout(500);
await page.screenshot({ path: join(SALIDA, "01-sub-foco.png") });

const sello = cast("sello", "Al instante", { ms: 900 });
await page.waitForTimeout(420);
await page.screenshot({ path: join(SALIDA, "02-sello.png") });
await sello;

// Dos focos seguidos: el destello tiene que re-dispararse en el segundo.
await cast("foco", '[data-tour="ficha-identidad"]', {});
const destello = await page.evaluate(() =>
  document.querySelector("#uiab-foco")?.classList.contains("destello"));
await page.waitForTimeout(300);
await page.screenshot({ path: join(SALIDA, "03-foco-2.png") });
await cast("focoOff");
await cast("subOff");

await cast("placa", {
  rotulo: "Guía rápida", titulo: "Todo el parque industrial, en un solo lugar",
  texto: "Directorio y Oportunidades de UIAB Conecta, en un minuto.", ms: 100,
});
await page.screenshot({ path: join(SALIDA, "04-placa.png") });

// El chip y el sello quedan tapados por la placa por ORDEN DE PINTADO: viven
// dentro de #uiab-inferior, que va antes en el DOM. Si alguien los mueve
// después de la placa, van a aparecer flotando encima y esto lo agarra.
const tapado = await page.evaluate(() => {
  const ids = [...document.querySelector("#uiab-cast").children].map((n) => n.id);
  return ids.indexOf("uiab-inferior") < ids.indexOf("uiab-placa");
});
await cast("placaOff");
await navegador.close();

const fallas = [
  destello ? null : "el destello del foco no se re-dispara",
  tapado ? null : "el chip/sello no quedan tapados por la placa",
  ...errores.map((e) => `error de página: ${e}`),
].filter(Boolean);

console.log(`capturas en ${SALIDA}`);
if (fallas.length) {
  console.error(`\n✗ ${fallas.length} problema(s):`);
  for (const f of fallas) console.error(`  · ${f}`);
  process.exit(1);
}
console.log("✓ la capa visual responde y se pinta en el orden correcto");
