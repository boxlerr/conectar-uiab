/**
 * Capítulo 1 — El Directorio (se filma con sesión: ver nota en grabar.mjs).
 * Presupuesto: ~28 s (antes ~48 s).
 *
 * Criterio del recorte: un paso se queda si muestra algo que la pantalla no
 * explica sola. "Filtrá por tipo" y "Y por rubro" decían lo mismo dos veces
 * (los filtros se combinan) y se fusionaron en uno. Las reseñas se cayeron:
 * hoy no hay ninguna cargada, así que el paso filmaba un estado vacío — lo
 * peor que puede mostrar un video que quiere que te den ganas de entrar.
 */
import {
  dormir, asentar, señalar, sub, subOff, chip, progreso, placa, placaOff,
  foco, focoOff, clickEn, tipear, sello, moverA, scrollSuave, scrollA,
  asegurarVisible, caja,
} from "../piloto.mjs";

export async function escenaDirectorio({ page, BASE }) {
  await page.goto(`${BASE}/directorio`, { waitUntil: "domcontentloaded" });
  await asentar(page, 900);
  await page.evaluate(() => window.__cast.posicionarCursor(720, 640));

  // ── Placa de apertura ────────────────────────────────────────────
  // Corta: viene pegada al plano aéreo del montaje, que ya hizo la entrada.
  await placa(page, {
    rotulo: "Guía rápida",
    titulo: "Todo el parque industrial, en un solo lugar",
    texto: "Directorio y Oportunidades de UIAB Conecta, en un minuto.",
    ms: 1500,
  });
  await placaOff(page);
  await progreso(page, 6);

  // ── El directorio de un vistazo ─────────────────────────────────
  await chip(page, "01 · Directorio");
  await sub(page, "El directorio",
    "Todas las <b>empresas socias y prestadores</b> de la red UIAB.");
  await dormir(950);
  await progreso(page, 14);

  // ── Buscar ──────────────────────────────────────────────────────
  const BUSCADOR = 'input[aria-label="Buscar en todo el directorio"]';
  await sub(page, "Buscá", "Un rubro, una especialidad o el nombre de una empresa.");
  await tipear(page, BUSCADOR, "metal", { porChar: 68 });
  // Al pasar de vacío a con-texto el propio buscador scrollea hasta la
  // toolbar: le damos tiempo antes de encuadrar nosotros.
  await dormir(850);
  await progreso(page, 26);

  await scrollA(page, '[data-tour="directorio-toolbar"]', { offset: 150, ms: 520 });
  await foco(page, '[data-tour="directorio-toolbar"]');
  await sub(page, "Resultados en vivo", "El contador se actualiza mientras escribís.");
  // El sello cae acá porque es el primer momento en que la pantalla
  // RESPONDE: el golpe acompaña algo que de verdad pasó.
  await sello(page, "Al instante", { ms: 800 });
  await focoOff(page);
  await progreso(page, 38);

  // ── Filtros (tipo + rubro en un solo paso) ──────────────────────
  const FACETA = '[data-tour="directorio-sidebar"] button[aria-pressed]';
  await scrollA(page, '[data-tour="directorio-sidebar"]', { offset: 130, ms: 520 });
  await sub(page, "Afiná",
    "Tipo de organización y rubro. <b>Los filtros se combinan.</b>");
  const facetas = await page.locator(FACETA).count();
  if (facetas > 1) {
    await asegurarVisible(page, FACETA, 1);
    await clickEn(page, FACETA, { ms: 420, idx: 1 });
    await dormir(700);
  }
  await scrollA(page, '[data-tour="directorio-categorias"]', { offset: 210, ms: 520 });
  await foco(page, '[data-tour="directorio-categorias"]');
  await dormir(800);
  await focoOff(page);
  await progreso(page, 52);

  // ── Entrar a una ficha ──────────────────────────────────────────
  await subOff(page);
  const TARJETA = '[data-tour="directorio-resultados"] a[href^="/empresas/"]';
  await scrollA(page, TARJETA, { offset: 190, ms: 560 });
  await sub(page, "Entrá a la ficha", "Cada tarjeta lleva al perfil completo.");
  await dormir(500);
  const destino = await page.locator(TARJETA).first().getAttribute("href");
  await clickEn(page, TARJETA, { ms: 460 });
  await page.waitForURL(/\/empresas\//, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 600);
  await progreso(page, 62);

  // ── La ficha por dentro ─────────────────────────────────────────
  await señalar(page, '[data-tour="ficha-identidad"]', "La ficha",
    "Logo, razón social, ubicación y rubro. Revisado por la UIAB.", { leer: 950 });
  await sello(page, "Verificado", { ms: 750 });
  await progreso(page, 68);

  await señalar(page, '[data-tour="ficha-sidebar-contacto"]', "Contacto directo",
    "Mail, teléfono y web. <b>Sin intermediarios.</b>", { leer: 1100 });
  await focoOff(page);
  await subOff(page);
  await progreso(page, 74);
  await dormir(200);

  console.log(`    · ficha filmada: ${destino}`);
}
