import { BadgeCheck } from "lucide-react";

/**
 * Sello de socia verificada por la UIAB.
 *
 * Antes era un cuadradito navy con un ícono adentro: en una lista mezclada no
 * se leía como "verificado", parecía un botón. Ahora es una píldora con el
 * sello y la palabra, que es lo que hace que se entienda de un vistazo quién
 * está avalado por la Unión Industrial.
 */
interface SelloVerificadoProps {
  /** `sm` para filas de lista, `md` para tarjetas. */
  size?: "sm" | "md";
  /** Texto del sello. Default "Socia UIAB". */
  etiqueta?: string;
  className?: string;
}

export function SelloVerificado({
  size = "md",
  etiqueta = "Socia UIAB",
  className = "",
}: SelloVerificadoProps) {
  const esSm = size === "sm";

  return (
    <span
      title={`${etiqueta} — verificada por la Unión Industrial de Almirante Brown`}
      className={`relative inline-flex items-center rounded-full bg-gradient-to-br from-[#10375c] via-[#164a75] to-[#1a6496] ring-1 ring-inset ring-white/25 shadow-[0_2px_10px_-2px_rgba(16,55,92,0.55)] ${
        esSm ? "gap-1 pl-1 pr-2 py-[3px]" : "gap-1.5 pl-1.5 pr-2.5 py-1"
      } ${className}`}
    >
      {/* Brillo superior: le da el relieve de sello en vez de chip plano. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full bg-gradient-to-b from-white/25 to-transparent"
      />
      <BadgeCheck
        className={`relative shrink-0 text-white ${esSm ? "w-3.5 h-3.5" : "w-[18px] h-[18px]"}`}
        strokeWidth={2.4}
      />
      <span
        className={`relative font-black uppercase tracking-[0.1em] text-white whitespace-nowrap ${
          esSm ? "text-[8.5px]" : "text-[11px] sm:text-[9.5px]"
        }`}
      >
        {etiqueta}
      </span>
    </span>
  );
}
