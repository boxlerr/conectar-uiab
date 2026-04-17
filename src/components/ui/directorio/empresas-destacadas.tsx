import Link from "next/link";
import { ShieldCheck, Star, MapPin, MessageCircle, Mail, Phone, Settings, FlaskConical, Factory, Cookie, Car } from "lucide-react";
import { getEntidadesDestacadas, Entidad } from "@/lib/datos/directorio";

// Map specific categories to light background colors for the badge, to mimic the Figma design.
const categoryStyleMap: Record<string, { bg: string, text: string, icon: any }> = {
  "Química": { bg: "bg-emerald-100", text: "text-emerald-700", icon: FlaskConical },
  "Maquinaria Industrial": { bg: "bg-slate-100", text: "text-slate-700", icon: Settings },
  "Metalúrgica": { bg: "bg-blue-100", text: "text-blue-700", icon: Factory },
  "Alimentaria": { bg: "bg-orange-100", text: "text-orange-700", icon: Cookie },
  "Automotriz": { bg: "bg-indigo-100", text: "text-indigo-700", icon: Car },
  "default": { bg: "bg-primary-100", text: "text-primary-700", icon: ShieldCheck }
};

export function EmpresasDestacadas() {
  const destacadas = getEntidadesDestacadas();

  return (
    <section className="py-24 bg-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins text-4xl font-bold text-slate-900 mb-4">Empresas Destacadas</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Particulares mejor evaluados por nuestros socios industriales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destacadas.map((empresa: Entidad) => {
            const catStyle = categoryStyleMap[empresa.categoria] || categoryStyleMap["default"];
            const CatIcon = catStyle.icon;

            return (
              <div 
                key={empresa.id} 
                className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all flex flex-col h-full"
              >
                {/* Header: Logo, Title, Badge */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${catStyle.bg} ${catStyle.text}`}>
                    <CatIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-poppins text-lg font-bold text-slate-900 line-clamp-1">{empresa.nombre}</h3>
                      <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${catStyle.bg} ${catStyle.text}`}>
                      {empresa.categoria}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(empresa.rating || 5) ? 'fill-current' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{empresa.rating}</span>
                  <span className="text-sm text-slate-500">({empresa.reviews} reseñas)</span>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-grow">
                  {empresa.descripcionCorta}
                </p>

                {/* Location */}
                <div className="flex items-start gap-2 text-slate-500 text-sm mb-6">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{empresa.ubicacion}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-auto">
                  <a 
                    href={empresa.contacto.whatsapp || `https://wa.me/${empresa.contacto.telefono.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-100 text-emerald-600 font-semibold hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <a 
                    href={`mailto:${empresa.contacto.email}`}
                    className="p-2.5 rounded-xl border-2 border-slate-100 text-primary-600 hover:bg-primary-50 hover:border-primary-100 transition-colors"
                    aria-label="Enviar email"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                  <a 
                    href={`tel:${empresa.contacto.telefono.replace(/[^0-9+]/g, '')}`}
                    className="p-2.5 rounded-xl border-2 border-slate-100 text-purple-600 hover:bg-purple-50 hover:border-purple-100 transition-colors"
                    aria-label="Llamar"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/empresas" className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors">
            Ver todo el directorio
          </Link>
        </div>
      </div>
    </section>
  );
}
