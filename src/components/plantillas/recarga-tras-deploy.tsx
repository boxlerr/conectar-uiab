"use client";

import { useEffect } from "react";

/**
 * Tras un deploy, los chunks JS del build anterior desaparecen del CDN de
 * Vercel. Un usuario que quedó con la app abierta navega, Next intenta bajar
 * un chunk del build viejo, recibe 404 y la navegación muere (spinner eterno
 * o pantalla rota). Este guard detecta ese error (ChunkLoadError / dynamic
 * import failed) y recarga la página para levantar el build nuevo — que es
 * exactamente lo que el usuario haría a mano.
 */
const PATRONES_CHUNK = [
  /ChunkLoadError/i,
  /Loading chunk [^\s]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

const CLAVE_ULTIMA_RECARGA = "uiab_recarga_deploy";

export function RecargaTrasDeploy() {
  useEffect(() => {
    const esChunkRoto = (msg: unknown) =>
      typeof msg === "string" && PATRONES_CHUNK.some((p) => p.test(msg));

    const recargar = () => {
      // Máximo una recarga por minuto: si el error persiste tras recargar,
      // no es skew de deploy y no queremos un loop de reloads.
      const ultima = Number(sessionStorage.getItem(CLAVE_ULTIMA_RECARGA) || 0);
      if (Date.now() - ultima < 60_000) return;
      sessionStorage.setItem(CLAVE_ULTIMA_RECARGA, String(Date.now()));
      console.warn("[deploy] Chunk del build viejo no disponible — recargando para tomar el build nuevo");
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (esChunkRoto(e.message) || esChunkRoto((e.error as Error | undefined)?.message)) recargar();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const razon = e.reason as Error | string | undefined;
      if (esChunkRoto(typeof razon === "string" ? razon : razon?.message)) recargar();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
