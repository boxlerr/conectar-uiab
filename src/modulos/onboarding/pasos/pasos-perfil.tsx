import type { Step } from "react-joyride";

/**
 * Tour guiado del Perfil. Los `target` apuntan a selectores `data-tour`
 * que agregamos directamente en los componentes de la sección. Si un
 * target no existe todavía en la página (por ej., el usuario no tiene
 * entidad creada aún), react-joyride simplemente lo salta sin romper.
 *
 * Mantenemos los textos cortos y concretos: un usuario nuevo no quiere
 * leer párrafos, quiere entender rápido dónde está cada cosa.
 */
export const pasosPerfil: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Te damos la bienvenida a tu perfil",
    content:
      "Acá configurás cómo te ven el resto de los socios en el directorio. Te muestro las secciones principales en menos de un minuto.",
    skipBeacon: true,
  },
  {
    target: '[data-tour="perfil-nav"]',
    placement: "right",
    title: "Menú lateral",
    content:
      "Este es el menú de tu panel. Desde acá accedés a tus datos, productos/servicios, rubros, bandeja de mensajes y tu suscripción.",
  },
  {
    target: '[data-tour="perfil-estado"]',
    placement: "left",
    title: "Estado de tu cuenta",
    content:
      "Acá ves si tu perfil está aprobado, en revisión o rechazado. Mientras esté en revisión no aparecés aún en el directorio público.",
  },
  {
    target: '[data-tour="perfil-datos"]',
    placement: "bottom",
    title: "Datos y Contacto",
    content:
      "Tu información principal: razón social o nombre, email, teléfono, dirección y descripción. Es lo primero que ve un potencial cliente.",
  },
  {
    target: '[data-tour="perfil-servicios"]',
    placement: "bottom",
    title: "Rubros y especialidades",
    content:
      "Elegí las categorías en las que querés aparecer. Son la clave para que te encuentren cuando alguien busca un rubro específico.",
  },
  {
    target: '[data-tour="perfil-resenas"]',
    placement: "top",
    title: "Reseñas",
    content:
      "Acá ves las reseñas que recibiste de otros socios. Promedio y comentarios aparecen públicos en tu ficha del directorio.",
  },
  {
    target: '[data-tour="nav-productos-servicios"]',
    placement: "right",
    title: "Productos y servicios",
    content:
      "En esta sección cargás tu catálogo: nombre, descripción y precio. Podés importar en lote con Excel. Los socios los ven al entrar a tu ficha.",
  },
  {
    target: '[data-tour="nav-etiquetas"]',
    placement: "right",
    title: "Etiquetas de Match",
    content:
      "Agregá palabras clave que describan lo que hacés. Se usan para el matching automático con oportunidades de otros socios.",
  },
  {
    target: '[data-tour="nav-solicitudes"]',
    placement: "right",
    title: "Bandeja de entrada",
    content:
      "Acá te llegan las consultas de otros socios y también las reseñas que te dejan. Revisala seguido.",
  },
  {
    target: '[data-tour="nav-suscripcion"]',
    placement: "right",
    title: "Mi suscripción",
    content:
      "Tu plan, fecha del próximo cobro y comprobantes de pago. Desde acá también podés pausar o cancelar si hiciera falta.",
  },
  {
    target: "body",
    placement: "center",
    title: "¡Listo!",
    content:
      "Podés volver a ver este tutorial en cualquier momento con el botón “Ver tutorial” del encabezado. Empezá por completar tus Datos y Contacto.",
    skipBeacon: true,
  },
];
