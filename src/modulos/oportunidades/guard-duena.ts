import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverEntidadDePerfil } from "@/modulos/autenticacion/entidad-del-perfil";

export interface OportunidadPropia {
  id: string;
  titulo: string;
  estado: string;
  empresa_solicitante_id: string | null;
  proveedor_solicitante_id: string | null;
  categoria_id: string;
  localidad: string;
  descripcion: string;
  cantidad: number | null;
  unidad: string | null;
  fecha_necesidad: string | null;
  visibilidad: string;
  tipo_requerimiento: string[] | null;
}

/**
 * Guard compartido de las acciones del dueño (adjuntos, cerrar, eliminar,
 * duplicar, editar, invitar): resuelve la sesión, la ficha real del perfil
 * (membresía, no `rol_sistema` — ver entidad-del-perfil.ts) y devuelve la
 * oportunidad SOLO si la publicó esa ficha.
 *
 * Un Server Action es un POST público (memoria: 19 acciones de admin corrían
 * sin guard) — ninguna acción del dueño puede confiar en que la UI ya ocultó
 * el botón.
 */
export async function oportunidadSiEsPropia(
  oportunidadId: string
): Promise<{ op: OportunidadPropia } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  const entidad = await resolverEntidadDePerfil(supabase, user.id);
  if (!entidad) return { error: "No estás asociado a una empresa o particular válido." };

  const admin = createAdminClient();
  const { data: op, error } = await admin
    .from("oportunidades")
    .select(
      "id, titulo, estado, empresa_solicitante_id, proveedor_solicitante_id, categoria_id, localidad, descripcion, cantidad, unidad, fecha_necesidad, visibilidad, tipo_requerimiento"
    )
    .eq("id", oportunidadId)
    .maybeSingle();

  if (error || !op) return { error: "No se encontró la oportunidad." };

  const esDuena =
    (entidad.tipo === "company" && op.empresa_solicitante_id === entidad.id) ||
    (entidad.tipo === "provider" && op.proveedor_solicitante_id === entidad.id);

  if (!esDuena) return { error: "Esta oportunidad no es de tu ficha." };

  return { op: op as OportunidadPropia };
}
