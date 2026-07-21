"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tag as TagIcon, Loader2, Search, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { saveTags, crearEtiquetaLibre } from "../acciones";
import {
  TIPO_TAG_LABELS,
  TIPO_TAG_ORDEN,
  slugEtiqueta,
  limpiarNombreEtiqueta,
  validarEtiquetaLibre,
  ETIQUETA_MIN,
  ETIQUETA_MAX,
  MAX_ETIQUETAS_LIBRES,
} from "@/modulos/compartido/etiquetas";
import { toast } from "sonner";

interface TagRow {
  id: string;
  nombre: string;
  tipo_tag: string;
  administrado_por_admin: boolean;
}

/** Grupo sintético para las etiquetas propias, que en la base son todas `general`. */
const GRUPO_PROPIAS = "__propias__";

export default function MiPerfilEtiquetasPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [catalogo, setCatalogo] = useState<TagRow[]>([]);
  const [misLibres, setMisLibres] = useState<TagRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creando, setCreando] = useState(false);
  const [search, setSearch] = useState("");
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function init() {
      try {
        // El catálogo que ve todo el mundo: sólo lo curado por la UIAB.
        const { data: dbTags } = await supabase
          .from("tags")
          .select("id, nombre, tipo_tag, administrado_por_admin")
          .eq("activo", true)
          .eq("administrado_por_admin", true)
          .order("nombre");
        if (dbTags) setCatalogo(dbTags as TagRow[]);

        if (!currentUser?.entityId) return;

        const relationTable = currentUser.role === "company" ? "empresas_tags" : "proveedores_tags";
        const relationKey = currentUser.role === "company" ? "empresa_id" : "proveedor_id";

        // Se traen las tags embebidas para recuperar también las propias, que
        // por definición no vienen en el catálogo de arriba.
        const { data: current } = await supabase
          .from(relationTable)
          .select("tag_id, tags ( id, nombre, tipo_tag, administrado_por_admin )")
          .eq(relationKey, currentUser.entityId);

        if (current) {
          const filas = current as unknown as {
            tag_id: string;
            tags: TagRow | null;
          }[];
          setSelectedIds(new Set(filas.map((x) => x.tag_id)));
          setMisLibres(
            filas
              .map((x) => x.tags)
              .filter((t): t is TagRow => Boolean(t) && !t!.administrado_por_admin)
          );
        }
      } catch (err) {
        console.error("[perfil/etiquetas] init falló:", err);
      } finally {
        setFetching(false);
      }
    }
    init();
  }, [authLoading, currentUser?.entityId, currentUser?.role, supabase]);

  // Sin este merge, una etiqueta propia desaparece del panel de su propio dueño
  // en cuanto recarga la página.
  const allTags = useMemo(() => {
    const porId = new Map<string, TagRow>();
    for (const t of catalogo) porId.set(t.id, t);
    for (const t of misLibres) porId.set(t.id, t);
    return [...porId.values()];
  }, [catalogo, misLibres]);

  const tagsPorTipo = useMemo(() => {
    const term = search.trim().toLowerCase();
    const coincide = (t: TagRow) => !term || t.nombre.toLowerCase().includes(term);

    const grupos = TIPO_TAG_ORDEN.map((tipo) => ({
      tipo,
      label: TIPO_TAG_LABELS[tipo] ?? tipo,
      items: catalogo.filter((t) => t.tipo_tag === tipo && coincide(t)),
    })).filter((g) => g.items.length > 0);

    const propias = misLibres.filter(coincide);
    if (propias.length > 0) {
      grupos.push({ tipo: GRUPO_PROPIAS, label: "Tus etiquetas propias", items: propias });
    }
    return grupos;
  }, [catalogo, misLibres, search]);

  const selectedTags = useMemo(
    () => allTags.filter((t) => selectedIds.has(t.id)),
    [allTags, selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCrearEtiqueta = useCallback(
    async (textoCrudo: string) => {
      const texto = limpiarNombreEtiqueta(textoCrudo);

      const errorLocal = validarEtiquetaLibre(texto);
      if (errorLocal) {
        toast.error("Revisá la etiqueta", { description: errorLocal });
        return;
      }

      // Si ya está a la vista (catálogo o propia), se marca sin ir al servidor.
      const slug = slugEtiqueta(texto);
      const yaVisible = allTags.find((t) => slugEtiqueta(t.nombre) === slug);
      if (yaVisible) {
        setNuevaEtiqueta("");
        setSearch("");
        if (selectedIds.has(yaVisible.id)) {
          toast.info("Ya tenés esa etiqueta", { description: `«${yaVisible.nombre}» ya está en tu lista.` });
        } else {
          toggle(yaVisible.id);
          toast.info(`«${yaVisible.nombre}» ya existía`, { description: "La marcamos por vos." });
        }
        return;
      }

      if (misLibres.length >= MAX_ETIQUETAS_LIBRES) {
        toast.error("Llegaste al máximo", {
          description: `Podés tener hasta ${MAX_ETIQUETAS_LIBRES} etiquetas propias. Sacá alguna antes de agregar otra.`,
        });
        return;
      }

      setCreando(true);
      const res = await crearEtiquetaLibre(texto);
      setCreando(false);

      if ("error" in res) {
        toast.error("No pudimos crear la etiqueta", { description: res.error });
        return;
      }

      if (!res.tag.administrado_por_admin) {
        setMisLibres((prev) =>
          prev.some((t) => t.id === res.tag.id) ? prev : [...prev, res.tag]
        );
      }
      setSelectedIds((prev) => new Set(prev).add(res.tag.id));
      setNuevaEtiqueta("");
      setSearch("");

      toast.success(
        res.reutilizada ? `Usamos «${res.tag.nombre}», que ya existía` : `Agregamos «${res.tag.nombre}»`,
        { description: "Acordate de apretar «Guardar Etiquetas» para que quede." }
      );
    },
    [allTags, misLibres.length, selectedIds, toggle]
  );

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!currentUser.entityId) {
      toast.error("Falta tu perfil principal", {
        description: "Antes de seleccionar etiquetas, completá tus datos en Datos y Contacto.",
      });
      return;
    }
    setSaving(true);
    const res = await saveTags(
      currentUser.role as "company" | "provider",
      currentUser.entityId,
      Array.from(selectedIds)
    );
    if (!res.error) {
      toast.success("Etiquetas actualizadas", {
        description: "El algoritmo de match ya está usando tus nuevas etiquetas.",
      });
    } else {
      toast.error("Error al guardar", { description: res.error });
    }
    setSaving(false);
  };

  const sinEntidad = !currentUser.entityId;
  const textoNuevo = limpiarNombreEtiqueta(nuevaEtiqueta);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Etiquetas para el Match</h1>
        <p className="text-slate-500 mt-1">
          Marcá tus capacidades, materiales, modalidades e industrias. Cuanto mejor te describas,
          mejor te conectará el algoritmo con oportunidades relevantes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Catálogo de tags */}
        <Card className="p-6 border-slate-100 shadow-sm lg:col-span-3">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-primary-600" /> Catálogo de Etiquetas
          </h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar etiqueta (ej. Soldadura, Alimentaria...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          {/* Crear etiqueta propia */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <label
              htmlFor="nueva-etiqueta"
              className="text-xs font-bold text-slate-500 uppercase tracking-widest"
            >
              Agregá la tuya
            </label>
            <p className="text-[11px] text-slate-400 mt-1 mb-2">
              ¿No encontrás lo que hacés? Escribilo. No aparece en el catálogo general, pero se ve en
              tu ficha y cuenta para el match.
            </p>
            <div className="flex gap-2">
              <input
                id="nueva-etiqueta"
                type="text"
                value={nuevaEtiqueta}
                onChange={(e) => setNuevaEtiqueta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCrearEtiqueta(nuevaEtiqueta);
                  }
                }}
                maxLength={ETIQUETA_MAX}
                disabled={sinEntidad || creando}
                placeholder="Ej. Mecanizado de titanio"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCrearEtiqueta(nuevaEtiqueta)}
                disabled={sinEntidad || creando || textoNuevo.length < ETIQUETA_MIN}
              >
                {creando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {sinEntidad
                ? "Primero completá tus datos en «Datos y Contacto»."
                : `${misLibres.length}/${MAX_ETIQUETAS_LIBRES} etiquetas propias`}
            </p>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 modern-scrollbar space-y-6">
            {tagsPorTipo.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-500 text-sm">
                  No encontramos «{search.trim()}» en el catálogo.
                </p>
                {!sinEntidad && !validarEtiquetaLibre(search) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={creando}
                    onClick={() => handleCrearEtiqueta(search)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Crear «{limpiarNombreEtiqueta(search)}» como
                    etiqueta propia
                  </Button>
                )}
              </div>
            ) : (
              tagsPorTipo.map(({ tipo, label, items }) => (
                <div key={tipo}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    {label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map((tag) => {
                      const active = selectedIds.has(tag.id);
                      const propia = !tag.administrado_por_admin;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggle(tag.id)}
                          aria-pressed={active}
                          title={propia ? "Etiqueta propia, pendiente de revisión" : undefined}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            propia
                              ? active
                                ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                                : "bg-white border-dashed border-amber-300 text-amber-800 hover:bg-amber-50"
                              : active
                                ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {tag.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Resumen */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 bg-slate-900 border-none shadow-xl text-white">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-300" />
              Tus etiquetas ({selectedTags.length})
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Sumá hasta donde tenga sentido. Cada etiqueta coincidente con una oportunidad suma
              puntos en el match (hasta 40 pts por tags).
            </p>

            <ul className="space-y-2 mb-8 max-h-[280px] overflow-y-auto pr-1 modern-scrollbar">
              {selectedTags.length === 0 && (
                <li className="text-sm text-slate-500 italic">Todavía no elegiste etiquetas.</li>
              )}
              {selectedTags.map((t) => {
                const propia = !t.administrado_por_admin;
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-sm bg-white/10 px-3 py-2 rounded-lg border border-white/5"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {propia ? (
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-200 line-clamp-1">{t.nombre}</span>
                      {propia && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-300 border border-amber-400/40 rounded px-1.5 py-0.5 shrink-0">
                          propia
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold h-12 shadow-[0_0_20px_rgba(14,165,233,0.3)] border-none"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Etiquetas"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
