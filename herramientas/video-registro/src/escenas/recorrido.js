// El recorrido: las pantallas reales del sitio flotando como tarjetas, una por
// tramo (home → registro → mail → checkout → directorio). El campo que nombra
// la voz brilla y el resto se apaga; el cursor hace los clicks.
//
// Tarjetas GRANDES y cámara QUIETA. La primera versión usaba tarjetas chicas y
// una cámara que se movía en cada frase, y mareaba ("me marea verlo todo tan
// chiquito en un cuadrado chiquito"). Ahora cada paso tiene un solo encuadre,
// con la interfaz al ~1,2× de su tamaño real, y la cámara sólo se mueve cuando
// cambia la pantalla. Lo que señala es el resalte, no el movimiento.
//
// Todos los tiempos se anclan a la narración con tt(): 'r3#1' es «y razón
// social», el segundo tramo de la línea r3. Si se regraba la voz, el video se
// reacomoda solo.

import { Ventana, captura, rect, union, tt, ep, ease, salida, lerp, recorrido as caminoCursor, C, T, O, el } from '../lib/kit.js'

const REG = ['reg-1', 'reg-2a', 'reg-2b', 'reg-2c', 'reg-3a', 'reg-3b', 'reg-4a', 'reg-4b', 'reg-5a', 'reg-5b', 'reg-6', 'reg-ok']
const R = Object.fromEntries(REG.map((n, i) => [n, i]))
const CENTRO = { x: 960, y: 562 }
const TARJETA = { ancho: 1600, alto: 812 }
const CX = 2420 // centro de la columna del formulario, en px de la captura

/** Entrada y salida de una tarjeta: sube un poco y aparece; se va hacia arriba. */
function presencia(v, t, a, b, centro = CENTRO) {
  if (t < a - 0.01 || t > b + 0.45) { O(v.raiz, 0); return false }
  const e = ep(t, a, a + 0.6)
  const s = ep(t, b, b + 0.4, salida)
  v.pose({ x: centro.x, y: centro.y + (1 - e) * 40 - s * 30, s: 0.985 + 0.015 * e, o: e * (1 - s) })
  return true
}

/** Cuál captura se ve: estados = [[t, índice], …]; cruza en 0,35 s. */
function capturaEn(v, t, estados) {
  let k = 0
  for (let j = 0; j < estados.length; j++) if (t >= estados[j][0]) k = j
  const [tk, i] = estados[k]
  const previa = k > 0 ? estados[k - 1][1] : i
  v.mostrar(previa, i, ep(t, tk, tk + 0.35, ease.inOutSine))
}

/** Cámara: keys = [[t, [cx, cy, z], duración], …]; cada tramo va del anterior al siguiente. */
function camaraEn(v, t, keys) {
  let cam = keys[0][1]
  for (let j = 1; j < keys.length; j++) {
    const [tk, c, d] = keys[j]
    if (t < tk) break
    const p = ep(t, tk, tk + d, ease.inOutSine)
    cam = [lerp(keys[j - 1][1][0], c[0], p), lerp(keys[j - 1][1][1], c[1], p), lerp(keys[j - 1][1][2], c[2], p)]
  }
  v.camara(cam[0], cam[1], cam[2])
}

/** Resaltes: lista de { r, a, b, color }; de a uno por vez. */
function resaltesEn(v, t, lista) {
  let k = 0
  for (const h of lista) {
    if (t < h.a - 0.05 || t > h.b + 0.05) continue
    const q = ep(t, h.a, h.a + 0.35) * (1 - ep(t, h.b - 0.3, h.b, salida))
    v.resalte(k++, h.r, q, { color: h.color ?? C.celeste, apagar: h.apagar ?? 0.45 })
  }
  for (let j = k; j < v.resaltes.length; j++) v.resalte(j, null, 0)
}

/** Cursor: camino = [[t, x, y], …], clicks = [t, …], visible entre a y b. */
function cursorEn(v, t, { camino, clicks = [], a, b }) {
  if (t < a || t > b) { v.puntero(0, 0, 0); return }
  const [x, y] = caminoCursor(t, camino)
  const ultimo = clicks.filter((c) => t >= c).pop()
  v.puntero(x, y, ep(t, a, a + 0.3) * (1 - ep(t, b - 0.3, b)), ultimo != null ? t - ultimo : null)
}
function cursoresEn(v, t, lista) {
  const c = lista.find((k) => t >= k.a && t <= k.b)
  if (c) cursorEn(v, t, c)
  else v.puntero(0, 0, 0)
}

const centroDe = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]

export default {
  nombre: 'recorrido',
  get desde() { return Math.min(tt('r1') - 0.8, tt('a3.fin') + 0.3) },
  get hasta() { return tt('c3') + 0.4 },
  z: 30,
  async montar(capa) {
    const caps = (ns) => Promise.all(ns.map(captura))
    this.home = new Ventana(capa, await caps(['home']), { ...TARJETA, titulo: 'uiabconecta.com' })
    this.reg = new Ventana(capa, await caps(REG), { ...TARJETA, titulo: 'uiabconecta.com/register' })
    this.mail = new Ventana(capa, await caps(['mail']), { ...TARJETA, titulo: 'Confirmá tu email — UIAB Conecta' })
    this.pago = new Ventana(capa, await caps(['pago-1', 'pago-2', 'pago-3']), { ...TARJETA, titulo: 'uiabconecta.com/suscripcion/checkout' })
    this.dir = new Ventana(capa, await caps(['directorio', 'ficha']), { ...TARJETA, titulo: 'uiabconecta.com/directorio' })
    // Las dos opciones de pago, encima del formulario mientras la voz dice los
    // dos precios: el registro sólo muestra el plan elegido, y lo que hay que
    // ver es que se puede elegir cualquiera de los dos.
    this.opciones = new Ventana(capa, await caps(['pago-1', 'pago-2']), { ancho: 1260, alto: 372, barra: false })
    this.rotuloOpciones = el('div', { class: 'abs etiqueta', text: 'Lo elegís al pagar', style: { left: '0', top: '0', fontSize: '16px', color: C.celeste, whiteSpace: 'nowrap', padding: '9px 18px', borderRadius: '999px', background: 'rgba(4,24,43,0.92)', border: '1px solid rgba(95,185,232,0.4)' } }, capa)
    for (const v of [this.home, this.reg, this.mail, this.pago, this.dir, this.opciones]) O(v.raiz, 0)
    O(this.rotuloOpciones, 0)
  },

  frame(t) {
    this.tramoHome(t)
    this.tramoRegistro(t)
    this.tramoOpciones(t)
    this.tramoMail(t)
    this.tramoPago(t)
    this.tramoDirectorio(t)
  },

  // ── r1: la home ───────────────────────────────────────────────────────────
  tramoHome(t) {
    const v = this.home
    if (!presencia(v, t, Math.min(tt('r1') - 0.7, tt('a3.fin') + 0.35), tt('r2') - 0.5)) return
    const reg = rect('home.registrate')
    camaraEn(v, t, [[0, [1800, 1200, 1.43], 0], [tt('r1#1') - 0.5, [1340, 1420, 2.15], 1.3]])
    resaltesEn(v, t, [{ r: reg, a: tt('r1#1'), b: tt('r2') - 0.45, apagar: 0.35 }])
    const [rx, ry] = centroDe(reg)
    cursorEn(v, t, {
      a: tt('r1') + 0.4,
      b: tt('r2') - 0.5,
      camino: [[tt('r1') + 0.4, 1700, 1900], [tt('r1#1') + 0.35, rx + 30, ry + 6]],
      clicks: [tt('r1#1') + 0.65],
    })
  },

  // ── r2–r10 y el comienzo de m1: el formulario ─────────────────────────────
  tramoRegistro(t) {
    const v = this.reg
    if (!presencia(v, t, tt('r2') - 0.45, tt('m1@0.5'))) return
    capturaEn(v, t, [
      [tt('r2') - 0.45, R['reg-1']],
      [tt('r2.fin') + 0.05, R['reg-2a']],
      [tt('r3#1') + 0.1, R['reg-2b']],
      [tt('r4') - 0.05, R['reg-2c']],
      [tt('r5') - 0.35, R['reg-3a']],
      [tt('r5@0.3'), R['reg-3b']],
      [tt('r6') - 0.35, R['reg-4a']],
      [tt('r6#1'), R['reg-4b']],
      [tt('r7') - 0.35, R['reg-5a']],
      [tt('r7@0.3'), R['reg-5b']],
      [tt('r8') - 0.35, R['reg-6']],
      [tt('r10#1') - 0.05, R['reg-ok']],
    ])
    // Un encuadre por paso. Sólo se mueve cuando cambia la pantalla.
    const ok = union(rect('reg-ok.titulo'), rect('reg-ok.pasos'))
    camaraEn(v, t, [
      [0, [CX, 1662, 2.4], 0],
      [tt('r2.fin') + 0.05, [CX, 940, 2.88], 0.6],
      [tt('r4') - 0.2, [CX, 1150, 3.2], 1.2],
      [tt('r5') - 0.35, [CX, 962, 2.65], 0.6],
      [tt('r6') - 0.35, [CX, 876, 2.88], 0.6],
      [tt('r6#1') + 0.15, [CX, 836, 2.88], 0.6],
      [tt('r7') - 0.35, [CX, 1068, 2.88], 0.6],
      [tt('r8') - 0.35, [CX, 835, 2.88], 0.6],
      [tt('r10') - 0.25, [CX, 1250, 2.88], 0.9],
      // La pantalla de éxito es una tarjeta centrada en la página, no la
      // columna: el encuadre salta de una vez, debajo del fundido (ver blanco).
      [tt('r10#1') + 0.12, [(ok[0] + ok[2]) / 2, (ok[1] + ok[3]) / 2, 2.08], 0.01],
    ])
    const cuit = rect('reg-2c.cuit')
    resaltesEn(v, t, [
      { r: rect('reg-1.empresa'), a: tt('r2#1'), b: tt('r2#2') },
      { r: rect('reg-1.profesional'), a: tt('r2#2'), b: tt('r2.fin') - 0.05 },
      { r: rect('reg-2b.tipo'), a: tt('r3') + 0.1, b: tt('r3#1') },
      { r: rect('reg-2b.razon'), a: tt('r3#1'), b: tt('r3.fin') + 0.2 },
      { r: cuit, a: tt('r4') + 0.05, b: tt('r4#1') },
      { r: cuit, a: tt('r4#1'), b: tt('r4.fin') + 0.3, color: C.naranja },
      { r: union(rect('reg-3b.lugar'), rect('reg-3b.direccion')), a: tt('r5') + 0.1, b: tt('r5#1') },
      { r: rect('reg-3b.descripcion'), a: tt('r5#1'), b: tt('r5.fin') + 0.2 },
      { r: rect('reg-4a.opcion'), a: tt('r6') + 0.1, b: tt('r6#1') },
      { r: rect('reg-4b.elegido'), a: tt('r6#1') + 0.1, b: tt('r6.fin') + 0.2 },
      { r: rect('reg-5b.email'), a: tt('r7') + 0.05, b: tt('r7#1') },
      { r: rect('reg-5b.password'), a: tt('r7#1'), b: tt('r7.fin') + 0.2 },
      { r: rect('reg-6.plan'), a: tt('r8') + 0.15, b: tt('r9') - 0.2, apagar: 0.3 },
      { r: rect('reg-6.finalizar'), a: tt('r10') + 0.2, b: tt('r10#1') - 0.1 },
      { r: rect('reg-ok.titulo'), a: tt('m1') - 0.1, b: tt('m1@0.5') },
    ])
    // Finalizar → «Revisá tu correo»: es otra página, y se ve como tal.
    const tok = tt('r10#1') - 0.05
    O(v.blanco, ep(t, tok - 0.05, tok + 0.17) * (1 - ep(t, tok + 0.2, tok + 0.5)))
    // Mientras están arriba las dos opciones, el formulario queda atrás.
    O(v.velo, 0.55 * ep(t, tt('r9') - 0.3, tt('r9') + 0.1) * (1 - ep(t, tt('r10') - 0.35, tt('r10') - 0.05)))
    const [ex, ey] = centroDe(rect('reg-1.empresa'))
    const [cx, cy] = centroDe(rect('reg-1.continuar'))
    const [ox, oy] = centroDe(rect('reg-4a.opcion'))
    const [lx, ly] = centroDe(rect('reg-4b.elegido'))
    const [fx, fy] = centroDe(rect('reg-6.finalizar'))
    cursoresEn(v, t, [
      { a: tt('r2#1') - 0.2, b: tt('r2.fin') + 0.25, camino: [[tt('r2#1') - 0.2, ex + 260, ey + 160], [tt('r2#1') + 0.4, ex + 120, ey - 20], [tt('r2.fin') - 0.5, cx + 40, cy + 8]], clicks: [tt('r2.fin') - 0.2] },
      { a: tt('r6') + 0.1, b: tt('r6.fin') + 0.1, camino: [[tt('r6') + 0.1, ox + 380, oy + 200], [tt('r6#1') - 0.35, ox - 40, oy + 6], [tt('r6#1') + 0.5, lx + 260, ly + 10]], clicks: [tt('r6#1') - 0.15] },
      { a: tt('r10') + 0.1, b: tt('r10#1') + 0.1, camino: [[tt('r10') + 0.1, fx + 300, fy + 160], [tt('r10@0.45'), fx + 40, fy + 8]], clicks: [tt('r10@0.45') + 0.15] },
    ])
  },

  // ── r9: las dos opciones de pago ──────────────────────────────────────────
  tramoOpciones(t) {
    const v = this.opciones
    const a = tt('r9') - 0.3
    const b = tt('r10') - 0.35
    const centro = { x: 960, y: 590 }
    const vis = presencia(v, t, a, b, centro)
    const q = vis ? ep(t, a + 0.2, a + 0.7) * (1 - ep(t, b, b + 0.35, salida)) : 0
    O(this.rotuloOpciones, q)
    this.rotuloOpciones.style.transform = `translate(960px, ${(centro.y - v.alto / 2 - 58 + (1 - q) * 10).toFixed(1)}px) translateX(-50%)`
    if (!vis) return
    capturaEn(v, t, [[a, 0], [tt('r9#1') - 0.05, 1]])
    const par = union(rect('pago-1.mensual'), rect('pago-1.anual'))
    // Un poco más arriba que el centro: entra «Elegí tu ciclo de pago» y no asoma el botón.
    v.camara((par[0] + par[2]) / 2, (par[1] + par[3]) / 2 - 20, 3.1)
    resaltesEn(v, t, [
      { r: rect('pago-1.mensual'), a: tt('r9') + 0.05, b: tt('r9#1') },
      { r: rect('pago-2.anual'), a: tt('r9#1'), b: b + 0.3 },
    ])
    const [ax, ay] = centroDe(rect('pago-1.anual'))
    cursorEn(v, t, { a: tt('r9') + 0.3, b: b + 0.2, camino: [[tt('r9') + 0.3, ax - 300, ay + 160], [tt('r9#1') - 0.35, ax - 60, ay + 20]], clicks: [tt('r9#1') - 0.15] })
  },

  // ── m1–m2: el mail de confirmación ────────────────────────────────────────
  tramoMail(t) {
    const v = this.mail
    if (!presencia(v, t, tt('m1@0.5'), tt('p1') - 0.45)) return
    const boton = rect('mail.boton')
    // Sin acercamiento: el correo entero se lee, y cada movimiento de más marea.
    v.camara(1920, 671, 1.9)
    resaltesEn(v, t, [
      { r: rect('mail.titulo'), a: tt('m1@0.65'), b: tt('m1.fin') + 0.1 },
      { r: boton, a: tt('m2') + 0.1, b: tt('p1') - 0.45 },
    ])
    const [bx, by] = centroDe(boton)
    cursorEn(v, t, { a: tt('m1.fin') - 0.2, b: tt('p1') - 0.5, camino: [[tt('m1.fin') - 0.2, bx + 520, by + 260], [tt('m2') + 0.3, bx + 30, by + 8]], clicks: [tt('m2#1') - 0.05] })
  },

  // ── p1–p4: el checkout ────────────────────────────────────────────────────
  tramoPago(t) {
    const v = this.pago
    if (!presencia(v, t, tt('p1') - 0.45, tt('c1') - 0.45)) return
    capturaEn(v, t, [[0, 0], [tt('p1#1'), 1], [tt('p2') + 0.35, 2]])
    camaraEn(v, t, [[0, [1920, 1037, 2.88], 0], [tt('p2') + 0.45, [1920, 1760, 2.65], 0.9]])
    const codigo = rect('pago-3.codigo')
    resaltesEn(v, t, [
      { r: rect('pago-1.mensual'), a: tt('p1') + 0.15, b: tt('p1#1') },
      { r: rect('pago-2.anual'), a: tt('p1#1') + 0.1, b: tt('p1.fin') + 0.1 },
      { r: rect('pago-3.debito'), a: tt('p2#1'), b: tt('p2.fin') + 0.2, apagar: 0.3 },
      { r: rect('pago-3.cuit'), a: tt('p3') + 0.1, b: tt('p3#1') },
      { r: rect('pago-3.cuit'), a: tt('p3#1'), b: tt('p3.fin') + 0.15, color: C.naranja },
      { r: codigo, a: tt('p4') - 0.05, b: tt('c1') - 0.5, color: C.naranja },
    ])
    const [ax, ay] = centroDe(rect('pago-1.anual'))
    const [kx, ky] = centroDe(rect('pago-1.continuar'))
    cursorEn(v, t, {
      a: tt('p1') + 0.2,
      b: tt('p2') + 0.6,
      camino: [[tt('p1') + 0.2, ax + 300, ay + 260], [tt('p1#1') - 0.35, ax + 40, ay + 10], [tt('p2') - 0.1, kx + 60, ky + 6]],
      clicks: [tt('p1#1') - 0.1, tt('p2') + 0.15],
    })
  },

  // ── c1–c2: el directorio y una ficha publicada ────────────────────────────
  tramoDirectorio(t) {
    const v = this.dir
    if (!presencia(v, t, tt('c1') - 0.45, tt('c3') - 0.35)) return
    const a = tt('c1') - 0.45
    const ficha = tt('c2#1') - 0.1
    capturaEn(v, t, [[a, 0], [ficha, 1]])
    v.titulo(t < ficha + 0.2 ? 'uiabconecta.com/directorio' : 'uiabconecta.com/empresas/vaxler')
    const id = rect('ficha.identidad')
    if (t < ficha + 0.18) v.camara(1920, 1080, 1.0 + 0.06 * ep(t, a, ficha, ease.inOutSine))
    else v.camara(1920, (id[1] + id[3]) / 2 + 60, 1.22)
    resaltesEn(v, t, [{ r: id, a: ficha + 0.6, b: tt('c3') - 0.4, apagar: 0.25 }])
    v.puntero(0, 0, 0)
  },
}
