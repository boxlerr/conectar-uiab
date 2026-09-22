import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { fechaLegible, rutaComunicado, tiempoCorto } from "../formato";
import type { ComunicadoPublico } from "../tipos";

/**
 * Quién publica y cuándo: avatar, "UIAB" con el verificado y "hace 22 h".
 * Lo comparten la publicación del feed y el visor de fotos.
 */
export function EncabezadoPublicacion({
  c,
  acciones,
  alSeguirLink,
}: {
  c: ComunicadoPublico;
  /** Lo que va a la derecha (el menú ··· del admin). */
  acciones?: React.ReactNode;
  /** Se llama al tocar la hora (el visor lo usa para cerrarse antes de navegar). */
  alSeguirLink?: () => void;
}) {
  return (
    <header className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
        <Image src="/icono-uiab.svg" alt="" width={30} height={30} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1">
          <span className="font-poppins text-[15px] font-bold text-[#00213f]">UIAB</span>
          <BadgeCheck className="h-4 w-4 fill-sky-500 text-white" aria-label="Cuenta oficial" />
        </div>
        <div className="mt-0.5 text-[12.5px] text-slate-500">
          <span className="hidden sm:inline">Unión Industrial de Almirante Brown · </span>
          <Link
            href={rutaComunicado(c)}
            onClick={alSeguirLink}
            className="hover:underline"
            title={fechaLegible(c.publicado_en)}
          >
            <time dateTime={c.publicado_en ?? undefined} suppressHydrationWarning>
              {tiempoCorto(c.publicado_en)}
            </time>
          </Link>
        </div>
      </div>
      {acciones}
    </header>
  );
}
