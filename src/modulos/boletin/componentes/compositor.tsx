"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/cliente";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import { crearComunicado } from "../acciones";
import { MIME_FOTO, subirFotoComunicado } from "../subir-foto";
import { BUCKET_BOLETIN } from "../tipos";

/**
 * "Compartí una novedad…": publicar desde el propio feed, como en cualquier red.
 * Sólo lo ve un admin (la página decide si lo dibuja; el action igual exige
 * admin). Publica directo. Borradores, títulos y edición siguen en /admin/boletin.
 */
export function Compositor() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const inputFoto = useRef<HTMLInputElement>(null);

  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState<{ ruta: string; url: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const vacio = !texto.trim() && !foto;
  const ocupado = subiendo || publicando;

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-elegir el mismo archivo
    if (!file) return;
    setSubiendo(true);
    const res = await subirFotoComunicado(supabase, file);
    setSubiendo(false);
    if ("error" in res) return toast.error(res.error);
    setFoto(res);
  }

  async function publicar() {
    if (vacio || ocupado) return;
    setPublicando(true);
    const res = await llamarAccion(() =>
      crearComunicado({
        titulo: "",
        cuerpo: texto,
        estado: "publicado",
        fijado: false,
        bucket: foto ? BUCKET_BOLETIN : null,
        ruta_imagen: foto?.ruta ?? null,
      })
    );
    setPublicando(false);
    if (fallo(res)) return toast.error(res.error);

    setTexto("");
    setFoto(null);
    toast.success("Publicado. Ya lo ven todas las socias.");
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
          placeholder="Compartí una novedad con las socias…"
          rows={texto ? Math.min(12, Math.max(3, texto.split("\n").length + 1)) : 2}
          aria-label="Texto de la publicación"
          className="min-h-11 flex-1 resize-none rounded-xl bg-slate-50 px-4 py-2.5 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-[15px]"
        />
      </div>

      {(foto || subiendo) && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 sm:ml-14">
          {foto ? (
            <>
              <Image
                src={foto.url}
                alt="Foto a publicar"
                width={0}
                height={0}
                sizes="560px"
                className="block h-auto max-h-80 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setFoto(null)}
                disabled={publicando}
                aria-label="Quitar foto"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center gap-2 bg-slate-50 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo foto…
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:ml-14">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            disabled={ocupado || !!foto}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ImagePlus className="h-5 w-5 text-emerald-600" />
            Foto
          </button>
          <input
            ref={inputFoto}
            type="file"
            accept={MIME_FOTO.join(",")}
            onChange={elegirFoto}
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
          Publicar
        </button>
      </div>
    </div>
  );
}
