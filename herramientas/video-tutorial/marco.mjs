/**
 * Marco de la pieza: el "estudio" donde se apoya la pantalla.
 *
 *   node marco.mjs
 *
 * Genera assets/marco.png — un PNG de 1920x1080 con el CENTRO TRANSPARENTE.
 * En el montaje se compone ENCIMA del screencast, así que el agujero deja ver
 * el video y todo lo demás (fondo de marca, sombra, filo, logos) queda pintado
 * alrededor. Un solo overlay resuelve marco + fondo + logos.
 *
 * Por qué pre-renderizado y no dibujado en ffmpeg: el ffmpeg del sistema no
 * siempre trae drawtext ni gradientes decentes, y Chromium ya es dependencia
 * (Playwright). El mismo motor que dibuja el sitio dibuja el marco.
 *
 * Las medidas se exportan a assets/marco.json para que montar.mjs encuadre el
 * video exactamente en el agujero: si acá se mueve un número, el montaje se
 * entera solo.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = join(AQUI, "assets");
const RAIZ = resolve(AQUI, "../..");

// ── Geometría ────────────────────────────────────────────────────────
// La pantalla NO ocupa todo el cuadro: el aire alrededor es lo que hace que
// se lea como una pieza y no como una captura de pantalla. Arriba hay más
// margen que abajo porque ahí va la banda con los logos.
export const MARCO = {
  ancho: 1920,
  alto: 1080,
  pantalla: { x: 160, y: 118, w: 1600, h: 900 }, // 16:9 exacto
  radio: 18,
};

const MARCA = {
  navy: "#0c3c60",
  navyOscuro: "#061f33",
  azul: "#0382bf",
  azulClaro: "#5fb9e8",
};

const LOGO_UIAB = join(DESTINO, "logo-blanco.png");
const LOGO_VAXLER = join(RAIZ, "public", "logo-vaxler.png");

// Los logos van EMBEBIDOS en base64, no como file://: page.setContent deja el
// documento en about:blank y Chromium le prohíbe cargar subrecursos locales.
// El síntoma es un ícono de imagen rota en cada esquina, no un error.
const aDataURL = (ruta) =>
  `data:image/png;base64,${readFileSync(ruta).toString("base64")}`;

const { pantalla: P, radio: R, ancho: W, alto: H } = MARCO;

// Máscara del agujero: un rect redondeado opaco. mask-composite:exclude lo
// resta del fondo, así que ahí queda alfa 0 y se ve el video de abajo.
const mascara = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${P.w}" height="${P.h}">`
  + `<rect width="${P.w}" height="${P.h}" rx="${R}" ry="${R}" fill="#000"/></svg>`
);

const html = `<!doctype html><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }

  /* Fondo de marca con el agujero recortado. El resplandor azul detrás de la
     pantalla evita el navy plano, que en video se ve barato. */
  .fondo {
    position:fixed; inset:0;
    background:
      radial-gradient(900px 520px at 50% 34%, rgba(3,130,191,.34), transparent 68%),
      radial-gradient(1200px 700px at 88% 8%, rgba(95,185,232,.14), transparent 62%),
      linear-gradient(160deg, ${MARCA.navy} 0%, ${MARCA.navyOscuro} 62%, #04141f 100%);
    -webkit-mask-image: linear-gradient(#000,#000), url("data:image/svg+xml,${mascara}");
            mask-image: linear-gradient(#000,#000), url("data:image/svg+xml,${mascara}");
    -webkit-mask-position: 0 0, ${P.x}px ${P.y}px;
            mask-position: 0 0, ${P.x}px ${P.y}px;
    -webkit-mask-size: 100% 100%, ${P.w}px ${P.h}px;
            mask-size: 100% 100%, ${P.w}px ${P.h}px;
    -webkit-mask-repeat: no-repeat, no-repeat;
            mask-repeat: no-repeat, no-repeat;
    -webkit-mask-composite: xor;
            mask-composite: exclude;
  }

  /* Viñeta: cierra las esquinas y empuja la mirada al centro. */
  .vineta {
    position:fixed; inset:0; pointer-events:none;
    background: radial-gradient(1400px 900px at 50% 46%, transparent 52%, rgba(0,8,16,.55) 100%);
    -webkit-mask-image: linear-gradient(#000,#000), url("data:image/svg+xml,${mascara}");
            mask-image: linear-gradient(#000,#000), url("data:image/svg+xml,${mascara}");
    -webkit-mask-position: 0 0, ${P.x}px ${P.y}px;
            mask-position: 0 0, ${P.x}px ${P.y}px;
    -webkit-mask-size: 100% 100%, ${P.w}px ${P.h}px;
            mask-size: 100% 100%, ${P.w}px ${P.h}px;
    -webkit-mask-repeat: no-repeat, no-repeat;
            mask-repeat: no-repeat, no-repeat;
    -webkit-mask-composite: xor;
            mask-composite: exclude;
  }

  /* El "vidrio": fondo transparente para no tapar el video. Todo lo que se ve
     es sombra y filo, que se pintan POR FUERA de la caja. */
  .pantalla {
    position:fixed;
    left:${P.x}px; top:${P.y}px; width:${P.w}px; height:${P.h}px;
    border-radius:${R}px; background:transparent;
    box-shadow:
      0 0 0 1.5px rgba(255,255,255,.22),
      0 0 0 7px rgba(6,31,51,.55),
      0 34px 80px -18px rgba(0,0,0,.80),
      0 8px 26px -8px rgba(0,0,0,.55);
  }

  /* Banda superior: UIAB Conecta a la izquierda, Vaxler a la derecha,
     alineadas a los bordes de la pantalla y no del cuadro. */
  .banda { position:fixed; left:${P.x}px; right:${P.x}px; top:0; height:${P.y}px;
           display:flex; align-items:center; justify-content:space-between; }
  .banda img { display:block; }
  .uiab { height:36px; }
  .derecha { display:flex; align-items:center; gap:16px; }
  .rotulo { font:600 12px/1 system-ui,sans-serif; letter-spacing:.16em;
            text-transform:uppercase; color:rgba(255,255,255,.42); }
  .barrita { width:1px; height:20px; background:rgba(255,255,255,.20); }
  .vaxler { height:22px; opacity:.92; }
</style>
<div class="fondo"></div>
<div class="vineta"></div>
<div class="pantalla"></div>
<div class="banda">
  <img class="uiab" src="${aDataURL(LOGO_UIAB)}">
  <div class="derecha">
    <span class="rotulo">Desarrollado por</span>
    <span class="barrita"></span>
    <img class="vaxler" src="${aDataURL(LOGO_VAXLER)}">
  </div>
</div>`;

for (const [ruta, qué] of [[LOGO_UIAB, "logo-blanco.png (corré `node logo.mjs`)"],
                           [LOGO_VAXLER, "public/logo-vaxler.png"]]) {
  if (!existsSync(ruta)) throw new Error(`Falta ${qué}`);
}

mkdirSync(DESTINO, { recursive: true });

export async function dibujarMarco() {
  const navegador = await chromium.launch(
    process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}
  );
  const page = await navegador.newPage({ viewport: { width: W, height: H } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(DESTINO, "marco.png"), omitBackground: true });
  await navegador.close();

  writeFileSync(join(DESTINO, "marco.json"), JSON.stringify(MARCO, null, 2));
  console.log(`✓ assets/marco.png — ${W}x${H}, agujero ${P.w}x${P.h} en (${P.x},${P.y})`);
}

// Sólo dibuja si se lo corre a mano. montar.mjs importa MARCO por las medidas
// y no tiene por qué levantar un Chromium para eso.
if (import.meta.url === `file://${process.argv[1]}`) await dibujarMarco();
