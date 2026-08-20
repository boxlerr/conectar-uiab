"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, X, RefreshCw, CheckCircle2, AlertTriangle, Gift, Ban, HelpCircle, CalendarClock } from "lucide-react";
import { toast } from "sonner";

/**
 * Conciliar los cobros del plan recurrente de Sipago.
 *
 * El plan debita solo todos los meses, pero Sipago no avisa: ese módulo del
 * portal no tiene webhook ni API pública. Así que una vez por mes alguien entra
 * a portal.sipago.coop → Suscripciones → Cobros, genera el reporte y lo pega
 * acá. El cruce es por CUIT.
 *
 * SIEMPRE HAY PREVIEW ANTES DE ESCRIBIR. Esto registra plata contra fichas de
 * socios reales y el reporte se lee por contenido —no por nombre de columna—,
 * así que alguien tiene que mirar la lista antes de confirmar. El botón de
 * aplicar recién aparece cuando hay algo que aplicar.
 */

type Accion =
  | "activar" | "primer_cobro_anual" | "ya_registrado"
  | "cuit_desconocido" | "rechazado" | "cortesia" | "monto_no_coincide";

interface Resultado {
  cuit: string;
  nombre: string | null;
  monto: number | null;
  fecha: string | null;
  accion: Accion;
  detalle: string;
}

const ESTILOS: Record<Accion, { icono: React.ReactNode; etiqueta: string; clase: string }> = {
  activar:            { icono: <CheckCircle2 className="w-4 h-4" />,   etiqueta: "Activar",        clase: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  primer_cobro_anual: { icono: <CalendarClock className="w-4 h-4" />,  etiqueta: "1er a\u00f1o prorrateado", clase: "text-sky-700 bg-sky-50 border-sky-200" },
  ya_registrado:      { icono: <RefreshCw className="w-4 h-4" />,      etiqueta: "Ya estaba",      clase: "text-slate-600 bg-slate-50 border-slate-200" },
  cortesia:           { icono: <Gift className="w-4 h-4" />,           etiqueta: "Cortesía",       clase: "text-violet-700 bg-violet-50 border-violet-200" },
  cuit_desconocido:   { icono: <HelpCircle className="w-4 h-4" />,     etiqueta: "CUIT sin socio", clase: "text-amber-700 bg-amber-50 border-amber-200" },
  monto_no_coincide:  { icono: <AlertTriangle className="w-4 h-4" />,  etiqueta: "Monto raro",     clase: "text-amber-700 bg-amber-50 border-amber-200" },
  rechazado:          { icono: <Ban className="w-4 h-4" />,            etiqueta: "No cobrado",     clase: "text-rose-700 bg-rose-50 border-rose-200" },
};

const pesos = (n: number | null) =>
  n === null ? "—" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export function ModalConciliarSipago({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [aplicado, setAplicado] = useState(false);
  const [ignoradas, setIgnoradas] = useState(0);

  async function enviar(aplicar: boolean) {
    setCargando(true);
    try {
      const res = await fetch("/api/admin/suscripciones/conciliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, aplicar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos leer el reporte");

      setResultados(data.resultados as Resultado[]);
      setIgnoradas(data.ignoradas ?? 0);
      setAplicado(aplicar);

      if (aplicar) {
        toast.success(`${data.resumen.activar} suscripción(es) activadas`);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  // El prorrateado tambien activa: si no se aplicara, el socio anual paga, tiene
  // el debito automatico andando y queda sin acceso.
  const aActivar = (resultados ?? []).filter(
    (r) => r.accion === "activar" || r.accion === "primer_cobro_anual"
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Cerrar">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center border border-primary-200 flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Conciliar cobros de Sipago</h2>
            <p className="text-sm text-slate-500 mt-1">
              Entrá a <strong>portal.sipago.coop → Suscripciones → Cobros</strong>, generá el reporte y pegalo acá.
              Cruzamos por CUIT.
            </p>
          </div>
        </div>

        <textarea
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setResultados(null); setAplicado(false); }}
          rows={7}
          placeholder={"Pegá el reporte tal cual, con encabezados y todo.\n\nEjemplo:\nCliente;CUIT;Fecha;Monto;Estado\nMETALURGICA SA;30-71161518-7;20/08/2026;50.000,00;APROBADO"}
          className="w-full rounded-lg border border-slate-200 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        {resultados && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {resultados.length} fila(s) con CUIT{ignoradas > 0 && ` · ${ignoradas} ignorada(s)`}
              </span>
              {!aplicado && aActivar > 0 && (
                <span className="font-semibold text-emerald-700">{aActivar} para activar</span>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {resultados.map((r, i) => {
                const e = ESTILOS[r.accion];
                return (
                  <div key={`${r.cuit}-${i}`} className="flex items-start gap-3 p-3 text-sm">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium flex-shrink-0 ${e.clase}`}>
                      {e.icono} {e.etiqueta}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{r.nombre || r.cuit}</p>
                      <p className="text-xs text-slate-500">
                        {r.cuit} · {pesos(r.monto)} · {r.fecha ?? "sin fecha"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.detalle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            {aplicado ? "Cerrar" : "Cancelar"}
          </Button>

          {!aplicado && (
            <Button onClick={() => enviar(false)} disabled={cargando || !texto.trim()} variant={resultados ? "outline" : "default"}>
              {cargando && !resultados ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Leyendo...</> : "Ver qué haría"}
            </Button>
          )}

          {resultados && !aplicado && aActivar > 0 && (
            <Button onClick={() => enviar(true)} disabled={cargando}>
              {cargando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aplicando...</> : `Confirmar ${aActivar} pago(s)`}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
