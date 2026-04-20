"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function CheckoutSuscripcionPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
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
      const res = await fetch("/api/mercadopago/crear-preapproval", { method: "POST" });
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

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-700 mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Activá tu suscripción</h1>
        <p className="text-slate-600 mt-2">
          Para aparecer en el directorio UIAB Conecta necesitás completar el pago de tu suscripción mensual.
        </p>
      </div>

      <Card className="p-8 shadow-lg border-slate-100">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 flex-shrink-0">
              <CreditCard className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Pago mensual con Mercado Pago</p>
              <p className="text-sm text-slate-500">Cobro automático todos los meses. Podés cancelar cuando quieras.</p>
            </div>
          </div>

          {monto !== null && (
            <div className="rounded-lg bg-slate-50 p-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{formatARS(monto)}</span>
              <span className="text-slate-500">/ mes (ARS)</span>
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
