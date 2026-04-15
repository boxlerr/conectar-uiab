import { getEntidadBySlug } from "@/lib/datos/directorio";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Mail, Phone, Globe, CheckCircle2, ArrowLeft, Wrench } from "lucide-react";

export default async function ProveedorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const proveedor = getEntidadBySlug(resolvedParams.slug);

  if (!proveedor || proveedor.tipo !== "proveedor") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      {/* Header Profile */}
      <div className="bg-primary-900 border-b border-primary-800 text-white pt-12 pb-24 -mt-24 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <Link href="/directorio?tab=prestadores" className="inline-flex items-center text-primary-200 hover:text-white mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Directorio
          </Link>
          
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-24 h-24 bg-accent-500 text-white rounded-2xl flex items-center justify-center font-bold text-4xl shadow-xl shadow-accent-500/20 shrink-0">
              {proveedor.logo}
            </div>
            
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h1 className="font-poppins text-4xl font-bold">{proveedor.nombre}</h1>
                <span className="inline-flex items-center rounded-full bg-accent-500/20 px-3 py-1 text-sm font-medium text-accent-100 border border-accent-500/30">
                  {proveedor.categoria}
                </span>
              </div>
              <p className="text-xl text-primary-100 max-w-3xl leading-relaxed">
                {proveedor.descripcionCorta}
              </p>
              
              <div className="flex items-center mt-6 text-primary-200 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                {proveedor.ubicacion}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="w-full lg:w-2/3 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-poppins text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <Wrench className="w-6 h-6 mr-3 text-primary-600" />
                Resumen de Servicios
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                <p>{proveedor.descripcionLarga}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-poppins text-2xl font-bold text-slate-900 mb-6">Capacidades Técnicas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proveedor.servicios.map((servicio, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-accent-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{servicio}</span>
                  </div>
                ))}
              </div>
            </div>

            {proveedor.certificaciones && proveedor.certificaciones.length > 0 && (
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="font-poppins text-xl font-bold text-slate-900 mb-4">Certificaciones y Avales</h2>
                <div className="flex flex-wrap gap-3">
                  {proveedor.certificaciones.map((cert) => (
                    <span key={cert} className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar / Contact info */}
          <aside className="w-full lg:w-1/3">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-24">
              <h3 className="font-poppins text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Contacto Directo</h3>
              
              <ul className="space-y-6 mb-8">
                <li className="flex items-start">
                  <Mail className="w-5 h-5 mr-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                    <a href={`mailto:${proveedor.contacto.email}`} className="text-slate-900 font-medium hover:text-primary-600 transition-colors break-all">
                      {proveedor.contacto.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start">
                  <Phone className="w-5 h-5 mr-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Teléfono</p>
                    <a href={`tel:${proveedor.contacto.telefono.replace(/[^0-9+]/g, '')}`} className="text-slate-900 font-medium hover:text-primary-600 transition-colors">
                      {proveedor.contacto.telefono}
                    </a>
                  </div>
                </li>
                <li className="flex items-start">
                  <Globe className="w-5 h-5 mr-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Sitio Web</p>
                    <a href={proveedor.contacto.sitioWeb.match(/^https?:\/\//) ? proveedor.contacto.sitioWeb : `https://${proveedor.contacto.sitioWeb}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-medium hover:text-primary-700 transition-colors break-all">
                      {proveedor.contacto.sitioWeb.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </li>
              </ul>
              
              <a 
                href={`mailto:${proveedor.contacto.email}`}
                className="flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors shadow-sm"
              >
                Solicitar Cotización
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
