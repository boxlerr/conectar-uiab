// Apertura: el logo, la frase que abre ("Sumar tu empresa… es simple") que se
// enciende palabra por palabra con la voz, y el nodo "Tu empresa" con lo que
// hay que tener a mano: CUIT, un mail y una tarjeta.

import { el, T, O, ep, ease, salida, C, tt, clamp, lerp, resorte } from '../lib/kit.js'
import { palabrasDe } from '../lib/voz.js'

const ICONOS = {
  cuit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#04182b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#04182b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  tarjeta: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#04182b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/></svg>',
}

const NODO = [960, 540]
const SATELITES = [
  { id: 'cuit', texto: 'El CUIT de la empresa', x: 560, y: 330, cuando: 'a2#1' },
  { id: 'mail', texto: 'Un mail que uses', x: 1360, y: 330, cuando: 'a2#2' },
  { id: 'tarjeta', texto: 'Tarjeta de débito o crédito', x: 960, y: 790, cuando: 'a2#3' },
]

export default {
  nombre: 'apertura',
  desde: 0,
  get hasta() { return tt('r1') + 0.4 },
  z: 20,
  montar(capa) {
    // Logo grande
    this.logo = el('img', { class: 'abs', attrs: { src: '../assets/marca/logo-uiab-conecta-blanco.svg' }, style: { width: '900px', left: '510px', top: '450px' } }, capa)
    this.brilloLogo = el('div', { class: 'abs', style: { width: '1400px', height: '700px', left: '260px', top: '190px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(95,185,232,0.20), rgba(95,185,232,0))' } }, capa)

    // La frase de apertura, palabra por palabra
    this.frase = el('div', { class: 'abs titulo', style: { left: '260px', top: '420px', width: '1400px', textAlign: 'center', fontSize: '80px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 } }, capa)
    this.palabras = palabrasDe('a1').map((p, i, arr) => {
      const n = el('span', { text: p.w, style: { display: 'inline-block', color: '#3d5a76' } }, this.frase)
      if (i < arr.length - 1) this.frase.appendChild(document.createTextNode(' '))
      return { ...p, n, ultima: i === arr.length - 1 }
    })

    // El nodo y sus satélites
    this.lineas = el('svg', { class: 'capa', attrs: { viewBox: '0 0 1920 1080' } }, capa)
    // Cada línea punteada se dibuja desde el nodo hacia afuera con una máscara
    // (un trazo blanco que crece): pintarla encima con el color del fondo
    // dejaba una franja visible sobre los brillos.
    const defs = el('defs', {}, this.lineas)
    this.trazos = SATELITES.map((s, i) => {
      const largo = Math.hypot(s.x - NODO[0], s.y - NODO[1])
      const d = `M${NODO[0]},${NODO[1]} L${s.x},${s.y}`
      const m = el('mask', { attrs: { id: `trazo-${i}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1920, height: 1080 } }, defs)
      const mascara = el('path', { attrs: { d, stroke: '#fff', 'stroke-width': '8', fill: 'none', 'stroke-dasharray': `${largo} ${largo}` } }, m)
      const p = el('path', { attrs: { d, stroke: C.celeste, 'stroke-width': '2', 'stroke-dasharray': '6 9', fill: 'none', mask: `url(#trazo-${i})` } }, this.lineas)
      return { p, mascara, largo }
    })
    this.nodo = el('div', { class: 'pildora nodo', text: 'Tu empresa' }, capa)
    this.sats = SATELITES.map((s) => el('div', { class: 'pildora satelite', html: `<b>${ICONOS[s.id]}</b>${s.texto}` }, capa))
  },
  frame(t) {
    const ta1 = tt('a1')
    const ta2 = tt('a2')
    const ta3 = tt('a3')

    // ── Logo ──
    const entra = ep(t, 0.25, 1.5)
    const sale = ep(t, ta1 - 0.5, ta1 + 0.1, salida)
    O(this.logo, entra * (1 - sale))
    T(this.logo, { s: 0.94 + 0.06 * entra + 0.04 * sale, y: -30 * sale })
    O(this.brilloLogo, 0.9 * entra * (1 - sale))

    // ── Frase: cada palabra pasa de apagada a blanca cuando la dice la voz ──
    const visFrase = ep(t, ta1 - 0.3, ta1 + 0.2) * (1 - ep(t, ta2 - 0.55, ta2 - 0.2, salida))
    O(this.frase, visFrase)
    T(this.frase, { y: (1 - ep(t, ta1 - 0.3, ta1 + 0.5)) * 24 - 20 * ep(t, ta2 - 0.6, ta2 - 0.1, salida) })
    for (const p of this.palabras) {
      const q = ep(t, p.t0 - 0.05, p.t0 + 0.18)
      p.n.style.color = q >= 1 ? (p.ultima ? C.celeste : '#ffffff') : mezclar('#3d5a76', p.ultima ? C.celeste : '#ffffff', q)
    }

    // ── Nodo y satélites ──
    // Entra recién cuando la frase de apertura ya se fue: si no, se pisan.
    const visNodo = ep(t, ta2 - 0.15, ta2 + 0.45)
    const fin = ep(t, ta3 + 0.2, tt('a3.fin') + 0.6, ease.inOutCubic)
    const r = resorte(t - (ta2 - 0.15), { k: 160, c: 18 })
    O(this.nodo, visNodo * (1 - ep(t, tt('a3.fin') + 0.1, tt('a3.fin') + 0.6)))
    // Al cerrar, el nodo se achica y sube hacia la fila de fichas del marco.
    const nx = lerp(NODO[0], 160, fin)
    const ny = lerp(NODO[1], 108, fin)
    const ancho = this.nodo.offsetWidth
    const alto = this.nodo.offsetHeight
    T(this.nodo, { x: nx - ancho / 2, y: ny - alto / 2, s: (0.6 + 0.4 * r) * lerp(1, 0.45, fin) })

    SATELITES.forEach((s, i) => {
      const tc = tt(s.cuando)
      const q = ep(t, tc - 0.1, tc + 0.5)
      const vuelta = ep(t, ta3 - 0.1, ta3 + 0.4, salida)
      const n = this.sats[i]
      O(n, q * (1 - vuelta))
      const w = n.offsetWidth
      const h = n.offsetHeight
      const rr = resorte(t - (tc - 0.1), { k: 170, c: 17 })
      T(n, { x: s.x - w / 2 + (1 - rr) * (NODO[0] - s.x) * 0.25, y: s.y - h / 2 + (1 - rr) * (NODO[1] - s.y) * 0.25, s: 0.85 + 0.15 * rr })
      const tr = this.trazos[i]
      const dibujo = ep(t, tc - 0.2, tc + 0.35)
      tr.mascara.setAttribute('stroke-dashoffset', `${(tr.largo * (1 - dibujo)).toFixed(1)}`)
      tr.p.setAttribute('opacity', (0.65 * (1 - vuelta)).toFixed(3))
    })
  },
}

function mezclar(a, b, p) {
  const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16))
  const A = h(a)
  const B = h(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(p))).join(',')})`
}
