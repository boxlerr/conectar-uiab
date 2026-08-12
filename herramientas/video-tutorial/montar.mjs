/**
 * Montaje final: toma los .webm crudos de Playwright y arma el MP4.
 *
 *   node montar.mjs [--objetivo 62] [--velocidad 1.15] [--musica assets/musica.mp3]
 *                   [--sin-bookends]
 *
 * Pasos: normalizar cada parte a 1080p30 → pegarle la apertura y el cierre
 * cinematográficos → encadenar con cortes rápidos → (opcional) mezclar música →
 * H.264 apto para WhatsApp/web.
 *
 * `--objetivo` es la perilla principal: se le dice cuántos segundos tiene que
 * durar la pieza y él calcula la aceleración. `--velocidad` sigue existiendo
 * para forzar un factor a mano (y gana por sobre `--objetivo`).
 */
import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const CRUDO = join(process.cwd(), "grabaciones");
const TMP = join(process.cwd(), "tmp-montaje");
const SALIDA = join(process.cwd(), "tutorial-uiab-conecta.mp4");

// ── Planos cinematográficos (Higgsfield) ─────────────────────────────
// Se bajan con `node traer-assets.mjs`. Si no están, la pieza se arma igual
// sin ellos. Los recortes salen de mirar el clip: el dron arranca lento y
// gana velocidad, así que la apertura entra tarde para cortar en lo mejor.
const APERTURA = { archivo: "assets/apertura.mp4", desde: 0.8, dur: 3.0 };
const CIERRE = { archivo: "assets/cierre.mp4", desde: 0.0, dur: 4.0 };

// El logo de UIAB Conecta, rasterizado del SVG del sitio con `node logo.mjs`.
// Por defecto cierra la pieza sobre el plano aéreo — es el lockup final.
// `--logo apertura|cierre|ambos|no` lo mueve.
const LOGO = "assets/logo-blanco.png";
const LOGO_ANCHO = 820; // px sobre 1920 de ancho

// Cortes cortos: la disolvencia de 0.7 s del corte anterior se comía casi un
// segundo y medio en total y bajaba la energía justo en los cambios de tema.
const CRUCE = { entrada: 0.35, capitulo: 0.25, salida: 0.5 };

const TOPE_VELOCIDAD = 1.6; // más que esto y el tipeo parece adelantado

const args = process.argv.slice(2);
const opt = (n, def) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const bandera = (n) => args.includes(`--${n}`);

const OBJETIVO = Number(opt("objetivo", "62"));
const VELOCIDAD_FORZADA = args.includes("--velocidad") ? Number(opt("velocidad", "1")) : null;
const MUSICA = opt("musica", existsSync("assets/musica.mp3") ? "assets/musica.mp3" : null);
const SIN_BOOKENDS = bandera("sin-bookends");
const DONDE_LOGO = existsSync(LOGO) ? opt("logo", "cierre") : "no";
if (!existsSync(LOGO) && !SIN_BOOKENDS) {
  console.log("  ⚠ falta assets/logo-blanco.png — corré `node logo.mjs` para el lockup.");
}

const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });

/** Duración en segundos, o null. Los .webm de Playwright son VFR y a veces no
 *  traen duración en el contenedor: por eso el segundo intento por stream. */
const duracion = (f) => {
  for (const entrada of ["format=duration", "stream=duration"]) {
    try {
      const sel = entrada.startsWith("stream") ? ["-select_streams", "v:0"] : [];
      const v = Number(execFileSync("ffprobe", [
        "-v", "error", ...sel, "-show_entries", entrada,
        "-of", "default=nw=1:nk=1", f,
      ]).toString().trim().split("\n")[0]);
      if (Number.isFinite(v) && v > 0) return v;
    } catch {}
  }
  return null;
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const partes = readdirSync(CRUDO).filter((f) => f.endsWith(".webm")).sort();
if (!partes.length) throw new Error(`No hay .webm en ${CRUDO} — corré grabar.mjs primero.`);

console.log(`▸ ${partes.length} partes`);

// ── 1. Elegir la aceleración ─────────────────────────────────────────
// Cada plano se mira por separado: con un solo `bookends.length` alcanzaba
// con tener el cierre y no la apertura para que ffmpeg fuera a buscar un
// archivo inexistente.
const hayApertura = !SIN_BOOKENDS && existsSync(APERTURA.archivo);
const hayCierre = !SIN_BOOKENDS && existsSync(CIERRE.archivo);
const segBookends = (hayApertura ? APERTURA.dur : 0) + (hayCierre ? CIERRE.dur : 0);
// Los cruces se comen tiempo: cada uno solapa dos segmentos.
const segCruces = (partes.length - 1) * CRUCE.capitulo
  + (hayApertura ? CRUCE.entrada : 0)
  + (hayCierre ? CRUCE.salida : 0);

let VELOCIDAD = VELOCIDAD_FORZADA ?? 1;
if (VELOCIDAD_FORZADA === null) {
  const crudas = partes.map((p) => duracion(join(CRUDO, p)));
  if (crudas.every((d) => d !== null)) {
    const bruto = crudas.reduce((a, d) => a + d, 0);
    const presupuesto = OBJETIVO - segBookends + segCruces;
    const factor = bruto / Math.max(1, presupuesto);
    VELOCIDAD = Math.min(TOPE_VELOCIDAD, Math.max(1, Number(factor.toFixed(3))));
    console.log(`▸ Objetivo ${OBJETIVO}s · bruto ${bruto.toFixed(1)}s → velocidad ${VELOCIDAD}`);
    if (factor > TOPE_VELOCIDAD) {
      console.log(`  ⚠ harían falta ${factor.toFixed(2)}× para llegar a ${OBJETIVO}s.`);
      console.log(`    Topeado en ${TOPE_VELOCIDAD}× (más rápido el tipeo parece adelantado):`);
      console.log(`    para acortar de verdad hay que sacar pasos en escenas/*.mjs.`);
    }
  } else {
    console.log("  ⚠ no pude medir los .webm crudos: voy a velocidad 1 (usá --velocidad).");
  }
}

// ── 2. Normalizar ────────────────────────────────────────────────────
// Playwright entrega VP8 con framerate variable; para xfade y para que el
// resultado sea reproducible en cualquier lado hay que fijar todo.
const X264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "18"];

const normalizar = (src, dst, { setpts = null, desde = null, dur = null, logo = null } = {}) => {
  const base = [
    setpts ? `setpts=${setpts}*PTS` : null,
    // Los planos del dron ya vienen 1920x1080, pero el screencast es 1600x900:
    // el pad cubre cualquier fuente que no dé exactamente 16:9.
    "scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos",
    "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#072a44",
    "fps=30",
  ].filter(Boolean).join(",");

  const recorte = [
    ...(desde !== null ? ["-ss", String(desde)] : []),
    ...(dur !== null ? ["-t", String(dur)] : []),
  ];

  if (!logo) {
    ff([...recorte, "-i", src, "-vf", `${base},format=yuv420p`, "-an", ...X264, dst]);
  } else {
    // El logo se compone acá y NO se le pide al modelo: la IA deforma
    // cualquier logotipo. Sale del SVG del sitio vía logo.mjs, así que es
    // exactamente el mismo que usa la app.
    // El oscurecido leve es para que el blanco despegue del cielo del plano.
    const salida = logo.sale !== null
      ? `,fade=t=out:st=${logo.sale}:d=.45:alpha=1`
      : "";
    ff([
      ...recorte, "-i", src,
      "-framerate", "30", "-loop", "1", "-i", LOGO,
      "-filter_complex",
      `[0:v]${base},eq=brightness=-0.05:saturation=1.05[v];`
      + `[1:v]scale=${logo.ancho}:-1,format=rgba,`
      + `fade=t=in:st=${logo.entra}:d=.45:alpha=1${salida}[l];`
      + `[v][l]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[o]`,
      "-map", "[o]", "-an", ...X264, dst,
    ]);
  }
  return { archivo: dst, dur: duracion(dst) ?? 0 };
};

const segmentos = [];

if (hayApertura) {
  const n = normalizar(APERTURA.archivo, join(TMP, "b-apertura.mp4"), {
    desde: APERTURA.desde, dur: APERTURA.dur,
    // En la apertura el logo se va antes del corte: enseguida entra la placa,
    // que ya lo trae. Dejarlo puesto sería mostrarlo dos veces seguidas.
    logo: ["apertura", "ambos"].includes(DONDE_LOGO)
      ? { ancho: LOGO_ANCHO, entra: 0.9, sale: APERTURA.dur - 0.6 }
      : null,
  });
  segmentos.push({ ...n, cruce: null, nombre: "apertura (dron)" });
  console.log(`  · apertura → ${n.dur.toFixed(1)}s`);
}

partes.forEach((p, i) => {
  const n = normalizar(join(CRUDO, p), join(TMP, `n${i}.mp4`),
    { setpts: VELOCIDAD !== 1 ? (1 / VELOCIDAD).toFixed(4) : null });
  segmentos.push({
    ...n,
    // El primer capítulo entra desde el plano aéreo; los siguientes, del anterior.
    cruce: segmentos.length === 0 ? null : (i === 0 ? CRUCE.entrada : CRUCE.capitulo),
    nombre: p,
  });
  console.log(`  · ${p} → ${n.dur.toFixed(1)}s`);
});

if (hayCierre) {
  const n = normalizar(CIERRE.archivo, join(TMP, "b-cierre.mp4"), {
    desde: CIERRE.desde, dur: CIERRE.dur,
    // Acá el logo entra y se queda: es el último fotograma de la pieza.
    logo: ["cierre", "ambos"].includes(DONDE_LOGO)
      ? { ancho: LOGO_ANCHO, entra: 0.8, sale: null }
      : null,
  });
  segmentos.push({ ...n, cruce: CRUCE.salida, nombre: "cierre (dron)" });
  console.log(`  · cierre → ${n.dur.toFixed(1)}s`);
}

// ── 3. Encadenar ─────────────────────────────────────────────────────
let video = segmentos[0].archivo;
let total = segmentos[0].dur;

if (segmentos.length > 1) {
  const entradas = segmentos.flatMap((s) => ["-i", s.archivo]);
  const cadena = [];
  let etiqueta = "0:v";
  let acumulado = segmentos[0].dur;
  for (let i = 1; i < segmentos.length; i++) {
    const d = segmentos[i].cruce ?? CRUCE.capitulo;
    const salida = i === segmentos.length - 1 ? "vfin" : `x${i}`;
    const offset = (acumulado - d).toFixed(3);
    cadena.push(`[${etiqueta}][${i}:v]xfade=transition=fade:duration=${d}:offset=${offset}[${salida}]`);
    etiqueta = salida;
    acumulado += segmentos[i].dur - d;
  }
  const dst = join(TMP, "encadenado.mp4");
  ff([...entradas, "-filter_complex", cadena.join(";"), "-map", "[vfin]",
      "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", dst]);
  video = dst;
  total = acumulado;
}
console.log(`▸ Video encadenado: ${total.toFixed(1)}s`);

// ── 4. Música + empaquetado ──────────────────────────────────────────
const comunes = [
  "-c:v", "libx264", "-preset", "slow", "-crf", "19",
  "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
  "-movflags", "+faststart",
];

if (MUSICA && existsSync(MUSICA)) {
  const salidaFade = Math.max(0, total - 2.5);
  ff([
    "-i", video, "-stream_loop", "-1", "-i", MUSICA,
    "-filter_complex",
    `[1:a]volume=0.2,afade=t=in:st=0:d=1.2,afade=t=out:st=${salidaFade.toFixed(2)}:d=2.5[a]`,
    "-map", "0:v", "-map", "[a]", "-shortest",
    ...comunes, "-c:a", "aac", "-b:a", "160k", SALIDA,
  ]);
  console.log(`▸ Música mezclada desde ${MUSICA}`);
} else {
  ff(["-i", video, "-an", ...comunes, SALIDA]);
  console.log("▸ Sin música (dejá un MP3 en assets/musica.mp3 y volvé a correr esto)");
}

rmSync(TMP, { recursive: true, force: true });
const dFinal = duracion(SALIDA) ?? total;
console.log(`\n✓ ${SALIDA}`);
const conPlanos = hayApertura || hayCierre;
const detalle = [
  conPlanos ? "con planos aéreos" : null,
  DONDE_LOGO !== "no" ? `logo en ${DONDE_LOGO}` : null,
].filter(Boolean).join(" · ");
console.log(`  ${dFinal.toFixed(1)}s · 1920x1080 · 30fps${detalle ? ` · ${detalle}` : ""}`);
if (!conPlanos && !SIN_BOOKENDS) {
  console.log("  · sin apertura/cierre: corré `node traer-assets.mjs`");
}
