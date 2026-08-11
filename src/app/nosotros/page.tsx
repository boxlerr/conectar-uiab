import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ShieldCheck, Search, Handshake, MapPin, ArrowRight } from "lucide-react";
import { obtenerDirectorio } from "@/app/directorio/datos";
import { RUBROS_SEO } from "@/lib/datos/rubros-seo";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { Migas } from "@/components/ui/migas";
import { ID_ORG_CONECTA, ID_ORG_UIAB, SITE_URL } from "@/lib/seo/entidad";

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
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  // El layout raíz agrega " | UIAB Conecta" por template: no lo repitas.
  title: "Qué es UIAB Conecta",
  description:
    "UIAB Conecta es el directorio comercial B2B oficial de la Unión Industrial de Almirante Brown: cómo funciona, qué empresas lo integran, cómo se verifica cada ficha y en qué se diferencia del listado institucional de uiab.org.",
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: "Qué es UIAB Conecta | UIAB Conecta",
    description:
      "El directorio comercial B2B oficial de la Unión Industrial de Almirante Brown. Cómo funciona y quiénes lo integran.",
    url: `${SITE_URL}/nosotros`,
    siteName: "UIAB Conecta",
    locale: "es_AR",
    type: "website",
  },
};

const PREGUNTAS = [
  {
    q: "¿Qué es UIAB Conecta?",
    a: "Es el directorio comercial B2B de la Unión Industrial de Almirante Brown. Reúne en un solo lugar a las empresas socias de la cámara junto a prestadores de productos y servicios, entidades financieras y educativas y cooperativas, con su actividad, sus rubros, sus certificaciones y su contacto directo.",
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

export default async function NosotrosPage() {
  const { entidades } = await obtenerDirectorio();
  const socias = entidades.filter((e) => !esEmpresaInstitucional(e.id));
  const localidades = Array.from(
    new Set(socias.map((e) => e.ubicacion?.split(",")[0]?.trim()).filter(Boolean))
  );

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
        mainEntity: { "@id": ID_ORG_UIAB },
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

      <section className="relative bg-[#00213f] -mt-20 lg:-mt-24 pt-20 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00182e] via-[#00213f] to-[#10375c]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <Migas
            tono="claro"
            className="mb-6"
            migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Nosotros" }]}
          />
          <h1 className="font-manrope text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-4xl">
            Qué es UIAB Conecta
          </h1>
          <p className="mt-5 text-white/75 text-[16px] leading-relaxed max-w-3xl">
            UIAB Conecta es el directorio comercial B2B de la Unión Industrial de Almirante Brown.
            Es la plataforma oficial de la cámara: acá está, en un solo lugar y con buscador, el
            entramado productivo del partido.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6 text-slate-700 text-[15.5px] leading-relaxed">
            <h2 className="font-manrope text-2xl font-black text-[#00213f] tracking-tight">
              Para qué existe
            </h2>
            <p>
              La Unión Industrial de Almirante Brown representa al sector productivo del partido
              desde su sede de Burzaco. Durante años su listado de asociadas vivió como una página
              institucional: servía para saber quiénes eran, pero no para encontrar un proveedor.
              UIAB Conecta nació para resolver eso — que una empresa de Almirante Brown pueda
              encontrar a otra empresa de Almirante Brown sin salir del partido, y sin pasar por un
              intermediario que cobra comisión.
            </p>
            <p>
              Hoy el directorio reúne {socias.length} empresas y prestadores verificados
              {localidades.length > 0 && <> de {localidades.join(", ")}</>}, agrupados en{" "}
              <Link href="/rubros" className="font-semibold text-primary-600 hover:underline">
                {RUBROS_SEO.length} rubros industriales
              </Link>
              : metalúrgica y metalmecánica, química, construcción, packaging, plásticos, gráfica,
              automatización y electricidad, pinturas, autopartes, informática industrial,
              ingeniería, seguridad e higiene y alimentos.
            </p>

            <h2 className="font-manrope text-2xl font-black text-[#00213f] tracking-tight pt-4">
              En qué se diferencia del sitio institucional
            </h2>
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
              novedades y sus servicios a las socias. UIAB Conecta es la herramienta comercial que
              la cámara pone a disposición de esas mismas empresas: buscador por rubro, etiqueta y
              localidad, fichas con catálogo de productos y servicios, certificaciones y normas
              declaradas, y una cartelera de oportunidades donde las socias publican lo que
              necesitan comprar o contratar.
            </p>

            <h2 className="font-manrope text-2xl font-black text-[#00213f] tracking-tight pt-4">
              Cómo se verifica cada ficha
            </h2>
            <p>
              Ninguna ficha se publica sola. Cada alta se contrasta por CUIT contra el padrón de
              socias de la UIAB y pasa por una aprobación antes de aparecer en el directorio. Esa
              es la diferencia con un listado abierto: si una ficha dice “empresa socia
              verificada”, es porque la cámara la reconoce como tal. Las socias además cargan sus
              propias etiquetas, su catálogo y sus certificaciones, que quedan visibles en la ficha
              pública.
            </p>

            <h2 className="font-manrope text-2xl font-black text-[#00213f] tracking-tight pt-4">
              Preguntas frecuentes
            </h2>
            <dl className="space-y-5">
              {PREGUNTAS.map((p) => (
                <div key={p.q} className="bg-white rounded-md border border-slate-200 p-5">
                  <dt className="font-bold text-[15px] text-[#00213f] mb-2">{p.q}</dt>
                  <dd className="text-[14.5px] text-slate-600 leading-relaxed">{p.a}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-md border border-slate-200 p-6">
              <h2 className="font-manrope text-[13px] font-bold text-slate-500 tracking-[0.18em] uppercase mb-4">
                La institución
              </h2>
              <p className="font-bold text-[15px] text-[#00213f] leading-snug">
                Unión Industrial de Almirante Brown
              </p>
              <p className="mt-2 flex items-start gap-2 text-[13.5px] text-slate-600 leading-relaxed">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                Luis María Drago 1951, Piso 2, Of. 14 y 15
                <br />
                Burzaco, Almirante Brown, Buenos Aires
              </p>
              <a
                href="https://www.uiab.org"
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary-600 hover:underline"
              >
                Sitio institucional UIAB
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
              {[
                { icon: Search, t: "Buscador único", d: `Toda la red en un solo lugar, con filtros por rubro, etiqueta y localidad.` },
                { icon: ShieldCheck, t: "Fichas verificadas", d: "Cada alta se valida contra el padrón de socias antes de publicarse." },
                { icon: Handshake, t: "Contacto directo", d: "Sin comisiones ni intermediarios: escribís a la empresa." },
                { icon: Building2, t: "Local", d: "Empresas radicadas en el partido de Almirante Brown." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0 text-primary-600" />
                  <div>
                    <p className="font-bold text-[14px] text-[#00213f]">{t}</p>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#00213f] rounded-md p-6 text-white">
              <p className="font-manrope font-black text-[17px] leading-snug">
                ¿Tu empresa está en Almirante Brown?
              </p>
              <p className="mt-2 text-[13.5px] text-white/70 leading-relaxed">
                Las empresas ya socias de la UIAB no pagan por estar en el directorio.
              </p>
              <Link
                href="/sumate"
                className="mt-4 inline-flex items-center gap-1.5 bg-white text-[#00213f] font-bold text-[13.5px] rounded-sm px-4 py-2.5 hover:bg-primary-50 transition-colors"
              >
                Sumate al directorio
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>

        <nav className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap gap-3 text-[14px]">
          <Link href="/directorio" className="font-semibold text-primary-600 hover:underline">
            Ver el directorio completo
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/rubros" className="font-semibold text-primary-600 hover:underline">
            Explorar por rubro
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/contacto" className="font-semibold text-primary-600 hover:underline">
            Contacto
          </Link>
        </nav>
      </div>
    </div>
  );
}
