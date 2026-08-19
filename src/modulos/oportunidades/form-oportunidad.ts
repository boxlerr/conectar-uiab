/**
 * Parseo compartido del FormData de una oportunidad (crear y editar): si cada
 * action lo parseara por su cuenta, un campo agregado en uno y olvidado en el
 * otro haría que el dato se guarde al publicar y se PIERDA al editar.
 */

/** Valores válidos de `oportunidades.tipo_requerimiento` (text[]) en la base. */
export const TIPOS_REQUERIMIENTO_VALIDOS = [
  "material",
  "servicio",
  "personal",
  "otro",
] as const;

export type TipoRequerimiento = (typeof TIPOS_REQUERIMIENTO_VALIDOS)[number];

export interface CamposOportunidad {
  titulo: string;
  descripcion: string;
  categoria_id: string;
  localidad: string;
  cantidad: number | null;
  unidad: string | null;
  fecha_necesidad: string | null;
  tipoRequerimiento: TipoRequerimiento[];
  tagIds: string[];
  nuevasEtiquetas: string[];
}

export function parsearFormOportunidad(
  formData: FormData
): { campos: CamposOportunidad } | { error: string } {
  const titulo = (formData.get("titulo") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const categoria_id = formData.get("categoria_id") as string;
  const localidad = (formData.get("localidad") as string)?.trim();

  const cantidadRaw = formData.get("cantidad") as string | null;
  const unidad = (formData.get("unidad") as string | null)?.trim() || null;
  const fecha_necesidad = (formData.get("fecha_necesidad") as string | null) || null;

  const cantidad = cantidadRaw && cantidadRaw.length > 0 ? Number(cantidadRaw) : null;
  if (cantidad !== null && (!Number.isFinite(cantidad) || cantidad < 0)) {
    return { error: "La cantidad debe ser un número válido." };
  }

  if (!titulo || !descripcion || !categoria_id || !localidad) {
    return { error: "Por favor completa todos los campos requeridos." };
  }

  const tipoRequerimiento = [
    ...new Set(formData.getAll("tipo_requerimiento").map(String)),
  ].filter((tipo): tipo is TipoRequerimiento =>
    (TIPOS_REQUERIMIENTO_VALIDOS as readonly string[]).includes(tipo)
  );

  return {
    campos: {
      titulo,
      descripcion,
      categoria_id,
      localidad,
      cantidad,
      unidad,
      fecha_necesidad,
      tipoRequerimiento,
      tagIds: formData.getAll("tag_ids").map(String).filter(Boolean),
      nuevasEtiquetas: formData.getAll("nuevas_etiquetas").map(String),
    },
  };
}
