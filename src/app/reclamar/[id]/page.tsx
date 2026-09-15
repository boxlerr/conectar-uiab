import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormularioReclamo } from "./FormularioReclamo";

/**
 * "Reclamá la ficha de tu empresa": /reclamar/{id}
 *
 * POR QUÉ EXISTE
 *
 * 35 de las 59 fichas publicadas no tienen ningún usuario: las cargó la UIAB
 * desde el padrón y nadie de la empresa entró nunca. Para esa empresa el
 * problema no es completar datos — es que su ficha ya existe y no lo sabe.
 *
 * Acá el `id` ya resuelve razón social, rubro y localidad, así que sólo se le
 * pide lo único que la UIAB no tiene: quién es la persona. Tres campos contra
 * los quince de /sumate. Es el patrón "reclamar este perfil" de Google Business
 * Profile, y además le da a la UIAB un link personal por empresa para mandar por
 * WhatsApp durante los llamados, donde la persona no tipea nada.
 *
 * VA POR `id` Y NO POR SLUG, a propósito: el slug se calcula de `razon_social`
 * en cada render y no se guarda, así que 23 de las 28 socias con nombre
 * comercial distinto dan 404 si el link se arma con el rótulo visible. El `id`
 * es estable — es la misma razón por la que existe /e/[id].
 */

export const dynamic = "force-dynamic";

/**
 * `noindex` porque es una acción, no contenido: no aporta nada a una búsqueda y
 * además duplicaría el nombre de la empresa, que ya tiene su ficha indexada.
 * `follow` para que el enlace a la ficha siga contando.
 */
export const metadata = {
  title: "Reclamá la ficha de tu empresa",
  robots: { index: false, follow: true },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReclamarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = createAdminClient();

  /**
   * Se traen SÓLO campos que ya son públicos en la ficha.
   *
   * Nada de `email`, `telefono` ni `cuit`: si esta pantalla los mostrara, se
   * convertiría en un scraper de contactos con URL adivinable. Lo que se ve acá
   * no dice más de lo que dice /empresas/{slug} sin sesión.
   */
  const { data: empresa } = await db
    .from("empresas")
    .select("id, razon_social, nombre_comercial, localidad, ruta_logo, bucket_logo, estado")
    .eq("id", id)
    .eq("estado", "aprobada")
    .maybeSingle();

  if (!empresa) notFound();

  const nombre = empresa.nombre_comercial?.trim() || empresa.razon_social.trim();
  const logoUrl =
    empresa.bucket_logo && empresa.ruta_logo
      ? db.storage.from(empresa.bucket_logo).getPublicUrl(empresa.ruta_logo).data.publicUrl
      : null;

  return (
    <div className="min-h-svh bg-[#f7f9fb] py-12 sm:py-20">
      <div className="mx-auto w-full max-w-xl px-4 sm:px-6">
        <FormularioReclamo
          empresaId={empresa.id}
          nombre={nombre}
          localidad={empresa.localidad}
          logoUrl={logoUrl}
        />
      </div>
    </div>
  );
}
