import type { Metadata } from "next";
import { ogPorRuta } from "@/lib/seo/og";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { obtenerDirectorio } from "@/app/directorio/datos";
import { RUBROS_SEO, getRubroSeo, perteneceAlRubro } from "@/lib/datos/rubros-seo";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { Migas } from "@/components/ui/migas";

/**
 * Landing de rubro: /rubros/[slug].
 *
 * Cuelga de /rubros y NO de /empresas a propósito. `src/app/empresas/layout.tsx`
 * declara `alternates: { canonical: "/empresas" }`, y la metadata de Next se
 * hereda hacia abajo: cualquier ruta bajo /empresas saldría diciendo que su
 * versión canónica es el listado. Es exactamente el mecanismo que el 09/08/2026
 * dejó el sitio con 10 URLs indexadas de 64 (ver el comentario de
 * src/app/layout.tsx). Además /empresas/[slug] ya es un catch-all de razones
 * sociales: "quimica" chocaría con el slug de una socia.
 */

export const revalidate = 3600;

/** Sólo los 13 rubros del array. Cualquier otro slug es 404, no una landing vacía. */
export const dynamicParams = false;

export function generateStaticParams() {
  return RUBROS_SEO.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rubro = getRubroSeo(slug);
  if (!rubro) return { title: "Rubro no encontrado", robots: { index: false, follow: true } };

  return {
    // El template del layout raíz agrega " | UIAB Conecta": no lo repitas acá.
    title: rubro.title,
    description: rubro.description,
    alternates: { canonical: `/rubros/${rubro.slug}` },
    ...ogPorRuta(rubro.title, rubro.description, `/rubros/${rubro.slug}`),
  };
}

export default async function RubroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rubro = getRubroSeo(slug);
  if (!rubro) notFound();

  const { entidades } = await obtenerDirectorio();

  // La ficha institucional de la UIAB no es una socia más del rubro: la cámara
  // no compite en su propio directorio (mismo criterio que el marquee de logos).
  const socias = entidades
    .filter((e) => !esEmpresaInstitucional(e.id))
    .filter((e) => perteneceAlRubro(rubro, e))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

  const localidades = Array.from(
    new Set(socias.map((e) => e.ubicacion?.split(",")[0]?.trim()).filter(Boolean))
  );

  const otros = RUBROS_SEO.filter((r) => r.slug !== rubro.slug);

  return (
    <div className="min-h-svh bg-[#f7f9fb]">
      {/* Hero */}
      <section className="relative bg-[#00213f] -mt-20 lg:-mt-24 pt-20 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00182e] via-[#00213f] to-[#10375c]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Migas
            tono="claro"
            className="mb-6"
            migas={[
              { nombre: "Inicio", href: "/" },
              { nombre: "Rubros", href: "/rubros" },
              { nombre: rubro.nombre },
            ]}
          />
          <h1 className="font-manrope text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-4xl">
            {rubro.h1}
          </h1>
          <p className="mt-4 text-white/70 text-[15px]">
            {socias.length} {socias.length === 1 ? "empresa socia" : "empresas socias"} de la UIAB
            {localidades.length > 0 && <> · {localidades.join(" · ")}</>}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/*
          La intro va ARRIBA de la grilla, server-rendered y en texto plano.
          Es la única parte de la página que no es una lista de nombres, o sea
          lo único que la diferencia de /directorio filtrado. Si va abajo de las
          tarjetas, el crawler la lee como pie de página.
        */}
        <div className="max-w-3xl">
          {rubro.intro.split("\n\n").map((parrafo, i) => (
            <p key={i} className="text-slate-700 text-[15.5px] leading-relaxed mb-4">
              {parrafo}
            </p>
          ))}
        </div>

        <h2 className="mt-12 mb-6 font-manrope text-2xl font-black text-[#00213f] tracking-tight">
          Empresas de {rubro.nombre.toLocaleLowerCase("es")} en la red UIAB
        </h2>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {socias.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/empresas/${e.slug}`}
                className="group flex h-full flex-col gap-3 bg-white rounded-md border border-slate-200 p-5 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  {e.logoUrl ? (
                    <Image
                      src={e.logoUrl}
                      alt={e.nombre}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded object-contain bg-white border border-slate-100"
                    />
                  ) : (
                    <span className="w-11 h-11 rounded bg-[#00213f] text-white font-black flex items-center justify-center">
                      {e.logo}
                    </span>
                  )}
                  <span className="font-bold text-[15px] text-[#00213f] group-hover:text-primary-600 transition-colors leading-tight">
                    {e.nombre}
                  </span>
                </div>
                {e.descripcionCorta && e.descripcionCorta !== "Sin descripción" && (
                  <p className="text-[13.5px] text-slate-600 leading-relaxed line-clamp-3">
                    {e.descripcionCorta}
                  </p>
                )}
                <p className="mt-auto flex items-center gap-1.5 text-[12px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {e.ubicacion || "Almirante Brown"}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {/* Otros rubros: convierte el conjunto de landings en una malla en vez
            de 13 hojas sueltas colgando del índice. */}
        <section aria-labelledby="otros-rubros" className="mt-16 pt-10 border-t border-slate-200">
          <h2 id="otros-rubros" className="font-manrope text-xl font-black text-[#00213f] mb-5">
            Otros rubros del directorio
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otros.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/rubros/${r.slug}`}
                  className="inline-block bg-white border border-slate-200 rounded-full px-4 py-2 text-[13px] font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
                >
                  {r.nombre}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px] text-slate-600">
            ¿Buscás algo que no está acá?{" "}
            <Link href="/directorio" className="font-semibold text-primary-600 hover:underline">
              Buscá en todo el directorio de UIAB Conecta
              <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
