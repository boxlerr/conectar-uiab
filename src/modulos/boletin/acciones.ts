"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient as createClienteSSR } from "@/lib/supabase/servidor";
import { exigirAdmin } from "@/lib/autenticacion/exigir-admin";
import {
  BUCKET_BOLETIN,
  CARPETA_BOLETIN,
  EXTENSION_POR_MIME,
  type DatosComunicado,
  type EstadoComunicado,
} from "./tipos";

/**
 * Server actions del Boletín UIAB.
 *
 * Todo pasa por `service_role` (saltea RLS) y detrás del guard `exigirAdmin`:
 * un Server Action es un endpoint POST invocable a mano, así que la policy de la
 * tabla no alcanza como única defensa. Ver `exigir-admin.ts`.
 *
 * La foto la sube el browser directo a Storage con una URL firmada que arma
 * `prepararSubidaImagen` (mismo patrón que los adjuntos de oportunidades). Acá
 * sólo se guardan/borran `bucket` + `ruta_imagen`.
 */

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Refresca todas las pantallas que muestran comunicados. */
function revalidarBoletin() {
  revalidatePath("/admin/boletin");
  revalidatePath("/boletin");
  revalidatePath("/panel-de-control");
}

/** Recorta y valida lo mínimo del lado del servidor (el form del panel valida lo mismo, pero un action es un POST invocable a mano). */
function limpiar(datos: DatosComunicado) {
  const titulo = datos.titulo?.trim() ?? "";
  const cuerpo = datos.cuerpo?.trim() ?? "";
  if (!titulo) return { error: "El título es obligatorio." as const };
  if (!cuerpo) return { error: "El cuerpo del comunicado es obligatorio." as const };

  // La foto sólo puede vivir en la carpeta del boletín. Sin esto, un POST armado
  // a mano podría apuntar `ruta_imagen` al logo de una empresa, y al cambiar la
  // foto o borrar el comunicado lo borraríamos con service role.
  const ruta = datos.ruta_imagen || null;
  if (ruta && (!ruta.startsWith(`${CARPETA_BOLETIN}/`) || ruta.includes(".."))) {
    return { error: "Ruta de imagen inválida." as const };
  }

  return {
    titulo,
    cuerpo,
    estado: datos.estado === "publicado" ? "publicado" : "borrador",
    fijado: Boolean(datos.fijado),
    bucket: ruta ? BUCKET_BOLETIN : null,
    ruta_imagen: ruta,
  };
}

/**
 * Firma la subida de la foto de un comunicado.
 *
 * El bucket `imagenes-publicas` no tiene policy que deje escribir en `boletin/`
 * desde el browser (las que hay son por ficha: logos, productos). En vez de
 * abrir una, el servidor firma una URL de un solo uso para una ruta que arma él
 * mismo, y el browser sube directo a Storage: el archivo no pasa por el action
 * (el body corta en 4.5 MB en Vercel).
 */
export async function prepararSubidaImagen(mime: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const ext = EXTENSION_POR_MIME[mime];
  if (!ext) return { error: "Formato no válido. Subí una imagen JPG, PNG o WebP." };

  const ruta = `${CARPETA_BOLETIN}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const db = adminClient();
  const { data, error } = await db.storage.from(BUCKET_BOLETIN).createSignedUploadUrl(ruta);
  if (error || !data?.token) {
    console.error("[boletin] no se pudo firmar la subida:", error?.message);
    return { error: "No pudimos preparar la subida. Probá de nuevo en un momento." };
  }

  return { success: true as const, ruta: data.path, token: data.token };
}

/** Borra la foto del bucket, sin romper si falla (la fila ya es lo que manda). */
async function borrarImagen(bucket: string | null, ruta: string | null) {
  if (!bucket || !ruta) return;
  const db = adminClient();
  const { error } = await db.storage.from(bucket).remove([ruta]);
  if (error) console.error("[boletin] no se pudo borrar la imagen:", error.message);
}

export async function crearComunicado(datos: DatosComunicado) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const limpio = limpiar(datos);
  if ("error" in limpio) return limpio;

  // Autor: para auditar quién cargó qué en el panel.
  const ssr = await createClienteSSR();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  const db = adminClient();
  const { error } = await db.from("comunicados").insert({
    titulo: limpio.titulo,
    cuerpo: limpio.cuerpo,
    estado: limpio.estado,
    fijado: limpio.fijado,
    bucket: limpio.bucket,
    ruta_imagen: limpio.ruta_imagen,
    // Si nace publicado, lleva fecha ya; si es borrador, se completa al publicar.
    publicado_en: limpio.estado === "publicado" ? new Date().toISOString() : null,
    creado_por: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidarBoletin();
  return { success: true as const };
}

export async function actualizarComunicado(id: string, datos: DatosComunicado) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const limpio = limpiar(datos);
  if ("error" in limpio) return limpio;

  const db = adminClient();

  // Estado anterior: para saber si hay que estampar publicado_en y para borrar
  // la foto vieja si la cambiaron.
  const { data: previo, error: errorLectura } = await db
    .from("comunicados")
    .select("estado, publicado_en, bucket, ruta_imagen")
    .eq("id", id)
    .single();
  if (errorLectura) return { error: errorLectura.message };

  // publicado_en se estampa la primera vez que pasa a publicado y no se pisa
  // después (re-publicar no cambia la fecha original).
  let publicadoEn = previo?.publicado_en ?? null;
  if (limpio.estado === "publicado" && !publicadoEn) {
    publicadoEn = new Date().toISOString();
  }

  const { error } = await db
    .from("comunicados")
    .update({
      titulo: limpio.titulo,
      cuerpo: limpio.cuerpo,
      estado: limpio.estado,
      fijado: limpio.fijado,
      bucket: limpio.bucket,
      ruta_imagen: limpio.ruta_imagen,
      publicado_en: publicadoEn,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Si cambiaron la foto (o la sacaron), la anterior queda huérfana en Storage.
  const rutaAnterior = previo?.ruta_imagen ?? null;
  if (rutaAnterior && rutaAnterior !== limpio.ruta_imagen) {
    await borrarImagen(previo?.bucket ?? null, rutaAnterior);
  }

  revalidarBoletin();
  return { success: true as const };
}

/** Publicar / despublicar sin abrir el formulario entero. */
export async function cambiarEstadoComunicado(id: string, estado: EstadoComunicado) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();

  const { data: previo, error: errorLectura } = await db
    .from("comunicados")
    .select("publicado_en")
    .eq("id", id)
    .single();
  if (errorLectura) return { error: errorLectura.message };

  const publicadoEn =
    estado === "publicado" && !previo?.publicado_en
      ? new Date().toISOString()
      : (previo?.publicado_en ?? null);

  const { error } = await db
    .from("comunicados")
    .update({ estado, publicado_en: publicadoEn })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidarBoletin();
  return { success: true as const };
}

export async function eliminarComunicado(id: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();

  // Traemos la foto para borrarla del bucket después de borrar la fila.
  const { data: previo } = await db
    .from("comunicados")
    .select("bucket, ruta_imagen")
    .eq("id", id)
    .single();

  const { error } = await db.from("comunicados").delete().eq("id", id);
  if (error) return { error: error.message };

  await borrarImagen(previo?.bucket ?? null, previo?.ruta_imagen ?? null);

  revalidarBoletin();
  return { success: true as const };
}
