import { createClient } from "@supabase/supabase-js";
import { crearSlug, nombreDeFichaParticular, normalizarSitioWeb, normalizarSitiosWeb } from "@/lib/utilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResenasPerfil } from "@/components/ui/directorio/ResenasPerfil";
import { CatalogoPublico, type CatalogoItem } from "@/components/ui/directorio/catalogo-publico";
import { ModalContacto } from "@/components/ui/directorio/modal-contacto";
import { MapPin, Mail, Phone, Globe, CheckCircle2, Building2, Wrench, User, Briefcase, ArrowRight, Clock, Tag, Award, FileText, Star, PackageSearch, ShieldCheck, Users, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CabeceraFicha,
  SelloVerificado,
  type DatoCabecera,
  type MetricaCabecera,
} from "@/components/ui/directorio/cabecera-ficha";
import { ChipNorma } from "@/modulos/certificaciones/chip-norma";
import { etiquetaNorma, familiaNorma, normaPorCodigo, estadoVigencia } from "@/modulos/certificaciones/normas";
import { BotonWhatsApp } from "@/components/ui/boton-whatsapp";
import { RegistrarVisita } from "@/components/ui/registrar-visita";
import Image from "next/image";
import type { Metadata } from "next";
import { ID_ORG_UIAB, SITE_URL, telefonoE164 } from "@/lib/seo/entidad";
import { tituloDeFicha } from "@/lib/seo/texto";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { landingDeCategoria, perteneceAlRubro, RUBROS_SEO } from "@/lib/datos/rubros-seo";
import { Migas } from "@/components/ui/migas";
import { normalizarMayusculas } from "@/modulos/compartido/texto-ficha";

async function fetchCatalogoItems(
  supabase: any,
  role: "company" | "provider",
  entityId: string
): Promise<CatalogoItem[]> {
  const filterKey = role === "company" ? "empresa_id" : "proveedor_id";
  const { data, error } = await supabase
    .from("items")
    .select(`
      id, nombre, tipo_item, descripcion_corta, descripcion_larga,
      precio, moneda, precio_a_consultar, destacado, sku, unidad, enlaces,
      palabras_clave,
      imagenes:imagenes_item(id, bucket, ruta_archivo, orden, texto_alternativo)
    `)
    .eq(filterKey, entityId)
    .eq("estado", "publicado")
    .order("destacado", { ascending: false })
    .order("creado_en", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((it) => {
    const imagenesOrdenadas = [...(it.imagenes || [])].sort(
      (a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)
    );
    return {
      id: it.id,
      nombre: it.nombre,
      tipo_item: it.tipo_item,
      descripcion_corta: it.descripcion_corta,
      descripcion_larga: it.descripcion_larga,
      precio: it.precio,
      moneda: it.moneda,
      precio_a_consultar: !!it.precio_a_consultar,
      destacado: !!it.destacado,
      sku: it.sku,
      unidad: it.unidad,
      enlaces: Array.isArray(it.enlaces) ? it.enlaces : [],
      imagenes: imagenesOrdenadas
        .filter((img: any) => img.bucket && img.ruta_archivo)
        .map((img: any) => ({
          url: supabase.storage.from(img.bucket).getPublicUrl(img.ruta_archivo).data.publicUrl,
          alt: img.texto_alternativo || it.nombre,
        })),
      palabras_clave: it.palabras_clave,
    } as CatalogoItem;
  });
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CertFicha {
  id: string;
  codigo_norma: string;
  nombre_libre: string | null;
  verificada: boolean;
  alcance: string | null;
  organismo_certificador: string | null;
  numero_certificado: string | null;
  fecha_vencimiento: string | null;
  ruta_archivo: string | null;
}

async function fetchCertificaciones(
  supabase: any,
  key: "empresa_id" | "proveedor_id",
  id: string
): Promise<CertFicha[]> {
  const { data } = await supabase
    .from("certificaciones")
    .select(
      "id, codigo_norma, nombre_libre, verificada, alcance, organismo_certificador, numero_certificado, fecha_vencimiento, ruta_archivo"
    )
    .eq(key, id)
    .order("verificada", { ascending: false });
  return (data as CertFicha[]) ?? [];
}

/**
 * Tarjeta blanca de la ficha. Una sola constante para que las secciones y el
 * sidebar no se vayan cada una por su lado: antes convivían `rounded-md` con
 * borde plano, `rounded-2xl` con `shadow-xl` y `border-[#191c1e]/8`, y la
 * columna se leía como tres componentes de tres sistemas distintos.
 */
const TARJETA =
  "bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

/**
 * Cabecera de sección: placa con el ícono, título y la barrita de acento.
 * Reemplaza al `<h2>` de 11px en versalitas grises, que a fuerza de ser
 * discreto hacía que todas las secciones pesaran lo mismo.
 */
function CabeceraSeccion({
  icono: Icono,
  titulo,
  accent,
  extra,
}: {
  icono: LucideIcon;
  titulo: string;
  accent: "blue" | "amber";
  extra?: React.ReactNode;
}) {
  const esAmber = accent === "amber";
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
            esAmber ? "border-[#bf7035]/15 bg-[#bf7035]/8" : "border-blue-100 bg-blue-50"
          }`}
        >
          <Icono className={`h-4 w-4 ${esAmber ? "text-[#bf7035]" : "text-blue-600"}`} />
        </span>
        <div>
          <h2 className="font-manrope text-[17px] font-black tracking-tight text-[#00213f]">
            {titulo}
          </h2>
          <span
            className={`mt-1.5 block h-[3px] w-7 rounded-full ${
              esAmber ? "bg-[#bf7035]" : "bg-blue-600"
            }`}
          />
        </div>
      </div>
      {extra}
    </div>
  );
}

/**
 * Panel "Certificaciones y verificaciones" del sidebar.
 *
 * Antes era una sección a ancho de la columna principal que sólo existía si la
 * socia tenía normas cargadas — o sea: en 58 de las 59 fichas, la pregunta
 * "¿esto está verificado por alguien?" no se contestaba en ninguna parte.
 * Ahora el panel está siempre y arranca por lo único que la UIAB sí sostiene:
 * que la ficha es de una socia registrada. Las normas, cuando las hay, se
 * suman abajo con su respaldo descargable.
 *
 * Contenido público: va FUERA del gate de login.
 */
function PanelCertificaciones({ certs, accent }: { certs: CertFicha[]; accent: "blue" | "amber" }) {
  const esAmber = accent === "amber";
  const acentoTexto = esAmber ? "text-[#bf7035] hover:text-[#a0622c]" : "text-blue-700 hover:text-blue-900";

  return (
    <section className={`${TARJETA} overflow-hidden`}>
      <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
        <h3 className="font-manrope text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Certificaciones y verificaciones
        </h3>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              esAmber ? "bg-[#bf7035]/10" : "bg-blue-50"
            }`}
          >
            {esAmber ? (
              <ShieldCheck className="h-5 w-5 text-[#bf7035]" />
            ) : (
              <SelloVerificado className="h-6 w-6" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold leading-snug text-[#00213f]">
              {esAmber ? "Prestador verificado" : "Empresa verificada"}
            </p>
            <p className="text-[12.5px] text-slate-500">UIAB Conecta</p>
          </div>
        </div>

        {certs.length > 0 && (
          <ul className="mt-4 space-y-3.5 border-t border-slate-100 pt-4">
            {certs.map((c) => {
              const etiqueta = etiquetaNorma(c.codigo_norma, c.nombre_libre);
              const familia = familiaNorma(c.codigo_norma);
              const n = normaPorCodigo(c.codigo_norma);
              const estado = estadoVigencia(c.fecha_vencimiento);
              return (
                <li key={c.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <ChipNorma etiqueta={etiqueta} familia={familia} size="sm" />
                    {c.fecha_vencimiento && estado === "vencida" && (
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] sm:text-[10px] font-bold text-rose-700">
                        Vencida
                      </span>
                    )}
                  </div>
                  {n && n.codigo !== "otra" && (
                    <p className="mt-1.5 text-[13px] font-semibold leading-snug text-slate-800">
                      {n.nombre}
                    </p>
                  )}
                  {c.alcance && (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{c.alcance}</p>
                  )}
                  {(c.organismo_certificador || c.numero_certificado) && (
                    <p className="mt-1 text-[11.5px] text-slate-400">
                      {c.organismo_certificador && <>Certificada por {c.organismo_certificador}</>}
                      {c.organismo_certificador && c.numero_certificado && " · "}
                      {c.numero_certificado && <>Cert. N° {c.numero_certificado}</>}
                    </p>
                  )}
                  {/* El respaldo es lo que le da sentido al adjunto: la UIAB no
                      audita, así que quien mira la ficha puede abrir el
                      certificado y juzgar por su cuenta. */}
                  {c.ruta_archivo && (
                    <a
                      href={`/api/certificaciones/${c.id}/archivo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${acentoTexto}`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Ver certificado
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 border-t border-slate-100 pt-3.5 text-[11px] leading-relaxed text-slate-400">
          {certs.length > 0
            ? "Certificaciones publicadas por cada empresa bajo su responsabilidad. La UIAB no emite, verifica ni audita certificaciones."
            : "La verificación acredita que la ficha pertenece a una socia registrada en la UIAB. No es una auditoría de sus procesos."}
        </p>
      </div>
    </section>
  );
}

// El gate de login que vivía acá se eliminó el 2026-09-15. Escondía el catálogo
// —el único texto propio que tienen la mayoría de las fichas— y encima decía
// "Ingresá para ver … datos de contacto" cuando el contacto ya estaba a la
// vista en la barra lateral. Decisión de producto: fichas lo más públicas
// posible, que es lo que empuja el posicionamiento.

// ── SEO: datos mínimos por slug (empresa o proveedor) para metadata + JSON-LD ──
async function datosSeoPorSlug(slug: string) {
  const db = createAdminClient();

  const { data: empresas } = await db
    .from("empresas")
    .select(
      "razon_social, actividad, descripcion, localidad, provincia, sitio_web, bucket_logo, ruta_logo, empresas_categorias(categorias(nombre))"
    )
    .eq("estado", "aprobada");
  const emp = empresas?.find((e: any) => crearSlug(e.razon_social) === slug);
  if (emp) {
    return {
      esProveedor: false,
      nombre: emp.razon_social as string,
      categoria:
        (((emp.empresas_categorias || [])[0]?.categorias as any)?.nombre as string | undefined) ??
        null,
      descripcion: (emp.descripcion as string) || (emp.actividad as string) || null,
      localidad: (emp.localidad as string) || null,
      provincia: (emp.provincia as string) || null,
      sitioWeb: (emp.sitio_web as string) || null,
      logoUrl:
        emp.bucket_logo && emp.ruta_logo
          ? db.storage.from(emp.bucket_logo).getPublicUrl(emp.ruta_logo).data.publicUrl
          : null,
    };
  }

  const { data: provs } = await db
    .from("proveedores")
    .select("nombre, apellido, nombre_comercial, descripcion, localidad, provincia, sitio_web, bucket_logo, ruta_logo")
    .eq("estado", "aprobado");
  const prov = provs?.find((p: any) => {
    const dn = nombreDeFichaParticular(p);
    return dn !== "" && crearSlug(dn) === slug;
  });
  if (prov) {
    const dn = nombreDeFichaParticular(prov);
    return {
      esProveedor: true,
      nombre: dn as string,
      categoria: null as string | null,
      descripcion: (prov.descripcion as string) || null,
      localidad: (prov.localidad as string) || null,
      provincia: (prov.provincia as string) || null,
      sitioWeb: (prov.sitio_web as string) || null,
      logoUrl:
        prov.bucket_logo && prov.ruta_logo
          ? db.storage.from(prov.bucket_logo).getPublicUrl(prov.ruta_logo).data.publicUrl
          : null,
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await datosSeoPorSlug(slug);
  if (!d) {
    // `absolute` para saltear el template del layout, que si no agrega un
    // segundo " | UIAB Conecta" y el <title> sale con la marca dos veces.
    return {
      title: { absolute: "Perfil no encontrado | UIAB Conecta" },
      robots: { index: false, follow: true },
    };
  }
  /**
   * TITLE. Este cálculo ya se pasó de largo DOS veces: primero con
   * `${nombre} — Empresa socia UIAB` (máximo 77), después con
   * `${nombre} — ${categoria} en ${localidad}` sin tope (14 de 59 fichas
   * arriba de 65, máximo ~100 — hay socias con razón social larga Y categoría
   * larga). La fórmula vive ahora en `tituloDeFicha`: una cadena de candidatos
   * de más contexto a menos, gana el primero que entra en el presupuesto, y el
   * nombre no se recorta nunca. Lo fija indexabilidad.test.ts.
   */
  const rolTitulo = d.esProveedor ? "Prestador verificado UIAB" : "Empresa socia UIAB";
  const title = tituloDeFicha({
    nombre: d.nombre,
    categoria: d.categoria,
    localidad: d.localidad,
    rol: rolTitulo,
  });
  const tituloCompleto = `${title} | UIAB Conecta`;

  /**
   * DESCRIPTION. La versión anterior anteponía plantilla y cortaba a 300 con un
   * `slice` seco: la parte propia promediaba 83 caracteres contra 142 de
   * boilerplate, y cuatro fichas cortaban a mitad de palabra ("…integración
   * entre sistema"). Ahora va primero lo específico de la empresa y el corte
   * respeta el límite de palabra.
   */
  const ubic = d.localidad ? ` en ${d.localidad}${d.provincia ? ", " + d.provincia : ""}` : "";
  const propio = normalizarMayusculas((d.descripcion || "").trim());
  const relleno = `${d.esProveedor ? "Prestador verificado" : "Empresa socia"} de la Unión Industrial de Almirante Brown${ubic}. Contacto directo en UIAB Conecta.`;
  const crudo = propio ? `${d.nombre}: ${propio} — ${relleno}` : `${d.nombre}. ${relleno}`;
  const description =
    crudo.length <= 158 ? crudo : crudo.slice(0, 155).replace(/\s+\S*$/, "") + "…";
  const url = `${SITE_URL}/empresas/${slug}`;

  return {
    title,
    description,
    keywords: [d.nombre, "UIAB", "UIAB Conecta", "Unión Industrial de Almirante Brown", d.localidad ?? ""].filter(Boolean),
    alternates: { canonical: `/empresas/${slug}` },
    openGraph: {
      title: tituloCompleto,
      description,
      url,
      siteName: "UIAB Conecta",
      locale: "es_AR",
      type: "profile",
      images: d.logoUrl ? [{ url: d.logoUrl, alt: d.nombre }] : undefined,
    },
    twitter: {
      card: "summary",
      title: tituloCompleto,
      description,
      images: d.logoUrl ? [d.logoUrl] : undefined,
    },
  };
}

/**
 * Cómo se LEE una web en la ficha: sin esquema ni barra final.
 * "https://www.metlongchamps.com/" → "www.metlongchamps.com"
 *
 * El href siempre lleva la URL completa; esto es sólo el texto.
 */
function textoDeWeb(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * JSON-LD Organization de la ficha: le dice a Google que ESTA página describe a
 * ESA empresa, y que la empresa es socia de la UIAB.
 *
 * Por qué el NAP completo importa tanto acá: para que la ficha aparezca cuando
 * alguien busca el nombre de la socia, Google tiene que aceptar que la página
 * *describe* a la empresa y no que apenas la *menciona*. Eso lo decide cruzando
 * teléfono + dirección postal + dominio propio contra lo que ya sabe de ella.
 * Con nombre y localidad solos —que era todo lo que emitíamos— la ficha queda
 * del lado de "la menciona", y una mención nunca desplaza al sitio propio de la
 * empresa.
 *
 * `memberOf` va por `@id` contra el nodo que el layout raíz emite en el mismo
 * documento. Antes cada ficha creaba un nodo anónimo nuevo que además declaraba
 * `url: SITE_URL` para la cámara — 59 afirmaciones de que la UIAB vive en
 * uiabconecta.com, contradiciendo lo que Google ya tiene indexado.
 */
function jsonLdOrganizacion(opts: {
  nombre: string;
  descripcion: string | null;
  localidad: string | null;
  provincia: string | null;
  logoUrl: string | null;
  sitioWeb: string | null;
  /** Webs extra de la ficha. Suman a `sameAs` junto con la principal. */
  sitiosWebAdicionales?: readonly string[] | null;
  url: string;
  direccion?: string | null;
  codigoPostal?: string | number | null;
  telefono?: string | null;
  email?: string | null;
  cuit?: string | null;
  /** Nombre de fantasía, cuando difiere de la razón social. */
  nombreComercial?: string | null;
  /** Rubros y etiquetas ya cargados: lo que la empresa sabe hacer. */
  especialidades?: readonly string[] | null;
  /** Ítems publicados del catálogo, para emitir el OfferCatalog. */
  catalogo?: readonly {
    nombre: string;
    tipo: "producto" | "servicio";
    descripcion?: string | null;
    imagen?: string | null;
  }[] | null;
  /** Normas que la empresa declara, con organismo y número si los cargó. */
  certificaciones?: readonly {
    etiqueta: string;
    organismo?: string | null;
    numero?: string | null;
  }[] | null;
}) {
  const tel = telefonoE164(opts.telefono);
  const web = normalizarSitioWeb(opts.sitioWeb);
  const cp = opts.codigoPostal != null ? String(opts.codigoPostal).trim() : "";

  // `sameAs` acepta varias: si la socia cargó la institucional y la tienda, las
  // dos corroboran la misma entidad. `normalizarSitiosWeb` deduplica contra la
  // principal, así que acá no puede repetirse.
  const websSameAs = [
    ...(web ? [web] : []),
    ...(normalizarSitiosWeb(opts.sitiosWebAdicionales, opts.sitioWeb) ?? []),
  ];

  // Sin localidad no hay PostalAddress que valga: `streetAddress` suelto no
  // ubica nada. Con localidad, sumamos todo lo que haya.
  const address = opts.localidad
    ? {
        "@type": "PostalAddress",
        ...(opts.direccion?.trim() ? { streetAddress: opts.direccion.trim() } : {}),
        addressLocality: opts.localidad,
        ...(opts.provincia ? { addressRegion: opts.provincia } : {}),
        ...(cp ? { postalCode: cp } : {}),
        addressCountry: "AR",
      }
    : null;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${opts.url}#organizacion`,
    name: opts.nombre,
    /**
     * El nombre de fantasía, que es por el que la conocen.
     *
     * 20 de las 59 socias tienen un `nombre_comercial` distinto de la razón
     * social y hasta ahora no aparecía en ningún lado del grafo: quien busca
     * "Pinturería Giannoni" no encontraba la ficha de la razón social. Es el
     * mismo problema que resuelve `alternateName` para la propia UIAB.
     */
    ...(opts.nombreComercial?.trim() &&
    opts.nombreComercial.trim().toLowerCase() !== opts.nombre.trim().toLowerCase()
      ? { alternateName: opts.nombreComercial.trim() }
      : {}),
    url: opts.url,
    mainEntityOfPage: opts.url,
    ...(opts.descripcion ? { description: opts.descripcion } : {}),
    ...(opts.logoUrl ? { logo: opts.logoUrl, image: opts.logoUrl } : {}),
    // El sitio propio de la socia es la corroboración externa más fuerte que
    // tiene la ficha: es el que le dice a Google de qué empresa estamos
    // hablando. 50 de las 59 lo tienen cargado; las 9 que no, difícilmente
    // aparezcan al buscar su nombre hasta que se les cargue.
    ...(websSameAs.length ? { sameAs: websSameAs } : {}),
    ...(address ? { address } : {}),
    ...(tel ? { telephone: tel } : {}),
    ...(opts.email?.trim() ? { email: opts.email.trim() } : {}),
    ...(opts.cuit?.trim()
      ? {
          identifier: {
            "@type": "PropertyValue",
            propertyID: "CUIT",
            value: opts.cuit.trim(),
          },
        }
      : {}),
    /**
     * Qué sabe hacer. Sale de los rubros y las etiquetas que ya están cargados
     * (54 socias tienen), o sea que no agrega ni una palabra inventada: es el
     * mismo dato que ya se renderiza en la sección "Servicios y especialidades",
     * declarado de forma que Google pueda leerlo.
     *
     * Es la señal que más puede rendir en las consultas de DESCUBRIMIENTO
     * ("proveedor de mecanizado en Almirante Brown"), que es donde el directorio
     * compite de verdad — contra el nombre propio de la socia siempre pierde.
     */
    ...(opts.especialidades?.length
      ? { knowsAbout: [...new Set(opts.especialidades.map((e) => e.trim()).filter(Boolean))] }
      : {}),
    /**
     * Las normas declaradas. Ojo con el encuadre: la UIAB NO verifica ni audita
     * certificaciones (es una decisión tomada), así que esto describe lo que la
     * empresa declara, no un sello nuestro. Por eso no se emite ningún campo que
     * sugiera validación de terceros.
     */
    ...(opts.certificaciones?.length
      ? {
          hasCredential: opts.certificaciones.map((c) => ({
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "certification",
            name: c.etiqueta,
            ...(c.organismo?.trim()
              ? { recognizedBy: { "@type": "Organization", name: c.organismo.trim() } }
              : {}),
            ...(c.numero?.trim() ? { identifier: c.numero.trim() } : {}),
          })),
        }
      : {}),
    /**
     * El catálogo, declarado.
     *
     * Es el texto propio más valioso que tiene la ficha: lo escribió la socia,
     * no se repite en ninguna otra, y hasta el 2026-09-15 vivía detrás del
     * login — o sea que Googlebot no lo veía y no se podía emitir nada de esto.
     *
     * `Product` para los productos y `Service` para los servicios: son cosas
     * distintas y mezclarlas en `Product` es lo que hace que Search Console
     * marque "falta offers/price". No se emite `offers` porque ninguna socia
     * cargó precio (17 de 29 son "a consultar"): inventar uno sería peor que
     * omitirlo, y un `offers` sin `price` es un error de validación.
     */
    ...(opts.catalogo?.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `Productos y servicios de ${opts.nombre}`,
            itemListElement: opts.catalogo.map((it) => ({
              "@type": "ListItem",
              item: {
                "@type": it.tipo === "producto" ? "Product" : "Service",
                name: it.nombre,
                ...(it.descripcion?.trim() ? { description: it.descripcion.trim() } : {}),
                ...(it.imagen ? { image: it.imagen } : {}),
                ...(it.tipo === "servicio"
                  ? { provider: { "@id": `${opts.url}#organizacion` } }
                  : { brand: { "@id": `${opts.url}#organizacion` } }),
              },
            })),
          },
        }
      : {}),
    memberOf: { "@id": ID_ORG_UIAB },
  };
  return jsonLd;
}

type RubroConLanding = { nombre: string; href: string | null };
type EmpresaHermana = {
  nombre: string;
  slug: string;
  localidad: string | null;
  rubro: string | null;
  /** URL pública del logo, si la socia lo tiene cargado. */
  logoUrl: string | null;
};

/**
 * Rubros de la ficha con su landing, si la tienen.
 *
 * Los chips ya traían el anchor text perfecto ("Automatización y Robótica",
 * "Ingeniería y Consultoría Técnica") pero eran <span>: texto de enlace
 * escrito y desperdiciado en las 59 fichas. `landingDeCategoria` además
 * colapsa los slugs fragmentados del catálogo —los cuatro de informática, los
 * tres de electricidad— contra la MISMA landing.
 */
function rubrosConLandingDe(empresaDb: any): RubroConLanding[] {
  const rubros: RubroConLanding[] = (empresaDb.empresas_categorias || [])
    .map((ec: any) => ec.categorias)
    .filter((c: any) => c?.nombre)
    .map((c: any) => {
      const landing = landingDeCategoria(c.slug);
      /**
       * Con landing, el chip toma el nombre de la LANDING y no el de la
       * categoría de la base.
       *
       * El catálogo está fragmentado, así que varias categorías de la misma
       * socia caen en la misma landing: Vaxler mostraba "Desarrollo de
       * Software Industrial", "Informática, Sistemas y Soporte IT" y
       * "Telecomunicaciones y Redes" como tres chips distintos que iban los
       * tres a /rubros/informatica-industrial. Eran tres enlaces a la misma
       * URL con anchors distintos en la misma página: reparten la señal en vez
       * de sumarla, y ninguno coincidía con el H1 del destino.
       *
       * Con el nombre canónico, el anchor dice lo mismo que el título de la
       * página a la que lleva, que es lo que hace que un enlace interno valga.
       * Las categorías sin landing conservan su nombre: no hay a qué alinearse.
       */
      return landing
        ? { nombre: landing.nombre, href: `/rubros/${landing.slug}` }
        : { nombre: c.nombre as string, href: null };
    });

  // Un destino, un chip.
  const porDestino = new Map<string, RubroConLanding>();
  for (const r of rubros) {
    porDestino.set(r.href ?? `sin-landing:${r.nombre}`, r);
  }
  return [...porDestino.values()];
}

/**
 * Empresas hermanas: otras socias que comparten alguna categoría.
 *
 * Las 59 fichas eran hojas terminales — 0 enlaces salientes a otras fichas—,
 * así que todo el enlace interno entraba por /directorio y no circulaba. Con
 * esto cada ficha reparte hacia 4-6 pares del mismo rubro, que además es
 * navegación genuinamente útil para quien está comparando proveedores.
 *
 * Se filtra en memoria sobre la lista que la página ya tenía cargada: cero
 * queries nuevas.
 *
 * VIVE ACÁ, EN LA PÁGINA, Y NO ADENTRO DE `EmpresaProfile`. Antes la lista
 * completa de 59 socias —con sus categorías y etiquetas anidadas— viajaba como
 * prop al componente hijo, y en `next dev` eso rompía el render: la ficha
 * devolvía 500 con `TypeError: frame.join is not a function`, un error del
 * serializador de errores de Next que además tapaba al verdadero. Pasar sólo
 * el resultado (6 filas de 4 campos) lo arregla y de paso saca ese peso del
 * payload RSC.
 */
function empresasHermanasDe(
  empresaDb: any,
  todasLasEmpresas: any[],
  rubrosConLanding: RubroConLanding[],
  /** Sólo se usa para resolver la URL pública del logo. */
  supabase: {
    storage: {
      from: (bucket: string) => { getPublicUrl: (ruta: string) => { data: { publicUrl: string } } };
    };
  }
): EmpresaHermana[] {
  const slugsCategoria = new Set<string>(
    (empresaDb.empresas_categorias || [])
      .map((ec: any) => ec.categorias?.slug)
      .filter(Boolean)
  );

  const candidatas = (todasLasEmpresas || []).filter(
    (e: any) => e.id !== empresaDb.id && !esEmpresaInstitucional(e.id) && e.razon_social
  );

  const datosRubro = (e: any) => ({
    categoriaSlugs: (e.empresas_categorias || [])
      .map((ec: any) => ec.categorias?.slug)
      .filter(Boolean),
    tags: (e.empresas_tags || []).map((et: any) => et.tags?.nombre).filter(Boolean),
  });

  // Primero por categoría exacta compartida. Después, si no llega a 6, se
  // completa con la landing de rubro: el catálogo de categorías está
  // fragmentado (los cuatro slugs de informática son cuatro filas distintas
  // para el mismo rubro), así que el match exacto solo deja fichas como Vaxler
  // con uno o dos pares cuando en realidad comparte rubro con varias más.
  const porCategoria = candidatas.filter((e: any) =>
    (e.empresas_categorias || []).some((ec: any) => slugsCategoria.has(ec.categorias?.slug))
  );
  const landing = rubrosConLanding.find((r) => r.href);
  const rubroDeLanding = landing
    ? RUBROS_SEO.find((r) => `/rubros/${r.slug}` === landing.href)
    : undefined;
  const porLanding = rubroDeLanding
    ? candidatas.filter((e: any) => perteneceAlRubro(rubroDeLanding, datosRubro(e)))
    : [];

  return Array.from(
    new Map([...porCategoria, ...porLanding].map((e: any) => [e.id, e])).values()
  )
    .sort((a: any, b: any) =>
      a.razon_social.localeCompare(b.razon_social, "es", { sensitivity: "base" })
    )
    .slice(0, 6)
    .map((e: any) => ({
      nombre: e.razon_social as string,
      slug: crearSlug(e.razon_social),
      localidad: (e.localidad as string) || null,
      rubro: (e.empresas_categorias || [])[0]?.categorias?.nombre ?? null,
      logoUrl:
        e.bucket_logo && e.ruta_logo
          ? supabase.storage.from(e.bucket_logo).getPublicUrl(e.ruta_logo).data.publicUrl
          : null,
    }));
}

/**
 * Copia plana de una fila antes de cruzarla a un Server Component hijo.
 *
 * En `next dev` (Next 16.1.6 + Turbopack), pasar las filas que devuelve
 * supabase-js directamente como prop a `EmpresaProfile` / `ProveedorProfile`
 * hacía que el render tirara 500. El error real era
 * `TypeError: Object prototype may only be an Object or null: undefined`,
 * dentro del serializador de debug info que Next arma para cada Server
 * Component — y encima el formateador de errores se rompía sobre eso con
 * `frame.join is not a function`, así que en pantalla sólo se veía "Algo no
 * cargó como esperábamos" y en consola un stack 100% de frames de Next.
 *
 * En producción (`next start`) nunca pasó: es del pipeline de desarrollo. Pero
 * dejaba las 59 fichas inaccesibles en local para cualquiera sin sesión, que
 * es justo cómo se las mira mientras se trabaja en ellas.
 *
 * `structuredClone` corta la identidad compartida entre lo que se serializa
 * acá y lo que ya viajó en el mismo render. No es gratis (~59 filas → 1), pero
 * es una copia por request de un objeto chico.
 *
 * Las otras dos mitades del mismo problema ya están resueltas por diseño: el
 * cliente de Supabase se crea adentro de cada componente en vez de viajar por
 * prop, y las empresas hermanas se calculan en la página para no mandar la
 * tabla entera.
 */
function filaSerializable<T>(fila: T): T {
  return structuredClone(fila);
}

export default async function EmpresaProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Ya no se consulta la sesión: la ficha es íntegramente pública, así que no
  // hay nada que ramificar por usuario. Eso ahorra además un round-trip a Auth
  // en cada visita, que es la mayoría del tráfico de estas páginas.
  const supabase = createAdminClient();

  const [{ data: empresasData }] = await Promise.all([
    supabase
      .from('empresas')
      .select(`
        id,
        razon_social,
        nombre_comercial,
        direccion,
        localidad,
        provincia,
        codigo_postal,
        cuit,
        cantidad_empleados,
        actividad,
        descripcion,
        sitio_web,
        sitios_web_adicionales,
        email,
        email_compras,
        email_mantenimiento,
        telefono,
        whatsapp,
        referente,
        bucket_logo,
        ruta_logo,
        empresas_categorias (
          categorias (
            nombre,
            slug
          )
        ),
        empresas_tags (
          tags (
            nombre,
            tipo_tag
          )
        )
      `)
      .eq('estado', 'aprobada'),
  ]);

  const empresaDb = empresasData?.find((emp: any) => crearSlug(emp.razon_social) === slug);

  if (!empresaDb) {
    // `sitio_web` no se traía y el JSON-LD lo leía igual: `sameAs` salía siempre
    // vacío en las fichas de prestador, que es justo la corroboración externa
    // que le dice a Google de quién estamos hablando.
    const { data: provData } = await supabase
      .from('proveedores')
      .select(`
        id,
        nombre,
        apellido,
        nombre_comercial,
        tipo_proveedor,
        email,
        email_compras,
        email_mantenimiento,
        telefono,
        localidad,
        provincia,
        descripcion,
        sitio_web,
        sitios_web_adicionales,
        fecha_inicio_experiencia,
        bucket_logo,
        ruta_logo,
        proveedores_categorias (
          categorias (
            nombre
          )
        )
      `)
      .eq('estado', 'aprobado');

    const provDb = provData?.find((p: any) => {
      // Antes caía a "Sin nombre" y generateMetadata a "": para un particular
      // sin nombre, el título y el cuerpo resolvían fichas distintas.
      const displayName = nombreDeFichaParticular(p);
      return displayName !== "" && crearSlug(displayName) === slug;
    });

    if (!provDb) {
      notFound();
    }

    return (
      <ProveedorProfile
        provDb={filaSerializable(provDb)}
        currentPath={`/empresas/${slug}`}
      />
    );
  }

  // `empresasData` ya está en memoria: la página trae la tabla entera para
  // resolver el slug (no hay columna `slug`, así que no se puede filtrar en
  // SQL). Aprovecharla para las empresas hermanas no cuesta una query más —
  // pero el cálculo se hace ACÁ y baja sólo el resultado. Ver el comentario
  // largo de `empresasHermanasDe`.
  const rubrosConLanding = rubrosConLandingDe(empresaDb);
  const hermanas = empresasHermanasDe(empresaDb, empresasData ?? [], rubrosConLanding, supabase);

  return (
    <EmpresaProfile
      empresaDb={filaSerializable(empresaDb)}
      rubrosConLanding={rubrosConLanding}
      hermanas={hermanas}
      currentPath={`/empresas/${slug}`}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPRESA PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function EmpresaProfile({
  empresaDb,
  rubrosConLanding,
  hermanas,
  currentPath,
}: {
  empresaDb: any;
  rubrosConLanding: RubroConLanding[];
  hermanas: EmpresaHermana[];
  currentPath: string;
}) {
  /**
   * El cliente se construye ACÁ y no llega por prop.
   *
   * Pasarlo desde la página rompía el render en `next dev`: un cliente de
   * Supabase no es un valor serializable, y el serializador de debug info que
   * Next 16 arma para cada Server Component se caía con
   * `TypeError: Object prototype may only be an Object or null` — que a su vez
   * disparaba `frame.join is not a function` en el formateador de errores, así
   * que lo único que se veía era la pantalla de "Algo no cargó". No cuesta
   * nada: `createAdminClient` sólo lee dos variables de entorno.
   */
  const supabase = createAdminClient();
  const cats = empresaDb.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
  const mainCat = cats.length > 0 ? cats[0] : "General";

  const logoUrl = empresaDb.bucket_logo && empresaDb.ruta_logo
    ? supabase.storage.from(empresaDb.bucket_logo).getPublicUrl(empresaDb.ruta_logo).data.publicUrl
    : null;

  // Certificaciones: contenido público (se ve sin cuenta). Query O(1) por id,
  // fuera del gate de auth.
  const certs = await fetchCertificaciones(supabase, "empresa_id", empresaDb.id);

  // Señales de la barra de identidad. Van FUERA del gate de auth a propósito:
  // son contadores, no contenido. Que un visitante sin cuenta vea "12 reseñas ·
  // 6 productos" es justamente lo que lo empuja a registrarse para leerlos, y
  // de paso le dice de un vistazo qué tan viva está la ficha. Dos queries
  // `head: true` (sólo el count, sin traer filas) y una de calificaciones.
  const [resenasPub, itemsPub] = await Promise.all([
    supabase
      .from("resenas")
      .select("calificacion")
      .eq("empresa_resenada_id", empresaDb.id)
      .eq("estado", "aprobada"),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaDb.id)
      .eq("estado", "publicado"),
  ]);

  const notas = (resenasPub.data ?? []).map((r: any) => Number(r.calificacion)).filter(Number.isFinite);
  const totalResenas = notas.length;
  const promedioResenas =
    totalResenas > 0 ? notas.reduce((a: number, b: number) => a + b, 0) / totalResenas : null;
  const totalItems = itemsPub.count ?? 0;

  /**
   * ¿Esta ficha tiene dueño? (o sea: ¿alguien de la empresa tiene cuenta?)
   *
   * 35 de las 59 fichas publicadas no tienen ninguna fila en `miembros_empresa`
   * — medido el 2026-09-15, y son exactamente las mismas 35 que no tienen
   * descripción propia. Para esas fichas mostramos el botón de reclamo; para el
   * resto sería ruido, y encima una invitación a que un tercero pida acceso a
   * una empresa que ya está adentro.
   *
   * `head: true` con count exacto: no trae filas, sólo el número.
   */
  const { count: miembros } = await supabase
    .from("miembros_empresa")
    .select("perfil_id", { count: "exact", head: true })
    .eq("empresa_id", empresaDb.id);
  const sinDueno = (miembros ?? 0) === 0;

  /**
   * Catálogo, oportunidades y reseñas: se traen SIEMPRE, con o sin sesión.
   *
   * Antes esto vivía dentro de `if (isAuthenticated)` y era la mayor pérdida de
   * SEO del proyecto: 29 ítems de 7 socias, ~1.243 palabras de texto único
   * escrito por ellas, que Googlebot no veía nunca. Sin ese texto la ficha
   * quedaba en puro boilerplate compartido con las otras 58 — el problema de
   * thin content que ninguna optimización de metadata compensa. Y sin los ítems
   * renderizados tampoco se podía emitir `Product`/`OfferCatalog`.
   *
   * Qué se expone de nuevo: nada que no fuera ya público. El contacto (correo,
   * teléfono, WhatsApp, web) ya se veía sin cuenta en la barra lateral, las
   * oportunidades ya se sirven sin sesión en /oportunidades, y los ítems tienen
   * `estado = 'publicado'`: la socia ya eligió publicarlos. Verificado además
   * que ninguno tiene precio cargado (17 de 29 son "a consultar"), así que no
   * se publica ni un número que la empresa no haya querido mostrar.
   *
   * Decisión de producto de Julián (2026-09-15): las fichas lo más públicas
   * posible, porque es lo que empuja el posicionamiento.
   */
  let finalResenas: any[] = [];
  let oportunidadesActivas: any[] = [];
  let catalogoItems: CatalogoItem[] = [];

  {
    // Las tres consultas son independientes → en paralelo
    const [resenasRes, opsRes, catalogo] = await Promise.all([
      supabase
        .from('resenas')
        .select(`
          id,
          calificacion,
          comentario,
          creada_en,
          empresa_autora:empresas!resenas_empresa_autora_id_fkey(razon_social),
          proveedor_autor:proveedores!resenas_proveedor_autor_id_fkey(nombre, apellido)
        `)
        .eq('empresa_resenada_id', empresaDb.id)
        .eq('estado', 'aprobada')
        .order('creada_en', { ascending: false }),
      supabase
        .from('oportunidades')
        .select(`
          id,
          titulo,
          descripcion,
          localidad,
          creado_en,
          categoria:categorias(nombre)
        `)
        .eq('empresa_solicitante_id', empresaDb.id)
        .eq('estado', 'abierta')
        .order('creado_en', { ascending: false }),
      fetchCatalogoItems(supabase, "company", empresaDb.id),
    ]);

    if (!resenasRes.data) {
      const { data: fallbackData } = await supabase
        .from('resenas')
        .select('id, calificacion, comentario, creada_en')
        .eq('empresa_resenada_id', empresaDb.id)
        .eq('estado', 'aprobada')
        .order('creada_en', { ascending: false });
      finalResenas = fallbackData || [];
    } else {
      finalResenas = resenasRes.data;
    }

    oportunidadesActivas = opsRes.data || [];
    catalogoItems = catalogo;
  }

  // `descripcion` es lo que escribe la socia (formulario de alta y /perfil/datos);
  // `actividad` es el rubro que trajo el padrón. Mandan sus palabras, y caemos
  // al padrón mientras no haya escrito nada.
  const textoEmpresa = (empresaDb.descripcion || empresaDb.actividad || "").trim();

  /**
   * El umbral era `> 8` caracteres, y con eso la sección "Sobre la empresa"
   * DESAPARECÍA entera en las fichas más cortas: `actividad = "QUIMICA"` son 7.
   * En /empresas/alkanos-sa los únicos H2 que quedaban eran "Rubros y
   * especialidades" y "Catálogo", o sea que la página no decía en ninguna parte
   * a qué se dedica la empresa. Con 3 caracteres alcanza para saber que hay
   * algo cargado.
   */
  const tieneActividadReal = textoEmpresa.length > 2;


  /**
   * Cuando la socia todavía no escribió su descripción, se compone una frase
   * con datos que YA están en la base: rubro, localidad y etiquetas. No es
   * contenido inventado —cada dato sale de una columna— y saca a la ficha del
   * 60-72% de plantilla que compartía con las demás.
   *
   * No reemplaza a la descripción propia: sólo aparece cuando no hay ninguna, o
   * como complemento cuando la que hay es telegráfica (menos de 120 caracteres,
   * que son 53 de las 59 fichas).
   */
  const textoMostrado = tieneActividadReal ? normalizarMayusculas(textoEmpresa) : null;


  // Tags de match (tabla tags via empresas_tags) — información pública que alimenta la búsqueda del directorio
  const tagsEmpresa: { nombre: string; tipo_tag: string | null }[] = Array.from(
    new Map<string, { nombre: string; tipo_tag: string | null }>(
      (empresaDb.empresas_tags || [])
        .map((et: any) => et.tags)
        .filter((t: any) => t?.nombre)
        .map((t: any) => [t.nombre, { nombre: t.nombre, tipo_tag: t.tipo_tag ?? null }])
    ).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const tieneTags = tagsEmpresa.length > 0;

  /**
   * Frase derivada. Cada dato sale de una columna: `empresas_categorias`,
   * `localidad` y `empresas_tags`. Se muestra cuando la descripción propia es
   * corta o no existe; si la socia escribió 120+ caracteres, sobra.
   */
  const resumenDerivado = ((): string | null => {
    if (textoMostrado && textoMostrado.length >= 120) return null;

    const nombre = empresaDb.razon_social as string;
    const rubros = rubrosConLanding.map((r) => r.nombre.toLocaleLowerCase("es"));
    const partes: string[] = [];

    if (rubros.length > 0) {
      const lista =
        rubros.length === 1
          ? rubros[0]
          : `${rubros.slice(0, -1).join(", ")} y ${rubros[rubros.length - 1]}`;
      partes.push(
        `${nombre} trabaja en ${lista}${
          empresaDb.localidad ? ` desde ${empresaDb.localidad}` : ""
        }, en el partido de Almirante Brown`
      );
    } else if (empresaDb.localidad) {
      partes.push(`${nombre} está radicada en ${empresaDb.localidad}, Almirante Brown`);
    } else {
      partes.push(`${nombre} integra el directorio de la Unión Industrial de Almirante Brown`);
    }

    if (tagsEmpresa.length > 0) {
      const caps = tagsEmpresa.slice(0, 6).map((t) => t.nombre.toLocaleLowerCase("es"));
      partes.push(`Entre sus capacidades declaradas figuran ${caps.join(", ")}`);
    }

    partes.push("Es socia verificada de la UIAB y su ficha se puede contactar directo");
    return partes.join(". ") + ".";
  })();

  const empresa = {
    nombre: empresaDb.razon_social,
    categoria: mainCat,
    actividad: textoMostrado,
    logo: empresaDb.razon_social.charAt(0).toUpperCase(),
    logoUrl,
    ubicacion: [empresaDb.localidad, empresaDb.direccion].filter(Boolean).join(", ") || null,
    contacto: {
      email: empresaDb.email || "No disponible",
      emailCompras: empresaDb.email_compras || "",
      emailMantenimiento: empresaDb.email_mantenimiento || "",
      // El contacto es público (se ve sin cuenta): ese es el valor de ser socio.
      telefono: empresaDb.telefono || "",
      whatsapp: empresaDb.whatsapp || empresaDb.telefono || "",
      sitioWeb: empresaDb.sitio_web || "",
      sitiosWebAdicionales:
        normalizarSitiosWeb(empresaDb.sitios_web_adicionales, empresaDb.sitio_web) ?? [],
    }
  };

  /**
   * Resumen de la cabecera.
   *
   * Es `actividad` —el renglón que trajo el padrón— y NO la descripción larga:
   * esa vive en "Sobre la empresa", y ponerla arriba también dejaría el mismo
   * párrafo dos veces en la misma pantalla. Por eso sólo aparece cuando la
   * socia escribió su propia descripción; si no la escribió, `actividad` YA es
   * lo que se lee en "Sobre la empresa" y acá arriba sobra.
   */
  const resumenCabecera =
    (empresaDb.descripcion || "").trim() && (empresaDb.actividad || "").trim()
      ? normalizarMayusculas((empresaDb.actividad as string).trim())
      : null;

  const webNormalizada = normalizarSitioWeb(empresa.contacto.sitioWeb);
  const webVisible = webNormalizada ? textoDeWeb(webNormalizada) : "";
  // La principal primero: es la que va en la cabecera y en el directorio.
  const todasLasWebs = [
    ...(webNormalizada ? [webNormalizada] : []),
    ...empresa.contacto.sitiosWebAdicionales,
  ];
  const emailReal = (empresaDb.email || "").trim();

  /**
   * Columna de datos duros de la cabecera. Es lo que llena el 60% derecho que
   * antes estaba vacío, y cada fila sale de una columna de `empresas`: si el
   * dato no está cargado, la fila no existe (no hay "—" ni placeholders).
   */
  const datosCabecera: DatoCabecera[] = ([
    empresaDb.cantidad_empleados
      ? {
          icono: Users,
          etiqueta: "Empleados",
          valor: String(empresaDb.cantidad_empleados),
        }
      : null,
    webNormalizada
      ? { icono: Globe, etiqueta: "Sitio web", valor: webVisible, href: webNormalizada, externo: true }
      : null,
    emailReal
      ? { icono: Mail, etiqueta: "Email", valor: emailReal, href: `mailto:${emailReal}` }
      : null,
    empresa.contacto.telefono
      ? {
          icono: Phone,
          etiqueta: "Teléfono",
          valor: empresa.contacto.telefono,
          href: `tel:${empresa.contacto.telefono.replace(/[^0-9+]/g, "")}`,
        }
      : null,
  ] as (DatoCabecera | null)[]).filter((d): d is DatoCabecera => d !== null);

  /**
   * Franja de métricas: contesta "¿esta ficha tiene algo adentro?" antes de
   * scrollear. Todos los números son contadores de la base — ninguno se
   * escribe a mano (ver src/tests/seo/sin-datos-inventados.test.ts).
   */
  const metricasCabecera: MetricaCabecera[] = ([
    totalItems > 0
      ? {
          icono: PackageSearch,
          imagen: "/marca/ic-productos.png",
          valor: String(totalItems),
          etiqueta: totalItems === 1 ? "Producto o servicio" : "Productos y servicios",
        }
      : null,
    { icono: ShieldCheck, valor: "Verificada", etiqueta: "UIAB Conecta", conSello: true },
    cats.length > 0
      ? {
          icono: Layers,
          imagen: "/marca/ic-rubros.png",
          valor: String(cats.length),
          etiqueta: cats.length === 1 ? "Rubro" : "Rubros",
        }
      : null,
    tagsEmpresa.length > 0
      ? {
          icono: Tag,
          imagen: "/marca/ic-etiquetas.png",
          valor: String(tagsEmpresa.length),
          etiqueta: "Especialidades",
        }
      : null,
    certs.length > 0
      ? {
          icono: Award,
          imagen: "/marca/ic-certif.png",
          valor: String(certs.length),
          etiqueta: certs.length === 1 ? "Certificación" : "Certificaciones",
        }
      : null,
    promedioResenas !== null
      ? {
          icono: Star,
          imagen: "/marca/ic-resenas.png",
          valor: promedioResenas.toFixed(1),
          etiqueta: `${totalResenas} ${totalResenas === 1 ? "reseña" : "reseñas"}`,
        }
      : null,
  ] as (MetricaCabecera | null)[]).filter((m): m is MetricaCabecera => m !== null);

  return (
    <div className="min-h-svh bg-slate-50 font-inter pb-20">
      {/*
        La ficha de la propia UIAB NO emite Organization.
        El layout raíz ya declara la cámara con su `@id` en uiab.org, su NAP y
        sus redes; emitir acá un segundo Organization homónimo —con otro logo y
        otra localidad— reintroduce en un solo documento las dos entidades
        rivales que el grafo raíz acaba de desambiguar. La página se sigue
        indexando igual: lo que se omite es el marcado redundante, no el
        contenido.
      */}
      {!esEmpresaInstitucional(empresaDb.id) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              jsonLdOrganizacion({
                nombre: empresa.nombre,
                descripcion: empresa.actividad,
                localidad: empresaDb.localidad || null,
                provincia: empresaDb.provincia || null,
                logoUrl: empresa.logoUrl,
                sitioWeb: empresaDb.sitio_web || null,
                sitiosWebAdicionales: empresaDb.sitios_web_adicionales,
                url: `${SITE_URL}${currentPath}`,
                direccion: empresaDb.direccion || null,
                codigoPostal: empresaDb.codigo_postal ?? null,
                telefono: empresaDb.telefono || empresaDb.whatsapp || null,
                email: empresaDb.email || null,
                cuit: empresaDb.cuit || null,
                nombreComercial: empresaDb.nombre_comercial,
                // Rubros + etiquetas, que es exactamente lo que la ficha ya
                // muestra en "Servicios y especialidades".
                especialidades: [...cats, ...tagsEmpresa.map((t) => t.nombre)].filter(Boolean),
                catalogo: catalogoItems.map((it) => ({
                  nombre: it.nombre,
                  tipo: it.tipo_item,
                  descripcion: it.descripcion_corta || it.descripcion_larga,
                  imagen: it.imagenes?.[0]?.url ?? null,
                })),
                certificaciones: certs.map((c: CertFicha) => ({
                  etiqueta: etiquetaNorma(c.codigo_norma, c.nombre_libre),
                  organismo: c.organismo_certificador,
                  numero: c.numero_certificado,
                })),
              })
            ),
          }}
        />
      )}
      <RegistrarVisita tipo="empresa" entidadId={empresaDb.id} />

      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        {/*
          La miga reemplaza al "← Directorio" suelto que había en el hero.
          Mismo enlace, más jerarquía: agrega el rubro en el medio (otra vía
          hacia /rubros) y emite el BreadcrumbList, que es el único rich
          result que Google todavía muestra de forma consistente para un
          directorio — en el resultado se ve `uiabconecta.com › Directorio ›
          Química › Vaxler` en vez de la URL cruda.
        */}
        <Migas
          className="mb-4"
          migas={[
            { nombre: "Inicio", href: "/" },
            { nombre: "Directorio", href: "/directorio" },
            ...(rubrosConLanding[0]?.href
              ? [{ nombre: rubrosConLanding[0].nombre, href: rubrosConLanding[0].href }]
              : []),
            { nombre: empresa.nombre },
          ]}
        />

        {/* Cabecera: reemplaza a la franja azul de 320px + la barra blanca del
            logo. Los rubros van como <Link> a su landing cuando la tienen: el
            anchor text ya estaba escrito y se desperdiciaba en un <span>. */}
        <CabeceraFicha
          nombre={empresa.nombre}
          /* El texto salía de `empresa.categoria` (la primera categoría cruda)
             mientras el href salía de `rubrosConLanding[0]`: dos fuentes para
             un mismo enlace, que se desalineaban apenas la socia tenía varias
             categorías. Con landing mandan las dos cosas juntas. */
          rubroPrincipal={rubrosConLanding[0]?.href ? rubrosConLanding[0].nombre : empresa.categoria}
          rubroPrincipalHref={rubrosConLanding[0]?.href ?? null}
          selloEstado={{ icono: CheckCircle2, texto: "Verificado UIAB", conSello: true }}
          logoUrl={empresa.logoUrl}
          inicial={empresa.logo}
          ubicacion={empresa.ubicacion}
          resumen={resumenCabecera}
          rubros={rubrosConLanding.slice(1)}
          datos={datosCabecera}
          metricas={metricasCabecera}
          acento="blue"
          cta={
            <ModalContacto
              nombre={empresa.nombre}
              email={empresa.contacto.email}
              telefono={empresa.contacto.telefono}
              sitioWeb={empresa.contacto.sitioWeb}
              ubicacion={empresa.ubicacion ?? undefined}
              colorScheme="blue"
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white sm:w-auto px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#00213f] shadow-lg shadow-black/20 transition-colors hover:bg-blue-50"
            >
              <Mail className="h-4 w-4" />
              Contactar empresa
            </ModalContacto>
          }
        />

        <div className="mt-6 flex flex-col tab:flex-row gap-6 tab:gap-8">
          <main className="w-full tab:w-[62%] lg:w-[72%] min-w-0 space-y-6">
            {/*
              "Sobre la empresa" siempre se renderiza, y fuera del gate: es el
              único bloque de la ficha que dice a qué se dedica la empresa, y
              antes desaparecía entero cuando la actividad tenía 8 caracteres o
              menos. La frase derivada usa sólo columnas de la base (rubro,
              localidad, etiquetas) — nada inventado — y existe porque 53 de las
              59 descripciones tienen menos de 120 caracteres, o sea que sin
              ella la ficha comparte 60-72% de su texto con las demás.
            */}
            <section className={`${TARJETA} p-5 sm:p-7`}>
              <CabeceraSeccion icono={Building2} titulo="Sobre la empresa" accent="blue" />
              {empresa.actividad && (
                <p className="text-slate-700 font-medium leading-relaxed text-[15px]">
                  {empresa.actividad}
                </p>
              )}
              {resumenDerivado && (
                <p
                  className={`text-slate-600 leading-relaxed text-[14.5px] ${empresa.actividad ? "mt-3" : ""}`}
                >
                  {resumenDerivado}
                </p>
              )}
            </section>

            {/*
              Los chips de rubro se fueron ARRIBA, a la cabecera, y con su
              enlace a la landing puesto: acá abajo repetían literalmente los
              mismos seis nombres que se acababan de leer en el hero. Lo que
              queda es lo que la cabecera no muestra — las capacidades
              declaradas, que son las que alimentan la búsqueda del directorio.
            */}
            {tieneTags && (
              <section className={`${TARJETA} p-5 sm:p-7`}>
                <CabeceraSeccion icono={Wrench} titulo="Especialidades y capacidades" accent="blue" />
                <div className="flex flex-wrap gap-1.5">
                  {tagsEmpresa.map((tag) => (
                    <span
                      key={tag.nombre}
                      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium text-slate-600"
                    >
                      <Tag className="h-3 w-3 text-slate-400" />
                      {tag.nombre}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Contenido público.
                Estaba detrás de `isAuthenticated`. El gate que iba acá abajo
                prometía "el catálogo completo, reseñas y datos de contacto" —
                y el contacto ya se veía sin cuenta tres centímetros a la
                derecha, así que además de esconder el mejor contenido de la
                ficha, mentía sobre lo que escondía. */}
              {catalogoItems.length > 0 && (
                <CatalogoPublico
                  items={catalogoItems}
                  colorScheme="blue"
                  contacto={{
                    nombre: empresa.nombre,
                    email: empresaDb.email || null,
                    whatsapp: empresa.contacto.whatsapp || null,
                  }}
                />
              )}

              {oportunidadesActivas.length > 0 && (
                <section className={`${TARJETA} overflow-hidden`}>
                  <div className="px-5 pt-5 sm:px-7 sm:pt-7">
                    <CabeceraSeccion
                      icono={Briefcase}
                      titulo={`Oportunidades publicadas (${oportunidadesActivas.length})`}
                      accent="blue"
                      extra={
                        <Link href="/oportunidades" className="group flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.15em] text-slate-400 transition-colors hover:text-blue-600">
                          Ver todas
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      }
                    />
                  </div>

                  <ul className="divide-y divide-slate-100 border-t border-slate-100">
                    {oportunidadesActivas.map((op: any) => (
                      <li key={op.id}>
                        <Link href={`/oportunidades/${op.id}`} className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50 sm:px-7">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[#00213f] font-bold text-[15px] leading-snug group-hover:text-blue-700 transition-colors truncate">{op.titulo}</h4>
                            <p className="text-slate-500 text-[12px] font-medium mt-0.5">
                              <span className="text-slate-600">{(op.categoria as any)?.nombre || "Industrial"}</span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>{new Date(op.creado_en).toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] sm:text-[10px] font-bold uppercase tracking-wider rounded-sm border border-emerald-200">
                              Abierta
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div data-tour="ficha-resenas">
                <ResenasPerfil resenasAprobadas={finalResenas} targetType="empresa" targetId={empresaDb.id} />
              </div>


            {/* ─── "Esta ficha es mía" ───
                Sólo aparece si NADIE de la empresa tiene cuenta todavía. Son 35
                de las 59 fichas: la UIAB las cargó del padrón y la empresa nunca
                se enteró de que existen. Es el patrón "reclamar este perfil" de
                Google Business Profile — el punto de entrada va donde la persona
                ya está mirando su propia empresa, no escondido en /sumate.
                En cuanto alguien de la empresa entra, el bloque desaparece solo. */}
            {sinDueno && (
              <section className={`${TARJETA} p-5 sm:p-7`}>
                <h2 className="font-manrope text-lg font-bold tracking-tight text-[#00213f]">
                  ¿Trabajás en {empresa.nombre}?
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                  Esta ficha todavía no la maneja nadie de la empresa. Pedí el acceso y vas a poder
                  editar los datos, subir el logo y contar a qué se dedican.
                </p>
                <Link
                  href={`/reclamar/${empresaDb.id}`}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#00213f] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[#10375c]"
                >
                  Pedir el acceso a esta ficha
                </Link>
              </section>
            )}
          </main>

          <aside className="w-full tab:w-[38%] lg:w-[28%]">
            {/* top-20 = alto del header (h-16 lg:h-20), el canon del repo */}
            <div className="sticky top-20 space-y-6">
              <div data-tour="ficha-sidebar-contacto" className={`${TARJETA} overflow-hidden`}>
                <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
                  <h3 className="font-manrope text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Información de contacto
                  </h3>
                </div>

                <ul className="space-y-5 p-5">
                  {empresa.ubicacion && (
                    <li className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Ubicación</p>
                        <p className="text-slate-700 font-semibold text-[14px] leading-snug">{empresa.ubicacion}</p>
                      </div>
                    </li>
                  )}

                  {/* Sin correo cargado no se renderiza la fila: antes salía
                      "No disponible" apuntando a `mailto:No disponible`, un
                      enlace roto que además era la única fila de la tarjeta en
                      las fichas sin datos. */}
                  {emailReal && (
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo</p>
                        <a href={`mailto:${emailReal}`} className="text-blue-700 font-semibold text-[14px] hover:text-blue-900 transition-colors break-all">
                          {emailReal}
                        </a>
                      </div>
                    </li>
                  )}

                  {empresa.contacto.emailCompras && (
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo de compras</p>
                        <a href={`mailto:${empresa.contacto.emailCompras}`} className="text-blue-700 font-semibold text-[14px] hover:text-blue-900 transition-colors break-all">
                          {empresa.contacto.emailCompras}
                        </a>
                      </div>
                    </li>
                  )}

                  {empresa.contacto.emailMantenimiento && (
                    <li className="flex items-start gap-3">
                      <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo de mantenimiento</p>
                        <a href={`mailto:${empresa.contacto.emailMantenimiento}`} className="text-blue-700 font-semibold text-[14px] hover:text-blue-900 transition-colors break-all">
                          {empresa.contacto.emailMantenimiento}
                        </a>
                      </div>
                    </li>
                  )}

                  {empresa.contacto.telefono && (
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Teléfono</p>
                        <a href={`tel:${empresa.contacto.telefono.replace(/[^0-9+]/g, '')}`} className="text-slate-700 font-semibold text-[14px] hover:text-blue-900 transition-colors">
                          {empresa.contacto.telefono}
                        </a>
                      </div>
                    </li>
                  )}

                  {empresa.contacto.whatsapp && (
                    <li>
                      <BotonWhatsApp telefono={empresa.contacto.whatsapp} nombre={empresa.nombre} variant="compact" />
                    </li>
                  )}

                  {todasLasWebs.length > 0 && (
                    <li className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                          {todasLasWebs.length > 1 ? "Sitios web" : "Sitio web"}
                        </p>
                        <div className="flex flex-col gap-1">
                          {todasLasWebs.map((web) => (
                            <a key={web} href={web} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold text-[14px] hover:text-blue-900 transition-colors break-all">
                              {textoDeWeb(web)}
                            </a>
                          ))}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>

                {emailReal ? (
                  <div className="px-5 pb-5">
                    <a
                      href={`mailto:${emailReal}`}
                      className="flex w-full items-center justify-center rounded-lg bg-[#00213f] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#10375c]"
                    >
                      Enviar mensaje
                    </a>
                  </div>
                ) : (
                  <p className="px-5 pb-5 text-[12.5px] leading-relaxed text-slate-500">
                    Esta socia todavía no cargó datos de contacto públicos.{" "}
                    <Link href="/contacto" className="font-semibold text-blue-700 hover:underline">
                      Escribinos
                    </Link>{" "}
                    y te ponemos en contacto.
                  </p>
                )}
              </div>

              <PanelCertificaciones certs={certs} accent="blue" />
            </div>
          </aside>
        </div>

        {/*
          Empresas hermanas. Antes cada ficha era una hoja terminal: 0 enlaces
          salientes hacia otras fichas, así que el enlace interno entraba por
          /directorio y ahí se moría. Estos 4-6 enlaces por ficha hacen que el
          rastreo circule entre pares del mismo rubro.
        */}
        {hermanas.length > 0 && (
          <section
            aria-labelledby="empresas-relacionadas"
            className="mt-14 pt-10 border-t border-slate-200"
          >
            <h2
              id="empresas-relacionadas"
              className="font-manrope text-xl font-black text-[#00213f] tracking-tight mb-1"
            >
              Otras empresas de {(rubrosConLanding[0]?.nombre ?? mainCat).toLocaleLowerCase("es")} en Almirante Brown
            </h2>
            <p className="text-[14px] text-slate-500 mb-6">
              Socias de la UIAB que comparten rubro con {empresa.nombre}.
            </p>
            {/* Con el logo al lado del nombre: en un directorio, la marca es lo
                que la gente reconoce antes de leer la razón social. La placa
                blanca resuelve los logos guardados como JPG con fondo blanco, y
                cuando no hay logo cargado queda la inicial. */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hermanas.map((h) => (
                <li key={h.slug}>
                  <Link
                    href={`/empresas/${h.slug}`}
                    className="flex h-full items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1.5">
                      {h.logoUrl ? (
                        <Image
                          src={h.logoUrl}
                          alt=""
                          width={96}
                          height={96}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="font-manrope text-lg font-black text-slate-300">
                          {h.nombre.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-[14.5px] leading-snug text-[#00213f]">
                        {h.nombre}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-slate-500">
                        {[h.rubro, h.localidad].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {rubrosConLanding[0]?.href && (
              <Link
                href={rubrosConLanding[0].href}
                className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue-700 hover:underline"
              >
                Ver todo el rubro {rubrosConLanding[0].nombre}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVEEDOR / PARTICULAR PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function ProveedorProfile({
  provDb,
  currentPath,
}: {
  provDb: any;
  currentPath: string;
}) {
  // Ver el comentario de EmpresaProfile: el cliente no viaja por prop.
  const supabase = createAdminClient();
  const displayName = nombreDeFichaParticular(provDb) || "Sin nombre";
  const personalName = [provDb.nombre, provDb.apellido].filter(Boolean).join(" ");
  const cats = provDb.proveedores_categorias?.map((pc: any) => pc.categorias?.nombre).filter(Boolean) || [];
  const mainCat = provDb.tipo_proveedor || (cats.length > 0 ? cats[0] : "Prestador de servicios");
  const logoUrl = provDb.bucket_logo && provDb.ruta_logo
    ? supabase.storage.from(provDb.bucket_logo).getPublicUrl(provDb.ruta_logo).data.publicUrl
    : null;

  // Certificaciones: contenido público, fuera del gate de auth.
  const certs = await fetchCertificaciones(supabase, "proveedor_id", provDb.id);

  // Mismas señales públicas que la ficha de empresa (ver el comentario allá).
  const [resenasPub, itemsPub] = await Promise.all([
    supabase
      .from("resenas")
      .select("calificacion")
      .eq("proveedor_resenado_id", provDb.id)
      .eq("estado", "aprobada"),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("proveedor_id", provDb.id)
      .eq("estado", "publicado"),
  ]);

  const notas = (resenasPub.data ?? []).map((r: any) => Number(r.calificacion)).filter(Number.isFinite);
  const totalResenas = notas.length;
  const promedioResenas =
    totalResenas > 0 ? notas.reduce((a: number, b: number) => a + b, 0) / totalResenas : null;
  const totalItems = itemsPub.count ?? 0;

  // Los prestadores de servicios no son calificados: no se traen reseñas.
  let catalogoItems: CatalogoItem[] = [];

  // Público, igual que en las fichas de empresa: los ítems tienen
  // `estado = 'publicado'` y su texto es lo único propio que tiene la ficha.
  catalogoItems = await fetchCatalogoItems(supabase, "provider", provDb.id);

  const proveedor = {
    nombre: displayName,
    nombrePersonal: personalName,
    categoria: mainCat,
    descripcionCorta: provDb.descripcion || "Prestador de servicios particular",
    descripcionLarga: provDb.descripcion
      ? provDb.descripcion
      : `Profesional independiente registrado en el ecosistema de UIAB.${mainCat ? ` Especialista en ${mainCat.toLowerCase()}.` : ''}`,
    logo: displayName.charAt(0).toUpperCase(),
    logoUrl,
    ubicacion: [provDb.localidad, provDb.provincia].filter(Boolean).join(", ") || "Sin ubicación",
    servicios: cats.length > 0 ? cats : (provDb.tipo_proveedor ? [provDb.tipo_proveedor] : ["Servicios Generales"]),
    contacto: {
      email: provDb.email || "No disponible",
      emailCompras: provDb.email_compras || "",
      emailMantenimiento: provDb.email_mantenimiento || "",
      telefono: provDb.telefono || "",
      sitioWeb: provDb.sitio_web || "",
      sitiosWebAdicionales:
        normalizarSitiosWeb(provDb.sitios_web_adicionales, provDb.sitio_web) ?? [],
    }
  };

  const añosExperiencia =
    provDb.fecha_inicio_experiencia != null
      ? Math.floor(
          (Date.now() - new Date(provDb.fecha_inicio_experiencia).getTime()) /
            (365.25 * 24 * 3600 * 1000)
        )
      : null;

  const webNormalizada = normalizarSitioWeb(proveedor.contacto.sitioWeb);
  const webVisible = webNormalizada ? textoDeWeb(webNormalizada) : "";
  // La principal primero: es la que va en la cabecera y en el directorio.
  const todasLasWebs = [
    ...(webNormalizada ? [webNormalizada] : []),
    ...proveedor.contacto.sitiosWebAdicionales,
  ];
  const emailReal = (provDb.email || "").trim();

  const datosCabecera: DatoCabecera[] = ([
    añosExperiencia != null
      ? {
          icono: Clock,
          etiqueta: "Experiencia",
          valor: `${añosExperiencia} año${añosExperiencia !== 1 ? "s" : ""}`,
        }
      : null,
    webNormalizada
      ? { icono: Globe, etiqueta: "Sitio web", valor: webVisible, href: webNormalizada, externo: true }
      : null,
    emailReal
      ? { icono: Mail, etiqueta: "Email", valor: emailReal, href: `mailto:${emailReal}` }
      : null,
    proveedor.contacto.telefono
      ? {
          icono: Phone,
          etiqueta: "Teléfono",
          valor: proveedor.contacto.telefono,
          href: `tel:${proveedor.contacto.telefono.replace(/[^0-9+]/g, "")}`,
        }
      : null,
  ] as (DatoCabecera | null)[]).filter((d): d is DatoCabecera => d !== null);

  const metricasCabecera: MetricaCabecera[] = ([
    totalItems > 0
      ? {
          icono: PackageSearch,
          imagen: "/marca/ic-productos.png",
          valor: String(totalItems),
          etiqueta: totalItems === 1 ? "Producto o servicio" : "Productos y servicios",
        }
      : null,
    { icono: ShieldCheck, valor: "Verificado", etiqueta: "UIAB Conecta", conSello: true },
    cats.length > 0
      ? {
          icono: Layers,
          imagen: "/marca/ic-rubros.png",
          valor: String(cats.length),
          etiqueta: cats.length === 1 ? "Rubro" : "Rubros",
        }
      : null,
    certs.length > 0
      ? {
          icono: Award,
          imagen: "/marca/ic-certif.png",
          valor: String(certs.length),
          etiqueta: certs.length === 1 ? "Certificación" : "Certificaciones",
        }
      : null,
    promedioResenas !== null
      ? {
          icono: Star,
          imagen: "/marca/ic-resenas.png",
          valor: promedioResenas.toFixed(1),
          etiqueta: `${totalResenas} ${totalResenas === 1 ? "reseña" : "reseñas"}`,
        }
      : null,
  ] as (MetricaCabecera | null)[]).filter((m): m is MetricaCabecera => m !== null);

  return (
    <div className="min-h-svh bg-[#f7f9fb] font-inter pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLdOrganizacion({
              nombre: proveedor.nombre,
              descripcion: provDb.descripcion || null,
              localidad: provDb.localidad || null,
              provincia: provDb.provincia || null,
              logoUrl: proveedor.logoUrl,
              sitioWeb: provDb.sitio_web || null,
              sitiosWebAdicionales: provDb.sitios_web_adicionales,
              url: `${SITE_URL}${currentPath}`,
              telefono: provDb.telefono || null,
              email: provDb.email || null,
            })
          ),
        }}
      />
      <RegistrarVisita tipo="proveedor" entidadId={provDb.id} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6">
        <Migas
          className="mb-4"
          migas={[
            { nombre: "Inicio", href: "/" },
            { nombre: "Directorio", href: "/directorio" },
            { nombre: proveedor.nombre },
          ]}
        />

        {/* Misma cabecera que la ficha de empresa, con dos diferencias: el
            acento ámbar del prestador y el retrato redondo — la imagen de un
            particular es una foto, no un logotipo. */}
        <CabeceraFicha
          nombre={proveedor.nombre}
          subtitulo={
            proveedor.nombrePersonal && proveedor.nombrePersonal !== proveedor.nombre
              ? proveedor.nombrePersonal
              : null
          }
          rubroPrincipal={proveedor.categoria}
          selloEstado={{ icono: User, texto: "Particular" }}
          logoUrl={proveedor.logoUrl}
          inicial={proveedor.logo}
          logoRedondo
          ubicacion={proveedor.ubicacion}
          rubros={cats
            .filter((c: string) => c !== proveedor.categoria)
            .map((c: string) => ({ nombre: c, href: null }))}
          datos={datosCabecera}
          metricas={metricasCabecera}
          acento="amber"
          cta={
            <ModalContacto
              nombre={proveedor.nombre}
              email={proveedor.contacto.email}
              telefono={proveedor.contacto.telefono}
              sitioWeb={proveedor.contacto.sitioWeb}
              ubicacion={proveedor.ubicacion ?? undefined}
              colorScheme="amber"
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white sm:w-auto px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#7a4419] shadow-lg shadow-black/20 transition-colors hover:bg-[#fdf3ea]"
            >
              <Mail className="h-4 w-4" />
              Contactar
            </ModalContacto>
          }
        />

        <div className="mt-6 flex flex-col tab:flex-row gap-6 tab:gap-8">
          <main className="w-full tab:w-[60%] lg:w-[65%] min-w-0 space-y-6">
            {/* Always visible for SEO */}
            <section className={`${TARJETA} p-5 sm:p-7`}>
              <CabeceraSeccion icono={Wrench} titulo="Perfil profesional" accent="amber" />
              <h3 className="font-manrope text-lg font-bold text-[#191c1e] mb-3 leading-snug">{proveedor.descripcionCorta}</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-[15px]">{proveedor.descripcionLarga}</p>
            </section>

            <section className={`${TARJETA} p-5 sm:p-7`}>
              <CabeceraSeccion icono={Briefcase} titulo="Servicios y especialidades" accent="amber" />
              <div className="flex flex-wrap gap-2">
                {proveedor.servicios.map((servicio: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-semibold transition-colors hover:border-[#bf7035]/30 hover:bg-[#bf7035]/5 hover:text-[#bf7035]"
                  >
                    {servicio}
                  </span>
                ))}
              </div>
            </section>

            {/* Catálogo público — los prestadores no reciben reseñas */}
            {catalogoItems.length > 0 && (
              <CatalogoPublico
                items={catalogoItems}
                colorScheme="amber"
                contacto={{
                  nombre: proveedor.nombre,
                  email: provDb.email || null,
                  whatsapp: provDb.telefono || null,
                }}
              />
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full tab:w-[40%] lg:w-[35%]">
            {/* top-20 = alto del header (h-16 lg:h-20), el canon del repo */}
            <div className="sticky top-20 space-y-6">
              <div className={`${TARJETA} overflow-hidden`}>
                <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
                  <h3 className="font-manrope text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Información de contacto
                  </h3>
                </div>

                <ul className="space-y-5 p-5">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Ubicación</p>
                      <p className="text-[#191c1e] font-semibold text-[14px]">{proveedor.ubicacion}</p>
                    </div>
                  </li>

                  {añosExperiencia != null && (
                    <li className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Experiencia</p>
                        <p className="text-[#191c1e] font-semibold text-[14px]">{añosExperiencia} año{añosExperiencia !== 1 ? 's' : ''}</p>
                      </div>
                    </li>
                  )}

                  {emailReal && (
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo electrónico</p>
                        <a href={`mailto:${emailReal}`} className="text-[#bf7035] font-semibold text-[14px] hover:text-[#a0622c] transition-colors break-all">
                          {emailReal}
                        </a>
                      </div>
                    </li>
                  )}

                  {proveedor.contacto.emailCompras && (
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo de compras</p>
                        <a href={`mailto:${proveedor.contacto.emailCompras}`} className="text-[#bf7035] font-semibold text-[14px] hover:text-[#a0622c] transition-colors break-all">
                          {proveedor.contacto.emailCompras}
                        </a>
                      </div>
                    </li>
                  )}

                  {proveedor.contacto.emailMantenimiento && (
                    <li className="flex items-start gap-3">
                      <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo de mantenimiento</p>
                        <a href={`mailto:${proveedor.contacto.emailMantenimiento}`} className="text-[#bf7035] font-semibold text-[14px] hover:text-[#a0622c] transition-colors break-all">
                          {proveedor.contacto.emailMantenimiento}
                        </a>
                      </div>
                    </li>
                  )}

                  {proveedor.contacto.telefono && (
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Teléfono</p>
                        <a href={`tel:${proveedor.contacto.telefono.replace(/[^0-9+]/g, '')}`} className="text-[#191c1e] font-semibold text-[14px] hover:text-[#10375c] transition-colors">
                          {proveedor.contacto.telefono}
                        </a>
                      </div>
                    </li>
                  )}

                  {proveedor.contacto.telefono && (
                    <li>
                      <BotonWhatsApp telefono={proveedor.contacto.telefono} nombre={proveedor.nombre} variant="compact" />
                    </li>
                  )}

                  {todasLasWebs.length > 0 && (
                    <li className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                          {todasLasWebs.length > 1 ? "Sitios web" : "Sitio web"}
                        </p>
                        <div className="flex flex-col gap-1">
                          {todasLasWebs.map((web) => (
                            <a key={web} href={web} target="_blank" rel="noopener noreferrer" className="text-[#bf7035] font-semibold text-[14px] hover:text-[#a0622c] transition-colors break-all">
                              {textoDeWeb(web)}
                            </a>
                          ))}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>

                {emailReal && (
                  <div className="px-5 pb-5">
                    <a
                      href={`mailto:${emailReal}`}
                      className="flex w-full items-center justify-center rounded-lg bg-[#bf7035] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#a0622c]"
                    >
                      Contactar
                    </a>
                  </div>
                )}
              </div>

              <PanelCertificaciones certs={certs} accent="amber" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
