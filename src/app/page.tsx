import { Award, Factory, Star, TrendingUp, Users, Zap, Building } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Stats */}
      <div className="relative bg-gradient-to-br from-slate-50 to-primary-50/50 py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-in slide-in-from-bottom-5 duration-700">
            <div className="inline-flex items-center gap-2 bg-primary-100/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-primary-200/50">
              <Award className="h-5 w-5 text-primary-600" />
              <span className="text-primary-800 font-medium">Red Industrial de Confianza</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 bg-clip-text text-transparent">
              Ecosistema Industrial Integral
            </h2>
            
            <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
              Conectamos a los socios de la Unión Industrial de Almirante Brown con empresas especializadas en servicios industriales y profesionales de mantenimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center mt-12">
            {[
              { icon: Factory, value: "100+", label: "Empresas Registradas", color: "from-blue-500 to-cyan-500" },
              { icon: Zap, value: "50+", label: "Proveedores Activos", color: "from-yellow-500 to-orange-500" },
              { icon: Users, value: "500+", label: "Conexiones Realizadas", color: "from-green-500 to-emerald-500" },
              { icon: Star, value: "4.8", label: "Calificación Promedio", color: "from-purple-500 to-pink-500" }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="relative group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
                  <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
