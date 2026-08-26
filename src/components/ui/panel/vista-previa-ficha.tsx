import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, Building2, LayoutGrid, MapPin, Pencil } from "lucide-react";
import { ChipNorma } from "@/modulos/certificaciones/chip-norma";
import type { CertificacionChip } from "@/modulos/certificaciones/normas";
import { SelloVerificado } from "@/components/ui/directorio/sello-verificado";
import { TARJETA } from "./piezas";

/**
 * "Tu ficha en el directorio": lo que ve una empresa que te busca.
 *
 * POR QUÉ ESTÁ EN EL PANEL
 *
 * La ficha pública es el producto que la socia paga, y hasta ahora el panel no
 * la mostraba en ningún lado: para saber cómo se veía había que salir a
 * `/empresas/{slug}` — y el botón que llevaba ahí estaba roto desde siempre.
 * Sin verla, nadie se entera de que le falta el logo, ni de que su descripción
 * está vacía, ni de que sus rubros no dicen lo que hace.
 *
 * FIDELIDAD, NO "PARECIDO"
 *
 * Reusa las piezas reales de la ficha —`SelloVerificado`, `ChipNorma`, el chip
 * punteado de especialidades, la franja de métricas— y el mismo texto que sale
 * de `textoDeFicha`. Un preview dibujado aparte se desincroniza con el primer
 * cambio de la ficha y pasa a mentir sobre justo aquello que viene a mostrar.
 */

export interface VistaPreviaFichaProps {
  nombre: string;
  inicial: string;
  logoUrl: string | null;
  verificada: boolean;
  ubicacion: string | null;
  /** `descripcion || actividad`, ya normalizado. `null` si no cargó ninguna. */
  descripcion: string | null;
  rubros: string[];
  especialidades: string[];
  certificaciones: CertificacionChip[];
  totalItems: number;
  totalResenas: number;
  /** Link real a la ficha pública. `null` si el slug no se puede derivar. */
  href: string | null;
}

export function VistaPreviaFicha({
  nombre,
  inicial,
  logoUrl,
  verificada,
  ubicacion,
  descripcion,
  rubros,
  especialidades,
  certificaciones,
  totalItems,
  totalResenas,
  href,
}: VistaPreviaFichaProps) {
  // Lo que la ficha muestra vacío. Son huecos reales de la base, no consejos
  // genéricos: cada uno se corrige en una pantalla concreta.
  const faltantes: { texto: string; href: string }[] = [];
  if (!logoUrl) faltantes.push({ texto: "Falta el logo", href: "/perfil/datos" });
  if (!descripcion) faltantes.push({ texto: "Falta la descripción", href: "/perfil/datos" });
  if (rubros.length === 0) faltantes.push({ texto: "Sin rubros", href: "/perfil/servicios" });
  if (especialidades.length === 0)
    faltantes.push({ texto: "Sin especialidades", href: "/perfil/etiquetas" });
  if (totalItems === 0)
    faltantes.push({ texto: "Catálogo vacío", href: "/perfil/productos-servicios" });

  const metricas = [
    { valor: totalItems, etiqueta: totalItems === 1 ? "Producto" : "Productos" },
    { valor: rubros.length, etiqueta: rubros.length === 1 ? "Rubro" : "Rubros" },
    { valor: especialidades.length, etiqueta: "Especialidades" },
    { valor: certificaciones.length, etiqueta: "Certif." },
    { valor: totalResenas, etiqueta: totalResenas === 1 ? "Reseña" : "Reseñas" },
  ];

  return (
    <section className={TARJETA}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <LayoutGrid className="h-[18px] w-[18px] shrink-0 text-blue-500" strokeWidth={2.2} />
          <h2 className="truncate font-poppins text-[15px] font-bold tracking-tight text-[#00213f]">
            Tu ficha en el directorio
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/perfil/datos"
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-400 transition-colors hover:text-[#00213f]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
          {href && (
            <Link
              href={href}
              target="_blank"
              className="inline-flex items-center gap-0.5 whitespace-nowrap text-[12.5px] font-semibold text-[#2563eb] transition-colors hover:text-[#00213f]"
            >
              Ver pública
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* La maqueta. Mismo hero oscuro con foto y triple velo que
            `cabecera-ficha.tsx`, a escala de tarjeta. */}
        <div className="overflow-hidden rounded-xl border border-slate-200/70">
          <div className="relative isolate bg-[#00182e] px-4 py-5 sm:px-6">
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center opacity-45"
              style={{ backgroundImage: "url('/panel/textura-planta.webp')" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-[#00213f] via-[#00213f]/85 to-[#00182e]/60"
            />

            <div className="relative flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/20 sm:h-20 sm:w-20">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt=""
                    width={160}
                    height={160}
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <span className="font-poppins text-2xl font-black text-[#00213f]">{inicial}</span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {rubros[0] && (
                    <span className="inline-flex items-center rounded-md border border-blue-400/35 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100">
                      {rubros[0]}
                    </span>
                  )}
                  {verificada && <SelloVerificado size="sm" />}
                </div>

                <h3 className="font-poppins text-lg font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere] sm:text-xl">
                  {nombre}
                </h3>

                {ubicacion && (
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-white/55">
                    <MapPin className="h-3 w-3 text-blue-300" />
                    {ubicacion}
                  </p>
                )}
              </div>
            </div>

            {/* Franja de métricas, igual que en la ficha. Todos los números
                salen de la base: si no hay nada cargado, dicen cero. */}
            <div className="relative mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-3.5">
              {metricas.map((m) => (
                <div key={m.etiqueta} className="flex items-baseline gap-1.5">
                  <span className="font-poppins text-[15px] font-black tabular-nums text-white">
                    {m.valor}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    {m.etiqueta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 bg-white px-4 py-4 sm:px-5">
            {descripcion ? (
              <p className="line-clamp-3 text-[13px] leading-relaxed text-slate-600">
                {descripcion}
              </p>
            ) : (
              <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] italic text-slate-400">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                Tu ficha no muestra ninguna descripción todavía.
              </p>
            )}

            {especialidades.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {especialidades.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
                {especialidades.length > 6 && (
                  <span className="inline-flex items-center px-1 py-1 text-[11.5px] font-semibold text-slate-400">
                    +{especialidades.length - 6}
                  </span>
                )}
              </div>
            )}

            {certificaciones.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {certificaciones.slice(0, 4).map((cert) => (
                  <ChipNorma
                    key={cert.codigo + cert.etiqueta}
                    etiqueta={cert.etiqueta}
                    familia={cert.familia}
                  />
                ))}
                {certificaciones.length > 4 && (
                  <span className="inline-flex items-center px-1 text-[11px] font-semibold text-slate-400">
                    +{certificaciones.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {faltantes.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">
              <AlertCircle className="h-3.5 w-3.5" />
              Esto se ve vacío en tu ficha
            </p>
            <div className="flex flex-wrap gap-1.5">
              {faltantes.map((f) => (
                <Link
                  key={f.texto}
                  href={f.href}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200/80 bg-white px-2.5 py-1 text-[12px] font-semibold text-amber-900 transition-colors hover:border-amber-300 hover:bg-amber-50"
                >
                  {f.texto}
                  <ArrowUpRight className="h-3 w-3 text-amber-500" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
