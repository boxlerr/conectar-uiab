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
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "../..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const PUERTO = new URL(BASE).port || "3000";

const args = process.argv.slice(2);
const CON_DEMO = args.includes("--con-demo");
// Lo que no es nuestro se lo pasamos tal cual a montar.mjs (--objetivo, --logo…).
const paraMontar = args.filter((a) => a !== "--con-demo");

const correr = (script, extra = []) => {
  const r = spawnSync(process.execPath, [join(AQUI, script), ...extra], {
    stdio: "inherit",
    cwd: AQUI,
    // BASE_URL explícito y no `process.env` pelado: acá ya sabemos contra qué
    // dirección levantamos la app, y si no se la pasamos, grabar.mjs cae en su
    // propio valor por defecto y va a grabar a otro puerto.
    env: { ...process.env, BASE_URL: BASE },
  });
  if (r.status !== 0) throw new Error(`${script} terminó con código ${r.status}`);
};

const titulo = (n, texto) => console.log(`\n\x1b[1m${n}/4 · ${texto}\x1b[0m`);

// "contesta" ≠ "contesta bien": si el puerto responde pero con 500, la app
// arrancó y el problema es de configuración, no del arranque. Distinguirlo
// cambia por completo el consejo que damos al final.
let contestoAlgunaVez = false;
const responde = async () => {
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
    contestoAlgunaVez = true;
    return r.ok;
  } catch {
    return false;
  }
};

// ── La app ───────────────────────────────────────────────────────────
// Si ya está levantada, la usamos. Si no, la levantamos NOSOTROS desde la
// raíz del repo y la bajamos al terminar. Antes esto pedía abrir una segunda
// terminal y correr `npm run dev` allá; el paso se prestaba a hacerlo en la
// carpeta equivocada —donde no existe ese script— y el error que salía
// ("Missing script: dev") no tenía nada que ver con el video.
let dev = null;

async function asegurarApp() {
  if (await responde()) {
    console.log(`· la app ya está corriendo en ${BASE}`);
    return;
  }

  console.log(`· levantando la app (npm run dev en ${RAIZ}, puerto ${PUERTO})`);
  dev = spawn("npm", ["run", "dev"], {
    cwd: RAIZ,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    // PORT, si no `next dev` agarra el 3000 pase lo que pase y BASE_URL con
    // otro puerto no serviría de nada: levantaríamos en un lado y filmaríamos
    // en otro. Hace falta para convivir con otra sesión ya parada en el 3000.
    env: { ...process.env, PORT: PUERTO },
  });

  let salida = "";
  dev.stdout.on("data", (d) => { salida += d; });
  dev.stderr.on("data", (d) => { salida += d; });

  // Hasta 90 s: la primera compilación de Next puede tardar.
  for (let i = 0; i < 90; i++) {
    if (dev.exitCode !== null) break;
    if (await responde()) {
      console.log("· lista");
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // El proceso puede haber muerto un instante antes de que lleguen sus
  // últimos 'data': sin esta pausa, `salida` queda sin el motivo del fallo.
  await new Promise((r) => setTimeout(r, 300));
  bajarApp();

  // Puerto ocupado. Con PORT explícito Next NO se muda al siguiente libre
  // como hace por defecto: falla con EADDRINUSE. Miramos las dos formas.
  const ocupado = /EADDRINUSE/.test(salida) || /using available port/.test(salida);
  if (ocupado) {
    console.error(`\n✗ El puerto ${PUERTO} ya está ocupado por otro proceso.`);
    console.error("  Suele ser otra sesión de la app corriendo en paralelo.");
    console.error("  Elegí un puerto libre y repetí, por ejemplo:\n");
    console.error("      BASE_URL=http://localhost:3005 npm run video\n");
    process.exit(1);
  }

  if (contestoAlgunaVez) {
    console.error(`\n✗ La app levantó en ${BASE} pero devuelve error.`);
    console.error("  Casi siempre es el .env de la raíz del repo: revisá que estén");
    console.error("  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    console.error("  y SUPABASE_SERVICE_ROLE_KEY.\n");
  } else {
    console.error(`\n✗ No pude levantar la app en ${BASE}.`);
    console.error("  Si arrancó en otro puerto, pasáselo:");
    console.error("      BASE_URL=http://localhost:3001 npm run video\n");
  }
  console.error("  Lo último que dijo:\n");
  console.error(salida.split("\n").slice(-25).join("\n"));
  process.exit(1);
}

function bajarApp() {
  if (!dev || dev.exitCode !== null) return;
  // detached:true agrupa a Next y sus hijos: matando el grupo (-pid) no queda
  // ningún proceso ocupando el puerto.
  try { process.kill(-dev.pid, "SIGTERM"); } catch {}
  dev = null;
}

process.on("exit", bajarApp);
process.on("SIGINT", () => { bajarApp(); process.exit(130); });

console.log(`Voy a grabar contra ${BASE}`);
await asegurarApp();

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

// El montaje no toca la app: la bajamos ahora y no durante los minutos que
// tarda ffmpeg.
bajarApp();

titulo(4, "Montar");
correr("montar.mjs", paraMontar);

console.log(`\n\x1b[1m✓ Listo:\x1b[0m ${join(AQUI, "tutorial-uiab-conecta.mp4")}`);
