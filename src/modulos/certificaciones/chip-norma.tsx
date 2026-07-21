/**
 * Chip visual de una norma/certificación. Presentacional puro (sin estado, sin
 * hooks): lo pueden importar tanto server components (tarjeta del directorio,
 * ficha) como client components (páginas por categoría, panel admin). No lleva
 * `"use client"` ni `import "server-only"`.
 *
 * ⚠️ Legal: NO se usan los logos oficiales de ISO/IRAM/TÜV/etc. (marcas
 * registradas). El chip es un badge propio: código de la norma + ícono genérico
 * por familia (lucide-react). Se lee igual de rápido y no expone a la UIAB.
 *
 * Las certificaciones las declara cada socio bajo su responsabilidad: la UIAB no
 * las verifica ni las audita, así que el chip no lleva ningún sello de
 * "verificado".
 */
import { Award, BadgeCheck, HardHat, Landmark, Leaf, Stamp, Utensils, type LucideIcon } from "lucide-react";
import { FAMILIA_META, type FamiliaNorma } from "./normas";
import { cn } from "@/lib/utilidades";

const ICONOS: Record<string, LucideIcon> = {
  Award,
  BadgeCheck,
  HardHat,
  Landmark,
  Leaf,
  Stamp,
  Utensils,
};

interface ChipNormaProps {
  etiqueta: string;
  familia: FamiliaNorma;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

export function ChipNorma({ etiqueta, familia, size = "sm", className, title }: ChipNormaProps) {
  const meta = FAMILIA_META[familia] ?? FAMILIA_META.otras;
  const Icono = ICONOS[meta.icono] ?? Award;
  const esSm = size === "sm";

  return (
    <span
      title={title ?? etiqueta}
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] border font-bold whitespace-nowrap",
        meta.chip,
        esSm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
        className
      )}
    >
      <Icono className={esSm ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.25} aria-hidden />
      {etiqueta}
    </span>
  );
}
