import { Suspense } from "react";
import { obtenerDirectorio } from "@/app/directorio/datos";
import { EmpresasCliente } from "./empresas-cliente";
import { IndiceEmpresas } from "@/components/ui/directorio/indice-empresas";
import { RUBROS_SEO, perteneceAlRubro } from "@/lib/datos/rubros-seo";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { obtenerSociasConLogo } from "@/lib/datos/socias-logos";

/**
 * `/empresas` pasó de ser un client component suelto a un Server Component que
 * envuelve al cliente. Dos motivos, los dos del audit del 11/08/2026:
 *
 * 1. ENLAZADO. El HTML que recibía Googlebot tenía CERO enlaces a las fichas
 *    —la vista con filtros se arma en el browser—, así que la página cuyo
 *    trabajo es llevar al directorio no llevaba a ningún lado. Ahora el índice
 *    A-Z sale renderizado del servidor, con la razón social como anchor text.
 *
 * 2. DATOS REALES. La landing pública mostraba tres empresas inventadas
 *    ("MetalTech Industrial SA", "QuímicaPro Solutions", "MaquinariasPrecision")
 *    que venían de un array mock. Ahora recibe socias de verdad, y sus tarjetas
 *    enlazan a fichas que existen.
 *
 * El gate NO se toca: el listado con filtros y los datos de contacto siguen
 * siendo del cliente y siguen exigiendo suscripción. Lo que se publica acá
 * —nombre, rubro y localidad— ya era público en /directorio.
 */
export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const [{ entidades }, sociasLogos] = await Promise.all([
    obtenerDirectorio(),
    obtenerSociasConLogo(),
  ]);

  // Sólo empresas (no prestadores/financieras/educativas/cooperativas): esta
  // ruta es la de empresas y su landing habla de empresas.
  const empresas = entidades.filter(
    (e) => e.tipoEntidad === undefined || e.tipoEntidad === "empresa"
  );

  const socias = entidades.filter((e) => !esEmpresaInstitucional(e.id));

  // Conteos reales por rubro. Antes esta grilla tenía doce sectores con cifras
  // escritas a mano ("Gastronomía 22", "Comercio 31") que no existen en la base.
  const sectores = RUBROS_SEO.map((r) => ({
    slug: r.slug,
    nombre: r.nombre,
    total: socias.filter((e) => perteneceAlRubro(r, e)).length,
  })).sort((a, b) => b.total - a.total);

  return (
    <>
      {/* El cliente usa useSearchParams (?categoria=), así que necesita su
          propio boundary de Suspense o Next tira el error de CSR bailout. */}
      <Suspense fallback={null}>
        <EmpresasCliente
          empresasPreview={empresas.slice(0, 3)}
          sectores={sectores}
          totalEmpresas={socias.length}
          sociasLogos={sociasLogos}
        />
      </Suspense>
      <IndiceEmpresas entidades={entidades} />
    </>
  );
}
