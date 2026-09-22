import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, ShieldCheck, Search, Handshake, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import { obtenerDirectorio } from "@/app/directorio/datos";
import { RUBROS_SEO } from "@/lib/datos/rubros-seo";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { Migas } from "@/components/ui/migas";
import { ID_ORG_CONECTA, ID_ORG_UIAB, SITE_URL } from "@/lib/seo/entidad";
import { ogPorRuta } from "@/lib/seo/og";

/**
 * La página que contesta "qué es UIAB Conecta".
 *
 * Antes esta URL era un 404 — y estaba enlazada desde el nav global, o sea
 * desde las 64 páginas del sitio, apuntando a uiab.org. No existía NINGUNA URL
 * cuyo propósito fuera definir la plataforma, que es literalmente lo que busca
 * quien tipea la marca en Google.
 *
 * Es también la página que conviene enlazar desde uiab.org, LinkedIn y las
 * fichas de terceros: un enlace entrante rinde más contra una página que
 * explica la entidad que contra un listado.
 *
 * Ojo con el H1: tiene que contener la marca literal. Es, junto al de la home,
 * el único H1 del sitio que la nombra.
 *
 * ── Sobre el diseño ──────────────────────────────────────────────────────
 * Las dos marcas están puestas a propósito y no como adorno: la pregunta que
 * trae a alguien acá es "¿qué es esto y qué tiene que ver con la UIAB?". Verlo
 * —el isologo de la cámara y el de la plataforma, juntos y rotulados— contesta
 * eso antes que cualquier párrafo. Por eso aparecen en los tres lugares donde
 * se cuenta la relación: la placa del hero, el cotejo uiab.org / uiabconecta.com
 * y la ficha institucional de la columna.
 *
 * La página es un Server Component y no usa framer-motion: sin JS de por medio
 * no hay forma de que "reducir movimiento" la deje en opacity:0, que es el
 * gotcha que ya nos comimos en la home y en la sección de precio.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  // El layout raíz agrega " | UIAB Conecta" por template: no lo repitas.
  title: "Qué es UIAB Conecta",
  description:
    "Qué es UIAB Conecta, cómo se verifica cada ficha y en qué se diferencia del listado institucional de uiab.org: el directorio B2B oficial de la UIAB.",
  alternates: { canonical: "/nosotros" },
  ...ogPorRuta(
    "Qué es UIAB Conecta",
    "El directorio comercial B2B oficial de la Unión Industrial de Almirante Brown. Cómo funciona y quiénes lo integran.",
    "/nosotros"
  ),
};

const PREGUNTAS = [
  {
    q: "¿Qué es UIAB Conecta?",
    a: "Es el directorio comercial B2B de la Unión Industrial de Almirante Brown. Reúne en un solo lugar a las empresas socias de la cámara junto a prestadores de productos y servicios, entidades financieras y educativas y cooperativas, con su actividad, sus rubros, sus certificaciones y su contacto directo.",
  },
  {
    // Google desambigua una sigla por co-ocurrencia de su forma expandida.
    // "UIAB" es indistinguible de "IAB" para el corrector ortográfico mientras
    // no haya texto que diga qué significa; esta respuesta deja la expansión
    // completa + partido + provincia + país en el único lugar del sitio cuyo
    // propósito declarado es definir la entidad.
    q: "¿Qué significa UIAB?",
    a: "UIAB es la sigla de Unión Industrial de Almirante Brown, la cámara empresaria que nuclea a las industrias del partido de Almirante Brown, en la provincia de Buenos Aires, Argentina, con sede en Burzaco. UIAB Conecta es su directorio comercial B2B.",
  },
  {
    q: "¿Qué diferencia hay con el sitio de la UIAB?",
    a: "uiab.org es el sitio institucional de la cámara: su historia, su comisión directiva, sus novedades y su listado de asociadas. UIAB Conecta es la herramienta comercial: un buscador por rubro, etiqueta y localidad, fichas con catálogo de productos y servicios, y una cartelera de oportunidades donde las socias publican lo que necesitan comprar o contratar.",
  },
  {
    q: "¿Cómo se verifica una empresa?",
    a: "Cada alta se contrasta contra el padrón de socias de la UIAB por CUIT antes de publicarse. Ninguna ficha del directorio se crea sola: hay una aprobación de por medio, y por eso las fichas llevan la marca de empresa socia verificada.",
  },
  {
    q: "¿Quién puede sumarse?",
    a: "Empresas e industrias radicadas en el partido de Almirante Brown, y prestadores de productos y servicios que trabajen con ellas. Las empresas ya socias de la UIAB no pagan por estar en el directorio. El alta arranca en la página de sumate.",
  },
  {
    q: "¿Hay que pagar para consultar el directorio?",
    a: "No. El directorio y las fichas de las empresas son públicos y se consultan sin cuenta. Lo que requiere membresía es el listado completo con filtros avanzados, publicar oportunidades y contactar desde la plataforma.",
  },
];

/**
 * Bloque de texto con índice editorial.
 *
 * El número no es decoración: esta página tiene tres afirmaciones en fila
 * (para qué existe / en qué se diferencia / cómo se verifica) y sin un ancla
 * visual se leían como un solo muro gris.
 */
function Seccion({
  n,
  titulo,
  id,
  children,
}: {
  n: string;
  titulo: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-28">
      <div className="flex items-center gap-4">
        <span className="font-manrope text-[11px] font-black tracking-[0.22em] text-primary-600">
          {n}
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
      </div>
      <h2
        id={id}
        className="mt-4 font-manrope text-[26px] lg:text-[30px] font-black text-[#00213f] tracking-[-0.025em] text-balance"
      >
        {titulo}
      </h2>
      <div className="mt-5 space-y-4 text-[15.5px] leading-[1.75] text-slate-600">{children}</div>
    </section>
  );
}

export default async function NosotrosPage() {
  const { entidades } = await obtenerDirectorio();
  const socias = entidades.filter((e) => !esEmpresaInstitucional(e.id));
  const localidades = Array.from(
    new Set(socias.map((e) => e.ubicacion?.split(",")[0]?.trim()).filter(Boolean))
  );

  /**
   * Las cifras salen de la base y bajan como expresión, nunca como literal.
   * Un número escrito a mano en esta página es una afirmación sobre el padrón
   * de una cámara empresaria, y ya nos pasó tres veces: lo cuida
   * src/tests/seo/sin-datos-inventados.test.ts.
   *
   * Y por el otro lado: si la base NO contesta —pasa, el cliente de servidor
   * aborta a los 8s— `socias` llega vacío y el conteo da cero. "0 empresas
   * verificadas", en tipografía grande y en la página que define la entidad,
   * es una afirmación falsa sobre el padrón: exactamente lo que este archivo
   * dice más arriba que no se hace. Con la base caída la cifra no se muestra.
   */
  const hayPadron = socias.length > 0;

  const CIFRAS: { dato: string; rotulo: string }[] = [];
  if (hayPadron) {
    CIFRAS.push({ dato: String(socias.length), rotulo: "Empresas y prestadores verificados" });
  }
  CIFRAS.push({ dato: String(RUBROS_SEO.length), rotulo: "Rubros industriales" });
  if (localidades.length > 0) {
    CIFRAS.push({ dato: String(localidades.length), rotulo: "Localidades del conurbano sur" });
  }

  /**
   * AboutPage + FAQPage. Las preguntas se renderizan visibles más abajo: el
   * FAQPage sólo es legítimo si el usuario ve las mismas preguntas y respuestas
   * que declara el marcado.
   *
   * No se crea ningún Organization nuevo acá: se cita por @id el que ya emite
   * el layout raíz en el mismo documento.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${SITE_URL}/nosotros#pagina`,
        url: `${SITE_URL}/nosotros`,
        name: "Qué es UIAB Conecta",
        inLanguage: "es-AR",
        about: { "@id": ID_ORG_CONECTA },
        publisher: { "@id": ID_ORG_CONECTA },
        /**
         * `mainEntity` apunta al DIRECTORIO, no a la cámara.
         *
         * Mientras dijo `ID_ORG_UIAB` esta página declaraba que
         * uiabconecta.com/nosotros describe primariamente a la Unión
         * Industrial — el mismo error de identidad que entidad.ts documenta
         * haber matado en el layout, sobreviviendo en el último lugar del
         * sitio. Y es justo la página a la que apuntan los backlinks que
         * queremos conseguir: no puede regalar la entidad que viene a fijar.
         *
         * La cámara sigue nombrada, pero como `mentions`: la cita sin cederle
         * el sujeto de la página.
         */
        mainEntity: { "@id": ID_ORG_CONECTA },
        mentions: { "@id": ID_ORG_UIAB },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/nosotros#faq`,
        mainEntity: PREGUNTAS.map((p) => ({
          "@type": "Question",
          name: p.q,
          acceptedAnswer: { "@type": "Answer", text: p.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-svh bg-[#f7f9fb]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          HERO — el claim a la izquierda, la placa de marcas a la derecha.
          El -mt/pt es el canon del sitio: el header es fijo y el hero pasa
          por debajo. No lo toques sin mirar la altura real de la barra.
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#00213f] -mt-16 lg:-mt-20 pt-16 lg:pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00182e] via-[#00213f] to-[#10375c]" />
        {/* Trama de puntos: la misma textura que la home, a la misma opacidad. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-24 w-[560px] h-[560px] rounded-full bg-primary-500/15 blur-[130px]"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 lg:pt-16 lg:pb-36">
          <Migas
            tono="claro"
            className="mb-8"
            migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Nosotros" }]}
          />

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-300" aria-hidden />
                Plataforma oficial de la cámara
              </p>

              <h1 className="mt-6 font-manrope text-[2.25rem] sm:text-5xl lg:text-[3.5rem] font-black text-white tracking-[-0.03em] leading-[1.03]">
                Qué es{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-blue-300">
                  UIAB Conecta
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-[16.5px] leading-[1.7] text-white/70">
                UIAB Conecta es el directorio comercial B2B de la Unión Industrial de Almirante
                Brown. Es la plataforma oficial de la cámara: acá está, en un solo lugar y con
                buscador, el entramado productivo del partido.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/directorio"
                  className="inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 font-bold text-[14px] text-[#00213f] transition-colors hover:bg-primary-50"
                >
                  Ver el directorio
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </Link>
                <Link
                  href="/sumate"
                  className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-5 py-3 font-bold text-[14px] text-white transition-colors hover:bg-white/10"
                >
                  Sumate al directorio
                </Link>
              </div>
            </div>

            {/* ── La placa ──────────────────────────────────────────────
                Las dos marcas, rotuladas y en orden de pertenencia. Es la
                respuesta visual a "¿esto es la UIAB o es otra cosa?".
               ────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-7 sm:p-8 backdrop-blur-sm shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
                <div
                  aria-hidden
                  className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-primary-300/50 to-transparent"
                />

                <Image
                  src="/logo-uiab-conecta.svg"
                  alt="UIAB Conecta"
                  width={189}
                  height={36}
                  className="h-11 sm:h-12 w-auto object-contain object-left brightness-0 invert"
                  priority
                />
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-200/70">
                  Directorio comercial B2B
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
                  uiabconecta.com — el buscador de empresas, el catálogo y la cartelera de
                  oportunidades.
                </p>

                <div aria-hidden className="my-7 h-px bg-white/10" />

                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Una plataforma de
                </p>
                <Image
                  src="/logo-uiab-original.svg"
                  alt="Unión Industrial de Almirante Brown"
                  width={400}
                  height={182}
                  className="mt-4 h-12 sm:h-14 w-auto object-contain object-left brightness-0 invert opacity-90"
                />
                <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-white/55">
                  <MapPin className="w-3.5 h-3.5 mt-[3px] shrink-0 text-white/35" aria-hidden />
                  Luis María Drago 1951, Burzaco, Almirante Brown, Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Cifras — pisan la costura entre el hero y el cuerpo ═══
          Los números se derivan de la base arriba; acá sólo se muestran. */}
      {hayPadron && (
      <div className="relative z-10 -mt-16 lg:-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <dl
          className={`grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-200/80 shadow-[0_20px_50px_-28px_rgba(0,33,63,0.45)] ${
            CIFRAS.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {CIFRAS.map(({ dato, rotulo }) => (
            <div key={rotulo} className="bg-white px-6 py-6 sm:py-7">
              <dt className="sr-only">{rotulo}</dt>
              <dd>
                <span className="block font-manrope text-[34px] lg:text-[40px] font-black leading-none tracking-[-0.03em] text-[#00213f]">
                  {dato}
                </span>
                <span className="mt-2.5 block text-[12.5px] font-semibold uppercase tracking-[0.1em] leading-snug text-slate-500">
                  {rotulo}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-8 space-y-14">
            <Seccion n="01" id="para-que-existe" titulo="Para qué existe">
              <p>
                La Unión Industrial de Almirante Brown representa al sector productivo del partido
                desde su sede de Burzaco. Durante años su listado de asociadas vivió como una
                página institucional: servía para saber quiénes eran, pero no para encontrar un
                proveedor. UIAB Conecta nació para resolver eso — que una empresa de Almirante
                Brown pueda encontrar a otra empresa de Almirante Brown sin salir del partido, y
                sin pasar por un intermediario que cobra comisión.
              </p>
              <p>
                {hayPadron && (
                  <>
                    Hoy el directorio reúne {socias.length} empresas y prestadores verificados
                    {localidades.length > 0 && <> de {localidades.join(", ")}</>}.{" "}
                  </>
                )}
                Las fichas se agrupan en{" "}
                <Link href="/rubros" className="font-semibold text-primary-600 hover:underline">
                  {RUBROS_SEO.length} rubros industriales
                </Link>
                : metalúrgica y metalmecánica, química, construcción, packaging, plásticos,
                gráfica, automatización y electricidad, pinturas, autopartes, informática
                industrial, ingeniería, seguridad e higiene y alimentos.
              </p>
            </Seccion>

            <Seccion
              n="02"
              id="diferencia"
              titulo="En qué se diferencia del sitio institucional"
            >
              <p>
                Son dos cosas distintas y complementarias.{" "}
                <a
                  href="https://www.uiab.org"
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-primary-600 hover:underline"
                >
                  uiab.org
                </a>{" "}
                es el sitio institucional de la cámara: su historia, su comisión directiva, sus
                novedades y sus servicios a las socias. UIAB Conecta es la herramienta comercial
                que la cámara pone a disposición de esas mismas empresas: buscador por rubro,
                etiqueta y localidad, fichas con catálogo de productos y servicios, certificaciones
                y normas declaradas, y una cartelera de oportunidades donde las socias publican lo
                que necesitan comprar o contratar.
              </p>

              {/* El cotejo. Cada marca con su dominio y su trabajo, una al lado
                  de la otra: es la forma más rápida de entender que no compiten. */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <a
                  href="https://www.uiab.org"
                  target="_blank"
                  rel="noopener"
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="flex h-14 items-center">
                    <Image
                      src="/logo-uiab-original.svg"
                      alt="Unión Industrial de Almirante Brown"
                      width={400}
                      height={182}
                      className="h-12 w-auto object-contain object-left"
                    />
                  </div>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    La cámara
                  </p>
                  <p className="mt-1.5 font-manrope text-[17px] font-black text-[#00213f]">
                    uiab.org
                  </p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                    Historia, comisión directiva, novedades y servicios a las socias.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-600">
                    Sitio institucional
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </a>

                <Link
                  href="/directorio"
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-[#00213f] bg-[#00213f] p-6 transition-all hover:shadow-xl"
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]"
                  />
                  <div className="relative flex h-14 items-center">
                    <Image
                      src="/logo-uiab-conecta.svg"
                      alt="UIAB Conecta"
                      width={189}
                      height={36}
                      className="h-9 w-auto object-contain object-left brightness-0 invert"
                    />
                  </div>
                  <p className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-200/70">
                    El directorio
                  </p>
                  <p className="relative mt-1.5 font-manrope text-[17px] font-black text-white">
                    uiabconecta.com
                  </p>
                  <p className="relative mt-2 text-[13.5px] leading-relaxed text-white/65">
                    Buscador por rubro, fichas con catálogo y cartelera de oportunidades.
                  </p>
                  <span className="relative mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-200">
                    Ver el directorio
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </div>
            </Seccion>

            <Seccion n="03" id="verificacion" titulo="Cómo se verifica cada ficha">
              <p>
                Ninguna ficha se publica sola. Cada alta se contrasta por CUIT contra el padrón de
                socias de la UIAB y pasa por una aprobación antes de aparecer en el directorio. Esa
                es la diferencia con un listado abierto: si una ficha dice “empresa socia
                verificada”, es porque la cámara la reconoce como tal. Las socias además cargan sus
                propias etiquetas, su catálogo y sus certificaciones, que quedan visibles en la
                ficha pública.
              </p>
            </Seccion>

            <section aria-labelledby="faq" className="scroll-mt-28">
              <div className="flex items-center gap-4">
                <span className="font-manrope text-[11px] font-black tracking-[0.22em] text-primary-600">
                  04
                </span>
                <span
                  aria-hidden
                  className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent"
                />
              </div>
              <h2
                id="faq"
                className="mt-4 font-manrope text-[26px] lg:text-[30px] font-black text-[#00213f] tracking-[-0.025em]"
              >
                Preguntas frecuentes
              </h2>

              {/* Visibles y abiertas, no en un acordeón: el FAQPage del JSON-LD
                  sólo es legítimo si el usuario lee exactamente esto. */}
              <dl className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {PREGUNTAS.map((p, i) => (
                  <div
                    key={p.q}
                    className={`p-6 sm:p-7 ${i > 0 ? "border-t border-slate-100" : ""}`}
                  >
                    <dt className="flex gap-3 font-manrope text-[15.5px] font-black leading-snug text-[#00213f]">
                      <span
                        aria-hidden
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
                      />
                      {p.q}
                    </dt>
                    <dd className="mt-2.5 pl-[18px] text-[14.5px] leading-[1.75] text-slate-600">
                      {p.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-manrope text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                La institución
              </h2>
              <Image
                src="/logo-uiab-original.svg"
                alt="Unión Industrial de Almirante Brown"
                width={400}
                height={182}
                className="mt-4 h-14 w-auto object-contain object-left"
              />
              <p className="mt-4 font-bold text-[15px] leading-snug text-[#00213f]">
                Unión Industrial de Almirante Brown
              </p>
              <p className="mt-2 flex items-start gap-2 text-[13.5px] leading-relaxed text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden />
                <span>
                  Luis María Drago 1951, Piso 2, Of. 14 y 15
                  <br />
                  Burzaco, Almirante Brown, Buenos Aires
                </span>
              </p>
              <a
                href="https://www.uiab.org"
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary-600 hover:underline"
              >
                Sitio institucional UIAB
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              {[
                { icon: Search, t: "Buscador único", d: `Toda la red en un solo lugar, con filtros por rubro, etiqueta y localidad.` },
                { icon: ShieldCheck, t: "Fichas verificadas", d: "Cada alta se valida contra el padrón de socias antes de publicarse." },
                { icon: Handshake, t: "Contacto directo", d: "Sin comisiones ni intermediarios: escribís a la empresa." },
                { icon: Building2, t: "Local", d: "Empresas radicadas en el partido de Almirante Brown." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold text-[14px] text-[#00213f]">{t}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-xl bg-[#00213f] p-6 text-white">
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]"
              />
              <div
                aria-hidden
                className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-primary-500/20 blur-[60px]"
              />
              <div className="relative">
                <p className="font-manrope text-[17px] font-black leading-snug">
                  ¿Tu empresa está en Almirante Brown?
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  Las empresas ya socias de la UIAB no pagan por estar en el directorio.
                </p>
                <Link
                  href="/sumate"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-sm bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#00213f] transition-colors hover:bg-primary-50"
                >
                  Sumate al directorio
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <nav className="mt-16 pt-8 border-t border-slate-200 flex flex-wrap gap-3 text-[14px]">
          <Link href="/directorio" className="font-semibold text-primary-600 hover:underline">
            Ver el directorio completo
          </Link>
          <span className="text-slate-300" aria-hidden>·</span>
          <Link href="/rubros" className="font-semibold text-primary-600 hover:underline">
            Explorar por rubro
          </Link>
          <span className="text-slate-300" aria-hidden>·</span>
          <Link href="/contacto" className="font-semibold text-primary-600 hover:underline">
            Contacto
          </Link>
        </nav>
      </div>
    </div>
  );
}
