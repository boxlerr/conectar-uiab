import type { Step } from "react-joyride";
import type { PasoData } from "../contexto-tour";

/**
 * Tour de Oportunidades. Arranca en /oportunidades, navega automáticamente
 * a una oportunidad "abierta" de muestra (elegida al iniciar el tour) y
 * vuelve al listado para cerrar.
 *
 * "/oportunidades/__OP_ID__" es un sentinel que el provider reemplaza por el
 * id real al vuelo. Si no hay ninguna oportunidad abierta, los steps de ficha
 * quedan en "/oportunidades" y joyride espera el target — caso borde de un
 * tablero vacío.
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

export const RUTA_OP_MUESTRA = "/oportunidades/__OP_ID__";

export const pasosOportunidades: PasoConRuta[] = [
  // ─── BIENVENIDA ──────────────────────────────────────────────────
  centro({
    title: "Bienvenido a Oportunidades",
    content:
      "Acá se publican las necesidades reales de las empresas del parque: servicios, insumos, proyectos puntuales. Te muestro cómo leerlas y cómo postularte.",
    data: { ruta: "/oportunidades" },
  }),

  // ─── HERO + CTA PUBLICAR ─────────────────────────────────────────
  apunta({
    target: '[data-tour="op-hero"]',
    placement: "bottom",
    title: "El tablero del parque",
    content:
      "Todo lo que ves acá son pedidos auditados por la UIAB. Si sos empresa socia, podés publicar los tuyos desde el botón 'Publicar Oportunidad' arriba a la derecha.",
    data: { ruta: "/oportunidades" },
  }),

  // ─── BUSCADOR ────────────────────────────────────────────────────
  apunta({
    target: '[data-tour="op-buscador"]',
    placement: "bottom",
    title: "Buscá lo que te cuadra",
    content:
      "Escribí por título, empresa o especialidad. Probá con 'mantenimiento' o 'logística' — la búsqueda entra también en la categoría.",
    data: { ruta: "/oportunidades" },
  }),

  // ─── TARJETA + EXPLICACIÓN DE MATCH ─────────────────────────────
  apunta({
    target: '[data-tour="op-tarjeta"]',
    placement: "top",
    title: "Anatomía de una oportunidad",
    content:
      "Cada tarjeta muestra estado, empresa, descripción y categoría. Si ves el sello 'Recomendado' arriba a la derecha es porque tu perfil matchea — cuanto más alto el porcentaje, más afín.",
    data: { ruta: "/oportunidades" },
  }),

  // ─── SIDEBAR PUBLICAR ───────────────────────────────────────────
  apunta({
    target: '[data-tour="op-sidebar-publicar"]',
    placement: "left",
    title: "¿Tenés una necesidad?",
    content:
      "Si necesitás contratar algo, publicalo desde acá. Nuestro algoritmo te va a sugerir proveedores de servicios y empresas del parque que matcheen con tu pedido.",
    data: { ruta: "/oportunidades" },
  }),

  // ─── ANUNCIO DE NAVEGACIÓN A LA FICHA ───────────────────────────
  centro({
    title: "Te muestro una por dentro",
    content:
      "Dale Siguiente y te llevo a una oportunidad de ejemplo para que veas qué información encontrás al hacer click.",
    data: { ruta: "/oportunidades" },
  }),

  // ─── HERO DETALLE ───────────────────────────────────────────────
  apunta({
    target: '[data-tour="op-detalle-hero"]',
    placement: "bottom",
    title: "La ficha en un pantallazo",
    content:
      "Arriba tenés el folio, el estado y el título. Si sos candidato afín, vas a ver 'Recomendado · X pts' a la derecha — es el puntaje de match.",
    data: { ruta: RUTA_OP_MUESTRA },
  }),

  // ─── META ───────────────────────────────────────────────────────
  apunta({
    target: '[data-tour="op-detalle-meta"]',
    placement: "bottom",
    title: "Los datos clave de un vistazo",
    content:
      "Solicitante, ubicación y fecha de necesidad. Tres celdas para decidir en 5 segundos si tiene sentido leer el resto.",
    data: { ruta: RUTA_OP_MUESTRA },
  }),

  // ─── DESCRIPCIÓN ────────────────────────────────────────────────
  apunta({
    target: '[data-tour="op-detalle-descripcion"]',
    placement: "top",
    title: "El requerimiento en detalle",
    content:
      "Acá la empresa describe qué necesita con todo el detalle — especificaciones, alcance, condiciones. Leelo antes de postularte.",
    data: { ruta: RUTA_OP_MUESTRA },
  }),

  // ─── FICHA TÉCNICA ──────────────────────────────────────────────
  apunta({
    target: '[data-tour="op-detalle-ficha"]',
    placement: "left",
    title: "Ficha técnica al costado",
    content:
      "Cantidad, unidad, fecha, categoría, ubicación. Los datos duros que solés necesitar para cotizar, siempre visibles mientras scrolleás.",
    data: { ruta: RUTA_OP_MUESTRA },
  }),

  // ─── POSTULARSE ─────────────────────────────────────────────────
  apunta({
    target: '[data-tour="op-detalle-postular"]',
    placement: "left",
    title: "Postularte es directo",
    content:
      "Tocando 'Postularse' se abre un formulario corto: mensaje, cantidad y unidad sugerida. La empresa recibe tu propuesta y te contacta si le interesa — sin intermediarios.",
    data: { ruta: RUTA_OP_MUESTRA },
  }),

  // ─── CIERRE (vuelve al listado) ─────────────────────────────────
  centro({
    title: "¡Listo! Ya sabés moverte",
    content:
      'Cuando quieras volver a ver este recorrido, tocá "Ver tutorial" al lado del contador de oportunidades. Suerte con las próximas propuestas.',
    data: { ruta: "/oportunidades" },
  }),
];
