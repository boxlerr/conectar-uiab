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
  dormir, asentar, plano, clickEn, clickPorTexto, tipear, tipearDirecto, opcional,
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
    // Se entra al pedido de la UIAB, no al primero de la lista.
    //
    // Dos de los tres pedidos de ejemplo son de Vaxler —que es la cuenta con
    // la que se filma— y a quien publicó no se le muestra ni "Postularse" ni
    // el bloque del match. Si entramos al primero, el capítulo pierde sus dos
    // mejores tramos sin decir nada: los pasos se saltean en silencio. El
    // tablero igual muestra los de Vaxler, que es lo que se quería ver.
    //
    // El título tiene que coincidir con el que siembra demo-datos.mjs. Si se
    // cambia allá y no acá, esto cae en la primera tarjeta —una de Vaxler— y
    // el capítulo se queda sin match ni postulación.
    // La tarjeta ES el enlace (data-tour="op-tarjeta" está sobre el <a>), así
    // que buscar un <a> ADENTRO no matchea nada. Y hay que excluir
    // /oportunidades/nueva, que también empieza igual.
    const AJENO = 'a[href^="/oportunidades/"]:not([href$="/nueva"])';
    const i = await indicePorTexto(page, AJENO, /capacitaciones y certificados/i);
    if (i >= 0) await clickEn(page, AJENO, { ms: 420, idx: i });
    else await clickEn(page, TARJETA, { ms: 420 });
  });

  await page.waitForURL(/\/oportunidades\/[0-9a-f-]{20,}/, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 650);

  // ── 3. El requerimiento ─────────────────────────────────────────
  await plano(page, {
    id: "requerimiento",
    encuadre: '[data-tour="op-detalle-descripcion"]',
    escala: 1.4,
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
    texto: "Cantidad, plazo y ubicación.",
  }, () => dormir(1200));

  // ── 5. Por qué te llega (el match, del lado de quien lo recibe) ─
  // Este bloque es el que se pidió sumar, y es el argumento entero de la
  // plataforma: no es una cartelera donde hay que ir a mirar, es un cruce que
  // te trae lo que podés hacer.
  //
  // Sólo se renderiza si la cuenta con la que se filma es candidata del pedido
  // Y no es la dueña (detalle-cliente.tsx: `myMatch && !isOwner`). Los datos
  // los siembra demo-datos.mjs corriendo el cruce REAL del producto, así que
  // el motivo y los puntajes que se ven en cámara son los que calcula la
  // plataforma. Si por lo que sea no hay match, los dos planos se saltean con
  // aviso en vez de encuadrar el vacío.
  await opcional("match", async () => {
    const MATCH = '[data-tour="op-detalle-match"]';
    const PUNTAJES = '[data-tour="op-detalle-puntajes"]';
    await page.waitForSelector(MATCH, { timeout: 8000, state: "visible" });
    // offset generoso a propósito: con 170 la sección quedaba tan arriba que
    // el recorte arrancaba en y=0 y metía la barra de navegación adentro del
    // plano. Bajándola, el encuadre entra limpio.
    await scrollA(page, MATCH, { offset: 300, ms: 600 });
    await dormir(320);

    await plano(page, {
      id: "match-motivo",
      encuadre: MATCH,
      escala: 1.45,
      rotulo: "Por qué te llega",
      texto: "Coincide con tu rubro y tus etiquetas.",
      sello: "Match",
    }, () => dormir(1250));

    // Y ahora el detalle: la grilla de tres celdas.
    //
    // La distancia entre las dos escalas es a propósito y es lo que hace que
    // no se lea como "zoom de vuelta en el mismo lugar": 1.45 encuadra la
    // sección con su título, 1.9 recorta a los tres números. Con 1.3 y 1.7,
    // que es lo que había, los dos planos mostraban casi lo mismo.
    //
    // 1.9 pasa el tope del montaje (1.75), y se puede: una escala explícita lo
    // saltea. Más que esto sí se ablanda —la captura es 1920x1080 real— pero
    // acá lo que se agranda son tres números en negrita, que aguantan.
    await plano(page, {
      id: "match-puntajes",
      encuadre: PUNTAJES,
      escala: 1.9,
      rotulo: "Se puntúa",
      texto: "Categoría, etiquetas y ubicación.",
    }, () => dormir(1150));
  });

  // ── 6. Postularse (se muestra, NO se envía) ─────────────────────
  // Todo este tramo es OPCIONAL: el botón no se renderiza si la cuenta con la
  // que se filma ya se postuló, o si es la dueña del pedido.
  await opcional("postularse", async () => {
    const CAJA = '[data-tour="op-detalle-postular"] button';
    // La caja de postulación se monta después de la hidratación. Sin esperarla,
    // el paso se saltaba por "no hay ningún botón que diga postular" y se
    // perdía el tramo más importante del capítulo.
    await page.waitForSelector(CAJA, { timeout: 8000, state: "visible" });
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
      escala: 1.5,
      rotulo: "Postulate",
      texto: "Le llega directo a quien publicó.",
      velocidad: 1.3,
    }, async () => {
      // Enfocar con el locator y tipear con clickPrimero:false, igual que el
      // buscador del capítulo 1. Con el click por coordenadas el foco quedaba
      // afuera del textarea: el texto no entraba en ningún lado y el plano
      // mostraba la caja vacía —se ve en los frames del render anterior—.
      // Peor: ese click caía sobre el fondo del modal, que lo cierra, y por eso
      // el paso terminaba con "no hay ningún botón que diga cancelar".
      await page.locator(`${MODAL} textarea`).click({ timeout: 5000 });
      await dormir(140);
      await tipear(page, `${MODAL} textarea`,
        "Lo hacemos hace 20 años. Propuesta en 48 horas.",
        { porChar: 24, clickPrimero: false });
      await dormir(500);
    });

    // Salimos por Cancelar: nada se envía. Con red de contención, porque este
    // paso está DESPUÉS del plano: si falla, el plano ya se filmó bien y sería
    // absurdo perder el capítulo entero por no poder cerrar un modal.
    await clickPorTexto(page, `${MODAL} button`, /cancelar/, { ms: 400 })
      .catch(async () => {
        console.log("    · no encontré Cancelar: cierro con Escape");
        await page.keyboard.press("Escape").catch(() => {});
      });
    await dormir(400);
  });

  // Si el tramo se cortó a mitad de camino, el modal puede haber quedado
  // abierto y taparía todo lo que sigue.
  await page.keyboard.press("Escape").catch(() => {});

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

  // ── 8. El remate ────────────────────────────────────────────────
  // El remate va sin selectores que puedan faltar: si el formulario quedó a
  // medio llenar, el plano se arma igual en general.
  await opcional("volver arriba", async () => {
    await scrollA(page, "#titulo", { offset: 210, ms: 520 });
    await dormir(300);
  });

  // Se encuadra el FORMULARIO COMPLETADO, no el botón de publicar. El botón
  // vive en una barra sticky pegada al borde inferior, así que encuadrarlo
  // dejaba el remate de la pieza en una franja vacía con el cartel encima.
  // Lo que hay que ver acá es el pedido ya cargado.
  const FORM = "main form";
  const hayForm = await page.locator(FORM).count() > 0;

  await plano(page, {
    id: "match",
    encuadre: hayForm ? FORM : null,
    escala: hayForm ? 1.35 : 1,
    rotulo: "Y listo",
    // Sin sello: el de "Match" se usa dos capítulos antes, sobre el bloque
    // donde el match de verdad se ve. Repetirlo acá, encima de un formulario,
    // es ponerle el rótulo a algo que en este plano no está pasando.
    texto: "Va derecho a quien puede hacerlo.",
  }, () => dormir(1500));
}
