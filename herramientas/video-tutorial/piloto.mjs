/**
 * Piloto: capa de conducción "humana" sobre Playwright + dirección de planos.
 *
 * Dos responsabilidades:
 *
 * 1. Que el navegador se maneje como una persona y no como un robot:
 *    trayectorias con curva y easing, tipeo con ritmo irregular, scroll suave.
 *
 * 2. La DIRECCIÓN. El guion ya no dibuja carteles adentro de la página: declara
 *    planos con `plano()`. Cada plano anota en qué milisegundo empieza y
 *    termina, qué elemento es el sujeto y qué texto lo acompaña. El montaje
 *    lee esa lista y arma la pieza: encuadra, hace el punch-in, pone la
 *    tipografía y —clave— TIRA todo lo que quedó entre plano y plano.
 *
 *    Por eso navegar, esperar a que compile una ruta o scrollear treinta
 *    tarjetas ya no cuesta segundos de video: pasa fuera de plano.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
export const CAPA_VISUAL = readFileSync(join(AQUI, "capa-visual.js"), "utf8");

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Posición del mouse por página: Playwright no la expone. */
const posiciones = new WeakMap();
const pos = (page) => posiciones.get(page) ?? { x: 700, y: 640 };

/**
 * Mueve el mouse describiendo una curva suave, con easing en el tiempo.
 * La recta perfecta es lo que más delata a un bot en un screencast.
 */
export async function moverA(page, x, y, ms = 460) {
  const desde = pos(page);
  const dist = Math.hypot(x - desde.x, y - desde.y);
  if (dist < 1.5) { posiciones.set(page, { x, y }); return; }

  const duracion = Math.max(150, Math.min(ms, 120 + dist * 0.62));
  const pasos = Math.max(12, Math.round(duracion / 16));

  // Punto de control perpendicular al trayecto: le da el arco natural.
  const mx = (desde.x + x) / 2;
  const my = (desde.y + y) / 2;
  const nx = -(y - desde.y) / (dist || 1);
  const ny = (x - desde.x) / (dist || 1);
  const arco = Math.min(46, dist * 0.13);
  const cx = mx + nx * arco;
  const cy = my + ny * arco;

  for (let i = 1; i <= pasos; i++) {
    const t = easeInOutCubic(i / pasos);
    const u = 1 - t;
    const px = u * u * desde.x + 2 * u * t * cx + t * t * x;
    const py = u * u * desde.y + 2 * u * t * cy + t * t * y;
    await page.mouse.move(px, py);
    await dormir(duracion / pasos);
  }
  posiciones.set(page, { x, y });
}

/**
 * Caja del elemento en coordenadas de viewport (null si no existe/está oculto).
 * OJO: acá adentro se resuelve con querySelectorAll, así que el selector tiene
 * que ser CSS puro — la sintaxis de locator de Playwright (`>> nth=1`) NO vale.
 * Para elegir el enésimo, va por la opción `idx`.
 */
export async function caja(page, selector, idx = 0) {
  return page.evaluate(([s, i]) => window.__cast?.caja(s, i) ?? null, [selector, idx]);
}

/** Caja que abarca varios selectores, para encuadrar un conjunto. */
export async function cajaDe(page, selectores) {
  return page.evaluate((ss) => window.__cast?.cajaDe(ss) ?? null, selectores);
}

// El header del sitio es fixed y mide 97px; abajo dejamos aire.
// Fuera de esta banda, un click por coordenadas no llega al elemento.
const BANDA_SEGURA = { arriba: 140, abajo: 90 };

export async function moverAlSelector(page, selector, { ms = 460, dx = 0, dy = 0, idx = 0 } = {}) {
  const alto = page.viewportSize().height;
  let c = await caja(page, selector, idx);
  if (!c) return null;

  // A diferencia de locator.click(), mover el mouse a mano NO scrollea solo:
  // si el elemento está fuera de pantalla el click se pierde en el vacío.
  const arribaDeTodo = c.y < BANDA_SEGURA.arriba;
  const abajoDeTodo = c.y + Math.min(c.h, 300) > alto - BANDA_SEGURA.abajo;
  if (arribaDeTodo || abajoDeTodo) {
    await scrollA(page, selector, { offset: 220, ms: 480, idx });
    await dormir(140);
    c = await caja(page, selector, idx);
    if (!c) return null;
  }

  // Un poquito descentrado: nadie clickea el centro matemático.
  const x = c.x + c.w / 2 + dx + (Math.random() - 0.5) * Math.min(14, c.w * 0.18);
  const crudoY = c.y + c.h / 2 + dy + (Math.random() - 0.5) * Math.min(10, c.h * 0.18);
  const y = Math.max(BANDA_SEGURA.arriba, Math.min(alto - BANDA_SEGURA.abajo, crudoY));
  await moverA(page, x, y, ms);
  // Ojo con el orden: con `{ x, y, ...c }` el spread pisaba x e y con la
  // esquina de la caja, así que quien usara el valor devuelto recibía la
  // posición del ELEMENTO y no la del click. El click siempre estuvo bien
  // (lo hace page.mouse donde quedó el puntero); lo que mentía era el retorno.
  return { ...c, x, y };
}

/**
 * Escribe en un campo sin simular el mouse.
 *
 * Para lo que se completa FUERA de plano. `tipear` mueve el puntero y clickea
 * por coordenadas, que es lo que hace que se vea humano en cámara, pero es
 * frágil con editores enriquecidos y campos al borde del viewport. Acá no hay
 * nadie mirando: lo que importa es que el dato entre.
 */
export async function tipearDirecto(page, selector, texto, { porChar = 8 } = {}) {
  const campo = page.locator(selector).first();
  await campo.click({ timeout: 5000 });
  await dormir(120);
  await page.keyboard.type(texto, { delay: porChar });
}

export async function clickEn(page, selector, { ms = 460, pausa = 150, dx = 0, dy = 0, idx = 0 } = {}) {
  const p = await moverAlSelector(page, selector, { ms, dx, dy, idx });
  if (!p) throw new Error(`No encontré para clickear: ${selector} (idx ${idx})`);
  await dormir(pausa);
  await page.mouse.down();
  await dormir(60);
  await page.mouse.up();
  return p;
}

/**
 * Tipeo con ritmo irregular y micro-pausas después de los espacios.
 */
export async function tipear(page, selector, texto, { porChar = 34, clickPrimero = true, idx = 0 } = {}) {
  if (clickPrimero) await clickEn(page, selector, { pausa: 120, idx });
  await dormir(140);
  for (const ch of texto) {
    await page.keyboard.type(ch);
    const jitter = porChar * (0.7 + Math.random() * 0.6);
    await dormir(ch === " " ? jitter + 25 : jitter);
  }
}

// ── Atajos hacia la capa visual ────────────────────────────────────────
export const cast = (page, metodo, ...args) =>
  page.evaluate(([m, a]) => window.__cast[m](...a), [metodo, args]);

export const scrollSuave = (page, y, ms) => cast(page, "scrollSuave", y, ms);
export const scrollA = (page, sel, opts = {}) => cast(page, "scrollAlSelector", sel, opts);
export const posicionarCursor = (page, x, y) => cast(page, "posicionarCursor", x, y);

/**
 * El tour de react-joyride se abre solo para quien no lo vio (el gate real es
 * perfiles.tutoriales_vistos, no localStorage). Lo cerramos fuera de cámara.
 */
export async function saltarTutorial(page) {
  for (let i = 0; i < 3; i++) {
    const cerrado = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")]
        .find((x) => /saltar tutorial/i.test(x.textContent || ""));
      if (!b) return false;
      b.click();
      return true;
    });
    if (!cerrado) return;
    await dormir(420);
  }
}

/**
 * Corre un tramo que puede no estar disponible y sigue si falla.
 *
 * La pantalla cambia según el estado: el modal de "Postularse" no existe si
 * ya te postulaste, el tablero está vacío si no hay pedidos. Sin esto, un
 * elemento que no aparece corta la pasada entera y se pierde todo lo que
 * venía después — que suele ser lo mejor del capítulo.
 */
export async function opcional(nombre, fn) {
  try {
    await fn();
    return true;
  } catch (e) {
    console.log(`    · me salteo "${nombre}": ${e.message.split("\n")[0]}`);
    return false;
  }
}

/**
 * Clickea el elemento cuyo TEXTO matchea, no el que esté en una posición.
 * Los `button:nth-of-type(1)` se rompen solos: alcanza con que la pantalla
 * agregue un botón arriba, o con que el que buscábamos no se renderice.
 */
export async function clickPorTexto(page, selector, patron, opts = {}) {
  const i = await page.evaluate(([s, p]) => {
    const re = new RegExp(p, "i");
    return [...document.querySelectorAll(s)].findIndex((e) => re.test(e.textContent || ""));
  }, [selector, patron.source ?? patron]);
  if (i < 0) throw new Error(`No hay ningún ${selector} que diga /${patron.source ?? patron}/`);
  return clickEn(page, selector, { ...opts, idx: i });
}

/** Índice del elemento cuyo texto matchea (para elegir a quién encuadrar). */
export async function indicePorTexto(page, selector, patron) {
  return page.evaluate(([s, p]) => {
    const re = new RegExp(p, "i");
    return [...document.querySelectorAll(s)].findIndex((e) => re.test(e.textContent || ""));
  }, [selector, patron.source ?? patron]);
}

/** Trae un elemento al viewport dentro de su propio contenedor scrolleable. */
export async function asegurarVisible(page, selector, idx = 0) {
  const ok = await page.evaluate(([s, i]) => {
    const el = document.querySelectorAll(s)[i];
    if (!el) return false;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    return true;
  }, [selector, idx]);
  if (ok) await dormir(420);
  return ok;
}

/** Espera a que la app haya pintado y la capa esté montada tras navegar. */
export async function asentar(page, ms = 520) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await saltarTutorial(page);
  await page.evaluate(() => window.__cast?.listo());
  await dormir(ms);
}

// ══════════════════════════════════════════════════════════════════════
//  DIRECCIÓN
// ══════════════════════════════════════════════════════════════════════

/** Cuánto puede acercarse la cámara. Más que esto y el upscale se nota:
 *  el .webm sale a 1920 de ancho y la pantalla del marco mide 1600. */
const TOPE_ESCALA = 1.75;

/** Estado de la pasada que se está filmando. */
export const guion = {
  marcas: [],
  claqueta: null,
  reiniciar() { this.marcas = []; this.claqueta = null; },
};

/**
 * Claqueta de sincronía: destello verde a pantalla completa.
 *
 * Playwright empieza a grabar cuando se crea la página, pero entre ese
 * instante y el primer fotograma real hay una demora que cambia en cada
 * corrida. Sin un punto en común, los planos anotados por reloj de pared caen
 * corridos medio segundo y los textos entran fuera de tiempo.
 */
export async function claqueta(page, ms = 260) {
  guion.claqueta = await page.evaluate(
    (n) => window.__cast.claqueta(n), ms);
  return guion.claqueta;
}

/**
 * Cuánto tiene que durar un plano para que su texto se pueda leer.
 *
 * El criterio son 15 caracteres por segundo. Netflix admite hasta 17 cps en
 * subtítulos, pero eso es un TECHO para diálogo que el espectador ya está
 * siguiendo; acá el texto compite con una pantalla que se mueve y con
 * contenido que el espectador está mirando por primera vez, así que se va más
 * despacio. Se suman 0.55 s de arranque (el ojo tiene que ir hasta el texto y
 * empezar) y el rótulo cuenta a medias, porque es corto y se reconoce de un
 * vistazo más que leerse.
 *
 * `velocidad` es la aceleración que el montaje le aplica después al plano: si
 * el plano se va a acelerar 1.3×, hay que grabarlo 1.3× más largo para que en
 * la pieza terminada quede el tiempo de lectura real.
 */
export function minimoLegible({ rotulo = "", texto = "", velocidad = 1 } = {}) {
  const caracteres = String(texto).length + String(rotulo).length * 0.5;
  if (!caracteres) return 900;
  const lectura = 0.55 + caracteres / 15;
  const conAcercamiento = Math.min(4.4, Math.max(1.9, lectura)) + 0.3;
  return Math.round(conAcercamiento * (velocidad || 1) * 1000);
}

/**
 * Escala automática: cuánto hay que acercarse para que el sujeto llene el
 * cuadro sin quedar apretado contra los bordes.
 */
function escalaAuto(rect) {
  if (!rect) return 1;
  const porAncho = 1920 / Math.max(120, rect.w * 1.34);
  const porAlto = 1080 / Math.max(90, rect.h * 1.45);
  return Math.max(1, Math.min(TOPE_ESCALA, Math.min(porAncho, porAlto)));
}

/**
 * Un plano.
 *
 *   await plano(page, {
 *     id: "buscador",
 *     encuadre: '[data-tour="directorio-toolbar"]',   // sujeto (o [selectores])
 *     escala: "auto",                                  // o un número
 *     rotulo: "Buscá",
 *     texto: "Un rubro, una especialidad o el nombre de una empresa.",
 *   }, async () => { ...la acción... });
 *
 * Todo lo que hagas FUERA de la acción (navegar, scrollear, esperar) no entra
 * en la pieza: el montaje sólo se queda con [tIn, tOut].
 */
export async function plano(page, opts, accion) {
  const {
    id,
    encuadre = null,
    escala = "auto",
    rotulo = null,
    texto = null,
    sello = null,        // golpe corto tipo "Al instante" / "Match"
    colaMs = 220,        // aire al final, para que el corte no pise la acción
    velocidad = 1,       // >1 acelera este plano en el montaje (tipeo, scroll)
    idx = 0,
    // Cuándo medir al sujeto. "despues" (por defecto) sigue al elemento si la
    // pantalla se movió durante la acción; "antes" es para los planos cuya
    // acción DISPARA un scroll —tipear en el buscador lo hace— y donde la
    // caja de después ya es la del estado siguiente.
    medirEn = "despues",
    // Congela el scroll de la APP durante el plano (el guion sigue pudiendo
    // scrollear). Para las pantallas que se mueven solas al interactuar.
    congelar = false,
    // El plano TERMINA navegando (un click que cambia de página).
    //
    // Con esto la espera de lectura va ANTES de la acción y el plano corta
    // apenas se dispara el click. Sin esto, la espera caía DESPUÉS: el plano
    // seguía filmando mientras la página navegaba y quedaba casi un segundo de
    // "Cargando oportunidades…" sobre una pantalla en blanco dentro de la
    // pieza. Eso es lo que el cliente vio como "se ven pantallas de carga".
    navega = false,
  } = opts;

  const medir = async () => {
    if (Array.isArray(encuadre)) return cajaDe(page, encuadre);
    if (typeof encuadre === "string") return caja(page, encuadre, idx);
    if (encuadre && typeof encuadre === "object") return encuadre;
    return null;
  };

  // Un plano no arranca hasta que exista lo que va a encuadrar.
  //
  // `asentar()` espera networkidle, pero eso no alcanza: los componentes de
  // cliente pintan "Cargando oportunidades…" DESPUÉS de que la red se calmó,
  // así que el plano empezaba sobre una pantalla en blanco con un spinner y
  // eso terminaba adentro de la pieza. Esperar al sujeto es la garantía que
  // realmente importa: si lo vamos a encuadrar, tiene que estar.
  if (typeof encuadre === "string") {
    await page.waitForSelector(encuadre, { state: "visible", timeout: 10_000 })
      .catch(() => console.log(`    · plano "${id}": ${encuadre} no apareció en 10 s`));
    await dormir(160);
  }

  // Se mide DOS veces, y manda la de después.
  //
  // Medir sólo antes daba encuadres viejos: el buscador, al pasar de vacío a
  // con-texto, scrollea la página solo, así que la caja anotada al empezar
  // apuntaba a donde el elemento YA no estaba y el plano encuadraba el vacío.
  // Y medir sólo después falla en los planos que terminan navegando, porque
  // la caja pasa a ser de otra pantalla. Por eso: la de después si la acción
  // se quedó en la misma URL, y si no, la de antes.
  const urlAntes = page.url();
  const rectAntes = await medir();

  if (congelar) await cast(page, "congelarScroll", true);
  // Las animaciones decorativas del sitio se congelan mientras dura el plano.
  // La franja de logos del directorio se desplaza sola, y encuadrada debajo
  // del cartel se veía como si el video estuviera roto.
  await cast(page, "congelarAnimaciones", true).catch(() => {});

  const tIn = Date.now();

  // El plano no puede terminar antes de que se alcance a LEER su texto.
  //
  // Antes la duración la fijaba la acción: un plano cuya acción tardaba 1.4 s
  // mostraba una frase de nueve palabras durante menos de un segundo. La queja
  // fue exactamente esa: "los textos aparecen muy rápido y se van muy rápido".
  // Ahora el guion declara el texto y el tiempo sale de ahí, así que es
  // imposible escribir un plano ilegible.
  const minimo = minimoLegible({ rotulo, texto, velocidad });
  const esperar = async () => {
    const faltante = minimo - (Date.now() - tIn);
    if (faltante > 0) await dormir(faltante);
  };

  try {
    // Si el plano termina navegando, se lee ANTES y se corta apenas se
    // dispara el click: filmar la navegación es filmar una pantalla de carga.
    if (navega) await esperar();
    if (accion) await accion();
    if (colaMs) await dormir(navega ? Math.min(colaMs, 80) : colaMs);
    if (!navega) await esperar();
  } finally {
    // Sin el finally, un paso que falla deja la página congelada y se lleva
    // puestos todos los planos que vienen después.
    if (congelar) await cast(page, "congelarScroll", false).catch(() => {});
    await cast(page, "congelarAnimaciones", false).catch(() => {});
  }

  const tOut = Date.now();

  const mismaPantalla = page.url() === urlAntes;
  const rectDespues = (medirEn === "despues" && mismaPantalla)
    ? await medir().catch(() => null)
    : null;
  const rect = rectDespues ?? rectAntes;

  if (encuadre && !rect) {
    console.log(`    · plano "${id}": no encontré ${JSON.stringify(encuadre)}, va en plano general`);
  }

  guion.marcas.push({
    id,
    tIn, tOut,
    rect,
    // Las dos: la calculada acá sirve para el log, y la PEDIDA es la que
    // manda en el montaje. Así el encuadre se puede reajustar mirando el
    // render, sin volver a filmar.
    escala: escala === "auto" ? escalaAuto(rect) : Math.min(TOPE_ESCALA, escala),
    escalaPedida: escala,
    rotulo, texto, sello, velocidad,
  });
  return guion.marcas.at(-1);
}
