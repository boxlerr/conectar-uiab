import type { Metadata } from "next";
import { ogPorRuta } from "@/lib/seo/og";
import Link from "next/link";
import { obtenerDirectorio } from "@/app/directorio/datos";
import { RUBROS_SEO, perteneceAlRubro } from "@/lib/datos/rubros-seo";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { Migas } from "@/components/ui/migas";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Rubros industriales de Almirante Brown",
  description:
    "Los rubros del directorio UIAB Conecta: metalúrgica, química, construcción, packaging, automatización y más, con las socias verificadas de cada uno.",
  alternates: { canonical: "/rubros" },
  ...ogPorRuta(
    "Rubros industriales de Almirante Brown",
    "Todos los rubros del directorio UIAB Conecta, con las empresas socias verificadas de cada uno.",
    "/rubros"
  ),
};

export default async function RubrosPage() {
  const { entidades } = await obtenerDirectorio();
  const socias = entidades.filter((e) => !esEmpresaInstitucional(e.id));

  const rubros = RUBROS_SEO.map((r) => ({
    ...r,
    total: socias.filter((e) => perteneceAlRubro(r, e)).length,
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-svh bg-[#f7f9fb]">
      <section className="relative bg-[#00213f] -mt-20 lg:-mt-24 pt-20 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00182e] via-[#00213f] to-[#10375c]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <Migas
            tono="claro"
            className="mb-6"
            migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Rubros" }]}
          />
          <h1 className="font-manrope text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-4xl">
            Rubros industriales de Almirante Brown
          </h1>
          <p className="mt-4 text-white/75 text-[15.5px] max-w-3xl leading-relaxed">
            UIAB Conecta agrupa a las empresas socias de la Unión Industrial de Almirante Brown por
            rubro, para que llegues directo al tipo de proveedor que estás buscando. Cada rubro
            reúne empresas verificadas de Burzaco, Longchamps y Adrogué, con su actividad, sus
            especialidades y el contacto directo.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rubros.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/rubros/${r.slug}`}
                className="group flex h-full flex-col bg-white rounded-md border border-slate-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <h2 className="font-manrope text-[17px] font-black text-[#00213f] group-hover:text-primary-600 transition-colors">
                  {r.nombre}
                </h2>
                <p className="mt-1 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                  {r.total} {r.total === 1 ? "empresa" : "empresas"}
                </p>
                <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed line-clamp-3">
                  {r.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[14px] text-slate-600">
          Los rubros con menos de tres empresas socias todavía no tienen página propia; sus fichas
          se encuentran igual desde{" "}
          <Link href="/directorio" className="font-semibold text-primary-600 hover:underline">
            el directorio completo
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
