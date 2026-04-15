import { createClient as createServerClient } from "@/lib/supabase/servidor";
import { createClient } from "@supabase/supabase-js";
import { crearSlug } from "@/lib/utilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResenasPerfil } from "@/components/ui/directorio/ResenasPerfil";
import { MapPin, Mail, Phone, Globe, CheckCircle2, ArrowLeft, Building2, Wrench, User } from "lucide-react";
import Image from "next/image";

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
        es_socio,
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

  const empresa = {
    nombre: empresaDb.razon_social,
    categoria: mainCat,
    descripcionCorta: empresaDb.actividad || "Miembro de la Unión Industrial",
    descripcionLarga: `Empresa verificada y registrada en el ecosistema industrial de UIAB. ${empresaDb.actividad ? `Principalmente enfocada en ${empresaDb.actividad.toLowerCase()}.` : ''}`,
    logo: empresaDb.razon_social.charAt(0).toUpperCase(),
    logoUrl,
    ubicacion: `${empresaDb.localidad || 'S/N'}, ${empresaDb.direccion || ''}`.replace(/^, | ,|, $/g, ''),
    servicios: cats.slice(1).length > 0 ? cats.slice(1) : ["Servicios Industriales"],
    contacto: {
      email: empresaDb.email || "No disponible",
      telefono: "Protegido",
      sitioWeb: empresaDb.sitio_web || ""
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {/* ─── Header ─── */}
      <div className="relative h-[400px] flex items-center overflow-hidden -mt-24 pt-24 mb-16">
        <div className="absolute inset-0 z-0">
          <Image src="/landing/hero-industrial.png" alt="Fondo Industrial" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/85 to-[#10375c]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] to-transparent opacity-90" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-12">
          <Link href="/directorio" className="inline-flex items-center text-blue-200/80 hover:text-white mb-8 transition-colors text-xs font-bold tracking-widest uppercase">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Directorio
          </Link>

          <div className="flex flex-col md:flex-row items-end gap-6 max-w-4xl">
            <div className="w-32 h-32 bg-white text-[#00213f] rounded-2xl flex items-center justify-center font-manrope font-black text-6xl shadow-2xl shrink-0 border-4 border-white/10 translate-y-24 relative z-20 overflow-hidden">
              {empresa.logoUrl ? (
                <Image src={empresa.logoUrl} alt={empresa.nombre} fill className="object-cover" sizes="128px" />
              ) : (
                empresa.logo
              )}
            </div>
            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {empresa.categoria}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                  Verificado UIAB
                </span>
              </div>
              <h1 className="font-manrope text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                {empresa.nombre}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <main className="w-full lg:w-[65%] space-y-10">
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight">Expediente Técnico</h2>
              </div>
              <h3 className="text-xl font-bold text-slate-700 font-manrope mb-4 leading-relaxed">{empresa.descripcionCorta}</h3>
              <div className="prose prose-slate max-w-none text-slate-500 font-medium leading-loose text-[15px]">
                <p>{empresa.descripcionLarga}</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
              <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight mb-8">Servicios y Especialidades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                {empresa.servicios.map((servicio: string, idx: number) => (
                  <div key={idx} className="flex items-start group">
                    <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center mr-4 mt-0.5 group-hover:border-blue-300 transition-colors shrink-0">
                       <div className="w-2 h-2 rounded-full bg-blue-600" />
                    </div>
                    <span className="text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{servicio}</span>
                  </div>
                ))}
              </div>
            </div>

            <ResenasPerfil resenasAprobadas={finalResenas} targetType="empresa" targetId={empresaDb.id} />
          </main>

          <aside className="w-full lg:w-[35%]">
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60 sticky top-28">
              <h3 className="font-manrope text-xl font-extrabold text-[#00213f] mb-8 pb-4 border-b border-slate-100">
                Datos de Contacto
              </h3>

              <ul className="space-y-8 mb-10">
                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                    <p className="text-slate-700 font-semibold leading-relaxed">{empresa.ubicacion}</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                    <a href={`mailto:${empresa.contacto.email}`} className="text-blue-600 font-bold hover:text-blue-800 transition-colors break-all">
                      {empresa.contacto.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mr-4 border border-slate-100">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teléfono Directo</p>
                    <p className="text-slate-700 font-semibold">{empresa.contacto.telefono}</p>
                  </div>
                </li>

                {empresa.contacto.sitioWeb && (
                  <li className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mr-4 border border-blue-100">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">Página Web</p>
                      <a href={empresa.contacto.sitioWeb.match(/^https?:\/\//) ? empresa.contacto.sitioWeb : `https://${empresa.contacto.sitioWeb}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:text-blue-800 transition-colors break-all">
                        {empresa.contacto.sitioWeb.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </li>
                )}
              </ul>

              <a
                href={`mailto:${empresa.contacto.email}`}
                className="flex items-center justify-center w-full bg-[#00182e] hover:bg-[#10375c] px-6 py-3.5 text-sm font-bold text-white rounded-lg transition-colors shadow-lg shadow-[#00182e]/20 tracking-wider uppercase"
              >
                Mandar Mensaje
              </a>
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
  const isParticular = !provDb.es_socio;
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
    .eq('proveedor_resenado_id', provDb.id)
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
