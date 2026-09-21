import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { getRole } from "@/lib/autenticacion/obtener-rol";
import { getComunicadosPublicados } from "@/modulos/boletin/consultas";
import { Compositor } from "@/modulos/boletin/componentes/compositor";
import { Publicacion } from "@/modulos/boletin/componentes/publicacion";

/**
 * El Boletín UIAB: las novedades de la UIAB en formato de red social —una
 * columna de publicaciones, como el feed de LinkedIn o Facebook—, con las
 * fijadas arriba y después de la más nueva a la más vieja.
 *
 * Sólo para socias: el middleware la trata como ruta protegida (sesión +
 * cuenta aprobada, igual que /panel-de-control) y next.config le pone
 * `noindex`. Por eso no está en el sitemap ni tiene canonical/OG.
 *
 * Un admin ve además el cuadro para publicar y el menú ··· de cada
 * publicación. Dinámica porque se publica en cualquier momento y tiene que
 * verse al toque.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boletín UIAB",
  description: "Noticias y avisos de la Unión Industrial de Almirante Brown.",
  robots: { index: false, follow: true },
};

export default async function BoletinPage() {
  const [comunicados, rol] = await Promise.all([getComunicadosPublicados(), getRole()]);
  const esAdmin = rol === "admin";

  return (
    <div className="mx-auto w-full max-w-[640px] px-3 py-8 sm:px-4 lg:py-10">
      <header className="mb-5 flex items-center gap-3 px-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Megaphone className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="font-poppins text-xl font-bold tracking-tight text-[#00213f]">
            Boletín UIAB
          </h1>
          <p className="text-[13px] text-slate-500">Novedades de la Unión Industrial para las socias.</p>
        </div>
      </header>

      <div className="space-y-4">
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
      </div>
    </div>
  );
}
