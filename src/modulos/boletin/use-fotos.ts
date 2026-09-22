"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { subirFotoComunicado } from "./subir-foto";
import { MAX_FOTOS } from "./tipos";

/**
 * Las fotos de una publicación mientras se la escribe, compartido por el
 * cuadro del feed y el formulario del panel.
 *
 * Cada foto se ve APENAS SE ELIGE, con un `objectURL` local, y encima la barra
 * de progreso de su subida: no hay que esperar a que termine para saber qué se
 * eligió ni en qué orden quedó. Cuando termina, el `objectURL` se reemplaza por
 * la URL pública y se revoca (si no, el archivo queda retenido en memoria hasta
 * recargar la página).
 *
 * El orden de la lista es el orden del carrusel, y la primera es la portada.
 *
 * (El archivo y la función se llaman en inglés, contra la convención del
 * repo: la regla `react-hooks/rules-of-hooks` de ESLint sólo reconoce un hook
 * si el nombre empieza con `use`, y con `usarFotos` no chequeaba NADA de lo de
 * adentro.)
 *
 * OJO: las subidas arrancan en el manejador del evento, NUNCA dentro de un
 * updater de `setState`. React llama a los updaters dos veces en desarrollo
 * (StrictMode), así que cada foto se habría subido dos veces —dos archivos en
 * el bucket, uno de ellos huérfano para siempre—. Los updaters de acá son
 * funciones puras; los efectos van afuera.
 */

export type FotoEnEdicion = {
  /** Clave local y estable; NO es el nombre del archivo (puede repetirse). */
  id: string;
  /** `objectURL` mientras sube, URL pública cuando terminó. */
  url: string;
  /** Ruta dentro del bucket. Null mientras sube. */
  ruta: string | null;
  /** 0 → 1. */
  progreso: number;
};

export function useFotos(iniciales: FotoEnEdicion[] = []) {
  const [fotos, setFotos] = useState<FotoEnEdicion[]>(iniciales);

  // Espejo de la lista para leerla desde los manejadores sin depender del
  // cierre del último render.
  const actuales = useRef(fotos);
  useEffect(() => {
    actuales.current = fotos;
  }, [fotos]);

  // Los objectURL vivos, para revocarlos al desmontar aunque la subida
  // todavía no haya terminado.
  const locales = useRef(new Set<string>());
  useEffect(() => {
    const vivos = locales.current;
    return () => {
      vivos.forEach((u) => URL.revokeObjectURL(u));
      vivos.clear();
    };
  }, []);

  const subiendo = fotos.some((f) => !f.ruta);
  const rutas = fotos.map((f) => f.ruta).filter((r): r is string => Boolean(r));

  const reemplazar = useCallback((id: string, cambio: Partial<FotoEnEdicion>) => {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ...cambio } : f)));
  }, []);

  const olvidarLocal = useCallback((url: string) => {
    if (!locales.current.has(url)) return;
    URL.revokeObjectURL(url);
    locales.current.delete(url);
  }, []);

  const quitar = useCallback(
    (id: string) => {
      const f = actuales.current.find((x) => x.id === id);
      if (f) olvidarLocal(f.url);
      setFotos((prev) => prev.filter((x) => x.id !== id));
      // La foto ya subida queda huérfana en el bucket hasta que se guarde la
      // publicación: la limpia `actualizarComunicado`, que borra del bucket
      // todo lo que ya no está en la fila. Borrarla acá pediría un action de
      // borrado por ruta, que es justo lo que `prepararSubidaImagen` evita.
    },
    [olvidarLocal]
  );

  const agregar = useCallback(
    (archivos: File[]) => {
      if (archivos.length === 0) return;

      const lugar = MAX_FOTOS - actuales.current.length;
      if (lugar <= 0) {
        toast.error(`Ya hay ${MAX_FOTOS} fotos, que es el máximo.`);
        return;
      }
      if (archivos.length > lugar) {
        toast.error(`Entran ${lugar} foto${lugar === 1 ? "" : "s"} más: el máximo es ${MAX_FOTOS}.`);
      }

      const nuevas = archivos.slice(0, lugar).map((file) => {
        const url = URL.createObjectURL(file);
        locales.current.add(url);
        return { foto: { id: crypto.randomUUID(), url, ruta: null, progreso: 0 }, file };
      });

      setFotos((prev) => [...prev, ...nuevas.map((n) => n.foto)]);

      // Las subidas van en paralelo: son archivos chicos y cada una avisa su
      // propio progreso.
      for (const { foto, file } of nuevas) {
        void subirFotoComunicado(file, (p) => reemplazar(foto.id, { progreso: p })).then((res) => {
          if ("error" in res) {
            toast.error(res.error);
            quitar(foto.id);
            return;
          }
          olvidarLocal(foto.url);
          reemplazar(foto.id, { ruta: res.ruta, url: res.url, progreso: 1 });
        });
      }
    },
    [olvidarLocal, quitar, reemplazar]
  );

  const limpiar = useCallback(() => {
    locales.current.forEach((u) => URL.revokeObjectURL(u));
    locales.current.clear();
    setFotos([]);
  }, []);

  return { fotos, agregar, quitar, limpiar, setFotos, subiendo, rutas };
}
