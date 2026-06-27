// Constantes compartidas de "altas de socios". Módulo plano (no "use server")
// para poder importarlo desde Client Components y Server Components por igual.

export const CATEGORIAS_ALTA = [
  { value: "empresa_socia", label: "Empresa industrial socia UIAB" },
  { value: "prestador_servicios", label: "Prestador de productos y servicios" },
  { value: "entidad_financiera", label: "Entidad financiera" },
  { value: "entidad_educativa", label: "Entidad educativa" },
  { value: "cooperativa", label: "Cooperativa" },
] as const;

export const CATEGORIA_ALTA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS_ALTA.map((c) => [c.value, c.label])
);

export const ESTADOS_ALTA = [
  { value: "pendiente", label: "Pendiente" },
  { value: "contactado", label: "Contactado" },
  { value: "cuenta_creada", label: "Cuenta creada" },
  { value: "descartado", label: "Descartado" },
] as const;

export type CategoriaAlta = (typeof CATEGORIAS_ALTA)[number]["value"];
export type EstadoAlta = (typeof ESTADOS_ALTA)[number]["value"];

export interface AltaSocioInput {
  razon_social: string;
  nombre_comercial?: string;
  cuit?: string;
  actividad?: string;
  categoria: CategoriaAlta | string;
  ya_es_socio?: boolean;
  n_socio?: string;
  referente_nombre: string;
  referente_cargo?: string;
  email: string;
  telefono?: string;
  sitio_web?: string;
  localidad?: string;
  direccion?: string;
  mensaje?: string;
}
