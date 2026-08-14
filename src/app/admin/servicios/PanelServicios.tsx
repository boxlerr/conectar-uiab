"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Tags, Plus, Search, Edit2, Trash2, X, AlertCircle, ArrowUpCircle,
  ArrowDownCircle, Merge, Power, PowerOff, Wand2, Building2, Wrench,
  CornerDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  crearCategoria,
  editarCategoria,
  toggleActivarCategoria,
  eliminarCategoria,
  promoverCategoria,
  fusionarCategorias,
  type ResultadoCategoria,
} from "@/modulos/admin/acciones";
import { fallo, llamarAccion } from "@/lib/accion-segura";
import {
  estaNormalizado,
  normalizarNombreServicio,
} from "@/modulos/compartido/especialidades";

export type Servicio = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activa: boolean;
  creado_en: string;
  /** false = la propuso un socio desde /perfil/servicios y falta curarla. */
  administrado_por_admin: boolean;
  /** Macro-rubro del que cuelga, si cuelga de alguno. */
  padre: string | null;
  empresas: number;
  particulares: number;
  hijas: number;
};

type Filtro = "propuestas" | "oficiales" | "sin_uso" | "inactivos" | "todos";

const usos = (s: Servicio) => s.empresas + s.particulares + s.hijas;

export function PanelServicios({ servicios }: { servicios: Servicio[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");

  const propuestas = useMemo(
    () => servicios.filter((s) => !s.administrado_por_admin),
    [servicios]
  );
  // Si hay cola de curaduría, la pantalla abre en la cola.
  const [filtro, setFiltro] = useState<Filtro>(
    propuestas.length > 0 ? "propuestas" : "todos"
  );

  const [modalEdicion, setModalEdicion] = useState<Servicio | "nuevo" | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [aEliminar, setAEliminar] = useState<Servicio | null>(null);
  const [promocion, setPromocion] = useState<Servicio | null>(null);
  const [nombrePromocion, setNombrePromocion] = useState("");
  const [fusion, setFusion] = useState<{ origen: Servicio; destinoId: string } | null>(null);
  const [busquedaFusion, setBusquedaFusion] = useState("");

  const counts = {
    propuestas: propuestas.length,
    oficiales: servicios.filter((s) => s.administrado_por_admin).length,
    sin_uso: servicios.filter((s) => usos(s) === 0).length,
    inactivos: servicios.filter((s) => !s.activa).length,
    todos: servicios.length,
    sinNormalizar: servicios.filter((s) => !estaNormalizado(s.nombre)).length,
  };

  const filtrados = servicios.filter((s) => {
    const q = busqueda.trim().toLowerCase();
    const coincide =
      !q ||
      s.nombre.toLowerCase().includes(q) ||
      s.slug.includes(q) ||
      (s.padre ?? "").toLowerCase().includes(q) ||
      (s.descripcion ?? "").toLowerCase().includes(q);
    if (!coincide) return false;

    if (filtro === "propuestas") return !s.administrado_por_admin;
    if (filtro === "oficiales") return s.administrado_por_admin;
    if (filtro === "sin_uso") return usos(s) === 0;
    if (filtro === "inactivos") return !s.activa;
    return true;
  });

  function refresh() {
    startTransition(() => router.refresh());
  }

  // ── Crear / editar ─────────────────────────────────────────────────────────

  function abrirEdicion(servicio: Servicio | "nuevo") {
    setModalEdicion(servicio);
    setNombre(servicio === "nuevo" ? "" : servicio.nombre);
    setDescripcion(servicio === "nuevo" ? "" : servicio.descripcion ?? "");
  }

  async function guardar() {
    if (!modalEdicion) return;
    // Anotado como ResultadoCategoria (todo opcional) para poder leer `duplicado`
    // sin que el type guard de `fallo` recorte el resultado a `{ error }`.
    const res: ResultadoCategoria =
      modalEdicion === "nuevo"
        ? await llamarAccion(() => crearCategoria(nombre, descripcion))
        : await llamarAccion(() => editarCategoria(modalEdicion.id, nombre, descripcion));

    if (res.error) {
      toast.error("No se pudo guardar", { description: res.error });
      if (res.duplicado && modalEdicion !== "nuevo") {
        setFusion({ origen: modalEdicion, destinoId: res.duplicado.id });
        setBusquedaFusion("");
        setModalEdicion(null);
      }
      return;
    }
    toast.success(
      modalEdicion === "nuevo" ? "Servicio creado" : "Servicio actualizado",
      { description: res.nombreFinal ? `Guardado como “${res.nombreFinal}”` : undefined }
    );
    setModalEdicion(null);
    refresh();
  }

  // ── Curaduría ──────────────────────────────────────────────────────────────

  function abrirPromocion(servicio: Servicio) {
    setPromocion(servicio);
    setNombrePromocion(normalizarNombreServicio(servicio.nombre));
  }

  async function confirmarPromocion() {
    if (!promocion) return;
    const res: ResultadoCategoria = await llamarAccion(() =>
      promoverCategoria(promocion.id, true, nombrePromocion)
    );
    if (res.error) {
      toast.error("No se pudo subir al catálogo", { description: res.error });
      // El choque de nombres se resuelve fusionando, no reintentando.
      if (res.duplicado) {
        setFusion({ origen: promocion, destinoId: res.duplicado.id });
        setBusquedaFusion("");
        setPromocion(null);
      }
      return;
    }
    toast.success(`“${res.nombreFinal ?? promocion.nombre}” ya es parte del catálogo`);
    setPromocion(null);
    refresh();
  }

  async function bajarAPropuesta(servicio: Servicio) {
    const res = await llamarAccion(() => promoverCategoria(servicio.id, false));
    if (fallo(res)) {
      toast.error("No se pudo bajar del catálogo", { description: res.error });
      return;
    }
    toast.success(`"${servicio.nombre}" volvió a ser una propuesta de socio`);
    refresh();
  }

  async function confirmarFusion() {
    if (!fusion?.destinoId) return;
    const destino = servicios.find((s) => s.id === fusion.destinoId);
    const res = await llamarAccion(() => fusionarCategorias(fusion.origen.id, fusion.destinoId));
    if (fallo(res)) {
      toast.error("No se pudo fusionar", { description: res.error });
      return;
    }
    toast.success(`"${fusion.origen.nombre}" se unió a "${destino?.nombre ?? "el otro servicio"}"`);
    setFusion(null);
    setBusquedaFusion("");
    refresh();
  }

  async function alternarActiva(servicio: Servicio) {
    const res = await llamarAccion(() => toggleActivarCategoria(servicio.id, !servicio.activa));
    if (fallo(res)) {
      toast.error("No se pudo cambiar el estado", { description: res.error });
      return;
    }
    toast.success(`"${servicio.nombre}" ${servicio.activa ? "desactivado" : "activado"}`);
    refresh();
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    const res = await llamarAccion(() => eliminarCategoria(aEliminar.id));
    if (fallo(res)) {
      toast.error("No se pudo eliminar", { description: res.error });
      return;
    }
    toast.success(`"${aEliminar.nombre}" eliminado`);
    setAEliminar(null);
    refresh();
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "propuestas", label: `Propuestas (${counts.propuestas})` },
    { key: "oficiales", label: `Catálogo oficial (${counts.oficiales})` },
    { key: "sin_uso", label: `Sin usar (${counts.sin_uso})` },
    { key: "inactivos", label: `Inactivos (${counts.inactivos})` },
    { key: "todos", label: `Todos (${counts.todos})` },
  ];

  const nombreNormalizado = normalizarNombreServicio(nombre);
  const cambiaAlGuardar = Boolean(nombre.trim()) && nombreNormalizado !== nombre.trim();

  const candidatasFusion = servicios
    .filter((s) => s.id !== fusion?.origen.id)
    .filter((s) => {
      const q = busquedaFusion.trim().toLowerCase();
      return !q || s.nombre.toLowerCase().includes(q) || (s.padre ?? "").toLowerCase().includes(q);
    })
    .sort(
      (a, b) =>
        Number(b.administrado_por_admin) - Number(a.administrado_por_admin) ||
        a.nombre.localeCompare(b.nombre, "es")
    )
    .slice(0, 40);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Tags className="w-8 h-8 text-primary-600" />
            Servicios y especialidades
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            El catálogo que ven todos. Lo que proponen los socios entra acá para curarse.
          </p>
        </div>
        <Button onClick={() => abrirEdicion("nuevo")} className="pl-3 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo servicio
        </Button>
      </div>

      {/* Cola de curaduría: lo único de esta pantalla que pide una decisión. */}
      {counts.propuestas > 0 && filtro !== "propuestas" && (
        <button
          onClick={() => setFiltro("propuestas")}
          className="w-full text-left bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-amber-100/60 transition-colors"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-900 flex-1">
            <span className="font-semibold">{counts.propuestas}</span>{" "}
            {counts.propuestas === 1 ? "servicio propuesto por un socio espera" : "servicios propuestos por socios esperan"} revisión.
          </p>
          <span className="text-xs font-semibold text-amber-700">Ver →</span>
        </button>
      )}

      <Card className="p-3 flex flex-col lg:flex-row gap-3 lg:items-center shadow-sm border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, rubro o slug..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
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

      {counts.sinNormalizar > 0 && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5 px-1">
          <Wand2 className="w-3.5 h-3.5 text-amber-500" />
          {counts.sinNormalizar} {counts.sinNormalizar === 1 ? "nombre está" : "nombres están"} escrito como lo tipeó el socio.
          Al subirlo al catálogo o editarlo se guarda normalizado.
        </p>
      )}

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Servicio</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Uso</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-52">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <Tags className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No hay servicios con este filtro.</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((s) => {
                  const normalizado = estaNormalizado(s.nombre);
                  const enUso = usos(s);
                  return (
                    <tr key={s.id} className={`hover:bg-slate-50/60 transition-colors ${!s.activa ? "bg-slate-50/40" : ""}`}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${s.activa ? "text-slate-900" : "text-slate-400"}`}>
                            {s.nombre}
                          </span>
                          {!normalizado && (
                            <span
                              title={`Al subirlo al catálogo se guarda como "${normalizarNombreServicio(s.nombre)}"`}
                              className="bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            >
                              sin normalizar
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {s.padre && (
                            <>
                              <CornerDownRight className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[220px]">{s.padre}</span>
                              <span className="text-slate-300">·</span>
                            </>
                          )}
                          <span className="font-mono truncate max-w-[280px]" title={s.descripcion ?? undefined}>
                            {s.descripcion || s.slug}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-2.5">
                        {enUso === 0 ? (
                          <span className="text-xs text-slate-300">Nadie lo eligió</span>
                        ) : (
                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            {s.empresas > 0 && (
                              <span className="flex items-center gap-1" title="Empresas con este servicio">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {s.empresas}
                              </span>
                            )}
                            {s.particulares > 0 && (
                              <span className="flex items-center gap-1" title="Particulares con este servicio">
                                <Wrench className="w-3.5 h-3.5 text-slate-400" /> {s.particulares}
                              </span>
                            )}
                            {s.hijas > 0 && (
                              <span className="text-slate-400" title="Especialidades que cuelgan de este rubro">
                                {s.hijas} sub.
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.administrado_por_admin ? (
                            <span className="bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Oficial
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Propuesta
                            </span>
                          )}
                          {!s.activa && (
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          {!s.administrado_por_admin ? (
                            <IconoAccion
                              onClick={() => abrirPromocion(s)}
                              titulo="Revisar el nombre y subirlo al catálogo oficial"
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                            </IconoAccion>
                          ) : (
                            <IconoAccion
                              onClick={() => bajarAPropuesta(s)}
                              titulo="Sacar del catálogo oficial (vuelve a ser propuesta)"
                              className="text-slate-300 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </IconoAccion>
                          )}
                          <IconoAccion
                            onClick={() => abrirEdicion(s)}
                            titulo="Editar nombre y descripción"
                            className="text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </IconoAccion>
                          <IconoAccion
                            onClick={() => { setFusion({ origen: s, destinoId: "" }); setBusquedaFusion(""); }}
                            titulo="Fusionar con otro servicio (es lo mismo escrito distinto)"
                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Merge className="w-4 h-4" />
                          </IconoAccion>
                          <IconoAccion
                            onClick={() => alternarActiva(s)}
                            titulo={s.activa ? "Desactivar: deja de ofrecerse" : "Activar"}
                            className={s.activa ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-emerald-600 hover:bg-emerald-50"}
                            disabled={isPending}
                          >
                            {s.activa ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </IconoAccion>
                          <IconoAccion
                            onClick={() => setAEliminar(s)}
                            titulo={enUso > 0 ? "Hay fichas usándolo: conviene fusionarlo o desactivarlo" : "Eliminar"}
                            className="text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconoAccion>
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

      {/* ── Subir al catálogo: el paso donde se normaliza el nombre ── */}
      {promocion && (
        <Modal onClose={() => setPromocion(null)} titulo="Subir al catálogo oficial">
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lo que escribió el socio</p>
              <p className="text-sm text-slate-700 font-medium">{promocion.nombre}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Cómo va a quedar en el catálogo <span className="text-rose-500">*</span>
              </label>
              <input
                value={nombrePromocion}
                onChange={(e) => setNombrePromocion(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ya viene con mayúsculas y puntuación acomodadas. Las tildes no se adivinan:
                si faltan, corregilas acá antes de subirlo.
              </p>
            </div>

            {promocion.empresas + promocion.particulares > 0 && (
              <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
                Lo tienen elegido {promocion.empresas > 0 && `${promocion.empresas} empresa(s)`}
                {promocion.empresas > 0 && promocion.particulares > 0 && " y "}
                {promocion.particulares > 0 && `${promocion.particulares} particular(es)`}.
                Renombrarlo no les saca el servicio: sólo cambia cómo se ve.
              </p>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPromocion(null)} disabled={isPending} className="font-semibold text-slate-600">
              Cancelar
            </Button>
            <Button
              onClick={confirmarPromocion}
              disabled={isPending || !nombrePromocion.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold min-w-[140px]"
            >
              Subir al catálogo
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Fusionar duplicados ── */}
      {fusion && (
        <Modal onClose={() => setFusion(null)} titulo="Fusionar servicios">
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Todo lo que hoy cuelga de{" "}
              <span className="font-semibold text-slate-900">“{fusion.origen.nombre}”</span> pasa
              al servicio que elijas, y el duplicado se borra. El nombre viejo queda como
              alias, así el buscador lo sigue encontrando.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={busquedaFusion}
                onChange={(e) => setBusquedaFusion(e.target.value)}
                placeholder="Buscar el servicio que se queda..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
              {candidatasFusion.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">Sin coincidencias.</p>
              ) : (
                candidatasFusion.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFusion({ ...fusion, destinoId: c.id })}
                    className={`w-full text-left px-4 py-2.5 transition-colors ${
                      fusion.destinoId === c.id ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-800">{c.nombre}</span>
                    <span className="block text-[11px] text-slate-400">
                      {c.administrado_por_admin ? "Oficial" : "Propuesta"}
                      {c.padre ? ` · ${c.padre}` : ""}
                      {usos(c) > 0 ? ` · ${usos(c)} en uso` : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFusion(null)} disabled={isPending} className="font-semibold text-slate-600">
              Cancelar
            </Button>
            <Button
              onClick={confirmarFusion}
              disabled={isPending || !fusion.destinoId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold min-w-[120px]"
            >
              Fusionar
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Crear / editar ── */}
      {modalEdicion && (
        <Modal
          onClose={() => setModalEdicion(null)}
          titulo={modalEdicion === "nuevo" ? "Nuevo servicio" : "Editar servicio"}
        >
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Tornería CNC"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 font-medium placeholder:font-normal placeholder:text-slate-400"
              />
              {cambiaAlGuardar ? (
                <p className="text-xs text-amber-700 mt-2 flex items-start gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  Se va a guardar como <span className="font-semibold">“{nombreNormalizado}”</span>.
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  El slug se genera solo, en minúsculas y sin acentos.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Qué incluye este servicio o especialidad..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base sm:text-sm min-h-[90px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalEdicion(null)} disabled={isPending} className="font-semibold text-slate-600">
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={isPending || !nombre.trim()} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold min-w-[120px]">
              Guardar
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Eliminar ── */}
      {aEliminar && (
        <Modal onClose={() => setAEliminar(null)} titulo="Eliminar servicio">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm text-slate-600">
                  ¿Eliminar <span className="font-semibold">“{aEliminar.nombre}”</span>? No se puede deshacer.
                </p>
                {usos(aEliminar) > 0 && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    Hay {usos(aEliminar)} ficha(s) o subrubro(s) usándolo. La base va a rechazar el
                    borrado: fusionalo con el servicio correcto o desactivalo.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAEliminar(null)} disabled={isPending} className="font-semibold text-slate-600">
              Cancelar
            </Button>
            <Button onClick={confirmarEliminar} disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold min-w-[100px]">
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IconoAccion({
  children,
  onClick,
  titulo,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  titulo: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      disabled={disabled}
      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function Modal({
  children,
  onClose,
  titulo,
}: {
  children: React.ReactNode;
  onClose: () => void;
  titulo: string;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={onClose} />
      {/* items-start + overflow-y-auto: centrado el modal no scrollea y en pantallas bajas se corta */}
      <div className="fixed z-50 inset-0 flex items-start justify-center overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">{titulo}</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:bg-slate-200/50 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
