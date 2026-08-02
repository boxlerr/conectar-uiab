/**
 * Montaje final: toma los .webm crudos de Playwright y arma el MP4.
 *
 *   node montar.mjs [--velocidad 1.15] [--musica assets/musica.mp3]
 *
 * Pasos: normalizar cada parte a 1080p30 → encadenar con disolvencia →
 * (opcional) mezclar música con fades → H.264 apto para WhatsApp/web.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const CRUDO = join(process.cwd(), "grabaciones");
const TMP = join(process.cwd(), "tmp-montaje");
const SALIDA = join(process.cwd(), "tutorial-uiab-conecta.mp4");

const DISOLVENCIA = 0.7; // segundos de cruce entre partes

const args = process.argv.slice(2);
const opt = (n, def) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const VELOCIDAD = Number(opt("velocidad", "1"));
const MUSICA = opt("musica", existsSync("assets/musica.mp3") ? "assets/musica.mp3" : null);

const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });
const duracion = (f) =>
  Number(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", f,
  ]).toString().trim());

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const partes = readdirSync(CRUDO).filter((f) => f.endsWith(".webm")).sort();
if (!partes.length) throw new Error(`No hay .webm en ${CRUDO} — corré grabar.mjs primero.`);

console.log(`▸ ${partes.length} partes`);

// ── 1. Normalizar ────────────────────────────────────────────────────
// Playwright entrega VP8 con framerate variable; para xfade y para que el
// resultado sea reproducible en cualquier lado hay que fijar todo.
const normalizadas = partes.map((p, i) => {
  const dst = join(TMP, `n${i}.mp4`);
  const filtros = [
    VELOCIDAD !== 1 ? `setpts=${(1 / VELOCIDAD).toFixed(4)}*PTS` : null,
    "scale=1920:1080:flags=lanczos",
    "fps=30",
    "format=yuv420p",
  ].filter(Boolean).join(",");
  ff(["-i", join(CRUDO, p), "-vf", filtros, "-an",
      "-c:v", "libx264", "-preset", "slow", "-crf", "18", dst]);
  const d = duracion(dst);
  console.log(`  · ${p} → ${d.toFixed(1)}s`);
  return { archivo: dst, dur: d };
});

// ── 2. Encadenar con disolvencia ─────────────────────────────────────
let video = normalizadas[0].archivo;
let total = normalizadas[0].dur;

if (normalizadas.length > 1) {
  const entradas = normalizadas.flatMap((n) => ["-i", n.archivo]);
  const cadena = [];
  let etiqueta = "0:v";
  let acumulado = normalizadas[0].dur;
  for (let i = 1; i < normalizadas.length; i++) {
    const salida = i === normalizadas.length - 1 ? "vfin" : `x${i}`;
    const offset = (acumulado - DISOLVENCIA).toFixed(3);
    cadena.push(`[${etiqueta}][${i}:v]xfade=transition=fade:duration=${DISOLVENCIA}:offset=${offset}[${salida}]`);
    etiqueta = salida;
    acumulado += normalizadas[i].dur - DISOLVENCIA;
  }
  const dst = join(TMP, "encadenado.mp4");
  ff([...entradas, "-filter_complex", cadena.join(";"), "-map", "[vfin]",
      "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", dst]);
  video = dst;
  total = acumulado;
}
console.log(`▸ Video encadenado: ${total.toFixed(1)}s`);

// ── 3. Música + empaquetado ──────────────────────────────────────────
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
    `[1:a]volume=0.16,afade=t=in:st=0:d=2,afade=t=out:st=${salidaFade.toFixed(2)}:d=2.5[a]`,
    "-map", "0:v", "-map", "[a]", "-shortest",
    ...comunes, "-c:a", "aac", "-b:a", "160k", SALIDA,
  ]);
  console.log(`▸ Música mezclada desde ${MUSICA}`);
} else {
  ff(["-i", video, "-an", ...comunes, SALIDA]);
  console.log("▸ Sin música (dejá un MP3 en assets/musica.mp3 y volvé a correr esto)");
}

rmSync(TMP, { recursive: true, force: true });
const dFinal = duracion(SALIDA);
console.log(`\n✓ ${SALIDA}`);
console.log(`  ${dFinal.toFixed(1)}s · 1920x1080 · 30fps`);
if (dFinal > 120) console.log(`  ⚠ pasa de 2 min: probá --velocidad ${(dFinal / 105).toFixed(2)}`);
