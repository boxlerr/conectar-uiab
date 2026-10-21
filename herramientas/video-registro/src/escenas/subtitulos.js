// Subtítulos: la frase que se está diciendo, centrada abajo, y cada palabra se
// enciende cuando la voz llega a ella (las que faltan quedan en gris). La
// primera línea no va: es la frase grande de la apertura.

import { ESCENAS } from '../linea.js'
import { el, T, O, ep, salida, tt } from '../lib/kit.js'
import { palabrasDe } from '../lib/voz.js'

const LINEAS = ESCENAS.flatMap((e) => e.lineas).filter((l) => !['a1', 'c3'].includes(l.id))
// Palabras que se marcan en celeste: lo que hay que recordar.
const CLAVE = /^(CUIT|mail|tarjeta|Registrate|rubro|membresía|Finalizar|débito|automático|Sipago|mismo|aprueba|directorio|\$50\.000|\$500\.000)[.,:]?$/i

export default {
  nombre: 'subtitulos',
  get desde() { return tt('a2') - 0.3 },
  get hasta() { return tt('c2.fin') + 0.6 },
  z: 110,
  montar(capa) {
    this.lineas = LINEAS.map((l) => {
      const n = el('div', { class: 'abs', style: { left: '0', top: '992px', width: '1920px', textAlign: 'center', fontSize: '31px', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.25, textShadow: '0 2px 14px rgba(0,8,20,0.65)' } }, capa)
      const palabras = palabrasDe(l.id).map((p, i, arr) => {
        const s = el('span', { text: p.w, style: { color: '#6f86a0' } }, n)
        if (i < arr.length - 1) n.appendChild(document.createTextNode(' '))
        return { ...p, s, clave: CLAVE.test(p.w) }
      })
      return { ...l, n, palabras }
    })
  },
  frame(t) {
    for (let i = 0; i < this.lineas.length; i++) {
      const l = this.lineas[i]
      const sig = this.lineas[i + 1]
      // Se queda hasta que entra la siguiente (o un respiro después de terminar).
      const fin = Math.min(l.t1 + 0.55, sig ? sig.t0 - 0.16 : l.t1 + 0.55)
      if (t < l.t0 - 0.12 || t > fin) { O(l.n, 0); continue }
      const q = ep(t, l.t0 - 0.12, l.t0 + 0.12) * (1 - ep(t, fin - 0.16, fin, salida))
      O(l.n, q)
      T(l.n, { y: (1 - ep(t, l.t0 - 0.12, l.t0 + 0.25)) * 10 })
      for (const p of l.palabras) {
        const dicha = t >= p.t0 - 0.04
        p.s.style.color = dicha ? (p.clave ? '#8fd3f5' : '#ffffff') : '#6f86a0'
      }
    }
  },
}
