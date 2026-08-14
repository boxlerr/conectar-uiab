/**
 * Montaje: acá vive la dirección de la pieza.
 *
 *   node montar.mjs [--objetivo 45] [--musica assets/musica.mp3]
 *                   [--sin-bookends] [--solo <id-de-plano>]
 *
 * Playwright entrega material CRUDO: el sitio usándose, sin carteles, sin
 * recuadros, y una lista de planos (grabaciones/partes.json) que dice, para
 * cada uno, entre qué milisegundos pasa, a quién encuadra y qué texto lo
 * acompaña. Todo lo demás se decide acá:
 *
 *   · Se tira lo que quedó ENTRE planos: navegar, scrollear, esperar a que
 *     Next compile una ruta. Antes eso era la mitad del video.
 *   · Cada plano entra con un punch-in sobre su sujeto, no en plano general.
 *   · El texto se compone sincronizado con ese acercamiento.
 *   · La pantalla va montada en un marco de marca con los dos logos.
 *
 * Por qué en post y no en el navegador: animar la página con CSS mientras se
 * graba da tirones y Chromium rasteriza borroso durante la animación. Acá el
 * movimiento es exacto y el sostenido queda a resolución plena.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { rasterizar } from "./tipografia.mjs";
import { MARCO } from "./marco.mjs";

// ffmpeg y ffprobe vienen como dependencias npm: así `npm install` deja todo
// listo y no hay que instalar nada a mano en la máquina. Si alguien prefiere
// los del sistema, FFMPEG=/ruta y FFPROBE=/ruta los pisan.
const require_ = createRequire(import.meta.url);
const binario = (paquete, fallback) => {
  try {
    const p = require_(paquete);
    return typeof p === "string" ? p : p.path;
  } catch {
    return fallback;
  }
};
const FFMPEG = process.env.FFMPEG || binario("ffmpeg-static", "ffmpeg");
const FFPROBE = process.env.FFPROBE || binario("@ffprobe-installer/ffprobe", "ffprobe");

const CRUDO = join(process.cwd(), "grabaciones");
const TMP = join(process.cwd(), "tmp-montaje");
const TMP_TEXTO = join(process.cwd(), "tmp-texto");
const SALIDA = join(process.cwd(), "tutorial-uiab-conecta.mp4");

const FPS = 30;
const { pantalla: PANT, ancho: W, alto: H } = MARCO;
const FONDO = "#061f33"; // el mismo navy del marco: los cortes no parpadean

// ── Planos cinematográficos (Higgsfield) ─────────────────────────────
// Se bajan con `node traer-assets.mjs`. Si no están, la pieza se arma igual.
// El recorte se ancla a un extremo y se calcula con la duración REAL medida:
// los planos pueden venir de 4 s o de 5 s y un número a mano deja de caer
// donde se quería en cuanto se regenera uno.
//   apertura → los últimos N s: el dron acelera, el pico está al final.
//   cierre   → los primeros N s: el retroceso abre el plano enseguida.
const APERTURA = { archivo: "assets/apertura.mp4", dur: 3.2, anclaje: "final" };
const CIERRE = { archivo: "assets/cierre.mp4", dur: 4.0, anclaje: "inicio" };

const LOGO = "assets/logo-blanco.png";
const LOGO_ANCHO = 820;

// Ritmo de los movimientos de cámara.
const PUNCH = 0.34;        // cuánto dura el acercamiento
const DERIVA = 1.055;      // empuje lento de los planos generales

// El texto entra enseguida y se queda hasta el final del plano.
//
// Antes salía 0.30 s antes del corte y entraba recién a los 0.16 con un
// fundido de 0.34: en un plano de 1.4 s eso deja la frase legible menos de un
// segundo. La duración del plano ahora la fija el tiempo de lectura
// (piloto.mjs, minimoLegible), así que acá lo único que hace falta es no
// desperdiciar ese tiempo: entra rápido y se va justo en el corte.
const TEXTO = { entra: 0.10, entrada: 0.28, sube: 24, sale: 0.14 };

// Hasta dónde se puede recortar el sujeto para encuadrarlo. Un elemento de
// 900 px de alto encuadrado ENTERO no deja acercarse nada; encuadrando su
// parte de arriba —que es donde está lo que importa— sí. Con 620 de alto los
// planos de la barra lateral y del contacto salían a 1.2×, o sea casi plano
// general: 430 los deja en 1.7×, que es lo que se pidió.
const SUJETO = { ancho: 980, alto: 430 };

// El sujeto no va al centro exacto sino un poco arriba: abajo a la izquierda
// entra el cartel, y con el sujeto centrado el texto le pasaba por encima.
const ALTURA_SUJETO = 0.43;
const TOPE_ESCALA = 1.75;  // más que esto y el upscale desde 1920 se nota

const args = process.argv.slice(2);
const opt = (n, def) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const bandera = (n) => args.includes(`--${n}`);

const OBJETIVO = args.includes("--objetivo") ? Number(opt("objetivo", "0")) : null;
const MUSICA = opt("musica", existsSync("assets/musica.mp3") ? "assets/musica.mp3" : null);
const SIN_BOOKENDS = bandera("sin-bookends");
const LUFS = Number(opt("lufs", "-16"));
const SOLO = opt("solo", null);
const DONDE_LOGO = existsSync(LOGO) ? opt("logo", "ambos") : "no";

const ff = (a) => execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });

/** Duración en segundos, o null. Los .webm de Playwright son VFR y a veces no
 *  traen duración en el contenedor: por eso el segundo intento por stream. */
const duracion = (f) => {
  for (const entrada of ["format=duration", "stream=duration"]) {
    try {
      const sel = entrada.startsWith("stream") ? ["-select_streams", "v:0"] : [];
      const v = Number(execFileSync(FFPROBE, [
        "-v", "error", ...sel, "-show_entries", entrada,
        "-of", "default=nw=1:nk=1", f,
      ]).toString().trim().split("\n")[0]);
      if (Number.isFinite(v) && v > 0) return v;
    } catch {}
  }
  return null;
};

const X264 = ["-c:v", "libx264", "-preset", "medium", "-crf", "17",
              "-pix_fmt", "yuv420p", "-r", String(FPS)];

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// ── 1. El material y su libreto ──────────────────────────────────────
const manifiesto = join(CRUDO, "partes.json");
if (!existsSync(manifiesto)) {
  throw new Error(`No hay ${manifiesto} — corré grabar.mjs primero.`);
}
const partes = JSON.parse(readFileSync(manifiesto, "utf8"))
  .filter((p) => p.archivo && existsSync(p.archivo) && p.planos?.length);
if (!partes.length) throw new Error("Ninguna pasada dejó planos utilizables.");

console.log(`▸ ${partes.length} pasada(s) · ${partes.reduce((a, p) => a + p.planos.length, 0)} planos`);

// ── 2. Normalizar y encontrar la claqueta ────────────────────────────
/**
 * El .webm de Playwright es VFR. Antes de cortar nada se lo pasa a 30 fps
 * constantes: así el número de fotograma ES el tiempo, y el corte cae donde
 * se lo pide.
 */
function normalizarPasada(parte, i) {
  const dst = join(TMP, `pase-${i}.mp4`);
  console.log(`  · normalizando ${parte.nombre}`);
  ff(["-i", parte.archivo, "-vf", `fps=${FPS},format=yuv420p`, "-an",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", dst]);
  return dst;
}

/**
 * Busca el primer fotograma verde: es la claqueta que dejó la grabación.
 *
 * Se decodifican los primeros segundos a 8x8 en crudo (192 bytes por
 * fotograma) y se mira el promedio. No hace falta ninguna librería de
 * imágenes ni escribir PNGs.
 */
function fotogramaClaqueta(archivo) {
  const crudo = execFileSync(FFMPEG, [
    "-v", "error", "-i", archivo, "-t", "12",
    "-vf", `fps=${FPS},scale=8:8`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
  ], { maxBuffer: 1 << 26 });

  const porFotograma = 8 * 8 * 3;
  for (let f = 0; f * porFotograma < crudo.length; f++) {
    let r = 0, g = 0, b = 0;
    for (let p = 0; p < 64; p++) {
      const o = f * porFotograma + p * 3;
      r += crudo[o]; g += crudo[o + 1]; b += crudo[o + 2];
    }
    r /= 64; g /= 64; b /= 64;
    if (g > 170 && r < 110 && b < 110) return f;
  }
  return null;
}

// ── 3. Encuadre ──────────────────────────────────────────────────────
/**
 * De la caja del sujeto al recorte de cámara.
 *
 * Devuelve {z, x, y}: z es cuánto se acerca (1 = cuadro entero) y (x,y) la
 * esquina superior izquierda de la ventana, en coordenadas del .webm.
 */
function encuadreDe(marca) {
  if (!marca.rect) return { z: 1, x: 0, y: 0 };

  // 1. La caja, recortada a lo que de verdad se ve.
  const x0 = Math.max(0, marca.rect.x);
  const y0 = Math.max(0, marca.rect.y);
  const x1 = Math.min(W, marca.rect.x + marca.rect.w);
  const y1 = Math.min(H, marca.rect.y + marca.rect.h);
  if (x1 - x0 < 40 || y1 - y0 < 24) return { z: 1, x: 0, y: 0 };

  // 2. El sujeto: si es enorme, se encuadra su parte de arriba a la
  //    izquierda, que es por donde se lee.
  const sw = Math.min(x1 - x0, SUJETO.ancho);
  const sh = Math.min(y1 - y0, SUJETO.alto);
  const cx = x0 + sw / 2;
  const cy = y0 + sh / 2;

  // 3. Cuánto acercarse para que entre con aire.
  const pedida = typeof marca.escalaPedida === "number" ? marca.escalaPedida : null;
  const z = pedida ?? Math.max(1, Math.min(TOPE_ESCALA,
    Math.min(W / Math.max(120, sw * 1.34), H / Math.max(90, sh * 1.45))));

  const vw = W / z, vh = H / z;
  return {
    z,
    x: Math.round(Math.max(0, Math.min(W - vw, cx - vw / 2))),
    y: Math.round(Math.max(0, Math.min(H - vh, cy - vh * ALTURA_SUJETO))),
  };
}

/** Interpolación suave (smoothstep) sobre los fotogramas de salida. */
const suave = (fotogramas) => {
  const p = `clip(on/${Math.max(1, Math.round(fotogramas))},0,1)`;
  return `(${p}*${p}*(3-2*${p}))`;
};

/**
 * El movimiento de cámara del plano, como expresiones de zoompan.
 *
 * Acercamiento rápido (0.34 s) y después quieto: así se lee como un corte con
 * intención y no como una animación. Un movimiento lento y largo, además,
 * delata el salto de píxel entero que hace zoompan.
 */
function movimiento({ z, x, y }, dur) {
  if (z <= 1.001) {
    // Plano general: empuje lento durante todo el plano. Sin esto la pieza
    // tiene planos completamente muertos, que es de lo que se quejaba.
    const e = suave(dur * FPS);
    const zexp = `1+${(DERIVA - 1).toFixed(4)}*${e}`;
    return { z: zexp, x: `(iw-iw/zoom)/2`, y: `(ih-ih/zoom)/2` };
  }
  const zIni = Math.max(1, z / 1.11);
  const e = suave(PUNCH * FPS);
  const zexp = `${zIni.toFixed(4)}+${(z - zIni).toFixed(4)}*${e}`;
  // El centro se mantiene fijo y la ventana crece/decrece alrededor.
  const cx = (x + (W / z) / 2).toFixed(1);
  const cy = (y + (H / z) / 2).toFixed(1);
  return {
    z: zexp,
    x: `max(0,min(iw-iw/zoom,${cx}-(iw/zoom)/2))`,
    y: `max(0,min(ih-ih/zoom,${cy}-(ih/zoom)/2))`,
  };
}

// ── 4. Los textos ────────────────────────────────────────────────────
rmSync(TMP_TEXTO, { recursive: true, force: true });

const piezas = [];
partes.forEach((parte, i) => {
  parte.planos.forEach((m, j) => {
    if (!m.rotulo && !m.texto) return;
    m.__texto = `t-${i}-${j}.png`;
    piezas.push({ tipo: "cartel", archivo: m.__texto, rotulo: m.rotulo, texto: m.texto, sello: m.sello });
  });
});

// Placas: la de capítulo 2 y el cierre. La de apertura no va — el plano aéreo
// con el logo ya abre, y dos pantallas de título seguidas matan el arranque.
const PLACAS = {
  capitulo2: {
    tipo: "placa", archivo: "placa-cap2.png", rotulo: "Capítulo 2",
    titulo: "Oportunidades",
    texto: "El tablero donde las empresas publican lo que necesitan.",
    dur: 1.5,
  },
  cierre: {
    tipo: "placa", archivo: "placa-cierre.png", rotulo: "UIAB Conecta",
    titulo: "Ya sabés moverte",
    texto: "Entrá, buscá y conectá con el parque industrial de Almirante Brown.",
    dur: 2.2,
  },
};
piezas.push(...Object.values(PLACAS));

console.log(`  · rasterizando ${piezas.length} textos`);
await rasterizar(piezas, { destino: TMP_TEXTO });

// ── 5. Armar cada plano ──────────────────────────────────────────────
/** Un plano ya compuesto: pantalla encuadrada + texto + marco. */
function armarPlano(fuente, marca, { desde, dur }, salida) {
  const enc = encuadreDe(marca);
  const mov = movimiento(enc, dur);
  const durSalida = dur; // el setpts ya se aplicó al recortar

  const entradas = [
    "-ss", desde.toFixed(3), "-t", dur.toFixed(3), "-i", fuente,
    "-loop", "1", "-framerate", String(FPS), "-i", join(TMP_TEXTO, marca.__texto ?? PLACAS.cierre.archivo),
    "-loop", "1", "-framerate", String(FPS), "-i", "assets/marco.png",
  ];

  const salidaTexto = Math.max(0.1, durSalida - TEXTO.sale);
  const p = `clip((t-${TEXTO.entra})/${TEXTO.entrada},0,1)`;
  const subir = `${TEXTO.sube}*pow(1-${p},3)`;

  const cadena = [
    `[0:v]fps=${FPS},zoompan=z='${mov.z}':x='${mov.x}':y='${mov.y}':d=1:s=${PANT.w}x${PANT.h}:fps=${FPS},setsar=1[pant]`,
    `color=c=${FONDO}:s=${W}x${H}:r=${FPS}[bg]`,
    `[bg][pant]overlay=${PANT.x}:${PANT.y}:shortest=1[conpant]`,
    marca.__texto
      ? `[1:v]format=rgba,fade=t=in:st=${TEXTO.entra}:d=${TEXTO.entrada}:alpha=1,`
        + `fade=t=out:st=${salidaTexto.toFixed(2)}:d=${TEXTO.sale}:alpha=1[txt]`
      : null,
    marca.__texto
      ? `[conpant][txt]overlay=0:'${subir}':shortest=1[contxt]`
      : null,
    `[${marca.__texto ? "contxt" : "conpant"}][2:v]overlay=0:0:shortest=1,format=yuv420p[out]`,
  ].filter(Boolean).join(";");

  ff([...entradas, "-filter_complex", cadena, "-map", "[out]",
      "-t", durSalida.toFixed(3), "-an", ...X264, salida]);
}

/** Placa a cuadro completo, con entrada y salida en fundido. */
function armarPlaca(placa, salida) {
  const d = placa.dur;
  ff([
    "-loop", "1", "-framerate", String(FPS), "-t", d.toFixed(2),
    "-i", join(TMP_TEXTO, placa.archivo),
    "-vf", `fade=t=in:st=0:d=0.3,fade=t=out:st=${(d - 0.3).toFixed(2)}:d=0.3,format=yuv420p`,
    "-an", ...X264, salida,
  ]);
}

/** Plano aéreo con el logo compuesto encima. */
function armarBookend(plano, cual, salida) {
  const total = duracion(plano.archivo);
  const dur = Math.min(plano.dur, total ?? plano.dur);
  const desde = plano.anclaje === "final" && total ? Math.max(0, total - dur) : 0;

  const conLogo = ["ambos", cual].includes(DONDE_LOGO);
  const base = `scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,`
    + `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${FONDO},fps=${FPS}`;

  // El fundido a navy en el empalme con la pieza: como el marco TIENE ese
  // fondo, el corte no parpadea. Antes se pasaba del cielo del dron a una
  // pantalla blanca y quedaba un flash de casi un segundo.
  const haciaLaPieza = cual === "apertura"
    ? `,fade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4:color=${FONDO}`
    : `,fade=t=in:st=0:d=0.4:color=${FONDO}`;

  if (!conLogo) {
    ff(["-ss", String(desde), "-t", String(dur), "-i", plano.archivo,
        "-vf", `${base}${haciaLaPieza},format=yuv420p`, "-an", ...X264, salida]);
    return dur;
  }

  // El logo se compone acá y NO se le pide al modelo: la IA deforma cualquier
  // logotipo. Sale del SVG del sitio vía logo.mjs, así que es exactamente el
  // mismo que usa la app.
  const entra = cual === "apertura" ? 0.7 : 0.8;
  const sale = cual === "apertura" ? `,fade=t=out:st=${(dur - 0.75).toFixed(2)}:d=0.4:alpha=1` : "";
  ff([
    "-ss", String(desde), "-t", String(dur), "-i", plano.archivo,
    "-framerate", String(FPS), "-loop", "1", "-i", LOGO,
    "-filter_complex",
    `[0:v]${base},eq=brightness=-0.06:saturation=1.05[v];`
    + `[1:v]scale=${LOGO_ANCHO}:-1,format=rgba,`
    + `fade=t=in:st=${entra}:d=0.5:alpha=1${sale}[l];`
    + `[v][l]overlay=(W-w)/2:(H-h)/2:shortest=1${haciaLaPieza},format=yuv420p[o]`,
    "-map", "[o]", "-t", String(dur), "-an", ...X264, salida,
  ]);
  return dur;
}

// ── 6. Recorrer el libreto ───────────────────────────────────────────
const segmentos = [];

// Velocidad global para llegar a un objetivo de duración, si se pidió.
const brutoUtil = partes.reduce(
  (a, p) => a + p.planos.reduce((b, m) => b + (m.tOut - m.tIn) / 1000 / (m.velocidad || 1), 0), 0);
let ritmo = 1;
if (OBJETIVO) {
  const bookends = SIN_BOOKENDS ? 0 : APERTURA.dur + CIERRE.dur;
  const placas = PLACAS.capitulo2.dur + PLACAS.cierre.dur;
  ritmo = Math.max(1, Math.min(1.6, brutoUtil / Math.max(4, OBJETIVO - bookends - placas)));
  console.log(`▸ Objetivo ${OBJETIVO}s · útil ${brutoUtil.toFixed(1)}s → ritmo ${ritmo.toFixed(2)}×`);
}

if (!SIN_BOOKENDS && existsSync(APERTURA.archivo)) {
  const dst = join(TMP, "s000-apertura.mp4");
  const d = armarBookend(APERTURA, "apertura", dst);
  segmentos.push({ archivo: dst, dur: d, nombre: "apertura (dron)" });
  console.log(`  · apertura → ${d.toFixed(1)}s`);
}

let n = 0;
for (let i = 0; i < partes.length; i++) {
  const parte = partes[i];

  if (i === 1) {
    const dst = join(TMP, `s${String(++n).padStart(3, "0")}-placa2.mp4`);
    armarPlaca(PLACAS.capitulo2, dst);
    segmentos.push({ archivo: dst, dur: PLACAS.capitulo2.dur, nombre: "placa · Oportunidades" });
  }

  const fuente = normalizarPasada(parte, i);
  const fClaqueta = fotogramaClaqueta(fuente);
  if (fClaqueta === null) {
    console.log(`  ⚠ ${parte.nombre}: no encontré la claqueta. Uso el reloj crudo`);
    console.log("     (los textos pueden entrar corridos: volvé a grabar).");
  }
  const t0 = (fClaqueta ?? 0) / FPS;

  for (const m of parte.planos) {
    if (SOLO && m.id !== SOLO) continue;
    const vel = (m.velocidad || 1) * ritmo;
    const desde = t0 + (m.tIn - parte.claqueta) / 1000;
    const bruto = (m.tOut - m.tIn) / 1000;
    const dur = bruto / vel;

    // El recorte y la aceleración se hacen en un paso aparte: zoompan sobre
    // un stream ya retimado se lleva mal con setpts en la misma cadena.
    const trozo = join(TMP, `crudo-${i}-${m.id}.mp4`);
    ff(["-ss", desde.toFixed(3), "-t", bruto.toFixed(3), "-i", fuente,
        "-vf", vel !== 1 ? `setpts=PTS/${vel.toFixed(4)},fps=${FPS}` : `fps=${FPS}`,
        "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", trozo]);

    const dst = join(TMP, `s${String(++n).padStart(3, "0")}-${m.id}.mp4`);
    armarPlano(trozo, m, { desde: 0, dur }, dst);
    const real = duracion(dst) ?? dur;
    segmentos.push({ archivo: dst, dur: real, nombre: m.id });
    const enc = encuadreDe(m);
    console.log(`  · ${m.id.padEnd(14)} ${real.toFixed(1)}s  zoom ${enc.z.toFixed(2)}×`
      + (vel !== 1 ? `  ${vel.toFixed(2)}× rápido` : ""));
  }
}

if (!SOLO) {
  const dst = join(TMP, `s${String(++n).padStart(3, "0")}-placa-cierre.mp4`);
  armarPlaca(PLACAS.cierre, dst);
  segmentos.push({ archivo: dst, dur: PLACAS.cierre.dur, nombre: "placa · cierre" });
}

if (!SIN_BOOKENDS && !SOLO && existsSync(CIERRE.archivo)) {
  const dst = join(TMP, "s999-cierre.mp4");
  const d = armarBookend(CIERRE, "cierre", dst);
  segmentos.push({ archivo: dst, dur: d, nombre: "cierre (dron)" });
  console.log(`  · cierre → ${d.toFixed(1)}s`);
}

if (!segmentos.length) throw new Error("No quedó ningún segmento para montar.");

// ── 7. Encadenar ─────────────────────────────────────────────────────
// Cortes secos entre planos: es lo que da el ritmo. Los únicos fundidos son
// contra el navy (bookends y placas), y ese fundido ya viene hecho adentro de
// cada segmento, así que todo se puede pegar sin recodificar.
const lista = join(TMP, "lista.txt");
writeFileSync(lista, segmentos.map((s) => `file '${s.archivo.replace(/'/g, "'\\''")}'`).join("\n"));

const encadenado = join(TMP, "encadenado.mp4");
ff(["-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", encadenado]);

const total = duracion(encadenado) ?? segmentos.reduce((a, s) => a + s.dur, 0);
console.log(`▸ ${segmentos.length} segmentos → ${total.toFixed(1)}s`);

// ── 8. Música y empaquetado ──────────────────────────────────────────
const comunes = [
  "-c:v", "libx264", "-preset", "slow", "-crf", "19",
  "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
  "-movflags", "+faststart",
];

if (MUSICA && existsSync(MUSICA)) {
  const salidaFade = Math.max(0, total - 2.5);
  // loudnorm en vez de un volumen fijo: lleva cualquier MP3 al mismo loudness
  // percibido (-16 LUFS, el estándar de video web) con el pico bajo control.
  ff([
    "-i", encadenado, "-stream_loop", "-1", "-i", MUSICA,
    "-filter_complex",
    // `aformat` y no `aresample=48000`: con ffmpeg 7 el aresample pelado no
    // logra negociar el layout de canales con el encoder y la corrida muere
    // con "Cannot select channel layout ... Failed to inject frame into filter
    // network". Acá se le dicen los tres parámetros de una.
    `[1:a]loudnorm=I=${LUFS}:TP=-1.5:LRA=11,`
    + `aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,`
    + `afade=t=in:st=0:d=1.2,afade=t=out:st=${salidaFade.toFixed(2)}:d=2.5[a]`,
    "-map", "0:v", "-map", "[a]", "-shortest",
    ...comunes, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", SALIDA,
  ]);
  console.log(`▸ Música: ${MUSICA} · normalizada a ${LUFS} LUFS`);
} else {
  ff(["-i", encadenado, "-an", ...comunes, SALIDA]);
  console.log("▸ Sin música (dejá un MP3 en assets/musica.mp3 y volvé a correr esto)");
}

rmSync(TMP, { recursive: true, force: true });
const dFinal = duracion(SALIDA) ?? total;
console.log(`\n✓ ${SALIDA}`);
console.log(`  ${dFinal.toFixed(1)}s · ${W}x${H} · ${FPS}fps · marco + ${segmentos.length} segmentos`);
