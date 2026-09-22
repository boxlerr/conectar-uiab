"use client";

import { useState } from "react";
import { Check, Link2, Linkedin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { rutaComunicado } from "../formato";
import type { ComunicadoPublico } from "../tipos";

/**
 * Compartir una nota del Boletín. Ahora que el boletín es público, el enlace
 * sirve para cualquiera: se pega en un grupo de WhatsApp de socias o se
 * publica en LinkedIn, y del otro lado se abre sin pedir sesión.
 *
 * Dos formas del mismo control, para el mismo componente en dos lugares del
 * layout de la nota:
 *   - `columna`: la barra vertical pegajosa del costado izquierdo (xl).
 *   - `fila`: la tira horizontal bajo la firma, cuando no hay costado (< xl).
 *
 * La URL se arma en el browser con `window.location.origin` y no con una
 * constante: en localhost tiene que copiar localhost, no el dominio productivo.
 */
export function CompartirNota({
  c,
  forma = "fila",
}: {
  c: ComunicadoPublico;
  forma?: "fila" | "columna";
}) {
  const [copiado, setCopiado] = useState(false);

  const url = () => `${window.location.origin}${rutaComunicado(c)}`;
  const titulo = c.titulo || "Boletín UIAB";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url());
      setCopiado(true);
      toast.success("Enlace copiado. Pegalo donde quieras compartirlo.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No pudimos copiar el enlace.");
    }
  }

  function abrir(plantilla: (u: string) => string) {
    window.open(plantilla(encodeURIComponent(url())), "_blank", "noopener,noreferrer");
  }

  const columna = forma === "columna";

  const boton = columna
    ? "flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:text-[#00213f] hover:shadow-sm"
    : "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00213f]";

  return (
    <div
      className={
        columna ? "flex flex-col items-center gap-2" : "flex flex-wrap items-center gap-1.5"
      }
    >
      {columna && (
        <span className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Compartir
        </span>
      )}

      <button type="button" onClick={copiar} className={boton} aria-label="Copiar enlace">
        {copiado ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        {!columna && (copiado ? "Copiado" : "Copiar enlace")}
      </button>

      <button
        type="button"
        onClick={() => abrir((u) => `https://wa.me/?text=${encodeURIComponent(titulo + " ")}${u}`)}
        className={boton}
        aria-label="Compartir por WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        {!columna && "WhatsApp"}
      </button>

      <button
        type="button"
        onClick={() => abrir((u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`)}
        className={boton}
        aria-label="Compartir en LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
        {!columna && "LinkedIn"}
      </button>
    </div>
  );
}
