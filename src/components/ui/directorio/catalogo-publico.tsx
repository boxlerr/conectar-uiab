"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Wrench, Star, ExternalLink, X, ArrowUpRight,
  Globe, Video, FileText, BookOpen, Link2, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Tipos (matchean el shape devuelto desde el server component) ────────────
export type CatalogoEnlace = {
  tipo: "web" | "video" | "ficha" | "catalogo" | "otro";
  etiqueta: string;
  url: string;
};

export type CatalogoImagen = {
  url: string;
  alt: string;
};

export type CatalogoItem = {
  id: string;
  nombre: string;
  tipo_item: "producto" | "servicio";
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  precio: number | null;
  moneda: string | null;
  precio_a_consultar: boolean;
  destacado: boolean;
  sku: string | null;
  unidad: string | null;
  enlaces: CatalogoEnlace[];
  imagenes: CatalogoImagen[];
};

interface CatalogoPublicoProps {
  items: CatalogoItem[];
  /** Color de acento del perfil (azul para socios, amber para particulares, emerald para proveedores) */
  colorScheme?: "blue" | "amber" | "emerald";
}

const ICONO_ENLACE = {
  web: Globe,
  video: Video,
  ficha: FileText,
  catalogo: BookOpen,
  otro: Link2,
} as const;

const COLORS = {
  blue: {
    accent: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    accentHover: "hover:border-blue-300",
    pillActive: "bg-[#00213f] text-white",
    pillIdle: "text-slate-500 hover:text-slate-800",
    ctaBg: "bg-[#00182e] hover:bg-[#10375c]",
    linkBtn: "bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700",
  },
  amber: {
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-100",
    accentHover: "hover:border-amber-300",
    pillActive: "bg-amber-700 text-white",
    pillIdle: "text-slate-500 hover:text-slate-800",
    ctaBg: "bg-amber-700 hover:bg-amber-800",
    linkBtn: "bg-slate-50 hover:bg-amber-50 hover:border-amber-200 text-slate-700 hover:text-amber-700",
  },
  emerald: {
    accent: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    accentHover: "hover:border-emerald-300",
    pillActive: "bg-[#022c22] text-white",
    pillIdle: "text-slate-500 hover:text-slate-800",
    ctaBg: "bg-[#022c22] hover:bg-[#064e3b]",
    linkBtn: "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700",
  },
} as const;

function formatearPrecio(item: CatalogoItem) {
  if (item.precio_a_consultar || item.precio == null) return "A consultar";
  const moneda = item.moneda || "ARS";
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(item.precio);
  } catch {
    return `${moneda} ${item.precio.toLocaleString("es-AR")}`;
  }
}

export function CatalogoPublico({ items, colorScheme = "blue" }: CatalogoPublicoProps) {
  const c = COLORS[colorScheme];
  const [filtro, setFiltro] = useState<"todos" | "producto" | "servicio">("todos");
  const [itemAbierto, setItemAbierto] = useState<CatalogoItem | null>(null);

  const itemsFiltrados = useMemo(() => {
    if (filtro === "todos") return items;
    return items.filter((i) => i.tipo_item === filtro);
  }, [items, filtro]);

  const countProductos = useMemo(() => items.filter(i => i.tipo_item === "producto").length, [items]);
  const countServicios = useMemo(() => items.filter(i => i.tipo_item === "servicio").length, [items]);

  if (items.length === 0) return null;

  return (
    <div className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
      {/* ─── Header de sección ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${c.accentBg} flex items-center justify-center border ${c.accentBorder}`}>
            <Package className={`w-5 h-5 ${c.accent}`} />
          </div>
          <div>
            <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight">
              Productos y Servicios
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {items.length} {items.length === 1 ? "ítem publicado" : "ítems publicados"}
            </p>
          </div>
        </div>

        {/* Filtros — solo si hay mezcla */}
        {countProductos > 0 && countServicios > 0 && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
            <button
              onClick={() => setFiltro("todos")}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                filtro === "todos" ? c.pillActive : c.pillIdle
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => setFiltro("producto")}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                filtro === "producto" ? c.pillActive : c.pillIdle
              }`}
            >
              <Package className="w-3 h-3" /> {countProductos}
            </button>
            <button
              onClick={() => setFiltro("servicio")}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                filtro === "servicio" ? c.pillActive : c.pillIdle
              }`}
            >
              <Wrench className="w-3 h-3" /> {countServicios}
            </button>
          </div>
        )}
      </div>

      {/* ─── Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {itemsFiltrados.map((item) => (
          <CatalogoCard key={item.id} item={item} color={c} onOpen={() => setItemAbierto(item)} />
        ))}
      </div>

      {/* ─── Modal detalle ─── */}
      <AnimatePresence>
        {itemAbierto && (
          <CatalogoModal
            item={itemAbierto}
            color={c}
            onClose={() => setItemAbierto(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Card individual ─────────────────────────────────────────────────────────
function CatalogoCard({
  item,
  color,
  onOpen,
}: {
  item: CatalogoItem;
  color: (typeof COLORS)[keyof typeof COLORS];
  onOpen: () => void;
}) {
  const portada = item.imagenes[0];
  const IconoTipo = item.tipo_item === "producto" ? Package : Wrench;

  return (
    <button
      onClick={onOpen}
      className={`group text-left bg-white border border-slate-200/60 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${color.accentHover} flex flex-col`}
    >
      {/* Imagen de portada con aspect 16:10 */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
        {portada ? (
          <Image
            src={portada.url}
            alt={portada.alt || item.nombre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconoTipo className="w-16 h-16 text-slate-200" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges sobre imagen */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.destacado && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-400/95 backdrop-blur text-amber-950 text-[9px] font-black uppercase tracking-widest shadow">
              <Star className="w-3 h-3 fill-current" /> Destacado
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/95 backdrop-blur text-slate-700 text-[9px] font-black uppercase tracking-widest shadow">
            <IconoTipo className="w-3 h-3" />
            {item.tipo_item}
          </span>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-manrope text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-slate-950 transition-colors">
          {item.nombre}
        </h3>

        {item.descripcion_corta && (
          <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">
            {item.descripcion_corta}
          </p>
        )}

        {/* SKU */}
        {item.sku && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            SKU · {item.sku}
          </p>
        )}

        {/* Footer: precio + indicador de enlaces + arrow */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio</p>
            <p className={`font-bold text-sm truncate ${
              item.precio_a_consultar || item.precio == null
                ? "text-slate-500"
                : "text-slate-900"
            }`}>
              {formatearPrecio(item)}
              {item.unidad && !item.precio_a_consultar && (
                <span className="text-slate-400 font-medium text-xs"> / {item.unidad}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.enlaces.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Link2 className="w-3 h-3" />
                {item.enlaces.length}
              </span>
            )}
            <div className={`w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-hover:${color.accentBg.replace("bg-", "bg-")} group-hover:border-transparent`}>
              <ArrowUpRight className={`w-4 h-4 text-slate-400 group-hover:${color.accent} transition-colors`} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Modal detalle ───────────────────────────────────────────────────────────
function CatalogoModal({
  item,
  color,
  onClose,
}: {
  item: CatalogoItem;
  color: (typeof COLORS)[keyof typeof COLORS];
  onClose: () => void;
}) {
  const [imagenActiva, setImagenActiva] = useState(0);
  const IconoTipo = item.tipo_item === "producto" ? Package : Wrench;

  const siguienteImagen = () => setImagenActiva((p) => (p + 1) % item.imagenes.length);
  const anteriorImagen = () => setImagenActiva((p) => (p - 1 + item.imagenes.length) % item.imagenes.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 relative overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          {/* Galería */}
          <div className="relative bg-gradient-to-br from-slate-100 to-slate-50 aspect-[4/3] md:aspect-auto md:min-h-[500px]">
            {item.imagenes.length > 0 ? (
              <>
                <Image
                  key={item.imagenes[imagenActiva].url}
                  src={item.imagenes[imagenActiva].url}
                  alt={item.imagenes[imagenActiva].alt || item.nombre}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {item.imagenes.length > 1 && (
                  <>
                    <button
                      onClick={anteriorImagen}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-all"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={siguienteImagen}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-all"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Thumbnails */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/90 backdrop-blur px-2 py-1.5 rounded-full shadow-lg border border-slate-200">
                      {item.imagenes.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImagenActiva(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === imagenActiva ? "bg-slate-800 w-6" : "bg-slate-300 hover:bg-slate-500"
                          }`}
                          aria-label={`Ver imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <IconoTipo className="w-24 h-24 text-slate-200" strokeWidth={1.2} />
              </div>
            )}

            {/* Badges sobre imagen */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.destacado && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-400/95 backdrop-blur text-amber-950 text-[9px] font-black uppercase tracking-widest shadow w-fit">
                  <Star className="w-3 h-3 fill-current" /> Destacado
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/95 backdrop-blur text-slate-700 text-[9px] font-black uppercase tracking-widest shadow w-fit">
                <IconoTipo className="w-3 h-3" />
                {item.tipo_item}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 sm:p-8 flex flex-col">
            <h3 className="font-manrope text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight mb-3">
              {item.nombre}
            </h3>

            {item.sku && (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                SKU · {item.sku}
              </p>
            )}

            {item.descripcion_corta && (
              <p className="text-base text-slate-700 font-semibold leading-relaxed mb-4">
                {item.descripcion_corta}
              </p>
            )}

            {item.descripcion_larga && (
              <div className="prose prose-slate prose-sm max-w-none text-slate-500 font-medium leading-relaxed mb-6">
                <p className="whitespace-pre-line">{item.descripcion_larga}</p>
              </div>
            )}

            {/* Precio — destacado */}
            <div className={`${color.accentBg} border ${color.accentBorder} rounded-xl p-4 mb-6`}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Precio</p>
              <p className={`font-manrope text-2xl font-black ${
                item.precio_a_consultar || item.precio == null ? "text-slate-600" : "text-slate-900"
              }`}>
                {formatearPrecio(item)}
                {item.unidad && !item.precio_a_consultar && (
                  <span className="text-slate-400 font-bold text-sm ml-1">/ {item.unidad}</span>
                )}
              </p>
            </div>

            {/* Enlaces */}
            {item.enlaces.length > 0 && (
              <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Enlaces
                </p>
                <div className="flex flex-col gap-2">
                  {item.enlaces.map((enlace, idx) => {
                    const Icono = ICONO_ENLACE[enlace.tipo] || Link2;
                    return (
                      <a
                        key={idx}
                        href={enlace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg transition-all ${color.linkBtn}`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-transparent transition-colors">
                          <Icono className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm flex-1 truncate">
                          {enlace.etiqueta || enlace.url}
                        </span>
                        <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
