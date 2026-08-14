"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench, Check, X, Search, Eye, CheckCircle2, AlertCircle, ArrowUpCircle,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  aprobarProveedor,
  rechazarProveedor,
  promoverCategoria,
  type ResultadoCategoria,
} from "@/modulos/admin/acciones";
import { fallo, llamarAccion } from "@/lib/accion-segura";
import { toast } from "sonner";
import { normalizarNombreServicio } from "@/modulos/compartido/especialidades";
import {
  completitudDeParticular,
  serviciosFueraDelCatalogo,
  type ServicioDeclarado,
} from "@/modulos/admin/completitud-particular";

export type { ServicioDeclarado };

export type Particular = {
  id: string;
  nombre: string;
  apellido: string | null;
  razon_social: string | null;
  nombre_comercial: string | null;
  tipo_proveedor: string | null;
  cuit: string | null;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  sitio_web: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  descripcion: string | null;
  ruta_logo: string | null;
  ruta_portada: string | null;
  email_compras: string | null;
  email_mantenimiento: string | null;
  fecha_inicio_experiencia: string | null;
  estado: string;
  motivo_rechazo: string | null;
  creado_en: string;
  servicios: ServicioDeclarado[];
  /** Se registró como particular pero nunca se le creó la ficha. */
  sin_ficha?: boolean;
  perfil_activo?: boolean;
};

type Filtro = "all" | "pendiente_revision" | "aprobado" | "rechazado" | "sin_ficha";

const BADGE: Record<string, { label: string; className: string }> = {
  aprobado:            { label: "Aprobado", className: "bg-emerald-100 text-emerald-700" },
  pendiente_revision:  { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  rechazado:           { label: "Rechazado", className: "bg-rose-100 text-rose-700" },
  borrador:            { label: "Borrador", className: "bg-slate-100 text-slate-600" },
  sin_ficha:           { label: "Sin ficha", className: "bg-orange-100 text-orange-700" },
  pausado:             { label: "Pausado", className: "bg-orange-100 text-orange-700" },
  oculto:              { label: "Oculto", className: "bg-slate-100 text-slate-500" },
};

export function PanelProveedores({ proveedores: particulares }: { proveedores: Particular[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Particular | null>(null);
  const [modalRechazo, setModalRechazo] = useState<{ id: string; nombre: string } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const nombreCompleto = (p: Particular) => [p.nombre, p.apellido].filter(Boolean).join(" ");

  const filtrados = particulares.filter((p) => {
    const matchFiltro = filtro === "all" || p.estado === filtro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !busqueda ||
      nombreCompleto(p).toLowerCase().includes(q) ||
      (p.nombre_comercial ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.cuit ?? "").includes(busqueda) ||
      p.servicios.some((s) => s.nombre.toLowerCase().includes(q));
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all: particulares.length,
    pendiente_revision: particulares.filter((p) => p.estado === "pendiente_revision").length,
    aprobado: particulares.filter((p) => p.estado === "aprobado").length,
    rechazado: particulares.filter((p) => p.estado === "rechazado").length,
    sin_ficha: particulares.filter((p) => p.estado === "sin_ficha").length,
  };
  const sinServicios = particulares.filter(
    (p) => !p.sin_ficha && p.servicios.length === 0
  ).length;

  function refresh() { startTransition(() => router.refresh()); }

  async function handleAprobar(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const res = await llamarAccion(() => aprobarProveedor(id));
    if (fallo(res)) {
      toast.error("No se pudo aprobar", { description: res.error });
      return;
    }
    toast.success("Particular aprobado");
    refresh();
    if (seleccionado?.id === id) {
      setSeleccionado((prev) => (prev ? { ...prev, estado: "aprobado" } : null));
    }
  }

  async function handleRechazar() {
    if (!modalRechazo || !motivoRechazo.trim()) return;
    const res = await llamarAccion(() => rechazarProveedor(modalRechazo.id, motivoRechazo));
    if (fallo(res)) {
      toast.error("No se pudo rechazar", { description: res.error });
      return;
    }
    toast.success("Particular rechazado");
    setModalRechazo(null);
    setMotivoRechazo("");
    refresh();
    if (seleccionado?.id === modalRechazo.id) setSeleccionado(null);
  }

  /**
   * Sube al catálogo oficial un servicio que el particular escribió a mano.
   * Es el mismo paso que se hace con las empresas desde /admin/servicios, pero
   * acá, en el momento en que se lo está evaluando.
   */
  async function subirServicioAlCatalogo(servicio: ServicioDeclarado) {
    const nombre = normalizarNombreServicio(servicio.nombre);
    const res: ResultadoCategoria = await llamarAccion(() =>
      promoverCategoria(servicio.id, true, nombre)
    );
    if (res.error) {
      toast.error("No se pudo subir al catálogo", {
        description: res.duplicado
          ? `${res.error} Resolvelo en Servicios.`
          : res.error,
      });
      return;
    }
    toast.success(`“${res.nombreFinal ?? nombre}” ya es parte del catálogo`);
    setSeleccionado((prev) =>
      prev
        ? {
            ...prev,
            servicios: prev.servicios.map((s) =>
              s.id === servicio.id
                ? { ...s, oficial: true, nombre: res.nombreFinal ?? nombre }
                : s
            ),
          }
        : null
    );
    refresh();
  }

  const TABS: { key: Filtro; label: string }[] = [
    // Primero los que se registraron y quedaron sin ficha: es lo único que hoy
    // requiere una decisión, y era justo lo que no se veía.
    { key: "sin_ficha", label: `Sin ficha (${counts.sin_ficha})` },
    { key: "pendiente_revision", label: `Pendientes (${counts.pendiente_revision})` },
    { key: "aprobado", label: `Aprobados (${counts.aprobado})` },
    { key: "rechazado", label: `Rechazados (${counts.rechazado})` },
    { key: "all", label: `Todos (${counts.all})` },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-emerald-600" />
          Particulares y profesionales
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Profesionales, monotributistas y empresas de servicios que se registraron por su cuenta.
        </p>
      </div>

      {sinServicios > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-900">
            <span className="font-semibold">{sinServicios}</span>{" "}
            {sinServicios === 1 ? "ficha no declaró" : "fichas no declararon"} ningún servicio.
            Sin eso nadie las encuentra buscando en el directorio.
          </p>
        </div>
      )}

      <Card className="p-3 flex flex-col lg:flex-row gap-3 lg:items-center shadow-sm border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, CUIT, email o servicio..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Particular</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Servicios que declaró</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">Ficha</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No hay particulares con este filtro.</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => {
                  const badge = BADGE[p.estado] ?? { label: p.estado, className: "bg-slate-100 text-slate-600" };
                  const c = completitudDeParticular(p);
                  return (
                    <tr key={p.id} onClick={() => setSeleccionado(p)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900">{nombreCompleto(p)}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[280px]">
                          {[p.nombre_comercial, p.tipo_proveedor, p.email].filter(Boolean).join(" · ") || "Sin datos"}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        {p.sin_ficha ? (
                          <span className="text-xs text-slate-300">Nunca completó la ficha</span>
                        ) : p.servicios.length === 0 ? (
                          <span className="text-xs font-semibold text-rose-600">Ninguno</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {p.servicios.slice(0, 3).map((s) => (
                              <span key={s.id}
                                className={`text-[11px] px-2 py-0.5 rounded-full ${
                                  s.oficial ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"
                                }`}>
                                {s.nombre}
                              </span>
                            ))}
                            {p.servicios.length > 3 && (
                              <span className="text-[11px] text-slate-400 px-1 py-0.5">
                                +{p.servicios.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {p.sin_ficha ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-sm bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-sm ${c.pct >= 70 ? "bg-emerald-500" : c.pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${c.pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {c.completos}/{c.total}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5 items-center justify-end">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-emerald-600 h-8 w-8 p-0"
                            title="Ver la ficha completa" onClick={() => setSeleccionado(p)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {p.estado === "pendiente_revision" && (
                            <>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                                title="Aprobar" onClick={(e) => handleAprobar(p.id, e)} disabled={isPending}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                                title="Rechazar"
                                onClick={() => setModalRechazo({ id: p.id, nombre: nombreCompleto(p) })}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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

      {/* ── Ficha completa: qué llenó, qué le falta y qué ofrece ── */}
      {seleccionado && (() => {
        const c = completitudDeParticular(seleccionado);
        const propuestos = serviciosFueraDelCatalogo(seleccionado.servicios);
        return (
          <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionado(null)} />
            {/* Modal ancho: en una columna de 400px había que scrollear para
                cruzar dos datos. Acá entra todo de una. */}
            <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
              <div className="pointer-events-auto w-full sm:max-w-5xl max-h-full sm:max-h-[90vh] bg-white sm:rounded-lg shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                      {seleccionado.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-900 truncate">{nombreCompleto(seleccionado)}</h2>
                      <p className="text-xs text-slate-500 truncate">
                        {[seleccionado.nombre_comercial, seleccionado.tipo_proveedor].filter(Boolean).join(" · ") ||
                          "Sin nombre comercial"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSeleccionado(null)}
                    className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {seleccionado.sin_ficha ? (
                  <div className="p-6">
                    <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl p-4 leading-relaxed">
                      Se registró como particular pero nunca se le creó la ficha, así que no hay
                      datos ni servicios que revisar. La cuenta está{" "}
                      <span className="font-semibold">{seleccionado.perfil_activo ? "activa" : "desactivada"}</span>.
                      Para que aparezca en el directorio hay que crearle la ficha desde cero.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
                    <div className="space-y-6">
                      <section>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                          Datos cargados
                        </p>
                        <dl className="space-y-2">
                          {[
                            ["CUIT", seleccionado.cuit],
                            ["Correo", seleccionado.email],
                            ["Teléfono", seleccionado.telefono ?? seleccionado.whatsapp],
                            ["Dirección", seleccionado.direccion],
                            ["Localidad", [seleccionado.localidad, seleccionado.provincia].filter(Boolean).join(", ")],
                            ["Sitio web", seleccionado.sitio_web],
                            ["Tipo", seleccionado.tipo_proveedor],
                            ["Desde", seleccionado.fecha_inicio_experiencia],
                          ].map(([label, valor]) =>
                            valor ? (
                              <div key={label as string} className="flex gap-2 text-sm">
                                <dt className="text-slate-400 w-24 flex-shrink-0">{label}</dt>
                                <dd className="text-slate-800 font-medium break-words min-w-0">{valor as string}</dd>
                              </div>
                            ) : null
                          )}
                        </dl>
                      </section>

                      {seleccionado.descripcion && (
                        <section>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                            Descripción
                          </p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">
                            {seleccionado.descripcion}
                          </p>
                        </section>
                      )}

                      {seleccionado.motivo_rechazo && (
                        <section>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                            Motivo de rechazo
                          </p>
                          <p className="text-sm text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-100">
                            {seleccionado.motivo_rechazo}
                          </p>
                        </section>
                      )}
                    </div>

                    <div className="space-y-6">
                      <section>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                          Servicios que ofrece ({seleccionado.servicios.length})
                        </p>
                        {seleccionado.servicios.length === 0 ? (
                          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-4 leading-relaxed">
                            No declaró ningún servicio. Su ficha no va a aparecer en ninguna
                            búsqueda del directorio: antes de aprobarla conviene pedirle que
                            complete el rubro desde su panel.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {seleccionado.servicios.map((s) => (
                              <li key={s.id}
                                className="flex items-center gap-2 justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Tags className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-sm text-slate-800 font-medium truncate">{s.nombre}</span>
                                  {!s.oficial && (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0">
                                      fuera del catálogo
                                    </span>
                                  )}
                                  {!s.activa && (
                                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0">
                                      inactivo
                                    </span>
                                  )}
                                </div>
                                {!s.oficial && (
                                  <button
                                    onClick={() => subirServicioAlCatalogo(s)}
                                    disabled={isPending}
                                    title={`Subirlo al catálogo como “${normalizarNombreServicio(s.nombre)}”`}
                                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2 py-1 flex-shrink-0 transition-colors disabled:opacity-50"
                                  >
                                    <ArrowUpCircle className="w-3.5 h-3.5" /> Al catálogo
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {propuestos.length > 0 && (
                          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                            {propuestos.length === 1
                              ? "Ese servicio lo escribió a mano y todavía no está en el catálogo oficial."
                              : `Esos ${propuestos.length} servicios los escribió a mano y todavía no están en el catálogo oficial.`}{" "}
                            Subirlos deja el nombre normalizado y disponible para el resto de la red.
                          </p>
                        )}
                      </section>

                      <section>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                          Su ficha: {c.completos} de {c.total} campos ({c.pct}%)
                        </p>
                        <div className="h-1.5 w-full rounded-sm bg-slate-100 overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-sm ${c.pct >= 70 ? "bg-emerald-500" : c.pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${c.pct}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                          <CampoCompletitud etiqueta="Servicios" ok={c.conServicios} />
                          {[...c.vacios, ...c.cargados].map((campo) => (
                            <CampoCompletitud
                              key={String(campo.clave)}
                              etiqueta={campo.etiqueta}
                              ok={c.cargados.includes(campo)}
                            />
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                {seleccionado.estado === "pendiente_revision" && (
                  <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-5 flex flex-col sm:flex-row gap-3">
                    {seleccionado.servicios.length === 0 && (
                      <p className="text-xs text-amber-800 flex items-center gap-1.5 flex-1">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Aprobarla sin servicios la publica invisible.
                      </p>
                    )}
                    <div className="flex gap-3 sm:ml-auto">
                      <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" disabled={isPending}
                        onClick={() => setModalRechazo({ id: seleccionado.id, nombre: nombreCompleto(seleccionado) })}>
                        <X className="w-4 h-4 mr-2" /> Rechazar
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]" disabled={isPending}
                        onClick={() => handleAprobar(seleccionado.id)}>
                        <Check className="w-4 h-4 mr-2" /> Aprobar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Modal Rechazo */}
      {modalRechazo && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setModalRechazo(null)} />
          {/* items-start + overflow-y-auto: centrado el modal no scrollea y en pantallas bajas se corta */}
          <div className="fixed z-50 inset-0 flex items-start justify-center overflow-y-auto p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-8 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Rechazar particular</h3>
              <p className="text-sm text-slate-500 mb-4">
                Ingresá el motivo para rechazar a <strong>{modalRechazo.nombre}</strong>.
              </p>
              <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: Las certificaciones presentadas no son válidas."
                className="w-full border border-slate-200 rounded-xl p-3 text-base sm:text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setModalRechazo(null); setMotivoRechazo(""); }}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" disabled={!motivoRechazo.trim() || isPending}
                  onClick={handleRechazar}>
                  Confirmar rechazo
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CampoCompletitud({ etiqueta, ok }: { etiqueta: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      )}
      <span className={ok ? "text-slate-500" : "text-slate-900 font-semibold"}>{etiqueta}</span>
    </div>
  );
}
