import type { Metadata } from "next";
import Image from "next/image";
import { Megaphone, Pin } from "lucide-react";
import { Migas } from "@/components/ui/migas";
import { getComunicadosPublicados } from "@/modulos/boletin/consultas";

/**
 * El Boletín UIAB completo: todas las noticias y avisos que publicó la UIAB,
 * no sólo los últimos que se ven en el panel.
 *
 * Sólo para socias: el middleware la trata como ruta protegida (sesión +
 * cuenta aprobada, igual que /panel-de-control) y next.config le pone
 * `noindex`. Por eso no está en el sitemap ni tiene canonical/OG.
 *
 * Dinámica porque este contenido lo carga alguien de la UIAB en cualquier
 * momento y tiene que verse al toque en cada visita.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boletín UIAB",
  description: "Noticias y avisos de la Unión Industrial de Almirante Brown.",
  robots: { index: false, follow: true },
};

function fechaLegible(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BoletinPage() {
  const comunicados = await getComunicadosPublicados();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Migas migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Boletín" }]} className="mb-6" />

      <header className="mb-10 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Megaphone className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="font-poppins text-2xl font-bold tracking-tight text-[#00213f]">
            Boletín UIAB
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Noticias y avisos de la Unión Industrial de Almirante Brown.
          </p>
        </div>
      </header>

      {comunicados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-500">Todavía no hay comunicados publicados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comunicados.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_-6px_rgba(0,33,63,0.06)]"
            >
              {c.imagenUrl && (
                <div className="relative h-56 w-full bg-slate-100 sm:h-72">
                  <Image
                    src={c.imagenUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <time
                    dateTime={c.publicado_en ?? undefined}
                    className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400"
                  >
                    {fechaLegible(c.publicado_en)}
                  </time>
                  {c.fijado && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-sky-600">
                      <Pin className="h-3 w-3" /> Fijado
                    </span>
                  )}
                </div>
                <h2 className="font-poppins text-xl font-bold tracking-tight text-[#00213f]">
                  {c.titulo}
                </h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">
                  {c.cuerpo}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
