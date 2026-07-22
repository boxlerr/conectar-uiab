"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SelectUIAB } from "@/components/ui/select-uiab";
import {
  Tag,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ArrowUpCircle,
  Merge,
  CircleSlash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  promoverEtiqueta,
  rechazarEtiqueta,
  actualizarEtiqueta,
  toggleActivarEtiqueta,
  fusionarEtiqueta,
  eliminarEtiqueta,
} from "@/modulos/admin/acciones";
import { TIPO_TAG_LABELS, TIPO_TAG_ORDEN } from "@/modulos/compartido/etiquetas";

export type EtiquetaAdmin = {
  id: string;
  nombre: string;
  slug: string;
  tipo_tag: string;
  activo: boolean;
  administrado_por_admin: boolean;
  revisada: boolean;
  creado_en: string;
  autor: string | null;
  usos: number;
};

type Pestana = "propuestas" | "catalogo" | "inactivas" | "todas";

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "propuestas", label: "Propuestas por socios" },
  { id: "catalogo", label: "Catálogo oficial" },
  { id: "inactivas", label: "Inactivas" },
  { id: "todas", label: "Todas" },
];

export function PanelEtiquetas({ etiquetas }: { etiquetas: EtiquetaAdmin[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pestana, setPestana] = useState<Pestana>("propuestas");
  const [busqueda, setBusqueda] = useState("");

  const [enEdicion, setEnEdicion] = useState<EtiquetaAdmin | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipoTag, setTipoTag] = useState("general");

  const [aFusionar, setAFusionar] = useState<EtiquetaAdmin | null>(null);
  const [destinoFusion, setDestinoFusion] = useState("");

  const [aEliminar, setAEliminar] = useState<EtiquetaAdmin | null>(null);
  const [confirmacionTexto, setConfirmacionTexto] = useState("");

  const conteos = useMemo(
    () => ({
      propuestas: etiquetas.filter((e) => !e.administrado_por_admin && !e.revisada).length,
      catalogo: etiquetas.filter((e) => e.administrado_por_admin && e.activo).length,
      inactivas: etiquetas.filter((e) => !e.activo).length,
      todas: etiquetas.length,
    }),
    [etiquetas]
  );

  const filtradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return etiquetas
      .filter((e) => {
        if (pestana === "propuestas") return !e.administrado_por_admin && !e.revisada;
        if (pestana === "catalogo") return e.administrado_por_admin && e.activo;
        if (pestana === "inactivas") return !e.activo;
        return true;
      })
      .filter(
        (e) =>
          !term ||
          e.nombre.toLowerCase().includes(term) ||
          e.slug.includes(term) ||
          (e.autor ?? "").toLowerCase().includes(term)
      );
  }, [etiquetas, pestana, busqueda]);

  // Sólo se puede fusionar hacia el catálogo oficial.
  const opcionesFusion = useMemo(
    () =>
      etiquetas
        .filter((e) => e.administrado_por_admin)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [etiquetas]
  );

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handlePromover(etiqueta: EtiquetaAdmin) {
    const res = await promoverEtiqueta(etiqueta.id);
    if (res.error) {
      toast.error("No se pudo promover", { description: res.error });
      return;
    }
    toast.success(`«${etiqueta.nombre}» pasó al catálogo oficial`, {
      description: "Ya la pueden elegir todos los socios.",
    });
    refresh();
  }

  async function handleRechazar(etiqueta: EtiquetaAdmin) {
    const res = await rechazarEtiqueta(etiqueta.id);
    if (res.error) {
      toast.error("No se pudo rechazar", { description: res.error });
      return;
    }
    toast.success(`«${etiqueta.nombre}» rechazada del padrón`, {
      description: "No se sube al catálogo, pero la socia la sigue usando en su ficha.",
    });
    refresh();
  }

  async function handleToggle(etiqueta: EtiquetaAdmin) {
    const res = await toggleActivarEtiqueta(etiqueta.id, !etiqueta.activo);
    if (res.error) {
      toast.error("Error al cambiar estado", { description: res.error });
      return;
    }
    toast.success(`Etiqueta ${!etiqueta.activo ? "activada" : "desactivada"}`);
    refresh();
  }

  function handleAbrirEdicion(etiqueta: EtiquetaAdmin) {
    setEnEdicion(etiqueta);
    setNombre(etiqueta.nombre);
    setTipoTag(etiqueta.tipo_tag);
  }

  async function handleGuardarEdicion() {
    if (!enEdicion) return;
    const res = await actualizarEtiqueta(enEdicion.id, nombre, tipoTag);
    if (res.error) {
      toast.error("No se pudo guardar", { description: res.error });
      return;
    }
    toast.success("Etiqueta actualizada");
    setEnEdicion(null);
    refresh();
  }

  async function handleFusionar() {
    if (!aFusionar || !destinoFusion) return;
    const destino = opcionesFusion.find((e) => e.id === destinoFusion);
    const res = await fusionarEtiqueta(aFusionar.id, destinoFusion);
    if (res.error) {
      toast.error("No se pudo fusionar", { description: res.error });
      return;
    }
    toast.success(`«${aFusionar.nombre}» se fusionó con «${destino?.nombre}»`, {
      description: "Los socios que la tenían ahora figuran con la oficial.",
    });
    setAFusionar(null);
    setDestinoFusion("");
    refresh();
  }

  async function handleEliminar() {
    if (!aEliminar) return;
    const res = await eliminarEtiqueta(aEliminar.id);
    if (res.error) {
      toast.error("No se pudo eliminar", { description: res.error });
      return;
    }
    toast.success(`«${aEliminar.nombre}» eliminada`);
    setAEliminar(null);
    setConfirmacionTexto("");
    refresh();
  }

  const eliminarBloqueado =
    !!aEliminar && aEliminar.usos > 0 && confirmacionTexto.trim() !== aEliminar.nombre;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary-600" />
          Etiquetas
        </h1>
        <p className="text-slate-500 mt-1">
          Las etiquetas que los socios escriben a mano no aparecen en el catálogo general hasta que
          las promuevas. Sí se ven en su ficha y cuentan para el match.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              pestana === p.id
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
          >
            {p.label}
            <span
              className={`ml-2 text-xs ${pestana === p.id ? "text-slate-300" : "text-slate-400"}`}
            >
              {conteos[p.id]}
            </span>
          </button>
        ))}
      </div>

      <Card className="p-4 shadow-sm border-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, slug o socio que la propuso..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay etiquetas para mostrar acá.</p>
          </div>
        ) : (
          filtradas.map((etiqueta) => {
            const propuesta = !etiqueta.administrado_por_admin;
            return (
              <Card
                key={etiqueta.id}
                className={`p-5 flex flex-col sm:flex-row gap-4 sm:items-center shadow-sm border-slate-100 transition-all ${
                  !etiqueta.activo ? "opacity-75 bg-slate-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">{etiqueta.nombre}</h3>
                    {propuesta ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Propuesta
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Catálogo
                      </span>
                    )}
                    <span className="bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {TIPO_TAG_LABELS[etiqueta.tipo_tag] ?? etiqueta.tipo_tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-3">
                    <span>
                      Slug:{" "}
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">
                        {etiqueta.slug}
                      </span>
                    </span>
                    <span
                      className={etiqueta.usos === 0 ? "text-slate-300" : "text-slate-500 font-semibold"}
                    >
                      {etiqueta.usos} {etiqueta.usos === 1 ? "socio la usa" : "socios la usan"}
                    </span>
                    {etiqueta.autor && (
                      <span title="Quien la propuso primero. Puede estar en uso por varios socios.">
                        Propuesta por {etiqueta.autor}
                      </span>
                    )}
                    <span>{new Date(etiqueta.creado_en).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>

                <div className="flex gap-1 items-center sm:pl-4 sm:border-l sm:border-slate-100 mt-2 sm:mt-0">
                  {propuesta && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePromover(etiqueta)}
                        disabled={isPending}
                        className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Promover al catálogo oficial"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAFusionar(etiqueta);
                          setDestinoFusion("");
                        }}
                        disabled={isPending}
                        className="text-slate-500 hover:text-primary-600 hover:bg-primary-50"
                        title="Fusionar con una etiqueta oficial"
                      >
                        <Merge className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRechazar(etiqueta)}
                        disabled={isPending}
                        className="text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        title="Rechazar del padrón (sin borrar: la socia la sigue usando)"
                      >
                        <CircleSlash className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAbrirEdicion(etiqueta)}
                    disabled={isPending}
                    className="text-slate-500 hover:text-primary-600 hover:bg-primary-50"
                    title="Editar nombre y tipo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAEliminar(etiqueta);
                      setConfirmacionTexto("");
                    }}
                    disabled={isPending}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div
                    className="flex items-center gap-2 px-2"
                    title={etiqueta.activo ? "Desactivar" : "Activar"}
                  >
                    <Switch
                      checked={etiqueta.activo}
                      onCheckedChange={() => handleToggle(etiqueta)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Editar */}
      {enEdicion && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setEnEdicion(null)}
          />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Editar etiqueta</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEnEdicion(null)}
                  className="h-8 w-8 text-slate-500 hover:bg-slate-200/50 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nombre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    El slug se recalcula solo. Si el nombre choca con otra etiqueta, fusionalas en
                    vez de renombrar.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tipo
                  </label>
                  <SelectUIAB
                    ariaLabel="Tipo de etiqueta"
                    value={tipoTag}
                    onValueChange={(v) => setTipoTag(v)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-white"
                    options={TIPO_TAG_ORDEN.map((tipo) => ({ value: tipo, label: TIPO_TAG_LABELS[tipo] ?? tipo }))}
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Las etiquetas que escriben los socios entran como «General». Reclasificala antes
                    de promoverla.
                  </p>
                </div>
              </div>
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEnEdicion(null)}
                  disabled={isPending}
                  className="font-semibold text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardarEdicion}
                  disabled={isPending || !nombre.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold min-w-[120px]"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fusionar */}
      {aFusionar && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setAFusionar(null)}
          />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Fusionar etiqueta</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAFusionar(null)}
                  className="h-8 w-8 text-slate-500 hover:bg-slate-200/50 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">«{aFusionar.nombre}»</span> va a desaparecer y los{" "}
                  {aFusionar.usos} socios que la tienen van a quedar con la etiqueta oficial que
                  elijas. El nombre viejo se guarda como alias.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Fusionar con
                  </label>
                  <SelectUIAB
                    ariaLabel="Etiqueta destino de la fusión"
                    placeholder="Elegí una etiqueta del catálogo..."
                    value={destinoFusion}
                    onValueChange={(v) => setDestinoFusion(v)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium bg-white"
                    options={opcionesFusion.map((e) => ({ value: e.id, label: e.nombre }))}
                  />
                </div>
              </div>
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAFusionar(null)}
                  disabled={isPending}
                  className="font-semibold text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFusionar}
                  disabled={isPending || !destinoFusion}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold min-w-[120px]"
                >
                  {isPending ? "Fusionando..." : "Fusionar"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Eliminar */}
      {aEliminar && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setAEliminar(null)}
          />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">Eliminar etiqueta</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {aEliminar.usos > 0 ? (
                        <>
                          Se va a borrar de la ficha de{" "}
                          <span className="font-semibold">{aEliminar.usos}</span>{" "}
                          {aEliminar.usos === 1 ? "socio" : "socios"}. Esto no se puede deshacer.
                        </>
                      ) : (
                        <>
                          Nadie la está usando, así que se borra sin afectar a ningún socio.
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Si sólo querés sacarla del catálogo, desactivala. Si es un sinónimo de una
                      oficial, fusionala.
                    </p>
                    {aEliminar.usos > 0 && (
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Escribí «{aEliminar.nombre}» para confirmar
                        </label>
                        <input
                          type="text"
                          value={confirmacionTexto}
                          onChange={(e) => setConfirmacionTexto(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAEliminar(null)}
                  disabled={isPending}
                  className="font-semibold text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEliminar}
                  disabled={isPending || eliminarBloqueado}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold min-w-[100px]"
                >
                  {isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
