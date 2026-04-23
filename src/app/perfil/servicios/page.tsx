"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Loader2, Search, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { saveCategories } from "../acciones";
import { toast } from "sonner";

export default function MiPerfilServiciosPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  
  const [allCategories, setAllCategories] = useState<{ id: string; nombre: string; categoria_padre_id: string | null }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Esperar a que auth esté lista antes de consultar Supabase.
    if (authLoading) return;

    async function init() {
      // Always fetch master categories so UI doesn't look broken
      const { data: dbCategorias } = await supabase.from('categorias').select('id, nombre, categoria_padre_id').eq('activa', true).order('nombre');
      if (dbCategorias) setAllCategories(dbCategorias);

      if (!currentUser?.entityId) {
         setFetching(false);
         return;
      }

      // 2. Fetch User's current categories
      const relationTable = currentUser.role === "company" ? "empresas_categorias" : "proveedores_categorias";
      const relationKey = currentUser.role === "company" ? "empresa_id" : "proveedor_id";

      const { data: userCurrent } = await supabase.from(relationTable).select('categoria_id').eq(relationKey, currentUser.entityId);
      if (userCurrent) {
        setSelectedIds(userCurrent.map((x: any) => x.categoria_id));
      }
      setFetching(false);
    }
    init();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleToggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    if (!currentUser.entityId) {
       toast.error("Falta tu Perfil Principal", { description: "Antes de seleccionar servicios, primero completa la información en Datos y Contacto." });
       return;
    }
    setSaving(true);
    const res = await saveCategories(currentUser.role as any, currentUser.entityId, selectedIds);
    if (!res.error) {
      toast.success("Especialidades actulizadas", { description: "Tus servicios se han registrado en tu perfil público." });
    } else {
      toast.error("Error al guardar", { description: res.error });
    }
    setSaving(false);
  };

  const q = search.trim().toLowerCase();
  const filteredCategories = q
    ? allCategories.filter(c => {
        const padre = allCategories.find(x => x.id === c.categoria_padre_id);
        return c.nombre.toLowerCase().includes(q) || (padre?.nombre.toLowerCase().includes(q) ?? false);
      })
    : allCategories;

  // Root categories that have children → shown as group headers
  const parents = filteredCategories.filter(c => !c.categoria_padre_id && filteredCategories.some(x => x.categoria_padre_id === c.id));
  const childrenOf = (parentId: string) => filteredCategories.filter(c => c.categoria_padre_id === parentId);
  // Root categories with no children → shown as standalone items
  const flatCats = filteredCategories.filter(c => !c.categoria_padre_id && !filteredCategories.some(x => x.categoria_padre_id === c.id));

  // Render chosen details
  const chosenObjects = selectedIds.map(id => allCategories.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Servicios y Especialidades</h1>
        <p className="text-slate-500 mt-1">Selecciona los rubros formales de UIAB en los que se especializa tu organización.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Explorador de Categorías */}
        <Card className="p-6 border-slate-100 shadow-sm lg:col-span-3">
           <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary-600"/> Catálogo Oficial</h3>
           <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar rubro (ej. Tornería, Sistemas...)" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-all"
              />
           </div>

           <div className="max-h-[360px] overflow-y-auto pr-1 modern-scrollbar">
             {filteredCategories.length === 0 && (
               <div className="text-center py-8 text-slate-500 text-sm">No se encontraron categorías.</div>
             )}
             {parents.map(parent => {
               const children = childrenOf(parent.id);
               return (
                 <div key={parent.id} className="mb-1">
                   <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 rounded-md">
                     {parent.nombre}
                   </div>
                   <button
                     type="button"
                     onClick={() => handleToggleCategory(parent.id)}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-left ${selectedIds.includes(parent.id) ? 'bg-primary-50 text-primary-800' : 'hover:bg-slate-50 text-slate-600'}`}
                   >
                     <span className="text-sm flex items-center gap-2">
                       <span className="text-slate-400 text-xs">—</span>
                       General
                     </span>
                     {selectedIds.includes(parent.id) ? (
                       <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                     ) : (
                       <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                     )}
                   </button>
                   {children.map(child => {
                     const isSelected = selectedIds.includes(child.id);
                     return (
                       <button
                         key={child.id}
                         type="button"
                         onClick={() => handleToggleCategory(child.id)}
                         className={`w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-left ${isSelected ? 'bg-primary-50 text-primary-800' : 'hover:bg-slate-50 text-slate-700'}`}
                       >
                         <span className="text-sm flex items-center gap-2">
                           <span className="text-slate-300 text-xs ml-2">↳</span>
                           {child.nombre}
                         </span>
                         {isSelected ? (
                           <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                         ) : (
                           <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                         )}
                       </button>
                     );
                   })}
                 </div>
               );
             })}
             {flatCats.map(cat => {
               const isSelected = selectedIds.includes(cat.id);
               return (
                 <button
                   key={cat.id}
                   type="button"
                   onClick={() => handleToggleCategory(cat.id)}
                   className={`w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-left mb-0.5 ${isSelected ? 'bg-primary-50 text-primary-800' : 'hover:bg-slate-50 text-slate-700'}`}
                 >
                   <span className="text-sm font-medium">{cat.nombre}</span>
                   {isSelected ? (
                     <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                   ) : (
                     <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                   )}
                 </button>
               );
             })}
           </div>
        </Card>

        {/* Resumen Actual */}
        <div className="lg:col-span-2 space-y-4">
           <Card className="p-6 bg-slate-900 border-none shadow-xl text-white">
              <h3 className="font-semibold mb-2">Tus Selecciones ({chosenObjects.length})</h3>
              <p className="text-slate-400 text-xs mb-6">Estos serán los rubros bajo los que te encontrarán otras industrias en el área metropolitana.</p>
              
              <ul className="space-y-3 mb-8">
                {chosenObjects.length === 0 && <li className="text-sm text-slate-500 italic">No tienes servicios seleccionados.</li>}
                {chosenObjects.map((co) => co && (
                  <li key={co.id} className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-slate-200 line-clamp-1">{co.nombre}</span>
                  </li>
                ))}
              </ul>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold h-12 shadow-[0_0_20px_rgba(14,165,233,0.3)] border-none">
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Servicios"}
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}
