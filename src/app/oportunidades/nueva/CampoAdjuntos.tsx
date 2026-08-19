"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FileText, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import {
  type AdjuntoOportunidad,
  ACCEPT_ADJUNTOS,
  MAX_ADJUNTOS,
  esImagenAdjunto,
  etiquetaDeTipo,
  tamanoLegible,
  validarAdjunto,
} from "@/modulos/oportunidades/adjuntos";

/** Un archivo elegido y todavía no subido. */
export interface ArchivoLocal {
  file: File;
  /** `createObjectURL` para las imágenes; null para documentos. */
  previewUrl: string | null;
}

/**
 * Selector de imágenes y documentos del formulario de oportunidad.
 *
 * Controlado por el padre (los archivos viajan recién al publicar/guardar).
 * En edición además lista los adjuntos ya subidos, cuya eliminación es
 * inmediata vía `onEliminarExistente` (el archivo ya vive en Storage).
 */
export function CampoAdjuntos({
  archivos,
  onChange,
  existentes = [],
  onEliminarExistente,
  deshabilitado = false,
}: {
  archivos: ArchivoLocal[];
  onChange: (archivos: ArchivoLocal[]) => void;
  existentes?: AdjuntoOportunidad[];
  onEliminarExistente?: (adjunto: AdjuntoOportunidad) => Promise<boolean>;
  deshabilitado?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const total = archivos.length + existentes.length;

  // Las preview URLs se liberan al desmontar. Va por ref y no por closure: con
  // deps `[]` el cleanup capturaba el `archivos` del montaje —siempre vacío—,
  // así que no liberaba nada y los blobs quedaban retenidos hasta recargar.
  const archivosVivos = useRef(archivos);
  archivosVivos.current = archivos;
  useEffect(() => {
    return () => {
      for (const archivo of archivosVivos.current) {
        if (archivo.previewUrl) URL.revokeObjectURL(archivo.previewUrl);
      }
    };
  }, []);

  const agregarArchivos = (lista: FileList | null) => {
    if (!lista || lista.length === 0) return;

    const nuevos: ArchivoLocal[] = [];
    for (const file of Array.from(lista)) {
      if (total + nuevos.length >= MAX_ADJUNTOS) {
        toast.error(`Hasta ${MAX_ADJUNTOS} archivos por oportunidad.`);
        break;
      }
      const invalido = validarAdjunto({
        nombre: file.name,
        mime: file.type,
        tamano: file.size,
      });
      if (invalido) {
        toast.error("Archivo no agregado", { description: invalido });
        continue;
      }
      // Dos fotos de la cámara del iPhone llegan las dos como "image.jpg": sin
      // el aviso, el usuario elegía dos y veía una sola sin ninguna explicación.
      if (
        archivos.some((existente) => existente.file.name === file.name) ||
        nuevos.some((nuevo) => nuevo.file.name === file.name)
      ) {
        toast.error("Archivo repetido", {
          description: `Ya agregaste uno llamado "${file.name}". Cambiale el nombre si son distintos.`,
        });
        continue;
      }
      nuevos.push({
        file,
        previewUrl: esImagenAdjunto(file.type) ? URL.createObjectURL(file) : null,
      });
    }

    if (nuevos.length > 0) onChange([...archivos, ...nuevos]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const quitarLocal = (indice: number) => {
    const archivo = archivos[indice];
    if (archivo?.previewUrl) URL.revokeObjectURL(archivo.previewUrl);
    onChange(archivos.filter((_, i) => i !== indice));
  };

  const eliminarExistente = async (adjunto: AdjuntoOportunidad) => {
    if (!onEliminarExistente || eliminando) return;
    setEliminando(adjunto.ruta);
    try {
      const ok = await onEliminarExistente(adjunto);
      if (!ok) toast.error("No se pudo borrar el archivo.");
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ADJUNTOS}
        className="hidden"
        onChange={(evento) => agregarArchivos(evento.target.files)}
        disabled={deshabilitado}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Ya subidos (sólo edición) */}
        {existentes.map((adjunto) => (
          <div
            key={adjunto.ruta}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {adjunto.esImagen ? (
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={adjunto.url}
                  alt={adjunto.nombre}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 bg-slate-50 px-3">
                <FileText className="h-7 w-7 text-slate-400" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {etiquetaDeTipo(adjunto.mime, adjunto.nombre)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2">
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">
                {adjunto.nombre}
              </p>
              {onEliminarExistente && (
                <button
                  type="button"
                  onClick={() => eliminarExistente(adjunto)}
                  disabled={deshabilitado || eliminando !== null}
                  aria-label={`Borrar ${adjunto.nombre}`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {eliminando === adjunto.ruta ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Elegidos en esta sesión (todavía sin subir) */}
        {archivos.map((archivo, indice) => (
          <div
            key={`${archivo.file.name}-${indice}`}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {archivo.previewUrl ? (
              <div className="relative aspect-[4/3] bg-slate-100">
                {/* Blob local: next/image no optimiza object URLs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={archivo.previewUrl}
                  alt={archivo.file.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 bg-slate-50 px-3">
                <FileText className="h-7 w-7 text-slate-400" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {etiquetaDeTipo(archivo.file.type, archivo.file.name)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-600">
                  {archivo.file.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {tamanoLegible(archivo.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => quitarLocal(indice)}
                disabled={deshabilitado}
                aria-label={`Quitar ${archivo.file.name}`}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}

        {/* Agregar */}
        {total < MAX_ADJUNTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={deshabilitado}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-slate-500 transition-colors hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-50 sm:min-h-[124px]"
          >
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            <span className="px-2 text-center text-xs font-bold">
              Agregar fotos o archivos
            </span>
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Hasta {MAX_ADJUNTOS} archivos. Imágenes JPG/PNG/WEBP (máx. 6 MB) y
        documentos PDF, Word o Excel (máx. 10 MB). Las fotos se muestran en la
        publicación; los documentos quedan para descargar.
      </p>
    </div>
  );
}
