import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Eye,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { GraficoVisitas } from "./graficos";
import { TARJETA } from "./piezas";
import { etiquetaDia, type EstadisticasVisitas } from "@/modulos/visitas/estadisticas";

/**
 * Estadísticas de visibilidad de la ficha.
 *
 * TODO ACÁ ES UN CONTEO REAL de `visitas_perfil`. Es, de hecho, la única
 * métrica de la plataforma con datos: reseñas, matches, solicitudes y
 * oportunidades están en cero en producción, así que dibujarles una tendencia
 * sería inventarla. Por eso el gráfico es uno solo y es el de visitas.
 *
 * DOS ACLARACIONES QUE LA TARJETA HACE EXPLÍCITAS
 *
 * 1. Una visita del propio dueño no cuenta, y a la misma persona logueada no se
 *    la vuelve a contar dentro de las 6 horas. Al visitante sin sesión sí se lo
 *    cuenta cada vez que abre la ficha, así que el número es un techo, no un
 *    conteo de personas distintas. Decirlo evita que alguien lea "128" como
 *    "128 empresas me miraron".
 * 2. Si el período anterior fue cero no hay porcentaje: se muestra el número
 *    pelado en vez de un "+100%" apoyado en una base que no existió.
 */

interface TarjetaEstadisticasProps {
  stats: EstadisticasVisitas;
  /** Link a la ficha pública, para el estado vacío. `null` si no hay slug. */
  hrefFicha: string | null;
}

export function TarjetaEstadisticas({ stats, hrefFicha }: TarjetaEstadisticasProps) {
  const hayDatos = stats.total > 0;

  return (
    <section className={`flex h-full flex-col ${TARJETA}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <BarChart3 className="h-[18px] w-[18px] shrink-0 text-[#2563eb]" strokeWidth={2.2} />
          <h2 className="truncate font-poppins text-[15px] font-bold tracking-tight text-[#00213f]">
            Estadísticas de visibilidad
          </h2>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-lg bg-[#f2f5f8] px-2.5 py-1 text-[11.5px] font-semibold text-slate-500">
          Últimos 30 días
        </span>
      </div>

      {hayDatos ? (
        <div className="flex-1 p-5 sm:p-6">
          {/* Métricas a la izquierda, gráfico a la derecha — el split del
              mockup. Debajo de lg se apilan: en una columna de 190px el
              gráfico no dice nada. */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,190px)_minmax(0,1fr)] lg:gap-7">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-6">
              <Metrica
                icono={Eye}
                tono="bg-violet-50 text-violet-500"
                etiqueta="Visitas a tu ficha"
                valor={stats.ultimos30}
                variacion={stats.variacion}
                nota={stats.variacion === null ? "Sin registro el mes anterior" : undefined}
              />
              <Metrica
                icono={UserCheck}
                tono="bg-sky-50 text-sky-500"
                etiqueta="Socias identificadas"
                valor={stats.identificadas30}
                nota="Entraron con su cuenta"
              />
              <Metrica
                icono={UsersRound}
                tono="bg-slate-100 text-slate-400"
                etiqueta="Visitas sin sesión"
                valor={stats.anonimas30}
                nota="No se puede saber quién"
              />
            </div>

            <div className="min-w-0">
              <GraficoVisitas serie={stats.serie} />
              {stats.pico && (
                <p className="mt-3 text-[11.5px] text-slate-400">
                  Día de más tráfico:{" "}
                  <span className="font-semibold text-slate-500">
                    {stats.pico.visitas} {stats.pico.visitas === 1 ? "visita" : "visitas"} el{" "}
                    {etiquetaDia(stats.pico.dia)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 border-t border-slate-100 pt-4 text-[11.5px] leading-relaxed text-slate-400">
            Se cuentan las aperturas de tu ficha pública. No se cuentan las tuyas ni las de tu
            equipo, y a una misma socia no se la vuelve a contar dentro de las 6 horas. Las visitas
            sin sesión no se pueden agrupar por persona.{" "}
            <span className="font-semibold text-slate-500">
              Total histórico: {stats.total.toLocaleString("es-AR")}.
            </span>
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <Image
            src="/panel/ilustracion-estadisticas.webp"
            alt=""
            width={220}
            height={220}
            className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-200/70"
            aria-hidden
          />
          <p className="mt-4 font-poppins text-[15px] font-bold text-[#00213f]">
            Todavía no registramos visitas a tu ficha
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-400">
            Se empiezan a contar cuando alguien abre tu página del directorio. Cuanto más completa
            esté —logo, descripción, rubros y productos—, más arriba aparecés cuando buscan lo que
            hacés.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/perfil/datos"
              className="inline-flex items-center gap-1 text-[13px] font-bold text-[#00213f] transition-colors hover:text-[#2563eb]"
            >
              Completar mi ficha
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {hrefFicha && (
              <Link
                href={hrefFicha}
                target="_blank"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-400 transition-colors hover:text-[#00213f]"
              >
                Ver cómo se ve hoy
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Metrica({
  icono: Icono,
  tono,
  etiqueta,
  valor,
  variacion,
  nota,
}: {
  icono: LucideIcon;
  tono: string;
  etiqueta: string;
  valor: number;
  variacion?: number | null;
  nota?: string;
}) {
  const sube = (variacion ?? 0) >= 0;

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tono}`}>
          <Icono className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 text-[12px] font-semibold leading-tight text-slate-500">
          {etiqueta}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-poppins text-[26px] font-black leading-none tabular-nums tracking-tight text-[#00213f]">
          {valor.toLocaleString("es-AR")}
        </span>
        {variacion !== null && variacion !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11.5px] font-black tabular-nums ${
              sube ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {sube ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {sube ? "+" : ""}
            {variacion}%
          </span>
        )}
      </div>
      {nota && <p className="mt-1 text-[11px] leading-snug text-slate-400">{nota}</p>}
    </div>
  );
}
