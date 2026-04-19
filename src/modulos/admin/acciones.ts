"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NivelTarifa } from "@/tipos";
import { crearSlug } from "@/lib/utilidades";
import { appUrl, enviarEmail } from "@/lib/email/cliente";
import { plantillaAprobacion, plantillaRechazo } from "@/lib/email/plantillas";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Empresas ────────────────────────────────────────────────────────────────

/**
 * Envuelve la notificación por email para que nunca rompa el flujo del
 * server action. Si Resend falla o no hay API key, se loguea y se sigue.
 */
async function notificarAprobacion(
  tipo: "empresa" | "particular",
  destinatario: string | null | undefined,
  nombre: string
) {
  if (!destinatario) return;
  const plantilla = plantillaAprobacion({
    tipo,
    nombre,
    urlBienvenida: `${appUrl()}/bienvenido`,
  });
  await enviarEmail({
    para: destinatario,
    asunto: plantilla.asunto,
    html: plantilla.html,
    texto: plantilla.texto,
  });
}

async function notificarRechazo(
  tipo: "empresa" | "particular",
  destinatario: string | null | undefined,
  nombre: string,
  motivo: string
) {
  if (!destinatario) return;
  const plantilla = plantillaRechazo({
    tipo,
    nombre,
    motivo,
    urlContacto: `${appUrl()}/contacto`,
  });
  await enviarEmail({
    para: destinatario,
    asunto: plantilla.asunto,
    html: plantilla.html,
    texto: plantilla.texto,
  });
}

export async function aprobarEmpresa(empresaId: string) {
  const db = adminClient();
  const { data: empresa, error } = await db
    .from("empresas")
    .update({ estado: "aprobada", aprobada_en: new Date().toISOString() })
    .eq("id", empresaId)
    .select("email, razon_social, nombre_comercial")
    .single();
  if (error) return { error: error.message };

  await notificarAprobacion(
    "empresa",
    empresa?.email,
    empresa?.nombre_comercial || empresa?.razon_social || "Empresa"
  );

  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarEmpresa(empresaId: string, motivo: string) {
  const db = adminClient();
  const { data: empresa, error } = await db
    .from("empresas")
    .update({ estado: "rechazada", motivo_rechazo: motivo })
    .eq("id", empresaId)
    .select("email, razon_social, nombre_comercial")
    .single();
  if (error) return { error: error.message };

  await notificarRechazo(
    "empresa",
    empresa?.email,
    empresa?.nombre_comercial || empresa?.razon_social || "Empresa",
    motivo
  );

  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
  return { success: true };
}

export async function asignarTarifa(empresaId: string, tarifa: NivelTarifa) {
  const { error } = await adminClient()
    .from("empresas")
    .update({ tarifa })
    .eq("id", empresaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/suscripciones");
  return { success: true };
}

export async function actualizarPrecioTarifa(nivel: 1 | 2 | 3, precioMensual: number, vigenteHasta?: string | null) {
  if (!Number.isFinite(precioMensual) || precioMensual <= 0) {
    return { error: "Precio inválido" };
  }
  const update: Record<string, unknown> = {
    precio_mensual: precioMensual,
    actualizado_en: new Date().toISOString(),
  };
  if (vigenteHasta !== undefined) update.vigente_hasta = vigenteHasta;

  const { error } = await adminClient()
    .from("tarifas_precios")
    .update(update)
    .eq("nivel", nivel);
  if (error) return { error: error.message };
  revalidatePath("/admin/suscripciones");
  revalidatePath("/admin");
  revalidatePath("/perfil/suscripcion");
  return { success: true };
}

export async function actualizarCantidadEmpleados(empresaId: string, cantidad: number | null) {
  const { error } = await adminClient()
    .from("empresas")
    .update({ cantidad_empleados: cantidad })
    .eq("id", empresaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/suscripciones");
  return { success: true };
}

// ─── Proveedores ─────────────────────────────────────────────────────────────

export async function aprobarProveedor(proveedorId: string) {
  const db = adminClient();
  const { data: prov, error } = await db
    .from("proveedores")
    .update({ estado: "aprobado", aprobado_en: new Date().toISOString() })
    .eq("id", proveedorId)
    .select("email, nombre, apellido, nombre_comercial, razon_social")
    .single();
  if (error) return { error: error.message };

  const nombre =
    prov?.nombre_comercial ||
    [prov?.nombre, prov?.apellido].filter(Boolean).join(" ") ||
    prov?.razon_social ||
    "Particular";
  await notificarAprobacion("particular", prov?.email, nombre);

  revalidatePath("/admin/proveedores");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarProveedor(proveedorId: string, motivo: string) {
  const db = adminClient();
  const { data: prov, error } = await db
    .from("proveedores")
    .update({ estado: "rechazado", motivo_rechazo: motivo })
    .eq("id", proveedorId)
    .select("email, nombre, apellido, nombre_comercial, razon_social")
    .single();
  if (error) return { error: error.message };

  const nombre =
    prov?.nombre_comercial ||
    [prov?.nombre, prov?.apellido].filter(Boolean).join(" ") ||
    prov?.razon_social ||
    "Particular";
  await notificarRechazo("particular", prov?.email, nombre, motivo);

  revalidatePath("/admin/proveedores");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Reseñas ─────────────────────────────────────────────────────────────────

export async function aprobarResena(resenaId: string) {
  const { error } = await adminClient()
    .from("resenas")
    .update({ estado: "aprobada", moderada_en: new Date().toISOString() })
    .eq("id", resenaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/resenas");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarResena(resenaId: string, motivo: string) {
  const { error } = await adminClient()
    .from("resenas")
    .update({ estado: "rechazada", motivo_moderacion: motivo, moderada_en: new Date().toISOString() })
    .eq("id", resenaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/resenas");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Oportunidades ────────────────────────────────────────────────────────────

export async function cerrarOportunidad(oportunidadId: string) {
  const { error } = await adminClient()
    .from("oportunidades")
    .update({ estado: "cerrada" })
    .eq("id", oportunidadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/oportunidades");
  return { success: true };
}

export async function eliminarOportunidad(oportunidadId: string) {
  const { error } = await adminClient()
    .from("oportunidades")
    .delete()
    .eq("id", oportunidadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/oportunidades");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Usuarios / Perfiles ──────────────────────────────────────────────────────

export async function toggleActivarUsuario(perfilId: string, activar: boolean) {
  const { error } = await adminClient()
    .from("perfiles")
    .update({ activo: activar })
    .eq("id", perfilId);
  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function cambiarRolUsuario(perfilId: string, nuevoRol: string) {
  const rolesPermitidos = ["admin", "company", "provider"];
  if (!rolesPermitidos.includes(nuevoRol)) return { error: "Rol no válido" };

  const { error } = await adminClient()
    .from("perfiles")
    .update({ rol_sistema: nuevoRol })
    .eq("id", perfilId);
  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { success: true };
}

// ─── Servicios (Categorías) ──────────────────────────────────────────────────

export async function crearCategoria(nombre: string, descripcion: string) {
  const slug = crearSlug(nombre);
  const { error } = await adminClient()
    .from("categorias")
    .insert({ nombre, slug, descripcion, activa: true });
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  return { success: true };
}

export async function editarCategoria(id: string, nombre: string, descripcion: string) {
  const slug = crearSlug(nombre);
  const { error } = await adminClient()
    .from("categorias")
    .update({ nombre, slug, descripcion })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  return { success: true };
}

export async function toggleActivarCategoria(id: string, activa: boolean) {
  const { error } = await adminClient()
    .from("categorias")
    .update({ activa })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  return { success: true };
}

export async function eliminarCategoria(id: string) {
  const { error } = await adminClient()
    .from("categorias")
    .delete()
    .eq("id", id);
  if (error) {
    // FK violation → sugerir desactivar en lugar de eliminar
    if (error.code === "23503" || /foreign key/i.test(error.message)) {
      return {
        error:
          "No se puede eliminar: hay proveedores o empresas vinculados a este servicio. Desactivalo en su lugar.",
      };
    }
    return { error: error.message };
  }
  revalidatePath("/admin/servicios");
  return { success: true };
}
