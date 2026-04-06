"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Factory,
  Star,
  Users,
  Zap,
  Building,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Award,
  TrendingUp,
  Wrench,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { SectoresGrid } from "@/components/ui/directorio/SectoresGrid";
import { EmpresasDestacadas } from "@/components/ui/directorio/EmpresasDestacadas";
import { useAuth } from "@/modulos/autenticacion/AuthContext";

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 50, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 },
  },
};

const float = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export default function Home() {
  const { openAuthModal } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const dashY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <main className="min-h-screen bg-[#f7f9fb] overflow-x-hidden selection:bg-primary-200">

      {/* ═══════════════════════════════════════════
          HERO — Split layout: Copy left + Platform visual right
      ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[100vh] flex items-center">
        {/* Background */}
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#10375c] to-[#0c2d4a]" />
          {/* Dot grid texture */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }} />
          {/* Ambient glow - left */}
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-primary-400/[0.06] blur-[100px]" />
          {/* Ambient glow - right */}
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-300/[0.04] blur-[120px]" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* LEFT — Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-5 xl:col-span-5"
            >
              {/* Badge */}
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 bg-white/[0.07] backdrop-blur-md rounded-sm px-4 py-2 mb-8 border border-white/[0.06]"
              >
                <ShieldCheck className="w-4 h-4 text-primary-300" />
                <span className="text-[12px] font-semibold text-white/60 tracking-[0.08em] uppercase">
                  Directorio Comercial
                </span>
              </motion.div>

              {/* Main heading */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] font-bold text-white leading-[1.06] tracking-[-0.02em] mb-6"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Conectamos
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-blue-300">
                  Industria
                </span>{" "}
                con
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-100">
                  Profesionales
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-[16px] text-white/60 max-w-md mb-9 leading-relaxed"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                La plataforma de la UIAB que une a las empresas y comercios de Almirante Brown con proveedores verificados. Directorio, oportunidades y networking en un solo lugar.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/empresas"
                  className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all inline-flex items-center justify-center"
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Explorar Empresas
                </Link>
                <Link
                  href="/proveedores"
                  className="h-12 px-7 rounded-sm font-semibold text-[14px] text-white/80 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Ver Proveedores
                </Link>
              </motion.div>

              {/* Trust signals */}
              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 text-[12px] text-white/30">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-300/50" /> 100+ empresas
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-300/50" /> 50+ proveedores
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-300/50" /> 100% verificado
                </span>
              </motion.div>
            </motion.div>

            {/* RIGHT — Platform visual / Dashboard mockup + Connection graphic */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInRight}
              className="lg:col-span-7 xl:col-span-7 relative hidden lg:block"
            >
              <motion.div style={{ y: dashY }} className="relative">
                {/* Dashboard mockup */}
                <div className="relative z-10">
                  <Image
                    src="/landing/hero-dashboard.png"
                    alt="Plataforma UIAB Conecta — Directorio industrial"
                    width={800}
                    height={560}
                    className="w-full h-auto rounded-lg shadow-2xl shadow-black/40"
                    priority
                  />
                  {/* Overlay glow */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[#00213f]/30 via-transparent to-transparent" />
                </div>

                {/* Floating card — Empresas */}
                <motion.div
                  variants={float}
                  initial="initial"
                  animate="animate"
                  className="absolute -left-6 top-1/4 bg-white/[0.08] backdrop-blur-xl rounded-sm px-4 py-3 border border-white/[0.08] shadow-2xl shadow-black/20 z-20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-sm bg-primary-500/20 flex items-center justify-center">
                      <Factory className="w-4.5 h-4.5 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">100+ Empresas</p>
                      <p className="text-[10px] text-white/40">Alte. Brown</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — Proveedores */}
                <motion.div
                  variants={float}
                  initial="initial"
                  animate="animate"
                  className="absolute -right-4 bottom-1/4 bg-white/[0.08] backdrop-blur-xl rounded-sm px-4 py-3 border border-white/[0.08] shadow-2xl shadow-black/20 z-20"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-sm bg-primary-500/20 flex items-center justify-center">
                      <Wrench className="w-4.5 h-4.5 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">50+ Proveedores</p>
                      <p className="text-[10px] text-white/40">Verificados UIAB</p>
                    </div>
                  </div>
                </motion.div>

                {/* Connection graphic — bottom overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[280px] z-20"
                >
                  <Image
                    src="/landing/hero-connection.png"
                    alt="Conexión empresas ↔ UIAB ↔ proveedores"
                    width={280}
                    height={180}
                    className="w-full h-auto drop-shadow-2xl"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade transition */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f7f9fb] to-transparent z-10" />
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAR — Floating cards that bridge hero → content
      ═══════════════════════════════════════════ */}
      <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: Factory, value: "100+", label: "Empresas Registradas", desc: "Red sólida en el parque" },
            { icon: Zap, value: "50+", label: "Proveedores Activos", desc: "Servicios especializados" },
            { icon: Users, value: "500+", label: "Conexiones B2B", desc: "Negocios concretados" },
            { icon: Star, value: "4.8", label: "Calificación Promedio", desc: "Satisfacción garantizada" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-sm p-6 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                style={{ boxShadow: "0 2px 8px rgba(0,33,63,0.06)" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-sm bg-primary-50 flex items-center justify-center group-hover:bg-[#00213f] transition-colors duration-300">
                    <Icon className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                      {stat.value}
                    </div>
                    <div className="text-[12px] font-semibold text-[#191c1e]/50">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — 3 step visual with isometric connection
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Left — Connection illustration */}
            <motion.div variants={fadeUp} custom={0} className="hidden lg:flex justify-center">
              <Image
                src="/landing/hero-connection.png"
                alt="Ecosistema: Empresa → UIAB → Proveedor"
                width={500}
                height={380}
                className="w-full max-w-md h-auto drop-shadow-lg"
              />
            </motion.div>

            {/* Right — Steps */}
            <motion.div variants={stagger}>
              <motion.span variants={fadeUp} custom={0} className="text-[11px] font-bold text-primary-600 tracking-[0.14em] uppercase block mb-3">
                ¿Cómo funciona?
              </motion.span>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-10"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Tres pilares, un ecosistema
              </motion.h2>

              <div className="space-y-8">
                {[
                  {
                    icon: Briefcase,
                    title: "Empresas del Partido",
                    desc: "Más de 100 empresas radicadas publican su perfil, buscan proveedores y acceden a oportunidades de negocio exclusivas.",
                    link: "/empresas",
                    linkLabel: "Ver directorio de empresas",
                  },
                  {
                    icon: ShieldCheck,
                    title: "UIAB como ente verificador",
                    desc: "La Unión Industrial valida la identidad, matrículas y trayectoria de cada participante, garantizando una red de confianza.",
                    link: "/nosotros",
                    linkLabel: "Conocer la UIAB",
                  },
                  {
                    icon: Wrench,
                    title: "Proveedores profesionales",
                    desc: "Electricistas, gasistas, plomeros, techistas y profesionales verificados ofrecen sus servicios a empresas y particulares de todo el partido.",
                    link: "/proveedores",
                    linkLabel: "Ver proveedores",
                  },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    custom={i + 2}
                    className="flex gap-5 group"
                  >
                    <div className="flex-shrink-0 w-11 h-11 rounded-sm bg-white flex items-center justify-center shadow-sm group-hover:bg-[#00213f] transition-colors duration-300">
                      <step.icon className="w-5 h-5 text-[#00213f] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-[#191c1e] mb-1">{step.title}</h3>
                      <p className="text-[14px] text-[#191c1e]/50 leading-relaxed mb-2">{step.desc}</p>
                      <Link
                        href={step.link}
                        className="inline-flex items-center text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {step.linkLabel}
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Existing components */}
      <SectoresGrid />
      <EmpresasDestacadas />

      {/* ═══════════════════════════════════════════
          PILLARS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#f7f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-bold text-primary-600 tracking-[0.14em] uppercase block mb-3">
              Nuestro compromiso
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-4xl font-bold text-[#191c1e] mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Ecosistema Industrial Integral
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-[15px] text-[#191c1e]/50 leading-relaxed">
              Respaldamos a la industria local brindando herramientas, representatividad y conexiones de alto valor para potenciar la competitividad.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Representatividad",
                body: "Defendemos los intereses del sector industrial ante organismos públicos y privados, asegurando un entorno favorable para los negocios.",
                icon: Building,
              },
              {
                title: "Networking Estratégico",
                body: "Fomentamos la sinergia B2B conectando a empresas líderes con proveedores confiables para maximizar la cadena de valor.",
                icon: TrendingUp,
              },
              {
                title: "Asesoramiento Experto",
                body: "Brindamos soporte técnico, legal y administrativo a través de profesionales especializados en la dinámica industrial.",
                icon: Award,
              },
            ].map((pillar, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                custom={idx}
                className="bg-white p-8 rounded-sm group hover:shadow-md transition-all duration-300"
                style={{ boxShadow: "0 1px 3px rgba(0,33,63,0.04)" }}
              >
                <div className="w-11 h-11 rounded-sm bg-primary-50 flex items-center justify-center mb-6 group-hover:bg-[#00213f] transition-colors duration-300">
                  <pillar.icon className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3
                  className="text-[17px] font-bold text-[#191c1e] mb-3"
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                >
                  {pillar.title}
                </h3>
                <p className="text-[14px] text-[#191c1e]/50 leading-relaxed">{pillar.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA BOTTOM
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary-400/[0.05] rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-white mb-6 leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Listo para formar parte
              <br />
              de la Unión?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-primary-200/50 text-[16px] mb-10 max-w-2xl mx-auto leading-relaxed">
              Únase al directorio comercial más importante de Almirante Brown y potencie el crecimiento de su empresa con beneficios exclusivos.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="h-12 px-8 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/10 active:scale-[0.98] transition-all inline-flex items-center justify-center"
              >
                Asociarse Ahora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/contacto"
                className="h-12 px-7 rounded-sm font-semibold text-[14px] text-white/50 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all inline-flex items-center justify-center"
              >
                Contactar
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
