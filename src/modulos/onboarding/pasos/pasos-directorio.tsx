import type { Step } from "react-joyride";
import type { PasoData } from "../contexto-tour";

/**
 * Tour del Directorio. Arranca en /empresas, navega automáticamente a la
 * ficha de una empresa aprobada (elegida al iniciar el tour) y vuelve al
 * listado para cerrar con el tip de filtros.
 *
 * La ruta "/empresas/__SLUG__" es un sentinel: el provider la reemplaza en
 * runtime por el slug de la empresa de muestra. Si no hay ninguna, el step
 * queda en /empresas y joyride espera al target (que no va a aparecer) —
 * pero ése es el caso borde de un directorio vacío.
 */
type PasoConRuta = Step & { data: PasoData };

const centro = (
  s: Omit<PasoConRuta, "target" | "placement" | "skipBeacon" | "skipScroll">
): PasoConRuta =>
  ({
    ...s,
    target: "body",
    placement: "center",
    skipBeacon: true,
    skipScroll: true,
  } as PasoConRuta);

const apunta = (s: PasoConRuta): PasoConRuta => ({
  scrollOffset: 120,
  ...s,
  skipScroll: false,
});

export const RUTA_FICHA_MUESTRA = "/empresas/__SLUG__";

export const pasosDirectorio: PasoConRuta[] = [
  // ─── BIENVENIDA ──────────────────────────────────────────────────
  centro({
    title: "Te damos la bienvenida al Directorio",
    content:
      "Acá encontrás todas las empresas socias y prestadores verificados de la red UIAB. Te muestro en un minuto cómo sacarle el jugo.",
    data: { ruta: "/empresas" },
  }),

  // ─── CONTEXTO DEL DIRECTORIO (hero + stats unificados) ──────────
  apunta({
    target: '[data-tour="directorio-stats"]',
    placement: "bottom",
    title: "Un ecosistema B2B verificado",
    content:
      "Todas las fichas que ves pasaron revisión de la UIAB. Arriba a la derecha ves cuántas empresas y particulares están activos hoy.",
    data: { ruta: "/empresas" },
  }),

  // ─── BUSCADOR ────────────────────────────────────────────────────
  apunta({
    target: '[data-tour="directorio-buscador"]',
    placement: "right",
    title: "Buscá por palabra clave",
    content:
      "Escribí un nombre, un servicio o una especialidad. Probá con algo concreto como 'metalurgia' o 'logística' — busca en nombre, descripción y rubros.",
    data: { ruta: "/empresas" },
  }),

  // ─── FILTRO DE CATEGORÍAS ───────────────────────────────────────
  apunta({
    target: '[data-tour="directorio-categorias"]',
    placement: "right",
    title: "Filtrá por rubro",
    content:
      "Elegí un sector para acotar los resultados. Se combina con la búsqueda: podés pedir 'todo lo de Logística que diga express' en dos clics.",
    data: { ruta: "/empresas" },
  }),

  // ─── TOOLBAR / CONTADOR + VISTA ─────────────────────────────────
  apunta({
    target: '[data-tour="directorio-toolbar"]',
    placement: "top",
    title: "Resultados y vista",
    content:
      "Acá ves cuántos coinciden con tus filtros. A la derecha cambiás entre grilla (para escanear logos) y lista (para ver más datos por fila).",
    data: { ruta: "/empresas" },
  }),

  // ─── RESULTADOS → ANUNCIO DE NAVEGACIÓN A LA FICHA ──────────────
  centro({
    title: "Te muestro una ficha de ejemplo",
    content:
      "Tocá Siguiente y te llevo automáticamente a una ficha real para que veas qué encontrás adentro cuando hacés click en cualquier tarjeta.",
    data: { ruta: "/empresas" },
  }),

  // ─── YA DENTRO DE LA FICHA ──────────────────────────────────────
  apunta({
    target: '[data-tour="ficha-identidad"]',
    placement: "bottom",
    title: "La ficha en un pantallazo",
    content:
      "Arriba tenés el logo, el nombre, la ubicación y el sitio web. El botón 'Contactar' abre directamente un email a la empresa — sin intermediarios.",
    data: { ruta: RUTA_FICHA_MUESTRA },
  }),

  // ─── SIDEBAR CONTACTO ──────────────────────────────────────────
  apunta({
    target: '[data-tour="ficha-sidebar-contacto"]',
    placement: "left",
    title: "Datos de contacto directos",
    content:
      "Ubicación, correo, teléfono y sitio web. Todos reales y verificados — escribile cuando tengas un proyecto concreto, no hace falta pasar por formularios.",
    data: { ruta: RUTA_FICHA_MUESTRA },
  }),

  // ─── RESEÑAS ───────────────────────────────────────────────────
  apunta({
    target: '[data-tour="ficha-resenas"]',
    placement: "top",
    title: "Reseñas de otros socios",
    content:
      "Antes de contactar, mirá las reseñas. Son de socios que ya trabajaron con la empresa — una referencia real, con estrellas y comentarios.",
    data: { ruta: RUTA_FICHA_MUESTRA },
  }),

  // ─── DEJAR RESEÑA ──────────────────────────────────────────────
  centro({
    title: "Dejá tu reseña también",
    content:
      "Si trabajaste con alguien del directorio, tomate dos minutos para calificarlo desde su ficha. Ayudás a toda la red a elegir mejor.",
    data: { ruta: RUTA_FICHA_MUESTRA },
  }),

  // ─── VOLVEMOS AL DIRECTORIO ────────────────────────────────────
  centro({
    title: "Combiná filtros para afinar",
    content:
      "Búsqueda + categoría + tab (empresa o particular) trabajan juntos. Si no aparece nadie, probá quitar una condición a la vez hasta encontrar lo que buscás.",
    data: { ruta: "/empresas" },
  }),

  // ─── CIERRE ─────────────────────────────────────────────────────
  centro({
    title: "¡Listo! Ya podés explorar",
    content:
      'Cuando quieras volver a ver este recorrido, tocá "Ver tutorial" al lado del contador de resultados. Ahora dale — encontrá un buen contacto.',
    data: { ruta: "/empresas" },
  }),
];
