// Las palabras de cada línea con su tiempo absoluto en el video.

import { PALABRAS } from '../palabras.js'
import { L } from '../linea.js'

export function palabrasDe(id) {
  const ln = L[id]
  if (!ln || !PALABRAS[id]) throw new Error(`sin palabras para ${id}: correr herramientas/palabras.mjs`)
  return PALABRAS[id].map((p) => ({ w: p.w, t0: ln.t0 + p.t0, t1: ln.t0 + p.t1 }))
}
