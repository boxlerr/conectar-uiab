"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { useEffect, useMemo, useState } from "react";
import { getUserItems, deleteItem } from "./acciones";
import { FormularioItem } from "./FormularioItem";
import { DetalleItemModal } from "./DetalleItemModal";
import { ImportarExcelModal } from "./ImportarExcelModal";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Box,
  Package,
  Edit2,
  Trash2,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/cliente";
import { TarjetaItem } from "@/components/ui/catalogo/TarjetaItem";

export default function PerfilCatalogoPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [itemDetalle, setItemDetalle] = useState<any | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "producto" | "servicio">("todos");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchItems = async () => {
    if (!currentUser?.entityId) {
      setFetching(false);
      return;
    }
    setFetching(true);
    const data = await getUserItems(
      currentUser.role as "company" | "provider",
      currentUser.entityId
    );
    setItems(data);
    setFetching(false);
  };

  useEffect(() => {
    if (authLoading) return;
    fetchItems();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  const handleEdit = (item: any) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await deleteItem(id);
    if (res?.error) {
      toast.error("Error al eliminar", { description: res.error });
    } else {
      toast.success("Ítem eliminado");
      fetchItems();
    }
  };

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items.filter((it) => {
      if (filtroTipo !== "todos" && it.tipo_item !== filtroTipo) return false;
      if (!q) return true;
      return (
        (it.nombre || "").toLowerCase().includes(q) ||
        (it.descripcion_corta || "").toLowerCase().includes(q) ||
        (it.sku || "").toLowerCase().includes(q) ||
        (Array.isArray(it.palabras_clave) &&
          it.palabras_clave.some((t: string) => t.toLowerCase().includes(q)))
      );
    });
  }, [items, busqueda, filtroTipo]);

  const coverUrl = (item: any) => {
    const imgs = Array.isArray(item.imagenes) ? [...item.imagenes] : [];
    if (imgs.length === 0) return null;
    imgs.sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0));
    const first = imgs[0];
    const { data } = supabase.storage.from(first.bucket).getPublicUrl(first.ruta_archivo);
    return data.publicUrl;
  };

  if (!currentUser) return null;

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

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
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
            Administra los productos y servicios que distinguen tu operación.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            data-tour="productos-importar"
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <Button
            data-tour="productos-agregar"
            onClick={() => {
              setItemToEdit(null);
              setIsFormOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-[0_4px_12px_rgba(14,165,233,0.25)] border-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir ítem
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400"
              placeholder="Buscar por nombre, SKU o palabra clave..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {[
              { v: "todos", label: "Todos" },
              { v: "producto", label: "Productos" },
              { v: "servicio", label: "Servicios" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setFiltroTipo(o.v as any)}
                className={
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors " +
                  (filtroTipo === o.v
                    ? "bg-primary-600 text-white"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Box className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Aún no hay productos o servicios
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Comenzá a construir tu catálogo agregando los ítems clave que ofrecés al mercado.
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
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-500">Sin resultados para esta búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {itemsFiltrados.map((item) => (
            <TarjetaItem
              key={item.id}
              onClick={() => setItemDetalle(item)}
              item={{
                nombre: item.nombre,
                tipo_item: item.tipo_item,
                descripcion_corta: item.descripcion_corta || item.descripcion_larga,
                destacado: !!item.destacado,
                precio: item.precio,
                precio_a_consultar: !!item.precio_a_consultar,
                moneda: item.moneda,
                unidad: item.unidad,
                sku: item.sku,
                palabras_clave: item.palabras_clave,
                enlaces: item.enlaces,
                portadaUrl: coverUrl(item),
              }}
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.nombre);
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {isImportOpen && currentUser?.entityId && (
        <ImportarExcelModal
          role={currentUser.role as "company" | "provider"}
          entityId={currentUser.entityId}
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => {
            setIsImportOpen(false);
            fetchItems();
          }}
        />
      )}

      {itemDetalle && (
        <DetalleItemModal
          item={itemDetalle}
          onClose={() => setItemDetalle(null)}
          onEdit={() => {
            setItemToEdit(itemDetalle);
            setItemDetalle(null);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
}
