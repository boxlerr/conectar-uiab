/**
 * Capítulo 2 — Oportunidades (con sesión de empresa socia).
 * Presupuesto: ~52 s.
 *
 * IMPORTANTE: ni "Enviar postulación" ni "Publicar requerimiento" se aprietan.
 * Los dos se muestran enfocados y se sale por Cancelar / navegando.
 */
import {
  dormir, asentar, señalar, sub, subOff, chip, progreso, placa, placaOff,
  foco, focoOff, clickEn, tipear, scrollSuave, scrollA, asegurarVisible,
} from "../piloto.mjs";

export async function escenaOportunidades({ page, BASE }) {
  await page.goto(`${BASE}/oportunidades`, { waitUntil: "domcontentloaded" });
  await asentar(page, 1100);
  await page.evaluate(() => window.__cast.posicionarCursor(720, 620));
  await progreso(page, 76);

  // ── Placa de capítulo ───────────────────────────────────────────
  await placa(page, {
    rotulo: "Capítulo 2",
    titulo: "Oportunidades",
    texto: "El tablero donde las empresas del parque publican lo que necesitan.",
    ms: 2100,
  });
  await placaOff(page);
  await chip(page, "02 · Oportunidades");

  // ── El tablero ──────────────────────────────────────────────────
  await señalar(page, '[data-tour="op-hero"]', "El tablero",
    "Pedidos reales de las empresas del parque: materiales, servicios y personal.",
    { leer: 1600, mover: false });
  await progreso(page, 80);

  // ── Anatomía de una tarjeta ─────────────────────────────────────
  const TARJETA = '[data-tour="op-tarjeta"]';
  await señalar(page, TARJETA, "Cada publicación",
    "Estado, empresa solicitante, rubro y fecha de necesidad de un vistazo.",
    { leer: 1700 });
  await progreso(page, 84);

  // ── Entrar a la ficha ───────────────────────────────────────────
  await subOff(page);
  await focoOff(page);
  await clickEn(page, `${TARJETA} a[href^="/oportunidades/"]`, { ms: 650 })
    .catch(() => clickEn(page, `${TARJETA}`, { ms: 650 }));
  await page.waitForURL(/\/oportunidades\/[0-9a-f-]{20,}/, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 900);

  await señalar(page, '[data-tour="op-detalle-descripcion"]', "El requerimiento",
    "La empresa detalla especificaciones, alcance y condiciones.", { leer: 1700 });
  await progreso(page, 88);

  await señalar(page, '[data-tour="op-detalle-ficha"]', "Ficha técnica",
    "Cantidad, unidad, plazo y ubicación: los datos duros para cotizar.", { leer: 1600 });
  await progreso(page, 90);

  // ── Postularse (se muestra, NO se envía) ────────────────────────
  await focoOff(page);
  const BOTON_POSTULAR = '[data-tour="op-detalle-postular"] button:nth-of-type(1)';
  await sub(page, "Postularte", "Si te sirve, respondés desde acá mismo.");
  await scrollA(page, BOTON_POSTULAR, { offset: 220, ms: 700 });
  await clickEn(page, BOTON_POSTULAR, { ms: 620 });
  await dormir(1100);

  const MODAL = "div.fixed.inset-0.z-50";
  await sub(page, "Tu propuesta",
    "Un mensaje corto, cantidad y unidad. Le llega directo a quien publicó.");
  await tipear(page, `${MODAL} textarea`,
    "Trabajamos este material hace 20 años. Entregamos en 10 días.",
    { porChar: 26 });
  await dormir(900);
  await progreso(page, 94);

  await foco(page, `${MODAL} .justify-end button:nth-of-type(2)`, { radio: 10 });
  await dormir(1200);
  await focoOff(page);
  // Salimos por Cancelar: nada se envía.
  await clickEn(page, `${MODAL} .justify-end button:nth-of-type(1)`, { ms: 520 });
  await dormir(700);

  // ── Publicar tu propio requerimiento ────────────────────────────
  await subOff(page);
  await page.goto(`${BASE}/oportunidades/nueva`, { waitUntil: "domcontentloaded" });
  await asentar(page, 1000);
  await page.evaluate(() => window.__cast.posicionarCursor(700, 500));

  await sub(page, "¿Necesitás algo?", "Publicá tu propio requerimiento en un solo formulario.");
  await dormir(1100);

  await tipear(page, "#titulo", "Corte y plegado de chapa a medida", { porChar: 30 });
  await dormir(400);
  await tipear(page, "#localidad", "Burzaco, Buenos Aires", { porChar: 30 });
  await dormir(400);

  // El rubro es un combobox propio: el panel se monta con portal en el body.
  await clickEn(page, "#categoria_id", { ms: 600 });
  await dormir(700);
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
    await clickEn(page, OPCION, { ms: 520, idx: iRubro });
  } else {
    await page.keyboard.press("Escape");
  }
  await dormir(600);
  await progreso(page, 97);

  // La descripción es un contentEditable: hay que tipear de verdad.
  await tipear(page,
    'div[role="textbox"][aria-labelledby="lbl-descripcion"]',
    "Corte láser y plegado de chapa de 2 mm, tolerancia 0,2 mm.",
    { porChar: 24 });
  await dormir(800);

  await sub(page, "Y listo", "El sistema le sugiere tu pedido a los proveedores que <b>matchean</b>.");
  // La barra de acciones es sticky dentro de la tarjeta: el botón se ve
  // siempre. Volvemos arriba para mostrar el formulario ya completado —
  // scrollear HASTA el botón termina encuadrando el pie de página.
  await scrollA(page, "#titulo", { offset: 210, ms: 850 });
  await foco(page, 'main form button[type="submit"]', { radio: 12 });
  await dormir(1700);
  await focoOff(page);
  await subOff(page);
  await chip(page, null);
  await progreso(page, 100);

  // ── Cierre ──────────────────────────────────────────────────────
  await placa(page, {
    rotulo: "UIAB Conecta",
    titulo: "Ya sabés moverte",
    texto: "Entrá, buscá y conectá con el parque industrial de Almirante Brown.",
    ms: 2800,
  });
  await dormir(400);
}
