/**
 * Hace el video entero, de punta a punta.
 *
 *   npm run video                    ← esto es todo
 *   npm run video -- --objetivo 50   ← más corto
 *   npm run video -- --con-demo      ← siembra las oportunidades de ejemplo
 *
 * Encadena los cuatro pasos (assets → logo → grabar → montar) y, sobre todo,
 * revisa antes que estén las condiciones: si falta algo, lo dice en castellano
 * y explica cómo resolverlo, en vez de escupir un stack trace a la mitad.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";

const args = process.argv.slice(2);
const CON_DEMO = args.includes("--con-demo");
// Lo que no es nuestro se lo pasamos tal cual a montar.mjs (--objetivo, --logo…).
const paraMontar = args.filter((a) => a !== "--con-demo");

const correr = (script, extra = []) => {
  const r = spawnSync(process.execPath, [join(AQUI, script), ...extra], {
    stdio: "inherit",
    cwd: AQUI,
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`${script} terminó con código ${r.status}`);
};

const titulo = (n, texto) => console.log(`\n\x1b[1m${n}/4 · ${texto}\x1b[0m`);

// ── Antes de empezar: ¿está la app levantada? ────────────────────────
// Es el error número uno y el más confuso, porque grabar.mjs falla recién
// en el login y el mensaje no dice nada del dev server.
console.log(`Voy a grabar contra ${BASE}`);
try {
  const r = await fetch(BASE, { signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`respondió HTTP ${r.status}`);
} catch (e) {
  console.error(`\n✗ No pude entrar a ${BASE} (${e.message}).\n`);
  console.error("  La app tiene que estar corriendo. En OTRA terminal, desde la");
  console.error("  raíz del repo:\n");
  console.error("      npm run dev\n");
  console.error("  Cuando diga \"Ready\", volvé acá y repetí este comando.");
  console.error("  Si arrancó en otro puerto, pasáselo:  BASE_URL=http://localhost:3001 npm run video");
  process.exit(1);
}

titulo(1, "Planos aéreos");
if (existsSync(join(AQUI, "assets/apertura.mp4")) && existsSync(join(AQUI, "assets/cierre.mp4"))) {
  console.log("· ya están");
} else {
  correr("traer-assets.mjs");
}

titulo(2, "Logo");
if (existsSync(join(AQUI, "assets/logo-blanco.png"))) {
  console.log("· ya está");
} else {
  correr("logo.mjs");
}

titulo(3, "Grabar el screencast");
// El sembrado escribe en la base de PRODUCCIÓN. El try/finally está para que
// el borrado corra igual si la grabación se cae a la mitad: si no, quedan
// oportunidades inventadas a la vista de las socias.
if (CON_DEMO) {
  console.log("· sembrando oportunidades de ejemplo (se borran al terminar)");
  correr("demo-datos.mjs", ["sembrar"]);
}
try {
  correr("grabar.mjs");
} finally {
  if (CON_DEMO) {
    console.log("\n· borrando las oportunidades de ejemplo");
    try {
      correr("demo-datos.mjs", ["limpiar"]);
    } catch {
      console.error("\n  ⚠ NO pude borrar los datos de ejemplo.");
      console.error("     Corré a mano:  node demo-datos.mjs limpiar");
    }
  }
}

titulo(4, "Montar");
correr("montar.mjs", paraMontar);

console.log(`\n\x1b[1m✓ Listo:\x1b[0m ${join(AQUI, "tutorial-uiab-conecta.mp4")}`);
