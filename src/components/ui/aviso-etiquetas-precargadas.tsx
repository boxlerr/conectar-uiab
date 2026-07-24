"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Tag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/cliente";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";

/**
 * Aviso "te pre-cargamos etiquetas de match".
 *
 * El equipo cargó etiquetas a las socias del padrón (empresas_tags con
 * origen 'inferido', deducidas del rubro). Este banner se muestra en el
 * dashboard y en Mi Resumen mientras la empresa tenga etiquetas inferidas
 * sin revisar, y desaparece SOLO en dos casos:
 *   - la socia guarda sus etiquetas en /perfil/etiquetas (saveTags reescribe
 *     todo con origen 'manual'), o
 *   - lo cierra con la X (se recuerda por dispositivo).
 */
const CLAVE_OCULTO = "uiab_aviso_etiquetas_precargadas_oculto";

export function AvisoEtiquetasPrecargadas() {
  const { currentUser } = useAuth();
  const [cantidad, setCantidad] = useState(0);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    setOculto(localStorage.getItem(CLAVE_OCULTO) === "1");
  }, []);

  useEffect(() => {
    if (!currentUser?.entityId || currentUser.role !== "company") return;
    let vivo = true;
    (async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("empresas_tags")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", currentUser.entityId)
          .eq("origen", "inferido");
        if (vivo) setCantidad(count ?? 0);
      } catch {
        // Best-effort: si la query falla no mostramos nada.
      }
    })();
    return () => {
      vivo = false;
    };
  }, [currentUser?.entityId, currentUser?.role]);

  if (oculto || cantidad === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50/60 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-start gap-3.5 pr-8">
        <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
          <Tag className="w-[18px] h-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm">
            Le cargamos {cantidad} etiquetas de match a tu perfil
          </p>
          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
            Las dedujimos del rubro de tu empresa para que ya aparezcas en búsquedas y
            coincidencias de oportunidades. Podés ajustarlas cuando quieras.
          </p>
          <Link
            href="/perfil/etiquetas"
            className="inline-flex items-center gap-1.5 mt-2.5 text-sm font-bold text-sky-700 hover:text-sky-900 transition-colors"
          >
            Revisar mis etiquetas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-label="Ocultar aviso"
        onClick={() => {
          localStorage.setItem(CLAVE_OCULTO, "1");
          setOculto(true);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
