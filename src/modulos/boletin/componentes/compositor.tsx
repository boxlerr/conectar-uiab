"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import { crearComunicado } from "../acciones";
import { MIME_FOTO } from "../subir-foto";
import { useFotos } from "../use-fotos";
import { BUCKET_BOLETIN, MAX_FOTOS } from "../tipos";
import { FotosEnEdicion } from "./fotos-en-edicion";

/**
 * "Compartí una novedad…": publicar desde el propio feed, como en cualquier red.
 * Sólo lo ve un admin (la página decide si lo dibuja; el action igual exige
 * admin). Publica directo. Borradores, títulos y edición siguen en /admin/boletin.
 *
 * Las fotos se suben apenas se eligen, en paralelo y con barra de progreso
 * (ver `useFotos`), así que se puede seguir escribiendo mientras suben. Lo
 * único que espera es el botón de publicar: con una subida a medias, la
 * publicación se guardaría sin esa foto.
 */
export function Compositor() {
  const router = useRouter();
  const inputFoto = useRef<HTMLInputElement>(null);

  const [texto, setTexto] = useState("");
  const [publicando, setPublicando] = useState(false);
  const { fotos, agregar, quitar, limpiar, subiendo, rutas } = useFotos();

  const vacio = !texto.trim() && fotos.length === 0;
  // No se publica con una subida a medias: la fila quedaría sin esa foto.
  const ocupado = subiendo || publicando;

  function elegirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite re-elegir el mismo archivo
    agregar(archivos);
  }

  async function publicar() {
    if (vacio || ocupado) return;
    setPublicando(true);
    const res = await llamarAccion(() =>
      crearComunicado({
        titulo: "",
        // Sin título no hay dónde colgar una bajada: este cuadro publica
        // avisos cortos, la nota con bajada y subtítulos se arma en /admin.
        bajada: "",
        cuerpo: texto,
        estado: "publicado",
        fijado: false,
        bucket: rutas.length > 0 ? BUCKET_BOLETIN : null,
        rutas_imagenes: rutas,
      })
    );
    setPublicando(false);
    if (fallo(res)) return toast.error(res.error);

    setTexto("");
    limpiar();
    toast.success("Publicado. Ya está visible en el boletín público.");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(0,33,63,0.05)] sm:p-5">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
          <Image src="/icono-uiab.svg" alt="" width={30} height={30} />
        </span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl/Cmd + Enter publica, como en LinkedIn o X.
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) publicar();
          }}
          placeholder="Compartí una novedad de la UIAB…"
          rows={texto ? Math.min(12, Math.max(3, texto.split("\n").length + 1)) : 2}
          aria-label="Texto de la publicación"
          className="min-h-11 flex-1 resize-none rounded-xl bg-slate-50 px-4 py-2.5 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-[15px]"
        />
      </div>

      {fotos.length > 0 && (
        <div className="mt-3 sm:ml-14">
          <FotosEnEdicion fotos={fotos} onQuitar={quitar} deshabilitado={publicando} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:ml-14">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            disabled={publicando || fotos.length >= MAX_FOTOS}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ImagePlus className="h-5 w-5 text-emerald-600" />
            {fotos.length > 0 ? `Fotos (${fotos.length})` : "Fotos"}
          </button>
          <input
            ref={inputFoto}
            type="file"
            accept={MIME_FOTO.join(",")}
            multiple
            onChange={elegirFotos}
            className="hidden"
          />
          <Link
            href="/admin/boletin"
            className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:inline-block"
          >
            Borradores
          </Link>
        </div>
        <button
          type="button"
          onClick={publicar}
          disabled={vacio || ocupado}
          className="inline-flex items-center gap-2 rounded-full bg-[#00213f] px-5 py-2 text-[14px] font-bold text-white transition-colors hover:bg-[#0a3560] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publicando && <Loader2 className="h-4 w-4 animate-spin" />}
          {subiendo && !publicando ? "Subiendo…" : "Publicar"}
        </button>
      </div>
    </div>
  );
}
