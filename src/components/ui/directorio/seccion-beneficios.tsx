"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Megaphone,
  Monitor,
  BadgeCheck,
  FileText,
} from "lucide-react";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export function SeccionBeneficios() {
  return (
    <section className="py-24 lg:py-36 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
          {/* Left Column: Text Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="lg:col-span-7"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4 mb-4">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/icono-uiab.svg"
                  alt="Ícono UIAB Conecta — Unión Industrial de Almirante Brown"
                  width={32}
                  height={32}
                  className="object-contain opacity-80"
                />
              </div>
              <div className="h-[1px] w-6 bg-primary-600/30" />
              <span className="text-[10px] font-bold text-primary-600 tracking-[0.25em] uppercase">
                Membresía Corporativa
              </span>
            </motion.div>
            
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl lg:text-7xl font-extrabold text-[#00213f] tracking-tight mb-8 leading-[1.1]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Beneficios <br /> suscripción <span className="text-primary-600">UIAB</span>
            </motion.h2>
            
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 leading-relaxed max-w-xl">
              Herramientas de visibilidad y gestión diseñadas para el ecosistema industrial de Almirante Brown. Acceso directo a contactos y oportunidades de la red.
            </motion.p>
          </motion.div>

          {/* Right Column: Visual Anchor */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={3}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/3] rounded-sm overflow-hidden shadow-2xl shadow-primary-900/10 border border-slate-200/50">
              <Image
                src="/industrial-b2b-header.png"
                alt="Planta industrial en Almirante Brown — Directorio de empresas y proveedores B2B UIAB Conecta"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00213f]/20 to-transparent" />
            </div>
            
            {/* Technical Detail Anchor */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#f8fafc] border border-slate-200 p-4 hidden lg:flex flex-col items-center justify-between rounded-sm shadow-xl">
              <div className="w-full flex justify-start">
                <div className="w-6 h-[1px] bg-primary-600/30" />
              </div>
              
              <div className="relative w-12 h-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <Image
                  src="/icono-uiab.svg"
                  alt="Ícono UIAB — Sector Industrial Almirante Brown"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>

              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none text-center">
                Sector <br /> Industrial
              </span>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid — Bento-style */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Card 1 — Directory */}
          <motion.div variants={fadeUp} custom={0} className="md:col-span-2 bg-[#00213f] rounded-md p-8 lg:p-12 text-white relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-400/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-sm bg-white/10 flex items-center justify-center mb-10 border border-white/5 group-hover:bg-primary-500/20 transition-colors">
                <Search className="w-6 h-6 text-primary-200" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Directorio Industrial Completo</h3>
              <p className="text-primary-100/70 text-base lg:text-lg leading-relaxed max-w-xl mb-10">
                Acceso a la base de datos de +60 empresas e industrias verificadas del partido. Busque particulares por sector o servicio y contacte de forma directa.
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {["Base de Datos +60", "Filtros Técnicos", "Contacto Sin Intermediarios"].map((tag) => (
                  <span key={tag} className="text-[11px] font-bold text-white/50 bg-white/[0.04] border border-white/5 rounded-sm px-3 py-1.5 uppercase tracking-wider">{tag}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Oportunidades */}
          <motion.div variants={fadeUp} custom={1} className="bg-white rounded-md p-8 group hover:bg-[#f8fafc] transition-all duration-300 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-sm bg-primary-50 flex items-center justify-center mb-6 border border-primary-100/50">
              <Megaphone className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-[#00213f] mb-3" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Cartelera de Oportunidades</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Publique sus necesidades de contratación y acceda a la lista de búsquedas de suministros y servicios vigentes subidas por otras empresas de la red.
            </p>
          </motion.div>

          {/* Card 3 — Dashboard */}
          <motion.div variants={fadeUp} custom={2} className="bg-white rounded-md p-8 group hover:bg-[#f8fafc] transition-all duration-300 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-sm bg-primary-50 flex items-center justify-center mb-6 border border-primary-100/50">
              <Monitor className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-[#00213f] mb-3" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Métricas de Visibilidad</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Monitoree el alcance de su perfil corporativo con datos reales: visualizaciones recibidas y clics realizados en sus métodos de contacto.
            </p>
          </motion.div>

          {/* Card 4 — Sello */}
          <motion.div variants={fadeUp} custom={3} className="bg-[#f8fafc] rounded-md p-8 group transition-all duration-300 border border-primary-200/60 shadow-md shadow-primary-900/5">
            <div className="w-12 h-12 rounded-sm bg-primary-600 flex items-center justify-center mb-6 shadow-sm">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#00213f] mb-3" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Empresa Verificada UIAB</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Obtenga la validación oficial de la Unión Industrial de Almirante Brown. Mejore su posicionamiento y aparezca con prioridad en los resultados de búsqueda.
            </p>
          </motion.div>

          {/* Card 5 — Documental */}
          <motion.div variants={fadeUp} custom={4} className="bg-white rounded-md p-8 group hover:bg-[#f8fafc] transition-all duration-300 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-sm bg-primary-50 flex items-center justify-center mb-6 border border-primary-100/50">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-[#00213f] mb-3" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Gestor de Credenciales</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Repositorio centralizado para cargar habilitaciones, seguros y certificaciones. Facilite y agilice su proceso de alta como particular para la red.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
