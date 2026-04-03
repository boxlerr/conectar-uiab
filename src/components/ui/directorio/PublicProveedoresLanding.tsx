"use client";

import { motion } from "framer-motion";
import { Wrench, Handshake, Award, ArrowRight, Search, CheckCircle2, Lock, Star, ChevronRight, ShieldCheck, Truck, Lightbulb, Clock } from "lucide-react";
import { ProfileCard } from "@/components/ui/directorio/ProfileCard";
import { getProveedores } from "@/lib/data/directorio";
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

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const steps = [
  {
    number: "01",
    title: "Registre su servicio",
    description: "Indique su especialidad, área de cobertura y las certificaciones que posee.",
    icon: Search,
    color: "from-emerald-500 to-teal-600",
  },
  {
    number: "02",
    title: "Verificación de calidad",
    description: "La UIAB valida su experiencia, referencias comerciales y habilitaciones.",
    icon: ShieldCheck,
    color: "from-emerald-600 to-teal-700",
  },
  {
    number: "03",
    title: "Publicación en la Red",
    description: "Su perfil queda activo y visible para todas las empresas del parque industrial.",
    icon: CheckCircle2,
    color: "from-teal-600 to-cyan-600",
  },
  {
    number: "04",
    title: "Reciba solicitudes",
    description: "Las empresas lo contactan directamente para cotizaciones y proyectos.",
    icon: Handshake,
    color: "from-cyan-600 to-blue-600",
  },
];

const advantages = [
  {
    icon: Award,
    title: "Sello de Confianza UIAB",
    description: "Cada proveedor es evaluado y aprobado. Su respaldo técnico está garantizado por la unión industrial.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600",
  },
  {
    icon: Truck,
    title: "Acceso Directo al Parque",
    description: "Llegue a +100 empresas industriales sin intermediarios. Cotice, negocie y cierre operaciones.",
    gradient: "from-teal-500/10 to-cyan-500/10",
    iconColor: "text-teal-600",
  },
  {
    icon: Lightbulb,
    title: "Demanda Constante",
    description: "Las empresas del parque necesitan servicios especializados todos los días. Posiciónese donde está la demanda.",
    gradient: "from-cyan-500/10 to-blue-500/10",
    iconColor: "text-cyan-600",
  },
  {
    icon: Clock,
    title: "Respuesta Ágil",
    description: "Reciba notificaciones de nuevas oportunidades y responda a solicitudes de cotización en tiempo real.",
    gradient: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600",
  },
];

const testimonials = [
  { sector: "Logística", text: "Duplicamos nuestra cartera de clientes industriales en 6 meses gracias a la red UIAB." },
  { sector: "Consultoría Técnica", text: "El sello de verificación nos abrió puertas que antes eran imposibles de alcanzar." },
  { sector: "Mantenimiento Industrial", text: "Recibimos solicitudes semanales de empresas del parque. La plataforma funciona." },
];

export function PublicProveedoresLanding() {
  const { openAuthModal } = useAuth();
  const proveedoresPreview = getProveedores().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ─── HERO (Emerald/Teal identity vs Empresas' deep blue) ─── */}
      <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-teal-400/5 rounded-full blur-3xl -translate-y-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-emerald-400/10 backdrop-blur-md rounded-full px-4 py-2 mb-8 border border-emerald-400/20">
              <Wrench className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-medium text-emerald-200 tracking-wide uppercase">Red de Proveedores Verificados</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Servicios que
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                la industria necesita
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-emerald-100/70 max-w-xl mb-10 leading-relaxed">
              Encuentre proveedores técnicos, logísticos y profesionales verificados por la UIAB. 
              O registre su empresa de servicios y acceda a la demanda industrial real.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={openAuthModal}
                className="h-12 px-8 rounded-lg font-bold text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                Explorar Proveedores
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={openAuthModal}
                variant="outline"
                className="h-12 px-8 rounded-lg font-semibold text-base border-white/20 text-white hover:bg-white/10 transition-all bg-transparent"
              >
                Registrarme como Proveedor
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating metric cards on the right side */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-20"
          >
            {[
              { value: "50+", label: "Proveedores", icon: Wrench },
              { value: "98%", label: "Satisfacción", icon: Star },
              { value: "24h", label: "Respuesta", icon: Clock },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                variants={fadeUp}
                custom={i + 3}
                className="bg-white/[0.07] backdrop-blur-lg rounded-xl px-6 py-4 border border-white/[0.08] hover:bg-white/[0.12] transition-all duration-300 min-w-[180px]"
              >
                <div className="flex items-center gap-3">
                  <metric.icon className="w-5 h-5 text-emerald-300" />
                  <div>
                    <div className="font-poppins text-2xl font-bold text-white">{metric.value}</div>
                    <div className="text-xs text-emerald-200/60 font-medium">{metric.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── ADVANTAGES (Asymmetric Bento) ─── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">
              Ventajas de pertenecer a la red
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-slate-500 max-w-2xl">
              Ser proveedor verificado UIAB no es solo figurar en un listado. Es tener un canal directo de negocios con la industria.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {advantages.map((adv, i) => {
              const Icon = adv.icon;
              return (
                <motion.div
                  key={adv.title}
                  variants={fadeUp}
                  custom={i}
                  className={`bg-gradient-to-br ${adv.gradient} rounded-xl p-8 hover:shadow-lg transition-all duration-500 group border border-slate-100`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${adv.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-poppins text-xl font-bold text-[#191c1e] mb-2">{adv.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{adv.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── STEP BY STEP (Horizontal Timeline) ─── */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Cómo convertirse en proveedor
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-slate-400 max-w-2xl mx-auto">
              Un proceso simple y transparente para posicionar su empresa de servicios en el corazón industrial.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.number} variants={fadeUp} custom={i} className="relative group">
                  <div className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-8 h-full border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-500">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-bold text-emerald-400/60 mb-2 tracking-widest">{step.number}</div>
                    <h3 className="font-poppins text-lg font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">
              Lo que dicen nuestros proveedores
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-xl p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-500"
                style={{ boxShadow: "0 1px 3px rgba(0,33,63,0.04)" }}
              >
                <div className="absolute top-4 right-4 text-6xl font-bold text-emerald-50 select-none group-hover:text-emerald-100 transition-colors">"</div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="text-sm font-bold text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded">{t.sector}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── LIMITED PREVIEW ─── */}
      <section className="py-24 lg:py-32 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Vista previa de la red</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-poppins text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">
              Proveedores destacados
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 max-w-2xl mx-auto">
              Una muestra de los proveedores verificados que operan en la red. Inicie sesión para ver el catálogo completo.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {proveedoresPreview.map((proveedor, i) => (
                <motion.div key={proveedor.id} variants={fadeUp} custom={i}>
                  <div className={i === 1 ? "pointer-events-none select-none" : ""} style={i === 1 ? { filter: "blur(6px)", opacity: 0.5 } : undefined}>
                    <ProfileCard entidad={proveedor} basePath="/proveedores" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Overlay fade + CTA */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f2f4f6] via-[#f2f4f6]/80 to-transparent flex items-end justify-center pb-4 pointer-events-none">
              <div className="pointer-events-auto">
                <Button
                  onClick={openAuthModal}
                  className="h-12 px-8 rounded-lg font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Ver todos los proveedores
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-poppins text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Ofrece servicios a la industria?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-emerald-200/80 text-lg mb-10 max-w-2xl mx-auto">
              Regístrese como proveedor verificado y acceda a un flujo constante de demanda industrial desde el parque de Almirante Brown.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={openAuthModal}
                className="h-12 px-8 rounded-lg font-bold text-base bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                Registrar mi servicio
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={openAuthModal}
                variant="outline"
                className="h-12 px-8 rounded-lg font-semibold text-base border-white/20 text-white hover:bg-white/10 transition-all bg-transparent"
              >
                Ya tengo cuenta
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
