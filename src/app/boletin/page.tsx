import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { getRole } from "@/lib/autenticacion/obtener-rol";
import { Migas } from "@/components/ui/migas";
import { ID_ORG_CONECTA, ID_ORG_UIAB, SITE_URL } from "@/lib/seo/entidad";
import { getComunicadosPublicados } from "@/modulos/boletin/consultas";
import { Compositor } from "@/modulos/boletin/componentes/compositor";
import { Publicacion } from "@/modulos/boletin/componentes/publicacion";
import {
  TarjetaQueEs,
  TarjetaSiguiente,
} from "@/modulos/boletin/componentes/rieles";
import { resumenComunicado, rutaComunicado } from "@/modulos/boletin/formato";
import type { ComunicadoPublico } from "@/modulos/boletin/tipos";

/**
 * El Boletín UIAB: las novedades de la UIAB en formato de red social —una
 * columna de publicaciones, como el feed de LinkedIn o Facebook—, con las
 * fijadas arriba y después de la más nueva a la más vieja.
 *
 * PÚBLICO. Hasta ahora el middleware lo trataba como ruta protegida y
 * next.config le ponía `noindex`: todo lo que publicaba la cámara quedaba
 * encerrado detrás del login. Es la única fuente de contenido fresco del
 * dominio, así que se lee sin cuenta y es la portada de sección de las notas
 * (de cuáles entran al índice se ocupa `esNotaIndexable`, en formato.ts).
 *
 * El feed no se ensancha para "llenar" la pantalla: una columna de ~660px es
 * lo que se lee cómodo. El costado lo ocupa el riel de la derecha.
 *
 * Un admin ve además el cuadro para publicar y el menú ··· de cada
 * publicación. Dinámica porque se publica en cualquier momento y tiene que
 * verse al toque.
 */

export const dynamic = "force-dynamic";

const TITULO = "Boletín UIAB — novedades industriales";
const DESCRIPCION =
  "Noticias y avisos de la Unión Industrial de Almirante Brown: novedades para las empresas de Burzaco, Adrogué, Longchamps y todo el partido.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/boletin` },
  openGraph: {
    type: "website",
    title: TITULO,
    description: DESCRIPCION,
    url: `${SITE_URL}/boletin`,
    siteName: "UIAB Conecta",
    locale: "es_AR",
  },
};

/** La sección como colección: le da a Google el listado y su orden. */
function jsonLdBoletin(comunicados: ComunicadoPublico[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/boletin#coleccion`,
    url: `${SITE_URL}/boletin`,
    name: "Boletín UIAB",
    description: DESCRIPCION,
    inLanguage: "es-AR",
    isPartOf: { "@id": ID_ORG_CONECTA },
    about: { "@id": ID_ORG_UIAB },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: comunicados.slice(0, 20).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${rutaComunicado(c)}`,
        name: resumenComunicado(c),
      })),
    },
  };
}

export default async function BoletinPage() {
  const [comunicados, rol] = await Promise.all([getComunicadosPublicados(), getRole()]);
  const esAdmin = rol === "admin";
  const haySesion = rol !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBoletin(comunicados)) }}
      />

      <Migas
        className="mb-5"
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Boletín" }]}
      />

      <header className="mb-7 flex items-start gap-4">
        <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 sm:flex">
          <Megaphone className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h1 className="font-poppins text-[1.6rem] font-bold leading-tight tracking-tight text-[#00213f] sm:text-[2rem]">
            Boletín UIAB
          </h1>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-slate-500">
            Noticias y avisos de la Unión Industrial de Almirante Brown para las
            empresas del partido. Lo escribe y lo publica el equipo de la UIAB.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,660px)_300px] lg:justify-center xl:gap-8">
        <div className="min-w-0 space-y-4">
          {esAdmin && <Compositor />}

          {comunicados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">Todavía no hay novedades.</p>
              <p className="mt-1 text-sm text-slate-400">
                Cuando la UIAB publique algo, lo vas a ver acá.
              </p>
            </div>
          ) : (
            comunicados.map((c) => <Publicacion key={c.id} c={c} esAdmin={esAdmin} />)
          )}

          {/* Sin costado (mobile/tablet) las tarjetas del riel van al final. */}
          <div className="space-y-4 pt-2 lg:hidden">
            <TarjetaQueEs />
            <TarjetaSiguiente haySesion={haySesion} />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <TarjetaQueEs />
            <TarjetaSiguiente haySesion={haySesion} />
          </div>
        </aside>
      </div>
    </div>
  );
}
