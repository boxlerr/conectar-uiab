"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { useEffect, useState } from "react";
import { getUserItems, deleteItem } from "./acciones";
import { FormularioItem } from "./FormularioItem";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Box, Package, Edit2, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function PerfilCatalogoPage() {
  const { currentUser, loading: authLoading } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);

  const fetchItems = async () => {
    if (!currentUser?.entityId) {
      setFetching(false);
      return;
    }
    setFetching(true);
    const data = await getUserItems(currentUser.role as 'company' | 'provider', currentUser.entityId);
    setItems(data);
    setFetching(false);
  };

  useEffect(() => {
    // Esperar a que auth esté lista antes de consultar.
    if (authLoading) return;
    fetchItems();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  const handleEdit = (item: any) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${titulo}"?`)) return;
    
    const res = await deleteItem(id);
    if (res?.error) {
      toast.error("Error al eliminar", { description: res.error });
    } else {
      toast.success("Ítem eliminado");
      fetchItems();
    }
  };

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <FormularioItem
        itemInit={itemToEdit}
        onCancel={() => {
          setIsFormOpen(false);
          setItemToEdit(null);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setItemToEdit(null);
          fetchItems();
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
             <Package className="w-8 h-8 text-primary-600" />
             Productos y Servicios
          </h1>
          <p className="text-slate-500 mt-1">
            Administra los servicios o productos que distinguen tu operación comercial.
          </p>
        </div>
        <Button 
          onClick={() => {
            setItemToEdit(null);
            setIsFormOpen(true);
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-[0_4px_12px_rgba(14,165,233,0.25)] border-none shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Producto/Servicio
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Box className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Aún no hay productos o servicios</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Aún no has agregado los productos clave o servicios principales que ofreces al mercado. Comienza creando tu primer ítem.
          </p>
          <Button 
            onClick={() => {
              setItemToEdit(null);
              setIsFormOpen(true);
            }}
            className="bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear el primer ítem
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => (
            <div key={item.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-primary-200 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-primary-500 transition-colors" />
              
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 pr-6">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-primary-700 transition-colors">
                    {item.titulo}
                  </h3>
                  {item.precio && (
                    <div className="flex items-center gap-1.5 mt-2">
                       <Tag className="w-3.5 h-3.5 text-emerald-500" />
                       <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded cursor-default">
                         $ {Number(item.precio).toLocaleString('es-AR')}
                       </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 -mt-1 -mr-1 z-10 flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleEdit(item); }} className="h-8 w-8 text-slate-400 hover:text-primary-600 pointer-events-auto transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleDelete(item.id, item.titulo); }} className="h-8 w-8 text-slate-400 hover:text-rose-600 pointer-events-auto transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex-grow pointer-events-none">
                 <p className="text-sm text-slate-500 leading-relaxed max-w-[95%] line-clamp-3">
                   {item.descripcion || <span className="italic text-slate-400">Sin descripción...</span>}
                 </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
