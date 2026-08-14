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
  asegurarVisible, indicePorTexto, posicionarCursor, caja,
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
    velocidad: 1.2,
  }, async () => {
    await tipear(page, BUSCADOR, "metal", { porChar: 72 });
  });

  // El viaje del hero a los resultados lo hacemos nosotros y fuera de plano.
  await dormir(500);
  await scrollA(page, '[data-tour="directorio-toolbar"]', { offset: 150, ms: 520 });
  await dormir(320);

  // El plano del contador ("Resultados en vivo · El contador se actualiza
  // mientras escribís") se sacó: no aportaba nada que no se viera ya en el
  // plano de buscar, y encuadraba casi la misma zona que el de filtros, así
  // que se leía como un zoom repetido en el mismo lugar.

  // ── 3. Filtros ──────────────────────────────────────────────────
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

  await plano(page, {
    id: "tarjetas",
    encuadre: TARJETA,
    idx: iFicha,
    escala: 1.3,
    navega: true,
    rotulo: "Cada tarjeta",
    texto: "Un click y estás en el perfil.",
  }, async () => {
    await moverAlSelector(page, TARJETA, { ms: 420, idx: iFicha });
    await dormir(180);
    await clickEn(page, TARJETA, { ms: 200, idx: iFicha });
  });

  // La navegación no se filma.
  await page.waitForURL(/\/empresas\//, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 700);
  await posicionarCursor(page, 900, 620);

  // ── 6. La ficha ─────────────────────────────────────────────────
  await plano(page, {
    id: "ficha",
    encuadre: '[data-tour="ficha-identidad"]',
    rotulo: "La ficha",
    texto: "Razón social, ubicación y rubro.",
    sello: "Verificado",
  }, () => dormir(1250));

  // ── 7. El catálogo (lo mejor que tiene Vaxler) ──────────────────
  // No hay data-tour en el catálogo: se lo busca por el texto de su título,
  // que es más estable que un `nth-of-type` sobre la grilla de secciones.
  // Ojo con el nombre: la sección se llama "Productos y Servicios". Buscando
  // /catálogo/ no matcheaba nunca y el plano se saltaba en silencio.
  const CATALOGO = "main div.rounded-2xl";
  // El catálogo lo pinta el cliente después de la hidratación: sin esperarlo,
  // a veces se buscaba antes de que existiera y el plano —que es el mejor
  // material que hay en la base— se salteaba en silencio.
  await page.waitForFunction(
    () => [...document.querySelectorAll("main div.rounded-2xl")]
      .some((e) => /productos y servicios/i.test(e.textContent || "")),
    null, { timeout: 8000 },
  ).catch(() => console.log("    · el catálogo no apareció en 8 s"));
  const iCat = await indicePorTexto(page, CATALOGO, /productos y servicios/i);
  if (iCat >= 0) {
    await scrollA(page, CATALOGO, { offset: 150, ms: 620, idx: iCat });
    await dormir(360);
    await plano(page, {
      id: "catalogo",
      encuadre: CATALOGO,
      idx: iCat,
      escala: 1.25,
      rotulo: "El catálogo",
      texto: "Servicios con foto y ficha, no una lista.",
    }, () => dormir(1300));
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
