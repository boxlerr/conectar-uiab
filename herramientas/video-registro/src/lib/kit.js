// Piezas que comparten las escenas: la ventana del sitio (capturas reales con
// cámara, resaltes y cursor) y la cuenta de tiempos contra la narración. Todo
// se dibuja como función pura de t.

import { el, T, O, imagen } from './dom.js'
import { clamp, lerp, ep, ease, marca, salida, prog, resorte } from './anim.js'
import { CAPTURAS } from '../capturas.js'
import { L } from '../linea.js'

export const C = {
  fondo: '#04182b',
  navy: '#00213f',
  azul: '#0382bf',
  celeste: '#5fb9e8',
  primario: '#2563eb',
  naranja: '#f97316',
  claro: '#f2f6fa',
  gris: '#7f93ab',
}

// ── Tiempos ─────────────────────────────────────────────────────────────────
/** 'r2' = empieza la línea r2 · 'r2#1' = empieza su segunda frase (los
 *  `cortes` del guion) · 'r2.fin' = termina · 'r2@0.5' = a mitad de la línea ·
 *  'r2+1.2' = 1,2 s después. Un número pasa tal cual. */
export function tt(expr) {
  if (typeof expr === 'number') return expr
  const m = /^([a-z]\d+)(?:#(\d+))?(\.fin)?(?:@([\d.]+))?([+-][\d.]+)?$/.exec(expr)
  if (!m || !L[m[1]]) throw new Error(`tiempo raro: ${expr}`)
  const ln = L[m[1]]
  let t = ln.t0
  if (m[2]) {
    if (ln.frases[Number(m[2])] == null) throw new Error(`${m[1]} no tiene la frase ${m[2]}`)
    t = ln.frases[Number(m[2])]
  }
  if (m[3]) t = ln.t1
  if (m[4]) t = ln.t0 + (ln.t1 - ln.t0) * Number(m[4])
  if (m[5]) t += Number(m[5])
  return t
}

// ── Capturas ────────────────────────────────────────────────────────────────
const cache = new Map()
/** Carga una captura real (assets/capturas/<nombre>.png, a 2×) con sus medidas. */
export function captura(nombre) {
  if (!cache.has(nombre)) {
    const c = CAPTURAS[nombre]
    if (!c) throw new Error(`no hay captura ${nombre}: correr herramientas/capturar.mjs`)
    cache.set(nombre, imagen(`../assets/capturas/${nombre}.png`).then((img) => ({ src: img.src, w: c.w, h: c.h, r: c.r, nombre })))
  }
  return cache.get(nombre)
}

/** Rectángulo con nombre de una captura: 'reg-2b.cuit'. */
export function rect(ref) {
  const [n, k] = ref.split('.')
  const r = CAPTURAS[n]?.r?.[k]
  if (!r) throw new Error(`no hay ${ref} en las capturas`)
  return r
}
/** Unión de rectángulos. */
export const union = (...rs) => [Math.min(...rs.map((r) => r[0])), Math.min(...rs.map((r) => r[1])), Math.max(...rs.map((r) => r[2])), Math.max(...rs.map((r) => r[3]))]
/** Centro de un rectángulo. */
export const centro = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]

// ── Ventana del sitio ───────────────────────────────────────────────────────
const FLECHA = '<svg viewBox="0 0 24 24"><path d="M4 2.5 L4 19.5 L8.6 15.3 L11.6 22 L14.6 20.7 L11.7 14.1 L18 14.1 Z" fill="#ffffff" stroke="#0b1b2e" stroke-width="1.6" stroke-linejoin="round"/></svg>'

export class Ventana {
  /** caps: capturas del mismo tamaño (se cruzan con ver()). */
  constructor(padre, caps, { ancho = 1240, alto = 800, barra = true, titulo = 'uiabconecta.com' } = {}) {
    this.caps = caps
    this.ancho = ancho
    this.alto = alto
    this.raiz = el('div', { class: 'ventana', style: { width: `${ancho}px`, height: `${alto}px`, marginLeft: `${-ancho / 2}px`, marginTop: `${-alto / 2}px` } }, padre)
    const arriba = barra ? 40 : 0
    if (barra) {
      const b = el('div', { class: 'barra' }, this.raiz)
      ;[18, 38, 58].forEach((x) => el('i', { style: { left: `${x}px` } }, b))
      this.url = el('span', { text: titulo }, b)
    }
    this.vista = el('div', { class: 'vista', style: { top: `${arriba}px`, width: `${ancho}px`, height: `${alto - arriba}px` } }, this.raiz)
    this.vw = ancho
    this.vh = alto - arriba
    this.cap = caps[0]
    this.imgs = caps.map((c, i) => el('img', { attrs: { src: c.src }, style: { width: `${c.w}px`, height: `${c.h}px`, opacity: i === 0 ? 1 : 0 } }, this.vista))
    this.velo = el('div', { class: 'abs', style: { width: `${ancho}px`, height: `${alto - arriba}px`, background: 'rgba(4,24,43,1)', opacity: 0 } }, this.vista)
    // Para los cambios de página: un fundido breve al fondo del sitio tapa el
    // salto de encuadre, en vez de dos pantallas distintas superpuestas.
    this.blanco = el('div', { class: 'abs', style: { width: `${ancho}px`, height: `${alto - arriba}px`, background: '#f6f8fb', opacity: 0 } }, this.vista)
    this.resaltes = []
    this.cursor = el('div', { class: 'cursor', html: FLECHA }, this.vista)
    this.onda = el('div', { class: 'onda' }, this.vista)
    O(this.cursor, 0)
    O(this.onda, 0)
    this.s = 1
    this.ox = 0
    this.oy = 0
  }

  titulo(texto) { if (this.url && this.url.textContent !== texto) this.url.textContent = texto }

  /** (cx, cy) = punto de la captura que queda en el centro; z = 1 llena el ancho. */
  camara(cx, cy, z = 1) {
    const { w, h } = this.cap
    const s = (this.vw / w) * z
    let ox = this.vw / 2 - cx * s
    let oy = this.vh / 2 - cy * s
    ox = w * s >= this.vw ? clamp(ox, this.vw - w * s, 0) : (this.vw - w * s) / 2
    oy = h * s >= this.vh ? clamp(oy, this.vh - h * s, 0) : (this.vh - h * s) / 2
    this.s = s
    this.ox = ox
    this.oy = oy
    const tr = `translate(${ox.toFixed(2)}px,${oy.toFixed(2)}px) scale(${s.toFixed(5)})`
    for (const i of this.imgs) i.style.transform = tr
  }

  /** Cámara que encuadra un rectángulo de la captura con un margen. */
  encuadrar(r, { margen = 0.12, alto = 0.5 } = {}) {
    const ancho = (r[2] - r[0]) * (1 + 2 * margen)
    const altoR = (r[3] - r[1]) * (1 + 2 * margen)
    const z = Math.min(this.cap.w / ancho, (this.vh / this.vw) * (this.cap.w / altoR))
    const [cx] = centro(r)
    const cy = r[1] + (r[3] - r[1]) * alto
    return [cx, cy, z]
  }

  /** Pasa de una cámara a otra: a y b = [cx, cy, z]. */
  viaje(t, t0, t1, a, b, curva = marca) {
    const p = curva(prog(t, t0, t1))
    this.camara(lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p))
  }

  /** Opacidad de cada captura de la pila (para pasar de una a otra). */
  ver(pesos) {
    this.imgs.forEach((im, i) => { im.style.opacity = (pesos[i] ?? 0).toFixed(3) })
  }
  /** Muestra la captura i (y la j encima con peso p, para cruzarlas). */
  mostrar(i, j = null, p = 0) {
    this.imgs.forEach((im, k) => { im.style.opacity = k === i ? 1 : k === j ? p.toFixed(3) : 0 })
    if (j != null && p > 0.5) this.cap = this.caps[j]
    else this.cap = this.caps[i]
  }

  /** Centro de la ventana en (x, y) del escenario, con escala, giro 3D y opacidad. */
  pose({ x = 960, y = 560, s = 1, rx = 0, ry = 0, o = 1 }) {
    T(this.raiz, { x, y, s, rx, ry, p: rx || ry ? 2400 : 0 })
    O(this.raiz, o)
  }

  /** Captura → coordenadas de la vista. */
  aVista(x, y) { return [this.ox + x * this.s, this.oy + y * this.s] }

  /** Recuadro sobre una zona de la captura [x0, y0, x1, y1]; lo demás se apaga. */
  resalte(i, r, a, { color = C.celeste, apagar = 0.5 } = {}) {
    let n = this.resaltes[i]
    if (!n) n = this.resaltes[i] = el('div', { class: 'resalte' }, this.vista)
    if (!r || a <= 0.002) { O(n, 0); return }
    const pad = 10
    const [x0, y0] = this.aVista(r[0], r[1])
    const w = (r[2] - r[0]) * this.s + 2 * pad
    const h = (r[3] - r[1]) * this.s + 2 * pad
    const k = 1 + 0.06 * (1 - a)
    n.style.left = `${x0 - pad + (w * (1 - k)) / 2}px`
    n.style.top = `${y0 - pad + (h * (1 - k)) / 2}px`
    n.style.width = `${w * k}px`
    n.style.height = `${h * k}px`
    n.style.borderColor = color
    const g = color === C.naranja ? '249,115,22' : '95,185,232'
    n.style.boxShadow = `0 0 0 9999px rgba(4,24,43,${(apagar * a).toFixed(3)}), 0 0 30px rgba(${g},${(0.7 * a).toFixed(3)}), inset 0 0 18px rgba(${g},${(0.25 * a).toFixed(3)})`
    O(n, a)
  }

  /** Cursor en (x, y) de la captura; `clic` = segundos desde el click (o null). */
  puntero(x, y, o, clic = null) {
    if (o <= 0.002) { O(this.cursor, 0); O(this.onda, 0); return }
    const [vx, vy] = this.aVista(x, y)
    const apretado = clic != null && clic >= 0 && clic < 0.16 ? 0.86 : 1
    T(this.cursor, { x: vx - 6, y: vy - 3, s: apretado })
    O(this.cursor, o)
    if (clic != null && clic >= 0 && clic < 0.7) {
      const q = ease.outCubic(clic / 0.7)
      const d = 18 + 70 * q
      T(this.onda, { x: vx - d / 2, y: vy - d / 2 })
      this.onda.style.width = `${d}px`
      this.onda.style.height = `${d}px`
      O(this.onda, (1 - q) * o)
    } else O(this.onda, 0)
  }
}

/** Posición del cursor que viaja entre puntos: keys = [[t, x, y], ...]. */
export function recorrido(t, keys) {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]]
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, xa, ya] = keys[i]
    const [tb, xb, yb] = keys[i + 1]
    if (t <= tb) {
      const p = ease.inOutCubic(clamp((t - ta) / Math.max(0.001, tb - ta)))
      // Un arco leve: la recta perfecta delata a la máquina.
      const arco = Math.sin(p * Math.PI) * Math.min(60, Math.hypot(xb - xa, yb - ya) * 0.12)
      const nx = -(yb - ya) / (Math.hypot(xb - xa, yb - ya) || 1)
      const ny = (xb - xa) / (Math.hypot(xb - xa, yb - ya) || 1)
      return [lerp(xa, xb, p) + nx * arco, lerp(ya, yb, p) + ny * arco]
    }
  }
  const u = keys[keys.length - 1]
  return [u[1], u[2]]
}

// ── Utilidades de movimiento ────────────────────────────────────────────────
/** Entrada desde abajo con resorte: devuelve { y, o }. */
export function sube(t, a, dist = 90) {
  const r = resorte(t - a, { k: 140, c: 20 })
  return { y: (1 - r) * dist, o: clamp((t - a) / 0.25) }
}
/** Visibilidad de un plano entre a y b: entra con la curva de la marca y sale más rápido. */
export function vida(t, a, b, { entra = 0.6, sale = 0.4 } = {}) {
  if (t < a || t > b + 0.001) return 0
  return ep(t, a, a + entra) * (1 - ep(t, b - sale, b, salida))
}
export { clamp, lerp, ep, ease, marca, salida, prog, resorte, el, T, O }
