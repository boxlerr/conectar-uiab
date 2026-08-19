"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Wrench, Star, ExternalLink, X,
  Globe, FileText, BookOpen, ChevronLeft, ChevronRight,
  Youtube, Link as LinkIcon, ImageOff, ImagePlus, Mail,
} from "lucide-react";
import { pareceEmail, whatsappLink } from "@/lib/utilidades";
import { BotonWhatsApp } from "@/components/ui/boton-whatsapp";

const DETALLE_MAX_H = 120;
const DETALLE_MAX_H_EXPANDED = 320;

/**
 * Cuántos ítems se listan antes de plegar el resto.
 *
 * La ficha entera medía casi 14.000 px de alto y el catálogo se llevaba la
 * mitad: seis tarjetas de 4:3 apiladas en dos columnas. Con la tarjeta
 * compacta entran ocho en el alto que antes ocupaban dos, así que el tope
 * existe sólo para los catálogos grandes.
 */
const TOPE_PREVIA = 8;

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

/** Contacto de la ficha, para consultar por un ítem puntual desde el modal. */
export type ContactoCatalogo = {
  nombre: string;
  email: string | null;
  whatsapp: string | null;
};

interface CatalogoPublicoProps {
  items: CatalogoItem[];
  /** Color de acento del perfil (azul para socios, amber para particulares, emerald para proveedores) */
  colorScheme?: "blue" | "amber" | "emerald";
  contacto?: ContactoCatalogo;
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
    barra: "bg-blue-600",
    tarjetaHover: "hover:border-blue-300",
    tituloHover: "group-hover:text-blue-700",
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
    barra: "bg-amber-600",
    tarjetaHover: "hover:border-amber-300",
    tituloHover: "group-hover:text-amber-700",
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
    barra: "bg-emerald-600",
    tarjetaHover: "hover:border-emerald-300",
    tituloHover: "group-hover:text-emerald-700",
    pillActive: "bg-[#022c22] text-white",
    pillIdle: "text-slate-500 hover:text-slate-800",
    ctaBg: "bg-[#022c22] hover:bg-[#064e3b]",
    linkBtn: "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700",
  },
} as const;

type Color = (typeof COLORS)[keyof typeof COLORS];

/**
 * Tarjeta compacta del catálogo.
 *
 * La portada baja a una placa de 56 px y el precio y las palabras clave se van
 * al modal. Suena a pérdida y es al revés: apilada en la columna de la ficha,
 * la tarjeta de 4:3 obligaba a scrollear tres pantallas para saber qué vende
 * la empresa, que es lo único que se viene a mirar en esta lista. Con la placa
 * chica las seis entran de un vistazo y las imágenes se leen como un set de
 * íconos; la que quiera verse grande está a un click, en el modal.
 */
function TarjetaCompacta({
  item,
  color,
  onClick,
}: {
  item: CatalogoItem;
  color: Color;
  onClick: () => void;
}) {
  const esServicio = item.tipo_item === "servicio";
  const Icono = esServicio ? Wrench : Package;
  const portada = item.imagenes[0];

  // Sólo se muestra el precio cuando hay un número: "A consultar" en las seis
  // tarjetas es ruido, y esa condición ya se lee en el modal.
  const precio =
    !item.precio_a_consultar && item.precio != null
      ? `${item.moneda === "USD" ? "US$" : "$"} ${Number(item.precio).toLocaleString("es-AR")}`
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${color.tarjetaHover}`}
    >
      <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
        {portada ? (
          <Image
            src={portada.url}
            alt={portada.alt || item.nombre}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlus className="h-5 w-5 text-slate-300" />
        )}
        {item.destacado && (
          <span
            className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-amber-950"
            title="Destacado"
          >
            <Star className="h-2.5 w-2.5 fill-current" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`line-clamp-2 block text-[13.5px] font-bold leading-snug text-[#00213f] transition-colors ${color.tituloHover}`}
        >
          {item.nombre}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <Icono className="h-3 w-3 shrink-0" />
          {item.tipo_item}
          {precio && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 normal-case tracking-normal">{precio}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}

export function CatalogoPublico({ items, colorScheme = "blue", contacto }: CatalogoPublicoProps) {
  const c = COLORS[colorScheme];
  const [filtro, setFiltro] = useState<"todos" | "producto" | "servicio">("todos");
  // Índice dentro de itemsFiltrados, no el ítem suelto: el modal navega con
  // flechas y necesita saber dónde está parado. Recorre TODO el filtrado, no
  // sólo los que entran en la previa — `visibles` es un prefijo de esa lista,
  // así que los índices coinciden y desde la grilla plegada se llega igual a
  // los ítems de más abajo.
  const [idxAbierto, setIdxAbierto] = useState<number | null>(null);
  const [verTodos, setVerTodos] = useState(false);

  const itemsFiltrados = useMemo(() => {
    if (filtro === "todos") return items;
    return items.filter((i) => i.tipo_item === filtro);
  }, [items, filtro]);

  const countProductos = useMemo(() => items.filter(i => i.tipo_item === "producto").length, [items]);
  const countServicios = useMemo(() => items.filter(i => i.tipo_item === "servicio").length, [items]);

  const visibles = verTodos ? itemsFiltrados : itemsFiltrados.slice(0, TOPE_PREVIA);
  const ocultos = itemsFiltrados.length - visibles.length;

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-7">
      {/* ─── Header de sección ─── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${c.accentBg} ${c.accentBorder}`}
          >
            <Package className={`h-4 w-4 ${c.accent}`} />
          </span>
          <div>
            <h2 className="font-manrope text-[17px] font-black tracking-tight text-[#00213f]">
              Productos y servicios{" "}
              <span className="font-bold text-slate-400">({items.length})</span>
            </h2>
            <span className={`mt-1.5 block h-[3px] w-7 rounded-full ${c.barra}`} />
          </div>
        </div>

        {/* Filtros — solo si hay mezcla */}
        {countProductos > 0 && countServicios > 0 && (
          <div className="flex w-fit gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setFiltro("todos")}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                filtro === "todos" ? c.pillActive : c.pillIdle
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => setFiltro("producto")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                filtro === "producto" ? c.pillActive : c.pillIdle
              }`}
            >
              <Package className="h-3 w-3" /> {countProductos}
            </button>
            <button
              onClick={() => setFiltro("servicio")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                filtro === "servicio" ? c.pillActive : c.pillIdle
              }`}
            >
              <Wrench className="h-3 w-3" /> {countServicios}
            </button>
          </div>
        )}
      </div>

      {/* ─── Grilla compacta ───
          `auto-fill` en vez de breakpoints: el catálogo vive dentro de la
          columna principal de la ficha, que cambia de ancho con el sidebar y
          con el breakpoint `tab`, y adivinar cuántas columnas entran en cada
          combinación daba siempre una de más o una de menos. */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(12.5rem, 1fr))" }}
      >
        {visibles.map((item, i) => (
          <TarjetaCompacta
            key={item.id}
            item={item}
            color={c}
            onClick={() => setIdxAbierto(i)}
          />
        ))}
      </div>

      {ocultos > 0 && (
        <button
          type="button"
          onClick={() => setVerTodos(true)}
          className={`mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold ${c.accent} transition-opacity hover:opacity-75`}
        >
          Ver los {itemsFiltrados.length} {itemsFiltrados.length === 1 ? "ítem" : "ítems"}
          <span aria-hidden>→</span>
        </button>
      )}

      {/* ─── Modal detalle ─── */}
      <AnimatePresence>
        {idxAbierto !== null && itemsFiltrados[idxAbierto] && (
          <CatalogoModal
            item={itemsFiltrados[idxAbierto]}
            pos={idxAbierto + 1}
            total={itemsFiltrados.length}
            onNavegar={(delta) =>
              setIdxAbierto((i) =>
                i === null ? i : (i + delta + itemsFiltrados.length) % itemsFiltrados.length
              )
            }
            contacto={contacto}
            color={c}
            onClose={() => setIdxAbierto(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Modal detalle ───────────────────────────────────────────────────────────
function CatalogoModal({
  item,
  pos,
  total,
  contacto,
  color,
  onClose,
  onNavegar,
}: {
  item: CatalogoItem;
  /** Posición 1-based dentro del catálogo filtrado, para el contador. */
  pos: number;
  total: number;
  contacto?: ContactoCatalogo;
  color: Color;
  onClose: () => void;
  onNavegar: (delta: 1 | -1) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [detalleExpandido, setDetalleExpandido] = useState(false);
  const [detalleOverflow, setDetalleOverflow] = useState(false);
  const detalleRef = useRef<HTMLDivElement>(null);

  // Al pasar a otro ítem con las flechas, la galería y el "leer más" del
  // anterior no tienen que quedar arrastrados.
  useEffect(() => {
    setIdx(0);
    setDetalleExpandido(false);
  }, [item.id]);

  // Con el modal abierto, la rueda movía la ficha de atrás. Sólo el eje Y: el
  // body lleva `overflow-x: clip` puesto a propósito y pisarlo con un `hidden`
  // de los dos ejes rompería los `position: sticky` de la página.
  useEffect(() => {
    const { body } = document;
    const previo = body.style.overflowY;
    body.style.overflowY = "hidden";
    return () => {
      body.style.overflowY = previo;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (total > 1 && e.key === "ArrowLeft") onNavegar(-1);
      else if (total > 1 && e.key === "ArrowRight") onNavegar(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, onNavegar, onClose]);

  const esServicio = item.tipo_item === "servicio";
  const TipoIcon = esServicio ? Wrench : Package;

  // Consulta pre-escrita: mismo texto para WhatsApp y para el cuerpo del mail,
  // con el ítem nombrado para que la empresa sepa por qué le escriben.
  const mensajeConsulta = contacto
    ? `Hola ${contacto.nombre}! Vi ${esServicio ? "el servicio" : "el producto"} "${item.nombre}" en UIAB Conecta y quiero hacer una consulta.`
    : null;
  const emailConsulta = contacto && pareceEmail(contacto.email) ? contacto.email!.trim() : null;
  const mailtoConsulta =
    emailConsulta && mensajeConsulta
      ? `mailto:${emailConsulta}?subject=${encodeURIComponent(
          `Consulta por ${item.nombre} (UIAB Conecta)`
        )}&body=${encodeURIComponent(mensajeConsulta)}`
      : null;
  const tieneWhatsapp = !!contacto && whatsappLink(contacto.whatsapp) !== null;

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
      /* Centrado y con padding simétrico. Antes arrancaba pegado arriba con
         `pt-32` para esquivar el header fijo, pero el header comparte el z-50 y
         queda DEBAJO por orden del DOM, así que ese hueco sólo servía para
         empujar el modal fuera de pantalla: en un portátil de 800px el panel
         terminaba cortado abajo. `z-[60]` deja explícito que va por encima del
         header sin depender del orden de renderizado. */
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-[2px]"
      onClick={onClose}
      style={{ backgroundColor: "rgba(25, 28, 30, 0.45)" }}
    >
      {/* Flechas laterales entre ítems. Van fijas a los bordes de la pantalla,
          en navy, para no confundirse con las flechas blancas de la galería de
          fotos que viven DENTRO de la imagen. Sólo en `xl`: el panel mide hasta
          1024px, así que recién a partir de ~1190px de ancho queda margen para
          ponerlas al costado sin que se monten sobre la imagen. Más abajo de
          eso, las flechas viven en el toolbar. */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavegar(-1);
            }}
            className="hidden xl:flex fixed left-6 2xl:left-10 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#00213f]/90 backdrop-blur hover:bg-[#10375c] items-center justify-center text-white transition-colors"
            style={{ boxShadow: "0 4px 16px rgba(25, 28, 30, 0.25)" }}
            aria-label="Ítem anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavegar(1);
            }}
            className="hidden xl:flex fixed right-6 2xl:right-10 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[#00213f]/90 backdrop-blur hover:bg-[#10375c] items-center justify-center text-white transition-colors"
            style={{ boxShadow: "0 4px 16px rgba(25, 28, 30, 0.25)" }}
            aria-label="Ítem siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        /* El alto es "lo que quede de pantalla" en vez de un porcentaje fijo:
           el 82svh de antes, sumado al padding de arriba, se pasaba del alto
           disponible en monitores bajos. El scroll vive adentro. */
        className="bg-white rounded-md w-full max-w-5xl max-h-[calc(100svh-1.5rem)] sm:max-h-[calc(100svh-3rem)] relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 16px 48px rgba(25, 28, 30, 0.12), 0 2px 8px rgba(25, 28, 30, 0.04)" }}
      >
        {/* Navegación entre ítems mientras no haya lugar al costado (debajo de
            `xl`). Va a la IZQUIERDA para no amontonarse con la X sobre la misma
            esquina de la imagen, que es justo donde las fichas suelen tener su
            logo. */}
        {total > 1 && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 xl:hidden">
            <button
              onClick={() => onNavegar(-1)}
              className="w-9 h-9 rounded-sm bg-white/95 backdrop-blur text-slate-700 hover:text-slate-900 hover:bg-white flex items-center justify-center transition-colors"
              style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
              aria-label="Ítem anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className="inline-flex h-9 items-center rounded-sm bg-white/95 px-2.5 font-mono text-[11px] font-semibold tabular-nums text-slate-600 backdrop-blur"
              style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
            >
              {pos} / {total}
            </span>
            <button
              onClick={() => onNavegar(1)}
              className="w-9 h-9 rounded-sm bg-white/95 backdrop-blur text-slate-700 hover:text-slate-900 hover:bg-white flex items-center justify-center transition-colors"
              style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
              aria-label="Ítem siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar flotante */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {total > 1 && (
            <span
              className="hidden xl:inline-flex h-9 items-center rounded-sm bg-white/95 px-2.5 font-mono text-[11px] font-semibold tabular-nums text-slate-600 backdrop-blur"
              style={{ boxShadow: "0 2px 8px rgba(25, 28, 30, 0.08)" }}
            >
              {pos} / {total}
            </span>
          )}
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
          {/* El mínimo baja en pantallas de poco alto: 560px fijos obligaban a
              scrollear adentro del modal en cualquier portátil de 800px. */}
          <div className="relative bg-slate-100 md:min-h-[380px] lg:min-h-[460px] xl:min-h-[540px] aspect-[4/3] md:aspect-auto">
            {item.imagenes.length > 0 ? (
              <>
                {/* object-contain, no cover: las imágenes del catálogo son 1:1
                    y el panel no; con cover se recortaban los bordes (chau
                    logo de la esquina). La banda que sobra queda del gris del
                    fondo y no molesta. */}
                <Image
                  key={item.imagenes[idx].url}
                  src={item.imagenes[idx].url}
                  alt={item.imagenes[idx].alt || item.nombre}
                  fill
                  sizes="(min-width: 768px) 55vw, 100vw"
                  className="object-contain"
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
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500">
                <TipoIcon className="w-3.5 h-3.5" />
                {item.tipo_item}
              </div>
              {item.destacado && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="inline-flex items-center gap-1 text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-amber-700">
                    <Star className="w-3 h-3 fill-current" />
                    Destacado
                  </div>
                </>
              )}
              {item.sku && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[11px] sm:text-[10px] font-mono text-slate-500">{item.sku}</span>
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
              <div className="text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-0.5">
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
                  <span className="text-[11px] sm:text-[10px] font-mono uppercase text-slate-400 ml-auto">
                    {item.moneda}
                  </span>
                )}
              </div>
            </div>

            {/* Consulta directa: el mensaje ya nombra el ítem, así la empresa
                sabe por qué le escriben sin que el interesado redacte nada. */}
            {(tieneWhatsapp || mailtoConsulta) && (
              <div>
                <div className="text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Consultar por este {esServicio ? "servicio" : "producto"}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {tieneWhatsapp && (
                    <BotonWhatsApp
                      telefono={contacto!.whatsapp}
                      texto={mensajeConsulta ?? undefined}
                      className="sm:flex-1"
                    />
                  )}
                  {mailtoConsulta && (
                    <a
                      href={mailtoConsulta}
                      className={`sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-sm border border-slate-200 transition-colors tracking-[0.15em] uppercase ${color.linkBtn}`}
                    >
                      <Mail className="w-4 h-4" />
                      Consultar por email
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Descripción detallada */}
            {item.descripcion_larga && (
              <div>
                <div className="text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
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
                    className={`mt-2 inline-flex items-center gap-1 text-[11px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${color.accent.replace("text-", "text-")} hover:opacity-80`}
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
                <div className="text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
                  Palabras clave
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.palabras_clave.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center text-[11px] sm:text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-[2px] tracking-wide"
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
                <div className="text-[11px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-500 mb-2">
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
                            <div className="text-[11px] sm:text-[9px] font-semibold tracking-[0.14em] uppercase text-slate-500">
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
