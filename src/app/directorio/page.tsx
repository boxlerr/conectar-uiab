import { Suspense } from "react";
import { obtenerDirectorio } from "./datos";
import { DirectorioCliente } from "./directorio-cliente";

// El directorio es público (se ve sin cuenta). Los datos se traen en el
// servidor con el admin client, por lo que el contenido debe ser fresco en
// cada visita (aparecen/desaparecen empresas aprobadas).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Directorio UIAB — Empresas y prestadores verificados",
  description:
    "Directorio público de la Unión Industrial de Almirante Brown: empresas socias, prestadores de productos y servicios, entidades financieras y educativas, y cooperativas verificadas de la red. Buscá en toda la red desde un solo lugar.",
};

export default async function DirectorioPage() {
  const { entidades } = await obtenerDirectorio();

  return (
    <Suspense fallback={null}>
      <DirectorioCliente entidades={entidades} />
    </Suspense>
  );
}
