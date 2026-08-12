/**
 * Capítulo 2 — Oportunidades (con sesión de empresa socia).
 *
 * IMPORTANTE: ni "Enviar postulación" ni "Publicar requerimiento" se aprietan.
 * Los dos se muestran encuadrados y se sale por Cancelar / navegando.
 *
 * El pico de la pieza está al final: el match. Todo lo de antes existe para
 * llegar ahí, así que se cuenta al trote y los textos tipeados son cortos.
 */
import {
  dormir, asentar, plano, clickEn, clickPorTexto, tipear, opcional,
  scrollA, asegurarVisible, posicionarCursor, indicePorTexto,
} from "../piloto.mjs";

const TARJETA = '[data-tour="op-tarjeta"]';
const MODAL = "div.fixed.inset-0.z-50";

export async function escenaOportunidades({ page, BASE }) {
  await page.goto(`${BASE}/oportunidades`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await posicionarCursor(page, 820, 660);

  // ── 1. El tablero ───────────────────────────────────────────────
  await plano(page, {
    id: "tablero",
    escala: 1,
    rotulo: "Oportunidades",
    texto: "El tablero donde las empresas publican lo que necesitan.",
  }, () => dormir(1200));

  // ── 2. Una publicación ──────────────────────────────────────────
  await plano(page, {
    id: "publicacion",
    encuadre: TARJETA,
    rotulo: "Cada pedido",
    texto: "Estado, empresa, rubro y fecha de un vistazo.",
  }, async () => {
    await dormir(900);
    await clickEn(page, `${TARJETA} a[href^="/oportunidades/"]`, { ms: 420 })
      .catch(() => clickEn(page, TARJETA, { ms: 420 }));
  });

  await page.waitForURL(/\/oportunidades\/[0-9a-f-]{20,}/, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 650);

  // ── 3. El requerimiento ─────────────────────────────────────────
  await plano(page, {
    id: "requerimiento",
    encuadre: '[data-tour="op-detalle-descripcion"]',
    rotulo: "El requerimiento",
    texto: "Especificaciones, alcance y condiciones.",
  }, () => dormir(1250));

  // ── 4. Los datos duros ──────────────────────────────────────────
  await scrollA(page, '[data-tour="op-detalle-ficha"]', { offset: 180, ms: 540 });
  await dormir(300);

  await plano(page, {
    id: "ficha-tecnica",
    encuadre: '[data-tour="op-detalle-ficha"]',
    rotulo: "Ficha técnica",
    texto: "Cantidad, plazo y ubicación: lo que hace falta para cotizar.",
  }, () => dormir(1200));

  // ── 5. Postularse (se muestra, NO se envía) ─────────────────────
  // Todo este tramo es OPCIONAL: el botón no se renderiza si la cuenta con la
  // que se filma ya se postuló, o si es la dueña del pedido.
  await opcional("postularse", async () => {
    const CAJA = '[data-tour="op-detalle-postular"] button';
    await scrollA(page, CAJA, { offset: 220, ms: 480 });
    await dormir(280);
    // Por texto: al lado del de postularse hay uno de "Compartir", y apuntar
    // por posición terminaba clickeando ese.
    await clickPorTexto(page, CAJA, /postular/, { ms: 440 });
    await page.waitForSelector(`${MODAL} textarea`, { timeout: 5000, state: "visible" });
    await dormir(420);

    await plano(page, {
      id: "postular",
      encuadre: `${MODAL} textarea`,
      rotulo: "Postulate",
      texto: "Le llega directo a quien publicó, sin intermediarios.",
      velocidad: 1.3,
    }, async () => {
      await tipear(page, `${MODAL} textarea`,
        "Lo trabajamos hace 20 años. Entrega en 10 días.",
        { porChar: 24 });
      await dormir(500);
    });

    // Salimos por Cancelar: nada se envía.
    await clickPorTexto(page, `${MODAL} button`, /cancelar/, { ms: 400 });
    await dormir(400);
  });

  // Si el tramo se cortó a mitad de camino, el modal puede haber quedado
  // abierto y taparía todo lo que sigue.
  await page.keyboard.press("Escape").catch(() => {});

  // ── 6. Publicar lo propio ───────────────────────────────────────
  await page.goto(`${BASE}/oportunidades/nueva`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await posicionarCursor(page, 760, 520);

  await plano(page, {
    id: "publicar",
    encuadre: "#titulo",
    rotulo: "¿Necesitás algo?",
    texto: "Publicá tu propio requerimiento en un minuto.",
    velocidad: 1.35,
  }, async () => {
    await opcional("título", () =>
      tipear(page, "#titulo", "Corte y plegado de chapa a medida", { porChar: 20 }));
    await dormir(280);
  });

  // El rubro es un combobox propio: el panel se monta con portal en el body.
  await opcional("rubro", async () => {
    await plano(page, {
      id: "rubro",
      encuadre: "#categoria_id",
      rotulo: "Elegí el rubro",
      texto: "192 rubros: el sistema lo usa para encontrar a quién le sirve.",
      velocidad: 1.2,
    }, async () => {
      await clickEn(page, "#categoria_id", { ms: 420 });
      await dormir(500);
      const OPCION = 'div[role="listbox"][aria-label="Rubro"] div[role="option"]';
      // Por TEXTO, no por posición: son 192 rubros y el orden alfabético pone
      // cualquier cosa en un índice fijo (quedaba "Adhesivos y Selladores"
      // para un pedido de chapa).
      let iRubro = await indicePorTexto(page, OPCION, /chapa, perfiles y corte/i);
      if (iRubro < 0) iRubro = await indicePorTexto(page, OPCION, /metal.rgica/i);
      if (iRubro >= 0) {
        await asegurarVisible(page, OPCION, iRubro);
        await clickEn(page, OPCION, { ms: 400, idx: iRubro });
      } else {
        await page.keyboard.press("Escape");
      }
      await dormir(400);
    });
  });

  // ── 7. El pico: el match ────────────────────────────────────────
  // El remate va sin selectores que puedan faltar: si el formulario quedó a
  // medio llenar, el plano se arma igual en general.
  await opcional("volver arriba", async () => {
    await scrollA(page, "#titulo", { offset: 210, ms: 520 });
    await dormir(300);
  });

  const BOTON = 'main form button[type="submit"]';
  const hayBoton = await page.locator(BOTON).count() > 0;

  await plano(page, {
    id: "match",
    encuadre: hayBoton ? BOTON : null,
    escala: hayBoton ? "auto" : 1,
    rotulo: "Y listo",
    texto: "El sistema se lo sugiere a los proveedores que matchean.",
    sello: "Match",
  }, () => dormir(1400));
}
