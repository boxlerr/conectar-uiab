/**
 * Catálogo de CONTENIDO de las novedades.
 *
 * POR QUÉ EXISTE
 *
 * Hasta ahora el texto de cada novedad vivía hardcodeado adentro de su modal.
 * Eso alcanzaba mientras el único lugar donde se leía era el cartel que salta
 * una vez y no vuelve nunca más: al que lo cerró sin leer, la novedad se le
 * perdía para siempre. Ahora el mismo contenido se muestra en dos lados —el
 * cartel y la sección "Novedades" del panel de control—, así que el texto pasa
 * a vivir acá y los dos lo leen del mismo lugar.
 *
 * ES SÓLO CONTENIDO
 *
 * A quién le corresponde cada una y desde cuándo sigue en `novedades.ts`
 * (fechas de publicación y regla de "vista"); qué componente la dibuja sigue en
 * `pila-novedades.tsx`. Este archivo no importa nada del servidor ni de
 * Supabase a propósito: lo consumen componentes de cliente y meterle una
 * dependencia de servidor en la cadena rompe la hidratación en silencio.
 */
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarClock,
  KeyRound,
  LayoutGrid,
  LineChart,
  Phone,
  SlidersHorizontal,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { NOVEDAD_PUBLICADA_EL, type NovedadId } from "./novedades";

export interface CambioNovedad {
  icono: LucideIcon;
  titulo: string;
  texto: string;
}

export interface AvisoNovedad {
  /** Ámbar = "prestá atención a esto". Verde = "esto ya estaba roto y lo arreglamos". */
  tono: "ambar" | "verde";
  titulo: string;
  items: string[];
  pie?: string;
}

export interface ContenidoNovedad {
  id: NovedadId;
  titulo: string;
  /** El subtítulo del cartel: una sola frase que explica de qué se trata. */
  resumen: string;
  cambios: CambioNovedad[];
  aviso: AvisoNovedad;
  cta: { href: string; label: string };
  /** ISO de cuándo salió. Se deriva de `novedades.ts`, no se duplica. */
  fecha: string;
}

/**
 * El texto es el que ya estaba en los modales, palabra por palabra. No se
 * reescribió nada al mudarlo: son cambios que ya se anunciaron.
 */
export const CATALOGO_NOVEDADES: Record<NovedadId, ContenidoNovedad> = {
  panel_control: {
    id: "panel_control",
    titulo: "Rediseñamos tu panel de control",
    resumen:
      "Es la pantalla que ves al entrar. Ahora te muestra cuánta gente abrió tu ficha, cómo te ve el directorio y qué fue pasando con tu cuenta.",
    cambios: [
      {
        icono: LineChart,
        titulo: "Cuántos te vieron",
        texto: "Las visitas a tu ficha, día por día, y cómo viene el mes contra el anterior.",
      },
      {
        icono: LayoutGrid,
        titulo: "Cómo te ve el directorio",
        texto: "Una vista previa de tu ficha pública, con lo que te falta cargar marcado.",
      },
      {
        icono: Bell,
        titulo: "Tus avisos, también en el celular",
        texto: "Las notificaciones dejaron de vivir sólo en la campana de la computadora.",
      },
    ],
    aviso: {
      tono: "verde",
      titulo: "También arreglamos esto",
      items: [
        "El botón para ver tu ficha pública no aparecía nunca: estaba roto desde el principio.",
        "Los números que ves son de tu cuenta, no ejemplos: si algo dice cero, es porque está en cero.",
        "Ahora tenés esta misma sección de novedades en el panel, así que ningún anuncio se pierde.",
      ],
      pie: "Si algo no se ve como esperabas, escribinos desde Contacto.",
    },
    cta: { href: "/panel-de-control#estadisticas", label: "Ver mis estadísticas" },
    fecha: NOVEDAD_PUBLICADA_EL.panel_control,
  },

  oportunidades_cartelera: {
    id: "oportunidades_cartelera",
    titulo: "Rediseñamos la cartelera de oportunidades",
    resumen:
      "Es donde las socias publican lo que necesitan comprar o contratar. Ahora se lee de un vistazo: quién lo pide, de qué rubro es y para cuándo lo necesita.",
    cambios: [
      {
        icono: Building2,
        titulo: "Se ve quién publica",
        texto: "Cada pedido lleva el logo de la empresa que lo publicó, no sólo el nombre.",
      },
      {
        icono: SlidersHorizontal,
        titulo: "Filtros y orden",
        texto: "Buscá por rubro, ubicación o antigüedad, y ordená la lista como te sirva.",
      },
      {
        icono: CalendarClock,
        titulo: "Los datos duros, afuera",
        texto: "Cantidad, localidad y fecha de necesidad se leen sin abrir el pedido.",
      },
    ],
    aviso: {
      tono: "ambar",
      titulo: "Conviene que lo sepas",
      items: [
        "El logo que se muestra es el de tu ficha: si no cargaste uno, aparece la inicial.",
        "Publicar un pedido no tiene costo adicional y las respuestas van directo a tu empresa.",
        "Al publicarlo, la plataforma te sugiere las socias afines por rubro y etiquetas.",
      ],
    },
    cta: { href: "/oportunidades", label: "Ver la cartelera" },
    fecha: NOVEDAD_PUBLICADA_EL.oportunidades_cartelera,
  },

  perfil_directorio: {
    id: "perfil_directorio",
    titulo: "Rediseñamos tu ficha del directorio",
    resumen:
      "Es la página que ven las otras empresas cuando te buscan. Ahora se entiende de una: quién sos, cómo contactarte y qué vendés, sin bajar media pantalla.",
    cambios: [
      {
        icono: BadgeCheck,
        titulo: "Sello de verificada",
        texto: "Se ve de entrada que la ficha es la cuenta real de tu empresa, no una copia.",
      },
      {
        icono: Phone,
        titulo: "El contacto, arriba de todo",
        texto: "Teléfono, correo y dirección dejaron de estar al final del scroll.",
      },
      {
        icono: LayoutGrid,
        titulo: "Tu catálogo de un vistazo",
        texto: "Los productos entran en pantalla y la foto grande se abre con un click.",
      },
    ],
    aviso: {
      tono: "ambar",
      titulo: "Conviene que le des una mirada",
      items: [
        "La ficha muestra lo que vos cargaste: si falta el logo o la descripción, ahora se nota más.",
        "Los rubros y especialidades son por dónde te encuentran cuando buscan lo que hacés.",
        "Tus productos y servicios aparecen con su foto: los que no tienen quedan opacos al lado.",
      ],
    },
    cta: { href: "/perfil/datos", label: "Revisar mi ficha" },
    fecha: NOVEDAD_PUBLICADA_EL.perfil_directorio,
  },

  usuarios_empresa: {
    id: "usuarios_empresa",
    titulo: "Ya podés sumar a tu equipo",
    resumen:
      "Compras, Mantenimiento, RRHH, Logística… cada persona de tu empresa puede tener su propio usuario, con su email y su contraseña.",
    // De las dos versiones que convivían en el modal (una para una columna y
    // otra para dos) queda la larga: es la que se entiende sola fuera del
    // cartel, que es justo lo que necesita el feed del panel.
    cambios: [
      {
        icono: KeyRound,
        titulo: "Vos les creás el acceso",
        texto: "Les creás el acceso y te queda listo para copiar y mandar por WhatsApp.",
      },
      {
        icono: Users,
        titulo: "Sin permisos que configurar",
        texto: "Ven y editan lo mismo que vos: no hay permisos que configurar.",
      },
      {
        icono: UserX,
        titulo: "Se dan de baja",
        texto: "Cuando alguien se va de la empresa, lo desactivás y deja de entrar.",
      },
    ],
    aviso: {
      tono: "verde",
      titulo: "También arreglamos lo que nos reportaron",
      items: [
        "Guardar los datos de tu ficha ya funciona: se terminó el cartel de “problema de sincronización temporal”.",
        "El logo se sube y queda guardado. Antes se cargaba pero se perdía al guardar.",
        "Si sos socia de la UIAB ya no se te pide pagar la suscripción: tu acceso es sin cargo.",
      ],
      pie: "Gracias por avisarnos. Si ves algo raro, escribinos desde Contacto.",
    },
    cta: { href: "/perfil/usuarios", label: "Configurar mis usuarios" },
    fecha: NOVEDAD_PUBLICADA_EL.usuarios_empresa,
  },
};

/** Fecha larga para el feed: `"14 de agosto de 2026"`. */
export function fechaNovedadLegible(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
