"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Building,
  Wrench,
  Search,
  Download,
  Users,
  Pencil,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  asignarTarifa,
  actualizarCantidadEmpleados,
  actualizarPrecioTarifa,
} from "@/modulos/admin/acciones";
import { NivelTarifa } from "@/tipos";

type Empresa = {
  id: string;
  razon_social: string;
  email: string;
  estado: string;
  tarifa: number | null;
  cantidad_empleados: number | null;
  tarifa_vigente_hasta: string | null;
  creado_en: string;
  logo_url?: string | null;
};

type Proveedor = {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  estado: string;
  creado_en: string;
};

type Pago = {
  id: string;
  empresa_id: string | null;
  proveedor_id: string | null;
  monto: number | string | null;
  moneda: string | null;
  estado: string | null;
  pagado_en: string | null;
  creado_en: string;
};

type Tarifa = {
  nivel: number;
  precio_mensual: number | string;
  vigente_desde: string;
  vigente_hasta: string | null;
  actualizado_en: string;
};

const TARIFA_LABEL: Record<number, string> = { 1: "Tarifa 1", 2: "Tarifa 2", 3: "Tarifa 3" };
const TARIFA_RANGO: Record<number, string> = {
  1: "Hasta 30 empleados",
  2: "31 a 99 empleados",
  3: "100+ empleados",
};
const TARIFA_CHIP: Record<number, string> = {
  1: "bg-slate-100 text-slate-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-amber-100 text-amber-700",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);

const formatCurrencyCompact = (amount: number) => {
  if (amount >= 1_000_000)
    return `$${(amount / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  if (amount >= 1_000)
    return `$${(amount / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}K`;
  return formatCurrency(amount);
};

function calcTarifaSugerida(emp: number | null): NivelTarifa | null {
  if (emp == null || emp <= 0) return null;
  if (emp <= 30) return 1;
  if (emp <= 99) return 2;
  return 3;
}

export function PanelSuscripciones({
  empresas,
  proveedores,
  pagos = [],
  tarifas = [],
}: {
  empresas: Empresa[];
  proveedores: Proveedor[];
  pagos?: Pago[];
  tarifas?: Tarifa[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtroTipo, setFiltroTipo] = useState<"company" | "provider">("company");
  const [busqueda, setBusqueda] = useState("");
  const [editandoEmpleados, setEditandoEmpleados] = useState<string | null>(null);
  const [empleadosDraft, setEmpleadosDraft] = useState<string>("");
  const [editandoPrecio, setEditandoPrecio] = useState<number | null>(null);
  const [precioDraft, setPrecioDraft] = useState<string>("");

  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Precios actuales (mapa nivel → monto mensual)
  const precioPorNivel = useMemo(() => {
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    tarifas.forEach((t) => {
      map[t.nivel] = Number(t.precio_mensual) || 0;
    });
    return map;
  }, [tarifas]);

  const tarifaInfo = useMemo(() => {
    const map: Record<number, Tarifa | undefined> = {};
    tarifas.forEach((t) => {
      map[t.nivel] = t;
    });
    return map;
  }, [tarifas]);

  const montoMensualEmpresa = (e: Empresa): number =>
    e.tarifa ? precioPorNivel[e.tarifa] ?? 0 : 0;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAsignarTarifa(empresaId: string, tarifa: NivelTarifa) {
    await asignarTarifa(empresaId, tarifa);
    refresh();
  }

  async function handleGuardarEmpleados(empresaId: string) {
    const n = parseInt(empleadosDraft.replace(/\D/g, ""), 10);
    await actualizarCantidadEmpleados(empresaId, Number.isFinite(n) && n > 0 ? n : null);
    setEditandoEmpleados(null);
    setEmpleadosDraft("");
    refresh();
  }

  async function handleGuardarPrecio(nivel: 1 | 2 | 3) {
    const n = parseInt(precioDraft.replace(/\D/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    await actualizarPrecioTarifa(nivel, n);
    setEditandoPrecio(null);
    setPrecioDraft("");
    refresh();
  }

  // Métricas
  const ingresosMensual = empresas.reduce((acc, e) => acc + montoMensualEmpresa(e), 0);
  const ingresosAnuales = ingresosMensual * 12;
  const sinTarifa = empresas.filter((e) => !e.tarifa).length;
  const conTarifa = empresas.filter((e) => e.tarifa).length;

  const metricas = [
    {
      label: "Ingreso Mensual Estimado",
      valor: ingresosMensual,
      sub: `${conTarifa} socios con tarifa asignada`,
      icon: TrendingUp,
      accent: "bg-primary-50 text-primary-700",
    },
    {
      label: "Ingreso Anual Proyectado",
      valor: ingresosAnuales,
      sub: "Mensual × 12 meses",
      icon: DollarSign,
      accent: "bg-blue-50 text-blue-700",
    },
    {
      label: "Socios Activos",
      valor: empresas.length,
      sub: `${sinTarifa} sin tarifa asignada`,
      icon: Building,
      accent: "bg-emerald-50 text-emerald-700",
      isCount: true,
    },
    {
      label: "Particulares Activos",
      valor: proveedores.length,
      sub: "Aprobados en la plataforma",
      icon: Wrench,
      accent: "bg-violet-50 text-violet-700",
      isCount: true,
    },
  ];

  const empresasFiltradas = empresas.filter(
    (e) =>
      !busqueda ||
      e.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.email.toLowerCase().includes(busqueda.toLowerCase())
  );
  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      !busqueda ||
      `${p.nombre} ${p.apellido ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    pagos.forEach((p) => {
      const d = p.pagado_en ? new Date(p.pagado_en) : new Date(p.creado_en);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    set.add(mesSeleccionado);
    return Array.from(set).sort().reverse();
  }, [pagos, mesSeleccionado]);

  const pagosDelMes = useMemo(() => {
    return pagos.filter((p) => {
      const d = p.pagado_en ? new Date(p.pagado_en) : new Date(p.creado_en);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === mesSeleccionado;
    });
  }, [pagos, mesSeleccionado]);

  const totalMes = pagosDelMes.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  const empresasById = useMemo(
    () => Object.fromEntries(empresas.map((e) => [e.id, e])),
    [empresas]
  );
  const proveedoresById = useMemo(
    () => Object.fromEntries(proveedores.map((p) => [p.id, p])),
    [proveedores]
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Administración · Finanzas
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Suscripciones y Tarifas
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm">
            Tarifas vigentes hasta mayo 2026. Ajuste trimestral por IPC. Los cambios de precio
            impactan a todos los socios del nivel.
          </p>
        </div>
        <Button variant="outline" className="gap-2 bg-white hidden sm:flex" disabled>
          <Download className="w-4 h-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Métricas — responsive numerics, no overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((m) => {
          const Icon = m.icon;
          const display = m.isCount
            ? String(m.valor)
            : formatCurrency(Number(m.valor));
          return (
            <div
              key={m.label}
              className="bg-white rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 min-w-0"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${m.accent}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-2">
                  {m.label}
                </p>
              </div>
              <p
                className="font-bold text-slate-900 tabular-nums leading-tight break-words"
                style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)" }}
                title={display}
              >
                {display}
              </p>
              <p className="text-xs text-slate-400 mt-1.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Precios editables por nivel */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Precios vigentes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Editar impacta el cálculo de ingresos y lo que ve cada socio en su panel.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((nivel) => {
            const precio = precioPorNivel[nivel] ?? 0;
            const info = tarifaInfo[nivel];
            const count = empresas.filter((e) => e.tarifa === nivel).length;
            const subtotal = count * precio;
            const isEditing = editandoPrecio === nivel;

            return (
              <div
                key={nivel}
                className="bg-white rounded-lg p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 min-w-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${TARIFA_CHIP[nivel]}`}
                  >
                    {TARIFA_LABEL[nivel]}
                  </span>
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setEditandoPrecio(nivel);
                        setPrecioDraft(String(precio));
                      }}
                      className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 group"
                      disabled={isPending}
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                  ) : null}
                </div>

                <p className="text-xs text-slate-500 mb-3">{TARIFA_RANGO[nivel]}</p>

                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-slate-900">$</span>
                      <Input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        value={precioDraft}
                        onChange={(ev) =>
                          setPrecioDraft(ev.target.value.replace(/\D/g, ""))
                        }
                        className="h-10 text-lg font-bold tabular-nums"
                      />
                      <span className="text-xs text-slate-500 whitespace-nowrap">/mes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGuardarPrecio(nivel)}
                        disabled={isPending}
                        className="h-8"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Guardar
                      </Button>
                      <button
                        onClick={() => {
                          setEditandoPrecio(null);
                          setPrecioDraft("");
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2 h-8"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mb-1 min-w-0">
                    <p
                      className="font-bold text-slate-900 tabular-nums tracking-tight leading-none"
                      style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                      title={formatCurrency(precio)}
                    >
                      {formatCurrency(precio)}
                    </p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">/mes</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                      Socios
                    </p>
                    <p className="font-semibold text-slate-700 tabular-nums">{count}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                      Subtotal/mes
                    </p>
                    <p
                      className="font-semibold text-slate-700 tabular-nums truncate"
                      title={formatCurrency(subtotal)}
                    >
                      {formatCurrencyCompact(subtotal)}
                    </p>
                  </div>
                </div>

                {info?.vigente_hasta ? (
                  <p className="text-[10px] text-slate-400 mt-3">
                    Vigente hasta{" "}
                    {new Date(info.vigente_hasta).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pagos por mes */}
      <Card className="p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 border-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Pagos por mes
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {mesesDisponibles.map((m) => {
                const [y, mo] = m.split("-");
                const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString(
                  "es-AR",
                  { month: "long", year: "numeric" }
                );
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total recaudado
              </p>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">
                {formatCurrency(totalMes)}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Socio / Particular
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {pagosDelMes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Sin pagos registrados en este mes.
                  </td>
                </tr>
              ) : (
                pagosDelMes.map((p) => {
                  const fecha = p.pagado_en ?? p.creado_en;
                  const emp = p.empresa_id ? empresasById[p.empresa_id] : null;
                  const prov = p.proveedor_id ? proveedoresById[p.proveedor_id] : null;
                  const nombre =
                    emp?.razon_social ?? (prov ? `${prov.nombre} ${prov.apellido ?? ""}` : "—");
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 tabular-nums">
                        {new Date(fecha).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {nombre}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-semibold tabular-nums">
                        {formatCurrency(Number(p.monto) || 0)} {p.moneda ?? "ARS"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${
                            p.estado === "aprobado" || p.estado === "aprobada"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.estado ?? "pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 border-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
          {(["company", "provider"] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-all ${
                filtroTipo === tipo
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tipo === "company"
                ? `Socios (${empresas.length})`
                : `Particulares (${proveedores.length})`}
            </button>
          ))}
        </div>
      </Card>

      {filtroTipo === "company" ? (
        <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Empleados
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Tarifa
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Mensual
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Miembro desde
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Cambiar tarifa
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {empresasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron empresas.
                    </td>
                  </tr>
                ) : (
                  empresasFiltradas.map((e) => {
                    const sugerida = calcTarifaSugerida(e.cantidad_empleados);
                    const montoActual = montoMensualEmpresa(e);
                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-50/50 transition-colors align-top"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {e.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={e.logo_url}
                                alt={e.razon_social}
                                className="w-10 h-10 rounded-md object-cover bg-white ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center ring-1 ring-slate-200">
                                <Building className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {e.razon_social}
                              </p>
                              <p className="text-xs text-slate-500">{e.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {editandoEmpleados === e.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={1}
                                value={empleadosDraft}
                                onChange={(ev) =>
                                  setEmpleadosDraft(ev.target.value.replace(/\D/g, ""))
                                }
                                className="h-8 w-20 text-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => handleGuardarEmpleados(e.id)}
                                disabled={isPending}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditandoEmpleados(null);
                                  setEmpleadosDraft("");
                                }}
                                className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditandoEmpleados(e.id);
                                setEmpleadosDraft(String(e.cantidad_empleados ?? ""));
                              }}
                              className="flex items-center gap-2 group"
                            >
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700 tabular-nums">
                                {e.cantidad_empleados ?? (
                                  <span className="italic text-slate-400">sin dato</span>
                                )}
                              </span>
                              <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
                            </button>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {e.tarifa ? (
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest w-fit ${
                                  TARIFA_CHIP[e.tarifa]
                                }`}
                              >
                                {TARIFA_LABEL[e.tarifa]}
                              </span>
                              {sugerida && sugerida !== e.tarifa && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  Sugerida por empleados: T{sugerida}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin asignar</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 tabular-nums">
                          {montoActual > 0 ? (
                            formatCurrency(montoActual)
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                          {new Date(e.creado_en).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {([1, 2, 3] as const).map((nivel) => (
                              <button
                                key={nivel}
                                disabled={isPending || e.tarifa === nivel}
                                onClick={() => handleAsignarTarifa(e.id, nivel)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                                  e.tarifa === nivel
                                    ? `${TARIFA_CHIP[nivel]} cursor-default`
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                T{nivel}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Particular
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {proveedoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron particulares.
                    </td>
                  </tr>
                ) : (
                  proveedoresFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {p.nombre} {p.apellido ?? ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {p.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                        {new Date(p.creado_en).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
