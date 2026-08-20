/**
 * Prueba visual del look, sin grabar ni montar.
 *
 *   npm run prueba
 *   BASE_URL=http://localhost:3005 npm run prueba
 *
 * Saca una captura del sitio, la mete en el marco, le compone un cartel y
 * escribe `prueba-look.png`. Sirve para ajustar marco.mjs y tipografia.mjs en
 * segundos, en vez de esperar una grabación entera para descubrir que el velo
 * tapa de más o que un logo quedó torcido.
 *
 * Si la app no está levantada, usa un fondo claro: el marco y la tipografía se
 * ven igual, que es lo que se está mirando.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { rasterizar } from "./tipografia.mjs";
import { MARCO, dibujarMarco } from "./marco.mjs";

const require_ = createRequire(import.meta.url);
const binario = (paquete, fallback) => {
  try {
    const p = require_(paquete);
    return typeof p === "string" ? p : p.path;
  } catch { return fallback; }
};
const FFMPEG = process.env.FFMPEG || binario("ffmpeg-static", "ffmpeg");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const RUTA = process.env.RUTA || "/directorio";
const TMP = join(process.cwd(), "tmp-prueba");
const SALIDA = join(process.cwd(), "prueba-look.png");
const { pantalla: P, ancho: W, alto: H } = MARCO;

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

await dibujarMarco();

const [cartel] = await rasterizar([{
  tipo: "cartel", archivo: "cartel.png",
  rotulo: process.env.ROTULO || "Contacto directo",
  texto: process.env.TEXTO || "Mail, teléfono y web. Sin intermediarios.",
  sello: process.env.SELLO || null,
}], { destino: TMP });

// La captura va del tamaño del video, no del marco: es lo que entrega la
// grabación, y así el encuadre que se prueba acá es el mismo de la pieza.
const captura = join(TMP, "captura.png");
let hayApp = false;
try {
  const r = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
  hayApp = r.ok;
} catch {}

if (hayApp) {
  const navegador = await chromium.launch(
    process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}
  );
  const page = await navegador.newPage({
    viewport: { width: W, height: H }, deviceScaleFactor: 2,
  });
  await page.goto(`${BASE}${RUTA}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: captura });
  await navegador.close();
  console.log(`· captura de ${BASE}${RUTA}`);
} else {
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", `color=#f1f5f9:s=${W}x${H}`, "-frames:v", "1", captura]);
  console.log(`· la app no responde en ${BASE}: uso un fondo liso`);
}

execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y",
  "-f", "lavfi", "-i", `color=#061f33:s=${W}x${H}`,
  "-i", captura, "-i", cartel, "-i", join("assets", "marco.png"),
  "-filter_complex",
  `[1:v]scale=${P.w}:${P.h}[pant];[0:v][pant]overlay=${P.x}:${P.y}[a];`
  + `[a][2:v]overlay=0:0[b];[b][3:v]overlay=0:0`,
  "-frames:v", "1", SALIDA]);

rmSync(TMP, { recursive: true, force: true });
console.log(`✓ ${SALIDA}`);
console.log("  Abrilo y mirá: filo de la pantalla, logos, velo y tipografía.");
