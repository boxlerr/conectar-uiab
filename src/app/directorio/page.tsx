import { Suspense } from "react";
import { ogPorRuta } from "@/lib/seo/og";
import { obtenerDirectorio } from "./datos";
import { DirectorioCliente } from "./directorio-cliente";
import { ExplorarPorRubro } from "@/components/ui/directorio/explorar-por-rubro";
import { ID_WEBSITE, SITE_URL } from "@/lib/seo/entidad";

// El directorio es público (se ve sin cuenta). Los datos se traen en el
// servidor con el admin client, por lo que el contenido debe ser fresco en
// cada visita (aparecen/desaparecen empresas aprobadas).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Directorio UIAB — Empresas y prestadores verificados",
  description:
    "Buscá en toda la red de la Unión Industrial de Almirante Brown desde un solo lugar: empresas socias, prestadores, bancos, universidades y cooperativas.",
  alternates: { canonical: "/directorio" },
  ...ogPorRuta(
    "Directorio UIAB — Empresas y prestadores verificados",
    "Toda la red de la Unión Industrial de Almirante Brown en un solo buscador.",
    "/directorio"
  ),
};

export default async function DirectorioPage() {
  const { entidades } = await obtenerDirectorio();

  /**
   * El directorio, declarado como lo que es: una colección con sus ítems.
   *
   * La página ya lista las 59 entidades server-rendered, con su nombre y su
   * enlace, pero no lo declaraba en ningún lado — o sea que Google tenía que
   * deducir que esto es un listado. `CollectionPage` + `ItemList` lo dice.
   *
   * Por qué ESTA página y no uno nuevo: /directorio es una de las pocas que
   * Google efectivamente indexó y rastrea. Con 56 URLs del sitemap en
   * "descubierta, sin rastrear", agregar páginas no mueve nada; hacer más
   * valiosas las que ya entran, sí.
   *
   * Sin cifras sueltas ni nada inventado: cada ítem sale de una fila real y el
   * total es `entidades.length`.
   */
  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/directorio#coleccion`,
    name: "Directorio de la Unión Industrial de Almirante Brown",
    url: `${SITE_URL}/directorio`,
    isPartOf: { "@id": ID_WEBSITE },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entidades.length,
      itemListElement: entidades.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/empresas/${e.slug}`,
        name: e.nombre,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <Suspense fallback={null}>
        <DirectorioCliente entidades={entidades} />
      </Suspense>
      {/* Convierte el hub plano (59 enlaces a fichas y nada más) en uno
          jerárquico, y hace rastreables las 13 landings de rubro desde una
          página que Google ya visita. */}
      <ExplorarPorRubro entidades={entidades} />
    </>
  );
}
