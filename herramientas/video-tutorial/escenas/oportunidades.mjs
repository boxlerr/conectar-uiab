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
  dormir, asentar, plano, clickEn, tipear, tipearDirecto, opcional,
  scrollA, scrollSuave, posicionarCursor, indicePorTexto,
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
    texto: "Lo que el parque necesita, publicado.",
  }, () => dormir(1200));

  // ── 2. Una publicación ──────────────────────────────────────────
  await scrollA(page, TARJETA, { offset: 170, ms: 560 });
  await dormir(320);

  await plano(page, {
    id: "publicacion",
    encuadre: TARJETA,
    escala: 1.6,
    navega: true,
    rotulo: "Cada pedido",
    texto: "Estado, empresa, rubro y fecha.",
  }, async () => {
    await dormir(180);
    // Se entra a la PRIMERA tarjeta, sin recorrer la lista.
    //
    // Antes se buscaba una por título y caía tercera, así que el plano se iba
    // en un scroll hasta encontrarla —eso es lo que se veía en el segundo 36—.
    // Ahora la primera es siempre la misma (demo-datos.mjs escalona las fechas)
    // y es de Vaxler a propósito: entrando a un pedido propio se puede filmar
    // "Candidatos recomendados", que es la sección donde se ven las empresas
    // que matchean con el trabajo, y que sólo ve quien publicó.
    await clickEn(page, TARJETA, { ms: 420, idx: 0 });
  });

  await page.waitForURL(/\/oportunidades\/[0-9a-f-]{20,}/, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 650);
  // Arriba de todo antes del primer plano: si se llega con la página a media
  // altura, el encabezado del pedido entra cortado y el primer vistazo de la
  // oportunidad muestra un título partido al medio.
  await scrollSuave(page, 0, 1);
  await dormir(300);

  // ── 3. El pedido, entero ────────────────────────────────────────
  // Plano general y sin acercamiento: es el primer vistazo del pedido y tiene
  // que verse completo —título, quién publica, rubro, ubicación y fecha—.
  await plano(page, {
    id: "oportunidad",
    escala: 1,
    rotulo: "El pedido",
    texto: "Quién pide, qué necesita y para cuándo.",
  }, () => dormir(1200));

  // ── 4. El requerimiento ─────────────────────────────────────────
  await scrollA(page, '[data-tour="op-detalle-descripcion"]', { offset: 210, ms: 540 });
  await dormir(300);

  await plano(page, {
    id: "requerimiento",
    encuadre: '[data-tour="op-detalle-descripcion"]',
    escala: 1.4,
    rotulo: "El requerimiento",
    texto: "Especificaciones, alcance y condiciones.",
  }, () => dormir(1250));

  // ── 5. Los datos duros ──────────────────────────────────────────
  await scrollA(page, '[data-tour="op-detalle-ficha"]', { offset: 180, ms: 540 });
  await dormir(300);

  await plano(page, {
    id: "ficha-tecnica",
    encuadre: '[data-tour="op-detalle-ficha"]',
    rotulo: "Ficha técnica",
    texto: "Cantidad, plazo y ubicación.",
  }, () => dormir(1200));

  // ── 6. Quién puede hacerlo ──────────────────────────────────────
  // El corazón del capítulo: las empresas que la red cruzó con este pedido.
  //
  // Reemplaza a los dos planos anteriores del match, que mostraban dos veces
  // la misma tarjeta de puntajes y no explicaban nada. Acá se ven socias
  // reales, ordenadas por compatibilidad, y el número de cada una.
  await opcional("candidatos", async () => {
    const CANDIDATOS = '[data-tour="op-detalle-candidatos"]';
    const TARJETA_CAND = '[data-tour="op-candidato"]';
    // La lista se pide después de hidratar: sin esperar la primera tarjeta se
    // encuadra el esqueleto de carga.
    await page.waitForSelector(TARJETA_CAND, { timeout: 12_000, state: "visible" });
    await scrollA(page, CANDIDATOS, { offset: 190, ms: 600 });
    await dormir(420);

    const cuantos = await page.locator(TARJETA_CAND).count();
    console.log(`    · ${cuantos} candidatas en cuadro`);

    await plano(page, {
      id: "candidatos",
      encuadre: CANDIDATOS,
      escala: 1.15,
      rotulo: "Quién puede hacerlo",
      texto: "La red cruza tu pedido con toda la base.",
      sello: "Match",
    }, () => dormir(1350));

    // Y el detalle sobre UNA sola: el número de compatibilidad y las etiquetas
    // que lo explican. Encuadre bien distinto del anterior —una tarjeta contra
    // la grilla entera— para que no se lea como el mismo zoom dos veces.
    await scrollA(page, TARJETA_CAND, { offset: 240, ms: 460 });
    await dormir(280);
    await plano(page, {
      id: "candidato",
      encuadre: TARJETA_CAND,
      escala: 1.55,
      rotulo: "El puntaje",
      texto: "Etiquetas en común, rubro y cercanía.",
    }, () => dormir(1250));
  });

  // ── 7. Publicar lo propio ───────────────────────────────────────
  await page.goto(`${BASE}/oportunidades/nueva`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await posicionarCursor(page, 760, 520);

  await plano(page, {
    id: "publicar",
    encuadre: "#titulo",
    rotulo: "¿Necesitás algo?",
    texto: "Publicá el tuyo en un minuto.",
    velocidad: 1.35,
  }, async () => {
    await opcional("título", () =>
      tipear(page, "#titulo", "Mantenimiento de tablero eléctrico", { porChar: 20 }));
    await dormir(280);
  });

  // El rubro es un combobox propio: el panel se monta con portal en el body.
  //
  // El plano TERMINA con el panel abierto, y recién después se elige. Es a
  // propósito: elegir una opción que está abajo obliga a scrollear la lista, y
  // ese scroll se llevaba el combobox a 585 px por encima del viewport — la
  // caja quedaba fuera de pantalla y el plano se caía a plano general. Lo que
  // hay para mostrar acá es el panel con los rubros, no el click.
  const OPCION = 'div[role="listbox"][aria-label^="Rubro"] div[role="option"]';
  await opcional("rubro", async () => {
    await plano(page, {
      id: "rubro",
      encuadre: 'div[role="listbox"][aria-label^="Rubro"]',
      escala: 1.45,
      rotulo: "Elegí el rubro",
      texto: "193 rubros para afinar el match.",
    }, async () => {
      await clickEn(page, "#categoria_id", { ms: 420 });
      await page.waitForSelector(OPCION, { timeout: 5000, state: "visible" });
      await dormir(900);
    });

    // La elección va fuera de plano.
    //
    // Por TEXTO y no por posición: son 193 rubros y el orden alfabético pone
    // cualquier cosa en un índice fijo (quedaba "Adhesivos y Selladores" para
    // un pedido de chapa). Los nombres están verificados contra el catálogo
    // real: "Chapa, perfiles y corte" NO existe —era un invento— y por eso el
    // rubro quedaba sin elegir y el formulario se veía a medio llenar en el
    // plano final.
    let iRubro = -1;
    for (const patron of [/^electricidad$/i, /^telecomunicaciones y redes$/i]) {
      iRubro = await indicePorTexto(page, OPCION, patron);
      if (iRubro >= 0) break;
    }
    if (iRubro >= 0) {
      // Con el locator de Playwright y no moviendo el mouse a mano: la lista
      // mide 288 px con 193 opciones, así que la elegida cae abajo de todo y
      // el click por coordenadas disparaba un scroll de la PÁGINA que se
      // llevaba el formulario 585 px para arriba. Esto pasa fuera de plano,
      // así que el realismo del cursor acá no importa.
      await page.locator(OPCION).nth(iRubro).click({ timeout: 5000 });
    } else {
      console.log("    · ningún rubro conocido en la lista: sigo sin elegir");
      await page.keyboard.press("Escape");
    }
    await dormir(400);
  });

  // Localidad y descripción se completan FUERA de plano: no aportan nada
  // filmadas (es tipeo sobre campos vacíos) pero sin ellas el plano del
  // remate muestra un formulario a medio llenar, que vende lo contrario.
  // Con `tipearDirecto` y no con `tipear`: el editor de la descripción arranca
  // en y≈967, o sea casi todo debajo del pliegue, y el click por coordenadas
  // lo enfocaba a veces sí y a veces no (quedaba el foco en BODY y el texto se
  // perdía sin error). Como esto no se filma, el mouse no aporta nada.
  await opcional("localidad", () =>
    tipearDirecto(page, "#localidad", "Burzaco, Buenos Aires"));
  await opcional("descripción", () =>
    tipearDirecto(page, 'div[role="textbox"][aria-labelledby="lbl-descripcion"]',
      "Revisión trimestral del tablero y la puesta a tierra de la oficina."));
  await dormir(300);

  // ── 8. El remate: cómo funciona el match ────────────────────────
  // Antes esto encuadraba "main form" con el cartel "Y listo. Va derecho a
  // quien puede hacerlo." Dos problemas: el formulario es una caja altísima,
  // así que el recorte agarraba una franja del medio y el plano no mostraba
  // nada reconocible; y la frase afirmaba algo que en ese plano no se veía.
  //
  // El formulario ya trae, en su barra lateral, un panel que explica el cruce
  // con las palabras del propio producto: "Cruzamos rubro, ubicación y
  // etiquetas", "Cada etiqueta suma puntaje". Es lo que había que explicar y
  // ya estaba escrito en la app: se filma eso.
  const COMO = '[data-tour="form-como-funciona"]';
  const hayPanel = await page.waitForSelector(COMO, { timeout: 6000, state: "visible" })
    .then(() => true).catch(() => false);

  if (hayPanel) {
    await scrollA(page, COMO, { offset: 200, ms: 560 });
    await dormir(340);
    await plano(page, {
      id: "como-funciona",
      encuadre: COMO,
      escala: 1.6,
      rotulo: "Cómo funciona",
      texto: "Cada etiqueta suma. No buscás a nadie.",
      sello: "Match",
    }, () => dormir(1600));
  } else {
    // Sin el panel no se inventa un remate: se cierra en general sobre el
    // formulario cargado, que al menos es algo que sí se ve.
    console.log("    · no encontré el panel del match: cierro en general");
    await opcional("volver arriba", () => scrollA(page, "#titulo", { offset: 210, ms: 520 }));
    await dormir(300);
    await plano(page, {
      id: "como-funciona",
      escala: 1,
      rotulo: "Y listo",
      texto: "Va derecho a quien puede hacerlo.",
    }, () => dormir(1400));
  }
}
