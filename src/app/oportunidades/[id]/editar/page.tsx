import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { FormularioOportunidad } from "../../nueva/FormularioOportunidad";
import { oportunidadSiEsPropia } from "@/modulos/oportunidades/guard-duena";
import { listarAdjuntosDeOportunidad } from "@/modulos/oportunidades/adjuntos-servidor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Edición de una oportunidad propia. Reutiliza el formulario de creación en
 * modo "editar": mismos campos, mismo parser del lado del servidor.
 */
export default async function EditarOportunidadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) redirect("/oportunidades");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?callbackUrl=/oportunidades/${id}/editar`);

  // El guard resuelve la ficha real del perfil y exige que la oportunidad sea
  // suya. Un tercero con el link cae al detalle, no a un 403 críptico.
  const guard = await oportunidadSiEsPropia(id);
  if ("error" in guard) redirect(`/oportunidades/${id}`);
  const { op } = guard;

  const admin = createAdminClient();
  const [{ data: categorias }, { data: tags }, { data: tagsDeLaOp }, adjuntos] =
    await Promise.all([
      admin.from("categorias").select("id, nombre").eq("activa", true).order("nombre"),
      admin
        .from("tags")
        .select("id, nombre, tipo_tag")
        .eq("activo", true)
        .eq("administrado_por_admin", true)
        .order("nombre"),
      admin.from("oportunidades_tags").select("tag_id").eq("oportunidad_id", id),
      listarAdjuntosDeOportunidad(id),
    ]);

  const tagIds = (tagsDeLaOp ?? []).map((fila) => fila.tag_id as string);

  // Las etiquetas LIBRES que la socia escribió al publicar no están en el
  // catálogo curado (`administrado_por_admin = true`), así que el selector no
  // las encontraba: no se veían como chip y no había forma de quitarlas, pero
  // seguían viajando al guardar. Se suman al catálogo que recibe el formulario.
  const idsDelCatalogo = new Set((tags ?? []).map((tag) => tag.id as string));
  const idsLibres = tagIds.filter((tagId) => !idsDelCatalogo.has(tagId));
  const { data: tagsLibres } = idsLibres.length
    ? await admin.from("tags").select("id, nombre, tipo_tag").in("id", idsLibres)
    : { data: [] };

  const catalogo = [...(tags ?? []), ...(tagsLibres ?? [])];

  return (
    <div className="min-h-svh bg-slate-50 pb-16">
      <div className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#00213f] text-white shadow-[0_28px_60px_-32px_rgba(0,33,63,0.75)]">
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0b2d4d] to-[#123a63]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative p-6 sm:px-9 sm:py-7 lg:px-10">
            <Link
              href={`/oportunidades/${id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al detalle
            </Link>

            <div className="mt-4 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-black/25">
                <PencilLine className="h-6 w-6" />
              </span>
              <div>
                <h1
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                  className="text-3xl font-black leading-tight tracking-tight"
                >
                  Editar oportunidad
                </h1>
                <p
                  className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/65"
                  style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                >
                  Los cambios se publican al instante y el cruce con la red se
                  recalcula con las etiquetas nuevas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FormularioOportunidad
          categorias={categorias || []}
          tags={catalogo}
          modo="editar"
          oportunidadId={id}
          adjuntosIniciales={adjuntos}
          inicial={{
            titulo: op.titulo,
            descripcionHtml: op.descripcion,
            categoria_id: op.categoria_id,
            localidad: op.localidad,
            cantidad: op.cantidad,
            unidad: op.unidad,
            fecha_necesidad: op.fecha_necesidad,
            tipoRequerimiento: op.tipo_requerimiento ?? [],
            tagIds,
          }}
        />
      </div>
    </div>
  );
}
