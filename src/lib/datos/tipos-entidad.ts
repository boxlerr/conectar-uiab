/**
 * Tipo de organización dentro del directorio.
 *
 * Antes cada tipo era una PESTAÑA distinta: buscar "Credicoop" desde la
 * pestaña de empresas no devolvía nada porque las financieras vivían en otra
 * lista. Ahora el directorio es una sola lista con todo y el tipo es un filtro
 * más — se busca en el conjunto completo y, si querés, después achicás.
 */
export const TIPOS_ENTIDAD = [
  "empresa",
  "prestador",
  "financiera",
  "educativa",
  "cooperativa",
] as const;

export type TipoEntidad = (typeof TIPOS_ENTIDAD)[number];

export interface TipoEntidadMeta {
  valor: TipoEntidad;
  /** Etiqueta del filtro en la barra lateral (plural, nombre completo). */
  etiqueta: string;
  /** Cómo se nombra en la tarjeta: corto, para que no tape al nombre. */
  chip: string;
  singular: string;
  plural: string;
  /** Género para concordar "encontrada/encontrado". */
  genero: "f" | "m";
  /**
   * Clases completas del chip de la tarjeta. Nunca interpolar colores en
   * Tailwind: el JIT sólo ve las clases que aparecen literales en el código.
   */
  chipClases: string;
  /** Punto de color del filtro lateral. */
  puntoClases: string;
}

export const TIPOS_ENTIDAD_META: Record<TipoEntidad, TipoEntidadMeta> = {
  empresa: {
    valor: "empresa",
    etiqueta: "Empresas socias",
    chip: "Empresa",
    singular: "empresa socia",
    plural: "empresas socias",
    genero: "f",
    chipClases: "bg-[#10375c]/10 text-[#10375c]",
    puntoClases: "bg-[#10375c]",
  },
  prestador: {
    valor: "prestador",
    etiqueta: "Prestadores de productos y servicios",
    chip: "Prestador",
    singular: "prestador de productos y servicios",
    plural: "prestadores de productos y servicios",
    genero: "m",
    chipClases: "bg-amber-100 text-amber-800",
    puntoClases: "bg-amber-500",
  },
  financiera: {
    valor: "financiera",
    etiqueta: "Entidades financieras",
    chip: "Financiera",
    singular: "entidad financiera",
    plural: "entidades financieras",
    genero: "f",
    chipClases: "bg-emerald-100 text-emerald-800",
    puntoClases: "bg-emerald-500",
  },
  educativa: {
    valor: "educativa",
    etiqueta: "Entidades educativas",
    chip: "Educativa",
    singular: "entidad educativa",
    plural: "entidades educativas",
    genero: "f",
    chipClases: "bg-violet-100 text-violet-800",
    puntoClases: "bg-violet-500",
  },
  cooperativa: {
    valor: "cooperativa",
    etiqueta: "Cooperativas",
    chip: "Cooperativa",
    singular: "cooperativa",
    plural: "cooperativas",
    genero: "f",
    chipClases: "bg-teal-100 text-teal-800",
    puntoClases: "bg-teal-500",
  },
};

/**
 * Aliases de los `?tab=` viejos (y de los slugs de las landings por categoría)
 * para no romper links ya compartidos ni resultados indexados por Google.
 */
const ALIAS_TIPO: Record<string, TipoEntidad> = {
  empresas: "empresa",
  prestadores: "prestador",
  proveedores: "prestador",
  financieras: "financiera",
  bancarias: "financiera",
  educativas: "educativa",
  cooperativas: "cooperativa",
};

/** Normaliza `?tipo=` / `?tab=` a un TipoEntidad, o null si no aplica. */
export function parseTipoEntidad(param: string | null | undefined): TipoEntidad | null {
  if (!param) return null;
  if ((TIPOS_ENTIDAD as readonly string[]).includes(param)) return param as TipoEntidad;
  return ALIAS_TIPO[param] ?? null;
}
