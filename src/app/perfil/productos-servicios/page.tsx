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
  Tag,
  Star,
  Search,
  Wrench,
  ImageOff,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClient } from "@/lib/supabase/cliente";

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
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <Button
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {itemsFiltrados.map((item) => {
            const cover = coverUrl(item);
            const esServicio = item.tipo_item === "servicio";
            return (
              <div
                key={item.id}
                onClick={() => setItemDetalle(item)}
                className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
              >
                <div className="aspect-[16/10] relative bg-slate-100">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={item.nombre}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <ImageOff className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {item.destacado && (
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        DESTACADO
                      </span>
                    )}
                    {item.estado === "borrador" && (
                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Borrador
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                    {esServicio ? (
                      <Wrench className="w-3 h-3" />
                    ) : (
                      <Package className="w-3 h-3" />
                    )}
                    {item.tipo_item || "producto"}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 group-hover:text-primary-700 transition-colors">
                        {item.nombre}
                      </h3>
                      {item.sku && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {item.sku}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 -mr-1 -mt-1">
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
                  </div>

                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                    {item.descripcion_corta ||
                      item.descripcion_larga || (
                        <span className="italic text-slate-400">Sin descripción...</span>
                      )}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
                    {item.precio_a_consultar ? (
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                        <Tag className="w-3 h-3" /> A consultar
                      </span>
                    ) : item.precio != null ? (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        {item.moneda === "USD" ? "US$" : "$"}{" "}
                        {Number(item.precio).toLocaleString("es-AR")}
                        {item.unidad && (
                          <span className="font-normal text-emerald-700">
                            {" "}
                            / {item.unidad}
                          </span>
                        )}
                      </span>
                    ) : null}

                    {Array.isArray(item.enlaces) && item.enlaces.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {item.enlaces.length} enlace{item.enlaces.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
