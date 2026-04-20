"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Wrench, Star, ExternalLink, X,
  Globe, FileText, BookOpen, ChevronLeft, ChevronRight,
  Youtube, Link as LinkIcon, ImageOff,
} from "lucide-react";
import { TarjetaItem } from "@/components/ui/catalogo/TarjetaItem";

const DETALLE_MAX_H = 120;
const DETALLE_MAX_H_EXPANDED = 320;

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
  palabras_clave: string[] | null;
};

interface CatalogoPublicoProps {
  items: CatalogoItem[];
  /** Color de acento del perfil (azul para socios, amber para particulares, emerald para proveedores) */
  colorScheme?: "blue" | "amber" | "emerald";
}

const ICONO_ENLACE = {
  web: Globe,
  video: Youtube,
  ficha: FileText,
  catalogo: BookOpen,
  otro: LinkIcon,
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
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {itemsFiltrados.map((item) => (
          <TarjetaItem
            key={item.id}
            onClick={() => setItemAbierto(item)}
            item={{
              nombre: item.nombre,
              tipo_item: item.tipo_item,
              descripcion_corta: item.descripcion_corta,
              destacado: item.destacado,
              precio: item.precio,
              precio_a_consultar: item.precio_a_consultar,
              moneda: item.moneda,
              unidad: item.unidad,
              sku: item.sku,
              palabras_clave: item.palabras_clave,
              enlaces: item.enlaces,
              portadaUrl: item.imagenes[0]?.url || null,
            }}
          />
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
  const [idx, setIdx] = useState(0);
  const [detalleExpandido, setDetalleExpandido] = useState(false);
  const [detalleOverflow, setDetalleOverflow] = useState(false);
  const detalleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = detalleRef.current;
    if (!el) return;
    setDetalleOverflow(el.scrollHeight > DETALLE_MAX_H + 4);
  }, [item?.descripcion_larga]);

  const esServicio = item.tipo_item === "servicio";
  const TipoIcon = esServicio ? Wrench : Package;

  const precioTexto =
    item.precio_a_consultar || item.precio == null
      ? "A consultar"
      : new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: item.moneda || "ARS",
          maximumFractionDigits: 0,
        }).format(item.precio);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-32 pb-8 bg-slate-900/60 backdrop-blur-[2px] overflow-y-auto"
      onClick={onClose}
      style={{ backgroundColor: "rgba(25, 28, 30, 0.45)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        className="bg-white rounded-md w-full max-w-5xl max-h-[82vh] relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 16px 48px rgba(25, 28, 30, 0.12), 0 2px 8px rgba(25, 28, 30, 0.04)" }}
      >
        {/* Toolbar flotante */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-sm bg-white/95 backdrop-blur text-slate-700 hover:text-slate-900 hover:bg-white flex items-center justify-center transition-colors"
            style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] overflow-y-auto">
          {/* Imagen / Galería */}
          <div className="relative bg-slate-100 md:min-h-[560px] aspect-[4/3] md:aspect-auto">
            {item.imagenes.length > 0 ? (
              <>
                <Image
                  key={item.imagenes[idx].url}
                  src={item.imagenes[idx].url}
                  alt={item.imagenes[idx].alt || item.nombre}
                  fill
                  sizes="(min-width: 768px) 55vw, 100vw"
                  className="object-cover"
                />
                {item.imagenes.length > 1 && (
                  <>
                    <button
                      onClick={() => setIdx((i) => (i - 1 + item.imagenes.length) % item.imagenes.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-sm bg-white/95 backdrop-blur hover:bg-white flex items-center justify-center text-slate-800 transition-colors"
                      style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIdx((i) => (i + 1) % item.imagenes.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-sm bg-white/95 backdrop-blur hover:bg-white flex items-center justify-center text-slate-800 transition-colors"
                      style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div
                      className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-2 rounded-sm bg-white/95 backdrop-blur text-[11px] font-mono text-slate-700"
                      style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
                    >
                      <span className="tabular-nums font-semibold">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="tabular-nums">
                        {String(item.imagenes.length).padStart(2, "0")}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageOff className="w-12 h-12" />
                <span className="text-xs uppercase tracking-wider">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="bg-white p-6 md:p-7 flex flex-col gap-5">
            {/* Meta header */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500">
                <TipoIcon className="w-3.5 h-3.5" />
                {item.tipo_item}
              </div>
              {item.destacado && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-amber-700">
                    <Star className="w-3 h-3 fill-current" />
                    Destacado
                  </div>
                </>
              )}
              {item.sku && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-mono text-slate-500">{item.sku}</span>
                </>
              )}
            </div>

            {/* Headline editorial */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold leading-[1.15] tracking-tight text-slate-900">
                {item.nombre}
              </h2>
              {item.descripcion_corta && (
                <p className="mt-2 text-[13px] text-slate-600 leading-relaxed max-w-prose">
                  {item.descripcion_corta}
                </p>
              )}
            </div>

            {/* Precio */}
            <div className={`${color.accentBg} px-4 py-3 rounded-sm border ${color.accentBorder}`}>
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-0.5">
                {item.precio_a_consultar ? "Condiciones" : "Precio de referencia"}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold tabular-nums ${item.precio_a_consultar || item.precio == null ? "text-slate-700" : "text-slate-900"}`}>
                  {precioTexto}
                </span>
                {!item.precio_a_consultar && item.unidad && (
                  <span className="text-xs text-slate-500">/ {item.unidad}</span>
                )}
                {!item.precio_a_consultar && item.moneda && item.moneda !== "ARS" && (
                  <span className="text-[10px] font-mono uppercase text-slate-400 ml-auto">
                    {item.moneda}
                  </span>
                )}
              </div>
            </div>

            {/* Descripción detallada */}
            {item.descripcion_larga && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Detalle
                </div>
                <div className="relative">
                  <div
                    ref={detalleRef}
                    className={`text-[13px] text-slate-700 leading-[1.65] whitespace-pre-wrap max-w-prose transition-[max-height] duration-300 ${
                      detalleExpandido ? "overflow-y-auto pr-1" : "overflow-hidden"
                    }`}
                    style={{
                      maxHeight: detalleExpandido
                        ? DETALLE_MAX_H_EXPANDED
                        : detalleOverflow
                        ? DETALLE_MAX_H
                        : 9999,
                    }}
                  >
                    {item.descripcion_larga}
                  </div>
                  {detalleOverflow && !detalleExpandido && (
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>
                {detalleOverflow && (
                  <button
                    type="button"
                    onClick={() => setDetalleExpandido((v) => !v)}
                    className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${color.accent.replace("text-", "text-")} hover:opacity-80`}
                  >
                    {detalleExpandido ? "Leer menos" : "Leer más"}
                    <span className="text-xs leading-none">
                      {detalleExpandido ? "−" : "+"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Palabras clave */}
            {Array.isArray(item.palabras_clave) && item.palabras_clave.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Palabras clave
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.palabras_clave.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-[2px] tracking-wide"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Enlaces */}
            {item.enlaces.length > 0 && (
              <div className="mt-auto">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Recursos externos
                </div>
                <ul className="flex flex-col">
                  {item.enlaces.map((en, i) => {
                    const Icon = ICONO_ENLACE[en.tipo] || ICONO_ENLACE.otro;
                    return (
                      <li key={i}>
                        <a
                          href={en.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 py-2 hover:bg-slate-50 -mx-2 px-2 rounded-sm transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-sm bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 transition-colors border border-transparent group-hover:${color.accentBorder}`}>
                            <Icon className={`w-4 h-4 text-slate-700 group-hover:${color.accent}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-slate-500">
                              {en.etiqueta || en.tipo}
                            </div>
                            <div className="text-[12px] text-slate-800 truncate font-medium">
                              {en.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 transition-colors" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
