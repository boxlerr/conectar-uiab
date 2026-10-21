// Cuándo dice la voz cada palabra del texto de pantalla. Los subtítulos (y la
// frase de apertura) se encienden palabra por palabra con esto.
//
//   node herramientas/palabras.mjs      → src/palabras.js
//
// Con la voz real: whisper transcribe cada línea con marcas por palabra y se
// alinea contra el `texto` del guion (no contra la transcripción: whisper
// escribe "quit" donde la voz dice CUIT). Las palabras que no encuentran pareja
// —números, siglas— toman el tiempo interpolado entre sus vecinas. Sin voz
// real (VOZ=audio/voz-prov) reparte la línea en proporción a las letras.

import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const guion = JSON.parse(await readFile(path.join(raiz, 'guion.json'), 'utf8'))
const VOZ = process.env.VOZ ?? 'audio/voz'
const durs = JSON.parse(await readFile(path.join(raiz, VOZ, 'duraciones.json'), 'utf8'))
const MODELO = path.join(os.homedir(), 'whisper-models/ggml-large-v3-turbo.bin')
const conWhisper = VOZ === 'audio/voz' && existsSync(MODELO)

const normal = (s) => s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const letras = (s) => Math.max(1, s.replace(/[^\p{L}\p{N}]/gu, '').length)

function proporcional(palabras, dur) {
  const total = palabras.reduce((a, w) => a + letras(w) + 1.5, 0)
  let t = 0.05
  const util = Math.max(0.1, dur - 0.15)
  return palabras.map((w) => {
    const d = ((letras(w) + 1.5) / total) * util
    const out = { w, t0: +t.toFixed(3), t1: +(t + d).toFixed(3) }
    t += d
    return out
  })
}

/** Palabras de whisper con sus tiempos (s desde el inicio de la línea). */
function oir(wav, dir) {
  const base = path.join(dir, 'w')
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-ar', '16000', '-ac', '1', `${base}.wav`])
  execFileSync('whisper-cli', ['-m', MODELO, '-l', 'es', '-ml', '1', '-sow', '-oj', '-of', base, '-f', `${base}.wav`, '--no-prints'], { stdio: 'ignore' })
  const j = JSON.parse(execFileSync('cat', [`${base}.json`]).toString())
  return j.transcription
    .map((s) => ({ w: s.text.trim(), t0: s.offsets.from / 1000, t1: s.offsets.to / 1000 }))
    .filter((s) => normal(s.w))
}

/** Alineación de dos listas de palabras (Needleman–Wunsch). */
function alinear(a, b) {
  const A = a.map(normal)
  const B = b.map((x) => normal(x.w))
  const sim = (x, y) => (x === y ? 3 : x.length > 2 && y.length > 2 && (x.startsWith(y.slice(0, 3)) || y.startsWith(x.slice(0, 3))) ? 1 : -2)
  const n = A.length
  const m = B.length
  const S = Array.from({ length: n + 1 }, () => new Float64Array(m + 1))
  for (let i = 1; i <= n; i++) S[i][0] = -i
  for (let j = 1; j <= m; j++) S[0][j] = -j
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) S[i][j] = Math.max(S[i - 1][j - 1] + sim(A[i - 1], B[j - 1]), S[i - 1][j] - 1, S[i][j - 1] - 1)
  const par = new Array(n).fill(-1)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (S[i][j] === S[i - 1][j - 1] + sim(A[i - 1], B[j - 1])) {
      if (sim(A[i - 1], B[j - 1]) > 0) par[i - 1] = j - 1
      i--; j--
    } else if (S[i][j] === S[i - 1][j] - 1) i--
    else j--
  }
  return par
}

const out = {}
const dir = conWhisper ? await mkdtemp(path.join(os.tmpdir(), 'palabras-')) : null
for (const esc of guion.escenas) {
  for (const ln of esc.lineas) {
    const palabras = ln.texto.split(/\s+/).filter(Boolean)
    const dur = durs[ln.id]
    if (!conWhisper) { out[ln.id] = proporcional(palabras, dur); continue }
    const oidas = oir(path.join(raiz, VOZ, `${ln.id}.wav`), dir)
    const par = alinear(palabras, oidas)
    const t0s = par.map((j) => (j >= 0 ? oidas[j].t0 : null))
    // Interpolar las que no encontraron pareja entre las vecinas que sí.
    for (let i = 0; i < t0s.length; i++) {
      if (t0s[i] != null) continue
      let a = i - 1
      while (a >= 0 && t0s[a] == null) a--
      let b = i + 1
      while (b < t0s.length && t0s[b] == null) b++
      const ta = a >= 0 ? t0s[a] : 0
      const tb = b < t0s.length ? t0s[b] : dur
      const ia = a >= 0 ? a : -1
      t0s[i] = ta + ((tb - ta) * (i - ia)) / (b - ia)
    }
    for (let i = 1; i < t0s.length; i++) if (t0s[i] < t0s[i - 1]) t0s[i] = t0s[i - 1]
    out[ln.id] = palabras.map((w, i) => ({ w, t0: +t0s[i].toFixed(3), t1: +(i < palabras.length - 1 ? t0s[i + 1] : dur).toFixed(3) }))
    const sin = par.filter((j) => j < 0).length
    console.log(`${ln.id.padEnd(4)} ${palabras.length} palabras · ${sin} interpoladas · «${oidas.map((o) => o.w).join(' ')}»`)
  }
}
if (dir) await rm(dir, { recursive: true, force: true })
await writeFile(path.join(raiz, 'src/palabras.js'), `// Generado por herramientas/palabras.mjs — no editar a mano.\n// Tiempos en s desde que empieza cada línea.\nexport const PALABRAS = ${JSON.stringify(out)}\n`)
console.log(`src/palabras.js · ${Object.keys(out).length} líneas · ${conWhisper ? 'whisper' : 'proporcional'}`)
