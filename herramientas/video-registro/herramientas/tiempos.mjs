// Línea de tiempo: la voz manda. Lee guion.json + audio/voz/duraciones.json y
// escribe src/linea.js (cuándo empieza cada escena y cada línea) y
// audio/voz.wav (toda la narración en su lugar, 48 kHz mono).
//
//   node herramientas/tiempos.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const guion = JSON.parse(await readFile(path.join(raiz, 'guion.json'), 'utf8'))
const VOZ = process.env.VOZ ?? 'audio/voz'
const durs = JSON.parse(await readFile(path.join(raiz, VOZ, 'duraciones.json'), 'utf8'))

const ENTRE_LINEAS = 0.5
const FIN_DE_ESCENA = 0.75
const SR = 48000
// 96 BPM: cada escena arranca en un tiempo, así los golpes de la música caen en los cortes
export const BPM = 96
const BEAT = 60 / BPM

let t = 0
const escenas = []
const L = {}
for (const e of guion.escenas) {
  t = Math.ceil(t / BEAT - 1e-6) * BEAT
  const esc = { id: e.id, area: e.area ?? null, desde: +t.toFixed(3), lineas: [] }
  t += e.antes ?? 0.6
  for (const [i, ln] of e.lineas.entries()) {
    const d = durs[ln.id]
    if (d == null) throw new Error(`falta la voz de ${ln.id}`)
    const muestras = leerWav(await readFile(path.join(raiz, VOZ, `${ln.id}.wav`)))
    const frases = frasesDe(ln, muestras, d).map((x) => +(t + x).toFixed(3))
    const linea = { id: ln.id, texto: ln.texto, t0: +t.toFixed(3), t1: +(t + d).toFixed(3), frases }
    esc.lineas.push(linea)
    L[ln.id] = linea
    const ultima = i === e.lineas.length - 1
    t += d + (ln.despues ?? (ultima ? FIN_DE_ESCENA : ENTRE_LINEAS))
  }
  t = Math.ceil(t / BEAT - 1e-6) * BEAT
  esc.hasta = +t.toFixed(3)
  escenas.push(esc)
}
const DURACION = +t.toFixed(3)

await writeFile(
  path.join(raiz, 'src/linea.js'),
  `// Generado por herramientas/tiempos.mjs — no editar a mano.\n` +
    `export const FPS = 60\nexport const BPM = ${BPM}\nexport const BEAT = 60 / BPM\nexport const DURACION = ${DURACION}\n` +
    `export const ESCENAS = ${JSON.stringify(escenas, null, 1)}\n` +
    `export const L = Object.fromEntries(ESCENAS.flatMap((e) => e.lineas.map((l) => [l.id, l])))\n` +
    `export const E = Object.fromEntries(ESCENAS.map((e) => [e.id, e]))\n`,
)

/**
 * Dónde arranca cada frase de una línea (en s desde que empieza), para que las
 * escenas puedan engancharse a «y el viaje cae solo…» sin depender de cómo
 * respira cada motor de voz. Las frases se marcan en el guion (`cortes`: las
 * palabras con que arranca cada una). Su lugar se estima por la proporción de
 * letras que hay antes, y se ajusta al silencio real más cercano (±0,8 s).
 */
function frasesDe(ln, m, dur) {
  const out = [0]
  const cortes = ln.cortes ?? []
  if (cortes.length === 0) return out
  const letras = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').length
  const total = letras(ln.voz)
  const huecos = silencios(m)
  let desde = 0
  for (const c of cortes) {
    const i = ln.voz.indexOf(c, desde)
    if (i < 0) throw new Error(`${ln.id}: no encuentro «${c}» en la voz`)
    desde = i + c.length
    const estimado = (letras(ln.voz.slice(0, i)) / total) * dur
    let mejor = null
    for (const [, fin] of huecos) {
      const dist = Math.abs(fin - estimado)
      if (dist <= 0.8 && (!mejor || dist < mejor.dist)) mejor = { t: fin - 0.03, dist }
    }
    let x = mejor ? mejor.t : estimado
    const previo = out[out.length - 1]
    if (x <= previo + 0.25) x = Math.max(estimado, previo + 0.3)
    out.push(x)
  }
  return out
}

/** Los silencios de al menos 60 ms adentro de una línea: [inicio, fin] en s. */
function silencios(m, umbral = 0.012, minimo = 0.06) {
  const out = []
  const n = Math.round(minimo * SR)
  let quieto = 0
  for (let i = 0; i < m.length; i++) {
    if (Math.abs(m[i]) < umbral) quieto++
    else {
      if (quieto >= n && i - quieto > SR * 0.2) out.push([(i - quieto) / SR, i / SR])
      quieto = 0
    }
  }
  return out
}

// ── voz.wav ────────────────────────────────────────────────────────────────
function leerWav(buf) {
  let p = 12
  let fmt = null
  while (p < buf.length) {
    const id = buf.toString('ascii', p, p + 4)
    const tam = buf.readUInt32LE(p + 4)
    if (id === 'fmt ') fmt = { canales: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) }
    if (id === 'data') {
      if (!fmt || fmt.bits !== 16 || fmt.canales !== 1 || fmt.sr !== SR) throw new Error('se esperaba 48 kHz mono 16 bit')
      const n = tam / 2
      const out = new Float32Array(n)
      for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(p + 8 + i * 2) / 32768
      return out
    }
    p += 8 + tam + (tam % 2)
  }
  throw new Error('wav sin datos')
}
function escribirWav(muestras) {
  const n = muestras.length
  const b = Buffer.alloc(44 + n * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8)
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34)
  b.write('data', 36); b.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(muestras[i] * 32767))), 44 + i * 2)
  return b
}
const voz = new Float32Array(Math.ceil(DURACION * SR) + SR)
for (const ln of Object.values(L)) {
  const m = leerWav(await readFile(path.join(raiz, VOZ, `${ln.id}.wav`)))
  const o = Math.round(ln.t0 * SR)
  for (let i = 0; i < m.length; i++) voz[o + i] += m[i]
}
await writeFile(path.join(raiz, 'audio/voz.wav'), escribirWav(voz))

for (const e of escenas) console.log(`${e.id.padEnd(12)} ${e.desde.toFixed(2).padStart(7)} → ${e.hasta.toFixed(2).padStart(7)}  (${(e.hasta - e.desde).toFixed(1)} s)`)
console.log(`DURACION ${DURACION} s = ${Math.floor(DURACION / 60)}:${String(Math.round(DURACION % 60)).padStart(2, '0')}`)
