import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Eye,
  Globe,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MenuHero } from "./menu-hero";

/**
 * Cabecera del panel: quién sos dentro de la red.
 *
 * Es lo primero que se ve al entrar, así que carga con el trabajo de contestar
 * de un vistazo tres cosas: cómo te ves (logo y nombre), si estás verificada, y
 * qué tan completa está tu ficha.
 *
 * Las acciones siguen el mockup: la primaria (Editar Datos) sólida, la
 * secundaria (Ver ficha pública) en vidrio, y todo lo demás detrás del menú de
 * los tres puntos, para que no haya seis botones peleando por atención.
 */

export interface HeroPanelProps {
  displayName: string;
  logoUrl: string | null;
  tipoEtiqueta: string;
  verificada: boolean;
  gestionadoPor: string | null;
  /** `entidad.creado_en`. Se muestra como "Miembro desde DD/MM/AAAA". */
  miembroDesde: string | null;
  contacto: {
    email?: string | null;
    localidad?: string | null;
    sitioWeb?: string | null;
    telefono?: string | null;
  };
  /** Link a la ficha pública. `null` si el slug no se puede derivar. */
  hrefFicha: string | null;
  completitud: number;
  /** Entradas extra del menú `⋮`, ya filtradas por rol. */
  menu: { href: string; label: string }[];
}

function fechaAlta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function HeroPanel({
  displayName,
  logoUrl,
  tipoEtiqueta,
  verificada,
  gestionadoPor,
  miembroDesde,
  contacto,
  hrefFicha,
  completitud,
  menu,
}: HeroPanelProps) {
  const chips = [
    contacto.email && { icono: Mail, texto: contacto.email },
    contacto.localidad && { icono: MapPin, texto: contacto.localidad },
    contacto.sitioWeb && {
      icono: Globe,
      texto: contacto.sitioWeb.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    },
    contacto.telefono && { icono: Phone, texto: contacto.telefono },
  ].filter(Boolean) as { icono: typeof Mail; texto: string }[];

  return (
    <header
      data-tour="dash-hero"
      className="relative z-20 animate-in rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,33,63,0.4)] ring-1 ring-white/5 duration-700 fade-in slide-in-from-bottom-3 [animation-fill-mode:both]"
    >
      {/* EL RECORTE VA ACÁ Y NO EN EL <header>.
          Con `overflow-hidden` en el header, el desplegable del menú `⋮` —que
          es un hijo posicionado— quedaba cortado al ras del borde de abajo y la
          última opción no se podía ni leer ni tocar. Las decoraciones sí
          necesitan el recorte para respetar las esquinas redondeadas, así que
          se llevan a su propia capa. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00182f] via-[#042848] to-[#0c3260]" />
      {/* La foto va de background-image y no con next/image a propósito: React
          19 le mete un <link rel=preload> por cada next/image y esto es puro
          decorado. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: "url('/panel/textura-planta.webp')" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#00182f] via-[#042848]/88 to-[#0c3260]/65"
      />

      {/* Líneas de flujo de la derecha: las mismas curvas del mockup. Se cortan
          abajo de lg, donde los botones ya ocupan ese lado. */}
      <svg
        aria-hidden
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[55%] lg:block"
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M ${620 - i * 26} -20 C ${430 - i * 30} ${90 + i * 12}, ${470 - i * 24} ${230 - i * 8}, ${250 - i * 34} 420`}
            fill="none"
            stroke="rgba(125,190,255,0.5)"
            strokeWidth="1"
            opacity={0.13 - i * 0.012}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 right-10 h-[440px] w-[440px] rounded-full bg-sky-400/12 blur-[100px]"
      />
      </div>

      <div className="relative px-5 py-7 sm:px-8 sm:py-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-6">
            <Link href="/perfil/datos" className="group relative shrink-0" aria-label="Editar logo">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 opacity-50 blur-sm transition-opacity duration-300 group-hover:opacity-95" />
              <div className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-1 ring-white/20 sm:h-24 sm:w-24">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt=""
                    width={120}
                    height={120}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="font-poppins text-3xl font-black text-[#00213f] sm:text-4xl">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-[#001c38]/70 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              {verificada && (
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 shadow-lg ring-[3px] ring-[#042848]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#003020]" strokeWidth={2.5} />
                </span>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {tipoEtiqueta}
                </span>
                {verificada && (
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Verificado
                  </span>
                )}
              </div>

              {/* break-words en vez de truncate: el nombre salía cortado con
                  puntos suspensivos en iPhone. */}
              <h1 className="break-words font-poppins text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-[32px] lg:text-[36px]">
                {displayName}
              </h1>

              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-white/40">
                {gestionadoPor && (
                  <span>
                    Gestionado por{" "}
                    <span className="font-semibold text-white/70">{gestionadoPor}</span>
                  </span>
                )}
                {gestionadoPor && miembroDesde && (
                  <span aria-hidden className="text-white/20">
                    |
                  </span>
                )}
                {miembroDesde && (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-sky-400" />
                    Miembro desde{" "}
                    <span className="font-semibold text-white/70">{fechaAlta(miembroDesde)}</span>
                  </span>
                )}
              </p>

              {chips.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {chips.map((c) => (
                    <span
                      key={c.texto}
                      className="inline-flex max-w-[240px] items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.07] px-2.5 py-1 text-[11.5px] font-medium text-white/65"
                    >
                      <c.icono className="h-3 w-3 shrink-0 text-sky-400" />
                      <span className="truncate">{c.texto}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 lg:w-auto">
            <Link
              href="/perfil/datos"
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-[#1d4ed8] lg:flex-none"
            >
              <Settings className="h-4 w-4" /> Editar Datos
            </Link>
            {hrefFicha && (
              <Link
                href={hrefFicha}
                target="_blank"
                className="hidden flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-[13.5px] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/[0.18] sm:inline-flex lg:flex-none"
              >
                <Eye className="h-4 w-4" /> Ver ficha pública
              </Link>
            )}
            <MenuHero entradas={menu} hrefFicha={hrefFicha} />
          </div>
        </div>

        {completitud < 100 && (
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Completitud del perfil
              </span>
              <span className="text-[11.5px] font-bold tabular-nums text-sky-300">
                {completitud}% <span className="font-medium text-white/40">completo</span>
              </span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 transition-all duration-1000"
                style={{ width: `${completitud}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
