"use client";

import { motion } from "framer-motion";
import { Building2, Shield, Users, TrendingUp, ArrowRight, Search, CheckCircle2, Zap, Lock, Star, ChevronRight } from "lucide-react";
import { ProfileCard } from "@/components/ui/directorio/ProfileCard";
import { getEmpresas } from "@/lib/data/directorio";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const steps = [
  {
    number: "01",
    title: "Solicitud de Alta",
    description: "Complete el formulario de registro indicando los datos de su empresa y sector industrial.",
    icon: Search,
  },
  {
    number: "02",
    title: "Validación UIAB",
    description: "Nuestro equipo verifica la radicación en el parque industrial y la documentación presentada.",
    icon: Shield,
  },
  {
    number: "03",
    title: "Perfil Activo",
    description: "Su empresa aparece en el directorio con perfil completo, visible para toda la red B2B.",
    icon: CheckCircle2,
  },
  {
    number: "04",
    title: "Conexión & Crecimiento",
    description: "Acceda a oportunidades exclusivas, proveedores verificados y herramientas de gestión.",
    icon: TrendingUp,
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Red Verificada",
    description: "Cada empresa es validada por la Unión Industrial de Almirante Brown. Solo miembros verificados.",
    accent: "bg-primary-50 text-primary-600",
  },
  {
    icon: Users,
    title: "Networking B2B",
    description: "Conecte directamente con decisores de la industria. Sin intermediarios, sin ruido.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Oportunidades Exclusivas",
    description: "Acceda a licitaciones, pedidos de cotización y proyectos que solo circulan dentro de la red.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Zap,
    title: "Visibilidad Industrial",
    description: "Su perfil corporativo posicionado en el ecosistema manufacturero más activo de la zona sur.",
    accent: "bg-amber-50 text-amber-600",
  },
];

const stats = [
  { value: "100+", label: "Empresas Radicadas" },
  { value: "50+", label: "Proveedores Activos" },
  { value: "500+", label: "Conexiones Realizadas" },
  { value: "15", label: "Sectores Industriales" },
];

export function PublicEmpresasLanding() {
  const { openAuthModal } = useAuth();
  const empresasPreview = getEmpresas().slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-8">
                <Building2 className="w-4 h-4 text-primary-200" />
                <span className="text-sm font-medium text-primary-100 tracking-wide uppercase">Directorio Industrial Verificado</span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Las empresas que
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-blue-300">
                  mueven la industria
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-lg text-primary-200/80 max-w-xl mb-10 leading-relaxed">
                Explore el directorio de empresas radicadas en el Parque Industrial de Almirante Brown. 
                Una red verificada de manufactura, innovación y cooperación empresarial.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={openAuthModal}
                  className="h-12 px-8 rounded-lg font-bold text-base bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/10 active:scale-[0.98] transition-all"
                >
                  Ingresar al Directorio
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <a
                  href="#preview"
                  className="h-12 px-8 rounded-lg font-semibold text-base border border-white/20 text-white hover:bg-white/10 transition-all inline-flex items-center justify-center"
                >
                  Ver Preview
                </a>
              </motion.div>
            </motion.div>

            {/* Right: Stats grid */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  custom={i + 2}
                  className="bg-white/[0.07] backdrop-blur-md rounded-xl p-6 border border-white/[0.08] hover:bg-white/[0.12] transition-all duration-300 group"
                >
                  <div className="font-poppins text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                  <div className="text-sm text-primary-200/70 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── BENEFITS BENTO ─── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">
              ¿Por qué ser parte del directorio?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-slate-500 max-w-2xl mx-auto">
              Más que un listado. Una plataforma de conexión industrial diseñada para generar oportunidades reales.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
                  style={{ boxShadow: "0 1px 3px rgba(0,33,63,0.04)" }}
                >
                  <div className={`w-12 h-12 rounded-lg ${benefit.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins text-lg font-bold text-[#191c1e] mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── STEP BY STEP ─── */}
      <section className="py-24 lg:py-32 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">
              Cómo funciona
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-slate-500 max-w-2xl mx-auto">
              Cuatro pasos para integrar su empresa a la red industrial más importante de la zona sur.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  custom={i}
                  className="relative group"
                >
                  {/* Connector line (hidden on last item and mobile) */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[2px] bg-gradient-to-r from-primary-200 to-primary-100 opacity-40" />
                  )}
                  
                  <div className="bg-white rounded-xl p-8 h-full hover:shadow-lg transition-all duration-500 relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00213f] to-[#10375c] flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">{step.number}</span>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                    <h3 className="font-poppins text-lg font-bold text-[#191c1e] mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── LIMITED PREVIEW ─── */}
      <section id="preview" className="py-24 lg:py-32 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary-50 rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Vista previa del directorio</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-poppins text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">
              Algunas de nuestras empresas
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 max-w-2xl mx-auto">
              Estas son solo algunas de las empresas que forman parte de la red. Inicie sesión para ver el directorio completo.
            </motion.p>
          </motion.div>

          {/* Preview cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {empresasPreview.map((empresa, i) => (
                <motion.div key={empresa.id} variants={fadeUp} custom={i}>
                  <div className={i === 2 ? "pointer-events-none select-none" : ""} style={i === 2 ? { filter: "blur(6px)", opacity: 0.5 } : undefined}>
                    <ProfileCard entidad={empresa} basePath="/empresas" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Overlay fade + CTA */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#f7f9fb] via-[#f7f9fb]/80 to-transparent flex items-end justify-center pb-6 pointer-events-none">
              <div className="pointer-events-auto">
                <Button
                  onClick={openAuthModal}
                  className="h-12 px-8 rounded-lg font-bold text-base bg-[#00213f] hover:bg-[#10375c] text-white shadow-xl shadow-primary-900/20 active:scale-[0.98] transition-all"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Iniciar sesión para ver todas
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-[#00213f] to-[#10375c]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Su empresa opera en el parque industrial?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-primary-200/80 text-lg mb-10 max-w-2xl mx-auto">
              Únase a la red industrial de Almirante Brown. Visibilidad, oportunidades y una comunidad empresarial que respalda su crecimiento.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={openAuthModal}
                className="h-12 px-8 rounded-lg font-bold text-base bg-white text-[#00213f] hover:bg-primary-50 shadow-xl active:scale-[0.98] transition-all"
              >
                Crear mi cuenta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <a
                href="https://www.uiab.org"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-8 rounded-lg font-semibold text-base border border-white/20 text-white hover:bg-white/10 transition-all inline-flex items-center justify-center"
              >
                Conocer la UIAB
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
