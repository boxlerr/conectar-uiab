import { Suspense } from "react";
import { ogPorRuta } from "@/lib/seo/og";
import { obtenerDirectorio } from "./datos";
import { DirectorioCliente } from "./directorio-cliente";
import { ExplorarPorRubro } from "@/components/ui/directorio/explorar-por-rubro";

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

  return (
    <>
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
