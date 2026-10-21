// Orquestador: monta las escenas y expone window.__render(t), que deja el
// escenario exactamente como se ve en el instante t. El render (render.mjs)
// lo llama cuadro por cuadro; la vista previa, contra el reloj del audio.

import { DURACION, FPS } from './linea.js'
import { fondo, hud, firma } from './escenas/capas.js'
import apertura from './escenas/apertura.js'
import recorrido from './escenas/recorrido.js'
import subtitulos from './escenas/subtitulos.js'
import final from './escenas/final.js'

const params = new URLSearchParams(location.search)
const modoRender = params.has('render')
if (modoRender) document.body.classList.add('render')

const stage = document.getElementById('stage')
const mundo = document.getElementById('mundo')

const todas = [fondo, apertura, recorrido, final, hud, subtitulos, firma]

async function montar() {
  await Promise.all([
    document.fonts.load('800 100px Manrope'),
    document.fonts.load('700 100px Manrope'),
    document.fonts.load('400 40px Inter'),
    document.fonts.load('600 40px Inter'),
    document.fonts.load('700 40px Inter'),
  ])
  await document.fonts.ready
  for (const e of todas) {
    const capa = document.createElement('div')
    capa.className = 'escena'
    capa.style.zIndex = e.z ?? 10
    capa.dataset.escena = e.nombre
    mundo.appendChild(capa)
    e.capa = capa
    e._vis = true
    await e.montar(capa)
  }
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
}

function dibujar(t) {
  for (const e of todas) {
    const vis = t >= e.desde && t < e.hasta
    if (vis !== e._vis) {
      e.capa.style.display = vis ? '' : 'none'
      e._vis = vis
    }
    if (vis) e.frame(t)
  }
}

window.__render = (t) => dibujar(t)
window.__listo = montar().then(() => true)

// ── Vista previa ────────────────────────────────────────────────────────────
if (!modoRender) {
  const ajustarEscala = () => {
    const k = Math.min(innerWidth / 1920, (innerHeight - 52) / 1080)
    stage.style.transform = `scale(${k})`
  }
  ajustarEscala()
  addEventListener('resize', ajustarEscala)

  const scrub = document.getElementById('scrub')
  scrub.max = DURACION
  const tc = document.getElementById('tc')
  const boton = document.getElementById('play')
  const audio = new Audio('../audio/mezcla.wav')
  let tocando = false
  let t = parseFloat(params.get('t') || '0')
  let origen = 0

  const mostrar = (tt) => {
    t = Math.max(0, Math.min(DURACION - 1 / FPS, tt))
    scrub.value = t
    tc.textContent = `${t.toFixed(2)} s  ·  frame ${Math.round(t * FPS)}`
    dibujar(t)
  }
  const loop = () => {
    if (!tocando) return
    const ahora = audio.readyState >= 2 && !audio.paused ? audio.currentTime : (performance.now() - origen) / 1000
    mostrar(ahora)
    if (ahora >= DURACION - 0.02) {
      tocando = false
      boton.textContent = '▶︎ Play'
      audio.pause()
      return
    }
    requestAnimationFrame(loop)
  }
  boton.onclick = () => {
    tocando = !tocando
    boton.textContent = tocando ? '❚❚ Pausa' : '▶︎ Play'
    if (tocando) {
      if (t >= DURACION - 0.05) t = 0
      origen = performance.now() - t * 1000
      audio.currentTime = t
      audio.play().catch(() => {})
      requestAnimationFrame(loop)
    } else audio.pause()
  }
  scrub.oninput = () => {
    if (tocando) { audio.currentTime = Number(scrub.value) }
    mostrar(Number(scrub.value))
  }
  addEventListener('keydown', (ev) => {
    if (ev.code === 'Space') { ev.preventDefault(); boton.click() }
    if (ev.code === 'ArrowRight') mostrar(t + (ev.shiftKey ? 1 : 1 / FPS))
    if (ev.code === 'ArrowLeft') mostrar(t - (ev.shiftKey ? 1 : 1 / FPS))
  })
  window.__listo.then(() => mostrar(t))
}
