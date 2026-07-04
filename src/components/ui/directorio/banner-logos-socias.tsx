"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/cliente";

interface EmpresaSocia {
  id: string;
  nombre: string;
  logoUrl: string | null;
}

// Fisher-Yates: devuelve una copia mezclada, no muta el original.
function mezclar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function BannerLogosSocias() {
  const [empresas, setEmpresas] = useState<EmpresaSocia[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const supabase = createClient();
      // Usamos la vista pública (no la tabla) para que funcione sin auth.
      // La vista solo expone 4 columnas de empresas aprobadas — la tabla
      // empresas sigue bloqueada para anon por RLS.
      const { data, error } = await supabase
        .from("empresas_publicas_logos")
        .select("id, razon_social, bucket_logo, ruta_logo");

      if (error || !data) {
        setCargando(false);
        return;
      }

      const mapped: EmpresaSocia[] = data.map((e: any) => ({
        id: e.id,
        nombre: e.razon_social,
        logoUrl:
          e.bucket_logo && e.ruta_logo
            ? supabase.storage.from(e.bucket_logo).getPublicUrl(e.ruta_logo).data.publicUrl
            : null,
      }));

      setEmpresas(mapped);
      setCargando(false);
    };

    fetchEmpresas();
  }, []);

  if (cargando) {
    return (
      <div className="relative overflow-hidden">
        <div className="flex gap-16 px-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[220px] h-[90px] bg-slate-100/60 rounded-sm animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (empresas.length === 0) return null;

  return <MarqueeEmpresas empresas={empresas} />;
}

function MarqueeEmpresas({ empresas }: { empresas: EmpresaSocia[] }) {
  // Cada "pasada" es una mezcla independiente del set completo de empresas,
  // así nunca se repite una empresa dentro de una misma pasada. Encadenamos
  // varias pasadas distintas para que el recorrido no se sienta siempre
  // igual, y además nos aseguramos de que la mitad del track sea más ancha
  // que la pantalla (si no, el loop se ve "saltar" al resetear).
  const minItems = 8;
  const pasadas = Math.max(4, Math.ceil(minItems / empresas.length));
  const itemsBase = useMemo(
    () => Array.from({ length: pasadas }, () => mezclar(empresas)).flat(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empresas]
  );
  // Duplicamos el set para que translateX(-50%) cierre el loop sin salto.
  const items = [...itemsBase, ...itemsBase];

  return (
    <div
      className="group relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        className="marquee-track flex items-center gap-16 w-max"
        // 120s es el tiempo original pensado para una sola pasada; al
        // encadenar varias pasadas mezcladas escalamos la duración para
        // no acelerar visualmente el scroll.
        style={{ animationDuration: `${pasadas * 120}s` }}
      >
        {items.map((emp, i) => (
          <LogoSocia key={`${emp.id}-${i}`} empresa={emp} />
        ))}
      </div>
    </div>
  );
}

/**
 * Formatea el nombre como un "wordmark" tipo logo cloud profesional.
 * Quitamos sufijos legales (S.A., S.R.L., etc) que ensucian visualmente
 * y dejamos el nombre principal en mayúsculas con letter-spacing.
 */
function formatearWordmark(nombre: string): string {
  return nombre
    .replace(/\s*(S\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?|SRL|SA|SAS)\.?$/i, "")
    .trim()
    .toUpperCase();
}

function LogoSocia({ empresa }: { empresa: EmpresaSocia }) {
  const [errorLogo, setErrorLogo] = useState(false);
  const mostrarFallback = !empresa.logoUrl || errorLogo;
  const wordmark = formatearWordmark(empresa.nombre);

  return (
    <div
      className="flex-shrink-0 w-[220px] h-[90px] flex items-center justify-center px-6 transition-transform duration-300 ease-out hover:scale-125"
      title={empresa.nombre}
    >
      {mostrarFallback ? (
        <span
          className="text-center text-[15px] font-extrabold text-slate-400 uppercase leading-tight tracking-[0.08em] line-clamp-2 transition-colors duration-300 group-hover:text-slate-500"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          {wordmark}
        </span>
      ) : (
        <Image
          src={empresa.logoUrl!}
          alt={empresa.nombre}
          width={180}
          height={70}
          className="object-contain max-h-[70px] max-w-[180px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          onError={() => setErrorLogo(true)}
        />
      )}
    </div>
  );
}
