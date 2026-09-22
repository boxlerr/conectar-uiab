import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRole } from "@/lib/autenticacion/obtener-rol";
import { Migas } from "@/components/ui/migas";
import { ID_ORG_CONECTA, ID_ORG_UIAB, SITE_URL } from "@/lib/seo/entidad";
import { getComunicadoPorSlug, getComunicadosPublicados } from "@/modulos/boletin/consultas";
import { Articulo } from "@/modulos/boletin/componentes/articulo";
import { CompartirNota } from "@/modulos/boletin/componentes/compartir-nota";
import {
  ListaNovedades,
  TarjetaQueEs,
  TarjetaSiguiente,
} from "@/modulos/boletin/componentes/rieles";
import {
  descripcionComunicado,
  esNotaIndexable,
  resumenComunicado,
  rutaComunicado,
  slugComunicado,
} from "@/modulos/boletin/formato";
import type { ComunicadoPublico } from "@/modulos/boletin/tipos";

/**
 * Una nota del Boletín, en formato de blog: la nota al medio, el compartir
 * pegado a la izquierda y las otras novedades a la derecha.
 *
 * PÚBLICA E INDEXABLE. Antes el middleware protegía todo `/boletin*` y
 * next.config le ponía `noindex`: cada cosa que publicaba la UIAB quedaba
 * encerrada detrás del login. Es contenido fresco, local y con la firma de la
 * cámara — o sea justo lo que al dominio le falta.
 *
 * Con una excepción, que decide `esNotaIndexable`: los avisos de dos líneas y
 * las publicaciones que son sólo una foto se leen y se comparten igual, pero no
 * entran al índice ni al sitemap. Ver el comentario de `formato.ts`.
 *
 * La URL lleva el título (`/boletin/titulo-en-slug-fab6bc0e`). Un enlace viejo
 * con el uuid pelado, o con un título que después se corrigió, sigue
 * resolviendo y se redirige 301 al slug de hoy.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getComunicadoPorSlug(slug);

  if (!c) {
    return {
      title: { absolute: "Nota no encontrada | Boletín UIAB" },
      robots: { index: false, follow: true },
    };
  }

  const titulo = resumenComunicado(c);
  const url = `${SITE_URL}${rutaComunicado(c)}`;
  const description = descripcionComunicado(c);

  return {
    // `absolute` para saltear el template del layout raíz: si no, el <title>
    // sale "Nota | Boletín UIAB | UIAB Conecta" y la marca aparece dos veces.
    title: { absolute: `${titulo} | Boletín UIAB` },
    description:
      description ||
      "Novedades de la Unión Industrial de Almirante Brown en UIAB Conecta.",
    alternates: { canonical: url },
    // Un aviso corto se lee y se comparte, pero no entra al índice: sumar URLs
    // flacas le baja la nota al dominio entero.
    robots: esNotaIndexable(c) ? undefined : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: titulo,
      description,
      url,
      siteName: "UIAB Conecta",
      locale: "es_AR",
      publishedTime: c.publicado_en ?? undefined,
      modifiedTime: c.actualizado_en,
      images: c.imagenUrl ? [{ url: c.imagenUrl }] : undefined,
    },
    twitter: {
      card: c.imagenUrl ? "summary_large_image" : "summary",
      title: titulo,
      description,
      images: c.imagenUrl ? [c.imagenUrl] : undefined,
    },
  };
}

/** NewsArticle: la cámara firma, el directorio publica. */
function jsonLdNota(c: ComunicadoPublico) {
  const url = `${SITE_URL}${rutaComunicado(c)}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#nota`,
    mainEntityOfPage: url,
    url,
    headline: resumenComunicado(c).slice(0, 110),
    description: descripcionComunicado(c),
    inLanguage: "es-AR",
    ...(c.publicado_en ? { datePublished: c.publicado_en } : {}),
    dateModified: c.actualizado_en,
    ...(c.imagenUrl ? { image: [c.imagenUrl] } : {}),
    author: { "@id": ID_ORG_UIAB },
    publisher: { "@id": ID_ORG_CONECTA },
    isAccessibleForFree: true,
  };
}

export default async function NotaBoletinPage({ params }: Props) {
  const { slug } = await params;
  const [c, recientes, rol] = await Promise.all([
    getComunicadoPorSlug(slug),
    getComunicadosPublicados(5),
    getRole(),
  ]);
  if (!c) notFound();

  // El enlace resolvió por el sufijo del id, pero la URL no es la de hoy
  // (título corregido, o un uuid pelado de antes): una sola URL canónica.
  const canonico = slugComunicado(c);
  if (slug !== canonico) permanentRedirect(`/boletin/${canonico}`);

  const otros = recientes.filter((r) => r.id !== c.id).slice(0, 4);
  const haySesion = rol !== null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdNota(c)) }}
      />

      <Migas
        className="mb-5"
        migas={[
          { nombre: "Inicio", href: "/" },
          { nombre: "Boletín", href: "/boletin" },
          { nombre: resumenComunicado(c) },
        ]}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[76px_minmax(0,1fr)_320px] xl:gap-8">
        {/* Columna de compartir: pegajosa, sólo cuando hay costado para ella. */}
        <aside className="hidden xl:block">
          <div className="sticky top-28">
            <Link
              href="/boletin"
              aria-label="Volver al boletín"
              className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:text-[#00213f] hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CompartirNota c={c} forma="columna" />
          </div>
        </aside>

        <div className="min-w-0">
          <Link
            href="/boletin"
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-[#00213f] transition-colors hover:bg-slate-100 xl:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Boletín
          </Link>

          <Articulo c={c} esAdmin={rol === "admin"} />

          {/* Sin costado, las otras notas van abajo. */}
          <div className="mt-6 space-y-4 lg:hidden">
            <ListaNovedades comunicados={otros} />
            <TarjetaSiguiente haySesion={haySesion} />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <ListaNovedades comunicados={otros} />
            <TarjetaQueEs />
            <TarjetaSiguiente haySesion={haySesion} />
          </div>
        </aside>
      </div>
    </div>
  );
}
