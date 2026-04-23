"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tag as TagIcon, Loader2, Search, CheckCircle2, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { saveTags } from "../acciones";
import { toast } from "sonner";

interface TagRow {
  id: string;
  nombre: string;
  tipo_tag: string;
}

const TIPO_TAG_LABELS: Record<string, string> = {
  capacidad: "Capacidades",
  material: "Materiales",
  modalidad_servicio: "Modalidad",
  industria: "Industria",
  problema: "Necesidad que resuelvo",
  general: "General",
  ubicacion: "Ubicación",
};

const TIPO_TAG_ORDEN = ["capacidad", "material", "industria", "modalidad_servicio", "problema", "general", "ubicacion"];

export default function MiPerfilEtiquetasPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [allTags, setAllTags] = useState<TagRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function init() {
      const { data: dbTags } = await supabase
        .from("tags")
        .select("id, nombre, tipo_tag")
        .eq("activo", true)
        .order("nombre");
      if (dbTags) setAllTags(dbTags as TagRow[]);

      if (!currentUser?.entityId) {
        setFetching(false);
        return;
      }

      const relationTable = currentUser.role === "company" ? "empresas_tags" : "proveedores_tags";
      const relationKey = currentUser.role === "company" ? "empresa_id" : "proveedor_id";

      const { data: current } = await supabase
        .from(relationTable)
        .select("tag_id")
        .eq(relationKey, currentUser.entityId);
      if (current) {
        setSelectedIds(new Set((current as { tag_id: string }[]).map((x) => x.tag_id)));
      }
      setFetching(false);
    }
    init();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  const tagsPorTipo = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? allTags.filter((t) => t.nombre.toLowerCase().includes(term))
      : allTags;
    const map = new Map<string, TagRow[]>();
    for (const tag of filtered) {
      if (!map.has(tag.tipo_tag)) map.set(tag.tipo_tag, []);
      map.get(tag.tipo_tag)!.push(tag);
    }
    return TIPO_TAG_ORDEN
      .filter((tipo) => map.has(tipo))
      .map((tipo) => ({
        tipo,
        label: TIPO_TAG_LABELS[tipo] ?? tipo,
        items: map.get(tipo)!,
      }));
  }, [allTags, search]);

  const selectedTags = useMemo(
    () => allTags.filter((t) => selectedIds.has(t.id)),
    [allTags, selectedIds]
  );

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar etiqueta (ej. Soldadura, Alimentaria...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 modern-scrollbar space-y-6">
            {tagsPorTipo.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No se encontraron etiquetas.</div>
            ) : (
              tagsPorTipo.map(({ tipo, label, items }) => (
                <div key={tipo}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    {label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map((tag) => {
                      const active = selectedIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggle(tag.id)}
                          aria-pressed={active}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            active
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
              {selectedTags.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 text-sm bg-white/10 px-3 py-2 rounded-lg border border-white/5"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium text-slate-200 line-clamp-1">{t.nombre}</span>
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
              ))}
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
