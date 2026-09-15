/**
 * El canal de rescate del alta, en un solo lugar.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 *
 * El circuito de alta tiene varios callejones sin salida, y hasta ahora ninguno
 * ofrecía una forma de pedir ayuda. El peor: los tres estados terminales del
 * link de invitación ("no válido", "ya usado", "vencido") le decían a la persona
 * que le pidiera al equipo de la UIAB que se lo reenviara — sin dar un solo dato
 * de contacto — y el único botón era "Ir al login", inútil justamente para
 * alguien que nunca llegó a definir una contraseña. El caso más común que cae
 * ahí es volver a tocar el mismo mail una semana después, que para este público
 * es el comportamiento normal: el mail ES la aplicación.
 *
 * WhatsApp y no un formulario de contacto porque es el canal que esta gente
 * usa todos los días y el que la UIAB efectivamente atiende.
 *
 * Es un módulo puro, sin imports: se puede usar igual desde un Server Component
 * que desde un client component. No meterle "server-only" ni dependencias del
 * servidor — si entra en la cadena de un client component, rompe la hidratación
 * en silencio (Next 16 + Turbopack).
 */

/** El WhatsApp institucional de la UIAB. Mismo número que declara el JSON-LD. */
export const WHATSAPP_UIAB = "5491130622001";

/** Cómo se muestra el número cuando se escribe en pantalla. */
export const WHATSAPP_UIAB_LEGIBLE = "11 3062-2001";

/**
 * Arma el link de WhatsApp con el mensaje ya escrito.
 *
 * El mensaje pre-escrito no es un adorno: le ahorra a la persona tener que
 * explicar desde cero dónde se trabó, y le llega a la UIAB con el contexto
 * suficiente para resolverlo sin otra ida y vuelta.
 *
 * Devuelve siempre un string (a diferencia de `whatsappLink()` de utilidades,
 * que acepta cualquier teléfono y puede devolver null): acá el número es una
 * constante nuestra, así que el resultado sirve directo como href.
 */
export function ayudaWhatsApp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_UIAB}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Los mensajes de cada callejón. Están acá y no repartidos por las pantallas
 * para que se lean todos juntos: si dos dicen lo mismo, se nota.
 */
export const CONSULTAS = {
  /** No sabe si su empresa es socia de la UIAB. */
  esSocia:
    "Hola, quiero saber si mi empresa es socia de la UIAB para entrar a UIAB Conecta.",
  /** Está completando el alta y se trabó. */
  altaTrabada:
    "Hola, estoy completando el alta de mi empresa en UIAB Conecta y me trabé.",
  /** Mandó el formulario hace más de 3 días hábiles y no le llegó el acceso. */
  altaDemorada:
    "Hola, mandé el formulario de alta de mi empresa a UIAB Conecta y todavía no me llegó el mail para entrar.",
  /** El link de invitación no abre o se cortó al copiarlo. */
  linkInvalido:
    "Hola, el enlace para elegir mi contraseña de UIAB Conecta no me funciona. ¿Me mandan uno nuevo?",
  /** El link de invitación venció (duran 30 días). */
  linkVencido:
    "Hola, se me venció el enlace para elegir mi contraseña de UIAB Conecta. ¿Me mandan uno nuevo?",
  /** Está creando la cuenta en /register y se trabó. */
  registroTrabado:
    "Hola, estoy creando la cuenta de mi empresa en UIAB Conecta y me trabé.",
} as const;
