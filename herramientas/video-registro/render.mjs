// Render: Chromium sin cabeza dibuja cada instante con window.__render(t) y
// cada proceso le pasa sus cuadros a su propio ffmpeg por un caño (no se
// guardan JPG en disco). Después se pegan los tramos y se suma la mezcla.
//
//   node render.mjs                       video completo
//   node render.mjs --stills 3,17.5,42    cuadros sueltos → renders/stills/
//   node render.mjs --desde 38 --hasta 65 un tramo → renders/tramos/
//   node render.mjs --sub 1               sin desenfoque de movimiento (más rápido)
//   node render.mjs --fps 30 --workers 6

import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, mkdir, rm, writeFile, stat, copyFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { DURACION } from './src/linea.js'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')
const lanzar = () => chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : existsSync(CACHE) ? { executablePath: CACHE } : {})
const args = process.argv.slice(2)
const opt = (nombre, def) => {
  const i = args.indexOf(`--${nombre}`)
  if (i < 0) return def
  const v = args[i + 1]
  return v === undefined || v.startsWith('--') ? true : v
}
const FPS = Number(opt('fps', 60))
const WORKERS = Number(opt('workers', Math.max(2, Math.min(7, os.cpus().length - 3))))
const SUB = Number(opt('sub', 2))
const OBTURADOR = 0.5
const CALIDAD = Number(opt('calidad', 92))

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.json': 'application/json', '.svg': 'image/svg+xml' }
function servir() {
  return new Promise((ok) => {
    const srv = createServer(async (req, res) => {
      try {
        const ruta = path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname))
        if (!ruta.startsWith(raiz)) throw new Error('fuera')
        const datos = await readFile(ruta)
        res.writeHead(200, { 'content-type': TIPOS[path.extname(ruta)] || 'application/octet-stream', 'cache-control': 'max-age=3600' })
        res.end(datos)
      } catch {
        res.writeHead(404)
        res.end()
      }
    })
    srv.listen(0, '127.0.0.1', () => ok(srv))
  })
}

async function abrirPagina(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('  [pagina]', e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.error('  [consola]', m.text()) })
  await page.goto(url)
  await page.waitForFunction(() => window.__listo !== undefined)
  await page.evaluate(() => window.__listo)
  return page
}

function proceso(cmd, argumentos, { entrada = false } = {}) {
  const p = spawn(cmd, argumentos, { stdio: [entrada ? 'pipe' : 'ignore', 'inherit', 'inherit'] })
  p.fin = new Promise((ok, mal) => p.on('close', (c) => (c === 0 ? ok() : mal(new Error(`${cmd} salió con ${c}`)))))
  return p
}
const ffmpeg = (a) => proceso('ffmpeg', ['-v', 'error', '-y', ...a]).fin

const srv = await servir()
const url = `http://127.0.0.1:${srv.address().port}/src/index.html?render=1`
const t0 = Date.now()

// ── Cuadros sueltos ─────────────────────────────────────────────────────────
if (opt('stills')) {
  const tiempos = String(opt('stills')).split(',').map(Number)
  const dir = path.join(raiz, 'renders', 'stills')
  await mkdir(dir, { recursive: true })
  const browser = await lanzar()
  const page = await abrirPagina(browser, url)
  for (const t of tiempos) {
    const f = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`)
    await page.evaluate((tt) => window.__render(tt), t)
    await page.screenshot({ path: f })
    console.log(`still ${t.toFixed(2)} s → ${path.relative(raiz, f)}`)
  }
  await browser.close()
  srv.close()
  process.exit(0)
}

// ── Video ───────────────────────────────────────────────────────────────────
const desde = Number(opt('desde', 0))
const hasta = Math.min(DURACION, Number(opt('hasta', DURACION)))
const tramo = desde > 0 || hasta < DURACION
const f0 = Math.round(desde * FPS)
const f1 = Math.round(hasta * FPS)
const total = (f1 - f0) * SUB
const dirTrabajo = path.join(raiz, 'renders', `trabajo-${process.pid}`)
await mkdir(dirTrabajo, { recursive: true })
console.log(`render ${desde}–${hasta.toFixed(2)} s · ${f1 - f0} cuadros a ${FPS} fps × ${SUB} · ${WORKERS} procesos`)

const filtro = SUB > 1
  ? `tmix=frames=${SUB}:weights='${Array(SUB).fill(1).join(' ')}',select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)`
  : `setpts=N/(${FPS}*TB)`

let hechos = 0
let ultimoLog = 0
const bloques = Array.from({ length: WORKERS }, (_, i) => [f0 + Math.floor((i * (f1 - f0)) / WORKERS), f0 + Math.floor(((i + 1) * (f1 - f0)) / WORKERS)])
const tramos = await Promise.all(
  bloques.map(async ([a, b], w) => {
    const salida = path.join(dirTrabajo, `tramo-${String(w).padStart(2, '0')}.mp4`)
    if (b <= a) return null
    const ff = proceso('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-c:v', 'mjpeg', '-i', '-',
      '-vf', `${filtro},format=yuv420p`, '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-g', String(FPS * 2), salida], { entrada: true })
    const browser = await lanzar()
    const page = await abrirPagina(browser, url)
    for (let f = a; f < b; f++) {
      for (let k = 0; k < SUB; k++) {
        const t = (f + (SUB > 1 ? (k / SUB) * OBTURADOR : 0)) / FPS
        await page.evaluate((tt) => window.__render(tt), Math.max(0, t))
        const buf = await page.screenshot({ type: 'jpeg', quality: CALIDAD })
        if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once('drain', ok))
        hechos++
        if (Date.now() - ultimoLog > 5000) {
          ultimoLog = Date.now()
          const s = (Date.now() - t0) / 1000
          console.log(`  ${hechos}/${total}  ${(hechos / s).toFixed(1)} cuadros/s  faltan ~${Math.round(((total - hechos) * s) / hechos)} s`)
        }
      }
    }
    ff.stdin.end()
    await ff.fin
    await browser.close()
    return salida
  }),
)
srv.close()
console.log(`captura lista en ${((Date.now() - t0) / 1000).toFixed(0)} s`)

// ── Montaje: tramos en orden + mezcla a -15 LUFS ────────────────────────────
const lista = path.join(dirTrabajo, 'lista.txt')
await writeFile(lista, tramos.filter(Boolean).map((t) => `file '${t}'`).join('\n'))
const audio = await normalizar(path.join(raiz, 'audio', 'mezcla.wav'))
const dirSalida = path.join(raiz, 'renders', tramo ? 'tramos' : '')
await mkdir(dirSalida, { recursive: true })
const nombre = tramo ? `tramo-${desde}-${hasta.toFixed(1)}.mp4` : `uiab-registro-${process.pid}.mp4`
const final = path.join(dirSalida, nombre)
await ffmpeg(['-f', 'concat', '-safe', '0', '-i', lista, '-ss', String(desde), '-t', String(hasta - desde), '-i', audio,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final])
await rm(dirTrabajo, { recursive: true, force: true })
const mb = ((await stat(final)).size / 1e6).toFixed(1)
console.log(`listo: ${path.relative(raiz, final)} (${mb} MB) en ${((Date.now() - t0) / 1000).toFixed(0)} s`)

if (!tramo && opt('entregar')) {
  const dir = path.join(os.homedir(), 'Desktop', 'uiab-renders')
  await mkdir(dir, { recursive: true })
  const hoy = new Date().toISOString().slice(0, 10)
  const previos = (await readdir(dir)).map((f) => f.match(/^UIAB Conecta - Cómo sumar tu empresa .* v(\d+)\.mp4$/)).filter(Boolean).map((m) => Number(m[1]))
  const v = Math.max(0, ...previos) + 1
  const destino = path.join(dir, `UIAB Conecta - Cómo sumar tu empresa (${hoy}) v${v}.mp4`)
  await copyFile(final, destino)
  console.log(`entregado: ${destino}`)
  const liviano = destino.replace(/\.mp4$/, ' - liviano.mp4')
  await ffmpeg(['-i', final, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '8M', '-bufsize', '16M', '-r', '30',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', liviano])
  console.log(`entregado: ${liviano} (${((await stat(liviano)).size / 1e6).toFixed(1)} MB)`)
}

/** Loudness en dos pasadas: -15 LUFS integrados, pico real -1,5 dBTP. */
async function normalizar(wav) {
  const medir = await new Promise((ok, mal) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-nostats', '-i', wav, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    let err = ''
    p.stderr.on('data', (d) => { err += d })
    p.on('close', (c) => (c === 0 ? ok(err) : mal(new Error('loudnorm no pudo medir'))))
  })
  const m = JSON.parse(medir.slice(medir.lastIndexOf('{'), medir.lastIndexOf('}') + 1))
  const out = path.join(raiz, 'renders', 'mezcla-15lufs.wav')
  await ffmpeg(['-i', wav, '-af', `loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, '-ar', '48000', out])
  console.log(`audio: ${m.input_i} LUFS → -15 LUFS`)
  return out
}
