import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";
import { getRole } from "@/lib/autenticacion/obtener-rol";
import { getComunicadoPublicado, getComunicadosPublicados } from "@/modulos/boletin/consultas";
import { Articulo } from "@/modulos/boletin/componentes/articulo";
import { resumenComunicado, rutaComunicado, tiempoCorto } from "@/modulos/boletin/formato";
import type { ComunicadoPublico } from "@/modulos/boletin/tipos";

/**
 * Una publicación del Boletín leída entera, en formato de nota (ver
 * `Articulo`), con "Más novedades" abajo para seguir leyendo. Es el link que
 * se puede pasar por WhatsApp a otra socia.
 *
 * Mismo acceso que /boletin (el middleware protege todo `/boletin*`, y
 * next.config le pone `noindex`). Un borrador o un id que no existe dan 404:
 * `getComunicadoPublicado` sólo devuelve lo publicado.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getComunicadoPublicado(id);
  return {
    title: c ? `${resumenComunicado(c)} · Boletín UIAB` : "Boletín UIAB",
    robots: { index: false, follow: true },
  };
}

function MasNovedades({ comunicados }: { comunicados: ComunicadoPublico[] }) {
  if (comunicados.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 px-1 font-poppins text-lg font-bold tracking-tight text-[#00213f]">
        Más novedades
      </h2>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
        {comunicados.map((c) => (
          <Link
            key={c.id}
            href={rutaComunicado(c.id)}
            className="group flex items-center gap-4 p-4 transition-colors hover:bg-slate-50"
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {c.imagenUrl ? (
                <Image src={c.imagenUrl} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-slate-300">
                  <Megaphone className="h-6 w-6" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-sky-800">
                {resumenComunicado(c)}
              </p>
              <p className="mt-1 text-[12.5px] text-slate-500" suppressHydrationWarning>
                {tiempoCorto(c.publicado_en)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function ComunicadoPage({ params }: Props) {
  const { id } = await params;
  const [c, recientes, rol] = await Promise.all([
    getComunicadoPublicado(id),
    getComunicadosPublicados(4),
    getRole(),
  ]);
  if (!c) notFound();

  const otros = recientes.filter((r) => r.id !== c.id).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 lg:py-8">
      <Link
        href="/boletin"
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-[#00213f] transition-colors hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Boletín
      </Link>
      <Articulo c={c} esAdmin={rol === "admin"} />
      <MasNovedades comunicados={otros} />
    </div>
  );
}
