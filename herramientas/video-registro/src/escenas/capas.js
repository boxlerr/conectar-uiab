// Capas que viven todo el video: el fondo navy con la trama de puntos, el
// marco de arriba (logo, pasos del alta, las fichas que se van juntando) y la
// firma de Vaxler, chica, en la esquina.

import { DURACION } from '../linea.js'
import { el, T, O, ep, ease, salida, C, tt, clamp } from '../lib/kit.js'
import { Grilla } from '../lib/grilla.js'
import { ruido } from '../lib/anim.js'

export const fondo = {
  nombre: 'fondo',
  desde: 0,
  hasta: DURACION,
  z: 1,
  montar(capa) {
    el('div', { class: 'capa', style: { background: `linear-gradient(180deg, #05203a 0%, ${C.fondo} 55%, #021120 100%)` } }, capa)
    this.brillo = el('div', { class: 'abs', style: { width: '2400px', height: '1600px', marginLeft: '-1200px', marginTop: '-800px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(3,130,191,0.30), rgba(3,130,191,0.10) 45%, rgba(3,130,191,0) 100%)' } }, capa)
    this.brillo2 = el('div', { class: 'abs', style: { width: '1600px', height: '1200px', marginLeft: '-800px', marginTop: '-600px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(95,185,232,0.12), rgba(95,185,232,0) 100%)' } }, capa)
    this.grilla = new Grilla(capa, { color: C.celeste })
  },
  frame(t) {
    T(this.brillo, { x: 760 + 260 * ruido(t * 0.05, 3), y: 420 + 160 * ruido(t * 0.04, 9) })
    T(this.brillo2, { x: 1400 + 300 * ruido(t * 0.04, 17), y: 700 + 200 * ruido(t * 0.05, 23) })
    this.grilla.dibujar({ alfa: 0.14, deriva: [t * 9, t * 6] })
  },
}

// ── Marco de arriba ─────────────────────────────────────────────────────────
// Los pasos del alta, en el orden en que los recorre el video. Cada uno se
// prende cuando la narración llega ahí.
const PASOS = [
  ['Quién sos', 'r2'],
  ['Identidad', 'r3'],
  ['Ubicación', 'r5'],
  ['Rubro', 'r6'],
  ['Acceso', 'r7'],
  ['Membresía', 'r8'],
  ['Mail', 'm1'],
  ['Pago', 'p1'],
  ['Ficha', 'c1'],
]
// Lo que la empresa ya dejó hecho: una ficha por logro, de izquierda a derecha.
const FICHAS = [
  ['Tu Empresa S.A.', 'r3#1+0.6'],
  ['CUIT 30-54891771-5', 'r4+0.5'],
  ['Burzaco', 'r5+0.8'],
  ['Tornería CNC', 'r6#1+0.4'],
  ['Cuenta creada', 'r10#1+0.3'],
  ['Mail confirmado', 'm2#1+0.3'],
  ['Débito automático', 'p2#1+0.3'],
  ['Ficha aprobada', 'c1#1+0.3'],
]
const X0 = 488
const PASO = 118
const Y_PASOS = 46

export const hud = {
  nombre: 'hud',
  get desde() { return tt('a3') },
  get hasta() { return tt('c3') + 0.2 },
  z: 100,
  montar(capa) {
    this.raiz = el('div', { class: 'capa' }, capa)
    this.logo = el('img', { class: 'abs', attrs: { src: '../assets/marca/logo-uiab-conecta-blanco.svg' }, style: { left: '64px', top: '30px', height: '40px' } }, this.raiz)
    this.ejemplo = el('div', { class: 'abs etiqueta', text: 'Datos de ejemplo', style: { left: '1856px', top: '42px', transform: 'translateX(-100%)', fontSize: '13px', color: C.gris, whiteSpace: 'nowrap' } }, this.raiz)

    // Barra de pasos
    this.caja = el('div', { class: 'abs', style: { left: `${X0 - 52}px`, top: `${Y_PASOS - 30}px`, width: `${PASO * (PASOS.length - 1) + 104}px`, height: '74px', borderRadius: '16px', background: 'rgba(6,36,62,0.55)', border: '1px solid rgba(95,185,232,0.14)' } }, this.raiz)
    this.pista = el('div', { class: 'abs', style: { left: `${X0}px`, top: `${Y_PASOS - 1}px`, width: `${PASO * (PASOS.length - 1)}px`, height: '2px', background: 'rgba(95,185,232,0.18)' } }, this.raiz)
    this.lleno = el('div', { class: 'abs', style: { left: `${X0}px`, top: `${Y_PASOS - 1}px`, width: `${PASO * (PASOS.length - 1)}px`, height: '2px', background: `linear-gradient(90deg, ${C.azul}, ${C.celeste})`, transformOrigin: '0 50%' } }, this.raiz)
    this.pasos = PASOS.map(([nombre], i) => {
      const x = X0 + i * PASO
      const halo = el('div', { class: 'abs', style: { left: `${x - 15}px`, top: `${Y_PASOS - 15}px`, width: '30px', height: '30px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(95,185,232,0.55), rgba(95,185,232,0))' } }, this.raiz)
      const punto = el('div', { class: 'abs', style: { left: `${x - 7}px`, top: `${Y_PASOS - 7}px`, width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(95,185,232,0.45)', background: C.fondo } }, this.raiz)
      const rotulo = el('div', { class: 'abs etiqueta', text: nombre, style: { left: `${x}px`, top: `${Y_PASOS + 12}px`, transform: 'translateX(-50%)', fontSize: '13px', letterSpacing: '0.1em', whiteSpace: 'nowrap', color: C.gris } }, this.raiz)
      return { halo, punto, rotulo }
    })

    // Fichas
    this.fichas = []
    let x = 64
    for (const [texto, cuando] of FICHAS) {
      const n = el('div', { class: 'pildora ficha', html: `<i></i>${texto}` }, this.raiz)
      const w = n.offsetWidth
      this.fichas.push({ n, x, cuando })
      x += w + 10
    }
    // Si no entran en el ancho, se achican todas por igual.
    this.kFichas = Math.min(1, 1792 / (x - 64))
  },
  frame(t) {
    const a = tt('a3')
    const b = tt('c3') + 0.2
    const vis = ep(t, a, a + 0.8) * (1 - ep(t, b - 0.6, b, salida))
    O(this.raiz, vis)
    T(this.raiz, { y: (1 - ep(t, a, a + 0.9)) * -18 })

    // Paso activo: el último cuyo momento ya llegó
    const tiempos = PASOS.map(([, c]) => tt(c))
    let activo = -1
    tiempos.forEach((tp, i) => { if (t >= tp - 0.15) activo = i })
    const avance = activo < 0 ? 0 : (activo + ep(t, tiempos[activo] - 0.15, tiempos[activo] + 0.5) - 1) / (PASOS.length - 1)
    this.lleno.style.transform = `scaleX(${clamp(avance).toFixed(4)})`
    this.pasos.forEach((p, i) => {
      const prendido = i <= activo
      const actual = i === activo
      const q = actual ? ep(t, tiempos[i] - 0.15, tiempos[i] + 0.4) : prendido ? 1 : 0
      p.punto.style.background = prendido ? (actual ? C.celeste : 'rgba(95,185,232,0.7)') : C.fondo
      p.punto.style.borderColor = prendido ? C.celeste : 'rgba(95,185,232,0.45)'
      T(p.punto, { s: actual ? 1 + 0.35 * q : 1 })
      O(p.halo, actual ? q : 0)
      p.rotulo.style.color = actual ? '#ffffff' : prendido ? '#b8d6ea' : C.gris
    })

    for (const f of this.fichas) {
      const tf = tt(f.cuando)
      const q = ep(t, tf, tf + 0.55)
      O(f.n, q)
      T(f.n, { x: 64 + (f.x - 64) * this.kFichas + (1 - q) * -24, y: 104, s: this.kFichas })
      f.n.style.transformOrigin = '0 50%'
    }
  },
}

// ── Firma: Vaxler, chico, en la esquina ─────────────────────────────────────
export const firma = {
  nombre: 'firma',
  desde: 0,
  hasta: DURACION,
  z: 120,
  montar(capa) {
    this.raiz = el('div', { class: 'abs', style: { left: '1856px', top: '1030px', transform: 'translate(-100%, -100%)', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' } }, capa)
    el('span', { class: 'etiqueta', text: 'Desarrollado por', style: { fontSize: '10px', letterSpacing: '0.2em', color: '#8aa0b6' } }, this.raiz)
    el('img', { attrs: { src: '../assets/marca/vaxler-wordmark.png' }, style: { height: '14px', display: 'block' } }, this.raiz)
  },
  frame(t) {
    O(this.raiz, 0.62 * ep(t, 0.6, 1.6) * (1 - ep(t, DURACION - 1.2, DURACION - 0.2, salida)))
  },
}
