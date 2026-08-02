/**
 * Piloto: capa de conducción "humana" sobre Playwright.
 *
 * Playwright mueve el mouse en línea recta y tipea a velocidad constante, que
 * en video se nota robótico. Acá va todo lo que hace que el screencast parezca
 * grabado por una persona: trayectorias con curva y easing, tipeo con ritmo
 * irregular, pausas de lectura.
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
export async function moverA(page, x, y, ms = 700) {
  const desde = pos(page);
  const dist = Math.hypot(x - desde.x, y - desde.y);
  if (dist < 1.5) { posiciones.set(page, { x, y }); return; }

  const duracion = Math.max(220, Math.min(ms, 180 + dist * 1.05));
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

// El header del sitio es fixed y mide 97px; abajo dejamos aire para el
// subtítulo. Fuera de esta banda, un click por coordenadas no llega al elemento.
const BANDA_SEGURA = { arriba: 140, abajo: 90 };

export async function moverAlSelector(page, selector, { ms = 700, dx = 0, dy = 0, idx = 0 } = {}) {
  const alto = page.viewportSize().height;
  let c = await caja(page, selector, idx);
  if (!c) return null;

  // A diferencia de locator.click(), mover el mouse a mano NO scrollea solo:
  // si el elemento está fuera de pantalla el click se pierde en el vacío
  // (así se perdía el tipeo de la descripción, que arranca en y≈967).
  const arribaDeTodo = c.y < BANDA_SEGURA.arriba;
  const abajoDeTodo = c.y + Math.min(c.h, 300) > alto - BANDA_SEGURA.abajo;
  if (arribaDeTodo || abajoDeTodo) {
    await scrollA(page, selector, { offset: 220, ms: 700, idx });
    await dormir(220);
    c = await caja(page, selector, idx);
    if (!c) return null;
  }

  // Un poquito descentrado: nadie clickea el centro matemático.
  const x = c.x + c.w / 2 + dx + (Math.random() - 0.5) * Math.min(14, c.w * 0.18);
  const crudoY = c.y + c.h / 2 + dy + (Math.random() - 0.5) * Math.min(10, c.h * 0.18);
  // Red de seguridad para elementos más altos que la pantalla: el centro puede
  // seguir cayendo afuera aunque el borde superior ya esté visible.
  const y = Math.max(BANDA_SEGURA.arriba, Math.min(alto - BANDA_SEGURA.abajo, crudoY));
  await moverA(page, x, y, ms);
  return { x, y, ...c };
}

export async function clickEn(page, selector, { ms = 700, pausa = 260, dx = 0, dy = 0, idx = 0 } = {}) {
  const p = await moverAlSelector(page, selector, { ms, dx, dy, idx });
  if (!p) throw new Error(`No encontré para clickear: ${selector} (idx ${idx})`);
  await dormir(pausa);
  await page.mouse.down();
  await dormir(75);
  await page.mouse.up();
  return p;
}

/** Tipeo con ritmo irregular y micro-pausas después de los espacios. */
export async function tipear(page, selector, texto, { porChar = 62, clickPrimero = true, idx = 0 } = {}) {
  if (clickPrimero) await clickEn(page, selector, { pausa: 200, idx });
  await dormir(240);
  for (const ch of texto) {
    await page.keyboard.type(ch);
    const jitter = porChar * (0.55 + Math.random() * 0.95);
    await dormir(ch === " " ? jitter + 45 : jitter);
  }
}

// ── Atajos hacia la capa visual ────────────────────────────────────────
export const cast = (page, metodo, ...args) =>
  page.evaluate(
    ([m, a]) => window.__cast[m](...a),
    [metodo, args]
  );

export const sub = (page, rotulo, cuerpo) => cast(page, "sub", rotulo, cuerpo);
export const subOff = (page) => cast(page, "subOff");
export const chip = (page, texto) => cast(page, "chip", texto);
export const progreso = (page, pct) => cast(page, "progreso", pct);
export const foco = (page, sel, opts = {}) => cast(page, "foco", sel, opts);
export const focoOff = (page) => cast(page, "focoOff");
export const placa = (page, opts) => cast(page, "placa", opts);
export const placaOff = (page) => cast(page, "placaOff");
export const scrollSuave = (page, y, ms) => cast(page, "scrollSuave", y, ms);
export const scrollA = (page, sel, opts = {}) => cast(page, "scrollAlSelector", sel, opts);

/**
 * Resalta un elemento y muestra el subtítulo a la vez: es el gesto base del
 * tutorial (señalo algo + lo explico).
 */
export async function señalar(page, selector, rotulo, texto, { leer = 1500, mover = true, atenuar = false, idx = 0 } = {}) {
  if (!selector) {
    await sub(page, rotulo, texto);
    await dormir(leer);
    return;
  }
  await scrollA(page, selector, { offset: 190, ms: 900, idx });
  await dormir(140);
  if (mover) await moverAlSelector(page, selector, { ms: 620, idx });
  // El recuadro y el cartel entran JUNTOS. Encadenados, el resaltado nuevo
  // quedaba medio segundo emparejado con el texto del paso anterior.
  await Promise.all([
    foco(page, selector, { atenuar, idx }),
    sub(page, rotulo, texto),
  ]);
  await dormir(leer);
}

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

/** Trae un elemento al viewport dentro de su propio contenedor scrolleable. */
export async function asegurarVisible(page, selector, idx = 0) {
  const ok = await page.evaluate(([s, i]) => {
    const el = document.querySelectorAll(s)[i];
    if (!el) return false;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    return true;
  }, [selector, idx]);
  if (ok) await dormir(620);
  return ok;
}

/** Espera a que la app haya pintado y la capa esté montada tras navegar. */
export async function asentar(page, ms = 800) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await saltarTutorial(page);
  await page.evaluate(() => window.__cast?.listo());
  await dormir(ms);
}
