import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CABECERA DE FICHA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Antes la cabecera eran DOS bloques a ancho completo: una franja azul de
 *  320px con el nombre pegado a la izquierda —y el 60% derecho vacío— y debajo
 *  una barra blanca con el logo solo de un lado y tres datos sueltos del otro.
 *  Entre las dos se comían ~470px de alto para decir el nombre, la localidad y
 *  el sitio web.
 *
 *  Acá va todo junto en UNA tarjeta y en tres franjas:
 *
 *    1. sellos (rubro · verificación) y el CTA de contacto, enfrentados;
 *    2. identidad —logo, nombre, ubicación, resumen y rubros— contra una
 *       columna de datos duros que es justamente lo que llenaba el vacío;
 *    3. una franja de métricas que contesta "¿esta ficha tiene algo adentro?"
 *       sin scrollear.
 *
 *  Todo lo que entra viene por props desde el Server Component: el componente
 *  no sabe de Supabase y no inventa nada. Cada fila que no tenga dato real
 *  simplemente no se pasa, y la grilla se recompone sola (`auto-fit`), así que
 *  una ficha con tres datos no queda con dos huecos.
 */

/**
 * Sello de verificación.
 *
 * Es una imagen y no un ícono de librería a pedido de Julián: el check
 * dentado de red social se reconoce al instante como "esta cuenta es la de
 * verdad", que es exactamente lo que la ficha quiere decir. Vive en
 * `public/marca/verificado.png` con fondo transparente para poder apoyarse
 * sobre el azul del hero o sobre una placa celeste. La variante industrial
 * (rueda dentada) está al lado, en `verificado-tuerca.png`.
 */
export function SelloVerificado({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Image
      src="/marca/verificado.png"
      alt=""
      width={192}
      height={192}
      className={`${className} shrink-0 object-contain`}
      aria-hidden
    />
  );
}

export type DatoCabecera = {
  icono: LucideIcon;
  etiqueta: string;
  valor: string;
  href?: string;
  /** true para sitios externos (target=_blank + rel) */
  externo?: boolean;
};

export type MetricaCabecera = {
  icono: LucideIcon;
  valor: string;
  etiqueta: string;
  /** Usa el sello de verificación en lugar del ícono de librería. */
  conSello?: boolean;
  /**
   * Ruta a un ícono ilustrado de `public/marca/`. Son los mismos que se
   * generaron para el catálogo, en versión chica y recoloreados a celeste
   * para que resalten sobre el azul: en el azul original quedaban apagados.
   * Si falta, se cae al ícono de lucide, que nunca deja el hueco vacío.
   */
  imagen?: string;
};

export type RubroCabecera = { nombre: string; href: string | null };

type Acento = "blue" | "amber";

const ACENTO = {
  blue: {
    fondo: "bg-[#00182e]",
    velo: "from-[#00182e] via-[#00213f]/92 to-[#10375c]/55",
    lateral: "from-[#00213f] via-[#00213f]/70 to-transparent",
    selloRubro: "bg-blue-500/20 border-blue-400/35 text-blue-100",
    icono: "text-blue-300",
    enlace: "text-blue-200 hover:text-white",
    chipHover: "hover:bg-white/20 hover:border-white/35",
  },
  amber: {
    fondo: "bg-[#00182e]",
    velo: "from-[#00182e] via-[#0d1a26]/92 to-[#2a2118]/55",
    lateral: "from-[#001220] via-[#001220]/70 to-transparent",
    selloRubro: "bg-[#bf7035]/25 border-[#d4894a]/40 text-[#f6d0aa]",
    icono: "text-[#e2a06a]",
    enlace: "text-[#f0c9a2] hover:text-white",
    chipHover: "hover:bg-white/20 hover:border-white/35",
  },
} as const;

interface Props {
  nombre: string;
  /** Segunda línea bajo el nombre: nombre personal del prestador, si difiere. */
  subtitulo?: string | null;
  /** Sello de rubro principal (arriba a la izquierda). */
  rubroPrincipal: string;
  /** Landing del rubro principal, si existe: el sello pasa a ser un enlace. */
  rubroPrincipalHref?: string | null;
  /** Sello de estado: "Verificado UIAB" / "Particular". */
  selloEstado: { icono: LucideIcon; texto: string; conSello?: boolean };
  logoUrl: string | null;
  /** Inicial de respaldo cuando no hay logo cargado. */
  inicial: string;
  /** `true` para prestadores: la imagen es una foto, no un logotipo. */
  logoRedondo?: boolean;
  ubicacion?: string | null;
  /**
   * Resumen corto. Es `actividad` (el rubro que trajo el padrón), no la
   * descripción larga: esa vive en "Sobre la empresa" y repetirla acá sería
   * el mismo texto dos veces en el mismo documento.
   */
  resumen?: string | null;
  /**
   * Rubros SECUNDARIOS. El principal ya se lee arriba, en el sello: pasarlo
   * también acá dejaba el mismo nombre dos veces en la misma pantalla, que es
   * lo que pasaba en las 45 fichas que tienen un solo rubro.
   */
  rubros?: RubroCabecera[];
  datos?: DatoCabecera[];
  metricas?: MetricaCabecera[];
  /** El botón de contacto: se inyecta porque es un client component. */
  cta?: React.ReactNode;
  acento?: Acento;
}

export function CabeceraFicha({
  nombre,
  subtitulo,
  rubroPrincipal,
  rubroPrincipalHref,
  selloEstado,
  logoUrl,
  inicial,
  logoRedondo = false,
  ubicacion,
  resumen,
  rubros = [],
  datos = [],
  metricas = [],
  cta,
  acento = "blue",
}: Props) {
  const c = ACENTO[acento];
  const SelloIcono = selloEstado.icono;
  // Tope de 3: con más, el "+N" caía a un segundo renglón él solo. Tres chips
  // más el contador entran en una línea al lado de la columna de datos, que es
  // como se lee en el mockup.
  const rubrosVisibles = rubros.slice(0, 3);
  const rubrosOcultos = rubros.length - rubrosVisibles.length;

  return (
    <section
      data-tour="ficha-identidad"
      className={`relative isolate overflow-hidden rounded-2xl ${c.fondo} shadow-[0_10px_40px_-12px_rgba(0,24,46,0.45)]`}
    >
      {/* Fondo. `sizes` acotado a propósito: la foto queda debajo de dos velos
          y de todo el texto, y es la candidata a LCP de las 59 fichas. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/landing/hero-industrial.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={60}
          className="object-cover object-center"
          priority
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${c.velo} mix-blend-multiply`} />
        <div className={`absolute inset-0 bg-gradient-to-r ${c.lateral}`} />
        {/* Tercer velo, sólo a la derecha: es donde caen la columna de datos y
            el CTA, y justo ahí la foto tiene cielo claro. Sin esto las
            etiquetas en blanco al 50% quedan por debajo del contraste mínimo. */}
        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-[#00182e]/75 via-[#00182e]/35 to-transparent" />
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        {/* ── 1. Sellos ──────────────────────────────────────────────────
            `sm:pr-56` reserva el hueco del CTA, que a partir de sm se ancla
            arriba a la derecha en vez de compartir esta fila. */}
        <div className="flex flex-wrap items-center gap-2 sm:pr-56">
          {rubroPrincipalHref ? (
            <Link
              href={rubroPrincipalHref}
              className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors hover:brightness-125 sm:text-[10px] ${c.selloRubro}`}
            >
              {rubroPrincipal}
            </Link>
          ) : (
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] sm:text-[10px] ${c.selloRubro}`}
            >
              {rubroPrincipal}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 py-1 pl-1.5 pr-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white sm:text-[10px]">
            {selloEstado.conSello ? (
              <SelloVerificado className="h-4 w-4" />
            ) : (
              <SelloIcono className={`h-3 w-3 ${c.icono}`} />
            )}
            {selloEstado.texto}
          </span>
        </div>

        {/* ── 2. Identidad + datos duros ─────────────────────────────────── */}
        <div className="mt-5 flex flex-col gap-6 lg:mt-6 lg:flex-row lg:items-start lg:gap-10">
          {/* En mobile el logo va ARRIBA y no al costado: al costado le comía
              100px a la columna de texto y los chips de rubro caían en una
              tira de uno por renglón contra el borde derecho. */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:gap-6">
            {/* La placa blanca no es decorativa: muchos logos están guardados
                como JPG con fondo blanco y sobre el azul dejaban un rectángulo.
                Antes se tapaba con `mix-blend-multiply`, que a cambio apagaba
                los logos con transparencia real. */}
            <div
              className={`grid shrink-0 place-items-center overflow-hidden bg-white shadow-lg shadow-black/20 ${
                logoRedondo
                  ? "h-20 w-20 rounded-full sm:h-24 sm:w-24 lg:h-32 lg:w-32"
                  : "h-20 w-20 rounded-xl p-3 sm:h-24 sm:w-24 sm:rounded-2xl sm:p-4 lg:h-36 lg:w-36 lg:p-5"
              }`}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={nombre}
                  width={280}
                  height={280}
                  className={
                    logoRedondo ? "h-full w-full object-cover" : "h-full w-full object-contain"
                  }
                />
              ) : (
                <span className="font-manrope text-3xl font-black text-[#00213f]">{inicial}</span>
              )}
            </div>

            <div className="w-full min-w-0 flex-1">
              <h1 className="font-manrope text-2xl font-black leading-[1.05] tracking-tight text-white sm:text-3xl lg:text-[2.9rem]">
                {nombre}
              </h1>

              {subtitulo && (
                <p className="mt-1 text-[15px] font-medium text-white/55">{subtitulo}</p>
              )}

              {ubicacion && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[15px] font-semibold text-white/85">
                  <MapPin className={`h-4 w-4 shrink-0 ${c.icono}`} />
                  {ubicacion}
                </p>
              )}

              {resumen && (
                <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/70">
                  {resumen}
                </p>
              )}

              {rubrosVisibles.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {rubrosVisibles.map((r) =>
                    r.href ? (
                      <Link
                        key={r.nombre}
                        href={r.href}
                        className={`inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/85 backdrop-blur-sm transition-colors ${c.chipHover}`}
                      >
                        {r.nombre}
                      </Link>
                    ) : (
                      <span
                        key={r.nombre}
                        className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/85 backdrop-blur-sm"
                      >
                        {r.nombre}
                      </span>
                    )
                  )}
                  {rubrosOcultos > 0 && (
                    <span className="text-[12px] font-semibold text-white/50">
                      +{rubrosOcultos} {rubrosOcultos === 1 ? "rubro" : "rubros"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna de datos duros: es la que llena el vacío de la derecha.
              Sólo se renderiza si hay algo real que poner.
              `sm:max-w-md`: entre 640 y 1024 la columna todavía no está al
              costado, y a lo ancho de la tarjeta la etiqueta y el valor
              quedaban en puntas opuestas con medio metro de vacío al medio. */}
          {datos.length > 0 && (
            <dl className="w-full shrink-0 border-t border-white/12 pt-5 sm:max-w-md lg:w-[19rem] lg:max-w-none lg:border-l lg:border-t-0 lg:pl-9 lg:pt-1">
              {datos.map((d) => {
                const Icono = d.icono;
                const contenido = d.href ? (
                  <a
                    href={d.href}
                    {...(d.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`font-semibold transition-colors ${c.enlace} break-words`}
                  >
                    {d.valor}
                  </a>
                ) : (
                  <span className="font-semibold text-white break-words">{d.valor}</span>
                );

                return (
                  <div
                    key={d.etiqueta}
                    className="flex items-baseline justify-between gap-4 border-b border-white/8 py-1.5 last:border-b-0"
                  >
                    <dt className="inline-flex shrink-0 items-center gap-2 text-[12.5px] text-white/50">
                      <Icono className="h-3.5 w-3.5 shrink-0" />
                      {d.etiqueta}
                    </dt>
                    <dd className="min-w-0 text-right text-[13.5px] leading-snug">{contenido}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────
            En mobile va acá, a lo ancho y DESPUÉS de los datos: arriba del
            todo quedaba un botón gigante antes de que la pantalla dijera de
            qué empresa se trata. En sm+ se ancla arriba a la derecha, que es
            donde lo pide el diseño. Un solo nodo, no dos: el modal de contacto
            es un client component y duplicarlo duplicaba el portal. */}
        {cta && (
          <div className="mt-6 sm:absolute sm:right-7 sm:top-7 sm:mt-0 lg:right-9 lg:top-9">
            {cta}
          </div>
        )}

        {/* ── 3. Franja de métricas ──────────────────────────────────────── */}
        {/* Flex y no grid: con `auto-fit` una fila incompleta —4 métricas en 3
            columnas— dejaba media franja vacía y más clara que el resto. Con
            `flex-1` las que sobran estiran y no queda hueco. El truco del
            `-ml-px -mt-px` deja los divisores entre celdas y recorta los del
            borde contra el `overflow-hidden` del contenedor. */}
        {metricas.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/12 bg-[#00182e]/70 backdrop-blur-sm">
            <div className="-ml-px -mt-px flex flex-wrap">
              {metricas.map((m) => {
                const Icono = m.icono;
                return (
                  <div
                    key={m.etiqueta}
                    className="flex min-w-[9.5rem] flex-1 items-center gap-3 border-l border-t border-white/10 px-3.5 py-3 sm:px-4 lg:justify-center"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
                      {m.conSello ? (
                        <SelloVerificado className="h-5 w-5" />
                      ) : m.imagen ? (
                        <Image
                          src={m.imagen}
                          alt=""
                          width={128}
                          height={128}
                          className="h-[18px] w-[18px] object-contain"
                          aria-hidden
                        />
                      ) : (
                        <Icono className={`h-4 w-4 ${c.icono}`} />
                      )}
                    </span>
                    {/* Sin `truncate`: en 390px "Productos y servicios" salía
                        "Productos y …", que no dice nada. Que envuelva. */}
                    <span className="min-w-0">
                      <span className="block font-manrope text-[15px] font-bold leading-tight text-white">
                        {m.valor}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-tight text-white/55">
                        {m.etiqueta}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
