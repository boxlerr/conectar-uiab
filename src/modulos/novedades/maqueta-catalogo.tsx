import { Check, ImagePlus } from "lucide-react";

/**
 * Maqueta del cartel del arreglo de "Crear ítem".
 *
 * ES UN DIBUJO, NO DATOS: el pie del formulario de un ítem, con la foto ya
 * subida y el botón que termina. Sin nombre de producto ni de empresa — igual
 * que `maqueta-panel.tsx`, no afirma nada sobre el padrón.
 */
export function MaquetaCatalogo() {
  return (
    <div aria-hidden className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-primary-100 text-primary-500">
          <ImagePlus className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-2.5 w-3/4 rounded-full bg-slate-200" />
          <div className="h-2 w-1/2 rounded-full bg-slate-200/70" />
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div className="h-full w-full rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <Check className="h-3 w-3" />
          Creado con éxito
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white">
          <Check className="h-3.5 w-3.5" />
          Crear ítem
        </span>
      </div>
    </div>
  );
}
