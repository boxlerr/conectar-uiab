import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Megaphone, Pin } from "lucide-react";
import { resumenComunicado, rutaComunicado, tiempoCorto } from "../formato";
import type { ComunicadoPublico } from "../tipos";

/**
 * Las columnas laterales del Boletín.
 *
 * POR QUÉ EXISTEN
 *
 * El boletín era una sola columna de 640px centrada: en un monitor quedaban
 * 400px de blanco de cada lado y la página se leía como un borrador. Estas
 * tarjetas ocupan ese costado con lo único que corresponde poner ahí —qué es
 * esto, qué más hay para leer y a dónde seguir—, que además es enlazado
 * interno hacia otras notas y hacia el directorio.
 *
 * Regla para lo que se agregue acá: nada de widgets de relleno. No hay "más
 * leídas" porque no hay métricas de lectura (sólo `visitas_perfil` tiene datos
 * reales), y no se inventa una cadencia de publicación que nadie garantiza.
 */

export function TarjetaQueEs() {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Megaphone className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
        <h2 className="font-poppins text-[14px] font-bold tracking-tight text-[#00213f]">
          Qué es el Boletín
        </h2>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
        Las novedades oficiales de la Unión Industrial de Almirante Brown:
        avisos, convocatorias, capacitaciones y lo que pasa en el entramado
        productivo del partido. Lo escribe y lo publica el equipo de la UIAB.
      </p>
      <Link
        href="/nosotros"
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-sky-700 hover:text-sky-900"
      >
        Qué es UIAB Conecta
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

/**
 * Otras notas, en lista compacta. Es la pieza de enlazado interno del boletín:
 * cada nota queda a un click de las demás, y no hay callejones sin salida.
 */
export function ListaNovedades({
  comunicados,
  titulo = "Más novedades",
  conFoto = true,
}: {
  comunicados: ComunicadoPublico[];
  titulo?: string;
  conFoto?: boolean;
}) {
  if (comunicados.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
      <h2 className="border-b border-slate-100 px-5 py-3.5 font-poppins text-[14px] font-bold tracking-tight text-[#00213f]">
        {titulo}
      </h2>
      <div className="divide-y divide-slate-100">
        {comunicados.map((c) => (
          <Link
            key={c.id}
            href={rutaComunicado(c)}
            className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
          >
            {conFoto && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {c.imagenUrl ? (
                  <Image src={c.imagenUrl} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-300">
                    <Megaphone className="h-4 w-4" />
                  </span>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-slate-800 group-hover:text-sky-800">
                {resumenComunicado(c)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-400" suppressHydrationWarning>
                {c.fijado && <Pin className="h-3 w-3 text-sky-500" />}
                {tiempoCorto(c.publicado_en)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * A dónde sigue quien terminó de leer. Cambia según quién mira: al visitante se
 * le ofrece la puerta de entrada real (/sumate); a la socia, el directorio.
 */
export function TarjetaSiguiente({ haySesion }: { haySesion: boolean }) {
  if (haySesion) {
    return (
      <section className="rounded-2xl border border-slate-200/70 bg-white p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f5f8] text-[#00213f]">
            <BookOpen className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <h2 className="font-poppins text-[14px] font-bold tracking-tight text-[#00213f]">
            Directorio UIAB
          </h2>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          Buscá un proveedor dentro de la red: empresas socias, prestadores,
          entidades financieras y educativas de Almirante Brown.
        </p>
        <Link
          href="/directorio"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#00213f] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#003366]"
        >
          Ir al directorio
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#00213f]/10 bg-gradient-to-br from-[#00213f] to-[#003a6b] p-5 text-white">
      <h2 className="font-poppins text-[15px] font-bold tracking-tight">
        Sumate a la red UIAB
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/70">
        Las empresas de Almirante Brown publican su ficha, reciben pedidos de
        presupuesto y contactan proveedores del partido sin intermediarios.
      </p>
      <Link
        href="/sumate"
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-[#00213f] transition-colors hover:bg-slate-100"
      >
        Quiero sumarme
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <Link
        href="/directorio"
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-[13px] font-bold text-white/90 transition-colors hover:bg-white/10"
      >
        Ver el directorio
      </Link>
    </section>
  );
}
