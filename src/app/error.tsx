"use client";

/**
 * Error boundary de segmento.
 *
 * Antes NO existía ningún error.tsx en toda la app. Sin este archivo, cualquier
 * excepción del cliente (típicamente un Server Action que rechaza tras un deploy)
 * subía hasta la raíz y React desmontaba el árbol entero: pantalla en blanco con
 * "Application error: a client-side exception has occurred", sin nav, sin salida
 * que no fuera recargar a mano.
 *
 * Con este boundary el fallo queda contenido en el segmento: el Header y el
 * Footer siguen en pie y el usuario tiene un botón de reintento — `reset()`
 * vuelve a montar el segmento sin recargar la página.
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  // Un bundle viejo pidiéndole al server algo que ya no existe: reintentar en la
  // misma pestaña no alcanza, hay que bajar el build nuevo. Lo detectamos para
  // ofrecer el botón que realmente destraba (recargar) en vez del que no.
  const esDesfasajeDeVersion =
    /Failed to find Server Action|ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch/i.test(
      `${error?.name} ${error?.message}`
    );

  return (
    <div className="min-h-[70svh] flex items-center justify-center p-6 bg-[#f7f9fb]">
      <div className="w-full max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-100 mb-8">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>

        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight text-[#191c1e] mb-4"
          style={{ fontFamily: "var(--font-manrope), sans-serif" }}
        >
          {esDesfasajeDeVersion
            ? "Se actualizó la plataforma"
            : "Algo no cargó como esperábamos"}
        </h1>

        <p className="text-[#191c1e]/50 leading-relaxed mb-10">
          {esDesfasajeDeVersion
            ? "Publicamos una versión nueva mientras tenías la página abierta. Recargá para ponerte al día — no perdiste nada."
            : "Fue un problema puntual al cargar esta sección. Podés reintentar sin salir de acá."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {esDesfasajeDeVersion ? (
            <Button
              size="lg"
              onClick={() => window.location.reload()}
              className="rounded-sm px-8 font-bold bg-[#00213f] hover:bg-[#10375c]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar la página
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={reset}
              className="rounded-sm px-8 font-bold bg-[#00213f] hover:bg-[#10375c]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-sm px-8 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        {error?.digest && (
          <p className="mt-10 text-[11px] uppercase tracking-widest text-slate-400">
            Referencia {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
