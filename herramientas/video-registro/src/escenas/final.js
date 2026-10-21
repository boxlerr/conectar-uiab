// Cierre: el logo, la frase y el llamado a la acción. La voz dice
// «Registrate en uiabconecta.com» mientras aparece el botón.

import { DURACION } from '../linea.js'
import { el, T, O, ep, salida, C, tt, resorte } from '../lib/kit.js'

export default {
  nombre: 'final',
  get desde() { return tt('c3') - 0.5 },
  hasta: DURACION,
  z: 40,
  montar(capa) {
    this.brillo = el('div', { class: 'abs', style: { width: '1500px', height: '760px', left: '210px', top: '150px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(95,185,232,0.20), rgba(95,185,232,0))' } }, capa)
    this.logo = el('img', { class: 'abs', attrs: { src: '../assets/marca/logo-uiab-conecta-blanco.svg' }, style: { width: '760px', left: '580px', top: '330px' } }, capa)
    this.frase = el('div', { class: 'abs titulo', html: 'La red industrial de <span style="color:#5fb9e8">Almirante Brown</span>.', style: { left: '0', top: '530px', width: '1920px', textAlign: 'center', fontSize: '50px', fontWeight: 800, letterSpacing: '-0.02em' } }, capa)
    this.boton = el('div', { class: 'abs', style: { left: '960px', top: '650px', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '18px', whiteSpace: 'nowrap' } }, capa)
    el('div', { text: 'Registrate', style: { padding: '16px 34px', borderRadius: '999px', background: 'linear-gradient(180deg, #8fd3f5, #5fb9e8)', color: '#04182b', fontSize: '28px', fontWeight: 800, boxShadow: '0 0 50px rgba(95,185,232,0.45)' } }, this.boton)
    el('div', { text: 'uiabconecta.com', style: { fontSize: '32px', fontWeight: 700, color: '#ffffff', borderBottom: '2px solid rgba(95,185,232,0.6)', paddingBottom: '4px' } }, this.boton)
    this.bajada = el('div', { class: 'abs etiqueta', text: 'Unión Industrial de Almirante Brown', style: { left: '0', top: '780px', width: '1920px', textAlign: 'center', fontSize: '14px', color: C.gris } }, capa)
  },
  frame(t) {
    const a = tt('c3') - 0.5
    const r = resorte(t - a, { k: 120, c: 18 })
    const fin = ep(t, DURACION - 1.1, DURACION - 0.15, salida)
    O(this.brillo, ep(t, a, a + 1) * (1 - fin))
    O(this.logo, ep(t, a, a + 0.6) * (1 - fin))
    T(this.logo, { y: (1 - r) * 30, s: 0.96 + 0.04 * Math.min(1, r) })
    const f = ep(t, a + 0.35, a + 1.0)
    O(this.frase, f * (1 - fin))
    T(this.frase, { y: (1 - f) * 18 })
    const b = ep(t, tt('c3') + 0.1, tt('c3') + 0.7)
    O(this.boton, b * (1 - fin))
    this.boton.style.transform = `translateX(-50%) translateY(${((1 - b) * 16).toFixed(1)}px)`
    O(this.bajada, ep(t, tt('c3') + 0.6, tt('c3') + 1.2) * (1 - fin))
  },
}
