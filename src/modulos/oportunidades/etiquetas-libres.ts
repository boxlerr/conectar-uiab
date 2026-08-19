import type { SupabaseClient } from "@supabase/supabase-js";
import { limpiarNombreEtiqueta, slugEtiqueta, validarEtiquetaLibre } from "@/modulos/compartido/etiquetas";

/** Tope de términos libres que aceptamos por publicación. */
export const MAX_NUEVAS_ETIQUETAS = 10;

/**
 * Limpia, valida y deduplica los términos libres que llegan del formulario.
 * Mismo criterio que las etiquetas del perfil.
 */
export function filtrarEtiquetasLibres(terminos: string[]): string[] {
  const nombres: string[] = [];
  const slugsVistos = new Set<string>();
  for (const raw of terminos) {
    const nombre = limpiarNombreEtiqueta(String(raw));
    if (!nombre || validarEtiquetaLibre(nombre) !== null) continue;
    const slug = slugEtiqueta(nombre);
    if (!slug || slugsVistos.has(slug)) continue;
    slugsVistos.add(slug);
    nombres.push(nombre);
    if (nombres.length >= MAX_NUEVAS_ETIQUETAS) break;
  }
  return nombres;
}

/**
 * Términos libres → filas en `tags`, reutilizando por slug si ya existen.
 *
 * Extraído de `crearOportunidad` para que la edición use exactamente la misma
 * lógica. Se hace con service role (saltea RLS, igual que
 * perfil/acciones::crearEtiquetaLibre). Cada término tolera su propio error:
 * la publicación ya está hecha y no queremos abortarla por una etiqueta que no
 * entró — si algo falla, devuelve `aviso` para que la UI lo cuente.
 */
export async function crearEtiquetasLibres(
  admin: SupabaseClient,
  nombres: string[],
  contexto: { userId: string; empresaId: string | null; proveedorId: string | null }
): Promise<{ ids: string[]; aviso?: string }> {
  const ids: string[] = [];
  let aviso: string | undefined;

  for (const nombre of nombres) {
    const slug = slugEtiqueta(nombre);
    try {
      const { data: existente } = await admin
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existente?.id) {
        ids.push(existente.id);
        continue;
      }

      const { data: creada, error: crearError } = await admin
        .from("tags")
        .insert({
          nombre,
          slug,
          tipo_tag: "general",
          activo: true,
          administrado_por_admin: false,
          creado_por: contexto.userId,
          ...(contexto.empresaId ? { creado_por_empresa: contexto.empresaId } : {}),
          ...(contexto.proveedorId ? { creado_por_proveedor: contexto.proveedorId } : {}),
        })
        .select("id")
        .single();

      if (crearError) {
        // 23505: otra request creó el mismo slug entre el SELECT y el INSERT.
        if (crearError.code === "23505") {
          const { data: ganadora } = await admin
            .from("tags")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();
          if (ganadora?.id) {
            ids.push(ganadora.id);
            continue;
          }
        }
        console.error("Error al crear etiqueta libre de oportunidad:", crearError);
        aviso =
          "Se guardó, pero algún término nuevo no se pudo crear como etiqueta.";
        continue;
      }

      if (creada?.id) ids.push(creada.id);
    } catch (err) {
      console.error("Error inesperado al crear etiqueta libre:", err);
      aviso = "Se guardó, pero algún término nuevo no se pudo crear como etiqueta.";
    }
  }

  return { ids, aviso };
}
