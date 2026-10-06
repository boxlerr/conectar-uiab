import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl, enviarTanda } from "@/lib/email/cliente";
import { plantillaBoletinNuevo } from "@/lib/email/plantillas-boletin";
import { destinatariosDelBoletin } from "./destinatarios";
import { cuerpoSinMarcas, fechaLegible, rutaComunicado } from "./formato";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL AVISO DEL BOLETÍN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cuando una nota pasa a `publicado`, le llega un correo a cada socia del
 * padrón. Toda la decisión vive en una sola consulta —la del candado— y toda
 * puerta que publique termina acá.
 *
 * EL CANDADO ES UN UPDATE CONDICIONADO, NO UN `if`.
 *
 * Lo obvio sería leer la fila, preguntar `if (!aviso_enviado_en)` y después
 * mandar. Eso es una carrera: entre la lectura y el envío entra cualquier otra
 * invocación —un doble click en "Publicar", un reintento de Vercel sobre el
 * mismo POST, el compositor y el ojito de la lista tocados casi juntos— y las
 * dos leen `null`, las dos mandan, y 103 empresas reciben la misma nota dos
 * veces. Un correo no se puede deshacer.
 *
 * Por eso el `UPDATE ... WHERE aviso_enviado_en IS NULL ... RETURNING` es a la
 * vez la pregunta y la respuesta: Postgres lo resuelve atómicamente, y el que
 * se lleva la fila es el único que manda. El segundo recibe cero filas y se va
 * en silencio. Es el mismo patrón con el que `conciliacion.ts` evita acreditar
 * dos veces un pago de Sipago.
 *
 * SE SUELTA EL CANDADO SI NO SALIÓ NI UNO. Marcar la nota como avisada cuando
 * en realidad no se mandó nada (SMTP sin configurar en dev, cuota diaria de
 * Gmail agotada, credenciales revocadas) sería una mentira silenciosa: el panel
 * diría "Avisado" y nadie se enteraría de que el correo nunca salió. Si
 * `enviados === 0` se devuelve la fila a su estado anterior y el próximo intento
 * vuelve a probar. Si salió aunque sea uno, el candado QUEDA: reintentar
 * después de un envío parcial le mandaría la nota por segunda vez a todas las
 * que sí la recibieron, que es peor que dejar a unas pocas sin aviso.
 *
 * NUNCA TIRA. Lo llama un `after()` del server action, o sea que corre cuando la
 * respuesta ya se fue: una excepción acá no la ve nadie, sólo ensucia el log de
 * Vercel como error no manejado. Todo se atrapa y se loguea.
 */

/**
 * Cuánto del cuerpo entra en el correo.
 *
 * El correo es un adelanto: lo suficiente para saber si la nota interesa, no
 * tanto como para no tener que abrirla. Cortado en palabra entera.
 */
const LARGO_EXTRACTO = 420;

/** Las columnas que el correo necesita. */
const CAMPOS_AVISO = "id, titulo, bajada, cuerpo, bucket, rutas_imagenes, publicado_en";

type FilaAviso = {
  id: string;
  titulo: string;
  bajada: string | null;
  cuerpo: string;
  bucket: string | null;
  rutas_imagenes: string[] | null;
  publicado_en: string | null;
};

/**
 * El adelanto del cuerpo, sin las marcas `## ` de subtítulo y recortado en
 * palabra entera. `hayMas` dice si quedó texto afuera — es lo que decide si el
 * botón dice "Leer la nota completa" o "Ver la publicación".
 */
export function extractoDeCuerpo(cuerpo: string): { extracto: string; hayMas: boolean } {
  // Los saltos se conservan (la plantilla los pasa a <br/>), pero tres o más
  // seguidos se colapsan: en el correo un hueco de tres renglones parece un error.
  const plano = cuerpoSinMarcas(cuerpo).trim().replace(/\n{3,}/g, "\n\n");
  if (plano.length <= LARGO_EXTRACTO) return { extracto: plano, hayMas: false };

  const cortado = plano.slice(0, LARGO_EXTRACTO).replace(/\s+\S*$/, "");
  return { extracto: cortado, hayMas: true };
}

/**
 * Manda el aviso de una nota si corresponde, y sólo una vez.
 *
 * No devuelve nada útil a propósito: quien llama ya le respondió al admin y no
 * puede hacer nada con el resultado. Lo que queda del envío es la fila
 * (`aviso_enviado_en`, `aviso_destinatarios`) y el log.
 */
export async function dispararAvisoDelBoletin(
  db: SupabaseClient,
  id: string
): Promise<void> {
  try {
    // ── El candado: reclamar la fila. Las cuatro condiciones son la regla
    // entera de "¿hay que avisar?", resuelta en un solo viaje y sin carrera.
    const { data: reclamadas, error: errorCandado } = await db
      .from("comunicados")
      .update({ aviso_enviado_en: new Date().toISOString() })
      .eq("id", id)
      .eq("estado", "publicado")
      .eq("avisar_por_email", true)
      .is("aviso_enviado_en", null)
      .select(CAMPOS_AVISO);

    if (errorCandado) {
      console.error("[boletin/aviso] no se pudo reclamar la nota:", errorCandado.message);
      return;
    }

    const nota = (reclamadas ?? [])[0] as FilaAviso | undefined;
    // Cero filas no es un error: es un borrador, una nota con el aviso
    // destildado, o una que ya se avisó. El caso normal, de hecho.
    if (!nota) return;

    const { emails, empresas, sinEmail } = await destinatariosDelBoletin(db);

    if (emails.length === 0) {
      console.warn("[boletin/aviso] no hay ninguna socia con email: no se manda nada.");
      await soltarCandado(db, id);
      return;
    }
    if (sinEmail.length > 0) {
      console.warn(
        `[boletin/aviso] ${sinEmail.length} de ${empresas} fichas aprobadas no tienen email cargado:`,
        sinEmail
      );
    }

    const { extracto, hayMas } = extractoDeCuerpo(nota.cuerpo);
    const rutaPortada = (nota.rutas_imagenes ?? [])[0] ?? null;
    const imagenUrl =
      nota.bucket && rutaPortada
        ? db.storage.from(nota.bucket).getPublicUrl(rutaPortada).data.publicUrl
        : null;

    const correo = plantillaBoletinNuevo({
      titulo: nota.titulo ?? "",
      bajada: nota.bajada ?? "",
      extracto,
      hayMas,
      url: `${appUrl()}${rutaComunicado({ id: nota.id, titulo: nota.titulo ?? "", cuerpo: nota.cuerpo })}`,
      imagenUrl,
      fecha: fechaLegible(nota.publicado_en) || fechaLegible(new Date().toISOString()),
    });

    const resultado = await enviarTanda({
      destinatarios: emails,
      asunto: correo.asunto,
      html: correo.html,
      texto: correo.texto,
      // Que la socia pueda responder y le llegue a la UIAB, no al buzón del
      // remitente técnico. Es también por dónde pide la baja (lo dice el pie).
      responderA: process.env.UIAB_EMAIL || undefined,
    });

    if (resultado.enviados === 0) {
      console.error(
        `[boletin/aviso] no salió ningún correo de "${correo.asunto}" (skipped=${Boolean(
          resultado.skipped
        )}). Se suelta el candado para poder reintentar.`
      );
      await soltarCandado(db, id);
      return;
    }

    const { error: errorContador } = await db
      .from("comunicados")
      .update({ aviso_destinatarios: resultado.enviados })
      .eq("id", id);
    if (errorContador) {
      // El contador es cosmético: el aviso ya salió y el candado ya está puesto.
      console.error("[boletin/aviso] no se pudo guardar el contador:", errorContador.message);
    }

    console.log(
      `[boletin/aviso] "${correo.asunto}": ${resultado.enviados} enviados, ${resultado.fallidos} fallidos, sobre ${empresas} socias.`
    );
  } catch (e) {
    // Corre dentro de un after(): si esto sube, nadie lo ve.
    console.error("[boletin/aviso] excepción mandando el aviso:", e);
  }
}

/** Devuelve la nota al estado "todavía no se avisó", para que se pueda reintentar. */
async function soltarCandado(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db
    .from("comunicados")
    .update({ aviso_enviado_en: null })
    .eq("id", id);
  if (error) {
    console.error(
      `[boletin/aviso] quedó marcada como avisada sin haber mandado nada (id ${id}): ${error.message}`
    );
  }
}
