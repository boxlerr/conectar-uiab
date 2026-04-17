"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  Wrench,
  Edit2,
  ExternalLink,
  Globe,
  Youtube,
  FileText,
  BookOpen,
  Link as LinkIcon,
  ImageOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/cliente";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const TIPO_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  web: { icon: Globe, label: "Sitio web" },
  video: { icon: Youtube, label: "Video" },
  ficha: { icon: FileText, label: "Ficha técnica" },
  catalogo: { icon: BookOpen, label: "Catálogo" },
  otro: { icon: LinkIcon, label: "Enlace" },
};

interface Props {
  item: any;
  onClose: () => void;
  onEdit: () => void;
}

const DETALLE_MAX_H = 120;
const DETALLE_MAX_H_EXPANDED = 320;

export function DetalleItemModal({ item, onClose, onEdit }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [idx, setIdx] = useState(0);
  const [detalleExpandido, setDetalleExpandido] = useState(false);
  const [detalleOverflow, setDetalleOverflow] = useState(false);
  const detalleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = detalleRef.current;
    if (!el) return;
    setDetalleOverflow(el.scrollHeight > DETALLE_MAX_H + 4);
  }, [item?.descripcion_larga]);

  const imagenes = useMemo(() => {
    const imgs = Array.isArray(item?.imagenes) ? [...item.imagenes] : [];
    imgs.sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0));
    return imgs.map((img: any) => {
      const { data } = supabase.storage.from(img.bucket).getPublicUrl(img.ruta_archivo);
      return {
        id: img.id,
        url: data.publicUrl,
        alt: img.texto_alternativo || item.nombre,
      };
    });
  }, [item, supabase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && imagenes.length > 1)
        setIdx((i) => (i + 1) % imagenes.length);
      else if (e.key === "ArrowLeft" && imagenes.length > 1)
        setIdx((i) => (i - 1 + imagenes.length) % imagenes.length);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, imagenes.length]);

  const esServicio = item.tipo_item === "servicio";
  const TipoIcon = esServicio ? Wrench : Package;
  const precioTexto =
    item.precio_a_consultar
      ? "A consultar"
      : item.precio != null
      ? `${item.moneda === "USD" ? "US$" : "$"} ${Number(item.precio).toLocaleString("es-AR")}`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      style={{ backgroundColor: "rgba(25, 28, 30, 0.55)" }}
    >
      <div
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 16px 48px rgba(25, 28, 30, 0.12), 0 2px 8px rgba(25, 28, 30, 0.04)" }}
      >
        {/* Toolbar flotante */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/95 backdrop-blur text-slate-800 text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors"
            style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </button>
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
          {/* Imagen — layer más profundo */}
          <div className="relative bg-slate-100 md:min-h-[560px] aspect-[4/3] md:aspect-auto">
            {imagenes.length > 0 ? (
              <>
                <Image
                  key={imagenes[idx].id}
                  src={imagenes[idx].url}
                  alt={imagenes[idx].alt}
                  fill
                  sizes="(min-width: 768px) 55vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
                {imagenes.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setIdx((i) => (i - 1 + imagenes.length) % imagenes.length)
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-sm bg-white/95 backdrop-blur hover:bg-white flex items-center justify-center text-slate-800 transition-colors"
                      style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIdx((i) => (i + 1) % imagenes.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-sm bg-white/95 backdrop-blur hover:bg-white flex items-center justify-center text-slate-800 transition-colors"
                      style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-2 rounded-sm bg-white/95 backdrop-blur text-[11px] font-mono text-slate-700"
                      style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
                    >
                      <span className="tabular-nums font-semibold">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="tabular-nums">
                        {String(imagenes.length).padStart(2, "0")}
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

          {/* Contenido — layer superior, sin borders */}
          <div className="bg-white p-6 md:p-7 flex flex-col gap-5">
            {/* Meta header */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500">
                <TipoIcon className="w-3.5 h-3.5" />
                {esServicio ? "Servicio" : "Producto"}
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
              <h2
                className="text-xl md:text-2xl font-bold leading-[1.15] tracking-tight"
                style={{ color: "#191c1e" }}
              >
                {item.nombre}
              </h2>
              {item.descripcion_corta && (
                <p className="mt-2 text-[13px] text-slate-600 leading-relaxed max-w-prose">
                  {item.descripcion_corta}
                </p>
              )}
            </div>

            {/* Precio — anclaje de poder */}
            {precioTexto && (
              <div className="bg-slate-50 px-4 py-3 rounded-sm">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-0.5">
                  {item.precio_a_consultar ? "Condiciones" : "Precio de referencia"}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
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
            )}

            {/* Descripción detallada con leer más: scroll interno al expandir */}
            {item.descripcion_larga && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Detalle
                </div>
                <div className="relative">
                  <div
                    ref={detalleRef}
                    className={cls(
                      "text-[13px] text-slate-700 leading-[1.65] whitespace-pre-wrap max-w-prose transition-[max-height] duration-300",
                      detalleExpandido
                        ? "overflow-y-auto pr-1"
                        : "overflow-hidden"
                    )}
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
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-700 hover:text-primary-900 transition-colors"
                  >
                    {detalleExpandido ? "Leer menos" : "Leer más"}
                    <span className="text-xs leading-none">
                      {detalleExpandido ? "−" : "+"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Palabras clave como tags industriales */}
            {Array.isArray(item.palabras_clave) && item.palabras_clave.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Palabras clave
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.palabras_clave.map((t: string) => (
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
            {Array.isArray(item.enlaces) && item.enlaces.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Recursos externos
                </div>
                <ul className="flex flex-col">
                  {item.enlaces.map((en: any, i: number) => {
                    const meta = TIPO_META[en.tipo] || TIPO_META.otro;
                    const Icon = meta.icon;
                    return (
                      <li key={i}>
                        <a
                          href={en.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 py-2 hover:bg-slate-50 -mx-2 px-2 rounded-sm transition-colors"
                        >
                          <div className="w-7 h-7 rounded-sm bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-3.5 h-3.5 text-slate-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-slate-500">
                              {en.etiqueta || meta.label}
                            </div>
                            <div className="text-[12px] text-slate-800 truncate font-medium">
                              {en.url.replace(/^https?:\/\//, "")}
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
      </div>
    </div>
  );
}
