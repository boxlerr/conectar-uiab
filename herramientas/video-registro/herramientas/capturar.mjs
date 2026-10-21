// Capturas reales de uiabconecta.com para el video, a 2× (nítidas cuando la
// cámara se acerca). Cada captura anota dónde quedó cada campo, así los
// resaltes caen exactos sobre la imagen y no a ojo.
//
//   node herramientas/capturar.mjs          → assets/capturas/*.png + src/capturas.js
//
// Contra PRODUCCIÓN y sin escribir nada: el alta, el chequeo de CUIT, la
// solicitud de pago y cualquier otro POST quedan interceptados en el navegador
// (las mismas reglas que la pieza anterior, ../video-tutorial/escenas/registro.mjs).
// En `next dev` el paso de la membresía muestra un botón "Acceso gratis" que el
// sitio real no tiene.

import { chromium } from 'playwright'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { simularAlta, simularPago } from '../../video-tutorial/escenas/registro.mjs'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.BASE_URL || 'https://www.uiabconecta.com'
const DIR = path.join(raiz, 'assets', 'capturas')
const K = 2 // deviceScaleFactor: todas las medidas se guardan en píxeles de la imagen

const env = Object.fromEntries(
  (await readFile(path.join(raiz, '../../.env'), 'utf8')).split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)

// El Chromium cacheado (build 1234) y no el que pide este Playwright.
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')
const browser = await chromium.launch({
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : existsSync(cache) ? { executablePath: cache } : {}),
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
})
const opciones = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: K, locale: 'es-AR', colorScheme: 'light', reducedMotion: 'no-preference' }

await mkdir(DIR, { recursive: true })
const CAPTURAS = {}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/** Rectángulos [x0, y0, x1, y1] en px de la imagen, de cada pieza pedida. */
async function medir(page, piezas, desplazamiento = 0) {
  const r = {}
  for (const [nombre, p] of Object.entries(piezas)) {
    const caja = await page.evaluate(({ sel, texto, cerca, todos }) => {
      const re = texto ? new RegExp(texto, 'i') : null
      const els = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && (!re || re.test(e.textContent || '')))
      const elegidos = (todos ? els : els.slice(0, 1)).map((e) => (cerca ? e.closest(cerca) ?? e : e))
      if (!elegidos.length) return null
      const rs = elegidos.map((e) => e.getBoundingClientRect())
      return [Math.min(...rs.map((q) => q.left)), Math.min(...rs.map((q) => q.top)) + scrollY, Math.max(...rs.map((q) => q.right)), Math.max(...rs.map((q) => q.bottom)) + scrollY]
    }, typeof p === 'string' ? { sel: p } : { ...p, texto: p.texto?.source ?? p.texto })
    if (!caja) { console.log(`   ⚠ no encontré «${nombre}»`); continue }
    r[nombre] = caja.map((v, i) => Math.round((v - (i % 2 ? desplazamiento : 0)) * K))
  }
  return r
}

/** Captura la vista (o un tramo de la página) y anota sus piezas. */
async function sacar(page, nombre, piezas = {}, { alto = 1080, desde = 0 } = {}) {
  await dormir(450)
  const archivo = path.join(DIR, `${nombre}.png`)
  if (alto === 1080 && desde === 0) await page.screenshot({ path: archivo })
  else await page.screenshot({ path: archivo, fullPage: true, clip: { x: 0, y: desde, width: 1920, height: alto } })
  CAPTURAS[nombre] = { w: 1920 * K, h: alto * K, r: await medir(page, piezas, desde) }
  console.log(`✓ ${nombre}  ${Object.keys(CAPTURAS[nombre].r).join(', ')}`)
}

const esperarPaso = (page, titulo) => page.waitForFunction(
  (t) => [...document.querySelectorAll('h2')].some((h) => h.textContent.includes(t)), titulo, { timeout: 15000 })
const siguiente = async (page, titulo) => {
  await page.getByRole('button', { name: /^(Continuar|Siguiente|Definir Especialidad|Credenciales|Seleccionar Plan)/ }).last().click()
  await esperarPaso(page, titulo)
  await dormir(500)
}
const elegir = async (page, disparador, opcion) => {
  await page.locator('form button', { hasText: disparador }).first().click()
  await dormir(250)
  await page.getByRole('button', { name: opcion, exact: true }).last().click()
  await dormir(250)
}
const sacarCursorDeEncima = (page) => page.mouse.move(5, 1075)

// ── Pasada 1: home + registro + mail (sin sesión) ──────────────────────────
{
  const ctx = await browser.newContext(opciones)
  await simularAlta(ctx)
  const page = await ctx.newPage()

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await sacar(page, 'home', {
    registrate: { sel: 'a', texto: /^\s*Registrate\s*$/ },
    socia: { sel: 'a', texto: /Soy socia/ },
    titulo: 'h1',
  })

  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' })
  await esperarPaso(page, '¿Quién se registra?')
  const COLUMNA = { sel: 'form', cerca: null }
  await sacar(page, 'reg-1', {
    columna: COLUMNA,
    socia: { sel: 'div', texto: /^¿Tu empresa ya es socia de la UIAB\?/, cerca: 'div.rounded-2xl, div.rounded-xl' },
    empresa: { sel: '[role="radio"]', texto: /Empresa u organizaci/ },
    profesional: { sel: '[role="radio"]', texto: /Particular o profesional/ },
    continuar: { sel: 'button', texto: /^Continuar/ },
  })

  await siguiente(page, 'Identidad.')
  const IDENTIDAD = {
    columna: COLUMNA,
    tipo: { sel: 'label', texto: /^Tipo de organizaci/, cerca: 'div.space-y-2, [class*="space-y"]' },
    razon: { sel: 'input[name="razonSocial"]' },
    comercial: { sel: 'input[name="nombreComercial"]' },
    cuit: { sel: 'input[name="cuit"]' },
    telefono: { sel: 'input[name="telefono"]' },
    siguiente: { sel: 'button', texto: /^Siguiente/ },
  }
  await sacar(page, 'reg-2a', IDENTIDAD)
  await elegir(page, 'Selecciona tipo...', 'Empresa / Industria')
  await page.fill('input[name="razonSocial"]', 'Tu Empresa S.A.')
  await sacarCursorDeEncima(page)
  await sacar(page, 'reg-2b', IDENTIDAD)
  await page.fill('input[name="nombreComercial"]', 'Tu Empresa')
  await page.locator('input[name="cuit"]').pressSequentially('30548917715')
  await page.fill('input[name="telefono"]', '+54 9 11 0000-0000')
  await page.locator('input[name="cuit"]').focus()
  await sacarCursorDeEncima(page)
  await sacar(page, 'reg-2c', IDENTIDAD)

  await siguiente(page, 'Localización.')
  const UBICACION = {
    columna: COLUMNA,
    lugar: { sel: 'label', texto: /^Provincia/, cerca: 'div.grid' },
    localidad: { sel: 'label', texto: /^Localidad/, cerca: '[class*="space-y"]' },
    direccion: { sel: 'input[name="direccion"]' },
    descripcion: { sel: 'textarea[name="descripcion"]' },
  }
  await sacar(page, 'reg-3a', UBICACION)
  await elegir(page, 'Elegí tu provincia', 'Buenos Aires')
  await elegir(page, 'Elegí tu localidad', 'Burzaco')
  await page.fill('input[name="direccion"]', 'Av. Espora 1234')
  await page.fill('textarea[name="descripcion"]', 'Fabricamos piezas metálicas a medida: tornería CNC, corte y soldadura.')
  await sacarCursorDeEncima(page)
  await sacar(page, 'reg-3b', UBICACION)

  await siguiente(page, 'Alcance.')
  const ALCANCE = {
    columna: COLUMNA,
    categoria: { sel: 'label', texto: /^Categor/, cerca: '[class*="space-y"]' },
    empleados: { sel: 'input[name="size"]' },
  }
  await page.locator('form button', { hasText: /Seleccion.\s+una categor/ }).first().click()
  await dormir(300)
  // Desde la PR boxlerr/conectar-uiab#2 el buscador encuentra la especialidad
  // por su propio nombre (antes había que buscar el rubro padre, "Metal").
  await page.locator('input[placeholder="Buscar categoría..."]').pressSequentially('Torner', { delay: 40 })
  await dormir(500)
  await sacar(page, 'reg-4a', { ...ALCANCE, opcion: { sel: 'form button', texto: /Torner.a y Mecanizado CNC/ }, lista: { sel: 'input[placeholder="Buscar categoría..."]', cerca: 'div.absolute' } })
  await page.locator('form button', { hasText: /Torner.a y Mecanizado CNC/ }).first().click()
  await dormir(300)
  await page.fill('input[name="size"]', '25')
  await sacarCursorDeEncima(page)
  await sacar(page, 'reg-4b', { ...ALCANCE, elegido: { sel: 'form button', texto: /Torner.a y Mecanizado CNC/ } })

  await siguiente(page, 'Acceso.')
  const ACCESO = {
    columna: COLUMNA,
    email: { sel: 'input[name="email"]' },
    password: { sel: 'input[name="password"]' },
    usuarios: { sel: 'p', texto: /usuario principal/, cerca: 'div.rounded-xl, div.rounded-lg' },
  }
  await sacar(page, 'reg-5a', ACCESO)
  await page.fill('input[name="email"]', 'administracion@tuempresa.com.ar')
  await page.fill('input[name="password"]', 'conecta2026')
  await sacarCursorDeEncima(page)
  await sacar(page, 'reg-5b', ACCESO)

  await siguiente(page, 'Tu suscripción.')
  await sacar(page, 'reg-6', {
    columna: COLUMNA,
    plan: { sel: 'h3', texto: /^UIAB Conecta$/, cerca: 'div.overflow-hidden' },
    precio: { sel: 'span', texto: /^\$\s?50\.000$/ },
    incluye: { sel: 'p', texto: /^Qué incluye$/, cerca: 'div' },
    anual: { sel: 'p', texto: /pagar el año completo/ },
    finalizar: { sel: 'button', texto: /Finalizar y continuar al pago/ },
  })

  await page.getByRole('button', { name: /Finalizar y continuar al pago/ }).click()
  await page.waitForFunction(() => [...document.querySelectorAll('h2')].some((h) => h.textContent.includes('Revisá tu correo')), null, { timeout: 15000 })
  await dormir(600)
  await sacar(page, 'reg-ok', {
    tarjeta: { sel: 'h2', texto: /Revisá tu correo/, cerca: 'div.max-w-lg' },
    titulo: { sel: 'h2', texto: /Revisá tu correo/ },
    pasos: { sel: 'p', texto: /^1/, cerca: 'div.space-y-4' },
  })

  await page.goto(`${BASE}/__video/mail-confirmacion`, { waitUntil: 'load' })
  await sacar(page, 'mail', {
    correo: 'body > table table',
    logo: 'img',
    titulo: 'h1',
    boton: { sel: 'a', texto: /Confirmar mi email/ },
  })
  await ctx.close()
}

// ── Pasada 2: el checkout (con la sesión de filmación) ──────────────────────
{
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: env.UIAB_EMAIL }),
  })
  const datos = await r.json()
  const token = datos.hashed_token ?? datos.properties?.hashed_token
  const ctx = await browser.newContext(opciones)
  await simularPago(ctx, { urlPlanMensual: env.SIPAGO_PLAN_MENSUAL_URL })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/api/auth/callback?token_hash=${token}&type=magiclink&next=/suscripcion/checkout`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="radiogroup"][aria-label="Ciclo de pago"]', { timeout: 20000 })
  await dormir(600)
  const CHECKOUT = {
    tarjeta: { sel: 'p', texto: /^Pago con Sipago$/, cerca: '.rounded-xl, [class*="shadow-lg"]' },
    titulo: 'h1',
    sipago: { sel: 'p', texto: /^Pago con Sipago$/, cerca: 'div.flex' },
    mensual: { sel: '[role="radio"]', texto: /^Mensual/ },
    anual: { sel: '[role="radio"]', texto: /^Anual/ },
    continuar: { sel: 'button', texto: /^Continuar$/ },
  }
  await sacar(page, 'pago-1', CHECKOUT, { alto: 1400 })
  await page.getByRole('radio', { name: /^Anual/ }).click()
  await sacarCursorDeEncima(page)
  await sacar(page, 'pago-2', CHECKOUT, { alto: 1400 })
  await page.getByRole('radio', { name: /^Mensual/ }).click()
  await page.getByRole('button', { name: /^Continuar$/ }).click()
  await page.waitForSelector('text=Débito automático', { timeout: 10000 })
  await sacarCursorDeEncima(page)
  await sacar(page, 'pago-3', {
    ...CHECKOUT,
    debito: { sel: 'p', texto: /^Débito automático$/, cerca: 'div.rounded-xl' },
    cuit: { sel: 'p', texto: /^Cuando Sipago te pida/, cerca: 'div.rounded-lg' },
    codigo: 'code',
    ir: { sel: 'button', texto: /Ir a Sipago/ },
  }, { alto: 1400 })

  // Lo que ve cualquiera: el directorio y una ficha publicada.
  await ctx.clearCookies()
  await page.goto(`${BASE}/directorio`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-tour="directorio-resultados"] a[href^="/empresas/"]', { timeout: 20000 })
  await page.evaluate(() => {
    const el = document.querySelector('[data-tour="directorio-toolbar"]') ?? document.querySelector('[data-tour="directorio-resultados"]')
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 110)
  })
  await dormir(1200)
  await sacarCursorDeEncima(page)
  await sacar(page, 'directorio', {
    resultados: '[data-tour="directorio-resultados"]',
    tarjetas: { sel: '[data-tour="directorio-resultados"] a[href^="/empresas/"]', todos: true },
  })
  await page.goto(`${BASE}/empresas/vaxler`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-tour="ficha-identidad"]', { timeout: 20000 })
  await dormir(800)
  await sacar(page, 'ficha', { identidad: '[data-tour="ficha-identidad"]', verificada: { sel: 'span, div', texto: /^Verificad[oa] UIAB$/ } })
  await ctx.close()
}

await browser.close()
await writeFile(
  path.join(raiz, 'src/capturas.js'),
  `// Generado por herramientas/capturar.mjs — no editar a mano.\n// w, h y cada rectángulo [x0, y0, x1, y1] en píxeles de la imagen (2×).\nexport const CAPTURAS = ${JSON.stringify(CAPTURAS, null, 1)}\n`,
)
console.log(`\n${Object.keys(CAPTURAS).length} capturas → assets/capturas/ + src/capturas.js`)
