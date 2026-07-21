"use server";

import { createClient } from "@/lib/supabase/servidor";
import { CODIGO_OTRA } from "@/modulos/certificaciones/normas";

/**
 * Server actions de certificaciones del socio. Usan el cliente SSR (RLS real,
 * rol `authenticated`), NO el service_role: la escritura queda gobernada por las
 * policies `certificaciones_*` (dueño/gestor de la entidad) y el trigger impide
 * auto-verificarse. El archivo del certificado lo sube el browser directo a
 * Storage (mismas policies que /perfil/documentos); acá sólo se persisten los
 * metadatos.
 */

export interface CertificacionPayload {
  codigo_norma: string;
  nombre_libre?: string | null;
  alcance?: string | null;
  organismo_certificador?: string | null;
  numero_certificado?: string | null;
  fecha_emision?: string | null; // "YYYY-MM-DD"
  fecha_vencimiento?: string | null;
  bucket?: string | null;
  ruta_archivo?: string | null;
  nombre_archivo?: string | null;
  mime_type?: string | null;
  tamano_bytes?: number | null;
}

export interface CertificacionFila extends CertificacionPayload {
  id: string;
  verificada: boolean;
  verificada_en: string | null;
  creado_en: string;
}

type Rol = "company" | "provider";

const COLUMNAS =
  "id, codigo_norma, nombre_libre, alcance, organismo_certificador, numero_certificado, fecha_emision, fecha_vencimiento, bucket, ruta_archivo, nombre_archivo, mime_type, tamano_bytes, verificada, verificada_en, creado_en";

function claveEntidad(role: Rol): "empresa_id" | "proveedor_id" {
  return role === "company" ? "empresa_id" : "proveedor_id";
}

/** Deja sólo los campos persistibles y normaliza "" → null. */
function limpiarPayload(payload: CertificacionPayload): CertificacionPayload {
  const p: CertificacionPayload = { ...payload };
  // Nombre libre sólo tiene sentido para "otra".
  if (p.codigo_norma !== CODIGO_OTRA) p.nombre_libre = null;
  for (const key of Object.keys(p) as (keyof CertificacionPayload)[]) {
    if (p[key] === "") (p[key] as unknown) = null;
  }
  return p;
}

export async function listarCertificaciones(
  role: Rol,
  entityId: string
): Promise<CertificacionFila[]> {
  if (!entityId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificaciones")
    .select(COLUMNAS)
    .eq(claveEntidad(role), entityId)
    .order("verificada", { ascending: false })
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("[certificaciones/listar]", error.message);
    return [];
  }
  return (data ?? []) as CertificacionFila[];
}

export async function guardarCertificacion(
  role: Rol,
  entityId: string,
  payload: CertificacionPayload,
  id?: string | null
): Promise<{ success: true; id: string } | { error: string }> {
  if (!entityId) return { error: "No encontramos tu empresa. Guardá primero tus datos en Datos y Contacto." };
  if (!payload.codigo_norma) return { error: "Elegí la norma o certificación." };
  if (payload.codigo_norma === CODIGO_OTRA && !(payload.nombre_libre || "").trim()) {
    return { error: "Escribí el nombre de la certificación." };
  }

  const supabase = await createClient();
  const datos = limpiarPayload(payload);

  if (id) {
    // Nunca se tocan verificada/verificada_en desde acá (RLS + trigger lo blindan).
    const { data, error } = await supabase
      .from("certificaciones")
      .update(datos)
      .eq("id", id)
      .eq(claveEntidad(role), entityId)
      .select("id")
      .single();
    if (error) return { error: traducirError(error.message) };
    return { success: true, id: data.id };
  }

  const { data, error } = await supabase
    .from("certificaciones")
    .insert({ ...datos, [claveEntidad(role)]: entityId })
    .select("id")
    .single();
  if (error) return { error: traducirError(error.message) };
  return { success: true, id: data.id };
}

export async function eliminarCertificacion(
  id: string
): Promise<{ success: true } | { error: string }> {
  if (!id) return { error: "Falta el identificador de la certificación." };
  const supabase = await createClient();

  // Traer el archivo asociado para borrarlo de Storage (best-effort).
  const { data: fila } = await supabase
    .from("certificaciones")
    .select("bucket, ruta_archivo")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("certificaciones").delete().eq("id", id);
  if (error) return { error: traducirError(error.message) };

  if (fila?.bucket && fila?.ruta_archivo) {
    const { error: storageError } = await supabase.storage
      .from(fila.bucket)
      .remove([fila.ruta_archivo]);
    if (storageError) {
      // La fila ya se borró; el archivo huérfano no rompe nada.
      console.error("[certificaciones/eliminar] archivo:", storageError.message);
    }
  }
  return { success: true };
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("duplicate key") || m.includes("unique")) {
    return "Ya cargaste esa norma. Editala en vez de crear una nueva.";
  }
  if (m.includes("row-level security") || m.includes("permission")) {
    return "No tenés permisos para modificar las certificaciones de esta empresa.";
  }
  return `No pudimos guardar la certificación: ${msg}`;
}
