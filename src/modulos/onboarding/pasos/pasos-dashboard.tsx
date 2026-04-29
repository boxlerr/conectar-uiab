import type { Step } from "react-joyride";
import type { PasoData } from "../contexto-tour";

/**
 * Tour del Dashboard. Un recorrido de 9 pasos por el panel principal del
 * usuario logueado: perfil, KPIs, matches, actividad, productos, acciones
 * rápidas y CTA de explorar. Todo vive en /dashboard.
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

export const pasosDashboard: PasoConRuta[] = [
  // ─── BIENVENIDA ──────────────────────────────────────────────────
  centro({
    title: "Te damos la bienvenida al Dashboard",
    content:
      "Este es tu tablero de control: acá vas a encontrar el estado de tu perfil, las oportunidades que te matchean y accesos rápidos a todo lo importante. Te lo recorro en un minuto.",
    data: { ruta: "/dashboard" },
  }),

  // ─── HERO / PERFIL ──────────────────────────────────────────────
  apunta({
    target: '[data-tour="dash-hero"]',
    placement: "bottom",
    title: "Tu identidad en la red",
    content:
      "Tu logo, nombre y datos de contacto — lo mismo que ven los otros socios. Abajo tenés una barra con el porcentaje de completitud: cuanto más alto, más visible sos en el directorio y mejores matches recibís.",
    data: { ruta: "/dashboard" },
  }),

  // ─── KPIs ───────────────────────────────────────────────────────
  apunta({
    target: '[data-tour="dash-kpis"]',
    placement: "bottom",
    title: "El pulso de la red, de un vistazo",
    content:
      "Socios activos, proveedores de servicios verificados, oportunidades abiertas y tus propias métricas (publicadas o matches, según tu rol). Cada número es un link — tocalo y te lleva al detalle.",
    data: { ruta: "/dashboard" },
  }),

  // ─── SMART MATCHES ──────────────────────────────────────────────
  apunta({
    target: '[data-tour="dash-matches"]',
    placement: "top",
    title: "Matches inteligentes",
    content:
      "Nuestro algoritmo te sugiere oportunidades (o proveedores de servicios, si sos empresa) en base a tu categoría, etiquetas y ubicación. El porcentaje arriba a la izquierda es el puntaje de afinidad.",
    data: { ruta: "/dashboard" },
  }),

  // ─── FEED DE OPORTUNIDADES ──────────────────────────────────────
  apunta({
    target: '[data-tour="dash-feed"]',
    placement: "top",
    title: "Actividad reciente",
    content:
      "Las últimas oportunidades publicadas en la red, ordenadas por fecha. Scrolleá para mantenerte al día incluso si no entrás al tablero de Oportunidades.",
    data: { ruta: "/dashboard" },
  }),

  // ─── PRODUCTOS / SERVICIOS ──────────────────────────────────────
  apunta({
    target: '[data-tour="dash-items"]',
    placement: "top",
    title: "Tu catálogo abreviado",
    content:
      "Un resumen de tus productos o servicios cargados. Si está vacío, tocá 'Gestionar' para empezar — es lo primero que mira alguien que entra a tu ficha.",
    data: { ruta: "/dashboard" },
  }),

  // ─── QUICK ACTIONS ──────────────────────────────────────────────
  apunta({
    target: '[data-tour="dash-quick"]',
    placement: "left",
    title: "Acciones rápidas",
    content:
      "Los atajos más usados según tu rol: publicar oportunidad, buscar proveedores de servicios, editar perfil, subir documentos. Un click y estás adentro.",
    data: { ruta: "/dashboard" },
  }),

  // ─── EXPLORE CTA ────────────────────────────────────────────────
  apunta({
    target: '[data-tour="dash-explore"]',
    placement: "left",
    title: "Explorá la red",
    content:
      "Si sos empresa, desde acá filtrás proveedores de servicios; si sos proveedor de servicios, mirás empresas. El directorio completo a un click — usalo cuando andes buscando a alguien específico.",
    data: { ruta: "/dashboard" },
  }),

  // ─── CIERRE ─────────────────────────────────────────────────────
  centro({
    title: "¡Listo! Ya conocés tu dashboard",
    content:
      'Cuando quieras repasar, tocá "Ver tutorial" arriba en el hero. Ahora dale — revisá tus matches y aprovechá la red.',
    data: { ruta: "/dashboard" },
  }),
];
