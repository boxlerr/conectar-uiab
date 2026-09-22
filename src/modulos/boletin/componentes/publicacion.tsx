"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import { eliminarComunicado, fijarComunicado } from "../acciones";
import { cuerpoSinMarcas, rutaComunicado } from "../formato";
import type { ComunicadoPublico } from "../tipos";
import { CarruselFotos } from "./carrusel-fotos";
import { EncabezadoPublicacion } from "./encabezado-publicacion";
import { VisorFoto } from "./visor-foto";

/**
 * Una publicación en el feed del Boletín, con el formato de una red social
 * (Facebook, X, LinkedIn): quién publica y cuándo, el título y un adelanto del
 * texto, y las fotos a lo ancho — una sola en su proporción real, varias en un
 * carrusel que se pasa con el dedo o con las flechas.
 *
 * Es la tapa de la nota: tocar el TEXTO abre la publicación entera en
 * /boletin/[slug] (ver `Articulo`), como pidió Juli — "que sea clickeable y
 * adentro ves el blog completo". Tocar una FOTO abre el visor, que es lo que
 * hace cualquier red social.
 *
 * - `esAdmin` agrega el menú ··· para fijar, editar y eliminar sin ir al panel.
 * - `vistaPrevia` la dibuja en el editor del panel: sin links ni menú.
 */

/** Hasta dónde se muestra el texto antes de "Seguir leyendo". */
const MAX_CARACTERES = 320;
const MAX_LINEAS = 6;

function esLargo(texto: string) {
  return texto.length > MAX_CARACTERES || texto.split("\n").length > MAX_LINEAS;
}

export function Publicacion({
  c,
  esAdmin = false,
  vistaPrevia = false,
}: {
  c: ComunicadoPublico;
  esAdmin?: boolean;
  vistaPrevia?: boolean;
}) {
  // El adelanto: la bajada si la nota tiene (para eso está, es el resumen que
  // escribió la UIAB) y si no, el cuerpo sin las marcas de subtítulo.
  const adelanto = c.bajada?.trim() || cuerpoSinMarcas(c.cuerpo);
  const largo = esLargo(adelanto);
  const href = rutaComunicado(c);

  // Tocar una foto abre el visor, no la nota: es lo que espera cualquiera que
  // usó una red social, y el texto entero se lee igual al costado del visor.
  const [visor, setVisor] = useState<number | null>(null);
  const cerrarVisor = useCallback(() => setVisor(null), []);

  // En la vista previa nada navega: los "links" son divs.
  const enlace = (className: string, children: React.ReactNode) =>
    vistaPrevia ? (
      <div className={className}>{children}</div>
    ) : (
      <Link href={href} className={className}>
        {children}
      </Link>
    );

  /* La tarjeta NO lleva `overflow-hidden`: el menú ··· es `absolute` dentro de
     ella, y en una publicación corta quedaba recortado a la mitad — se veía
     sólo la primera opción. El recorte lo hace ahora la foto, que es lo único
     que necesita respetar la esquina redondeada de abajo. */
  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,33,63,0.05)] transition-shadow hover:shadow-[0_6px_24px_-10px_rgba(0,33,63,0.18)]">
      {c.fijado && (
        <div className="flex items-center gap-1.5 px-4 pt-3 text-[12px] font-semibold text-slate-500 sm:px-5">
          <Pin className="h-3.5 w-3.5" />
          Publicación fijada
        </div>
      )}

      <div className="px-4 pt-3 sm:px-5 sm:pt-4">
        <EncabezadoPublicacion
          c={c}
          acciones={esAdmin && !vistaPrevia ? <MenuAdmin c={c} volverAlFeed={false} /> : undefined}
        />
      </div>

      {(c.titulo || adelanto) &&
        enlace(
          "group block px-4 pb-3 pt-3 sm:px-5",
          <>
            {c.titulo && (
              <h2 className="mb-1.5 font-poppins text-[17px] font-bold leading-snug tracking-tight text-[#00213f] group-hover:text-sky-800">
                {c.titulo}
              </h2>
            )}
            {adelanto && (
              <p
                className={`whitespace-pre-line break-words text-[15px] leading-relaxed text-slate-700 ${
                  largo ? "line-clamp-4" : ""
                }`}
              >
                {adelanto}
              </p>
            )}
            {(largo || c.titulo) && (
              <span className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-sky-700">
                {largo ? "Seguir leyendo" : "Abrir nota"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </>
        )}

      {c.imagenes.length > 0 && (
        <div className="overflow-hidden rounded-b-2xl border-t border-slate-100">
          <CarruselFotos
            imagenes={c.imagenes}
            sizes="(max-width: 640px) 100vw, 660px"
            alAbrir={vistaPrevia ? undefined : (i) => setVisor(i)}
          />
        </div>
      )}

      {visor !== null && <VisorFoto c={c} desde={visor} onCerrar={cerrarVisor} />}
    </article>
  );
}

export function MenuAdmin({ c, volverAlFeed }: { c: ComunicadoPublico; volverAlFeed: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function cerrar(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setAbierto(false);
        setConfirmarBorrado(false);
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAbierto(false);
        setConfirmarBorrado(false);
      }
    }
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  async function alternarFijado() {
    setOcupado(true);
    const res = await llamarAccion(() => fijarComunicado(c.id, !c.fijado));
    setOcupado(false);
    setAbierto(false);
    if (fallo(res)) return toast.error(res.error);
    toast.success(c.fijado ? "Publicación desfijada." : "Publicación fijada arriba del boletín.");
    router.refresh();
  }

  async function eliminar() {
    setOcupado(true);
    const res = await llamarAccion(() => eliminarComunicado(c.id));
    setOcupado(false);
    if (fallo(res)) {
      setAbierto(false);
      return toast.error(res.error);
    }
    toast.success("Publicación eliminada.");
    if (volverAlFeed) router.push("/boletin");
    else router.refresh();
  }

  const item =
    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div ref={ref} className="relative -mr-1.5 -mt-1">
      <button
        type="button"
        onClick={() => {
          setAbierto((a) => !a);
          setConfirmarBorrado(false);
        }}
        aria-label="Opciones de la publicación"
        aria-expanded={abierto}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {abierto && (
        <div className="absolute right-0 top-10 z-20 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <button type="button" onClick={alternarFijado} disabled={ocupado} className={item}>
            {c.fijado ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {c.fijado ? "Desfijar" : "Fijar arriba del boletín"}
          </button>
          <Link href="/admin/boletin" className={item}>
            <Pencil className="h-4 w-4" />
            Editar en el panel
          </Link>
          <div className="my-1 border-t border-slate-100" />
          {confirmarBorrado ? (
            <button
              type="button"
              onClick={eliminar}
              disabled={ocupado}
              className={`${item} font-semibold text-red-600 hover:bg-red-50`}
            >
              <Trash2 className="h-4 w-4" />
              {ocupado ? "Eliminando…" : "Sí, eliminar para siempre"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarBorrado(true)}
              className={`${item} text-red-600 hover:bg-red-50`}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
