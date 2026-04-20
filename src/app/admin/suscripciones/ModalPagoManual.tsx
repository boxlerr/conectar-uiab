"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, X, Banknote } from "lucide-react";
import { toast } from "sonner";

type EmpresaLite = { id: string; razon_social: string; tarifa?: number | null };
type ProveedorLite = { id: string; nombre: string; apellido: string | null };

const TARIFA_MONTOS_FALLBACK: Record<number, number> = { 1: 108_000, 2: 216_000, 3: 360_000 };
const PARTICULAR_MENSUAL = 5_000;

export function ModalPagoManual({
  empresas,
  proveedores,
  preciosPorNivel,
  onClose,
}: {
  empresas: EmpresaLite[];
  proveedores: ProveedorLite[];
  preciosPorNivel?: Record<number, number>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"empresa" | "proveedor">("empresa");
  const [entidadId, setEntidadId] = useState("");
  const [metodo, setMetodo] = useState<"efectivo" | "cheque" | "cortesia">("efectivo");
  const [monto, setMonto] = useState<string>("");
  const [pagadoEn, setPagadoEn] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const precios = preciosPorNivel ?? TARIFA_MONTOS_FALLBACK;

  function autoMonto(id: string, t: "empresa" | "proveedor") {
    if (t === "proveedor") {
      setMonto(String(PARTICULAR_MENSUAL));
      return;
    }
    const emp = empresas.find((e) => e.id === id);
    if (emp?.tarifa) setMonto(String(precios[emp.tarifa] ?? TARIFA_MONTOS_FALLBACK[emp.tarifa] ?? 0));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entidadId || !monto || !pagadoEn) {
      toast.error("Completá los datos requeridos");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/suscripciones/pago-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_id: tipo === "empresa" ? entidadId : undefined,
          proveedor_id: tipo === "proveedor" ? entidadId : undefined,
          metodo,
          monto: Number(monto),
          pagado_en: new Date(pagadoEn).toISOString(),
          nota: nota || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error registrando pago");
      toast.success("Pago manual registrado");
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Registrar pago manual</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={() => { setTipo("empresa"); setEntidadId(""); }}
                className={`py-2 rounded border text-sm font-medium ${tipo === "empresa" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600"}`}>
                Empresa
              </button>
              <button type="button" onClick={() => { setTipo("proveedor"); setEntidadId(""); }}
                className={`py-2 rounded border text-sm font-medium ${tipo === "proveedor" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600"}`}>
                Particular
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {tipo === "empresa" ? "Empresa" : "Particular"}
            </label>
            <select
              value={entidadId}
              onChange={(e) => { setEntidadId(e.target.value); autoMonto(e.target.value, tipo); }}
              className="mt-1 w-full h-10 rounded border border-slate-200 px-3 text-sm"
              required
            >
              <option value="">Seleccionar...</option>
              {tipo === "empresa"
                ? empresas.map((e) => <option key={e.id} value={e.id}>{e.razon_social}</option>)
                : proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ""}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Método</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as any)}
                className="mt-1 w-full h-10 rounded border border-slate-200 px-3 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="cortesia">Cortesía</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha del pago</label>
              <Input type="date" value={pagadoEn} onChange={(e) => setPagadoEn(e.target.value)} required className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto (ARS)</label>
            <Input type="number" min={0} step={1} value={monto} onChange={(e) => setMonto(e.target.value)} required className="mt-1" />
            <p className="text-xs text-slate-500 mt-1">
              Se autocarga según la tarifa de la entidad. Podés ajustarlo si corresponde.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nota (opcional)</label>
            <Input
              type="text"
              placeholder="Ej: Cheque 0001 Banco Galicia"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</> : "Registrar pago"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
