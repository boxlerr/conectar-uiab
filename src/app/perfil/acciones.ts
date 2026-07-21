"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { crearSlug } from "@/lib/utilidades";
import { createClient as createServerClient } from "@/lib/supabase/servidor";
import {
  limpiarNombreEtiqueta,
  slugEtiqueta,
  validarEtiquetaLibre,
  MAX_ETIQUETAS_LIBRES,
  MAX_ETIQUETAS_LIBRES_POR_DIA,
} from "@/modulos/compartido/etiquetas";

// Server Action strictly bypassing RLS (if needed) for Profile Syncing using the Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseSupabaseError(msg: string | undefined | null): string {
  if (!msg) return "Ocurrió un error desconocido al comunicarse con el servidor.";
  const lowerMsg = msg.toLowerCase();
  
  if (lowerMsg.includes("not-null constraint") || lowerMsg.includes("null value")) {
    return "Parece que olvidaste completar un campo fundamental del perfil. Revisa tus datos.";
  }
  if (lowerMsg.includes("duplicate key") || lowerMsg.includes("unique constraint")) {
    return `Uno de los datos que ingresaste (como tu Razón Social o CUIT) ya está registrado en el sistema. Detalles: ${msg}`;
  }
  if (lowerMsg.includes("schema cache") || lowerMsg.includes("column")) {
    return "El sistema está experimentando ajustes y hubo un problema de sincronización temporal. Intenta de nuevo en unos minutos.";
  }
  if (lowerMsg.includes("check constraint")) {
    return "Alguno de los formatos ingresados no es válido.";
  }
  return `Ocurrió un problema: ${msg}`;
}

export async function updateCompanyOrProvider(
  entityType: "company" | "provider",
  entityId: string | null | undefined,
  profileId: string,
  data: any
) {
  if (!entityType || !profileId) {
    return { error: "Identidad perdida o sesión expirada. Intenta iniciar sesión nuevamente." };
  }

  const table = entityType === "company" ? "empresas" : "proveedores";
  
  // Clean arbitrary UI states. Convert empty strings to null for optional database fields
  const safeData = { ...data };
  for (const key in safeData) {
    if (safeData[key] === "") {
      safeData[key] = null;
    }
  }

  try {
    if (!entityId) {
    // CREATE MODE - For users without an entity link
    const { data: newRow, error: insertError } = await supabaseAdmin
      .from(table)
      .insert(safeData)
      .select()
      .single();

    if (insertError || !newRow?.id) {
      console.error(`[Admin Insert Error]:`, insertError?.message);
      return { error: parseSupabaseError(insertError?.message) };
    }

    // Link member
    const memberTable = entityType === "company" ? "miembros_empresa" : "miembros_proveedor";
    const memberRefKey = entityType === "company" ? "empresa_id" : "proveedor_id";
    
    const { error: memberError } = await supabaseAdmin.from(memberTable).insert({
       [memberRefKey]: newRow.id,
       perfil_id: profileId,
       rol: 'gestor',
       es_principal: true
    });

    if (memberError) {
      console.error(`[Admin Member Insert Error]:`, memberError.message);
      return { error: parseSupabaseError(memberError.message) };
    }

    return { success: true, newEntityId: newRow.id };

  } else {
    // UPDATE MODE
    const { error } = await supabaseAdmin
      .from(table)
      .update(safeData)
      .eq('id', entityId);

    if (error) {
      console.error(`[Admin Update Error]:`, error.message);
      return { error: parseSupabaseError(error.message) };
    }

    return { success: true };
  }
  } catch (err: any) {
    console.error(`[Admin Action Catch Error]:`, err);
    return { error: parseSupabaseError(err?.message) };
  }
}

// ─── Etiquetas ───────────────────────────────────────────────────────────────

type EntidadDelUsuario = {
  perfilId: string;
  tipo: "company" | "provider";
  entityId: string;
};

/**
 * Resuelve, **desde la sesión del servidor**, a qué empresa o prestador
 * pertenece el usuario logueado. Nunca confiar en el `entityId` que manda el
 * cliente: estas actions escriben con service role, o sea que saltean RLS.
 */
async function resolverEntidadDelUsuario(): Promise<
  { error: string } | EntidadDelUsuario
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Se venció tu sesión. Volvé a iniciar sesión." };
  }

  // Se resuelve por rol_sistema igual que el contexto de autenticación, para que
  // el tipo coincida con el que manda el cliente.
  const { data: perfil } = await supabaseAdmin
    .from("perfiles")
    .select("rol_sistema")
    .eq("id", user.id)
    .maybeSingle();

  const rol = perfil?.rol_sistema as string | undefined;

  if (rol === "company") {
    const { data: empresa } = await supabaseAdmin
      .from("miembros_empresa")
      .select("empresa_id")
      .eq("perfil_id", user.id)
      .limit(1)
      .maybeSingle();

    if (empresa?.empresa_id) {
      return { perfilId: user.id, tipo: "company", entityId: empresa.empresa_id };
    }
  }

  if (rol === "provider") {
    const { data: proveedor } = await supabaseAdmin
      .from("miembros_proveedor")
      .select("proveedor_id")
      .eq("perfil_id", user.id)
      .limit(1)
      .maybeSingle();

    if (proveedor?.proveedor_id) {
      return { perfilId: user.id, tipo: "provider", entityId: proveedor.proveedor_id };
    }
  }

  return {
    error:
      "Todavía no tenés tu ficha creada. Completá tus datos en «Datos y Contacto» y volvé.",
  };
}

export async function saveTags(
  entityType: "company" | "provider",
  entityId: string,
  tagIds: string[]
) {
  if (!entityId || !entityType) {
    return { error: "Missing identity" };
  }

  // La firma se mantiene por compatibilidad, pero la identidad se valida contra
  // la sesión: sin esto cualquier logueado puede reescribir las etiquetas de
  // otra socia mandando su entityId.
  const entidad = await resolverEntidadDelUsuario();
  if ("error" in entidad) return { error: entidad.error };
  if (entidad.entityId !== entityId || entidad.tipo !== entityType) {
    return { error: "No tenés permiso para editar esta ficha." };
  }

  const isCompany = entityType === "company";
  const relationTable = isCompany ? "empresas_tags" : "proveedores_tags";
  const relationKey = isCompany ? "empresa_id" : "proveedor_id";

  // Guardado diferencial. El borrar-todo-e-insertar-todo anterior disparaba el
  // trigger `tr_on_candidate_change` (FOR EACH ROW) una vez por fila, y cada
  // disparo recalcula los matches de todas las oportunidades abiertas.
  const { data: actuales, error: readError } = await supabaseAdmin
    .from(relationTable)
    .select("tag_id")
    .eq(relationKey, entityId);

  if (readError) {
    console.error(`[Tag Save Error]:`, readError.message);
    return { error: parseSupabaseError(readError.message) };
  }

  const previos = new Set((actuales ?? []).map((r) => r.tag_id as string));
  const nuevos = new Set(tagIds);
  const aBorrar = [...previos].filter((id) => !nuevos.has(id));
  const aInsertar = [...nuevos].filter((id) => !previos.has(id));

  if (aBorrar.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from(relationTable)
      .delete()
      .eq(relationKey, entityId)
      .in("tag_id", aBorrar);

    if (deleteError) {
      console.error(`[Tag Save Error]:`, deleteError.message);
      return { error: parseSupabaseError(deleteError.message) };
    }
  }

  if (aInsertar.length > 0) {
    const payload = aInsertar.map((tag_id) => ({
      [relationKey]: entityId,
      tag_id,
      peso: 1,
      origen: "manual" as const,
    }));

    const { error: insertError } = await supabaseAdmin
      .from(relationTable)
      .insert(payload);

    if (insertError) {
      console.error(`[Tag Save Error]:`, insertError.message);
      return { error: parseSupabaseError(insertError.message) };
    }
  }

  return { success: true };
}

export type TagCreada = {
  id: string;
  nombre: string;
  tipo_tag: string;
  administrado_por_admin: boolean;
};

export type ResultadoEtiquetaLibre =
  | { error: string }
  | { success: true; tag: TagCreada; reutilizada: boolean };

/**
 * Crea (o reutiliza) una etiqueta escrita por el socio.
 *
 * No escribe el pivote: devuelve la etiqueta y la UI la suma a la selección.
 * La relación se persiste recién cuando el socio aprieta «Guardar Etiquetas»
 * (`saveTags`), así queda un solo camino de escritura de los pivotes.
 */
export async function crearEtiquetaLibre(
  texto: string
): Promise<ResultadoEtiquetaLibre> {
  const entidad = await resolverEntidadDelUsuario();
  if ("error" in entidad) return { error: entidad.error };

  const errorValidacion = validarEtiquetaLibre(texto ?? "");
  if (errorValidacion) return { error: errorValidacion };

  const nombre = limpiarNombreEtiqueta(texto);
  const slug = slugEtiqueta(nombre);

  const esEmpresa = entidad.tipo === "company";
  const columnaAutor = esEmpresa ? "creado_por_empresa" : "creado_por_proveedor";

  // ── Dedupe contra todo el catálogo (137 filas: traerlo entero sale más
  // barato que confiar en un .eq("slug"), y cubre los slugs históricos que
  // no salen de slugEtiqueta, tipo "24/7" guardado como "24-7").
  const buscarExistente = async (): Promise<TagCreada | null> => {
    const [{ data: tags }, { data: alias }] = await Promise.all([
      supabaseAdmin
        .from("tags")
        .select("id, nombre, slug, tipo_tag, administrado_por_admin"),
      supabaseAdmin.from("alias_tags").select("tag_id, alias"),
    ]);

    const candidatas = (tags ?? []) as (TagCreada & { slug: string })[];
    const match = candidatas.find(
      (t) =>
        t.slug === slug ||
        slugEtiqueta(t.slug) === slug ||
        slugEtiqueta(t.nombre) === slug
    );
    if (match) return match;

    const aliasMatch = (alias ?? []).find(
      (a) => slugEtiqueta(a.alias as string) === slug
    );
    if (aliasMatch) {
      return (
        candidatas.find((t) => t.id === aliasMatch.tag_id) ?? null
      );
    }
    return null;
  };

  const existente = await buscarExistente();
  if (existente) {
    return { success: true, tag: existente, reutilizada: true };
  }

  // ── Cupos (sólo se chequean si de verdad vamos a crear una fila nueva)
  const pivote = esEmpresa ? "empresas_tags" : "proveedores_tags";
  const claveEntidad = esEmpresa ? "empresa_id" : "proveedor_id";

  const { count: propiasEnUso } = await supabaseAdmin
    .from(pivote)
    .select("tag_id, tags!inner(administrado_por_admin)", {
      count: "exact",
      head: true,
    })
    .eq(claveEntidad, entidad.entityId)
    .eq("tags.administrado_por_admin", false);

  if ((propiasEnUso ?? 0) >= MAX_ETIQUETAS_LIBRES) {
    return {
      error: `Llegaste al máximo de ${MAX_ETIQUETAS_LIBRES} etiquetas propias. Sacá alguna antes de agregar otra.`,
    };
  }

  const hace24hs = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: creadasHoy } = await supabaseAdmin
    .from("tags")
    .select("id", { count: "exact", head: true })
    .eq(columnaAutor, entidad.entityId)
    .gte("creado_en", hace24hs);

  if ((creadasHoy ?? 0) >= MAX_ETIQUETAS_LIBRES_POR_DIA) {
    return {
      error:
        "Creaste varias etiquetas nuevas hoy. Probá de nuevo mañana o escribinos si necesitás más.",
    };
  }

  const { data: creada, error: insertError } = await supabaseAdmin
    .from("tags")
    .insert({
      nombre,
      slug,
      tipo_tag: "general",
      activo: true,
      administrado_por_admin: false,
      creado_por: entidad.perfilId,
      [columnaAutor]: entidad.entityId,
    })
    .select("id, nombre, tipo_tag, administrado_por_admin")
    .single();

  if (insertError) {
    // 23505: dos socios escribieron lo mismo a la vez, o el nombre choca con
    // una fila que el slug no unificaba. Se resuelve reutilizando la que ganó.
    if (insertError.code === "23505") {
      const ganadora = await buscarExistente();
      if (ganadora) return { success: true, tag: ganadora, reutilizada: true };
    }
    console.error("[crearEtiquetaLibre]", insertError.message);
    return {
      error: "No pudimos guardar la etiqueta. Probá de nuevo en un momento.",
    };
  }

  revalidatePath("/admin/etiquetas");
  return { success: true, tag: creada as TagCreada, reutilizada: false };
}

export async function saveCategories(
  entityType: "company" | "provider",
  entityId: string,
  categoryIds: string[]
) {
  if (!entityId || !entityType) {
    return { error: "Missing identity" };
  }

  const isCompany = entityType === "company";
  const relationTable = isCompany ? "empresas_categorias" : "proveedores_categorias";
  const relationKey = isCompany ? "empresa_id" : "proveedor_id";

  // First, wipe existing relationships to avoid duplicates and handle deletions
  await supabaseAdmin
    .from(relationTable)
    .delete()
    .eq(relationKey, entityId);

  if (categoryIds.length > 0) {
    // Generate new payload for massive insertion
    const payload = categoryIds.map((catId) => ({
      [relationKey]: entityId,
      categoria_id: catId,
    }));

    const { error: insertError } = await supabaseAdmin
      .from(relationTable)
      .insert(payload);

    if (insertError) {
      console.error(`[Category Save Error]:`, insertError.message);
      return { error: insertError.message };
    }
  }

  return { success: true };
}
