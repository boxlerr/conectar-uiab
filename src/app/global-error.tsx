"use client";

/**
 * Última red: sólo se usa cuando el fallo ocurre en el LAYOUT RAÍZ, donde
 * `app/error.tsx` ya no puede renderizar porque el árbol que lo contiene es el
 * que falló. Por eso este archivo trae su propio <html> y <body> y no importa
 * nada de la app (ni Button, ni el shell): si el layout está roto, cualquier
 * import suyo puede estar roto también.
 *
 * Sin este archivo, un fallo del layout deja la pantalla en blanco del todo.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f9fb",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#191c1e",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>
            No pudimos cargar la plataforma
          </h1>
          <p style={{ opacity: 0.55, lineHeight: 1.6, margin: "0 0 28px" }}>
            Fue un problema al iniciar la aplicación. Reintentá; si sigue
            pasando, recargá la página.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#00213f",
              color: "#fff",
              border: 0,
              borderRadius: 2,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          {error?.digest && (
            <p
              style={{
                marginTop: 32,
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#94a3b8",
              }}
            >
              Referencia {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
