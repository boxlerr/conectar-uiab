// Constantes compartidas de "altas de socios". Módulo plano (no "use server")
// para poder importarlo desde Client Components y Server Components por igual.

// El alta es EXCLUSIVA para organizaciones socias de la UIAB (el formulario
// recopila los datos de quienes ya están en el padrón para activarles el
// acceso). Los prestadores no socios se registran por /register.
export const CATEGORIAS_ALTA = [
  { value: "empresa_socia", label: "Empresa industrial socia UIAB" },
  { value: "entidad_financiera", label: "Entidad financiera" },
  { value: "entidad_educativa", label: "Entidad educativa" },
  { value: "cooperativa", label: "Cooperativa" },
] as const;

export const CATEGORIA_ALTA_LABEL: Record<string, string> = {
  ...Object.fromEntries(CATEGORIAS_ALTA.map((c) => [c.value, c.label])),
  // etiqueta legacy: solicitudes viejas cargadas cuando la opción existía
  prestador_servicios: "Prestador de productos y servicios",
};

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
  email_compras?: string;
  telefono?: string;
  sitio_web?: string;
  localidad?: string;
  direccion?: string;
  mensaje?: string;
}
