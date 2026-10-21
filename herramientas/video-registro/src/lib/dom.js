// Ayudas minimas de DOM. Las escenas crean sus nodos una sola vez al montar y
// en cada frame solo escriben estilos.

const NS = 'http://www.w3.org/2000/svg'
const TAGS_SVG = new Set(['svg', 'path', 'g', 'circle', 'rect', 'line', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'filter', 'feGaussianBlur', 'ellipse', 'polyline'])

/** Crea un nodo. props: { class, style (objeto o string), text, html, attrs } */
export function el(tag, props = {}, padre = null) {
  const svg = TAGS_SVG.has(tag)
  const n = svg ? document.createElementNS(NS, tag) : document.createElement(tag)
  if (props.class) n.setAttribute('class', props.class)
  if (props.style) {
    if (typeof props.style === 'string') n.style.cssText = props.style
    else Object.assign(n.style, props.style)
  }
  if (props.text != null) n.textContent = props.text
  if (props.html != null) n.innerHTML = props.html
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) n.setAttribute(k, v)
  if (padre) padre.appendChild(n)
  return n
}

/** Transform en un solo string. Traslacion en px, angulos en grados. La
 *  perspectiva va despues de la traslacion: asi el punto de fuga queda en el
 *  centro del propio nodo y dos nodos simetricos giran simetricos. */
export function T(n, { x = 0, y = 0, z = 0, s = 1, sx = 1, sy = 1, r = 0, rx = 0, ry = 0, skx = 0, p = 0 } = {}) {
  n.style.transform =
    `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${p ? 0 : z.toFixed(2)}px)` +
    (p ? ` perspective(${p}px)` : '') +
    (p && z ? ` translateZ(${z.toFixed(2)}px)` : '') +
    (rx ? ` rotateX(${rx.toFixed(3)}deg)` : '') +
    (ry ? ` rotateY(${ry.toFixed(3)}deg)` : '') +
    (r ? ` rotate(${r.toFixed(3)}deg)` : '') +
    (skx ? ` skewX(${skx.toFixed(3)}deg)` : '') +
    (s !== 1 || sx !== 1 || sy !== 1 ? ` scale(${(s * sx).toFixed(4)},${(s * sy).toFixed(4)})` : '')
}

/** Opacidad; por debajo de un umbral el nodo sale del arbol de pintado. */
export function O(n, o) {
  const v = o < 0.002 ? 0 : o > 0.998 ? 1 : o
  n.style.opacity = v
  n.style.visibility = v === 0 ? 'hidden' : 'visible'
}

/** Parte un texto en palabras; cada palabra va dentro de una mascara (overflow
 *  hidden) para revelarla subiendo. Devuelve los nodos internos. */
export function palabras(padre, texto, { clase = '' } = {}) {
  const out = []
  const trozos = texto.split(' ')
  trozos.forEach((w, i) => {
    const m = el('span', { class: `mascara ${clase}` }, padre)
    const inner = el('span', { class: 'mascara-in', text: w }, m)
    out.push(inner)
    if (i < trozos.length - 1) padre.appendChild(document.createTextNode(' '))
  })
  return out
}

/** Parte un texto en letras sueltas (inline-block) para animarlas una por una. */
export function letras(padre, texto) {
  const out = []
  for (const ch of texto) {
    const s = el('span', { class: 'letra', text: ch === ' ' ? ' ' : ch }, padre)
    out.push(s)
  }
  return out
}

/** Achica el font-size de un nodo hasta que su ancho entre en `max` px. */
export function ajustar(n, max, base) {
  n.style.fontSize = `${base}px`
  const w = n.scrollWidth
  if (w > max) n.style.fontSize = `${Math.floor((base * max) / w)}px`
}

/** Precarga y decodifica una imagen: el frame no se captura hasta que esta lista. */
const cacheImg = new Map()
export function imagen(src) {
  let p = cacheImg.get(src)
  if (!p) {
    p = new Promise((ok, mal) => {
      const img = new Image()
      img.decoding = 'sync'
      img.onload = () => img.decode().then(() => ok(img), () => ok(img))
      img.onerror = () => mal(new Error(`no cargo ${src}`))
      img.src = src
    })
    cacheImg.set(src, p)
  }
  return p
}
