import { createClient } from "@/lib/supabase/servidor";
import { crearSlug } from "@/lib/utilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Mail, Phone, Globe, CheckCircle2, ArrowLeft, Building2 } from "lucide-react";
import Image from "next/image";

export default async function EmpresaProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const supabase = await createClient();
  const { data, error } = await supabase
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
      empresas_categorias (
        categorias (
          nombre
        )
      )
    `)
    .eq('estado', 'aprobada');

  if (error || !data) {
    notFound();
  }

  const empresaDb = data.find((emp: any) => crearSlug(emp.razon_social) === slug);

  if (!empresaDb) {
    notFound();
  }

  const cats = empresaDb.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
  const mainCat = cats.length > 0 ? cats[0] : "General";

  const empresa = {
    nombre: empresaDb.razon_social,
    categoria: mainCat,
    descripcionCorta: empresaDb.actividad || "Miembro de la Unión Industrial",
    descripcionLarga: `Empresa verificada y registrada en el ecosistema industrial de UIAB. ${empresaDb.actividad ? `Principalmente enfocada en ${empresaDb.actividad.toLowerCase()}.` : ''}`,
    logo: empresaDb.razon_social.charAt(0).toUpperCase(),
    ubicacion: `${empresaDb.localidad || 'S/N'}, ${empresaDb.direccion || ''}`.replace(/^, | ,|, $/g, ''),
    servicios: cats.slice(1).length > 0 ? cats.slice(1) : ["Servicios Industriales"],
    certificaciones: ["Socio Verificado UIAB"],
    contacto: {
      email: empresaDb.email || "No disponible",
      telefono: "Protegido",
      sitioWeb: empresaDb.sitio_web || ""
    }
  };

  // Authenticated Profile View - Industrial Ledger
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {/* ─── Premium Parallax Header ─── */}
      <div className="relative h-[400px] flex items-center overflow-hidden -mt-24 pt-24 mb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.png"
            alt="Fondo Industrial"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/85 to-[#10375c]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] to-transparent opacity-90" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-12">
          <Link href="/empresas" className="inline-flex items-center text-blue-200/80 hover:text-white mb-8 transition-colors text-xs font-bold tracking-widest uppercase">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Directorio de Empresas
          </Link>
          
          <div className="flex flex-col md:flex-row items-end gap-6 max-w-4xl">
            <div className="w-32 h-32 bg-white text-[#00213f] rounded-2xl flex items-center justify-center font-manrope font-black text-6xl shadow-2xl shrink-0 border-4 border-white/10 translate-y-24 relative z-20">
              {empresa.logo}
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
          
          {/* Main Content Column */}
          <main className="w-full lg:w-[65%] space-y-10">
            {/* Actividad Principal */}
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight">Expediente Técnico</h2>
              </div>
              <h3 className="text-xl font-bold text-slate-700 font-manrope mb-4 leading-relaxed">
                {empresa.descripcionCorta}
              </h3>
              <div className="prose prose-slate max-w-none text-slate-500 font-medium leading-loose text-[15px]">
                <p>{empresa.descripcionLarga}</p>
              </div>
            </div>

            {/* Especialidades */}
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-slate-200/60">
              <h2 className="font-manrope text-2xl font-extrabold text-slate-800 tracking-tight mb-8">Servicios y Especialidades</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                {empresa.servicios.map((servicio, idx) => (
                  <div key={idx} className="flex items-start group">
                    <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center mr-4 mt-0.5 group-hover:border-blue-300 transition-colors shrink-0">
                       <div className="w-2 h-2 rounded-full bg-blue-600" />
                    </div>
                    <span className="text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{servicio}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Sidebar Column */}
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
                    <p className="text-slate-700 font-semibold leading-relaxed">
                      {empresa.ubicacion}
                    </p>
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
                    <p className="text-slate-700 font-semibold">
                      {empresa.contacto.telefono}
                    </p>
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
