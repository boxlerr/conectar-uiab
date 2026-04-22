"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { postularseAOportunidad } from "./acciones";

interface Props {
  oportunidadId: string;
  tituloOportunidad: string;
  sugerenciaCantidad?: number | null;
  sugerenciaUnidad?: string | null;
  /** Estado actual de la postulación del usuario (si ya existe). */
  yaPostulado?: { id: string; estado: string } | null;
  /** Callback cuando la postulación se envía con éxito (refresca UI). */
  onPostulado?: () => void;
}

const ESTADO_LABEL: Record<string, string> = {
  enviada: "Enviada — esperando respuesta",
  vista: "Vista por el solicitante",
  respondida: "¡Te respondieron!",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export default function DialogoPostularse({
  oportunidadId,
  tituloOportunidad,
  sugerenciaCantidad,
  sugerenciaUnidad,
  yaPostulado,
  onPostulado,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState("");
  const [cantidad, setCantidad] = useState<string>(
    sugerenciaCantidad != null ? String(sugerenciaCantidad) : ""
  );
  const [unidad, setUnidad] = useState<string>(sugerenciaUnidad ?? "");

  // Si ya se postuló, mostrar chip informativo en vez del botón
  if (yaPostulado) {
    return (
      <div className="w-full sm:w-80 h-14 flex items-center gap-3 px-6 bg-emerald-50 border border-emerald-200 rounded-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
            Postulación
          </p>
          <p className="text-sm font-manrope font-bold text-[#00213f] truncate">
            {ESTADO_LABEL[yaPostulado.estado] ?? yaPostulado.estado}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    const cantidadNum =
      cantidad.trim().length > 0 && !isNaN(Number(cantidad)) ? Number(cantidad) : null;

    startTransition(async () => {
      const res = await postularseAOportunidad(
        oportunidadId,
        mensaje,
        cantidadNum,
        unidad.trim() || null
      );

      if (res.success) {
        toast.success("Postulación enviada", {
          description: "El solicitante ya puede ver tu mensaje.",
        });
        setOpen(false);
        setMensaje("");
        onPostulado?.();
      } else {
        toast.error("No se pudo enviar", { description: res.error });
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-[#00213f] hover:bg-[#10375c] text-white font-bold h-14 rounded-sm shadow-xl shadow-primary-900/10 transition-all font-inter uppercase tracking-widest text-xs"
      >
        Postularse a esta oportunidad
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="bg-white rounded-sm shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Postularse
                </p>
                <h3 className="text-2xl font-manrope font-bold text-[#00213f] tracking-tight leading-tight">
                  {tituloOportunidad}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Mensaje al solicitante *
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={5}
                  placeholder="Ej.: Tenemos 15 años de experiencia en el rubro y podemos cumplir con la fecha solicitada. Disponemos de..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm font-inter focus:outline-none focus:border-primary-500 focus:bg-white transition-all resize-none"
                />
                <p className="text-xs text-slate-400 mt-2 font-inter">
                  Presentate en pocas líneas. Este texto llega al solicitante junto con tus datos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Cantidad (opcional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm font-inter focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Unidad (opcional)
                  </label>
                  <input
                    type="text"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    placeholder="kg, unidades, hs..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm font-inter focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-0 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-12 px-8 rounded-sm border-slate-200 font-bold text-slate-600 font-inter uppercase tracking-widest text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || mensaje.trim().length < 5}
                className="h-12 px-8 bg-[#00213f] hover:bg-[#10375c] text-white font-bold rounded-sm font-inter uppercase tracking-widest text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Enviar postulación
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
