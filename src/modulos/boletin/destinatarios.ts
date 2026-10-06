import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  A QUIÉN LE LLEGA EL AVISO DEL BOLETÍN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A las dos casillas de cada ficha aprobada: `email` (la institucional, la que
 * la empresa ya publica en el directorio) y `email_referente` (la persona de
 * contacto). Decisión de Juli el 2026-09-22 — el aviso tiene que llegarle a
 * alguien que lo lea, y la casilla general de una PyME industrial suele ser un
 * buzón que mira una sola persona cada tanto.
 *
 * SÓLO `aprobada`. Los otros estados existen y ninguno tiene que recibir correo:
 * `pendiente_revision` todavía no es socia, `rechazada` no lo va a ser, y
 * `pausada` / `oculta` son fichas que la UIAB sacó de circulación a propósito.
 * Hoy la base tiene 59 aprobadas y 4 rechazadas, pero esto no se apoya en eso:
 * el filtro es explícito, así que el día que alguien pause una ficha deja de
 * recibir sola.
 *
 * DOS COSAS QUE PARECEN DETALLE Y NO LO SON:
 *
 * 1. Se DEDUPLICA por dirección, en minúsculas. Hay seis dominios con dos
 *    fichas (`plaquimet.com`, `genrod.com.ar`, …) y varias donde `email` y
 *    `email_referente` son la misma casilla. Sin deduplicar, esa gente recibe
 *    la misma nota dos veces y el aviso pasa a parecer spam.
 *
 * 2. Se VALIDA el formato. Una dirección rota en la base hace que `sendMail`
 *    tire, y como la tanda es secuencial, una sola fila mal cargada cortaría el
 *    aviso para todas las que venían después. Hoy las 103 están bien formadas;
 *    el filtro está para el día que alguien cargue "juan @ empresa" a mano.
 */

/**
 * Formato mínimo: algo, arroba, algo, punto, TLD. No pretende ser RFC 5322
 * —eso no lo hace bien ningún regex— sino descartar lo que el SMTP va a
 * rechazar: espacios, comas (dos direcciones en un campo), arrobas de más.
 */
const FORMATO_EMAIL = /^[^@\s,;]+@[^@\s,;]+\.[A-Za-z]{2,}$/;

export type DestinatariosBoletin = {
  /** Direcciones únicas, en minúsculas, listas para mandar. */
  emails: string[];
  /** Cuántas fichas aprobadas se miraron. */
  empresas: number;
  /** Fichas aprobadas sin ninguna casilla cargada: no les llega nada. */
  sinEmail: string[];
};

/**
 * Las casillas a las que va el aviso del boletín.
 *
 * Recibe el cliente ya armado en vez de crearlo: quien llama está en un server
 * action y ya tiene uno con `service_role` (hace falta — `empresas` tiene RLS y
 * un admin no necesariamente puede leer el email de todas las fichas).
 */
export async function destinatariosDelBoletin(
  db: SupabaseClient
): Promise<DestinatariosBoletin> {
  const { data, error } = await db
    .from("empresas")
    .select("razon_social, email, email_referente")
    .eq("estado", "aprobada");

  if (error) throw new Error(`No se pudo leer el padrón de socias: ${error.message}`);

  const filas = data ?? [];
  // Map y no Set: guarda la forma en que entró la primera vez por si algún día
  // hay que mostrar a quién se le mandó, sin perder el criterio de unicidad
  // (que es siempre la versión en minúsculas).
  const unicas = new Map<string, string>();
  const sinEmail: string[] = [];

  for (const fila of filas) {
    const casillas = [fila.email, fila.email_referente]
      .map((v) => (v ?? "").trim())
      .filter((v) => v && FORMATO_EMAIL.test(v));

    if (casillas.length === 0) {
      sinEmail.push(fila.razon_social ?? "(sin razón social)");
      continue;
    }

    for (const casilla of casillas) {
      const clave = casilla.toLowerCase();
      if (!unicas.has(clave)) unicas.set(clave, clave);
    }
  }

  return {
    emails: [...unicas.values()],
    empresas: filas.length,
    sinEmail,
  };
}
