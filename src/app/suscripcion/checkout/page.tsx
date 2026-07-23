"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utilidades";
import { Loader2, CreditCard, ShieldCheck, AlertCircle, Check } from "lucide-react";
import {
  PRECIO_MENSUAL,
  PRECIO_ANUAL,
  type CicloSuscripcion,
} from "@/lib/mercadopago/suscripciones";

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// 50.000 × 12 = 600.000 vs 500.000 → ahorro anual.
const AHORRO_ANUAL = PRECIO_MENSUAL * 12 - PRECIO_ANUAL;

export default function CheckoutSuscripcionPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ciclo, setCiclo] = useState<CicloSuscripcion>("mensual");
  const [monto, setMonto] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/login?next=/suscripcion/checkout");
    }
  }, [authLoading, currentUser, router]);

  async function iniciarPago() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mercadopago/crear-preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciclo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando suscripción");
      setMonto(data.monto);
      window.location.href = data.init_point;
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      setLoading(false);
    }
  }

  if (authLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const opciones: Array<{
    valor: CicloSuscripcion;
    titulo: string;
    precio: number;
    unidad: string;
    badge?: string;
  }> = [
    { valor: "mensual", titulo: "Mensual", precio: PRECIO_MENSUAL, unidad: "/ mes" },
    {
      valor: "anual",
      titulo: "Anual",
      precio: PRECIO_ANUAL,
      unidad: "/ año",
      badge: `Ahorrás ${formatARS(AHORRO_ANUAL)}`,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-700 mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Activá tu suscripción</h1>
        <p className="text-slate-600 mt-2">
          Para aparecer en el directorio UIAB Conecta necesitás completar el pago de tu suscripción.
        </p>
      </div>

      <Card className="p-8 shadow-lg border-slate-100">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 flex-shrink-0">
              <CreditCard className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Pago con Mercado Pago</p>
              <p className="text-sm text-slate-500">
                {ciclo === "anual"
                  ? "Cobro automático todos los años. Podés cancelar cuando quieras."
                  : "Cobro automático todos los meses. Podés cancelar cuando quieras."}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Elegí tu ciclo de pago</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Ciclo de pago">
              {opciones.map((op) => {
                const activa = ciclo === op.valor;
                return (
                  <button
                    key={op.valor}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    onClick={() => setCiclo(op.valor)}
                    className={cn(
                      "relative text-left rounded-xl border p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                      activa
                        ? "border-primary-600 bg-primary-50 ring-1 ring-primary-600 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className={cn("font-semibold", activa ? "text-primary-700" : "text-slate-900")}>
                        {op.titulo}
                      </span>
                      <span
                        className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full border transition-colors",
                          activa ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300 bg-white"
                        )}
                      >
                        {activa && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </span>
                    <span className="mt-2 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{formatARS(op.precio)}</span>
                      <span className="text-sm text-slate-500">{op.unidad}</span>
                    </span>
                    {op.badge && (
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {op.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {monto !== null && (
            <div className="rounded-lg bg-slate-50 p-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{formatARS(monto)}</span>
              <span className="text-slate-500">{ciclo === "anual" ? "/ año (ARS)" : "/ mes (ARS)"}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button size="lg" className="w-full" onClick={iniciarPago} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirigiendo...</> : "Pagar con Mercado Pago"}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Serás redirigido a Mercado Pago para completar el pago de forma segura.
          </p>
        </div>
      </Card>

      <div className="text-center mt-6">
        <button onClick={() => router.push("/perfil")} className="text-sm text-slate-500 hover:text-slate-700 underline">
          Completar esto más tarde
        </button>
      </div>
    </div>
  );
}
