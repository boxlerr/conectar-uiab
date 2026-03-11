import { Award, Factory, Star, TrendingUp, Users, Zap, Building, ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SectoresGrid } from "@/components/ui/directorio/SectoresGrid";
import { EmpresasDestacadas } from "@/components/ui/directorio/EmpresasDestacadas";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-primary-200">
      {/* Hero Section */}
      <section className="relative bg-slate-900 border-b border-slate-800 overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-40">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-900/40 to-transparent mix-blend-overlay" />
          <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="animate-fade-in inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-md rounded-full px-4 py-2 border border-slate-700 mb-8 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-accent-500" />
            <span className="text-sm font-medium text-slate-300 tracking-wide uppercase">Red Industrial de Confianza</span>
          </div>
          
          <h1 className="animate-slide-up font-poppins text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight max-w-5xl">
            Impulsando el <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200">Desarrollo Industrial</span>
          </h1>
          
          <p className="animate-slide-up text-lg md:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed [animation-delay:200ms]">
            Participación y fomento del diseño de políticas, estrategias y acciones que apoyen el desarrollo industrial. Conectamos empresas con soluciones profesionales de excelencia.
          </p>
          
          <div className="animate-slide-up flex flex-col sm:flex-row items-center gap-4 [animation-delay:400ms]">
            <Link href="/servicios" className="group flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 w-full sm:w-auto">
              Explorar Servicios
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/institucional" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-slate-700 hover:border-slate-500 px-8 py-4 rounded-lg font-semibold transition-all duration-300 w-full sm:w-auto">
              Conocer más
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Factory, value: "100+", label: "Empresas Registradas", desc: "Red sólida en el parque" },
            { icon: Zap, value: "50+", label: "Proveedores Activos", desc: "Servicios especializados" },
            { icon: Users, value: "500+", label: "Conexiones B2B", desc: "Negocios concretados" },
            { icon: Star, value: "4.8", label: "Calificación Promedio", desc: "Satisfacción garantizada" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="animate-slide-up bg-white rounded-xl p-8 border border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group" style={{ animationDelay: `${500 + i * 100}ms` }}>
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="font-poppins text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-slate-800 mb-1">{stat.label}</div>
                <div className="text-sm text-slate-500">{stat.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nuevos componentes de Directorio */}
      <SectoresGrid />
      <EmpresasDestacadas />

      {/* Corporate Pillars / Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-poppins text-3xl font-bold text-slate-900 mb-4 tracking-tight">Ecosistema Industrial Integral</h2>
            <p className="text-lg text-slate-600">
              Respaldamos a la industria local brindando herramientas, representatividad y conexiones de alto valor para potenciar la competitividad.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Representatividad",
                body: "Defendemos los intereses del sector industrial ante organismos públicos y privados, asegurando un entorno favorable para los negocios.",
                icon: Building
              },
              {
                title: "Networking Estratégico",
                body: "Fomentamos la sinergia B2B conectando a empresas líderes con proveedores confiables para maximizar la cadena de valor.",
                icon: TrendingUp
              },
              {
                title: "Asesoramiento Experto",
                body: "Brindamos soporte técnico, legal y administrativo a través de profesionales especializados en la dinámica industrial.",
                icon: Award
              }
            ].map((pillar, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary-100 transition-colors">
                <pillar.icon className="w-10 h-10 text-accent-500 mb-6" />
                <h3 className="font-poppins text-xl font-semibold text-slate-900 mb-3">{pillar.title}</h3>
                <p className="text-slate-600 leading-relaxed">{pillar.body}</p>
                <div className="mt-6 flex items-center text-primary-600 font-medium hover:text-primary-700 cursor-pointer">
                  Leer más <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="bg-primary-900 py-20 border-t border-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-poppins text-3xl md:text-4xl font-bold text-white mb-6">¿Listo para formar parte de la Unión?</h2>
          <p className="text-primary-200 text-lg mb-10 max-w-2xl mx-auto">
            Únase a la red industrial más importante de Almirante Brown y potencie el crecimiento de su empresa con beneficios exclusivos.
          </p>
          <Link href="/contacto" className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-xl shadow-accent-500/20 hover:shadow-accent-500/40">
            Asociarse Ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
