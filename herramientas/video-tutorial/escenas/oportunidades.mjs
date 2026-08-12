/**
 * Capítulo 2 — Oportunidades (con sesión de empresa socia).
 * Presupuesto: ~32 s (antes ~52 s).
 *
 * IMPORTANTE: ni "Enviar postulación" ni "Publicar requerimiento" se aprietan.
 * Los dos se muestran enfocados y se sale por Cancelar / navegando.
 *
 * El pico de la pieza está al final: el match. Todo lo de antes existe para
 * llegar ahí, así que se cuenta al trote y los textos tipeados son cortos.
 */
import {
  dormir, asentar, señalar, sub, subOff, chip, progreso, placa, placaOff,
  foco, focoOff, clickEn, clickPorTexto, tipear, sello, opcional,
  scrollSuave, scrollA, asegurarVisible,
} from "../piloto.mjs";

export async function escenaOportunidades({ page, BASE }) {
  await page.goto(`${BASE}/oportunidades`, { waitUntil: "domcontentloaded" });
  await asentar(page, 800);
  await page.evaluate(() => window.__cast.posicionarCursor(720, 620));
  await progreso(page, 76);

  // ── Placa de capítulo ───────────────────────────────────────────
  await placa(page, {
    rotulo: "Capítulo 2",
    titulo: "Oportunidades",
    texto: "El tablero donde las empresas publican lo que necesitan.",
    ms: 1300,
  });
  await placaOff(page);
  await chip(page, "02 · Oportunidades");

  // ── El tablero ──────────────────────────────────────────────────
  await señalar(page, '[data-tour="op-hero"]', "El tablero",
    "Pedidos reales del parque: materiales, servicios y personal.",
    { leer: 900, mover: false });
  await progreso(page, 80);

  // ── Anatomía de una tarjeta ─────────────────────────────────────
  const TARJETA = '[data-tour="op-tarjeta"]';
  await señalar(page, TARJETA, "Cada publicación",
    "Estado, empresa, rubro y fecha de un vistazo.", { leer: 950 });
  await progreso(page, 83);

  // ── Entrar a la ficha ───────────────────────────────────────────
  await subOff(page);
  await focoOff(page);
  await clickEn(page, `${TARJETA} a[href^="/oportunidades/"]`, { ms: 440 })
    .catch(() => clickEn(page, `${TARJETA}`, { ms: 440 }));
  await page.waitForURL(/\/oportunidades\/[0-9a-f-]{20,}/, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 600);

  await señalar(page, '[data-tour="op-detalle-descripcion"]', "El requerimiento",
    "Especificaciones, alcance y condiciones.", { leer: 900 });
  await progreso(page, 86);

  await señalar(page, '[data-tour="op-detalle-ficha"]', "Ficha técnica",
    "Cantidad, plazo y ubicación: los datos duros para cotizar.", { leer: 950 });
  await progreso(page, 89);

  // ── Postularse (se muestra, NO se envía) ────────────────────────
  // Todo este tramo es OPCIONAL: el botón no se renderiza si la cuenta con
  // la que se filma ya se postuló a ese pedido, o si es la dueña. Antes eso
  // cortaba la pasada y se perdía lo que viene después, que es el final.
  await focoOff(page);
  const MODAL = "div.fixed.inset-0.z-50";

  await opcional("postularse", async () => {
    const CAJA = '[data-tour="op-detalle-postular"] button';
    await sub(page, "Postularte", "Si te sirve, respondés desde acá mismo.");
    await scrollA(page, CAJA, { offset: 220, ms: 480 });
    // Por texto: al lado del de postularse hay uno de "Compartir", y
    // apuntar por posición terminaba clickeando ese.
    await clickPorTexto(page, CAJA, /postular/, { ms: 440 });
    // Esperar al modal de verdad en vez de dormir y cruzar los dedos.
    await page.waitForSelector(`${MODAL} textarea`, { timeout: 5000, state: "visible" });

    await sub(page, "Tu propuesta", "Le llega directo a quien publicó.");
    await tipear(page, `${MODAL} textarea`,
      "Lo trabajamos hace 20 años. Entrega en 10 días.",
      { porChar: 22 });
    await dormir(450);
    await progreso(page, 93);

    await foco(page, `${MODAL} .justify-end button:nth-of-type(2)`, { radio: 10 });
    await dormir(650);
    await focoOff(page);
    // Salimos por Cancelar: nada se envía.
    await clickPorTexto(page, `${MODAL} button`, /cancelar/, { ms: 400 });
    await dormir(450);
  });

  // Si el tramo se cortó a mitad de camino, el modal puede haber quedado
  // abierto y taparía todo lo que sigue.
  await page.keyboard.press("Escape").catch(() => {});
  await focoOff(page);
  await progreso(page, 93);

  // ── Publicar tu propio requerimiento ────────────────────────────
  await subOff(page);
  await page.goto(`${BASE}/oportunidades/nueva`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await page.evaluate(() => window.__cast.posicionarCursor(700, 500));

  await sub(page, "¿Necesitás algo?", "Publicá tu propio requerimiento.");
  await dormir(550);

  // Cada campo por su lado: que el combobox del rubro no se lleve puesto el
  // tipeo de la descripción, ni la descripción al cierre.
  await opcional("título y localidad", async () => {
    await tipear(page, "#titulo", "Corte y plegado de chapa a medida", { porChar: 21 });
    await dormir(200);
    await tipear(page, "#localidad", "Burzaco, Buenos Aires", { porChar: 19 });
    await dormir(200);
  });

  // El rubro es un combobox propio: el panel se monta con portal en el body.
  await opcional("rubro", async () => {
    await clickEn(page, "#categoria_id", { ms: 420 });
    await dormir(500);
    const OPCION = 'div[role="listbox"][aria-label="Rubro"] div[role="option"]';
    // Elegimos por TEXTO, no por posición: son 192 rubros y el orden alfabético
    // pone cualquier cosa en el índice fijo (quedaba "Adhesivos y Selladores"
    // para un pedido de chapa).
    const iRubro = await page.evaluate((s) => {
      const els = [...document.querySelectorAll(s)];
      const i = els.findIndex((e) => /chapa, perfiles y corte/i.test(e.textContent || ""));
      return i >= 0 ? i : els.findIndex((e) => /metalúrgica/i.test(e.textContent || ""));
    }, OPCION);
    if (iRubro >= 0) {
      await asegurarVisible(page, OPCION, iRubro);
      await clickEn(page, OPCION, { ms: 400, idx: iRubro });
    } else {
      await page.keyboard.press("Escape");
    }
    await dormir(350);
  });
  await progreso(page, 97);

  // La descripción es un contentEditable: hay que tipear de verdad.
  await opcional("descripción", async () => {
    await tipear(page,
      'div[role="textbox"][aria-labelledby="lbl-descripcion"]',
      "Corte láser y plegado de chapa de 2 mm.",
      { porChar: 20 });
    await dormir(350);
  });

  // ── El pico: el match ───────────────────────────────────────────
  // Este es el remate de la pieza, así que va sin selectores que puedan
  // faltar: el subtítulo y el sello se dibujan igual aunque el formulario
  // haya quedado a medio llenar.
  await sub(page, "Y listo", "El sistema se lo sugiere a los proveedores que <b>matchean</b>.");
  // La barra de acciones es sticky dentro de la tarjeta: el botón se ve
  // siempre. Volvemos arriba para mostrar el formulario ya completado —
  // scrollear HASTA el botón termina encuadrando el pie de página.
  await opcional("encuadre del botón", async () => {
    await scrollA(page, "#titulo", { offset: 210, ms: 520 });
    await foco(page, 'main form button[type="submit"]', { radio: 12 });
  });
  await sello(page, "Match", { ms: 1000 });
  await focoOff(page);
  await subOff(page);
  await chip(page, null);
  await progreso(page, 100);

  // ── Cierre ──────────────────────────────────────────────────────
  await placa(page, {
    rotulo: "UIAB Conecta",
    titulo: "Ya sabés moverte",
    texto: "Entrá, buscá y conectá con el parque industrial de Almirante Brown.",
    ms: 1900,
  });
  await dormir(300);
}
