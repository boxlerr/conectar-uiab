/**
 * Tipografía de la pieza, pre-renderizada como PNG transparente.
 *
 * Los textos ya NO se dibujan adentro de la página. Se rasterizan acá, a
 * 1920x1080 con alfa, y el montaje los compone con `overlay` en el
 * milisegundo exacto en que corresponde. Tres razones:
 *
 *   · Sincronía. Dibujado en la página, el cartel aparecía cuando el guion
 *     llegaba a esa línea; ahora entra clavado con el acercamiento.
 *   · Tamaño. Adentro de la página el texto compite con el layout del sitio y
 *     tiene que ser chico. Acá ocupa lo que tiene que ocupar.
 *   · ffmpeg. El ffmpeg del sistema no siempre trae drawtext (el de esta Mac
 *     no lo trae), así que dibujar texto en el filtro no es una opción.
 *
 * Las fuentes salen de assets/fuentes/, copiadas de las que sirve el propio
 * sitio (next/font las self-hostea en .next/static/media). Van embebidas en
 * base64 porque page.setContent deja el documento en about:blank y Chromium
 * le prohíbe cargar archivos locales.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MARCO } from "./marco.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FUENTES = join(AQUI, "assets", "fuentes");

const MARCA = {
  navy: "#0c3c60",
  navyOscuro: "#061f33",
  azulClaro: "#5fb9e8",
  naranja: "#f97316",
};

const fuente = (archivo) => {
  const ruta = join(FUENTES, archivo);
  if (!existsSync(ruta)) return null;
  return `data:font/woff2;base64,${readFileSync(ruta).toString("base64")}`;
};

const P600 = fuente("poppins-600.woff2");
const P800 = fuente("poppins-800.woff2");

const CSS_FUENTES = [
  P600 && `@font-face{font-family:Poppins;font-weight:600;font-display:block;src:url("${P600}") format("woff2")}`,
  P800 && `@font-face{font-family:Poppins;font-weight:800;font-display:block;src:url("${P800}") format("woff2")}`,
].filter(Boolean).join("\n");

const PILA = `Poppins, "Helvetica Neue", system-ui, sans-serif`;

const { pantalla: P } = MARCO;

const escapar = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── Cartel (lower third) ─────────────────────────────────────────────
// Va por DEBAJO del marco en el montaje: si el degradado se derrama fuera de
// la pantalla, el marco lo tapa. Por eso no hace falta recortarlo acá.
const cartelHTML = ({ rotulo, texto, sello }) => `
<style>
  ${CSS_FUENTES}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${MARCO.ancho}px;height:${MARCO.alto}px;background:transparent;overflow:hidden}

  /* Velo: sin esto el texto blanco se pierde sobre las pantallas claras del
     sitio.
     Era elíptico y anclado abajo a la izquierda, para dejar limpia la derecha.
     Se midió el contraste WCAG del titular compuesto sobre blanco puro —el
     peor caso, que es la página del directorio— en diez franjas a lo ancho:
     daba 12.74 · 10.30 · 7.11 · 4.58 · 2.65 · 1.48 · 1.02 · 1.00 · 1.00 · 1.00.
     O sea que el 40% derecho de la frase estaba literalmente invisible.
     Ahora es una banda a todo el ancho (piso medido: 15.32:1), pero con un
     segundo degradado horizontal que mantiene el sesgo a la izquierda para que
     no se lea como zócalo de noticiero y la página se siga viendo a la derecha. */
  /* El sesgo hacia la izquierda va como MÁSCARA, no como una segunda capa
     apilada: apilado, el degradado horizontal no se desvanece hacia arriba y
     el borde superior de la banda salta de alfa 0 a 126 en un solo píxel — una
     línea recta cruzando la pantalla, justo el zócalo de noticiero que se
     quería evitar. Multiplicando, el borde de arriba sigue la curva del
     vertical, que ya termina en 0.
     330 px y no 420: el bloque de texto ocupa de y=815 a y=944, así que con 420
     quedaban 217 px de velo tapando pantalla sin nada adentro. */
  .velo{
    position:fixed; left:${P.x}px; top:${P.y + P.h - 330}px;
    width:${P.w}px; height:330px;
    background:linear-gradient(to top,
      rgba(9,20,35,.94) 0%, rgba(9,20,35,.90) 34%,
      rgba(9,20,35,.64) 60%, rgba(9,20,35,.22) 82%, rgba(9,20,35,0) 100%);
    -webkit-mask-image:linear-gradient(to right, #000 0%, rgba(0,0,0,.66) 58%, transparent 94%);
            mask-image:linear-gradient(to right, #000 0%, rgba(0,0,0,.66) 58%, transparent 94%);
  }
  /* 1290 y no 1180: a 64px, una frase de ~41 caracteres se partía en dos
     renglones, y el segundo renglón empujaba al primero hacia arriba, fuera de
     la parte fuerte del velo. Con 1290 entran en una línea y todavía quedan
     240 px hasta el borde de la pantalla. */
  .bloque{
    position:fixed; left:${P.x + 68}px; bottom:${MARCO.alto - (P.y + P.h) + 74}px;
    width:1290px; font-family:${PILA};
  }
  .fila{display:flex; align-items:center; gap:16px; margin-bottom:18px}
  .barra{width:4px; height:30px; background:${MARCA.azulClaro}; border-radius:2px}
  .rotulo{
    font-weight:600; font-size:26px; letter-spacing:.2em; text-transform:uppercase;
    color:${MARCA.azulClaro};
  }
  .sello{
    font-weight:800; font-size:19px; letter-spacing:.12em; text-transform:uppercase;
    color:#fff; background:${MARCA.naranja}; padding:7px 16px 6px; border-radius:999px;
    box-shadow:0 6px 18px rgba(249,115,22,.42);
  }
  /* 64px y no 46: WhatsApp recomprime a ~848x480 pase lo que pase, así que lo
     que decide si se lee no es el crf sino el cuerpo de la letra. A 46px la
     altura de mayúscula queda en ~30 px sobre 1080 y al bajar a 480 no
     sobrevive; a 64px quedan ~42 px, que sí. El text-shadow se fue: con la
     banda ya no hace falta y sólo ensuciaba el borde de los glifos. */
  .texto{
    font-weight:800; font-size:64px; line-height:1.12; color:#fff;
    letter-spacing:-.02em;
  }
</style>
<div class="velo"></div>
<div class="bloque">
  <div class="fila">
    <span class="barra"></span>
    <span class="rotulo">${escapar(rotulo)}</span>
    ${sello ? `<span class="sello">${escapar(sello)}</span>` : ""}
  </div>
  <div class="texto">${escapar(texto)}</div>
</div>`;

// ── Placa (tarjeta de capítulo, a cuadro completo) ───────────────────
const placaHTML = ({ rotulo, titulo, texto, logo }) => `
<style>
  ${CSS_FUENTES}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${MARCO.ancho}px;height:${MARCO.alto}px;overflow:hidden;
    font-family:${PILA};
    background:
      radial-gradient(1100px 620px at 50% 42%, rgba(3,130,191,.42), transparent 70%),
      linear-gradient(160deg, ${MARCA.navy} 0%, ${MARCA.navyOscuro} 60%, #04121d 100%);
  }
  .centro{position:fixed; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:0; text-align:center}
  .logo{height:40px; margin-bottom:54px; opacity:.95}
  .rotulo{font-weight:600; font-size:21px; letter-spacing:.28em;
    text-transform:uppercase; color:${MARCA.azulClaro}; margin-bottom:22px}
  h1{font-weight:800; font-size:96px; line-height:1.04; color:#fff;
    letter-spacing:-.028em}
  .regla{width:74px; height:4px; background:${MARCA.naranja};
    border-radius:2px; margin:34px 0 26px}
  p{font-weight:600; font-size:27px; color:rgba(255,255,255,.74); max-width:900px;
    line-height:1.4}
</style>
<div class="centro">
  ${logo ? `<img class="logo" src="${logo}">` : ""}
  ${rotulo ? `<div class="rotulo">${escapar(rotulo)}</div>` : ""}
  <h1>${escapar(titulo)}</h1>
  <div class="regla"></div>
  ${texto ? `<p>${escapar(texto)}</p>` : ""}
</div>`;

/**
 * Rasteriza todos los carteles y placas de una sola vez.
 *
 *   piezas = [{ tipo:"cartel"|"placa", archivo:"...png", ...datos }]
 *
 * Un solo Chromium para todas: levantarlo cuesta ~400 ms y una pieza tiene
 * quince o veinte carteles.
 */
export async function rasterizar(piezas, { destino = join(AQUI, "tmp-texto") } = {}) {
  if (!P600 || !P800) {
    console.log("  ⚠ faltan las fuentes en assets/fuentes/ — los textos salen con la del sistema.");
  }
  mkdirSync(destino, { recursive: true });

  const logoRuta = join(AQUI, "assets", "logo-blanco.png");
  const logo = existsSync(logoRuta)
    ? `data:image/png;base64,${readFileSync(logoRuta).toString("base64")}`
    : null;

  const navegador = await chromium.launch(
    process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}
  );
  const page = await navegador.newPage({
    viewport: { width: MARCO.ancho, height: MARCO.alto },
  });

  const salidas = [];
  for (const pieza of piezas) {
    const html = pieza.tipo === "placa"
      ? placaHTML({ ...pieza, logo })
      : cartelHTML(pieza);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    // El velo se ajusta al bloque de texto REAL, ya maquetado.
    //
    // Con una altura fija, un texto de dos renglones empujaba el primero hacia
    // arriba, fuera de la parte fuerte del degradado: quedaba blanco sobre
    // fondo claro y no se leía. Midiendo después de que el navegador maquetó,
    // el velo tapa lo que hay que tapar, sean uno o dos renglones, y ni un
    // píxel más.
    if (pieza.tipo !== "placa") {
      const renglones = await page.evaluate(({ abajo, minimo }) => {
        const bloque = document.querySelector(".bloque");
        const velo = document.querySelector(".velo");
        if (!bloque || !velo) return 0;
        const caja = bloque.getBoundingClientRect();
        const arriba = Math.max(minimo, Math.round(caja.top) - 170);
        velo.style.top = `${arriba}px`;
        velo.style.height = `${abajo - arriba}px`;
        velo.style.background = "linear-gradient(to bottom,"
          + " rgba(9,20,35,0) 0%, rgba(9,20,35,.52) 38%,"
          + " rgba(9,20,35,.88) 68%, rgba(9,20,35,.94) 100%)";
        // Cuántos renglones ocupa el titular, medido de verdad.
        const t = document.querySelector(".texto");
        const cs = getComputedStyle(t);
        return Math.round(t.getBoundingClientRect().height / parseFloat(cs.lineHeight));
      }, { abajo: P.y + P.h, minimo: P.y });

      // Un titular de dos renglones no es un error, pero conviene saberlo: se
      // lee peor y empuja el bloque hacia arriba. El techo real depende de qué
      // palabras caigan, no del número de caracteres, así que se mide.
      if (renglones > 1) {
        console.log(`  ⚠ "${String(pieza.texto).slice(0, 42)}…" ocupa ${renglones} renglones`);
      }
    }

    const ruta = join(destino, pieza.archivo);
    await page.screenshot({
      path: ruta,
      // La placa es opaca a propósito: reemplaza al cuadro entero.
      omitBackground: pieza.tipo !== "placa",
    });
    salidas.push(ruta);
  }

  await navegador.close();
  return salidas;
}

// Corriéndolo suelto saca una muestra, para mirar la tipografía sin montar.
if (import.meta.url === `file://${process.argv[1]}`) {
  const destino = join(AQUI, "tmp-texto");
  await rasterizar([
    { tipo: "cartel", archivo: "muestra-cartel.png", rotulo: "Contacto directo",
      texto: "Mail, teléfono y web. Sin intermediarios.", sello: "Verificado" },
    { tipo: "placa", archivo: "muestra-placa.png", rotulo: "Capítulo 2",
      titulo: "Oportunidades",
      texto: "El tablero donde las empresas publican lo que necesitan." },
  ], { destino });
  console.log(`✓ muestras en ${destino}`);
}
