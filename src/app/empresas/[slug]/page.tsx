import { createClient as createServerClient } from "@/lib/supabase/servidor";
import { createClient } from "@supabase/supabase-js";
import { crearSlug } from "@/lib/utilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResenasPerfil } from "@/components/ui/directorio/ResenasPerfil";
import { CatalogoPublico, type CatalogoItem } from "@/components/ui/directorio/catalogo-publico";
import { MapPin, Mail, Phone, Globe, CheckCircle2, ArrowLeft, Building2, Wrench, User, Briefcase, ArrowRight, Clock } from "lucide-react";
import Image from "next/image";

// Fetch items publicados + imagenes y mapea al shape del componente publico.
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

// Helper: create admin client that bypasses RLS (safe in server components)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function EmpresaProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const supabase = createAdminClient();

  // ── Step 1: Try to find in empresas table ──
  const { data: empresasData } = await supabase
    .from('empresas')
    .select(`
      id,
      razon_social,
      direccion,
      localidad,
      actividad,
      sitio_web,
      email,
      referente,
      bucket_logo,
      ruta_logo,
      empresas_categorias (
        categorias (
          nombre
        )
      )
    `)
    .eq('estado', 'aprobada');

  const empresaDb = empresasData?.find((emp: any) => crearSlug(emp.razon_social) === slug);

  // ── Step 2: If not found in empresas, try proveedores table ──
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
        anios_experiencia,
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

    // ── Render PROVEEDOR / PARTICULAR profile ──
    return <ProveedorProfile provDb={provDb} supabase={supabase} />;
  }

  // ── Render EMPRESA (socio verificado) profile ──
  return <EmpresaProfile empresaDb={empresaDb} supabase={supabase} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPRESA PROFILE (Socio Verificado UIAB)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function EmpresaProfile({ empresaDb, supabase }: { empresaDb: any; supabase: any }) {
  const cats = empresaDb.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
  const mainCat = cats.length > 0 ? cats[0] : "General";
  const logoUrl = empresaDb.bucket_logo && empresaDb.ruta_logo
    ? supabase.storage.from(empresaDb.bucket_logo).getPublicUrl(empresaDb.ruta_logo).data.publicUrl
    : null;

  const { data: resenasData } = await supabase
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
    .order('creada_en', { ascending: false });

  let finalResenas: any[] = resenasData || [];
  if (!resenasData) {
    const { data: fallbackData } = await supabase
      .from('resenas')
      .select('id, calificacion, comentario, creada_en')
      .eq('empresa_resenada_id', empresaDb.id)
      .eq('estado', 'aprobada')
      .order('creada_en', { ascending: false });
    finalResenas = fallbackData || [];
  }

  // Fetch Opportunities
  const { data: opsData } = await supabase
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
    .order('creado_en', { ascending: false });

  const oportunidadesActivas = opsData || [];

  // Catálogo público de productos/servicios
  const catalogoItems = await fetchCatalogoItems(supabase, "company", empresaDb.id);

  // Solo mostramos la descripción si hay actividad real — evitamos cards
  // con texto genérico tipo "Empresa verificada y registrada..." que no
  // aporta nada al visitante.
  const tieneActividadReal = Boolean(empresaDb.actividad && empresaDb.actividad.trim().length > 8);
  const serviciosExtra = cats.slice(1);
  const tieneServiciosReales = serviciosExtra.length > 0;

  const empresa = {
    nombre: empresaDb.razon_social,
    categoria: mainCat,
    actividad: tieneActividadReal ? empresaDb.actividad : null,
    logo: empresaDb.razon_social.charAt(0).toUpperCase(),
    logoUrl,
    ubicacion: [empresaDb.localidad, empresaDb.direccion].filter(Boolean).join(", ") || null,
    servicios: serviciosExtra,
    contacto: {
      email: empresaDb.email || "No disponible",
      telefono: "Protegido",
      sitioWeb: empresaDb.sitio_web || ""
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20">
      {/* ─── Header: más compacto, acento lateral en lugar de card flotante ─── */}
      <div className="relative h-[320px] flex items-end overflow-hidden -mt-24 pt-24">
        <div className="absolute inset-0 z-0">
          <Image src="/landing/hero-industrial.png" alt="" fill className="object-cover object-center" priority />
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

      {/* ─── Barra de identidad: logo + meta inline, sobria ─── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 bg-white border border-slate-200 flex items-center justify-center font-manrope font-black text-4xl text-[#00213f] shrink-0 overflow-hidden rounded-md shadow-sm">
            {empresa.logoUrl ? (
              <Image src={empresa.logoUrl} alt={empresa.nombre} width={80} height={80} className="object-cover w-full h-full" />
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
          <a
            href={`mailto:${empresa.contacto.email}`}
            className="inline-flex items-center gap-2 bg-[#00213f] hover:bg-[#10375c] px-5 py-2.5 text-xs font-bold text-white rounded transition-colors tracking-wider uppercase"
          >
            <Mail className="w-3.5 h-3.5" />
            Contactar
          </a>
        </div>
      </div>

      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 mt-10 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="w-full lg:w-[72%] space-y-6">
            {/* Solo mostramos "Sobre la empresa" si hay actividad real cargada */}
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

            {tieneServiciosReales && (
              <section className="bg-white p-7 rounded-md border border-slate-200">
                <div className="flex items-center gap-2.5 mb-5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <h2 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">Rubros y especialidades</h2>
                </div>
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
              </section>
            )}

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

            <ResenasPerfil resenasAprobadas={finalResenas} targetType="empresa" targetId={empresaDb.id} />
          </main>

          <aside className="w-full lg:w-[28%]">
            <div className="bg-white rounded-md border border-slate-200 sticky top-28 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-manrope text-[11px] font-bold text-slate-500 tracking-[0.2em] uppercase">
                  Datos de contacto
                </h3>
              </div>

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

                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Teléfono</p>
                    <p className="text-slate-600 font-medium text-[14px] italic">{empresa.contacto.telefono}</p>
                  </div>
                </li>

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
async function ProveedorProfile({ provDb, supabase }: { provDb: any; supabase: any }) {
  const isParticular = true;
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

  // Fetch Reseñas
  const { data: resenasData } = await supabase
    .from('resenas')
    .select(`
      id,
      calificacion,
      comentario,
      creada_en,
      empresa_autora:empresas!resenas_empresa_autora_id_fkey(razon_social),
      proveedor_autor:proveedores!resenas_proveedor_autor_id_fkey(nombre, apellido)
    `)
    .eq('proveedor_resenada_id', provDb.id)
    .eq('estado', 'aprobada')
    .order('creada_en', { ascending: false });

  let finalResenas: any[] = resenasData || [];
  if (!resenasData) {
    const { data: fallbackData } = await supabase
      .from('resenas')
      .select('id, calificacion, comentario, creada_en')
      .eq('proveedor_resenado_id', provDb.id)
      .eq('estado', 'aprobada')
      .order('creada_en', { ascending: false });
    finalResenas = fallbackData || [];
  }

  // Catálogo público de productos/servicios
  const catalogoItems = await fetchCatalogoItems(supabase, "provider", provDb.id);

  const proveedor = {
    nombre: displayName,
    nombrePersonal: personalName,
    categoria: mainCat,
    descripcionCorta: provDb.descripcion || (isParticular ? "Prestador de servicios particular" : "Prestador verificado UIAB"),
    descripcionLarga: provDb.descripcion
      ? provDb.descripcion
      : `Profesional ${isParticular ? "independiente" : "verificado"} registrado en el ecosistema de UIAB.${mainCat ? ` Especialista en ${mainCat.toLowerCase()}.` : ''}`,
    logo: displayName.charAt(0).toUpperCase(),
    logoUrl,
    ubicacion: [provDb.localidad, provDb.provincia].filter(Boolean).join(", ") || "Sin ubicación",
    servicios: cats.length > 0 ? cats : (provDb.tipo_proveedor ? [provDb.tipo_proveedor] : ["Servicios Generales"]),
    contacto: {
      email: provDb.email || "No disponible",
      telefono: provDb.telefono || "",
      sitioWeb: ""
    }
  };

  // Color theming
  const gradientOverlay = isParticular
    ? "from-[#451a03] via-[#78350f]/85 to-[#92400e]/70"
    : "from-[#022c22] via-[#064e3b]/85 to-[#0f766e]/70";
  const gradientSide = isParticular ? "from-[#451a03]" : "from-[#022c22]";

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {/* ─── Header ─── */}
      <div className="relative h-[400px] flex items-center overflow-hidden -mt-24 pt-24 mb-16">
        <div className="absolute inset-0 z-0">
          <Image src="/landing/hero-industrial.png" alt="Fondo" fill className="object-cover object-center" priority />
          <div className={`absolute inset-0 bg-gradient-to-t ${gradientOverlay} mix-blend-multiply`} />
          <div className={`absolute inset-0 bg-gradient-to-r ${gradientSide} to-transparent opacity-90`} />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-12">
          <Link href="/directorio?tab=prestadores" className={`inline-flex items-center ${isParticular ? "text-amber-200/80" : "text-emerald-200/80"} hover:text-white mb-8 transition-colors text-xs font-bold tracking-widest uppercase`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Directorio
          </Link>

          <div className="flex flex-col md:flex-row items-end gap-6 max-w-4xl">
            {/* Avatar — circular for particulares */}
            <div className={`w-32 h-32 bg-white flex items-center justify-center font-manrope font-black text-6xl shadow-2xl shrink-0 border-4 border-white/10 translate-y-24 relative z-20 overflow-hidden ${
              isParticular ? "rounded-full text-amber-800" : "rounded-2xl text-emerald-800"
            }`}>
              {proveedor.logoUrl ? (
                <Image src={proveedor.logoUrl} alt={proveedor.nombre} fill className="object-cover" sizes="128px" />
              ) : (
                proveedor.logo
              )}
            </div>
            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  isParticular
                    ? "bg-amber-500/20 border-amber-400/30 text-amber-200"
                    : "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                }`}>
                  {proveedor.categoria}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {isParticular
                    ? <User className="w-3.5 h-3.5 text-amber-300" />
                    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  }
                  {isParticular ? "Particular" : "Verificado UIAB"}
                </span>
              </div>
              <h1 className="font-manrope text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                {proveedor.nombre}
              </h1>
              {proveedor.nombrePersonal && proveedor.nombrePersonal !== proveedor.nombre && (
                <p className="text-white/60 text-lg font-medium mt-2">{proveedor.nombrePersonal}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <main className="w-full lg:w-[65%] space-y-10">
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  isParticular ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
                }`}>
                  <Wrench className={`w-5 h-5 ${isParticular ? "text-amber-600" : "text-emerald-600"}`} />
                </div>
                <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight">
                  {isParticular ? "Perfil Profesional" : "Expediente Técnico"}
                </h2>
              </div>
              <h3 className="text-xl font-bold text-slate-700 font-manrope mb-4 leading-relaxed">{proveedor.descripcionCorta}</h3>
              <div className="prose prose-slate max-w-none text-slate-500 font-medium leading-loose text-[15px]">
                <p>{proveedor.descripcionLarga}</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight mb-8">Servicios y Especialidades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                {proveedor.servicios.map((servicio: string, idx: number) => (
                  <div key={idx} className="flex items-start group">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center mr-4 mt-0.5 transition-colors shrink-0 ${
                      isParticular ? "bg-amber-50 border-amber-200 group-hover:border-amber-400" : "bg-slate-50 border-slate-200 group-hover:border-emerald-300"
                    }`}>
                       <div className={`w-2 h-2 rounded-full ${isParticular ? "bg-amber-500" : "bg-emerald-600"}`} />
                    </div>
                    <span className="text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{servicio}</span>
                  </div>
                ))}
              </div>
            </div>



            {catalogoItems.length > 0 && (
              <CatalogoPublico items={catalogoItems} colorScheme={isParticular ? "amber" : "emerald"} />
            )}

            <ResenasPerfil resenasAprobadas={finalResenas} targetType="proveedor" targetId={provDb.id} />
          </main>

          <aside className="w-full lg:w-[35%]">
            <div className={`bg-white p-8 rounded-2xl shadow-xl border border-slate-200/60 sticky top-28 ${
              isParticular ? "shadow-amber-100/30" : "shadow-emerald-100/30"
            }`}>
              <h3 className={`font-manrope text-xl font-extrabold mb-8 pb-4 border-b border-slate-100 ${
                isParticular ? "text-amber-900" : "text-[#022c22]"
              }`}>
                Datos de Contacto
              </h3>

              <ul className="space-y-8 mb-10">
                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                    <p className="text-slate-700 font-semibold leading-relaxed">{proveedor.ubicacion}</p>
                  </div>
                </li>

                {provDb.anios_experiencia != null && (
                  <li className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Experiencia</p>
                      <p className="text-slate-700 font-semibold leading-relaxed">{provDb.anios_experiencia} años</p>
                    </div>
                  </li>
                )}

                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                    <a href={`mailto:${proveedor.contacto.email}`} className={`font-bold transition-colors break-all ${
                      isParticular ? "text-amber-600 hover:text-amber-800" : "text-emerald-600 hover:text-emerald-800"
                    }`}>
                      {proveedor.contacto.email}
                    </a>
                  </div>
                </li>

                {proveedor.contacto.telefono && (
                  <li className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono Directo</p>
                      <a href={`tel:${proveedor.contacto.telefono.replace(/[^0-9+]/g, '')}`} className="text-slate-700 font-semibold hover:text-slate-900 transition-colors">
                        {proveedor.contacto.telefono}
                      </a>
                    </div>
                  </li>
                )}
              </ul>

              <a
                href={`mailto:${proveedor.contacto.email}`}
                className={`flex items-center justify-center w-full px-6 py-3.5 text-sm font-bold text-white rounded-lg transition-colors shadow-lg tracking-wider uppercase ${
                  isParticular
                    ? "bg-amber-700 hover:bg-amber-800 shadow-amber-900/20"
                    : "bg-[#022c22] hover:bg-[#064e3b] shadow-[#022c22]/20"
                }`}
              >
                Contactar
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
