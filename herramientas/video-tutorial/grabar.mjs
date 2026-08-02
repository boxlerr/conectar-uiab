/**
 * Arnés de grabación del tutorial de UIAB Conecta.
 *
 * Graba en DOS pasadas, cada una con su propio contexto de Playwright (y por
 * lo tanto su propio .webm):
 *   1. deslogueado  → intro + Directorio
 *   2. logueado     → Oportunidades (ver, postularse, publicar) + cierre
 * El corte entre pasadas queda tapado por la placa de capítulo, así que en el
 * montaje final no se nota.
 *
 * El login se hace ANTES de grabar, en un contexto aparte que no se filma: a
 * 90 segundos de video no le sobran 10 para un formulario de acceso.
 */
import { chromium } from "playwright";
import { mkdirSync, rmSync, renameSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CAPA_VISUAL, dormir } from "./piloto.mjs";

import { escenaDirectorio } from "./escenas/directorio.mjs";
import { escenaOportunidades } from "./escenas/oportunidades.mjs";

const BASE = process.env.BASE_URL || "http://localhost:51400";
const SALIDA = join(process.cwd(), "grabaciones");
const ESTADO = join(process.cwd(), "sesion.json");

// Playwright NO amplía: si recordVideo.size es mayor que el viewport, mete
// relleno gris alrededor. Por eso el video se graba EXACTAMENTE del tamaño del
// viewport y el escalado a 1080p lo hace ffmpeg en el montaje.
// 1600x900 y no 1920x1080 a propósito: el sitio renderiza más chico, así que
// al ampliar a 1080p el texto se lee bien en un celular.
const VIEWPORT = { width: 1600, height: 900 };
const ESCALA = 2; // captura a 3200x1800 y baja a 1600x900: texto nítido
const VIDEO = { width: 1600, height: 900 };

const CREDENCIALES = {
  email: process.env.UIAB_EMAIL || "boxlerjulian+empresatest@hotmail.com",
  password: process.env.UIAB_PASSWORD || "UiabPrueba.2026!",
};

const opcionesContexto = (grabar) => ({
  viewport: VIEWPORT,
  deviceScaleFactor: ESCALA,
  locale: "es-AR",
  timezoneId: "America/Argentina/Buenos_Aires",
  colorScheme: "light",
  reducedMotion: "no-preference",
  ...(grabar ? { recordVideo: { dir: SALIDA, size: VIDEO } } : {}),
});

/** Entra una vez y guarda las cookies; las pasadas grabadas arrancan adentro. */
async function iniciarSesion(navegador) {
  const ctx = await navegador.newContext(opcionesContexto(false));
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  await page.locator('input[type="email"]').first().fill(CREDENCIALES.email);
  await page.locator('input[type="password"]').first().fill(CREDENCIALES.password);
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25_000 })
    .catch(() => { throw new Error("El login no redirigió — revisá las credenciales."); });
  await page.waitForLoadState("networkidle").catch(() => {});

  await ctx.storageState({ path: ESTADO });
  await ctx.close();
  console.log("  ✓ sesión iniciada y guardada");
}

async function pasada({ navegador, nombre, guion, logueado, indice }) {
  const ctx = await navegador.newContext({
    ...opcionesContexto(true),
    ...(logueado ? { storageState: ESTADO } : {}),
  });
  // La capa visual se inyecta en cada documento, también tras navegar duro.
  await ctx.addInitScript({ content: CAPA_VISUAL });
  // El tour de react-joyride no arranca solo, pero si algo lo dispara se nos
  // monta encima del encuadre. Lo damos por visto (clave de contexto-tour.tsx).
  await ctx.addInitScript(() => {
    try {
      window.localStorage.setItem("uiab.tour.progreso", JSON.stringify({
        directorio: "visto", oportunidades: "visto", dashboard: "visto", perfil: "visto",
      }));
    } catch {}
  });

  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`    · error de página: ${e.message.slice(0, 120)}`));

  const t0 = Date.now();
  let fallo = null;
  try {
    await guion({ page, BASE, indice });
  } catch (e) {
    // Un `return` dentro de finally se come la excepción: la guardamos
    // aparte para no quedarnos con una toma corta y sin explicación.
    fallo = e;
  } finally {
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    if (fallo) console.log(`    ✗ ${nombre} cortó a los ${dur}s: ${fallo.message.split("\n")[0]}`);
    await dormir(400);
    await page.close();
    await ctx.close();
    const origen = await page.video()?.path();
    const destino = join(SALIDA, `${nombre}.webm`);
    if (origen && existsSync(origen)) {
      if (existsSync(destino)) rmSync(destino);
      renameSync(origen, destino);
      console.log(`  ✓ ${nombre}.webm — ${dur}s`);
      return { nombre, archivo: destino, duracion: Number(dur) };
    }
    console.log(`  ✗ ${nombre}: no se generó el video`);
    return { nombre, archivo: null, duracion: Number(dur) };
  }
}

async function main() {
  rmSync(SALIDA, { recursive: true, force: true });
  mkdirSync(SALIDA, { recursive: true });

  console.log(`▸ Grabando contra ${BASE}`);
  const navegador = await chromium.launch({
    args: [
      "--hide-scrollbars",          // el scrollbar de Chrome ensucia el encuadre
      "--disable-lcd-text",         // sin subpixel AA: nada de franjas de color al comprimir
      "--force-color-profile=srgb",
      "--font-render-hinting=none",
      "--disable-web-security",
    ],
  });

  try {
    console.log("▸ Iniciando sesión…");
    await iniciarSesion(navegador);

    const partes = [];
    // Las dos pasadas van CON sesión: el público del video son las socias, y
    // sin sesión la ficha de empresa tapa catálogo y reseñas con el cartel
    // "Contenido exclusivo para miembros".
    console.log("▸ Pasada 1/2 — Directorio");
    partes.push(await pasada({
      navegador, nombre: "01-directorio", guion: escenaDirectorio,
      logueado: true, indice: 1,
    }));

    console.log("▸ Pasada 2/2 — Oportunidades");
    partes.push(await pasada({
      navegador, nombre: "02-oportunidades", guion: escenaOportunidades,
      logueado: true, indice: 2,
    }));

    writeFileSync(join(SALIDA, "partes.json"), JSON.stringify(partes, null, 2));
    const total = partes.reduce((a, p) => a + p.duracion, 0);
    console.log(`\n▸ Listo. Material bruto: ${total.toFixed(1)}s en ${partes.length} partes.`);
  } finally {
    await navegador.close();
  }
}

main().catch((e) => { console.error("\n✗", e); process.exit(1); });
