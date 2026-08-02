/**
 * Capítulo 1 — El Directorio (se filma sin sesión: es lo que ve cualquiera).
 * Presupuesto: ~48 s.
 */
import {
  dormir, asentar, señalar, sub, subOff, chip, progreso, placa, placaOff,
  foco, focoOff, clickEn, tipear, moverA, scrollSuave, scrollA, asegurarVisible, caja,
} from "../piloto.mjs";

export async function escenaDirectorio({ page, BASE }) {
  await page.goto(`${BASE}/directorio`, { waitUntil: "domcontentloaded" });
  await asentar(page, 1200);
  await page.evaluate(() => window.__cast.posicionarCursor(720, 640));

  // ── Placa de apertura ────────────────────────────────────────────
  await placa(page, {
    rotulo: "Guía rápida",
    titulo: "Todo el parque industrial, en un solo lugar",
    texto: "Cómo usar el Directorio y las Oportunidades de UIAB Conecta.",
    ms: 2600,
  });
  await placaOff(page);
  await progreso(page, 4);

  // ── El directorio de un vistazo ─────────────────────────────────
  await chip(page, "01 · Directorio");
  await sub(page, "El directorio",
    "Todas las <b>empresas socias y prestadores</b> de la red UIAB, verificados uno por uno.");
  await dormir(1700);
  await progreso(page, 12);

  // ── Buscar ──────────────────────────────────────────────────────
  const BUSCADOR = 'input[aria-label="Buscar en todo el directorio"]';
  await sub(page, "Buscá", "Escribí un rubro, una especialidad o el nombre de una empresa.");
  await tipear(page, BUSCADOR, "metal", { porChar: 105 });
  // Al pasar de vacío a con-texto el propio buscador scrollea hasta la
  // toolbar: le damos tiempo antes de encuadrar nosotros.
  await dormir(1500);
  await progreso(page, 22);

  await scrollA(page, '[data-tour="directorio-toolbar"]', { offset: 150, ms: 850 });
  await foco(page, '[data-tour="directorio-toolbar"]');
  await sub(page, "Resultados en vivo", "El contador se actualiza mientras escribís.");
  await dormir(1600);
  await focoOff(page);
  await progreso(page, 30);

  // ── Filtrar por tipo de organización ────────────────────────────
  const FACETA = '[data-tour="directorio-sidebar"] button[aria-pressed]';
  await scrollA(page, '[data-tour="directorio-sidebar"]', { offset: 130, ms: 800 });
  await sub(page, "Filtrá por tipo",
    "Empresas socias, prestadores, entidades financieras, educativas o cooperativas.");
  await dormir(900);
  const facetas = await page.locator(FACETA).count();
  if (facetas > 1) {
    await asegurarVisible(page, FACETA, 1);
    await clickEn(page, FACETA, { ms: 620, idx: 1 });
    await dormir(1200);
  }
  await progreso(page, 40);

  // ── Filtrar por rubro ───────────────────────────────────────────
  await sub(page, "Y por rubro", "Los filtros se combinan entre sí para afinar la búsqueda.");
  await scrollA(page, '[data-tour="directorio-categorias"]', { offset: 210, ms: 800 });
  await foco(page, '[data-tour="directorio-categorias"]');
  await dormir(1500);
  await focoOff(page);
  await progreso(page, 48);

  // ── Entrar a una ficha ──────────────────────────────────────────
  await subOff(page);
  const TARJETA = '[data-tour="directorio-resultados"] a[href^="/empresas/"]';
  await scrollA(page, TARJETA, { offset: 190, ms: 900 });
  await sub(page, "Entrá a la ficha", "Cada tarjeta lleva al perfil completo de la organización.");
  await dormir(900);
  const destino = await page.locator(TARJETA).first().getAttribute("href");
  await clickEn(page, TARJETA, { ms: 700 });
  await page.waitForURL(/\/empresas\//, { timeout: 15_000 }).catch(() => {});
  await asentar(page, 900);
  await progreso(page, 56);

  // ── La ficha por dentro ─────────────────────────────────────────
  await señalar(page, '[data-tour="ficha-identidad"]', "La ficha",
    "Logo, razón social, ubicación y rubro. Todo revisado por la UIAB.", { leer: 1700 });
  await progreso(page, 64);

  await señalar(page, '[data-tour="ficha-sidebar-contacto"]', "Contacto directo",
    "Mail, teléfono y web de la empresa. <b>Sin intermediarios.</b>", { leer: 1900 });
  await progreso(page, 70);

  // La ficha se filma con sesión: sin ella el catálogo y las reseñas salen
  // tapados por "Contenido exclusivo para miembros", que no es lo que ve una
  // socia. Hoy no hay reseñas cargadas, así que el paso se plantea como
  // invitación —que es justo lo que dice el estado vacío de la pantalla.
  await señalar(page, '[data-tour="ficha-resenas"]', "Reseñas de la red",
    "Calificá a las empresas con las que ya trabajaste.", { leer: 1700 });
  await focoOff(page);
  await subOff(page);
  await progreso(page, 74);
  await dormir(300);

  console.log(`    · ficha filmada: ${destino}`);
}
