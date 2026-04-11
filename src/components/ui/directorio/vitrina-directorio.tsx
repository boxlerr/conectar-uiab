"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Zap, ArrowRight, ChevronRight } from "lucide-react";
import { CategoryModal } from "./modal-categorias";

const EMPRESAS_CATEGORIES = [
  "Metalmecánica", "Química y Plásticos", "Textil e Indumentaria", "Alimenticia", "Tecnología", "Construcción"
];

const PROVEEDORES_CATEGORIES = [
  "Mantenimiento Industrial", "Logística y Transporte", "Seguridad Corporativa", "Consultoría", "Insumos Varios"
];

export function DirectoryShowcase() {
  const [activeModal, setActiveModal] = useState<"empresas" | "proveedores" | null>(null);

  return (
    <>
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-stretch">
            
            {/* Empresas Card */}
            <div 
              onClick={() => setActiveModal("empresas")}
              className="group cursor-pointer w-full md:w-1/2 bg-slate-50 border border-slate-200 hover:border-primary-300 rounded-3xl p-8 lg:p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-600/10 hover:-translate-y-2 relative overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-16 h-16 bg-primary-100 group-hover:bg-primary-600 rounded-2xl flex items-center justify-center transition-colors duration-500 shadow-sm">
                  <Building className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-500" />
                </div>
                <div>
                  <h2 className="font-poppins text-3xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Empresas</h2>
                  <span className="text-sm font-medium text-slate-500">Directorio Industrial</span>
                </div>
              </div>
              
              <p className="text-slate-600 mb-10 text-lg leading-relaxed relative z-10 flex-grow">
                Explore nuestra red de industrias establecidas. Encuentre los principales fabricantes, sus rubros comerciales y conecte directamente.
              </p>
              
              <div className="inline-flex items-center justify-between w-full text-primary-600 font-semibold relative z-10 bg-white px-6 py-4 rounded-xl border border-slate-100 group-hover:border-primary-200 shadow-sm transition-colors">
                Ver Categorías de Empresas
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>

            {/* Proveedores Card */}
            <div 
              onClick={() => setActiveModal("proveedores")}
              className="group cursor-pointer w-full md:w-1/2 bg-slate-50 border border-slate-200 hover:border-accent-300 rounded-3xl p-8 lg:p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-accent-500/10 hover:-translate-y-2 relative overflow-hidden flex flex-col h-full"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-16 h-16 bg-accent-100 group-hover:bg-accent-500 rounded-2xl flex items-center justify-center transition-colors duration-500 shadow-sm">
                  <Zap className="w-8 h-8 text-accent-600 group-hover:text-white transition-colors duration-500" />
                </div>
                <div>
                  <h2 className="font-poppins text-3xl font-bold text-slate-900 group-hover:text-accent-700 transition-colors">Proveedores</h2>
                  <span className="text-sm font-medium text-slate-500">Red de Servicios</span>
                </div>
              </div>
              
              <p className="text-slate-600 mb-10 text-lg leading-relaxed relative z-10 flex-grow">
                Acceda instantáneamente a proveedores de servicios B2B auditados que garantizan la continuidad de su línea de producción.
              </p>
              
              <div className="inline-flex items-center justify-between w-full text-accent-600 font-semibold relative z-10 bg-white px-6 py-4 rounded-xl border border-slate-100 group-hover:border-accent-200 shadow-sm transition-colors">
                Ver Categorías de Servicios
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Modals */}
      <CategoryModal
        isOpen={activeModal === "empresas"}
        onClose={() => setActiveModal(null)}
        title="Rubros Industriales"
        description="Seleccione una categoría para filtrar directamente las industrias registradas en nuestro ecosistema."
        icon={<Building className="w-8 h-8 text-primary-600" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {EMPRESAS_CATEGORIES.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/empresas`} 
              onClick={() => setActiveModal(null)}
              className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all shadow-sm"
            >
              <span className="font-medium text-slate-700 group-hover:text-primary-800">{cat}</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </div>
        <div className="text-center pt-4 border-t border-slate-100">
          <Link href="/empresas" onClick={() => setActiveModal(null)} className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-600/20 w-full sm:w-auto">
            Explorar todas las empresas
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </CategoryModal>

      <CategoryModal
        isOpen={activeModal === "proveedores"}
        onClose={() => setActiveModal(null)}
        title="Categorías de Servicio"
        description="Encuentre el servicio exacto que su industria necesita seleccionando una de nuestras categorías de proveedores auditados."
        icon={<Zap className="w-8 h-8 text-accent-600" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {PROVEEDORES_CATEGORIES.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/proveedores`} 
              onClick={() => setActiveModal(null)}
              className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-accent-400 hover:bg-accent-50 transition-all shadow-sm"
            >
              <span className="font-medium text-slate-700 group-hover:text-accent-800">{cat}</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-accent-500 transition-colors" />
            </Link>
          ))}
        </div>
        <div className="text-center pt-4 border-t border-slate-100">
          <Link href="/proveedores" onClick={() => setActiveModal(null)} className="inline-flex items-center justify-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-accent-500/20 w-full sm:w-auto">
            Explorar todos los proveedores
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </CategoryModal>
    </>
  );
}
