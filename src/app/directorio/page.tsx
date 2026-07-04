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
    "Directorio público de la Unión Industrial de Almirante Brown: empresas socias y prestadores de productos y servicios verificados de la red.",
};

export default async function DirectorioPage() {
  const { empresas, prestadores } = await obtenerDirectorio();

  return (
    <Suspense fallback={null}>
      <DirectorioCliente empresas={empresas} prestadores={prestadores} />
    </Suspense>
  );
}
