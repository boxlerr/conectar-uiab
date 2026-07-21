"use client";

// Aviso que ve la socia en su panel cuando los datos que cargó en /sumate no
// coinciden con los que UIAB ya tenía en el padrón. Le mostramos las dos
// versiones y elige cuál queda en su ficha pública.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Check, X } from "lucide-react";
import type { ConflictoPadron, OrigenDato } from "../padron";
import { descartarConflictosPadron, resolverConflictoPadron } from "../conflictos";

const ORIGEN_ETIQUETA: Record<OrigenDato, string> = {
  formulario: "Lo que cargaste",
  padron: "Lo que figura en UIAB",
};

export function AvisoConflictosPadron({
  conflictos,
  onResuelto,
}: {
  conflictos: ConflictoPadron[];
  /**
   * Se llama después de cambiar un dato. Necesario donde la página ya tenía
   * cargados los datos de la empresa en estado local (`/perfil/datos`): sin
   * esto el formulario queda con el valor viejo y al guardar lo pisa.
   */
  onResuelto?: () => void;
}) {
  const router = useRouter();
  const [pendientes, setPendientes] = useState(conflictos);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (pendientes.length === 0) return null;

  async function elegir(conflicto: ConflictoPadron, eleccion: OrigenDato) {
    setGuardando(conflicto.campo);
    const res = await resolverConflictoPadron(conflicto.campo, eleccion).catch(() => null);
    setGuardando(null);

    if (!res) return toast.error("No se pudo guardar. Probá de nuevo.");
    if (res.error) return toast.error(res.error);

    setPendientes((prev) => prev.filter((c) => c.campo !== conflicto.campo));
    toast.success(`${conflicto.etiqueta} actualizado`);
    onResuelto?.();
    startTransition(() => router.refresh());
  }

  async function descartar() {
    setGuardando("__todos__");
    const res = await descartarConflictosPadron().catch(() => null);
    setGuardando(null);

    if (!res) return toast.error("No se pudo guardar. Probá de nuevo.");
    if (res.error) return toast.error(res.error);

    setPendientes([]);
    startTransition(() => router.refresh());
  }

  return (
    <section className="bg-white border border-amber-200 rounded-lg overflow-hidden mb-6">
      <div className="flex items-start gap-3 px-6 py-4 bg-amber-50/70 border-b border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-manrope font-bold text-[#00213f] text-[15px]">
            Revisá los datos de tu empresa
          </h2>
          <p className="text-slate-600 text-[13px] leading-relaxed mt-0.5">
            Algunos datos que cargaste en el formulario no coinciden con los que UIAB tenía
            registrados. Elegí cuál querés que aparezca en tu ficha del directorio.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {pendientes.map((c) => (
          <li key={c.campo} className="px-6 py-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2.5">
              {c.etiqueta}
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {(["formulario", "padron"] as const).map((origen) => {
                const valor = origen === "formulario" ? c.valor_formulario : c.valor_padron;
                const esActual = c.aplicado === origen;
                return (
                  <button
                    key={origen}
                    type="button"
                    disabled={guardando !== null}
                    onClick={() => elegir(c, origen)}
                    className="group text-left border border-slate-200 hover:border-[#00213f] rounded-md px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                        {ORIGEN_ETIQUETA[origen]}
                      </span>
                      {esActual && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm px-1.5 py-px uppercase tracking-wider">
                          Actual
                        </span>
                      )}
                    </span>
                    <span className="block text-slate-700 font-semibold text-[14px] break-words group-hover:text-[#00213f]">
                      {valor}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00213f] uppercase tracking-[0.12em] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-3 h-3" />
                      Usar este
                    </span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          disabled={guardando !== null}
          onClick={descartar}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          Está todo bien así, no cambiar nada
        </button>
      </div>
    </section>
  );
}
