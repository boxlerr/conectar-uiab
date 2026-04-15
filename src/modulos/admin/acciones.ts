"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NivelTarifa } from "@/tipos";
import { crearSlug } from "@/lib/utilidades";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Empresas ────────────────────────────────────────────────────────────────

export async function aprobarEmpresa(empresaId: string) {
  const { error } = await adminClient()
    .from("empresas")
    .update({ estado: "aprobada", aprobada_en: new Date().toISOString() })
    .eq("id", empresaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarEmpresa(empresaId: string, motivo: string) {
  const { error } = await adminClient()
    .from("empresas")
    .update({ estado: "rechazada", motivo_rechazo: motivo })
    .eq("id", empresaId);
  if (error) return { error: error.message };
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
  return { success: true };
}

// ─── Proveedores ─────────────────────────────────────────────────────────────

export async function aprobarProveedor(proveedorId: string) {
  const { error } = await adminClient()
    .from("proveedores")
    .update({ estado: "aprobado", aprobado_en: new Date().toISOString() })
    .eq("id", proveedorId);
  if (error) return { error: error.message };
  revalidatePath("/admin/proveedores");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarProveedor(proveedorId: string, motivo: string) {
  const { error } = await adminClient()
    .from("proveedores")
    .update({ estado: "rechazado", motivo_rechazo: motivo })
    .eq("id", proveedorId);
  if (error) return { error: error.message };
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
