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
import { mkdirSync, rmSync, renameSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CAPA_VISUAL, dormir, guion, claqueta } from "./piloto.mjs";

import { escenaDirectorio } from "./escenas/directorio.mjs";
import { escenaOportunidades } from "./escenas/oportunidades.mjs";

// 3000 y no un puerto suelto: es el que usa `next dev` y el que da por sentado
// el resto de la herramienta. Tener dos valores por defecto distintos entre
// este archivo y video.mjs ya hizo que la grabación fuera a parar a otro lado.
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SALIDA = join(process.cwd(), "grabaciones");
const ESTADO = join(process.cwd(), "sesion.json");

// Playwright graba SIEMPRE al tamaño CSS del viewport: pedirle a recordVideo
// un tamaño mayor no amplía nada, mete el contenido 1:1 en una esquina y
// rellena el resto (medido). Así que la resolución para los planos cerrados
// hay que ganarla agrandando el viewport, no la grabación.
//
// 1920x1080 y no 1600x900: la pantalla del marco mide 1600 de ancho, así que
// filmando a 1920 un plano cerrado de 1.2× todavía sale de píxeles reales, y
// el tope de 1.75× (piloto.mjs) queda en un upscale suave. Con 1600 cualquier
// acercamiento era upscale desde el primer píxel.
const VIEWPORT = { width: 1920, height: 1080 };
const ESCALA = 2; // rasteriza a 3840x2160 y baja a 1920x1080: texto nítido
const VIDEO = { width: 1920, height: 1080 };

/**
 * Con qué cuenta se filma. Sale del .env de la raíz del repo o del entorno.
 *
 * Antes venía un usuario y una contraseña escritos acá con un `||` de
 * respaldo. Dos problemas: son credenciales en el repositorio, y cuando esa
 * cuenta dejó de existir el síntoma fue "El login no redirigió", que hace
 * pensar en el formulario y no en que el usuario no está.
 *
 * Que NO sea la cuenta de la UIAB: las oportunidades de demo se crean a
 * nombre de la UIAB y el botón "Postularse" no se le muestra a quien publicó,
 * así que esa parte del video no se podría filmar.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));

const leerEnv = () => {
  for (const nombre of [".env.local", ".env"]) {
    const ruta = resolve(AQUI, "../..", nombre);
    if (!existsSync(ruta)) continue;
    return Object.fromEntries(
      readFileSync(ruta, "utf8")
        .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
        .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  }
  return {};
};

const env = leerEnv();
const CREDENCIALES = {
  email: process.env.UIAB_EMAIL || env.UIAB_EMAIL,
  password: process.env.UIAB_PASSWORD || env.UIAB_PASSWORD,
};

// `--sin-sesion` filma sólo el Directorio público, sin entrar. No sirve para
// la pieza final —la ficha queda tapada por "Contenido exclusivo para
// miembros"— pero permite iterar el montaje cuando no hay credenciales a mano.
const SIN_SESION = process.argv.includes("--sin-sesion");

if (!SIN_SESION && (!CREDENCIALES.email || !CREDENCIALES.password)) {
  console.error("\n✗ Falta con qué cuenta filmar.\n");
  console.error("  Agregá al .env de la raíz del repo estas dos líneas, con una");
  console.error("  cuenta de empresa socia (NO la de la UIAB):\n");
  console.error("      UIAB_EMAIL=alguien@suempresa.com");
  console.error("      UIAB_PASSWORD=la-contraseña\n");
  console.error("  El video se graba con sesión iniciada: sin eso, la ficha de");
  console.error("  empresa muestra \"Contenido exclusivo para miembros\" y las");
  console.error("  Oportunidades directamente no se ven.");
  process.exit(1);
}

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

  // Si no redirige, la pantalla casi siempre dice por qué. Leerlo evita
  // adivinar entre "contraseña mal", "usuario inexistente" y "se colgó".
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25_000 })
    .catch(async () => {
      const enPantalla = await page.evaluate(() => {
        const textos = [...document.querySelectorAll('[role="alert"], .text-red-500, .text-red-600, .text-destructive')]
          .map((e) => e.textContent?.trim())
          .filter((t) => t && t.length > 3);
        return [...new Set(textos)].join(" · ");
      }).catch(() => "");
      throw new Error(
        `El login no redirigió con ${CREDENCIALES.email}.`
        + (enPantalla ? `\n  La pantalla dice: "${enPantalla}"` : "")
        + "\n  Revisá UIAB_EMAIL y UIAB_PASSWORD en el .env de la raíz del repo."
      );
    });
  await page.waitForLoadState("networkidle").catch(() => {});

  await ctx.storageState({ path: ESTADO });

  // Calentar las rutas ANTES de encender la cámara. `next dev` compila cada
  // ruta la primera vez que se la visita, y esos segundos quedaban grabados:
  // el capítulo de Oportunidades tenía presupuesto de ~32 s y salía en 77 s,
  // casi todo esperando compilaciones que el espectador ve como cuelgues.
  // Esta pasada no se filma, así que acá no cuestan nada.
  process.stdout.write("  · calentando rutas");
  for (const ruta of ["/directorio", "/oportunidades", "/oportunidades/nueva"]) {
    await page.goto(`${BASE}${ruta}`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    process.stdout.write(".");
  }
  // La ficha de empresa es otra ruta más ([slug]) y también hay que compilarla.
  await page.goto(`${BASE}/directorio`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  const ficha = await page.locator('a[href^="/empresas/"]').first().getAttribute("href")
    .catch(() => null);
  if (ficha) {
    await page.goto(`${BASE}${ficha}`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    process.stdout.write(".");
  }
  console.log(" listo");

  await ctx.close();
  console.log("  ✓ sesión iniciada y guardada");
}

async function pasada({ navegador, nombre, libreto, logueado, indice }) {
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

  // Claqueta ANTES de todo: marca en el .webm el instante en que arranca el
  // reloj del guion. Sin esto los planos caen corridos, porque entre que se
  // crea la página y sale el primer fotograma hay una demora variable.
  guion.reiniciar();
  await claqueta(page);

  const t0 = Date.now();
  let fallo = null;
  try {
    await libreto({ page, BASE, indice });
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
    // Los planos se llevan aunque la pasada se haya cortado: lo filmado hasta
    // ahí sirve, y perder el listado obliga a regrabar todo el capítulo.
    const planos = guion.marcas.slice();
    const util = planos.reduce((a, p) => a + (p.tOut - p.tIn), 0) / 1000;
    if (origen && existsSync(origen)) {
      if (existsSync(destino)) rmSync(destino);
      renameSync(origen, destino);
      console.log(`  ✓ ${nombre}.webm — ${dur}s crudos · ${planos.length} planos · ${util.toFixed(1)}s útiles`);
      return { nombre, archivo: destino, duracion: Number(dur), claqueta: guion.claqueta, planos };
    }
    console.log(`  ✗ ${nombre}: no se generó el video`);
    return { nombre, archivo: null, duracion: Number(dur), claqueta: guion.claqueta, planos };
  }
}

async function main() {
  rmSync(SALIDA, { recursive: true, force: true });
  mkdirSync(SALIDA, { recursive: true });

  console.log(`▸ Grabando contra ${BASE}`);
  const navegador = await chromium.launch({
    // CHROMIUM=/ruta/al/chrome usa ese binario en vez del que bajó Playwright.
    // Sirve cuando el entorno ya trae Chromium y no se puede descargar otro.
    ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
    args: [
      "--hide-scrollbars",          // el scrollbar de Chrome ensucia el encuadre
      "--disable-lcd-text",         // sin subpixel AA: nada de franjas de color al comprimir
      "--force-color-profile=srgb",
      "--font-render-hinting=none",
      "--disable-web-security",
    ],
  });

  try {
    if (SIN_SESION) {
      console.log("▸ Modo sin sesión: sólo el Directorio público.");
      console.log("  Sirve para iterar el montaje sin credenciales; NO es la pieza final:");
      console.log("  sin sesión la ficha tapa catálogo y contacto con \"Contenido exclusivo\".");
    } else {
      console.log("▸ Iniciando sesión…");
      await iniciarSesion(navegador);
    }

    const partes = [];
    // Las dos pasadas van CON sesión: el público del video son las socias, y
    // sin sesión la ficha de empresa tapa catálogo y reseñas con el cartel
    // "Contenido exclusivo para miembros".
    console.log("▸ Pasada 1/2 — Directorio");
    partes.push(await pasada({
      navegador, nombre: "01-directorio", libreto: escenaDirectorio,
      logueado: !SIN_SESION, indice: 1,
    }));

    if (!SIN_SESION) {
      console.log("▸ Pasada 2/2 — Oportunidades");
      partes.push(await pasada({
        navegador, nombre: "02-oportunidades", libreto: escenaOportunidades,
        logueado: true, indice: 2,
      }));
    }

    writeFileSync(join(SALIDA, "partes.json"), JSON.stringify(partes, null, 2));
    const total = partes.reduce((a, p) => a + p.duracion, 0);
    const planos = partes.reduce((a, p) => a + (p.planos?.length ?? 0), 0);
    const util = partes.reduce(
      (a, p) => a + (p.planos ?? []).reduce((b, x) => b + (x.tOut - x.tIn), 0), 0) / 1000;
    console.log(`\n▸ Listo. ${total.toFixed(1)}s crudos → ${planos} planos, ${util.toFixed(1)}s útiles.`);
    console.log("  (lo que quedó entre planos —navegar, scrollear, esperar— no entra en la pieza)");
  } finally {
    await navegador.close();
  }
}

main().catch((e) => { console.error("\n✗", e); process.exit(1); });
