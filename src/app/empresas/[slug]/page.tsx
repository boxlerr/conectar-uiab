import { createClient as createServerClient } from "@/lib/supabase/servidor";
import { createClient } from "@supabase/supabase-js";
import { crearSlug } from "@/lib/utilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResenasPerfil } from "@/components/ui/directorio/ResenasPerfil";
import { CatalogoPublico, type CatalogoItem } from "@/components/ui/directorio/catalogo-publico";
import { ModalContacto } from "@/components/ui/directorio/modal-contacto";
import { MapPin, Mail, Phone, Globe, CheckCircle2, ArrowLeft, Building2, Wrench, User, Briefcase, ArrowRight, Clock, Lock, Tag, Award } from "lucide-react";
import { ChipNorma } from "@/modulos/certificaciones/chip-norma";
import { etiquetaNorma, familiaNorma, normaPorCodigo, estadoVigencia } from "@/modulos/certificaciones/normas";
import Image from "next/image";
import { BotonWhatsApp } from "@/components/ui/boton-whatsapp";
import { RegistrarVisita } from "@/components/ui/registrar-visita";
import type { Metadata } from "next";

const SITE_URL = "https://www.uiabconecta.com";

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
  codigo_norma: string;
  nombre_libre: string | null;
  verificada: boolean;
  alcance: string | null;
  organismo_certificador: string | null;
  numero_certificado: string | null;
  fecha_vencimiento: string | null;
}

async function fetchCertificaciones(
  supabase: any,
  key: "empresa_id" | "proveedor_id",
  id: string
): Promise<CertFicha[]> {
  const { data } = await supabase
    .from("certificaciones")
    .select(
      "codigo_norma, nombre_libre, verificada, alcance, organismo_certificador, numero_certificado, fecha_vencimiento"
    )
    .eq(key, id)
    .order("verificada", { ascending: false });
  return (data as CertFicha[]) ?? [];
}

// Sección pública "Certificaciones y normas". Contenido público de alto valor:
// va FUERA del gate de login. accent = "blue" (empresas) | "amber" (prestadores).
function SeccionCertificaciones({ certs, accent }: { certs: CertFicha[]; accent: "blue" | "amber" }) {
  if (certs.length === 0) return null;
  const iconColor = accent === "amber" ? "text-[#bf7035]" : "text-blue-600";

  return (
    <section className="bg-white p-7 rounded-md border border-slate-200">
      <div className="flex items-center gap-2.5 mb-5">
        <Award className={`w-4 h-4 ${iconColor}`} />
        <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
          Certificaciones y normas
        </h2>
      </div>
      <div className="space-y-4">
        {certs.map((c, idx) => {
          const etiqueta = etiquetaNorma(c.codigo_norma, c.nombre_libre);
          const familia = familiaNorma(c.codigo_norma);
          const n = normaPorCodigo(c.codigo_norma);
          const estado = estadoVigencia(c.fecha_vencimiento);
          return (
            <div key={idx} className={idx > 0 ? "pt-4 border-t border-slate-100" : ""}>
              <div className="flex flex-wrap items-center gap-2">
                <ChipNorma etiqueta={etiqueta} familia={familia} verificada={c.verificada} size="md" />
                {c.verificada && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verificada por UIAB
                  </span>
                )}
                {c.fecha_vencimiento && estado === "vencida" && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Vencida</span>
                )}
                {c.fecha_vencimiento && estado === "por_vencer" && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Vence pronto</span>
                )}
              </div>
              {n && n.codigo !== "otra" && (
                <p className="text-[14px] font-semibold text-slate-800 mt-2">{n.nombre}</p>
              )}
              {c.alcance && <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{c.alcance}</p>}
              {(c.organismo_certificador || c.numero_certificado) && (
                <p className="text-[12px] text-slate-400 mt-1.5">
                  {c.organismo_certificador && <>Certificada por {c.organismo_certificador}</>}
                  {c.organismo_certificador && c.numero_certificado && " · "}
                  {c.numero_certificado && <>Cert. N° {c.numero_certificado}</>}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-5 pt-4 border-t border-slate-100 leading-relaxed">
        Certificaciones declaradas por cada empresa. Las marcadas como verificadas fueron cotejadas
        por la UIAB contra el certificado original. La UIAB no emite ni audita certificaciones.
      </p>
    </section>
  );
}

// ── Gate overlay shown to unauthenticated visitors ──
function LoginGate({ currentPath }: { currentPath: string }) {
  return (
    <div className="relative">
      {/* Blurred preview rows */}
      <div className="pointer-events-none select-none" aria-hidden>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-md bg-slate-100 mb-3 blur-sm opacity-60" />
        ))}
      </div>

      {/* CTA card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-8 py-7 text-center max-w-sm w-full mx-4">
          <div className="w-10 h-10 bg-[#00213f]/8 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-[#00213f]" />
          </div>
          <h3 className="font-manrope font-bold text-[#00213f] text-base mb-1">
            Contenido exclusivo para miembros
          </h3>
          <p className="text-slate-500 text-[13px] mb-5 leading-relaxed">
            Ingresá para ver el catálogo completo, reseñas y datos de contacto.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(currentPath)}`}
            className="flex items-center justify-center w-full bg-[#00213f] hover:bg-[#10375c] px-5 py-2.5 text-xs font-bold text-white rounded transition-colors tracking-[0.15em] uppercase mb-2"
          >
            Ingresar
          </Link>
          <Link
            href={`/register?redirect=${encodeURIComponent(currentPath)}`}
            className="flex items-center justify-center w-full border border-slate-200 hover:border-[#00213f] px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-[#00213f] rounded transition-colors tracking-[0.15em] uppercase"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── SEO: datos mínimos por slug (empresa o proveedor) para metadata + JSON-LD ──
async function datosSeoPorSlug(slug: string) {
  const db = createAdminClient();

  const { data: empresas } = await db
    .from("empresas")
    .select("razon_social, actividad, descripcion, localidad, provincia, sitio_web, bucket_logo, ruta_logo")
    .eq("estado", "aprobada");
  const emp = empresas?.find((e: any) => crearSlug(e.razon_social) === slug);
  if (emp) {
    return {
      esProveedor: false,
      nombre: emp.razon_social as string,
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
    const dn = p.nombre_comercial || [p.nombre, p.apellido].filter(Boolean).join(" ") || "";
    return crearSlug(dn) === slug;
  });
  if (prov) {
    const dn = prov.nombre_comercial || [prov.nombre, prov.apellido].filter(Boolean).join(" ");
    return {
      esProveedor: true,
      nombre: dn as string,
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
    return { title: "Perfil no encontrado | UIAB Conecta", robots: { index: false, follow: true } };
  }
  const rolTitulo = d.esProveedor ? "Prestador verificado UIAB" : "Empresa socia UIAB";
  const ubic = d.localidad ? ` en ${d.localidad}${d.provincia ? ", " + d.provincia : ""}` : "";
  // El layout raíz agrega " | UIAB Conecta" vía template; `title` no debe repetirlo.
  const title = `${d.nombre} — ${rolTitulo}`;
  const tituloCompleto = `${title} | UIAB Conecta`;
  const description = `${d.nombre}${d.descripcion ? ": " + d.descripcion : ""}. ${
    d.esProveedor ? "Prestador de productos y servicios verificado" : "Empresa socia registrada"
  } en la Unión Industrial de Almirante Brown (UIAB)${ubic}. Perfil oficial verificado en UIAB Conecta.`.slice(0, 300);
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

// JSON-LD Organization: le dice a Google que la empresa está registrada y es
// miembro de la UIAB (memberOf). Ayuda a que al buscar su nombre aparezca su
// ficha en UIAB Conecta con datos estructurados.
function jsonLdOrganizacion(opts: {
  nombre: string;
  descripcion: string | null;
  localidad: string | null;
  provincia: string | null;
  logoUrl: string | null;
  sitioWeb: string | null;
  url: string;
}) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.nombre,
    url: opts.url,
    ...(opts.descripcion ? { description: opts.descripcion } : {}),
    ...(opts.logoUrl ? { logo: opts.logoUrl, image: opts.logoUrl } : {}),
    ...(opts.sitioWeb
      ? { sameAs: [opts.sitioWeb.startsWith("http") ? opts.sitioWeb : `https://${opts.sitioWeb}`] }
      : {}),
    ...(opts.localidad
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: opts.localidad,
            ...(opts.provincia ? { addressRegion: opts.provincia } : {}),
            addressCountry: "AR",
          },
        }
      : {}),
    memberOf: {
      "@type": "Organization",
      name: "Unión Industrial de Almirante Brown",
      alternateName: "UIAB",
      url: SITE_URL,
    },
  };
  return jsonLd;
}

export default async function EmpresaProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Auth check and the empresas fetch are independent → run them in parallel
  const serverClient = await createServerClient();
  const supabase = createAdminClient();

  const [{ data: { user } }, { data: empresasData }] = await Promise.all([
    serverClient.auth.getUser(),
    supabase
      .from('empresas')
      .select(`
        id,
        razon_social,
        direccion,
        localidad,
        provincia,
        actividad,
        descripcion,
        sitio_web,
        email,
        telefono,
        whatsapp,
        referente,
        bucket_logo,
        ruta_logo,
        empresas_categorias (
          categorias (
            nombre
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

  const isAuthenticated = !!user;

  const empresaDb = empresasData?.find((emp: any) => crearSlug(emp.razon_social) === slug);

  if (!empresaDb) {
    const { data: provData } = await supabase
      .from('proveedores')
      .select(`
        id,
        nombre,
        apellido,
        nombre_comercial,
        tipo_proveedor,
        email,
        telefono,
        localidad,
        provincia,
        descripcion,
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
      const displayName =
        p.nombre_comercial ||
        [p.nombre, p.apellido].filter(Boolean).join(" ") ||
        "Sin nombre";
      return crearSlug(displayName) === slug;
    });

    if (!provDb) {
      notFound();
    }

    return (
      <ProveedorProfile
        provDb={provDb}
        supabase={supabase}
        isAuthenticated={isAuthenticated}
        currentPath={`/empresas/${slug}`}
      />
    );
  }

  return (
    <EmpresaProfile
      empresaDb={empresaDb}
      supabase={supabase}
      isAuthenticated={isAuthenticated}
      currentPath={`/empresas/${slug}`}
    />
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPRESA PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function EmpresaProfile({
  empresaDb,
  supabase,
  isAuthenticated,
  currentPath,
}: {
  empresaDb: any;
  supabase: any;
  isAuthenticated: boolean;
  currentPath: string;
}) {
  const cats = empresaDb.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
  const mainCat = cats.length > 0 ? cats[0] : "General";
  const logoUrl = empresaDb.bucket_logo && empresaDb.ruta_logo
    ? supabase.storage.from(empresaDb.bucket_logo).getPublicUrl(empresaDb.ruta_logo).data.publicUrl
    : null;

  // Certificaciones: contenido público (se ve sin cuenta). Query O(1) por id,
  // fuera del gate de auth.
  const certs = await fetchCertificaciones(supabase, "empresa_id", empresaDb.id);

  // Only fetch heavy data when authenticated to avoid wasted DB calls
  let finalResenas: any[] = [];
  let oportunidadesActivas: any[] = [];
  let catalogoItems: CatalogoItem[] = [];

  if (isAuthenticated) {
    // The three authenticated fetches are independent → run them in parallel
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
  const tieneActividadReal = textoEmpresa.length > 8;
  const serviciosExtra = cats.slice(1);
  const tieneServiciosReales = serviciosExtra.length > 0;

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

  const empresa = {
    nombre: empresaDb.razon_social,
    categoria: mainCat,
    actividad: tieneActividadReal ? textoEmpresa : null,
    logo: empresaDb.razon_social.charAt(0).toUpperCase(),
    logoUrl,
    ubicacion: [empresaDb.localidad, empresaDb.direccion].filter(Boolean).join(", ") || null,
    servicios: serviciosExtra,
    contacto: {
      email: empresaDb.email || "No disponible",
      // El contacto es público (se ve sin cuenta): ese es el valor de ser socio.
      telefono: empresaDb.telefono || "",
      whatsapp: empresaDb.whatsapp || empresaDb.telefono || "",
      sitioWeb: empresaDb.sitio_web || ""
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20">
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
              url: `${SITE_URL}${currentPath}`,
            })
          ),
        }}
      />
      <RegistrarVisita tipo="empresa" entidadId={empresaDb.id} />
      {/* Hero — always visible for SEO */}
      <div className="relative h-[320px] flex items-end overflow-hidden -mt-24 pt-24">
        <div className="absolute inset-0 z-0">
          <Image src="/landing/hero-industrial.webp" alt="" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/90 to-[#10375c]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] via-[#00213f]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pb-10">
          <Link href="/directorio" className="inline-flex items-center text-blue-200/70 hover:text-white mb-6 transition-colors text-[11px] font-bold tracking-[0.2em] uppercase">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Directorio
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-[0.15em]">
              {empresa.categoria}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/10 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.15em]">
              <CheckCircle2 className="w-3 h-3 text-blue-300" />
              Verificado UIAB
            </span>
          </div>

          <h1 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.05] tracking-tight max-w-3xl">
            {empresa.nombre}
          </h1>
        </div>
      </div>

      {/* Identity bar — always visible */}
      <div data-tour="ficha-identidad" className="border-b border-slate-200 bg-white">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 bg-white border border-slate-200 flex items-center justify-center font-manrope font-black text-4xl text-[#00213f] shrink-0 overflow-hidden rounded-md shadow-sm">
            {empresa.logoUrl ? (
              <Image src={empresa.logoUrl} alt={empresa.nombre} width={80} height={80} className="object-contain w-full h-full p-1.5" />
            ) : (
              empresa.logo
            )}
          </div>
          <div className="flex-1 min-w-[200px] flex flex-wrap gap-x-8 gap-y-3 items-center text-sm">
            {empresa.ubicacion && (
              <span className="inline-flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{empresa.ubicacion}</span>
              </span>
            )}
            {empresa.contacto.sitioWeb && (
              <a
                href={empresa.contacto.sitioWeb.match(/^https?:\/\//) ? empresa.contacto.sitioWeb : `https://${empresa.contacto.sitioWeb}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold transition-colors"
              >
                <Globe className="w-4 h-4" />
                {empresa.contacto.sitioWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
          <ModalContacto
            nombre={empresa.nombre}
            email={empresa.contacto.email}
            telefono={empresa.contacto.telefono}
            sitioWeb={empresa.contacto.sitioWeb}
            ubicacion={empresa.ubicacion ?? undefined}
            colorScheme="blue"
            className="inline-flex items-center gap-2 bg-[#00213f] hover:bg-[#10375c] px-5 py-2.5 text-xs font-bold text-white rounded transition-colors tracking-wider uppercase"
          />
        </div>
      </div>

      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 mt-10 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="w-full lg:w-[72%] space-y-6">
            {/* Always visible for SEO */}
            {empresa.actividad && (
              <section className="bg-white p-7 rounded-md border border-slate-200">
                <div className="flex items-center gap-2.5 mb-4">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">Sobre la empresa</h2>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed text-[15px]">
                  {empresa.actividad}
                </p>
              </section>
            )}

            {(tieneServiciosReales || tieneTags) && (
              <section className="bg-white p-7 rounded-md border border-slate-200">
                <div className="flex items-center gap-2.5 mb-5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">Rubros y especialidades</h2>
                </div>
                {tieneServiciosReales && (
                  <div className="flex flex-wrap gap-2">
                    {empresa.servicios.map((servicio: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-semibold rounded hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        {servicio}
                      </span>
                    ))}
                  </div>
                )}
                {tieneTags && (
                  <div className={tieneServiciosReales ? "mt-6 pt-5 border-t border-slate-100" : ""}>
                    <p className="font-manrope text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-3">
                      Especialidades y capacidades
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tagsEmpresa.map((tag) => (
                        <span
                          key={tag.nombre}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-dashed border-slate-300 text-slate-600 text-[11px] font-medium rounded-full"
                        >
                          <Tag className="w-3 h-3 text-slate-400" />
                          {tag.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <SeccionCertificaciones certs={certs} accent="blue" />

            {/* Gated content */}
            {isAuthenticated ? (
              <>
                {catalogoItems.length > 0 && (
                  <CatalogoPublico items={catalogoItems} colorScheme="blue" />
                )}

                {oportunidadesActivas.length > 0 && (
                  <section className="bg-white rounded-md border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                          Oportunidades publicadas · {oportunidadesActivas.length}
                        </h2>
                      </div>
                      <Link href="/oportunidades" className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-[0.15em] flex items-center gap-1.5 group">
                        Ver todas
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    <ul className="divide-y divide-slate-100">
                      {oportunidadesActivas.map((op: any) => (
                        <li key={op.id}>
                          <Link href={`/oportunidades/${op.id}`} className="group flex items-center justify-between gap-4 px-7 py-4 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[#00213f] font-bold text-[15px] leading-snug group-hover:text-blue-700 transition-colors truncate">{op.titulo}</h4>
                              <p className="text-slate-500 text-[12px] font-medium mt-0.5">
                                <span className="text-slate-600">{(op.categoria as any)?.nombre || "Industrial"}</span>
                                <span className="mx-1.5 text-slate-300">·</span>
                                <span>{new Date(op.creado_en).toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-sm border border-emerald-200">
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
              </>
            ) : (
              <div className="bg-white p-7 rounded-md border border-slate-200">
                <div className="flex items-center gap-2.5 mb-5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                    Catálogo, oportunidades y reseñas
                  </h2>
                </div>
                <LoginGate currentPath={currentPath} />
              </div>
            )}
          </main>

          <aside data-tour="ficha-sidebar-contacto" className="w-full lg:w-[28%]">
            <div className="bg-white rounded-md border border-slate-200 sticky top-28 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  Datos de contacto
                </h3>
              </div>

              <>
                <ul className="p-6 space-y-5">
                  {empresa.ubicacion && (
                    <li className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Ubicación</p>
                        <p className="text-slate-700 font-semibold text-[14px] leading-snug">{empresa.ubicacion}</p>
                      </div>
                    </li>
                  )}

                  <li className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo</p>
                      <a href={`mailto:${empresa.contacto.email}`} className="text-blue-700 font-semibold text-[14px] hover:text-blue-900 transition-colors break-all">
                        {empresa.contacto.email}
                      </a>
                    </div>
                  </li>

                  {empresa.contacto.telefono && (
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Teléfono</p>
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

                  {empresa.contacto.sitioWeb && (
                    <li className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Sitio web</p>
                        <a href={empresa.contacto.sitioWeb.match(/^https?:\/\//) ? empresa.contacto.sitioWeb : `https://${empresa.contacto.sitioWeb}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold text-[14px] hover:text-blue-900 transition-colors break-all">
                          {empresa.contacto.sitioWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    </li>
                  )}
                </ul>

                <div className="px-6 pb-6">
                  <a
                    href={`mailto:${empresa.contacto.email}`}
                    className="flex items-center justify-center w-full bg-[#00213f] hover:bg-[#10375c] px-5 py-3 text-xs font-bold text-white rounded transition-colors tracking-[0.15em] uppercase"
                  >
                    Enviar Mensaje
                  </a>
                </div>
              </>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVEEDOR / PARTICULAR PROFILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function ProveedorProfile({
  provDb,
  supabase,
  isAuthenticated,
  currentPath,
}: {
  provDb: any;
  supabase: any;
  isAuthenticated: boolean;
  currentPath: string;
}) {
  const displayName =
    provDb.nombre_comercial ||
    [provDb.nombre, provDb.apellido].filter(Boolean).join(" ") ||
    "Sin nombre";
  const personalName = [provDb.nombre, provDb.apellido].filter(Boolean).join(" ");
  const cats = provDb.proveedores_categorias?.map((pc: any) => pc.categorias?.nombre).filter(Boolean) || [];
  const mainCat = provDb.tipo_proveedor || (cats.length > 0 ? cats[0] : "Prestador de servicios");
  const logoUrl = provDb.bucket_logo && provDb.ruta_logo
    ? supabase.storage.from(provDb.bucket_logo).getPublicUrl(provDb.ruta_logo).data.publicUrl
    : null;

  // Certificaciones: contenido público, fuera del gate de auth.
  const certs = await fetchCertificaciones(supabase, "proveedor_id", provDb.id);

  // Los prestadores de servicios no son calificados: no se traen reseñas.
  let catalogoItems: CatalogoItem[] = [];

  if (isAuthenticated) {
    catalogoItems = await fetchCatalogoItems(supabase, "provider", provDb.id);
  }

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
      telefono: provDb.telefono || "",
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
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
              url: `${SITE_URL}${currentPath}`,
            })
          ),
        }}
      />
      <RegistrarVisita tipo="proveedor" entidadId={provDb.id} />
      {/* Hero */}
      <div className="relative h-[320px] flex items-end overflow-hidden -mt-24 pt-24">
        <div className="absolute inset-0 z-0">
          <Image src="/landing/hero-industrial.webp" alt="Fondo" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/90 to-[#10375c]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00182e] via-[#00213f]/70 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-10">
          <Link href="/directorio" className="inline-flex items-center text-blue-200/70 hover:text-white mb-6 transition-colors text-[11px] font-bold tracking-[0.2em] uppercase">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Directorio
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-[#bf7035]/25 border border-[#d4894a]/30 text-[#f5c89a] text-[10px] font-bold uppercase tracking-[0.15em]">
              {proveedor.categoria}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-white/10 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-[0.15em]">
              <User className="w-3 h-3 text-[#d4894a]" />
              Particular
            </span>
          </div>

          <h1 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.05] tracking-tight max-w-3xl">
            {proveedor.nombre}
          </h1>
          {proveedor.nombrePersonal && proveedor.nombrePersonal !== proveedor.nombre && (
            <p className="text-white/55 text-base font-medium mt-2">{proveedor.nombrePersonal}</p>
          )}
        </div>
      </div>

      {/* Identity bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 bg-white border border-slate-200 flex items-center justify-center font-manrope font-black text-4xl text-[#10375c] shrink-0 overflow-hidden rounded-full shadow-sm">
            {proveedor.logoUrl ? (
              <Image src={proveedor.logoUrl} alt={proveedor.nombre} width={80} height={80} className="object-contain w-full h-full p-1.5" />
            ) : (
              proveedor.logo
            )}
          </div>
          <div className="flex-1 min-w-[200px] flex flex-wrap gap-x-8 gap-y-3 items-center text-sm">
            {proveedor.ubicacion && (
              <span className="inline-flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{proveedor.ubicacion}</span>
              </span>
            )}
          </div>
          <ModalContacto
            nombre={proveedor.nombre}
            email={proveedor.contacto.email}
            telefono={proveedor.contacto.telefono}
            ubicacion={proveedor.ubicacion ?? undefined}
            colorScheme="amber"
            className="inline-flex items-center gap-2 bg-[#bf7035] hover:bg-[#a0622c] px-5 py-2.5 text-xs font-bold text-white rounded-sm transition-colors tracking-wider uppercase"
          />
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-10 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="w-full lg:w-[65%] space-y-6">
            {/* Always visible for SEO */}
            <section className="bg-white p-7 rounded-md border border-[#191c1e]/8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-sm bg-[#bf7035]/8 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-[#bf7035]" />
                </div>
                <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">Perfil Profesional</h2>
              </div>
              <h3 className="font-manrope text-lg font-bold text-[#191c1e] mb-3 leading-snug">{proveedor.descripcionCorta}</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-[15px]">{proveedor.descripcionLarga}</p>
            </section>

            <section className="bg-white p-7 rounded-md border border-[#191c1e]/8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-sm bg-[#bf7035]/8 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[#bf7035]" />
                </div>
                <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">Servicios y Especialidades</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {proveedor.servicios.map((servicio: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 bg-[#f2f4f6] border border-[#191c1e]/8 text-slate-700 text-[13px] font-semibold rounded-sm hover:border-[#bf7035]/30 hover:bg-[#bf7035]/5 hover:text-[#bf7035] transition-colors"
                  >
                    {servicio}
                  </span>
                ))}
              </div>
            </section>

            <SeccionCertificaciones certs={certs} accent="amber" />

            {/* Gated content — los prestadores no reciben reseñas, solo catálogo */}
            {isAuthenticated ? (
              catalogoItems.length > 0 && (
                <CatalogoPublico items={catalogoItems} colorScheme="blue" />
              )
            ) : (
              <div className="bg-white p-7 rounded-md border border-[#191c1e]/8">
                <div className="flex items-center gap-2.5 mb-5">
                  <Briefcase className="w-4 h-4 text-[#bf7035]" />
                  <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                    Catálogo
                  </h2>
                </div>
                <LoginGate currentPath={currentPath} />
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-[35%]">
            <div className="bg-white rounded-md border border-[#191c1e]/8 sticky top-28 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#191c1e]/6 bg-[#f7f9fb]">
                <h3 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  Datos de Contacto
                </h3>
              </div>

              <>
                <ul className="p-6 space-y-5">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Ubicación</p>
                      <p className="text-[#191c1e] font-semibold text-[14px]">{proveedor.ubicacion}</p>
                    </div>
                  </li>

                  {provDb.fecha_inicio_experiencia != null && (() => {
                    const años = Math.floor((Date.now() - new Date(provDb.fecha_inicio_experiencia).getTime()) / (365.25 * 24 * 3600 * 1000));
                    return (
                      <li className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Experiencia</p>
                          <p className="text-[#191c1e] font-semibold text-[14px]">{años} año{años !== 1 ? 's' : ''}</p>
                        </div>
                      </li>
                    );
                  })()}

                  <li className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Correo Electrónico</p>
                      <a href={`mailto:${proveedor.contacto.email}`} className="text-[#bf7035] font-semibold text-[14px] hover:text-[#a0622c] transition-colors break-all">
                        {proveedor.contacto.email}
                      </a>
                    </div>
                  </li>

                  {proveedor.contacto.telefono && (
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Teléfono</p>
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
                </ul>

                <div className="px-6 pb-6">
                  <a
                    href={`mailto:${proveedor.contacto.email}`}
                    className="flex items-center justify-center w-full bg-[#bf7035] hover:bg-[#a0622c] px-5 py-3 text-xs font-bold text-white rounded-sm transition-colors tracking-[0.15em] uppercase"
                  >
                    Contactar
                  </a>
                </div>
              </>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
