/**
 * Instructivo para empresas NO socias: cómo registrarse y pagar la membresía.
 *
 * Lo pidió la UIAB (Evelyn, 15-oct) para mandarle a las empresas que estuvieron
 * en la presentación de Conecta y quieren sumarse sin ser socias. Es otra pieza,
 * no un capítulo del tutorial: se graba con `node grabar.mjs --pieza registro`
 * y se monta con `node montar.mjs --pieza registro`.
 *
 * SE FILMA CONTRA PRODUCCIÓN, Y NADA SE ENVÍA DE VERDAD.
 *
 *   · Contra producción porque en `next dev` el último paso del registro tiene
 *     un botón "Acceso gratis (solo para pruebas · dev)" que en el sitio real no
 *     existe, y caería justo en el plano del pago.
 *   · Nada se envía porque todas las escrituras van interceptadas en el
 *     navegador (`simularAlta`, `simularPago`): el alta, el chequeo de CUIT, la
 *     solicitud de pago y hasta el registro de visitas de la ficha. Lo que se ve
 *     es la interfaz real; lo que no llega es el POST. Sin esto, cada grabación
 *     crearía una cuenta, una ficha "Tu Empresa S.A." pendiente de revisión y un
 *     mail de alta nueva en la casilla de la UIAB.
 *
 * Los datos de ejemplo son genéricos a propósito ("Tu Empresa S.A.") y el CUIT
 * es el mismo que el sitio usa de placeholder en ese campo: no se nombra a
 * ninguna empresa real como si se estuviera registrando.
 *
 * Lo que NO se filma: la página de Sipago. Tiene verificación anti-bots (se
 * probó: "No se pudo validar la verificación de seguridad"), así que el
 * recorrido termina en el botón que lleva ahí.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  dormir, asentar, plano, clickEn, tipear, tipearDirecto, scrollA,
  scrollSuave, posicionarCursor, clickPorTexto, moverA, indicePorTexto, asegurarVisible,
} from "../piloto.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));

const DEMO = {
  razonSocial: "Tu Empresa S.A.",
  nombreComercial: "Tu Empresa",
  cuit: "30548917715",            // el placeholder del propio campo en /register
  cuitConGuiones: "30-54891771-5",
  telefono: "+54 9 11 0000-0000",
  direccion: "Av. Espora 1234",
  descripcion: "Fabricamos piezas metálicas a medida: corte, plegado y soldadura.",
  // Se busca por el RUBRO PADRE y no por la especialidad: el buscador del
  // registro sólo muestra una subcategoría si su padre también coincide, así
  // que "Torner" o "Soldadura" dan "Sin coincidencias" (bug del sitio, no del
  // video). "Corte y Plegado" queda entre las primeras de "Metal", sin scroll.
  busqueda: "Metal",
  rubro: /^\W*Corte y Plegado\s*$/,
  empleados: "25",
  email: "administracion@tuempresa.com.ar",
  password: "conecta2026",
};

// La ruta del mail falso vive en el MISMO origen que el sitio: así la capa
// visual (cursor, claqueta) se inyecta igual que en cualquier otra página.
const RUTA_MAIL = "/__video/mail-confirmacion";

// Los botones de "siguiente paso" del wizard tienen un texto distinto en cada
// paso. Se buscan por texto y no por posición: el formulario renderiza un solo
// paso por vez, así que el primero que matchea es el que corresponde.
const SIGUIENTE = /^(Continuar|Siguiente|Definir Especialidad|Credenciales|Seleccionar Plan)/;

// ══════════════════════════════════════════════════════════════════════
//  Lo que se intercepta
// ══════════════════════════════════════════════════════════════════════

const json = (route, body) => route.fulfill({
  status: 200, contentType: "application/json", body: JSON.stringify(body),
});

/**
 * Corta toda escritura que no esté simulada.
 *
 * Es la red de seguridad: si mañana el registro suma un POST nuevo, la
 * grabación no lo manda a producción, lo avisa en el log. Bloquear de más rompe
 * a lo sumo un plano; dejar pasar de más crea registros reales.
 */
function soloLectura(route, req) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method())) return route.continue();
  // El refresco de sesión de Supabase no es una escritura de negocio, y sin él
  // la pasada logueada puede quedarse sin sesión a mitad de camino.
  if (req.url().includes("/auth/v1/token")) return route.continue();
  const accion = req.headers()["next-action"] ? " (server action)" : "";
  console.log(`    · bloqueado ${req.method()} ${req.url().replace(/\?.*/, "").slice(0, 90)}${accion}`);
  return route.abort();
}

/** El mail de confirmación, tal cual la plantilla que está pegada en Supabase. */
function htmlDelMail() {
  // La plantilla vive en la doc y no en el código: se pega a mano en el
  // Dashboard de Supabase (docs/EMAIL_SETUP.md §3.3a). Se lee de ahí para que el
  // plano muestre exactamente el correo que llega, no una maqueta.
  const doc = readFileSync(join(AQUI, "../../../docs/EMAIL_SETUP.md"), "utf8");
  const seccion = doc.slice(doc.indexOf("#### a) Confirm signup"));
  const html = seccion.match(/```html\n([\s\S]*?)```/)?.[1];
  if (!html) throw new Error("No encontré la plantilla de confirmación en docs/EMAIL_SETUP.md");
  return html
    // El botón no navega: el plano termina en el click y lo que sigue es la
    // pasada del pago, que arranca logueada.
    .replace(/href="\{\{ \.ConfirmationURL \}\}"/g, 'href="#"')
    // El link de respaldo que se lee abajo del botón. Queda fuera de cuadro,
    // pero si entrara, que diga algo con la forma real y no las llaves.
    .replace(/\{\{ \.ConfirmationURL \}\}/g, "https://…supabase.co/auth/v1/verify?token=…&amp;type=signup")
    // 600 px de mail en una pantalla de 1920 es un sello de correo. Se agranda
    // en el navegador —texto nítido— en vez de acercar en el montaje.
    //
    // El zoom va sobre la tabla del correo y NO sobre <html>: con html{zoom}
    // el cursor de la capa visual —un `position:fixed` que sigue a clientX/Y—
    // también se escalaba y se dibujaba fuera de cuadro, así que el click al
    // botón no se veía.
    .replace("</head>", "<style>body>table{zoom:1.5}</style></head>");
}

/** Pasada 1: el alta. */
export async function simularAlta(ctx) {
  const mail = htmlDelMail();
  await ctx.route("**/*", (route) => {
    const req = route.request();
    const url = req.url();
    if (url.includes(RUTA_MAIL)) {
      return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: mail });
    }
    // Paso 2: el aviso de "tu empresa ya es socia". Con el CUIT del placeholder
    // no debería dispararse, pero si el padrón cambia, la pasada no puede
    // terminar desviada a /sumate.
    if (url.includes("/api/auth/check-cuit")) return json(route, { enPadron: false, esSocia: false });
    if (url.includes("/api/auth/check-email")) return json(route, { exists: false });
    // El alta en Supabase Auth. Sin `access_token` en la respuesta, supabase-js
    // devuelve usuario sin sesión: es exactamente lo que pasa con "Confirm
    // email" prendido, y lo que hace que el registro muestre "Revisá tu correo".
    if (url.includes("/auth/v1/signup")) {
      const ahora = new Date().toISOString();
      return json(route, {
        id: "00000000-0000-4000-8000-00000000c0de", aud: "authenticated", role: "authenticated",
        email: DEMO.email, created_at: ahora, confirmation_sent_at: ahora,
        app_metadata: {}, user_metadata: {}, identities: [],
      });
    }
    if (url.includes("/api/auth/register-sync")) return json(route, { ok: true, enEspera: false });
    return soloLectura(route, req);
  });
}

/** Pasada 2: el pago. */
export async function simularPago(ctx, { urlPlanMensual } = {}) {
  await ctx.route("**/*", (route) => {
    const req = route.request();
    // La respuesta del camino "plan recurrente" de /api/suscripcion/solicitar,
    // que es el que está activo en producción. El CUIT es el que se cargó en el
    // registro, para que el plano cuente una sola historia.
    if (req.url().includes("/api/suscripcion/solicitar")) {
      return json(route, {
        ok: true, ciclo: "mensual", monto: 50_000,
        suscripcion_url: urlPlanMensual || "https://subscriptions.sipago.coop/checkout/",
        cuit: DEMO.cuitConGuiones, prorrateo: null,
      });
    }
    return soloLectura(route, req);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  Ayudantes de encuadre
// ══════════════════════════════════════════════════════════════════════

/**
 * La caja que abarca a varias piezas de la pantalla, buscadas por selector y
 * —si hace falta— por texto, o subiendo hasta un contenedor (`cerca`).
 *
 * El wizard no tiene `data-tour`: sus pasos se distinguen por el texto. Medir
 * así deja el encuadre atado a lo que se ve y no a la estructura del DOM.
 */
async function cajaDePiezas(page, piezas) {
  return page.evaluate((piezas) => {
    const rects = [];
    for (const { sel, texto, cerca } of piezas) {
      const re = texto ? new RegExp(texto, "i") : null;
      let el = [...document.querySelectorAll(sel)]
        .find((e) => e.getClientRects().length && (!re || re.test(e.textContent || "")));
      if (el && cerca) el = el.closest(cerca) ?? el;
      if (el) rects.push(el.getBoundingClientRect());
    }
    if (!rects.length) return null;
    const x = Math.min(...rects.map((r) => r.left));
    const y = Math.min(...rects.map((r) => r.top));
    return {
      x, y,
      w: Math.max(...rects.map((r) => r.right)) - x,
      h: Math.max(...rects.map((r) => r.bottom)) - y,
    };
  }, piezas.map((p) => (typeof p === "string" ? { sel: p } : { ...p, texto: p.texto?.source ?? p.texto })));
}

/** Espera a que el wizard muestre el paso cuyo título contiene `titulo`. */
async function esperarPaso(page, titulo) {
  await page.waitForFunction(
    (t) => [...document.querySelectorAll("h2")].some((h) => h.textContent.includes(t)),
    titulo, { timeout: 10_000 },
  );
  // La transición entre pasos (framer-motion) dura ~400 ms: el plano no puede
  // arrancar con el paso todavía entrando de costado.
  await dormir(650);
}

async function siguientePaso(page, titulo) {
  await clickPorTexto(page, "button", SIGUIENTE, { ms: 380 });
  await esperarPaso(page, titulo);
}

/** Abre un desplegable del formulario y elige una opción, en cámara. */
async function elegir(page, disparador, opcion) {
  await clickPorTexto(page, "form button", disparador, { ms: 420 });
  await dormir(380);
  await clickPorTexto(page, "form button", opcion, { ms: 420 });
  await dormir(260);
}

// ══════════════════════════════════════════════════════════════════════
//  Pasada 1 — el registro
// ══════════════════════════════════════════════════════════════════════

export async function escenaRegistro({ page, BASE }) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await asentar(page, 800);
  // El hero baja 260 px: sin esto "Registrate" queda a la altura del cartel
  // (abajo a la izquierda) y el click se da detrás del texto.
  await scrollSuave(page, 260, 1);
  await dormir(500);
  await posicionarCursor(page, 760, 420);

  // ── 1. Dónde se empieza ─────────────────────────────────────────
  // Plano general de la home: el único que muestra el sitio entero. El botón
  // "Registrate" está al lado de "Soy socia de la UIAB", que es el otro camino;
  // se ve sin nombrarlo.
  await plano(page, {
    id: "inicio",
    escala: 1,
    navega: true,
    rotulo: "Empezá acá",
    texto: "uiabconecta.com → Registrate",
  }, async () => {
    // "a" a secas: el primero en orden de documento es el del hero (el
    // encabezado dice "Sumate" e "Ingresar", no "Registrate").
    await clickPorTexto(page, "a", /^\s*Registrate\s*$/, { ms: 520, pausa: 260 });
  });

  await page.waitForURL(/\/register/, { timeout: 15_000 });
  await asentar(page, 600);
  await esperarPaso(page, "¿Quién se registra?");
  await posicionarCursor(page, 1240, 640);

  // ── 2. Paso 1 · Quién se registra ───────────────────────────────
  // Arranca con "Empresa u organización" ya marcada, así que no se la
  // clickea: un click que no cambia nada no es un plano. El plano cierra con
  // "Continuar", que sí cambia la pantalla.
  //
  // Cartel ARRIBA: las dos opciones y el botón están en el tercio de abajo de
  // la pantalla, justo donde va el cartel de siempre (medido en el v1: tapaba
  // "Particular o profesional" y el click en "Continuar").
  await plano(page, {
    id: "quien",
    encuadre: await cajaDePiezas(page, [
      { sel: "div", texto: /^¿Tu empresa ya es socia de la UIAB\?/, cerca: "div.rounded-2xl, div.rounded-xl" },
      '[role="radiogroup"][aria-label="Tipo de registro"]',
    ]),
    escala: 1.3,
    navega: true,
    cartel: "arriba",
    rotulo: "Paso 1 · Quién sos",
    texto: "Empresa, comercio o profesional.",
  }, async () => {
    await clickPorTexto(page, "button", /^Continuar/, { ms: 520, pausa: 220 });
  });

  await esperarPaso(page, "Identidad.");

  // ── 3. Paso 2 · Identidad ───────────────────────────────────────
  await plano(page, {
    id: "identidad",
    encuadre: await cajaDePiezas(page, [{ sel: 'input[name="razonSocial"]', cerca: "div.grid" }]),
    escala: 1.4,
    rotulo: "Paso 2 · Identidad",
    texto: "Tipo de organización y razón social.",
  }, async () => {
    await elegir(page, /Selecciona tipo/, /^Empresa \/ Industria$/);
    await tipear(page, 'input[name="razonSocial"]', DEMO.razonSocial, { porChar: 52 });
    await dormir(200);
  });

  await tipearDirecto(page, 'input[name="nombreComercial"]', DEMO.nombreComercial);
  await dormir(200);

  // ── 4. El CUIT ──────────────────────────────────────────────────
  // Detalle: es el dato que después vuelve a pedir Sipago, y si no coincide el
  // pago no se reconoce. Por eso tiene plano propio.
  await plano(page, {
    id: "cuit",
    encuadre: await cajaDePiezas(page, [{ sel: "label", texto: /^CUIT/ }, 'input[name="cuit"]']),
    escala: 1.75,
    rotulo: "El CUIT",
    texto: "Tenelo a mano: lo vas a usar para pagar.",
  }, async () => {
    await tipear(page, 'input[name="cuit"]', DEMO.cuit, { porChar: 70 });
    await dormir(260);
  });

  await tipearDirecto(page, 'input[name="telefono"]', DEMO.telefono);
  await dormir(250);
  await siguientePaso(page, "Localización.");

  // ── 5. Paso 3 · Ubicación ───────────────────────────────────────
  // La provincia se elige fuera de cuadro: el plano es sobre la localidad,
  // que es donde aparece el partido.
  await elegir(page, /Elegí tu provincia/, /^Buenos Aires$/);
  await posicionarCursor(page, 1300, 520);

  await plano(page, {
    id: "ubicacion",
    encuadre: await cajaDePiezas(page, [{ sel: 'input[name="direccion"]', cerca: "div.grid.gap-4, div.grid" }]),
    escala: 1.4,
    rotulo: "Paso 3 · Ubicación",
    texto: "Dónde está tu empresa.",
  }, async () => {
    await elegir(page, /Elegí tu localidad/, /^Burzaco$/);
    await tipear(page, 'input[name="direccion"]', DEMO.direccion, { porChar: 50 });
    await dormir(200);
  });

  // ── 6. La descripción ───────────────────────────────────────────
  await plano(page, {
    id: "descripcion",
    encuadre: await cajaDePiezas(page, [{ sel: "label", texto: /Breve descripci/ }, 'textarea[name="descripcion"]']),
    escala: 1.75,
    velocidad: 1.5,
    rotulo: "Tu presentación",
    texto: "Qué hace tu empresa, en pocas líneas.",
  }, async () => {
    await tipear(page, 'textarea[name="descripcion"]', DEMO.descripcion, { porChar: 34 });
    await dormir(200);
  });

  await siguientePaso(page, "Alcance.");
  await posicionarCursor(page, 1260, 470);

  // ── 7. Paso 4 · Rubro ───────────────────────────────────────────
  // El encuadre se fija ANTES de abrir el buscador y con alto de sobra: el
  // desplegable baja ~400 px sobre el resto del formulario y tiene que entrar.
  const cat = await cajaDePiezas(page, [{ sel: "label", texto: /^Categor/ }]);
  await plano(page, {
    id: "rubro",
    encuadre: cat ? { x: cat.x, y: cat.y, w: 576, h: 430 } : null,
    escala: 1.4,
    rotulo: "Paso 4 · Rubro",
    texto: "Así te encuentran en el directorio.",
  }, async () => {
    await clickPorTexto(page, "form button", /Seleccion.\s+una categor/, { ms: 440 });
    await dormir(420);
    // Con click primero: el buscador del desplegable no toma el foco solo, y
    // sin foco el tipeo se pierde y la lista queda entera, con la opción
    // escondida abajo de todo en un contenedor con scroll.
    await tipear(page, 'input[placeholder="Buscar categoría..."]', DEMO.busqueda, { porChar: 80 });
    await dormir(460);
    // El desplegable scrollea por dentro, y mover el mouse a una opción que
    // quedó tapada por ese scroll clickea lo que haya en esas coordenadas.
    const i = await indicePorTexto(page, "form button", DEMO.rubro);
    if (i < 0) throw new Error(`No aparece la opción ${DEMO.rubro} buscando "${DEMO.busqueda}"`);
    await asegurarVisible(page, "form button", i);
    await clickEn(page, "form button", { ms: 420, idx: i });
    await dormir(260);
    // Al cerrarse el desplegable, "Credenciales" sube justo debajo del cursor
    // y el plano terminaba pareciendo un click en ese botón. Se lleva el
    // cursor al rubro elegido, que es de lo que habla el cartel.
    const elegido = await cajaDePiezas(page, [{ sel: "form button", texto: DEMO.rubro }]);
    if (elegido) await moverA(page, elegido.x + elegido.w * 0.7, elegido.y + elegido.h / 2, 480);
    await dormir(200);
  });

  await tipearDirecto(page, 'input[name="size"]', DEMO.empleados);
  await dormir(250);
  await siguientePaso(page, "Acceso.");
  await posicionarCursor(page, 1240, 560);

  // ── 8. Paso 5 · Acceso ──────────────────────────────────────────
  await plano(page, {
    id: "acceso",
    encuadre: await cajaDePiezas(page, ['input[name="email"]', 'input[name="password"]']),
    escala: 1.6,
    velocidad: 1.3,
    rotulo: "Paso 5 · Acceso",
    texto: "Un mail que uses y una contraseña.",
  }, async () => {
    await tipear(page, 'input[name="email"]', DEMO.email, { porChar: 40 });
    await dormir(220);
    await tipear(page, 'input[name="password"]', DEMO.password, { porChar: 60 });
    await dormir(240);
  });

  await siguientePaso(page, "Tu suscripción.");
  await posicionarCursor(page, 1250, 760);

  // ── 9. Paso 6 · La membresía ────────────────────────────────────
  await plano(page, {
    id: "membresia",
    encuadre: await cajaDePiezas(page, [{ sel: "h3", texto: /^UIAB Conecta$/, cerca: "div.overflow-hidden" }]),
    escala: 1.5,
    rotulo: "Paso 6 · Membresía",
    texto: "Una sola, con todo incluido.",
  }, () => dormir(900));

  // ── 10. Finalizar ───────────────────────────────────────────────
  // El submit va interceptado (ver simularAlta): se crea nada.
  await plano(page, {
    id: "finalizar",
    encuadre: await cajaDePiezas(page, [
      { sel: "button", texto: /Finalizar y continuar al pago/ },
      { sel: "p", texto: /^Al continuar, se crea tu cuenta/ },
    ]),
    escala: 1.75,
    navega: true,
    rotulo: "Finalizar",
    texto: "Al confirmar, se crea tu cuenta.",
  }, async () => {
    await clickPorTexto(page, "button", /Finalizar y continuar al pago/, { ms: 460, pausa: 240 });
  });

  await page.waitForFunction(
    () => [...document.querySelectorAll("h2")].some((h) => h.textContent.includes("Revisá tu correo")),
    null, { timeout: 15_000 },
  );
  await dormir(900);
  await posicionarCursor(page, 960, 760);

  // ── 11. Revisá tu correo ────────────────────────────────────────
  await plano(page, {
    id: "revisa-correo",
    encuadre: await cajaDePiezas(page, [{ sel: "h2", texto: /Revisá tu correo/, cerca: "div.max-w-lg" }]),
    escala: 1.45,
    rotulo: "Revisá tu correo",
    texto: "Te llega un mail para confirmar.",
  }, () => dormir(900));

  // ── 12. El mail ─────────────────────────────────────────────────
  await page.goto(`${BASE}${RUTA_MAIL}`, { waitUntil: "load" });
  await asentar(page, 500);
  await posicionarCursor(page, 900, 820);

  // El encuadre va de lado a lado del correo (no sólo logo + botón, que están
  // a la izquierda) y del logo al botón; el link de respaldo queda abajo.
  const correo = await cajaDePiezas(page, ["body > table table"]);
  const deLogoABoton = await cajaDePiezas(page, ["img", { sel: "a", texto: /Confirmar mi email/ }]);
  await plano(page, {
    id: "mail",
    encuadre: correo && deLogoABoton
      ? { x: correo.x, y: deLogoABoton.y - 30, w: correo.w, h: deLogoABoton.h + 60 }
      : deLogoABoton,
    escala: 1.4,
    navega: true,
    rotulo: "Confirmá tu mail",
    texto: "Un click y pasás al pago.",
  }, async () => {
    await clickPorTexto(page, "a", /Confirmar mi email/, { ms: 520, pausa: 240 });
  });
}

// ══════════════════════════════════════════════════════════════════════
//  Pasada 2 — el pago
// ══════════════════════════════════════════════════════════════════════

const TARJETA = "div.rounded-xl, div.rounded-lg";

export async function escenaPago({ page, BASE }) {
  await page.goto(`${BASE}/suscripcion/checkout`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await page.waitForSelector('[role="radiogroup"][aria-label="Ciclo de pago"]', { timeout: 15_000 });
  await dormir(500);
  await posicionarCursor(page, 900, 700);

  // Ningún plano de esta pasada muestra el encabezado del sitio: la sesión es
  // la de la cuenta de filmación, y su nombre en la esquina no le dice nada a
  // quien se está registrando.

  // ── 13. Mes a mes o anual ───────────────────────────────────────
  // Antes/después en el mismo cuadro: se elige anual y se vuelve a mensual, que
  // es el ciclo con el que sigue el recorrido.
  await plano(page, {
    id: "ciclo",
    encuadre: await cajaDePiezas(page, [
      { sel: "p", texto: /^Pago con Sipago$/ },
      '[role="radiogroup"][aria-label="Ciclo de pago"]',
    ]),
    escala: 1.5,
    rotulo: "Elegí cómo pagar",
    texto: "Mes a mes, o anual con 2 meses bonificados.",
  }, async () => {
    await clickPorTexto(page, '[role="radio"]', /^Anual/, { ms: 520 });
    await dormir(900);
    await clickPorTexto(page, '[role="radio"]', /^Mensual/, { ms: 480 });
    await dormir(400);
  });

  // ── 14. Débito automático ───────────────────────────────────────
  // El encuadre se ancla al botón y se extiende hacia abajo: el panel de
  // adhesión aparece donde estaba el botón y tiene que entrar en cuadro.
  const btn = await cajaDePiezas(page, [{ sel: "button", texto: /^Continuar$/ }]);
  await plano(page, {
    id: "debito",
    encuadre: btn ? { x: btn.x, y: btn.y - 60, w: btn.w, h: 430 } : null,
    escala: 1.3,
    rotulo: "Débito automático",
    texto: "Sipago cobra solo, cada mes.",
  }, async () => {
    await clickPorTexto(page, "button", /^Continuar$/, { ms: 480, pausa: 220 });
    await page.waitForSelector("text=Débito automático", { timeout: 8000 });
    await dormir(700);
  });

  await scrollA(page, "code", { offset: 380, ms: 620 });
  await dormir(500);
  await posicionarCursor(page, 1180, 560);

  // ── 15. El CUIT en Sipago ───────────────────────────────────────
  await plano(page, {
    id: "sipago",
    encuadre: await cajaDePiezas(page, [
      { sel: "p", texto: /^Cuando Sipago te pida/, cerca: TARJETA },
      { sel: "button", texto: /Ir a Sipago/ },
    ]),
    // 1.75 y no menos: más abierto, abajo asoma el pie del sitio (el
    // checkout es corto y no hay scroll que lo saque de cuadro).
    escala: 1.75,
    rotulo: "En Sipago",
    sello: "Importante",
    texto: "Cargás tu tarjeta y este mismo CUIT.",
  }, async () => {
    const codigo = await cajaDePiezas(page, ["code"]);
    if (codigo) await moverA(page, codigo.x + codigo.w * 0.6, codigo.y + codigo.h / 2, 520);
    await dormir(700);
    // Se apoya sobre el botón y NO se clickea: Sipago corta a los navegadores
    // automatizados, y la pantalla de error no le enseña nada a nadie.
    const ir = await cajaDePiezas(page, [{ sel: "button", texto: /Ir a Sipago/ }]);
    if (ir) await moverA(page, ir.x + ir.w * 0.52, ir.y + ir.h / 2, 520);
    await dormir(300);
  });

  // ── 16. Después: el directorio ──────────────────────────────────
  // Se sale de la sesión fuera de cuadro: lo que sigue es lo que ve cualquiera.
  await page.context().clearCookies();
  await page.goto(`${BASE}/directorio`, { waitUntil: "domcontentloaded" });
  await asentar(page, 600);
  await page.waitForSelector('[data-tour="directorio-resultados"] a[href^="/empresas/"]', { timeout: 20_000 });
  await scrollSuave(page, 0, 1);
  await dormir(700);
  await posicionarCursor(page, 1100, 640);

  await plano(page, {
    id: "directorio",
    escala: 1,
    rotulo: "Y listo",
    texto: "La UIAB confirma el pago y aprueba tu ficha.",
  }, () => dormir(1000));

  // ── 17. Así queda una ficha ─────────────────────────────────────
  // Vaxler, la ficha más completa de la base (ver la skill del video). El
  // registro de la visita va bloqueado: no es una visita de verdad.
  await page.goto(`${BASE}/empresas/vaxler`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await scrollSuave(page, 0, 1);
  await dormir(400);
  await posicionarCursor(page, 1250, 700);

  // Centrado a mano: la tarjeta mide 1480 de ancho y el montaje encuadra la
  // parte izquierda de los sujetos anchos, así que "Contactar empresa" quedaba
  // cortado contra el borde derecho.
  const id = await cajaDePiezas(page, ['[data-tour="ficha-identidad"]']);
  await plano(page, {
    id: "ficha",
    encuadre: id ? { x: id.x + id.w / 2 - 490, y: id.y, w: 980, h: id.h } : '[data-tour="ficha-identidad"]',
    escala: 1.25,
    rotulo: "Tu ficha",
    texto: "A la vista de toda la red industrial.",
  }, () => dormir(1000));
}
