"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Briefcase,
  Hash,
  Copy,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  PhoneCall,
  Ban,
  ExternalLink,
  FileText,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  actualizarEstadoAlta,
  eliminarAlta,
  crearCuentaDesdeAlta,
} from "@/modulos/altas/acciones";
import {
  CATEGORIA_ALTA_LABEL,
  ESTADOS_ALTA,
} from "@/modulos/altas/constantes";

type Alta = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  cuit: string | null;
  actividad: string | null;
  categoria: string;
  ya_es_socio: boolean;
  n_socio: string | null;
  referente_nombre: string;
  referente_cargo: string | null;
  email: string;
  telefono: string | null;
  sitio_web: string | null;
  localidad: string | null;
  direccion: string | null;
  mensaje: string | null;
  estado: string;
  empresa_id: string | null;
  creado_en: string;
  actualizado_en: string;
};

type Filtro = "all" | "pendiente" | "contactado" | "cuenta_creada" | "descartado";

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pendiente:     { label: "Pendiente",     bg: "bg-amber-50",   text: "text-amber-700",   icon: Clock },
  contactado:    { label: "Contactado",    bg: "bg-blue-50",    text: "text-blue-700",    icon: PhoneCall },
  cuenta_creada: { label: "Cuenta creada", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  descartado:    { label: "Descartado",    bg: "bg-slate-100",  text: "text-slate-500",   icon: Ban },
};

function fecha(s: string) {
  return new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function PanelAltas({ altas }: { altas: Alta[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState<Alta | null>(null);
  const [creando, setCreando] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function darAcceso(alta: Alta) {
    const nombre = alta.nombre_comercial || alta.razon_social;
    if (
      !confirm(
        `Crear la cuenta de "${nombre}" y darle acceso?\n\nSe va a crear el usuario, vincular su empresa (o crearla si no existe) y enviarle un email para definir su contraseña.`
      )
    )
      return;
    setCreando(true);
    const res = await crearCuentaDesdeAlta(alta.id);
    setCreando(false);
    if (res?.error) return toast.error(res.error);
    toast.success(
      "emailEnviado" in res && res.emailEnviado
        ? "Cuenta creada. Le enviamos el email para definir su contraseña."
        : "Cuenta creada."
    );
    setSeleccionada((prev) => (prev ? { ...prev, estado: "cuenta_creada" } : null));
    refresh();
  }

  const counts = useMemo(
    () => ({
      all: altas.length,
      pendiente: altas.filter((a) => a.estado === "pendiente").length,
      contactado: altas.filter((a) => a.estado === "contactado").length,
      cuenta_creada: altas.filter((a) => a.estado === "cuenta_creada").length,
      descartado: altas.filter((a) => a.estado === "descartado").length,
    }),
    [altas]
  );

  const filtradas = useMemo(() => {
    const term = busqueda.toLowerCase();
    return altas.filter((a) => {
      const matchFiltro = filtro === "all" || a.estado === filtro;
      const matchBusqueda =
        !term ||
        a.razon_social.toLowerCase().includes(term) ||
        (a.nombre_comercial ?? "").toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.referente_nombre.toLowerCase().includes(term) ||
        (a.localidad ?? "").toLowerCase().includes(term);
      return matchFiltro && matchBusqueda;
    });
  }, [altas, filtro, busqueda]);

  async function cambiarEstado(id: string, estado: string) {
    const res = await actualizarEstadoAlta(id, estado);
    if (res?.error) return toast.error(res.error);
    toast.success("Estado actualizado");
    refresh();
    if (seleccionada?.id === id) setSeleccionada((prev) => (prev ? { ...prev, estado } : null));
  }

  async function borrar(id: string) {
    if (!confirm("¿Eliminar esta solicitud definitivamente? No se puede deshacer.")) return;
    const res = await eliminarAlta(id);
    if (res?.error) return toast.error(res.error);
    toast.success("Solicitud eliminada");
    setSeleccionada(null);
    refresh();
  }

  function copiar(texto: string, label: string) {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado`);
  }

  function exportarCSV() {
    const cols = [
      "razon_social", "nombre_comercial", "cuit", "actividad", "categoria",
      "ya_es_socio", "n_socio", "referente_nombre", "referente_cargo",
      "email", "telefono", "sitio_web", "localidad", "direccion", "estado", "creado_en",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = filtradas.map((a) => cols.map((c) => esc((a as Record<string, unknown>)[c])).join(","));
    const csv = [cols.join(","), ...filas].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `altas-socios-uiab.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtradas.length} registros exportados`);
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "all", label: `Todas (${counts.all})` },
    { key: "pendiente", label: `Pendientes (${counts.pendiente})` },
    { key: "contactado", label: `Contactadas (${counts.contactado})` },
    { key: "cuenta_creada", label: `Con cuenta (${counts.cuenta_creada})` },
    { key: "descartado", label: `Descartadas (${counts.descartado})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-primary-600" />
            Altas de socios
          </h1>
          <p className="text-slate-500 mt-1">
            Solicitudes enviadas desde el formulario público <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/sumate</span>. Revisá los datos y dale acceso a cada empresa.
          </p>
        </div>
        <Button variant="outline" onClick={exportarCSV} disabled={filtradas.length === 0} className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por empresa, email, referente o localidad..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recibida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No hay solicitudes con estos filtros.</p>
                  </td>
                </tr>
              ) : (
                filtradas.map((a) => {
                  const est = ESTADO_CONFIG[a.estado] ?? ESTADO_CONFIG.pendiente;
                  const EstIcon = est.icon;
                  const nombre = a.nombre_comercial || a.razon_social;
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSeleccionada(a)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 font-bold uppercase">
                            {nombre.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{nombre}</div>
                            <div className="text-xs text-slate-500 truncate">{a.referente_nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 truncate max-w-[200px]">{a.email}</div>
                        {a.telefono && <div className="text-xs text-slate-400">{a.telefono}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600">{CATEGORIA_ALTA_LABEL[a.categoria] ?? a.categoria}</span>
                        {a.ya_es_socio && (
                          <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Ya es socio</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${est.bg} ${est.text}`}>
                          <EstIcon className="w-3 h-3" />
                          {est.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{fecha(a.creado_en)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over detalle */}
      {seleccionada && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionada(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold uppercase">
                  {(seleccionada.nombre_comercial || seleccionada.razon_social).charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{seleccionada.nombre_comercial || seleccionada.razon_social}</h2>
                  <p className="text-xs text-slate-500 truncate">{seleccionada.razon_social}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSeleccionada(null)} className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Estado de la gestión</p>
                <div className="grid grid-cols-2 gap-2">
                  {ESTADOS_ALTA.map((e) => {
                    const cfg = ESTADO_CONFIG[e.value];
                    const Icon = cfg.icon;
                    const isActive = seleccionada.estado === e.value;
                    return (
                      <button
                        key={e.value}
                        disabled={isActive || isPending}
                        onClick={() => cambiarEstado(seleccionada.id, e.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          isActive
                            ? `${cfg.bg} ${cfg.text} border-current`
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Contacto */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Contacto</p>
                <dl className="space-y-3 text-sm">
                  <DetalleFila icon={Mail} valor={seleccionada.email} onCopy={() => copiar(seleccionada.email, "Email")} />
                  {seleccionada.telefono && <DetalleFila icon={Phone} valor={seleccionada.telefono} onCopy={() => copiar(seleccionada.telefono!, "Teléfono")} />}
                  <DetalleFila icon={UserPlus} valor={`${seleccionada.referente_nombre}${seleccionada.referente_cargo ? " · " + seleccionada.referente_cargo : ""}`} />
                  {seleccionada.sitio_web && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={seleccionada.sitio_web.startsWith("http") ? seleccionada.sitio_web : `https://${seleccionada.sitio_web}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate inline-flex items-center gap-1">
                        {seleccionada.sitio_web} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </dl>
              </section>

              {/* Empresa */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Datos de la empresa</p>
                <dl className="space-y-3 text-sm">
                  <DetalleFila icon={Briefcase} valor={CATEGORIA_ALTA_LABEL[seleccionada.categoria] ?? seleccionada.categoria} />
                  {seleccionada.actividad && <DetalleFila icon={FileText} valor={seleccionada.actividad} />}
                  {seleccionada.cuit && <DetalleFila icon={Hash} valor={`CUIT ${seleccionada.cuit}`} onCopy={() => copiar(seleccionada.cuit!, "CUIT")} />}
                  {seleccionada.ya_es_socio && (
                    <DetalleFila icon={CheckCircle2} valor={`Ya es socio${seleccionada.n_socio ? " · N° " + seleccionada.n_socio : ""}`} />
                  )}
                  {(seleccionada.localidad || seleccionada.direccion) && (
                    <DetalleFila icon={MapPin} valor={[seleccionada.direccion, seleccionada.localidad].filter(Boolean).join(", ")} />
                  )}
                  <DetalleFila icon={Calendar} valor={`Recibida el ${fecha(seleccionada.creado_en)}`} />
                </dl>
              </section>

              {seleccionada.mensaje && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Mensaje</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{seleccionada.mensaje}</p>
                </section>
              )}

              {/* Acciones */}
              <section className="space-y-2 pt-2">
                {seleccionada.estado === "cuenta_creada" ? (
                  <div className="flex items-center gap-2 w-full bg-emerald-50 text-emerald-700 rounded-lg px-4 py-3 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Esta empresa ya tiene acceso a la plataforma.
                  </div>
                ) : (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={creando}
                    onClick={() => darAcceso(seleccionada)}
                  >
                    {creando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando cuenta...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" /> Crear cuenta y dar acceso
                      </>
                    )}
                  </Button>
                )}
                <a href={`mailto:${seleccionada.email}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" /> Escribir un email
                  </Button>
                </a>
                <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => borrar(seleccionada.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar solicitud
                </Button>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetalleFila({
  icon: Icon,
  valor,
  onCopy,
}: {
  icon: React.ElementType;
  valor: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 group">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-slate-700 flex-1 min-w-0 break-words">{valor}</span>
      {onCopy && (
        <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary-600 shrink-0" title="Copiar">
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
