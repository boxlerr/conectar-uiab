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
  nombreCorto: string;
  descripcion: string;
  eyebrow: string;
  /** Gradient de overlay para el hero (Tailwind classes). */
  heroGradient: string;
  /** Color de acento del badge (Tailwind classes completas). */
  accentBadge: string;
  /** Nombre del substantivo plural para métricas (ej. "empresas", "instituciones"). */
  sustantivoPlural: string;
}

export const CATEGORIAS_SOCIO_META: Record<CategoriaSocio, CategoriaSocioMeta> = {
  proveedores_servicios_productos: {
    valor: "proveedores_servicios_productos",
    slug: "proveedores",
    nombre: "Empresas y particulares",
    nombreCorto: "Particulares",
    descripcion: "Empresas industriales socias y particulares que ofrecen productos y servicios a la red UIAB.",
    eyebrow: "Socios UIAB · Particulares",
    heroGradient: "from-[#00182e] via-[#00213f]/80 to-[#10375c]/60",
    accentBadge: "bg-blue-500/15 text-blue-200 border-blue-300/30",
    sustantivoPlural: "empresas",
  },
  instituciones_educativas: {
    valor: "instituciones_educativas",
    slug: "educativas",
    nombre: "Instituciones educativas",
    nombreCorto: "Educativas",
    descripcion: "Centros de formación y capacitación aliados a la UIAB.",
    eyebrow: "Socios UIAB · Educación",
    heroGradient: "from-[#3b2a6b] via-[#4a2977]/80 to-[#6b3aa0]/60",
    accentBadge: "bg-violet-500/15 text-violet-200 border-violet-300/30",
    sustantivoPlural: "instituciones",
  },
  instituciones_bancarias: {
    valor: "instituciones_bancarias",
    slug: "bancarias",
    nombre: "Instituciones bancarias",
    nombreCorto: "Bancarias",
    descripcion: "Entidades financieras socias de la UIAB.",
    eyebrow: "Socios UIAB · Financiero",
    heroGradient: "from-[#042f2e] via-[#053d3b]/80 to-[#115e59]/60",
    accentBadge: "bg-emerald-500/15 text-emerald-200 border-emerald-300/30",
    sustantivoPlural: "instituciones",
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
