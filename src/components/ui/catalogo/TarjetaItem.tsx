"use client";

import Image from "next/image";
import {
  Star,
  Package,
  Wrench,
  ImagePlus,
  Globe,
  Youtube,
  FileText,
  BookOpen,
  Link as LinkIcon,
} from "lucide-react";

export type TarjetaEnlace = {
  tipo: "web" | "video" | "ficha" | "catalogo" | "otro";
  etiqueta?: string;
  url?: string;
};

export type TarjetaItemData = {
  nombre: string;
  tipo_item: "producto" | "servicio";
  descripcion_corta?: string | null;
  destacado?: boolean;
  precio?: number | null;
  precio_a_consultar?: boolean;
  moneda?: string | null;
  unidad?: string | null;
  sku?: string | null;
  palabras_clave?: string[] | null;
  enlaces?: TarjetaEnlace[] | null;
  portadaUrl?: string | null;
};

const TIPO_ENLACE_META: Record<
  TarjetaEnlace["tipo"],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  web: { icon: Globe, label: "Sitio web" },
  video: { icon: Youtube, label: "Video" },
  ficha: { icon: FileText, label: "Ficha técnica" },
  catalogo: { icon: BookOpen, label: "Catálogo" },
  otro: { icon: LinkIcon, label: "Enlace" },
};

interface Props {
  item: TarjetaItemData;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function TarjetaItem({ item, onClick, actions, className = "" }: Props) {
  const esServicio = item.tipo_item === "servicio";
  const palabras = Array.isArray(item.palabras_clave) ? item.palabras_clave : [];
  const enlaces = Array.isArray(item.enlaces) ? item.enlaces : [];
  const precioLabel =
    item.precio_a_consultar
      ? "A consultar"
      : item.precio != null
      ? `${item.moneda === "USD" ? "US$" : "$"} ${Number(item.precio).toLocaleString("es-AR")}${
          !esServicio && item.unidad ? ` / ${item.unidad}` : ""
        }`
      : null;

  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div
      {...interactiveProps}
      className={`group text-left bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
        onClick ? "hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200 cursor-pointer" : ""
      } ${className}`}
    >
      {/* Portada */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {item.portadaUrl ? (
          <Image
            src={item.portadaUrl}
            alt={item.nombre || "Portada"}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ImagePlus className="w-10 h-10" />
          </div>
        )}

        {item.destacado && (
          <div className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> DESTACADO
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded uppercase flex items-center gap-1">
          {esServicio ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
          {item.tipo_item}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900 leading-tight line-clamp-2">
            {item.nombre || <span className="text-slate-400">Nombre del ítem</span>}
          </h3>
          {actions && <div className="shrink-0 -mr-1 -mt-1">{actions}</div>}
        </div>

        {item.descripcion_corta && (
          <p className="text-xs text-slate-500 line-clamp-2">{item.descripcion_corta}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {precioLabel && (
            <span
              className={
                "text-xs font-bold px-2 py-1 rounded " +
                (item.precio_a_consultar || item.precio == null
                  ? "text-slate-700 bg-slate-100"
                  : "text-emerald-800 bg-emerald-50")
              }
            >
              {precioLabel}
            </span>
          )}
          {item.sku && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {item.sku}
            </span>
          )}
        </div>

        {palabras.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {palabras.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10px] bg-secondary-100 text-secondary-800 px-1.5 py-0.5 rounded"
              >
                #{t}
              </span>
            ))}
            {palabras.length > 4 && (
              <span className="text-[10px] text-slate-500">+{palabras.length - 4}</span>
            )}
          </div>
        )}

        {enlaces.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 mt-auto">
            {enlaces.map((en, i) => {
              const meta = TIPO_ENLACE_META[en.tipo] || TIPO_ENLACE_META.otro;
              const Icon = meta.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                >
                  <Icon className="w-3 h-3" />
                  {en.etiqueta || meta.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
