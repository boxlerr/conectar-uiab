/**
 * Qué llenó y qué le falta a la ficha de un particular.
 *
 * Vive afuera del panel porque es la regla de negocio de la pantalla —qué se le
 * pide a un profesional para que su ficha sirva— y porque es lo único de ahí
 * que se puede testear sin montar React.
 */

export type ServicioDeclarado = {
  id: string;
  nombre: string;
  /** false = todavía no está en el catálogo oficial. */
  oficial: boolean;
  activa: boolean;
};

/** Lo mínimo que necesita esta función; la ficha real trae bastante más. */
export type FichaParticular = Record<string, unknown> & {
  servicios: ServicioDeclarado[];
};

export type CampoParticular = {
  clave: string;
  etiqueta: string;
  /** Alternativa que también da el campo por cumplido (teléfono ↔ whatsapp). */
  clave2?: string;
};

export const CAMPOS_PARTICULAR: CampoParticular[] = [
  { clave: "email", etiqueta: "Correo" },
  { clave: "telefono", etiqueta: "Teléfono", clave2: "whatsapp" },
  { clave: "descripcion", etiqueta: "Descripción" },
  { clave: "cuit", etiqueta: "CUIT" },
  { clave: "localidad", etiqueta: "Localidad" },
  { clave: "provincia", etiqueta: "Provincia" },
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "tipo_proveedor", etiqueta: "Tipo" },
  { clave: "ruta_logo", etiqueta: "Logo" },
  { clave: "ruta_portada", etiqueta: "Portada" },
  { clave: "sitio_web", etiqueta: "Sitio web" },
  { clave: "nombre_comercial", etiqueta: "Nombre comercial", clave2: "razon_social" },
  { clave: "fecha_inicio_experiencia", etiqueta: "Experiencia" },
];

export function tieneValor(v: unknown): boolean {
  if (typeof v === "number") return Number.isFinite(v) && v > 0;
  return typeof v === "string" && v.trim() !== "";
}

export type Completitud = {
  cargados: CampoParticular[];
  vacios: CampoParticular[];
  /** Los servicios cuentan como un campo más, y son el que más pesa. */
  conServicios: boolean;
  completos: number;
  total: number;
  pct: number;
};

/**
 * El renglón de servicios entra al total: una ficha sin rubro no aparece en
 * ninguna búsqueda del directorio, así que "100% completa sin servicios" sería
 * una mentira del panel.
 */
export function completitudDeParticular(ficha: FichaParticular): Completitud {
  const cargados = CAMPOS_PARTICULAR.filter(
    (c) => tieneValor(ficha[c.clave]) || (c.clave2 ? tieneValor(ficha[c.clave2]) : false)
  );
  const vacios = CAMPOS_PARTICULAR.filter((c) => !cargados.includes(c));
  const conServicios = (ficha.servicios ?? []).length > 0;

  const total = CAMPOS_PARTICULAR.length + 1;
  const completos = cargados.length + (conServicios ? 1 : 0);

  return {
    cargados,
    vacios,
    conServicios,
    completos,
    total,
    pct: Math.round((completos / total) * 100),
  };
}

/** Los que escribió a mano y todavía no están en el catálogo oficial. */
export function serviciosFueraDelCatalogo(
  servicios: ServicioDeclarado[]
): ServicioDeclarado[] {
  return servicios.filter((s) => !s.oficial);
}
