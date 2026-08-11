import Link from "next/link";
import { RUBROS_SEO, perteneceAlRubro } from "@/lib/datos/rubros-seo";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import type { Entidad } from "@/lib/datos/directorio";

/**
 * Bloque "Explorá por rubro", server-rendered.
 *
 * /directorio era un hub PLANO: 59 enlaces a fichas y nada en el medio. Este
 * bloque le da una capa jerárquica —hub → rubro → ficha— y, sobre todo, hace
 * que las 13 landings sean rastreables desde el día uno: sin él sólo existirían
 * en el sitemap, que es una sugerencia, no un camino de rastreo.
 */
export function ExplorarPorRubro({ entidades }: { entidades: Entidad[] }) {
  const socias = entidades.filter((e) => !esEmpresaInstitucional(e.id));

  const rubros = RUBROS_SEO.map((r) => ({
    slug: r.slug,
    nombre: r.nombre,
    total: socias.filter((e) => perteneceAlRubro(r, e)).length,
  }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  if (rubros.length === 0) return null;

  return (
    <section
      aria-labelledby="explorar-por-rubro"
      className="bg-white border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2
          id="explorar-por-rubro"
          className="font-manrope text-2xl font-black text-[#00213f] tracking-tight"
        >
          Explorá el directorio por rubro
        </h2>
        <p className="mt-2 mb-6 text-slate-600 text-[15px] leading-relaxed max-w-3xl">
          Cada rubro tiene su propia página, con las empresas socias de la UIAB que trabajan en él
          y qué hace cada una.
        </p>
        <ul className="flex flex-wrap gap-2.5">
          {rubros.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/rubros/${r.slug}`}
                className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-3 py-2 text-[13.5px] font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-600 hover:bg-white transition-colors"
              >
                {r.nombre}
                <span className="text-[11px] font-bold text-slate-400">{r.total}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/rubros"
          className="mt-6 inline-block text-[14px] font-semibold text-primary-600 hover:underline"
        >
          Ver todos los rubros industriales de Almirante Brown
        </Link>
      </div>
    </section>
  );
}
