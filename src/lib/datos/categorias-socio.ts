export const CATEGORIAS_SOCIO = [
  "proveedores_servicios_productos",
  "instituciones_educativas",
  "instituciones_bancarias",
] as const;

export type CategoriaSocio = (typeof CATEGORIAS_SOCIO)[number];

export interface CategoriaSocioMeta {
  valor: CategoriaSocio;
  slug: string;
  nombre: string;
  descripcion: string;
}

export const CATEGORIAS_SOCIO_META: Record<CategoriaSocio, CategoriaSocioMeta> = {
  proveedores_servicios_productos: {
    valor: "proveedores_servicios_productos",
    slug: "proveedores",
    nombre: "Proveedores de servicios y productos",
    descripcion: "Empresas industriales socias que ofrecen productos y servicios a la red UIAB.",
  },
  instituciones_educativas: {
    valor: "instituciones_educativas",
    slug: "educativas",
    nombre: "Instituciones educativas",
    descripcion: "Centros de formación y capacitación aliados a la UIAB.",
  },
  instituciones_bancarias: {
    valor: "instituciones_bancarias",
    slug: "bancarias",
    nombre: "Instituciones bancarias",
    descripcion: "Entidades financieras socias de la UIAB.",
  },
};

const SLUG_A_CATEGORIA: Record<string, CategoriaSocio> = Object.fromEntries(
  Object.values(CATEGORIAS_SOCIO_META).map((m) => [m.slug, m.valor]),
);

export function parseCategoriaSocioParam(param: string | null | undefined): CategoriaSocio | null {
  if (!param) return null;
  if ((CATEGORIAS_SOCIO as readonly string[]).includes(param)) return param as CategoriaSocio;
  return SLUG_A_CATEGORIA[param] ?? null;
}
