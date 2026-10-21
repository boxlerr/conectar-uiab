// Música y mezcla del video, sintetizadas en código.
//
// 96 BPM, Re mayor: D – A – Bm – G (I–V–vi–IV), un acorde por compás. Las
// escenas arrancan en un tiempo (herramientas/tiempos.mjs), así cada barrido y
// cada golpe cae en el corte que lo provoca. La música se agacha sola cuando
// habla la voz (se lee audio/voz.wav).
//
// Los instrumentos son los del reel de Vaxler (vaxler-showreel/audio/sintetizar.mjs).
//
// Uso: node audio/musica.mjs   → audio/musica.wav y audio/mezcla.wav (48 kHz, 24 bit)

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DURACION, ESCENAS, E, L, BEAT } from '../src/linea.js'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const SR = 48000
const N = Math.round(DURACION * SR)
const TAU = Math.PI * 2
const SEMI = BEAT / 4
const COMPAS = BEAT * 4

// ── Azar con semilla ────────────────────────────────────────────────────────
function azar(semilla) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = azar(20260929)
const ruido = () => rnd() * 2 - 1
const hz = (m) => 440 * 2 ** ((m - 69) / 12)

// ── Buses ───────────────────────────────────────────────────────────────────
const bus = () => [new Float32Array(N), new Float32Array(N)]
const B = { bombo: bus(), perc: bus(), bajo: bus(), pad: bus(), arp: bus(), campanas: bus(), fx: bus() }
const REV = bus()
const DEL = bus()

function poner(destino, t, m, { g = 1, pan = 0, rev = 0, del = 0 } = {}) {
  const i0 = Math.round(t * SR)
  const th = ((pan + 1) * Math.PI) / 4
  const gl = Math.cos(th) * Math.SQRT2 * g
  const gr = Math.sin(th) * Math.SQRT2 * g
  const [L, R] = destino
  for (let i = 0; i < m.length; i++) {
    const j = i0 + i
    if (j < 0) continue
    if (j >= N) break
    const v = m[i]
    L[j] += v * gl
    R[j] += v * gr
    if (rev) { REV[0][j] += v * gl * rev; REV[1][j] += v * gr * rev }
    if (del) { DEL[0][j] += v * gl * del; DEL[1][j] += v * gr * del }
  }
}
function ponerE(destino, t, [mL, mR], { g = 1, rev = 0, del = 0 } = {}) {
  const i0 = Math.round(t * SR)
  const [L, R] = destino
  for (let i = 0; i < mL.length; i++) {
    const j = i0 + i
    if (j < 0) continue
    if (j >= N) break
    L[j] += mL[i] * g
    R[j] += mR[i] * g
    if (rev) { REV[0][j] += mL[i] * g * rev; REV[1][j] += mR[i] * g * rev }
    if (del) { DEL[0][j] += mL[i] * g * del; DEL[1][j] += mR[i] * g * del }
  }
}

// ── Piezas de DSP ───────────────────────────────────────────────────────────
class Biquad {
  constructor(tipo, f, q = 0.707) {
    this.tipo = tipo
    this.x1 = this.x2 = this.y1 = this.y2 = 0
    this.set(f, q)
  }
  set(f, q = 0.707) {
    const w0 = (TAU * Math.min(f, SR * 0.45)) / SR
    const c = Math.cos(w0)
    const s = Math.sin(w0)
    const al = s / (2 * q)
    let b0, b1, b2
    if (this.tipo === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2 }
    else if (this.tipo === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2 }
    else { b0 = al; b1 = 0; b2 = -al }
    const a0 = 1 + al
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0
    this.a1 = (-2 * c) / a0; this.a2 = (1 - al) / a0
  }
  p(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y
    return y
  }
}

function sierra(fase, dt) {
  let v = 2 * fase - 1
  if (fase < dt) { const x = fase / dt; v -= x + x - x * x - 1 }
  else if (fase > 1 - dt) { const x = (fase - 1) / dt; v -= x * x + x + x + 1 }
  return v
}

const muestras = (dur) => new Float32Array(Math.round(dur * SR))

// ── Bateria ─────────────────────────────────────────────────────────────────
function bombo(fuerza = 1) {
  const m = muestras(0.55)
  let fase = 0
  const hpc = new Biquad('hp', 2500, 0.7)
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    const f = 47 + 125 * Math.exp(-t / 0.028) + 38 * Math.exp(-t / 0.11)
    fase += (TAU * f) / SR
    const amp = Math.min(1, t / 0.0015) * Math.exp(-t / (0.27 * fuerza))
    const click = hpc.p(ruido()) * Math.exp(-t / 0.0018) * 0.5
    m[i] = Math.tanh(1.7 * (Math.sin(fase) * amp + click)) / Math.tanh(1.7)
  }
  return m
}
function palmas() {
  const m = muestras(0.45)
  const bp = new Biquad('bp', 1150, 0.9)
  const hp = new Biquad('hp', 450, 0.7)
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    let env = 0
    for (const b of [0, 0.011, 0.022]) if (t >= b) env += Math.exp(-(t - b) / 0.0055)
    if (t > 0.03) env += 0.75 * Math.exp(-(t - 0.03) / 0.11)
    m[i] = hp.p(bp.p(ruido())) * env * 1.6
  }
  return m
}
function redoble() {
  const m = muestras(0.2)
  const bp = new Biquad('bp', 2100, 0.7)
  let fase = 0
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    fase += (TAU * 190) / SR
    m[i] = bp.p(ruido()) * Math.exp(-t / 0.075) * 1.4 + Math.sin(fase) * Math.exp(-t / 0.04) * 0.45
  }
  return m
}
function hat(abierto = false) {
  const m = muestras(abierto ? 0.35 : 0.08)
  const hp = new Biquad('hp', 7600, 0.8)
  const bp = new Biquad('bp', 10500, 1.2)
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    const x = ruido()
    m[i] = (hp.p(x) * 0.7 + bp.p(x) * 0.8) * Math.exp(-t / (abierto ? 0.16 : 0.028))
  }
  return m
}
function platillo(dur = 2.6) {
  const L = muestras(dur)
  const R = muestras(dur)
  for (const [m, sem] of [[L, 1], [R, 2]]) {
    const hp = new Biquad('hp', 3800, 0.6)
    const bp = new Biquad('bp', 7000, 0.5)
    const r = azar(sem * 991)
    for (let i = 0; i < m.length; i++) {
      const t = i / SR
      const x = r() * 2 - 1
      m[i] = (hp.p(x) * 0.8 + bp.p(x) * 0.6) * Math.min(1, t / 0.002) * Math.exp(-t / 0.75)
    }
  }
  return [L, R]
}
function impacto() {
  const m = muestras(2.6)
  let fase = 0
  const lp = new Biquad('lp', 260, 0.7)
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    const f = 30 + 34 * Math.exp(-t / 0.35)
    fase += (TAU * f) / SR
    const cuerpo = Math.sin(fase) * Math.min(1, t / 0.003) * Math.exp(-t / 0.62)
    const golpe = lp.p(ruido()) * Math.exp(-t / 0.22) * 1.2
    m[i] = Math.tanh(1.8 * (cuerpo + golpe)) * 0.9
  }
  return m
}
function caidaSub(dur = 1.4) {
  const m = muestras(dur)
  let fase = 0
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    const f = 28 + 62 * Math.exp(-t / 0.35)
    fase += (TAU * f) / SR
    m[i] = Math.sin(fase) * Math.min(1, t / 0.01) * Math.exp(-t / 0.55)
  }
  return m
}

// ── Efectos ─────────────────────────────────────────────────────────────────
/** Subida: ruido con banda que asciende + un tono que sube. */
function subida(dur, f0 = 280, f1 = 7000, tono = true) {
  const L = muestras(dur)
  const R = muestras(dur)
  const bl = new Biquad('bp', f0, 1.1)
  const br = new Biquad('bp', f0, 1.1)
  let fase = 0
  for (let i = 0; i < L.length; i++) {
    const t = i / SR
    const q = t / dur
    const f = f0 * (f1 / f0) ** q
    if (i % 32 === 0) { bl.set(f, 1.1); br.set(f * 1.03, 1.1) }
    const env = q ** 2.2
    fase += (TAU * (170 * (5.2 ** q)) * (1 + 0.004 * Math.sin(t * 30))) / SR
    const ton = tono ? Math.sin(fase) * 0.12 * env : 0
    L[i] = bl.p(ruido()) * env * 1.4 + ton
    R[i] = br.p(ruido()) * env * 1.4 + ton
  }
  return [L, R]
}
/** Barrido de aire: pasa de un lado al otro. */
function whoosh(dur, f0 = 500, f1 = 3200, pan0 = -0.6, pan1 = 0.6) {
  const L = muestras(dur)
  const R = muestras(dur)
  const b = new Biquad('bp', f0, 0.9)
  for (let i = 0; i < L.length; i++) {
    const q = i / L.length
    if (i % 32 === 0) b.set(f0 * (f1 / f0) ** q, 0.9)
    const env = Math.sin(Math.PI * q ** 0.75) ** 2
    const v = b.p(ruido()) * env * 1.5
    const pan = pan0 + (pan1 - pan0) * q
    const th = ((pan + 1) * Math.PI) / 4
    L[i] = v * Math.cos(th) * Math.SQRT2
    R[i] = v * Math.sin(th) * Math.SQRT2
  }
  return [L, R]
}
function platilloInverso(dur) {
  const [L, R] = platillo(dur)
  const n = L.length
  const oL = muestras(dur)
  const oR = muestras(dur)
  for (let i = 0; i < n; i++) {
    const env = (i / n) ** 1.6
    oL[i] = L[n - 1 - i] * env
    oR[i] = R[n - 1 - i] * env
  }
  return [oL, oR]
}
function tecla(sem) {
  const r = azar(sem)
  const m = muestras(0.06)
  const bp = new Biquad('bp', 2600 + r() * 2200, 2.2)
  let fase = 0
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    fase += (TAU * (150 + r() * 0)) / SR
    m[i] = bp.p(ruido()) * Math.exp(-t / 0.0045) * 2.2 + Math.sin(fase) * Math.exp(-t / 0.012) * 0.35
  }
  return m
}
function blip(f, dur = 0.14) {
  const m = muestras(dur)
  let fase = 0
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    fase += (TAU * f * (1 + 0.35 * Math.exp(-t / 0.008))) / SR
    m[i] = Math.sin(fase) * Math.min(1, t / 0.001) * Math.exp(-t / 0.045)
  }
  return m
}
/** Campana FM: modulador inarmonico con indice que decae. */
function campana(f, dur = 1.6, brillo = 3) {
  const m = muestras(dur)
  let fc = 0
  let fm = 0
  for (let i = 0; i < m.length; i++) {
    const t = i / SR
    fm += (TAU * f * 3.5) / SR
    const I = brillo * Math.exp(-t / 0.18)
    fc += (TAU * f) / SR
    m[i] = (Math.sin(fc + I * Math.sin(fm)) * 0.8 + Math.sin(fc * 2) * 0.12 * Math.exp(-t / 0.3)) * Math.min(1, t / 0.002) * Math.exp(-t / 0.55)
  }
  return m
}
function glitch(sem) {
  const r = azar(sem)
  const m = muestras(0.03)
  const f = 700 + r() * 2600
  let fase = 0
  let hold = 0
  let v = 0
  const paso = 5 + Math.floor(r() * 10)
  for (let i = 0; i < m.length; i++) {
    fase += f / SR
    if (i % paso === 0) hold = (fase % 1 < 0.5 ? 1 : -1) * (0.6 + 0.4 * r())
    v = Math.round(hold * 4) / 4
    m[i] = v * Math.exp(-i / SR / 0.009) * 0.5
  }
  return m
}
function chasquidoDatos(sem) {
  const r = azar(sem)
  const m = muestras(0.012)
  const hp = new Biquad('hp', 5000 + r() * 4000, 0.7)
  for (let i = 0; i < m.length; i++) m[i] = hp.p(ruido()) * Math.exp(-i / SR / 0.0016)
  return m
}

// ── Instrumentos con altura ─────────────────────────────────────────────────
function notaBajo(m, dur, brillo = 1) {
  const s = muestras(dur + 0.03)
  const f = hz(m)
  const lp = new Biquad('lp', 400, 0.9)
  let p1 = 0
  let p2 = 0
  for (let i = 0; i < s.length; i++) {
    const t = i / SR
    if (i % 16 === 0) lp.set(140 + 1000 * brillo * Math.exp(-t / 0.07), 0.9)
    p1 = (p1 + f / SR) % 1
    p2 = (p2 + f / 2 / SR) % 1
    const saw = sierra(p1, f / SR)
    const sub = Math.sin(TAU * p2)
    const amp = Math.min(1, t / 0.004) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.03))
    s[i] = Math.tanh(1.3 * (lp.p(saw) * 0.6 + sub * 0.85)) * amp
  }
  return s
}
function notaPluck(m, corte = 1) {
  const dur = 0.42
  const s = muestras(dur)
  const f = hz(m)
  const lp = new Biquad('lp', 2000, 2.2)
  let p1 = 0
  let p2 = 0.3
  for (let i = 0; i < s.length; i++) {
    const t = i / SR
    if (i % 16 === 0) lp.set((380 + 3400 * Math.exp(-t / 0.055)) * corte, 2.2)
    p1 = (p1 + f / SR) % 1
    p2 = (p2 + (f * 1.004) / SR) % 1
    const v = sierra(p1, f / SR) * 0.6 + (p2 < 0.5 ? 0.35 : -0.35)
    s[i] = lp.p(v) * Math.min(1, t / 0.002) * Math.exp(-t / 0.15)
  }
  return s
}
/** Acorde de pad (supersaw) estereo. corte(tGlobal) da el filtro en cada instante. */
function acordePad(notas, t0, dur, corte, { ataque = 0.35, suelta = 0.7 } = {}) {
  const largo = dur + suelta
  const L = muestras(largo)
  const R = muestras(largo)
  const des = [-13, -6, 0, 6, 13]
  const pans = [-0.8, -0.35, 0, 0.35, 0.8]
  const voces = []
  for (const m of notas) for (let v = 0; v < des.length; v++) voces.push({ f: hz(m) * 2 ** (des[v] / 1200), fase: rnd(), pan: pans[v] })
  const fl = new Biquad('lp', 800, 0.6)
  const fr = new Biquad('lp', 800, 0.6)
  const norm = 1 / Math.sqrt(voces.length)
  for (let i = 0; i < L.length; i++) {
    const t = i / SR
    if (i % 32 === 0) { const c = corte(t0 + t); fl.set(c, 0.6); fr.set(c, 0.6) }
    let l = 0
    let r = 0
    for (const v of voces) {
      v.fase = (v.fase + v.f / SR) % 1
      const s = sierra(v.fase, v.f / SR)
      const th = ((v.pan + 1) * Math.PI) / 4
      l += s * Math.cos(th)
      r += s * Math.sin(th)
    }
    const env = Math.min(1, t / ataque) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / suelta))
    L[i] = fl.p(l * norm) * env
    R[i] = fr.p(r * norm) * env
  }
  return [L, R]
}
function stab(notas, brillo = 5200) {
  const dur = 0.5
  const L = muestras(dur)
  const R = muestras(dur)
  const voces = []
  for (const m of notas) for (const d of [-9, 0, 9]) voces.push({ f: hz(m) * 2 ** (d / 1200), fase: rnd(), pan: d / 12 })
  const fl = new Biquad('lp', brillo, 0.8)
  const fr = new Biquad('lp', brillo, 0.8)
  const norm = 1 / Math.sqrt(voces.length)
  for (let i = 0; i < L.length; i++) {
    const t = i / SR
    if (i % 32 === 0) { const c = 300 + brillo * Math.exp(-t / 0.09); fl.set(c, 0.8); fr.set(c, 0.8) }
    let l = 0
    let r = 0
    for (const v of voces) {
      v.fase = (v.fase + v.f / SR) % 1
      const s = sierra(v.fase, v.f / SR)
      l += s * (1 - v.pan)
      r += s * (1 + v.pan)
    }
    const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.13)
    L[i] = fl.p(l * norm) * env
    R[i] = fr.p(r * norm) * env
  }
  return [L, R]
}

// ════════════════════════════════════════════════════════════════════════════
// Arreglo
// ════════════════════════════════════════════════════════════════════════════
const ACORDES = {
  D: { pad: [57, 62, 66, 69], bajo: 38, arp: [62, 66, 69, 74] },
  A: { pad: [57, 61, 64, 69], bajo: 45, arp: [61, 64, 69, 73] },
  Bm: { pad: [54, 59, 62, 66], bajo: 47, arp: [59, 62, 66, 71] },
  G: { pad: [55, 59, 62, 67], bajo: 43, arp: [59, 62, 67, 71] },
  Dfin: { pad: [57, 62, 66, 69, 76], bajo: 38, arp: [62, 66, 69, 76] },
}
const PROG = ['D', 'A', 'Bm', 'G']
const PROG_CALMA = ['Bm', 'G', 'D', 'A']
// El golpe final cae cuando aparece el cierre (logo + «Registrate»).
const FINAL = Math.round((L.c3.t0 - 0.5) / BEAT) * BEAT
// El mail es un respiro entre el formulario y el pago.
const calma = (t) => t >= E.mail.desde && t < E.pago.desde
function acordeEn(t) {
  if (t >= FINAL) return 'Dfin'
  const c = Math.floor(t / COMPAS)
  return (calma(t) ? PROG_CALMA : PROG)[((c % 4) + 4) % 4]
}

// Secciones (en segundos)
const GOLPE_LOGO = 1.25 // el logo termina de aparecer (src/escenas/apertura.js)
const CON_BATERIA = [
  [E.registro.desde, E.mail.desde],
  [E.pago.desde, FINAL],
]
const conBateria = (t) => CON_BATERIA.some(([a, b]) => t >= a && t < b)

const bombos = []
const kick = (t, g = 1) => { bombos.push([t, g]); poner(B.bombo, t, bombo(0.8), { g }) }

// ── Apertura: el aire sube hasta que la X se arma ──────────────────────────
ponerE(B.fx, GOLPE_LOGO - 1.9, subida(1.9, 220, 6000), { g: 0.16, rev: 0.25 })
ponerE(B.fx, GOLPE_LOGO - 1.2, platilloInverso(1.2), { g: 0.12 })
poner(B.fx, GOLPE_LOGO, impacto(), { g: 0.42, rev: 0.2 })
ponerE(B.perc, GOLPE_LOGO, platillo(2.8), { g: 0.08, rev: 0.3 })
;[62, 66, 69, 74].forEach((m, i) => poner(B.campanas, GOLPE_LOGO + i * 0.04, campana(hz(m + 12), 2.6, 1.8), { g: 0.12, pan: -0.45 + i * 0.3, rev: 0.5, del: 0.25 }))
// La frase de apertura y el nodo «Tu empresa»
poner(B.campanas, L.a1.t0, campana(hz(81), 1.8, 1.2), { g: 0.08, pan: 0.3, rev: 0.5, del: 0.3 })
ponerE(B.fx, L.a2.t0 - 0.5, whoosh(0.7, 700, 3600, -0.5, 0.5), { g: 0.09 })

// ── Cortes de escena: barrido + golpe grave + campana ───────────────────────
for (const esc of ESCENAS) {
  if (esc.id === 'apertura') continue
  const t = esc.desde
  ponerE(B.fx, t - 0.55, whoosh(0.75, 380, 3800, -0.7, 0.7), { g: 0.14, rev: 0.12 })
  {
    poner(B.fx, t, caidaSub(1.1), { g: 0.2 })
    const ac = ACORDES[acordeEn(t)].arp
    poner(B.campanas, t, campana(hz(ac[3] + 12), 1.8, 1.4), { g: 0.08, pan: 0.25, rev: 0.45, del: 0.3 })
    poner(B.campanas, t + 0.04, campana(hz(ac[1] + 12), 1.8, 1.4), { g: 0.06, pan: -0.25, rev: 0.45, del: 0.3 })
  }
}

// ── Batería: suave, debajo de la voz ────────────────────────────────────────
for (let t = 0; t < FINAL - 1e-6; t += BEAT) {
  if (!conBateria(t)) continue
  const tiempo = Math.round(t / BEAT) % 4
  if (tiempo === 0 || tiempo === 2) kick(t, tiempo === 0 ? 0.62 : 0.5)
  poner(B.perc, t + BEAT / 2, hat(false), { g: 0.05, pan: 0.2 })
  if (tiempo === 3) poner(B.perc, t + BEAT * 0.75, hat(false), { g: 0.03, pan: -0.2 })
  if (tiempo === 1 || tiempo === 3) poner(B.perc, t, palmas(), { g: 0.045, pan: 0, rev: 0.25 })
}
// Vuelve la batería antes del cierre: redoble que crece
{
  const t0 = E.pago.desde - 2 * BEAT
  for (let i = 0; i < 8; i++) poner(B.perc, t0 + i * (BEAT / 4), redoble(), { g: 0.025 + i * 0.006, pan: (i % 2 ? 0.2 : -0.2) })
}
// Subida hacia el cierre
ponerE(B.fx, FINAL - 2.4, subida(2.4, 260, 8000), { g: 0.15, rev: 0.25 })
ponerE(B.fx, FINAL - 1.3, platilloInverso(1.3), { g: 0.12 })


// ── Cierre ───────────────────────────────────────────────────────────────────
poner(B.fx, FINAL, impacto(), { g: 0.36, rev: 0.25 })
ponerE(B.perc, FINAL, platillo(3.2), { g: 0.08, rev: 0.35 })
;[62, 66, 69, 74, 78].forEach((m, i) => poner(B.campanas, FINAL + 0.02 + i * 0.05, campana(hz(m + 12), 3, 1.4), { g: 0.1, pan: -0.5 + i * 0.25, rev: 0.55, del: 0.25 }))

// ── Pad ──────────────────────────────────────────────────────────────────────
function cortePad(t) {
  if (t < GOLPE_LOGO) return 320 + 500 * (t / GOLPE_LOGO) ** 2
  if (t < E.registro.desde) return 1100
  if (calma(t)) return 900
  if (t >= FINAL) return 2600 - 1500 * Math.min(1, (t - FINAL) / 6)
  if (t >= E.cierre.desde) return 1100 + 1500 * ((t - E.cierre.desde) / (FINAL - E.cierre.desde)) ** 2
  return 1350
}
for (let c = 0; c * COMPAS < FINAL - 1e-6; c++) {
  const t0 = c * COMPAS
  const dur = Math.min(COMPAS, FINAL - t0)
  const nombre = acordeEn(t0)
  const g = t0 < GOLPE_LOGO ? 0.22 : calma(t0) ? 0.2 : 0.16
  ponerE(B.pad, t0, acordePad(ACORDES[nombre].pad, t0, dur, cortePad, { ataque: c === 0 ? 2.2 : 0.4, suelta: 0.6 }), { g, rev: 0.35 })
}
ponerE(B.pad, FINAL, acordePad(ACORDES.Dfin.pad, FINAL, DURACION - FINAL - 1.5, cortePad, { ataque: 0.03, suelta: 1.4 }), { g: 0.22, rev: 0.45 })
ponerE(B.fx, FINAL, stab(ACORDES.Dfin.pad.map((m) => m + 12), 6000), { g: 0.16, rev: 0.4 })

// ── Bajo: negras debajo de la voz, redondas en la calma ─────────────────────
for (let t = GOLPE_LOGO; t < FINAL - 1e-6; t += BEAT) {
  const tiempo = Math.round(t / BEAT) % 4
  const ac = ACORDES[acordeEn(t)]
  if (conBateria(t)) poner(B.bajo, t, notaBajo(ac.bajo, BEAT * 0.82, 0.55), { g: tiempo === 0 ? 0.3 : 0.24 })
  else if (tiempo === 0 && t >= E.registro.desde) poner(B.bajo, t, notaBajo(ac.bajo, COMPAS * 0.95, 0.3), { g: 0.2 })
}
poner(B.bajo, FINAL, notaBajo(ACORDES.Dfin.bajo, 3.2, 0.5), { g: 0.32 })

// ── Arpegio ──────────────────────────────────────────────────────────────────
const PATRON = [0, 2, 1, 3, 0, 2, 4, 3, 0, 2, 1, 3, 4, 3, 2, 1]
function tocarArp(desde, hasta, corte, g, paso = SEMI * 2) {
  for (let t = Math.ceil(desde / paso) * paso; t < hasta - 1e-6; t += paso) {
    const i = Math.round(t / SEMI) % 16
    const ac = ACORDES[acordeEn(t)].arp
    const idx = PATRON[i]
    const m = idx === 4 ? ac[0] + 12 : ac[idx]
    poner(B.arp, t, notaPluck(m, corte(t)), { g: g * (i % 4 === 0 ? 1 : 0.8), pan: i % 4 ? 0.28 : -0.28, rev: 0.22, del: 0.32 })
  }
}
tocarArp(GOLPE_LOGO + COMPAS, E.registro.desde, (t) => 0.4 + 0.3 * ((t - GOLPE_LOGO) / (E.registro.desde - GOLPE_LOGO)), 0.1)
tocarArp(E.registro.desde, E.mail.desde, () => 0.72, 0.08)
tocarArp(E.mail.desde, E.pago.desde, () => 0.45, 0.07, SEMI * 4)
tocarArp(E.pago.desde, FINAL, (t) => 0.6 + 0.5 * ((t - E.pago.desde) / (FINAL - E.pago.desde)), 0.085, SEMI * 2)
tocarArp(FINAL + 0.6, DURACION - 2, (t) => 0.7 - 0.4 * ((t - FINAL) / (DURACION - FINAL)), 0.07, SEMI * 4)

// ════════════════════════════════════════════════════════════════════════════
// Mezcla
// ════════════════════════════════════════════════════════════════════════════
// Sidechain: bajo, pad y arpegio se agachan con cada bombo
const duck = new Float32Array(N).fill(1)
for (const [t, g] of bombos) {
  const i0 = Math.round(t * SR)
  const n = Math.round(0.3 * SR)
  for (let i = 0; i < n && i0 + i < N; i++) {
    const d = i / SR
    const e = d < 0.004 ? d / 0.004 : Math.exp(-(d - 0.004) / 0.1)
    duck[i0 + i] = Math.min(duck[i0 + i], 1 - 0.45 * g * e)
  }
}
for (const b of [B.bajo, B.pad, B.arp]) for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) b[c][i] *= duck[i]

// Delay ping-pong de 3/16
{
  const d = Math.round(3 * SEMI * SR)
  const [iL, iR] = DEL
  const oL = new Float32Array(N)
  const oR = new Float32Array(N)
  const lp = [new Biquad('lp', 3500), new Biquad('lp', 3500)]
  for (let i = 0; i < N; i++) {
    const fbL = i >= d ? oR[i - d] : 0
    const fbR = i >= d ? oL[i - d] : 0
    oL[i] = lp[0].p(iL[i] * 0.7 + fbL * 0.4)
    oR[i] = lp[1].p((i >= d ? iR[i - d] * 0.5 : 0) + fbR * 0.4)
  }
  for (let i = 0; i < N; i++) { REV[0][i] += oL[i] * 0.2; REV[1][i] += oR[i] * 0.2 }
  DEL[0] = oL
  DEL[1] = oR
}

class Comb {
  constructor(n) { this.b = new Float32Array(n); this.i = 0; this.f = 0 }
  p(x, fb, damp) {
    const y = this.b[this.i]
    this.f = y * (1 - damp) + this.f * damp
    this.b[this.i] = x + this.f * fb
    if (++this.i >= this.b.length) this.i = 0
    return y
  }
}
class AllPass {
  constructor(n) { this.b = new Float32Array(n); this.i = 0 }
  p(x) {
    const bo = this.b[this.i]
    const y = -x + bo
    this.b[this.i] = x + bo * 0.5
    if (++this.i >= this.b.length) this.i = 0
    return y
  }
}
function freeverb([inL, inR], sala = 0.86, amort = 0.3) {
  const k = SR / 44100
  const cT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => Math.round(n * k))
  const aT = [556, 441, 341, 225].map((n) => Math.round(n * k))
  const sp = Math.round(23 * k)
  const cL = cT.map((n) => new Comb(n))
  const cR = cT.map((n) => new Comb(n + sp))
  const aL = aT.map((n) => new AllPass(n))
  const aR = aT.map((n) => new AllPass(n + sp))
  const hp = [new Biquad('hp', 220), new Biquad('hp', 220)]
  const oL = new Float32Array(N)
  const oR = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const x = (hp[0].p(inL[i]) + hp[1].p(inR[i])) * 0.015
    let l = 0
    let r = 0
    for (const c of cL) l += c.p(x, sala, amort)
    for (const c of cR) r += c.p(x, sala, amort)
    for (const a of aL) l = a.p(l)
    for (const a of aR) r = a.p(r)
    oL[i] = l
    oR[i] = r
  }
  return [oL, oR]
}
const rev = freeverb(REV)

const musica = [new Float32Array(N), new Float32Array(N)]
const NIVELES = { bombo: 0.55, perc: 2.0, bajo: 0.85, pad: 1.3, arp: 1.3, campanas: 1.3, fx: 0.85 }
for (const [k, b] of Object.entries(B)) for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) musica[c][i] += b[c][i] * NIVELES[k]
for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) musica[c][i] += rev[c][i] * 1.1 + DEL[c][i] * 0.35
{
  const hp = [new Biquad('hp', 28, 0.7), new Biquad('hp', 28, 0.7)]
  let pico = 0
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) { const v = hp[c].p(musica[c][i]); musica[c][i] = v; pico = Math.max(pico, Math.abs(v)) }
  const k = 0.89 / pico
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) musica[c][i] = Math.tanh(musica[c][i] * k * 1.2) / Math.tanh(1.2)
  const f0 = Math.round((DURACION - 2.2) * SR)
  for (let i = f0; i < N; i++) { const q = 1 - (i - f0) / (N - f0); for (let c = 0; c < 2; c++) musica[c][i] *= q * q }
  for (let i = 0; i < 240; i++) for (let c = 0; c < 2; c++) musica[c][i] *= i / 240
}

// ── Voz ──────────────────────────────────────────────────────────────────────
function leerWavMono16(buf) {
  let p = 12
  while (p < buf.length) {
    const id = buf.toString('ascii', p, p + 4)
    const tam = buf.readUInt32LE(p + 4)
    if (id === 'data') {
      const out = new Float32Array(N)
      const n = Math.min(N, tam / 2)
      for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(p + 8 + i * 2) / 32768
      return out
    }
    p += 8 + tam + (tam % 2)
  }
  throw new Error('voz.wav sin datos')
}
const voz = leerWavMono16(await readFile(path.join(aqui, 'voz.wav')))
// Voz: sin graves de más, un poco de presencia, compresión suave y a -3 dBFS de pico
{
  const hp = new Biquad('hp', 85, 0.7)
  let env = 0
  let pico = 0
  for (let i = 0; i < N; i++) {
    let v = hp.p(voz[i])
    const a = Math.abs(v)
    env = a > env ? env + (a - env) * 0.01 : env + (a - env) * 0.0004
    const g = env > 0.18 ? (0.18 + (env - 0.18) * 0.45) / env : 1
    v *= g
    voz[i] = v
    pico = Math.max(pico, Math.abs(v))
  }
  // Sin voz (borrador con la línea de tiempo provisoria) no hay nada que escalar.
  const k = pico > 0 ? 0.7 / pico : 0
  for (let i = 0; i < N; i++) voz[i] *= k
}
// Ducking: la música baja ~8 dB mientras habla la voz, con subida y bajada suaves
const agacha = new Float32Array(N)
{
  const ventana = Math.round(0.02 * SR)
  let suma = 0
  const cuad = new Float32Array(N)
  for (let i = 0; i < N; i++) cuad[i] = voz[i] * voz[i]
  const habla = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    suma += cuad[i] - (i >= ventana ? cuad[i - ventana] : 0)
    habla[i] = Math.sqrt(Math.max(0, suma) / ventana) > 0.012 ? 1 : 0
  }
  // Mira 150 ms adelante (la música baja antes de la primera sílaba) y no
  // vuelve a subir en las pausas cortas entre palabras (400 ms).
  const adelante = Math.round(0.15 * SR)
  const sostiene = Math.round(0.4 * SR)
  const objetivo = new Float32Array(N)
  let ultimo = -1e9
  for (let i = N - 1; i >= 0; i--) {
    if (habla[i]) ultimo = i
    if (ultimo - i <= adelante) objetivo[i] = 1
  }
  let desde = -1e9
  for (let i = 0; i < N; i++) {
    if (objetivo[i]) desde = i
    else if (i - desde < sostiene) objetivo[i] = 1
  }
  const subida = 1 - Math.exp(-1 / (0.12 * SR))
  const bajada = 1 - Math.exp(-1 / (0.6 * SR))
  let env = 0
  for (let i = 0; i < N; i++) {
    env += (objetivo[i] - env) * (objetivo[i] > env ? subida : bajada)
    agacha[i] = env
  }
}
const mezcla = [new Float32Array(N), new Float32Array(N)]
const NIVEL_MUSICA = 0.27
for (let i = 0; i < N; i++) {
  const g = NIVEL_MUSICA * (1 - 0.72 * agacha[i])
  for (let c = 0; c < 2; c++) mezcla[c][i] = musica[c][i] * g + voz[i] * 0.95
}
// Informe: cuánto queda la música por debajo de la voz mientras se habla
{
  let sv = 0, sm = 0, sl = 0, n = 0, nl = 0
  for (let i = 0; i < N; i++) {
    const m = musica[0][i] * NIVEL_MUSICA * (1 - 0.72 * agacha[i])
    if (agacha[i] > 0.95) { sv += (voz[i] * 0.95) ** 2; sm += m * m; n++ } else if (agacha[i] < 0.05) { sl += m * m; nl++ }
  }
  const db = (x) => (10 * Math.log10(x)).toFixed(1)
  console.log(`voz ${db(sv / n)} dB · música bajo la voz ${db(sm / n)} dB (${(10 * Math.log10(sm / sv)).toFixed(1)} dB) · música sola ${db(sl / nl)} dB`)
}
{
  let pico = 0
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(mezcla[c][i]))
  const k = 0.93 / pico
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) mezcla[c][i] *= k
}

function wav24([L, R]) {
  const datos = Buffer.alloc(N * 2 * 3)
  let p = 0
  for (let i = 0; i < N; i++) {
    for (const ch of [L, R]) {
      datos.writeIntLE(Math.round(Math.max(-1, Math.min(1, ch[i])) * 8388607), p, 3)
      p += 3
    }
  }
  const cab = Buffer.alloc(44)
  cab.write('RIFF', 0); cab.writeUInt32LE(36 + datos.length, 4); cab.write('WAVE', 8)
  cab.write('fmt ', 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(2, 22)
  cab.writeUInt32LE(SR, 24); cab.writeUInt32LE(SR * 6, 28); cab.writeUInt16LE(6, 32); cab.writeUInt16LE(24, 34)
  cab.write('data', 36); cab.writeUInt32LE(datos.length, 40)
  return Buffer.concat([cab, datos])
}
await writeFile(path.join(aqui, 'musica.wav'), wav24(musica))
await writeFile(path.join(aqui, 'mezcla.wav'), wav24(mezcla))
console.log(`musica.wav y mezcla.wav: ${DURACION} s, ${SR} Hz, 24 bit`)
