/**
 * Capítulo 1 — El Directorio (se filma con sesión: ver nota en grabar.mjs).
 *
 * Está escrito como una lista de PLANOS, no como un recorrido. Lo que pasa
 * entre plano y plano —navegar, scrollear, esperar a que compile una ruta— no
 * entra en la pieza: el montaje se queda sólo con el rango de cada plano.
 * Por eso acá se puede scrollear con calma sin que cueste segundos de video.
 *
 * Cada plano declara a QUIÉN encuadra. El montaje hace el punch-in sobre esa
 * caja y pone el texto sincronizado con el acercamiento.
 */
import {
  dormir, asentar, plano, clickEn, tipear, scrollA, moverAlSelector,
  asegurarVisible, indicePorTexto, posicionarCursor, caja, scrollSuave,
} from "../piloto.mjs";

const BUSCADOR = 'input[aria-label="Buscar en todo el directorio"]';
const TARJETA = '[data-tour="directorio-resultados"] a[href^="/empresas/"]';
const FACETA = '[data-tour="directorio-sidebar"] button[aria-pressed]';

export async function escenaDirectorio({ page, BASE }) {
  await page.goto(`${BASE}/directorio`, { waitUntil: "domcontentloaded" });
  await asentar(page, 700);
  await posicionarCursor(page, 820, 700);

  // ── 1. El directorio de un vistazo ──────────────────────────────
  // Plano general: es el único que se ve entero, y dura poco. Sirve para
  // ubicar; lo que se entiende se entiende en los planos cerrados.
  await plano(page, {
    id: "directorio",
    escala: 1,
    rotulo: "El directorio",
    texto: "Todas las socias y prestadores de la red.",
  }, () => dormir(1200));

  // ── 2. Buscar ───────────────────────────────────────────────────
  // Se encuadra el MISMO campo en el que se tipea, no el buscador de la barra
  // lateral: antes apuntaban a elementos distintos y el plano mostraba una
  // franja de logos mientras el texto se escribía fuera de cuadro.
  //
  // Y va con el scroll congelado: apenas entra la primera letra, el directorio
  // hace scrollIntoView hasta los resultados (directorio-cliente.tsx). Como
  // producto está bien, pero durante el plano se lleva el campo fuera de
  // cuadro y el acercamiento termina encuadrando una franja de logos.
  await plano(page, {
    id: "buscar",
    encuadre: BUSCADOR,
    congelar: true,
    rotulo: "Buscá",
    texto: "Un rubro, una especialidad o un nombre.",
    velocidad: 1.25,
  }, async () => {
    // La palabra ENTERA, no "metal". Cortada a la mitad el plano terminaba
    // sin haber mostrado nunca un resultado, que es lo que la búsqueda tiene
    // que probar.
    // "software" y no "vaxler": buscar por el nombre propio de la empresa que
    // desarrolló el sitio queda auto-referencial, y además una búsqueda por
    // rubro muestra lo que el directorio hace de verdad — devolver varias.
    await moverAlSelector(page, BUSCADOR, { ms: 440 });
    await page.locator(BUSCADOR).click({ timeout: 5000 });
    await dormir(160);
    await tipear(page, BUSCADOR, "software", { porChar: 66, clickPrimero: false });
    await dormir(420);
  });

  // El viaje del hero a los resultados lo hacemos nosotros y fuera de plano.
  await dormir(500);
  await scrollA(page, '[data-tour="directorio-toolbar"]', { offset: 150, ms: 520 });
  await dormir(320);

  // ── 3. Los resultados ───────────────────────────────────────────
  // Este plano volvió. La primera versión encuadraba el CONTADOR, que no
  // muestra nada, y encima caía sobre la misma zona que el de filtros. Ahora
  // encuadra la grilla: se ven las metalúrgicas que contestaron a la búsqueda.
  await scrollA(page, '[data-tour="directorio-resultados"]', { offset: 150, ms: 620 });
  await dormir(340);

  await plano(page, {
    id: "resultados",
    encuadre: TARJETA,
    escala: 1.45,
    rotulo: "Al instante",
    texto: "Quién hace eso en el parque.",
  }, () => dormir(400));

  // ── 4. Filtros ──────────────────────────────────────────────────
  await scrollA(page, '[data-tour="directorio-sidebar"]', { offset: 130, ms: 520 });
  await dormir(300);

  await plano(page, {
    id: "filtros",
    encuadre: '[data-tour="directorio-sidebar"]',
    escala: 1.45,
    rotulo: "Afiná",
    texto: "Filtrá por tipo y por rubro.",
  }, async () => {
    const facetas = await page.locator(FACETA).count();
    if (facetas > 1) {
      await asegurarVisible(page, FACETA, 1);
      await clickEn(page, FACETA, { ms: 420, idx: 1 });
      await dormir(650);
    } else {
      await dormir(900);
    }
  });

  // ── 5. Las tarjetas ─────────────────────────────────────────────
  await scrollA(page, TARJETA, { offset: 190, ms: 560 });
  await dormir(320);

  // Vaxler a propósito y no "la primera que salga": es la ficha más completa
  // de la base —6 servicios con foto, 10 etiquetas, descripción, logo y web—,
  // y una ficha vacía en el video vende lo contrario de lo que se quiere
  // vender. Si no aparece, cae en la primera.
  const iFicha = Math.max(0, await indicePorTexto(page, TARJETA, /vaxler/i));
  const destino = await page.locator(TARJETA).nth(iFicha).getAttribute("href");

  // El plano "Un click y estás en el perfil" se sacó: no sumaba nada — misma
  // pantalla, mismo encuadre, y el click no se percibía. Después de filtros se
  // salta directo a la ficha. El click sigue estando, pero fuera de plano.
  await moverAlSelector(page, TARJETA, { ms: 460, idx: iFicha });
  await dormir(140);
  await clickEn(page, TARJETA, { ms: 200, idx: iFicha });

  // La navegación no se filma.
  await page.waitForURL(/\/empresas\//, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 700);
  await scrollSuave(page, 0, 1);
  await dormir(260);
  await posicionarCursor(page, 900, 620);

  // ── 6. La ficha ─────────────────────────────────────────────────
  await plano(page, {
    id: "ficha",
    encuadre: '[data-tour="ficha-identidad"]',
    // Explícita: con "auto" el recorte del sujeto (980 px) cortaba el cuarto
    // dato de la tira — "10 especialidades", que es justo lo que hace a esta
    // ficha la más completa de la base.
    escala: 1,
    rotulo: "La ficha",
    texto: "Productos, rubros y especialidades.",
    sello: "Verificado",
  }, () => dormir(1250));

  // ── 7. El catálogo ──────────────────────────────────────────────
  // Se filma el catálogo REAL de la ficha. Se probó reemplazarlo por un plano
  // generado y no sirve: lo que hay que mostrar es el producto, no una
  // ambientación.
  //
  // El selector es un data-tour propio y no "main section" + texto, que es lo
  // que había antes y por qué el plano mostraba la cabecera de la ficha en vez
  // del catálogo: al buscar la sección que CONTIENE "productos y servicios",
  // el primer match en orden de documento no es el catálogo sino el
  // contenedor que lo envuelve —los ancestros van primero—, así que se
  // encuadraba media página y el acercamiento caía sobre el encabezado.
  //
  // Ojo: el catálogo está detrás del login (`isAuthenticated`) y sólo se
  // renderiza si la ficha tiene ítems cargados. Las dos condiciones se cumplen
  // acá (se filma con sesión, y Vaxler tiene catálogo), pero si alguna falla el
  // plano se saltea con aviso en vez de encuadrar cualquier cosa.
  const CATALOGO = '[data-tour="ficha-catalogo"]';
  const hayCatalogo = await page.waitForSelector(CATALOGO, { timeout: 8000 })
    .then(() => true)
    .catch(() => { console.log("    · ⚠ no hay catálogo en la ficha: salteo el plano"); return false; });

  if (hayCatalogo) {
    // scrollIntoViewIfNeeded de Playwright, no el del DOM: la capa visual
    // parchea Element.prototype.scrollIntoView para poder congelar el scroll
    // durante un plano, así que llamarlo desde la página puede ser un no-op.
    await page.locator(CATALOGO).first().scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
    await dormir(700);

    // Comprobación ruidosa: si el catálogo no quedó arriba, el plano va a
    // mostrar otra cosa y el cartel va a mentir. Mejor enterarse en el log.
    const yCat = await caja(page, CATALOGO, 0);
    console.log(`    · catálogo en y=${Math.round(yCat?.y ?? -9999)}`
      + (yCat && yCat.y >= 0 && yCat.y < 420 ? " ✓" : " ⚠ no quedó en cuadro"));

    await plano(page, {
      id: "catalogo",
      encuadre: CATALOGO,
      escala: 1.25,
      rotulo: "El catálogo",
      texto: "Servicios con foto y ficha, no una lista.",
    }, () => dormir(500));
  }

  // ── 8. Contacto directo ─────────────────────────────────────────
  await scrollA(page, '[data-tour="ficha-sidebar-contacto"]', { offset: 170, ms: 560 });
  await dormir(320);

  await plano(page, {
    id: "contacto",
    encuadre: '[data-tour="ficha-sidebar-contacto"]',
    rotulo: "Contacto directo",
    texto: "Mail, teléfono y web. Sin intermediarios.",
  }, () => dormir(1200));

  console.log(`    · ficha filmada: ${destino}`);
}
