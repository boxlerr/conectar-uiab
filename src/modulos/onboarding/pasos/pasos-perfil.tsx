import type { Step } from "react-joyride";
import type { PasoData } from "../contexto-tour";

/**
 * Tour completo del Perfil, con navegación entre rutas.
 *
 * Convenciones por tipo de paso:
 *  - target:"body" placement:"center" → modal centrado, skipScroll:true
 *  - target selector               → apunta al elemento, scroll habilitado
 *    scrollOffset:120              → margen generoso para no quedar tapado
 *                                    por el header sticky de 64px
 */
type PasoConRuta = Step & { data: PasoData };

const centro = (s: Omit<PasoConRuta, "target" | "placement" | "skipBeacon" | "skipScroll">): PasoConRuta => ({
  ...s,
  target: "body",
  placement: "center",
  skipBeacon: true,
  // Los pasos centrados no deben scrollear (son overlays flotantes sin target real)
  skipScroll: true,
} as PasoConRuta);

const apunta = (s: PasoConRuta): PasoConRuta => ({
  scrollOffset: 120,
  ...s,
  // Los pasos que apuntan a un elemento SÍ hacen scroll para que el target
  // quede visible. El scrollOffset compensa el header sticky de 64px.
  skipScroll: false,
});

export const pasosPerfil: PasoConRuta[] = [
  // ─── OVERVIEW en /perfil ──────────────────────────────────────────
  centro({
    title: "Te damos la bienvenida a tu perfil",
    content:
      "Te muestro en menos de dos minutos cómo está organizado tu panel y para qué sirve cada sección. Podés saltarlo cuando quieras.",
    data: { ruta: "/perfil" },
  }),
  apunta({
    target: '[data-tour="perfil-nav"]',
    placement: "right",
    title: "Menú de tu panel",
    content:
      "Desde este menú accedés a tus datos, catálogo, rubros, etiquetas, mensajes y suscripción. Te vamos a recorrer cada sección.",
    data: { ruta: "/perfil" },
  }),
  apunta({
    target: '[data-tour="perfil-estado"]',
    placement: "left",
    title: "Estado de tu cuenta",
    content:
      "Acá ves si tu perfil está aprobado, en revisión o rechazado. Mientras esté en revisión no aparecés en el directorio público.",
    data: { ruta: "/perfil" },
  }),
  apunta({
    target: '[data-tour="perfil-datos"]',
    placement: "bottom",
    title: "Tus datos en un vistazo",
    content:
      "Resumen de tu información principal: email, teléfono, ubicación y sitio web. Es lo primero que ve un potencial cliente.",
    data: { ruta: "/perfil" },
  }),
  apunta({
    target: '[data-tour="perfil-servicios"]',
    placement: "bottom",
    title: "Tus rubros",
    content:
      "Un vistazo rápido a las categorías en las que aparecés. Cuantos más rubros concretos cargues, más te encuentran.",
    data: { ruta: "/perfil" },
  }),
  apunta({
    target: '[data-tour="perfil-resenas"]',
    placement: "top",
    title: "Reseñas recibidas",
    content:
      "Las reseñas que te dejaron otros socios aparecen acá y en tu ficha pública. El promedio y los comentarios los ve todo el mundo.",
    data: { ruta: "/perfil" },
  }),

  // ─── DATOS Y CONTACTO ─────────────────────────────────────────────
  apunta({
    target: '[data-tour="nav-datos"]',
    placement: "right",
    title: "Vamos a Datos y Contacto →",
    content:
      "Al tocar Siguiente te llevo a la sección donde configurás toda tu información principal.",
    data: { ruta: "/perfil" },
  }),
  apunta({
    target: '[data-tour="datos-logo"]',
    placement: "right",
    title: "Subí tu logotipo",
    content:
      "Hacé click acá para subir tu logo o foto de perfil (PNG/JPG, hasta 2 MB). Es la cara visible de tu marca en el directorio.",
    data: { ruta: "/perfil/datos" },
  }),
  apunta({
    target: '[data-tour="datos-form"]',
    placement: "top",
    title: "Tu información principal",
    content:
      "Razón social, CUIT, email, teléfono, dirección y descripción. Completar bien este formulario es clave para aparecer en búsquedas.",
    data: { ruta: "/perfil/datos" },
  }),
  apunta({
    target: '[data-tour="datos-guardar"]',
    placement: "top",
    title: "No te olvides de guardar",
    content:
      "Siempre que cambies algo, tocá acá para guardar. Si recién creás tu perfil, este botón lo registra en el directorio por primera vez.",
    data: { ruta: "/perfil/datos" },
  }),

  // ─── PRODUCTOS Y SERVICIOS ────────────────────────────────────────
  centro({
    title: "Ahora tu catálogo →",
    content:
      "Te llevo a Productos y Servicios, donde cargás lo que ofrecés. Los socios lo ven al entrar a tu ficha.",
    data: { ruta: "/perfil/datos" },
  }),
  apunta({
    target: '[data-tour="productos-agregar"]',
    placement: "bottom",
    title: "Añadir un ítem",
    content:
      "Con este botón agregás un producto o servicio: nombre, descripción, precio y foto. Cuanto más completo, mejor te encuentran.",
    data: { ruta: "/perfil/productos-servicios" },
  }),
  apunta({
    target: '[data-tour="productos-importar"]',
    placement: "bottom",
    title: "Importar desde Excel",
    content:
      "¿Tenés muchos productos? Cargalos en lote con una planilla Excel siguiendo el formato que te damos. Ahorrás mucho tiempo.",
    data: { ruta: "/perfil/productos-servicios" },
  }),

  // ─── RUBROS Y ESPECIALIDADES ──────────────────────────────────────
  centro({
    title: "Rubros y especialidades →",
    content:
      "Ahora vamos a Rubros: las categorías donde querés aparecer cuando alguien busca tu sector.",
    data: { ruta: "/perfil/productos-servicios" },
  }),
  centro({
    title: "Elegí tus rubros",
    content:
      "Marcá todas las categorías en las que trabajás. Son la clave para aparecer cuando un socio filtra el directorio por industria o especialidad.",
    data: { ruta: "/perfil/servicios" },
  }),

  // ─── ETIQUETAS DE MATCH ───────────────────────────────────────────
  centro({
    title: "Etiquetas de Match →",
    content:
      "Las etiquetas son palabras clave: capacidades, materiales, problemas que resolvés. Las usamos para cruzarte automáticamente con oportunidades.",
    data: { ruta: "/perfil/etiquetas" },
  }),

  // ─── BANDEJA DE ENTRADA ───────────────────────────────────────────
  centro({
    title: "Bandeja de entrada →",
    content:
      "Acá te llegan las consultas de otros socios y las reseñas que te dejan. Revisala seguido para no perder oportunidades.",
    data: { ruta: "/perfil/solicitudes" },
  }),

  // ─── MI SUSCRIPCIÓN ───────────────────────────────────────────────
  centro({
    title: "Tu suscripción →",
    content:
      "Tu plan actual, fecha del próximo cobro y comprobantes de pago. Desde acá también podés pausar o cancelar si hiciera falta.",
    data: { ruta: "/perfil/suscripcion" },
  }),

  // ─── CIERRE ───────────────────────────────────────────────────────
  centro({
    title: "¡Listo! Ya conocés tu panel",
    content:
      'Te recomendamos empezar completando tus Datos y Contacto. Podés volver a ver este tutorial en cualquier momento desde el botón "Ver tutorial del perfil".',
    data: { ruta: "/perfil/suscripcion" },
  }),
];
