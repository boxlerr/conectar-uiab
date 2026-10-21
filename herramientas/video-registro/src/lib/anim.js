// Curvas, tiempo y azar. Todo lo que se dibuja es funcion pura de t: el render
// pide cualquier frame, en cualquier orden y desde varios procesos a la vez, y
// cada frame tiene que salir identico siempre. Nada de Date.now ni Math.random.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, p) => a + (b - a) * p
/** Progreso lineal 0..1 de t entre t0 y t1 (solo como entrada de una curva). */
export const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0))

export const ease = {
  inQuad: (p) => p * p,
  outQuad: (p) => 1 - (1 - p) * (1 - p),
  inOutQuad: (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
  inCubic: (p) => p * p * p,
  outCubic: (p) => 1 - (1 - p) ** 3,
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
  inQuart: (p) => p ** 4,
  outQuart: (p) => 1 - (1 - p) ** 4,
  inOutQuart: (p) => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2),
  inQuint: (p) => p ** 5,
  outQuint: (p) => 1 - (1 - p) ** 5,
  inOutQuint: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2),
  inExpo: (p) => (p <= 0 ? 0 : 2 ** (10 * p - 10)),
  outExpo: (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
  inOutExpo: (p) =>
    p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2,
  inSine: (p) => 1 - Math.cos((p * Math.PI) / 2),
  outSine: (p) => Math.sin((p * Math.PI) / 2),
  inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  outCirc: (p) => Math.sqrt(1 - (p - 1) ** 2),
  inCirc: (p) => 1 - Math.sqrt(1 - p * p),
  outBack: (p, s = 1.70158) => 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2,
  inBack: (p, s = 1.70158) => (s + 1) * p ** 3 - s * p * p,
}

/** cubic-bezier() con la misma semantica que CSS. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const X = (s) => ((ax * s + bx) * s + cx) * s
  const Y = (s) => ((ay * s + by) * s + cy) * s
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx
  return (p) => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let s = p
    for (let i = 0; i < 8; i++) {
      const e = X(s) - p
      if (Math.abs(e) < 1e-7) return Y(s)
      const d = dX(s)
      if (Math.abs(d) < 1e-7) break
      s -= e / d
    }
    let lo = 0
    let hi = 1
    s = p
    for (let i = 0; i < 40; i++) {
      const x = X(s)
      if (Math.abs(x - p) < 1e-7) break
      if (x < p) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return Y(s)
  }
}

/** La curva de la marca: la misma que usa el hero del sitio ([0.16, 1, 0.3, 1]).
 *  Arranque decidido y llegada larga. Es la curva por defecto de todo el reel. */
export const marca = bezier(0.16, 1, 0.3, 1)
/** Salida: acelera y se va. Para lo que abandona el cuadro. */
export const salida = bezier(0.7, 0, 0.84, 0)

/** Progreso con curva entre t0 y t1. */
export const ep = (t, t0, t1, fn = marca) => fn(prog(t, t0, t1))
/** Valor de a a b mientras t va de t0 a t1. */
export const tw = (t, t0, t1, a, b, fn = marca) => a + (b - a) * fn(prog(t, t0, t1))

/** Resorte amortiguado en forma cerrada: va de 0 a 1. `t` = segundos desde el
 *  disparo. k rigidez, c amortiguacion, m masa, v0 velocidad inicial. */
export function resorte(t, { k = 180, c = 16, m = 1, v0 = 0 } = {}) {
  if (t <= 0) return 0
  const w0 = Math.sqrt(k / m)
  const z = c / (2 * Math.sqrt(k * m))
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z)
    const B = (v0 - z * w0) / wd
    return 1 + Math.exp(-z * w0 * t) * (-Math.cos(wd * t) + B * Math.sin(wd * t))
  }
  if (z === 1) return 1 + (-1 + (v0 - w0) * t) * Math.exp(-w0 * t)
  const r1 = -w0 * (z - Math.sqrt(z * z - 1))
  const r2 = -w0 * (z + Math.sqrt(z * z - 1))
  const C1 = (v0 + r2) / (r1 - r2)
  const C2 = -1 - C1
  return 1 + C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t)
}

/** Envolvente de impacto: sube en `subida` segundos y cae exponencial. */
export function pulso(t, t0, subida = 0.02, caida = 0.35) {
  if (t < t0) return 0
  const d = t - t0
  if (d < subida) return ease.outQuad(d / subida)
  return Math.exp(-(d - subida) / caida)
}

/** Oscilacion amortiguada (para rebotes y sacudidas): arranca en 1 y se apaga. */
export const vibra = (d, frec = 9, caida = 0.18) =>
  d < 0 ? 0 : Math.cos(d * frec * Math.PI * 2) * Math.exp(-d / caida)

// ── Color ───────────────────────────────────────────────────────────────────
const cacheColor = new Map()
export function rgb(hex) {
  let c = cacheColor.get(hex)
  if (!c) {
    const h = hex.replace('#', '')
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    cacheColor.set(hex, c)
  }
  return c
}
export const rgba = (hex, a = 1) => {
  const [r, g, b] = rgb(hex)
  return `rgba(${r},${g},${b},${a})`
}
export function mezcla(a, b, p, alfa = 1) {
  const A = rgb(a)
  const B = rgb(b)
  const q = clamp(p)
  return `rgba(${Math.round(lerp(A[0], B[0], q))},${Math.round(lerp(A[1], B[1], q))},${Math.round(lerp(A[2], B[2], q))},${alfa})`
}

// ── Azar con semilla ────────────────────────────────────────────────────────
/** mulberry32: mismo resultado en cada corrida y en cada worker. */
export function azar(semilla = 1) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash entero → [0, 1). Reemplaza a Math.random cuando el valor tiene que
 *  depender solo de (i, j): por ejemplo, el digito de una celda en el paso j. */
export const hash = (i, j) => hash2(i, j)
function hash2(ix, iy) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
/** Ruido de valor 2D suave, en [-1, 1]. */
export function ruido(x, y = 0) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
  const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1
}

/** Texto que se "decodifica": las letras aun no resueltas muestran un glifo
 *  al azar que cambia cada `cambio` segundos. Determinista por t. */
const GLIFOS = '<>/{}[]=;:+*#01xX_$%&'
export function descifrar(texto, t, t0, porLetra = 0.05, cambio = 1 / 30, semilla = 7) {
  let out = ''
  const paso = Math.floor(t / cambio)
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]
    const resuelta = t >= t0 + i * porLetra
    if (ch === ' ' || resuelta) {
      out += ch
      continue
    }
    if (t < t0 + i * porLetra - 0.35) {
      out += ' '
      continue
    }
    const r = hash2(i * 31 + semilla, paso)
    out += GLIFOS[Math.floor(r * GLIFOS.length)]
  }
  return out
}
