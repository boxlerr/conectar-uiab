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
  Link2,
  Unlink,
  Send,
  LogIn,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  actualizarEstadoAlta,
  eliminarAlta,
  crearCuentaDesdeAlta,
  vincularEmpresaAlta,
} from "@/modulos/altas/acciones";
import { reenviarInvitacionAlta } from "@/modulos/altas/invitaciones";
import {
  CATEGORIA_ALTA_LABEL,
  ESTADOS_ALTA,
} from "@/modulos/altas/constantes";
import { conflictosPendientes, type ConflictoPadron } from "@/modulos/altas/padron";

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
  conflictos_padron: ConflictoPadron[] | null;
  conflictos_revisados_en: string | null;
};

type EmpresaPadron = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  cuit: string | null;
  n_socio: string | null;
  estado: string;
};

type EstadoCuenta = {
  email: string;
  ultimo_ingreso: string | null;
  invitacion_creada: string | null;
  invitacion_expira: string | null;
  invitacion_usada: string | null;
  tutoriales_vistos: Record<string, string | null> | null;
  onboarding_completado_en: string | null;
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

function fechaHora(s: string) {
  return new Date(s).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function soloDigitos(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

// Cuántos de los 4 tutoriales principales vio (perfil, directorio, oportunidades, dashboard).
const TOURS_PRINCIPALES = ["perfil", "directorio", "oportunidades", "dashboard"];
function toursVistos(vistos: Record<string, string | null> | null | undefined) {
  if (!vistos) return 0;
  return TOURS_PRINCIPALES.filter((t) => Boolean(vistos[t])).length;
}

const TONO_ESTADO: Record<"ok" | "warn" | "bad" | "muted", string> = {
  ok: "text-emerald-700",
  warn: "text-amber-700",
  bad: "text-rose-600",
  muted: "text-slate-500",
};

// Diferencias entre lo que la socia cargó en /sumate y lo que ya figuraba en el
// padrón. Sirve para levantar el teléfono y confirmar el dato en vez de esperar
// a que la socia lo revise por su cuenta (que puede no ingresar en semanas).
function DiferenciasPadronCard({ alta }: { alta: Alta }) {
  const todas = alta.conflictos_padron ?? [];
  if (todas.length === 0) return null;

  const pendientes = conflictosPendientes(todas);

  return (
    <section>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
        Diferencias con el padrón
      </p>

      <ul className="space-y-2.5">
        {todas.map((c) => {
          const ganoFormulario = c.aplicado === "formulario";
          return (
            <li key={c.campo} className="rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {c.etiqueta}
                </span>
                {c.resuelto ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-px uppercase tracking-wider">
                    Confirmado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-px uppercase tracking-wider">
                    Sin confirmar
                  </span>
                )}
              </div>

              <p className="text-[13px] text-slate-600 leading-snug">
                <span className="text-slate-400">Cargó:</span>{" "}
                <span className={ganoFormulario ? "font-semibold text-slate-800" : ""}>
                  {c.valor_formulario}
                </span>
              </p>
              <p className="text-[13px] text-slate-600 leading-snug">
                <span className="text-slate-400">Padrón:</span>{" "}
                <span className={!ganoFormulario ? "font-semibold text-slate-800" : ""}>
                  {c.valor_padron}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                En la ficha quedó {ganoFormulario ? "lo que cargó la socia" : "el dato del padrón"}.
              </p>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-slate-400 mt-2">
        {pendientes.length === 0
          ? "La socia ya revisó todas las diferencias desde su panel."
          : `${pendientes.length} sin confirmar. Le aparecen como aviso al ingresar, o podés confirmarlas por teléfono.`}
      </p>
    </section>
  );
}

function EstadoCuentaCard({ estado }: { estado?: EstadoCuenta }) {
  if (!estado) {
    return (
      <p className="text-sm text-slate-400">
        Cuenta creada. Todavía no hay datos de activación (puede tardar unos segundos en reflejarse).
      </p>
    );
  }

  const usada = Boolean(estado.invitacion_usada);
  const vencida =
    !usada &&
    !!estado.invitacion_expira &&
    new Date(estado.invitacion_expira).getTime() < Date.now();
  const vistos = toursVistos(estado.tutoriales_vistos);
  const completoTutorial = Boolean(estado.onboarding_completado_en) || vistos >= 4;

  const filas: { icon: React.ElementType; label: string; valor: string; tono: keyof typeof TONO_ESTADO }[] = [
    {
      icon: KeyRound,
      label: "Contraseña",
      ...(usada
        ? { valor: `Definida · ${fechaHora(estado.invitacion_usada!)}`, tono: "ok" as const }
        : vencida
          ? { valor: "El enlace venció — reenviá la invitación", tono: "bad" as const }
          : {
              valor: `Pendiente · el enlace vence el ${estado.invitacion_expira ? fecha(estado.invitacion_expira) : "—"}`,
              tono: "warn" as const,
            }),
    },
    {
      icon: LogIn,
      label: "Primer ingreso",
      ...(estado.ultimo_ingreso
        ? { valor: fechaHora(estado.ultimo_ingreso), tono: "ok" as const }
        : { valor: "Todavía no ingresó", tono: "muted" as const }),
    },
    {
      icon: GraduationCap,
      label: "Tutorial",
      ...(completoTutorial
        ? { valor: "Completado", tono: "ok" as const }
        : vistos > 0
          ? { valor: `${vistos} de 4 pasos vistos`, tono: "warn" as const }
          : { valor: "No lo empezó", tono: "muted" as const }),
    },
  ];

  return (
    <dl className="space-y-3 text-sm">
      {filas.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.label} className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {f.label}
              </span>
              <span className={`font-medium ${TONO_ESTADO[f.tono]}`}>{f.valor}</span>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

export function PanelAltas({
  altas,
  empresas,
  estados,
}: {
  altas: Alta[];
  empresas: EmpresaPadron[];
  estados: Record<string, EstadoCuenta>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState<Alta | null>(null);
  const [creando, setCreando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [filtroPadron, setFiltroPadron] = useState("");
  const [empresaElegida, setEmpresaElegida] = useState("");
  const [vinculando, setVinculando] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function abrirDetalle(alta: Alta) {
    setSeleccionada(alta);
    setFiltroPadron("");
    setEmpresaElegida("");
  }

  const empresaVinculada = useMemo(
    () =>
      seleccionada?.empresa_id
        ? empresas.find((e) => e.id === seleccionada.empresa_id) ?? null
        : null,
    [seleccionada, empresas]
  );

  const sugerenciaCuit = useMemo(() => {
    if (!seleccionada || seleccionada.empresa_id) return null;
    const cuitAlta = soloDigitos(seleccionada.cuit);
    if (!cuitAlta) return null;
    const matches = empresas.filter((e) => {
      const cuitEmpresa = soloDigitos(e.cuit);
      return cuitEmpresa !== "" && cuitEmpresa === cuitAlta;
    });
    return matches.length === 1 ? matches[0] : null;
  }, [seleccionada, empresas]);

  const empresasFiltradas = useMemo(() => {
    const term = filtroPadron.trim().toLowerCase();
    if (!term) return empresas;
    const termDigitos = soloDigitos(term);
    return empresas.filter(
      (e) =>
        e.razon_social.toLowerCase().includes(term) ||
        (e.nombre_comercial ?? "").toLowerCase().includes(term) ||
        (termDigitos !== "" && soloDigitos(e.cuit).includes(termDigitos))
    );
  }, [empresas, filtroPadron]);

  async function vincular(altaId: string, empresaId: string | null) {
    setVinculando(true);
    let res;
    try {
      res = await vincularEmpresaAlta(altaId, empresaId);
    } catch {
      return toast.error("No se pudo vincular. Probá de nuevo.");
    } finally {
      setVinculando(false);
    }
    if (res?.error) return toast.error(res.error);
    toast.success(empresaId ? "Empresa vinculada al padrón" : "Empresa desvinculada del padrón");
    setSeleccionada((prev) => (prev && prev.id === altaId ? { ...prev, empresa_id: empresaId } : prev));
    setEmpresaElegida("");
    setFiltroPadron("");
    refresh();
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
    let res;
    try {
      res = await crearCuentaDesdeAlta(alta.id);
    } catch {
      return toast.error("No se pudo crear la cuenta. Probá de nuevo.");
    } finally {
      setCreando(false);
    }
    if (res?.error) return toast.error(res.error);
    if ("emailEnviado" in res && res.emailEnviado) {
      toast.success("Cuenta creada. Le enviamos el email para definir su contraseña.");
    } else {
      toast.warning("Cuenta creada, pero el email no se envió", {
        description:
          ("emailError" in res && res.emailError) ||
          "Revisá la configuración de SMTP y usá «Reenviar invitación».",
      });
    }
    const empresaIdCreada =
      "empresaId" in res && res.empresaId ? res.empresaId : null;
    setSeleccionada((prev) =>
      prev
        ? {
            ...prev,
            estado: "cuenta_creada",
            empresa_id: empresaIdCreada ?? prev.empresa_id,
          }
        : null
    );
    refresh();
  }

  async function reenviar(altaId: string) {
    setReenviando(true);
    let res;
    try {
      res = await reenviarInvitacionAlta(altaId);
    } catch {
      return toast.error("No se pudo reenviar. Probá de nuevo.");
    } finally {
      setReenviando(false);
    }
    if (res?.error) return toast.error(res.error);
    toast.success("Invitación reenviada", {
      description: "Le llegará un nuevo email con un enlace válido por 30 días.",
    });
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

  // El formulario /sumate no está en el menú público (es solo para socias): el
  // admin comparte este link directo con cada empresa para que cargue sus datos.
  function copiarLinkFormulario() {
    const url = `${window.location.origin}/sumate`;
    navigator.clipboard.writeText(url);
    toast.success("Link del formulario copiado. Compartíselo a la empresa socia.");
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
            Solicitudes cargadas desde el formulario de alta de socios. Compartí el link con cada empresa, revisá los datos y dale acceso.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={copiarLinkFormulario} className="bg-primary-600 hover:bg-primary-700 text-white">
            <Link2 className="w-4 h-4 mr-2" />
            Compartir formulario
          </Button>
          <a href="/sumate" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="shrink-0">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver formulario
            </Button>
          </a>
          <Button variant="outline" onClick={exportarCSV} disabled={filtradas.length === 0} className="shrink-0">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
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
                      onClick={() => abrirDetalle(a)}
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
                        {a.estado === "cuenta_creada" && (() => {
                          const ec = estados[a.email.toLowerCase()];
                          if (!ec) return null;
                          const activo = Boolean(ec.invitacion_usada);
                          return (
                            <span className={`block text-[10px] mt-1 ${activo ? "text-emerald-600" : "text-slate-400"}`}>
                              {activo ? "✓ activó su cuenta" : "sin activar aún"}
                            </span>
                          );
                        })()}
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

              {/* Padrón UIAB */}
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Padrón UIAB</p>
                {seleccionada.empresa_id ? (
                  <div className="flex items-start justify-between gap-3 bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Vinculada al padrón
                      </span>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {empresaVinculada?.razon_social ?? "Empresa del padrón"}
                      </p>
                      {empresaVinculada?.cuit && (
                        <p className="text-xs text-slate-500">CUIT {empresaVinculada.cuit}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-rose-600 border-rose-200 hover:bg-rose-50"
                      disabled={vinculando}
                      onClick={() => vincular(seleccionada.id, null)}
                    >
                      {vinculando ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Unlink className="w-3.5 h-3.5 mr-1" />
                      )}
                      Desvincular
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sugerenciaCuit && (
                      <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p className="text-xs text-amber-800 min-w-0">
                          Posible match por CUIT:{" "}
                          <span className="font-semibold">{sugerenciaCuit.razon_social}</span>
                          {sugerenciaCuit.cuit && <span className="text-amber-600"> · {sugerenciaCuit.cuit}</span>}
                        </p>
                        <Button
                          size="sm"
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={vinculando}
                          onClick={() => vincular(seleccionada.id, sugerenciaCuit.id)}
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1" /> Vincular
                        </Button>
                      </div>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={filtroPadron}
                        onChange={(e) => {
                          setFiltroPadron(e.target.value);
                          setEmpresaElegida("");
                        }}
                        placeholder="Filtrar por razón social, nombre o CUIT..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={empresaElegida}
                        onChange={(e) => setEmpresaElegida(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">
                          Elegí una empresa del padrón ({empresasFiltradas.length})
                        </option>
                        {empresasFiltradas.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.razon_social}
                            {emp.cuit ? ` — ${emp.cuit}` : ""}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 self-stretch h-auto"
                        disabled={!empresaElegida || vinculando}
                        onClick={() => vincular(seleccionada.id, empresaElegida)}
                      >
                        {vinculando ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Vincular
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  Al crear la cuenta se usa la empresa vinculada; si no hay ninguna, se busca por CUIT o se crea una nueva.
                </p>
              </section>

              {/* Diferencias entre el formulario y el padrón */}
              <DiferenciasPadronCard alta={seleccionada} />

              {/* Estado de la cuenta (onboarding) */}
              {seleccionada.estado === "cuenta_creada" && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                    Estado de la cuenta
                  </p>
                  <EstadoCuentaCard estado={estados[seleccionada.email.toLowerCase()]} />
                </section>
              )}

              {/* Acciones */}
              <section className="space-y-2 pt-2">
                {seleccionada.estado === "cuenta_creada" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 w-full bg-emerald-50 text-emerald-700 rounded-lg px-4 py-3 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Esta empresa ya tiene acceso a la plataforma.
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={reenviando}
                      onClick={() => reenviar(seleccionada.id)}
                    >
                      {reenviando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reenviando…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" /> Reenviar invitación
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-slate-400">
                      Genera un nuevo enlace para definir la contraseña (válido 30 días) por si todavía no ingresaron.
                    </p>
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
