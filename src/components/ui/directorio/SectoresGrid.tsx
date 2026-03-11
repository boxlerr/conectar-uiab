import Link from "next/link";
import { Zap, Shield, Factory, FlaskConical, Cpu, Shirt, Cookie, Package, Truck, LucideIcon } from "lucide-react";
import { getSectoresConRecuento } from "@/lib/data/directorio";

// Map sector names to specific icons for better visual distinction, falling back to Zap.
const iconMap: Record<string, LucideIcon> = {
  "Metalúrgica": Factory,
  "Química": FlaskConical,
  "Automotriz": Shield,
  "Electrónica": Cpu,
  "Textil": Shirt,
  "Alimentaria": Cookie,
  "Packaging": Package,
  "Logística": Truck,
};

export function SectoresGrid() {
  const sectores = getSectoresConRecuento();

  return (
    <section className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-poppins text-4xl font-bold text-slate-900 mb-4">Sectores Industriales</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Descubre empresas especializadas en cada sector de la industria
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectores.map((sector) => {
            const Icon = iconMap[sector.nombre] || Zap;
            
            return (
              <Link
                key={sector.nombre}
                href={`/empresas?categoria=${encodeURIComponent(sector.nombre)}`}
                className="group flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-slate-200 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary-50 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-slate-700 group-hover:text-primary-600 transition-colors duration-300" />
                </div>
                <h3 className="font-poppins text-lg font-bold text-slate-900 mb-1 group-hover:text-primary-700 transition-colors">
                  {sector.nombre}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {sector.total} empresas
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
