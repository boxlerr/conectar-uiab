// La trama de puntos del hero del sitio (un punto de 1px cada 30px, cian al
// 28%), dibujada en canvas para poder deformarla: revelado desde el centro,
// onda expansiva en los impactos y deriva diagonal como en la web.

import { el } from './dom.js'
import { rgb, clamp } from './anim.js'

export class Grilla {
  constructor(padre, { paso = 30, color = '#05c7f2', radio = 1.25, ancho = 1920, alto = 1080, clase = 'capa' } = {}) {
    this.canvas = el('canvas', { class: clase }, padre)
    this.canvas.width = ancho
    this.canvas.height = alto
    this.ctx = this.canvas.getContext('2d')
    this.paso = paso
    this.radio = radio
    this.ancho = ancho
    this.alto = alto
    this.setColor(color)
  }

  setColor(hex) {
    const [r, g, b] = rgb(hex)
    this.rgb = `${r},${g},${b}`
  }

  /**
   * alfa:     opacidad base de los puntos
   * revelado: radio (px) del frente que los va encendiendo desde `centro`; null = todos
   * onda:     { r, fuerza, ancho, brillo } — anillo que empuja los puntos hacia afuera
   * deriva:   [dx, dy] desplazamiento de la trama (se repite cada `paso`)
   */
  dibujar({ alfa = 0.28, revelado = null, centro = [960, 540], onda = null, deriva = [0, 0], radio = this.radio } = {}) {
    const g = this.ctx
    g.clearRect(0, 0, this.ancho, this.alto)
    if (alfa <= 0.001) return
    const p = this.paso
    const ox = ((deriva[0] % p) + p) % p
    const oy = ((deriva[1] % p) + p) % p
    const [cx, cy] = centro
    g.fillStyle = `rgb(${this.rgb})`
    for (let y = -p + oy; y < this.alto + p; y += p) {
      for (let x = -p + ox; x < this.ancho + p; x += p) {
        const dx = x - cx
        const dy = y - cy
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        let a = alfa
        let px = x
        let py = y
        let r = radio
        if (revelado != null) {
          const f = clamp((revelado - d) / 120)
          if (f <= 0) continue
          a *= f
          r *= 0.4 + 0.6 * f
        }
        if (onda && onda.fuerza > 0) {
          const k = Math.exp(-(((d - onda.r) / onda.ancho) ** 2))
          const empuje = onda.fuerza * k
          px += (dx / d) * empuje
          py += (dy / d) * empuje
          a = Math.min(1, a + (onda.brillo ?? 0.7) * k)
          r *= 1 + 1.6 * k
        }
        g.globalAlpha = a
        g.beginPath()
        g.arc(px, py, r, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.globalAlpha = 1
  }
}
