import { createClient } from "@supabase/supabase-js";
import { crearSlug } from "@/lib/utilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResenasPerfil } from "@/components/ui/directorio/ResenasPerfil";
import { MapPin, Mail, Phone, Globe, ArrowLeft, Wrench, User, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default async function ProveedorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
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
      bucket_logo,
      ruta_logo,
      proveedores_categorias (
        categorias (
          nombre
        )
      )
    `)
    .eq('estado', 'aprobado');

  if (error || !data) {
    notFound();
  }

  // Find the provider by slug (matching nombre_comercial or nombre)
  const provDb = data.find((p: any) => {
    const displayName =
      p.nombre_comercial ||
      [p.nombre, p.apellido].filter(Boolean).join(" ") ||
      "Sin nombre";
    return crearSlug(displayName) === slug;
  });

  if (!provDb) {
    notFound();
  }

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

  // Fetch Reseñas Aprobadas
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
      telefono: provDb.telefono || "No disponible",
      sitioWeb: ""
    }
  };

  // Color theming based on particular vs socio
  const gradientOverlay = isParticular
    ? "from-[#451a03] via-[#78350f]/85 to-[#92400e]/70"
    : "from-[#022c22] via-[#064e3b]/85 to-[#0f766e]/70";
  const gradientSide = isParticular
    ? "from-[#451a03]"
    : "from-[#022c22]";
  const categoryBadgeBg = isParticular
    ? "bg-amber-500/20 border-amber-400/30 text-amber-200"
    : "bg-emerald-500/20 border-emerald-400/30 text-emerald-200";
  const statusBadgeIcon = isParticular
    ? <User className="w-3.5 h-3.5 text-amber-300" />
    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />;
  const statusBadgeText = isParticular ? "Particular" : "Verificado UIAB";
  const accentColor = isParticular ? "amber" : "emerald";
  const backHref = isParticular ? "/directorio?tab=prestadores" : "/directorio?tab=prestadores";

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {/* ─── Premium Header ─── */}
      <div className="relative h-[400px] flex items-center overflow-hidden -mt-24 pt-24 mb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.png"
            alt="Fondo"
            fill
            className="object-cover object-center"
            priority
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${gradientOverlay} mix-blend-multiply`} />
          <div className={`absolute inset-0 bg-gradient-to-r ${gradientSide} to-transparent opacity-90`} />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-12">
          <Link href={backHref} className={`inline-flex items-center ${isParticular ? "text-amber-200/80" : "text-emerald-200/80"} hover:text-white mb-8 transition-colors text-xs font-bold tracking-widest uppercase`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Directorio
          </Link>

          <div className="flex flex-col md:flex-row items-end gap-6 max-w-4xl">
            {/* Avatar — circular for particulares, rounded for socios */}
            <div className={`w-32 h-32 bg-white flex items-center justify-center font-manrope font-black text-6xl shadow-2xl shrink-0 border-4 border-white/10 translate-y-24 relative z-20 overflow-hidden ${
              isParticular
                ? "rounded-full text-amber-800"
                : "rounded-2xl text-emerald-800"
            }`}>
              {proveedor.logoUrl ? (
                <Image src={proveedor.logoUrl} alt={proveedor.nombre} fill className="object-cover" sizes="128px" />
              ) : (
                proveedor.logo
              )}
            </div>
            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border ${categoryBadgeBg} text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                  {proveedor.categoria}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {statusBadgeIcon}
                  {statusBadgeText}
                </span>
              </div>
              <h1 className="font-manrope text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-xl">
                {proveedor.nombre}
              </h1>
              {/* Show personal name if different from display name */}
              {proveedor.nombrePersonal && proveedor.nombrePersonal !== proveedor.nombre && (
                <p className="text-white/60 text-lg font-medium mt-2">
                  {proveedor.nombrePersonal}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Main Content Column */}
          <main className="w-full lg:w-[65%] space-y-10">
            {/* Descripción */}
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  isParticular
                    ? "bg-amber-50 border-amber-100"
                    : "bg-emerald-50 border-emerald-100"
                }`}>
                  <Wrench className={`w-5 h-5 ${isParticular ? "text-amber-600" : "text-emerald-600"}`} />
                </div>
                <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight">
                  {isParticular ? "Perfil Profesional" : "Expediente Técnico"}
                </h2>
              </div>
              <h3 className="text-xl font-bold text-slate-700 font-manrope mb-4 leading-relaxed">
                {proveedor.descripcionCorta}
              </h3>
              <div className="prose prose-slate max-w-none text-slate-500 font-medium leading-loose text-[15px]">
                <p>{proveedor.descripcionLarga}</p>
              </div>
            </div>

            {/* Servicios */}
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60">
              <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight mb-8">Servicios y Especialidades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                {proveedor.servicios.map((servicio: string, idx: number) => (
                  <div key={idx} className="flex items-start group">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center mr-4 mt-0.5 transition-colors shrink-0 ${
                      isParticular
                        ? "bg-amber-50 border-amber-200 group-hover:border-amber-400"
                        : "bg-slate-50 border-slate-200 group-hover:border-emerald-300"
                    }`}>
                       <div className={`w-2 h-2 rounded-full ${isParticular ? "bg-amber-500" : "bg-emerald-600"}`} />
                    </div>
                    <span className="text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{servicio}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reseñas */}
            <ResenasPerfil 
              resenasAprobadas={finalResenas} 
              targetType="proveedor" 
              targetId={provDb.id} 
            />
          </main>

          {/* Sidebar */}
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
                    <p className="text-slate-700 font-semibold leading-relaxed">
                      {proveedor.ubicacion}
                    </p>
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

                {proveedor.contacto.telefono && proveedor.contacto.telefono !== "No disponible" && (
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
