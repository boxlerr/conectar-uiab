"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote, Building, Wrench, Search, Pencil, Check, X, Gift,
  AlertTriangle, CalendarClock, Wallet, TrendingUp, RefreshCw,
} from "lucide-react";
import { ModalPagoManual } from "./ModalPagoManual";
import { ModalConciliarSipago } from "./ModalConciliarSipago";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectUIAB } from "@/components/ui/select-uiab";
import { actualizarPrecios } from "@/modulos/admin/acciones";
import { fallo, llamarAccion } from "@/lib/accion-segura";
import { toast } from "sonner";
import {
  aporteAnual,
  aporteMensual,
  ahorroAnual,
  equivalenteMensual,
  mesesGratis,
  type Precios,
} from "@/lib/suscripciones/modelo";

export type FilaSocio = {
  id: string;
  tipo: "empresa" | "particular";
  nombre: string;
  email: string | null;
  /** Socia de la UIAB: no paga, tiene acceso de cortesía. */
  esSociaUiab: boolean;
  creadoEn: string;
  logoUrl: string | null;
  estadoSuscripcion: string | null;
  monto: number;
  ciclo: string | null;
  metodoPago: string | null;
  proximoCobro: string | null;
  graciaHasta: string | null;
};

export type Pago = {
  id: string;
  empresa_id: string | null;
  proveedor_id: string | null;
  monto: number | string | null;
  moneda: string | null;
  estado: string | null;
  metodo_pago: string | null;
  pagado_en: string | null;
  creado_en: string;
};

const pesos = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const pesosCorto = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `$${(n / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}K`;
  return pesos(n);
};

const fecha = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Cortesía, al día, vencido o sin suscripción: lo que hay que ver de un vistazo. */
type Situacion = "cortesia" | "al_dia" | "vence_pronto" | "en_mora" | "sin_pagar" | "sin_suscripcion";

function situacionDe(s: FilaSocio): Situacion {
  if (!s.estadoSuscripcion) return "sin_suscripcion";
  if (s.esSociaUiab || s.metodoPago === "cortesia" || (s.estadoSuscripcion === "activa" && s.monto === 0)) {
    return "cortesia";
  }
  if (s.estadoSuscripcion === "en_mora") return "en_mora";
  if (s.estadoSuscripcion !== "activa") return "sin_pagar";
  if (s.proximoCobro) {
    const dias = (new Date(s.proximoCobro).getTime() - Date.now()) / 86_400_000;
    if (dias < 0) return "en_mora";
    if (dias <= 15) return "vence_pronto";
  }
  return "al_dia";
}

const SITUACION: Record<Situacion, { label: string; chip: string }> = {
  cortesia:        { label: "Cortesía UIAB", chip: "bg-violet-100 text-violet-700" },
  al_dia:          { label: "Al día", chip: "bg-emerald-100 text-emerald-700" },
  vence_pronto:    { label: "Vence pronto", chip: "bg-amber-100 text-amber-700" },
  en_mora:         { label: "Vencida", chip: "bg-rose-100 text-rose-700" },
  sin_pagar:       { label: "Sin pagar", chip: "bg-slate-200 text-slate-600" },
  sin_suscripcion: { label: "Sin suscripción", chip: "bg-orange-100 text-orange-700" },
};

type Filtro = "todos" | "pagando" | "cortesia" | "problema";

export function PanelSuscripciones({
  socios,
  pagos,
  precios,
}: {
  socios: FilaSocio[];
  pagos: Pago[];
  precios: Precios;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalPago, setModalPago] = useState(false);
  const [modalConciliar, setModalConciliar] = useState(false);
  const [editandoPrecio, setEditandoPrecio] = useState(false);
  const [mensualDraft, setMensualDraft] = useState(String(precios.mensual));
  const [anualDraft, setAnualDraft] = useState(String(precios.anual));

  const [mes, setMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  function refresh() { startTransition(() => router.refresh()); }

  // ── Plata de verdad ────────────────────────────────────────────────────────
  //
  // Sólo suman las suscripciones activas CON monto. Las de cortesía valen 0 por
  // definición y contarlas como ingreso era lo que inflaba la cifra vieja.
  const conSuscripcion = socios.filter((s) => s.estadoSuscripcion);
  const pagando = socios.filter((s) => situacionDe(s) !== "cortesia" && s.estadoSuscripcion === "activa" && s.monto > 0);
  const cortesia = socios.filter((s) => situacionDe(s) === "cortesia");
  const conProblema = socios.filter((s) => ["en_mora", "sin_pagar", "sin_suscripcion"].includes(situacionDe(s)));

  const ingresoMensual = pagando.reduce((acc, s) => acc + aporteMensual(s.monto, s.ciclo), 0);
  const ingresoAnual = pagando.reduce((acc, s) => acc + aporteAnual(s.monto, s.ciclo), 0);
  const enAnual = pagando.filter((s) => s.ciclo === "anual").length;

  const cobradoTotal = pagos
    .filter((p) => p.estado === "aprobado" || p.estado === "acreditado")
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  const metricas = [
    {
      label: "Ingreso mensual real",
      valor: pesosCorto(ingresoMensual),
      sub: pagando.length === 0
        ? "Todavía no hay ninguna suscripción paga"
        : `${pagando.length} ${pagando.length === 1 ? "socio abonando" : "socios abonando"}${enAnual ? ` · ${enAnual} en anual` : ""}`,
      icon: TrendingUp,
      accent: "bg-primary-50 text-primary-700",
    },
    {
      label: "Proyección a 12 meses",
      valor: pesosCorto(ingresoAnual),
      sub: "Según el ciclo de cada uno, no mensual × 12",
      icon: CalendarClock,
      accent: "bg-blue-50 text-blue-700",
    },
    {
      label: "Cobrado hasta hoy",
      valor: pesosCorto(cobradoTotal),
      sub: pagos.length === 0 ? "No hay pagos registrados" : `${pagos.length} ${pagos.length === 1 ? "pago" : "pagos"} en el historial`,
      icon: Wallet,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Sin cargo",
      valor: String(cortesia.length),
      sub: "Socias UIAB con acceso de cortesía",
      icon: Gift,
      accent: "bg-violet-50 text-violet-700",
    },
  ];

  // ── Listado ────────────────────────────────────────────────────────────────
  const filtrados = socios.filter((s) => {
    const q = busqueda.trim().toLowerCase();
    const coincide = !q || s.nombre.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q);
    if (!coincide) return false;
    const sit = situacionDe(s);
    if (filtro === "pagando") return sit === "al_dia" || sit === "vence_pronto";
    if (filtro === "cortesia") return sit === "cortesia";
    if (filtro === "problema") return ["en_mora", "sin_pagar", "sin_suscripcion"].includes(sit);
    return true;
  });

  const TABS: { key: Filtro; label: string }[] = [
    { key: "problema", label: `A resolver (${conProblema.length})` },
    { key: "pagando", label: `Abonando (${pagando.length})` },
    { key: "cortesia", label: `Cortesía (${cortesia.length})` },
    { key: "todos", label: `Todos (${socios.length})` },
  ];

  // ── Pagos por mes ──────────────────────────────────────────────────────────
  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    pagos.forEach((p) => {
      const d = p.pagado_en ? new Date(p.pagado_en) : new Date(p.creado_en);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    set.add(mes);
    return Array.from(set).sort().reverse();
  }, [pagos, mes]);

  const pagosDelMes = pagos.filter((p) => {
    const d = p.pagado_en ? new Date(p.pagado_en) : new Date(p.creado_en);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mes;
  });
  const totalMes = pagosDelMes.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const nombrePorId = useMemo(
    () => Object.fromEntries(socios.map((s) => [s.id, s.nombre])),
    [socios]
  );

  async function guardarPrecios() {
    const m = parseInt(mensualDraft.replace(/\D/g, ""), 10);
    const a = parseInt(anualDraft.replace(/\D/g, ""), 10);
    const res = await llamarAccion(() => actualizarPrecios(m, a));
    if (fallo(res)) {
      toast.error("No se pudo guardar el precio", { description: res.error });
      return;
    }
    toast.success("Precio actualizado", {
      description: "Ya se ve así en la home, el registro y el panel de cada socio.",
    });
    setEditandoPrecio(false);
    refresh();
  }

  const preciosDraft: Precios = {
    mensual: parseInt(mensualDraft.replace(/\D/g, ""), 10) || 0,
    anual: parseInt(anualDraft.replace(/\D/g, ""), 10) || 0,
  };
  const preciosMostrados = editandoPrecio ? preciosDraft : precios;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Administración · Finanzas
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Suscripciones</h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm">
            Una sola suscripción para todos: {pesos(precios.mensual)} por mes, o {pesos(precios.anual)} por
            año. Las socias de la UIAB tienen acceso sin cargo.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setModalConciliar(true)}>
            <RefreshCw className="w-4 h-4" />
            Conciliar Sipago
          </Button>
          <Button className="gap-2" onClick={() => setModalPago(true)}>
            <Banknote className="w-4 h-4" />
            Registrar pago
          </Button>
        </div>
      </div>

      {modalConciliar && <ModalConciliarSipago onClose={() => setModalConciliar(false)} />}

      {modalPago && (
        <ModalPagoManual
          empresas={socios.filter((s) => s.tipo === "empresa").map((s) => ({ id: s.id, razon_social: s.nombre }))}
          proveedores={socios.filter((s) => s.tipo === "particular").map((s) => ({ id: s.id, nombre: s.nombre, apellido: null }))}
          precios={precios}
          onClose={() => setModalPago(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((m) => (
          <Card key={m.label} className="p-5 shadow-sm border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.accent}`}>
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">{m.valor}</p>
            <p className="text-xs text-slate-400 mt-1 leading-snug">{m.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── El precio, que ahora sí es el que se cobra ── */}
      <Card className="p-6 shadow-sm border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Precio vigente</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Lo que ve todo el mundo: la home, el registro, el checkout y el panel de cada socio.
            </p>
          </div>
          {editandoPrecio ? (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => {
                setEditandoPrecio(false);
                setMensualDraft(String(precios.mensual));
                setAnualDraft(String(precios.anual));
              }}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={guardarPrecios} disabled={isPending}>
                <Check className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditandoPrecio(true)}>
              <Pencil className="w-4 h-4 mr-1.5" /> Editar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mensual</p>
            {editandoPrecio ? (
              <Input
                type="number" min={0} step={1000} value={mensualDraft}
                onChange={(e) => setMensualDraft(e.target.value)}
                className="text-2xl font-bold h-12"
              />
            ) : (
              <p className="text-3xl font-bold text-slate-900">
                {pesos(precios.mensual)}<span className="text-base font-medium text-slate-400"> /mes</span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500 mb-2">Anual</p>
            {editandoPrecio ? (
              <Input
                type="number" min={0} step={1000} value={anualDraft}
                onChange={(e) => setAnualDraft(e.target.value)}
                className="text-2xl font-bold h-12"
              />
            ) : (
              <p className="text-3xl font-bold text-slate-900">
                {pesos(precios.anual)}<span className="text-base font-medium text-slate-400"> /año</span>
              </p>
            )}
            {preciosMostrados.mensual > 0 && preciosMostrados.anual > 0 && (
              <p className="text-xs text-primary-700 mt-2 font-medium">
                Equivale a {pesos(equivalenteMensual(preciosMostrados))}/mes ·{" "}
                {mesesGratis(preciosMostrados) > 0
                  ? `se ahorra ${pesos(ahorroAnual(preciosMostrados))}, o sea ${mesesGratis(preciosMostrados)} ${mesesGratis(preciosMostrados) === 1 ? "mes" : "meses"}`
                  : "sin ahorro respecto de pagar mes a mes"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Socios ── */}
      <Card className="p-3 flex flex-col lg:flex-row gap-3 lg:items-center shadow-sm border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setFiltro(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Socio</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Situación</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Próximo vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-500">
                    No hay socios con este filtro.
                  </td>
                </tr>
              ) : filtrados.map((s) => {
                const sit = situacionDe(s);
                const cfg = SITUACION[sit];
                return (
                  <tr key={`${s.tipo}-${s.id}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {s.tipo === "empresa"
                          ? <Building className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          : <Wrench className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                        <span className="font-semibold text-sm text-slate-900">{s.nombre}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[320px]">{s.email || "Sin correo"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.chip}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {sit === "cortesia" ? (
                        <span className="text-slate-400">Sin cargo</span>
                      ) : s.monto > 0 ? (
                        <span className="text-slate-800 font-medium">
                          {pesos(s.monto)}
                          <span className="text-slate-400 font-normal">{s.ciclo === "anual" ? " /año" : " /mes"}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {sit === "cortesia" ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className={sit === "en_mora" ? "text-rose-600 font-medium" : "text-slate-600"}>
                          {fecha(s.proximoCobro)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Pagos ── */}
      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-slate-400" /> Pagos registrados
          </h2>
          <div className="flex items-center gap-4">
            <SelectUIAB
              ariaLabel="Mes"
              value={mes}
              onValueChange={setMes}
              className="h-9 rounded border border-slate-200 px-3 text-sm"
              options={mesesDisponibles.map((m) => ({
                value: m,
                label: new Date(`${m}-01T12:00:00`).toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
              }))}
            />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total del mes</p>
              <p className="text-lg font-bold text-emerald-600">{pesos(totalMes)}</p>
            </div>
          </div>
        </div>

        {pagosDelMes.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No hay pagos registrados en este mes.</p>
            <p className="text-slate-400 text-xs mt-1">
              Cuando cobres una cuota, cargala con &laquo;Registrar pago&raquo; y la suscripción queda al día sola.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Socio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Método</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pagosDelMes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-sm text-slate-600">{fecha(p.pagado_en ?? p.creado_en)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">
                      {nombrePorId[(p.empresa_id ?? p.proveedor_id) as string] ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 capitalize">{p.metodo_pago ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-right font-semibold text-slate-900">
                      {pesos(Number(p.monto) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {conSuscripcion.length === 0 && (
        <p className="text-xs text-slate-400 text-center">
          Todavía no hay ninguna suscripción cargada.
        </p>
      )}
    </div>
  );
}
