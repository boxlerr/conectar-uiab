"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Shield,
  Users,
  TrendingUp,
  ArrowRight,
  Search,
  CheckCircle2,
  Zap,
  Lock,
  Star,
  ChevronRight,
  BarChart3,
  FileText,
  Bell,
  Globe,
  Handshake,
  Factory,
  BadgeCheck,
  Eye,
} from "lucide-react";
import { ProfileCard } from "@/components/ui/directorio/ProfileCard";
import { getEmpresas } from "@/lib/data/directorio";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Data ─── */
const sectores = [
  { nombre: "Metalúrgica", total: 18, icon: Factory },
  { nombre: "Química", total: 15, icon: Zap },
  { nombre: "Automotriz", total: 12, icon: TrendingUp },
  { nombre: "Alimentaria", total: 14, icon: Globe },
  { nombre: "Electrónica", total: 10, icon: BarChart3 },
  { nombre: "Textil", total: 8, icon: FileText },
];

const valueProps = [
  {
    icon: Eye,
    title: "Visibilidad Permanente",
    description: "Su perfil corporativo activo las 24hs en el ecosistema industrial más importante de la zona sur. Cada empresa del parque y cada proveedor verificado puede encontrarlo.",
  },
  {
    icon: Bell,
    title: "Oportunidades en Tiempo Real",
    description: "Reciba notificaciones de pedidos de cotización, licitaciones y proyectos antes que nadie. Acceso exclusivo a oportunidades que circulan solo dentro de la red.",
  },
  {
    icon: Handshake,
    title: "Conexiones B2B Directas",
    description: "Sin intermediarios. Conecte directamente con compradores, proveedores y decisores verificados. Cada contacto es real, verificado y relevante para su sector.",
  },
  {
    icon: BarChart3,
    title: "Panel de Gestión Inteligente",
    description: "Métricas de actividad, historial de interacciones y dashboard personalizado. Entienda cómo se mueve su empresa dentro del directorio comercial.",
  },
];

const journey = [
  {
    step: "01",
    title: "Registro y Verificación",
    description: "Complete el formulario con los datos de su empresa y sector. Nuestro equipo valida la información y la documentación.",
    icon: FileText,
    detail: "Proceso 100% digital • Respuesta en 48hs",
  },
  {
    step: "02",
    title: "Activación del Perfil",
    description: "Una vez verificado, su perfil corporativo se activa en el directorio. Configure servicios, certificaciones y datos de contacto.",
    icon: CheckCircle2,
    detail: "Perfil completo • Personalizable",
  },
  {
    step: "03",
    title: "Conexión con la Red",
    description: "Comience a recibir oportunidades, conecte con otras empresas y proveedores. Acceda al ecosistema completo de herramientas B2B.",
    icon: Users,
    detail: "Red activa • +100 empresas",
  },
];

/* ─── Component ─── */
export function PublicEmpresasLanding() {
  const { openAuthModal } = useAuth();
  const empresasPreview = getEmpresas().slice(0, 3);

  /* Parallax refs */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], ["0%", "20%"]);
  const heroOverlayOpacity = useTransform(heroProgress, [0, 0.5], [0.55, 0.8]);

  return (
    <div className="bg-[#f7f9fb] overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          SECTION 1: CINEMATIC HERO
      ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-end overflow-hidden">
        {/* Background Image w/ Parallax */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroImageY }}>
          <Image
            src="/landing/hero-industrial.png"
            alt="Vista del Distrito de Almirante Brown"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </motion.div>

        {/* Dark Gradient Overlay */}
        <motion.div
          className="absolute inset-0 z-[1] bg-gradient-to-t from-[#00213f] via-[#00213f]/70 to-transparent"
          style={{ opacity: heroOverlayOpacity }}
        />

        {/* Subtle Pattern */}
        <div className="absolute inset-0 z-[2] opacity-[0.02]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24 pt-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-xl rounded-sm px-4 py-2 mb-8 border border-white/[0.06]">
              <Building2 className="w-4 h-4 text-primary-200" />
              <span className="text-[13px] font-medium text-white/80 tracking-[0.06em] uppercase">Directorio Industrial Verificado</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-[3.8rem] font-bold text-white leading-[1.08] tracking-[-0.02em] mb-7"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              El ecosistema de empresas
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-primary-200 to-blue-300">
                que mueve la industria
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg lg:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
              Cientos de empresas y comercios del Partido de Almirante Brown. Directorio verificado. Oportunidades exclusivas. Red B2B activa.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={openAuthModal}
                className="h-13 px-8 rounded-sm font-bold text-[15px] bg-white text-[#00213f] hover:bg-primary-50 shadow-2xl shadow-black/20 active:scale-[0.98] transition-all"
              >
                Acceder al Directorio
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <a
                href="#que-encontraras"
                className="h-13 px-8 rounded-sm font-semibold text-[15px] border border-white/15 text-white/90 hover:bg-white/10 transition-all inline-flex items-center justify-center backdrop-blur-sm"
              >
                Descubrir más
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </a>
            </motion.div>
          </motion.div>

          {/* Floating Stats Row */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4"
          >
            {[
              { val: "100+", label: "Empresas Radicadas" },
              { val: "50+", label: "Proveedores Activos" },
              { val: "15", label: "Sectores Industriales" },
              { val: "500+", label: "Conexiones B2B" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={i + 4}
                className="bg-white/[0.06] backdrop-blur-md rounded-sm px-5 py-4 border border-white/[0.06] group hover:bg-white/[0.1] transition-all duration-300"
              >
                <div className="text-2xl lg:text-3xl font-bold text-white mb-0.5 tracking-tight">{s.val}</div>
                <div className="text-[12px] text-white/50 font-medium tracking-[0.02em]">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: "¿QUÉ ENCONTRARÁS?" — EDITORIAL NARRATIVE
      ═══════════════════════════════════════════ */}
      <section id="que-encontraras" className="py-24 lg:py-36 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header — Asymmetric */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-20 lg:mb-28 max-w-2xl"
          >
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-4">
              Plataforma UIAB Conecta
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.75rem] font-bold text-[#191c1e] leading-[1.15] tracking-[-0.01em] mb-6"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Todo lo que su empresa necesita
              para crecer dentro de la red
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 leading-relaxed">
              UIAB Conecta no es un simple listado. Es una plataforma de gestión B2B diseñada para que las empresas y comercios de Almirante Brown generen negocios reales.
            </motion.p>
          </motion.div>

          {/* Value Props — Editorial 2-column with image */}
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center mb-28">
            {/* Left: Platform Preview Image */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={scaleIn}
              className="relative"
            >
              <div className="relative rounded-sm overflow-hidden shadow-2xl shadow-primary-900/10">
                <Image
                  src="/landing/platform-preview.png"
                  alt="Vista previa de la plataforma UIAB Conecta"
                  width={640}
                  height={480}
                  className="w-full h-auto"
                />
                {/* Glass overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-sm p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#191c1e]">Panel de Control Personalizado</p>
                      <p className="text-[11px] text-slate-500">Métricas, oportunidades y conexiones en un solo lugar</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-primary-100/40 rounded-sm" />
            </motion.div>

            {/* Right: Value propositions list */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="space-y-8"
            >
              {valueProps.map((vp, i) => {
                const Icon = vp.icon;
                return (
                  <motion.div key={vp.title} variants={fadeUp} custom={i} className="flex gap-5 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-sm bg-[#f2f4f6] flex items-center justify-center group-hover:bg-primary-50 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-[#191c1e] group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-[#191c1e] mb-1.5">{vp.title}</h3>
                      <p className="text-[14px] text-slate-500 leading-relaxed">{vp.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: SECTORES INDUSTRIALES — HORIZONTAL SCROLL
      ═══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-14"
          >
            <div className="max-w-lg mb-8 lg:mb-0">
              <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-3">
                Diversidad Productiva
              </motion.span>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                15 sectores industriales en un solo ecosistema
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} custom={2} className="text-[14px] text-slate-500 max-w-sm">
              Desde metalúrgica hasta servicios profesionales, el directorio reúne la diversidad productiva de toda la zona sur.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {sectores.map((sector, i) => {
              const Icon = sector.icon;
              return (
                <motion.div
                  key={sector.nombre}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white rounded-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-400 group cursor-default"
                  style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}
                >
                  <div className="w-10 h-10 rounded-sm bg-[#f7f9fb] flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors">
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <p className="text-[14px] font-bold text-[#191c1e] mb-1">{sector.nombre}</p>
                  <p className="text-[12px] text-slate-400">{sector.total} empresas</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: PARTNERSHIP IMAGE + QUOTE
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[520px]">
          {/* Image Half */}
          <div className="relative h-[300px] lg:h-auto">
            <Image
              src="/landing/business-partnership.png"
              alt="Colaboración empresarial y comercial"
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>

          {/* Content Half */}
          <div className="bg-gradient-to-br from-[#00213f] to-[#10375c] p-10 lg:p-16 xl:p-20 flex items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} custom={0}>
                <BadgeCheck className="w-10 h-10 text-primary-200/60 mb-6" />
              </motion.div>
              <motion.blockquote
                variants={fadeUp}
                custom={1}
                className="text-2xl lg:text-3xl text-white font-bold leading-snug tracking-tight mb-6"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                &ldquo;Ser parte de la red UIAB no es figurar en un listado.
                Es tener acceso directo a la cadena de valor industrial más activa de Buenos Aires.&rdquo;
              </motion.blockquote>
              <motion.p variants={fadeUp} custom={2} className="text-primary-200/60 text-[14px] mb-8">
                — Unión Industrial de Almirante Brown
              </motion.p>
              <motion.div variants={fadeUp} custom={3}>
                <Button
                  onClick={openAuthModal}
                  className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 active:scale-[0.98] transition-all"
                >
                  Solicitar ingreso a la red
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5: JOURNEY / HOW IT WORKS — EDITORIAL TIMELINE
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-36 bg-[#f7f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-2xl mb-20"
          >
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-4">
              Su camino al directorio
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Tres pasos para estar conectado
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 leading-relaxed">
              Un proceso simple, seguro y 100% digital. Desde la solicitud hasta la activación de su perfil corporativo.
            </motion.p>
          </motion.div>

          {/* Timeline */}
          <div className="space-y-0">
            {journey.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  custom={0}
                  className="relative"
                >
                  <div className={`grid lg:grid-cols-12 gap-8 items-center py-12 lg:py-16 ${i < journey.length - 1 ? "border-b border-[#e2e5e8]/60" : ""}`}>
                    {/* Step Number */}
                    <div className="lg:col-span-2">
                      <span
                        className="text-[4rem] lg:text-[5rem] font-bold text-primary-100 leading-none tracking-tighter"
                        style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                      >
                        {step.step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-sm bg-primary-50 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[#191c1e]">{step.title}</h3>
                      </div>
                      <p className="text-[15px] text-slate-500 leading-relaxed max-w-lg">{step.description}</p>
                    </div>

                    {/* Detail Badge */}
                    <div className="lg:col-span-4 flex lg:justify-end">
                      <div className="inline-flex items-center gap-2 bg-[#f2f4f6] rounded-sm px-4 py-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary-600" />
                        <span className="text-[13px] font-medium text-slate-600">{step.detail}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: SUBSCRIPTION VALUE — WHAT YOU GET
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-36 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-4">
              Membresía UIAB Conecta
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Qué incluye su suscripción?
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-slate-500 leading-relaxed">
              Cada empresa suscripta accede a herramientas exclusivas que potencian su operación y visibilidad dentro del parque.
            </motion.p>
          </motion.div>

          {/* Feature Grid — Bento-style */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {/* Card 1 — Large */}
            <motion.div variants={fadeUp} custom={0} className="md:col-span-2 bg-gradient-to-br from-[#00213f] to-[#10375c] rounded-sm p-8 lg:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-sm bg-white/10 flex items-center justify-center mb-6">
                  <Search className="w-6 h-6 text-primary-200" />
                </div>
                <h3 className="text-xl font-bold mb-3">Directorio Completo</h3>
                <p className="text-primary-200/70 text-[15px] leading-relaxed max-w-lg mb-6">
                  Acceso ilimitado al listado de todas las empresas radicadas y proveedores verificados. Filtros por sector, ubicación, servicios y certificaciones. Contacto directo sin intermediarios.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Búsqueda avanzada", "Filtros inteligentes", "Contacto directo", "Perfiles completos"].map((tag) => (
                    <span key={tag} className="text-[11px] font-medium text-white/60 bg-white/[0.08] rounded-sm px-3 py-1.5">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={fadeUp} custom={1} className="bg-[#f7f9fb] rounded-sm p-7 group hover:shadow-lg transition-all duration-400" style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}>
              <div className="w-11 h-11 rounded-sm bg-white flex items-center justify-center mb-5 shadow-sm">
                <Bell className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-[16px] font-bold text-[#191c1e] mb-2">Oportunidades</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Notificaciones de pedidos de cotización y licitaciones internas del parque.</p>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={fadeUp} custom={2} className="bg-[#f7f9fb] rounded-sm p-7 group hover:shadow-lg transition-all duration-400" style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}>
              <div className="w-11 h-11 rounded-sm bg-white flex items-center justify-center mb-5 shadow-sm">
                <BarChart3 className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-[16px] font-bold text-[#191c1e] mb-2">Dashboard B2B</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Panel personalizado con métricas de actividad, interacciones y seguimiento.</p>
            </motion.div>

            {/* Card 4 */}
            <motion.div variants={fadeUp} custom={3} className="bg-[#f7f9fb] rounded-sm p-7 group hover:shadow-lg transition-all duration-400" style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}>
              <div className="w-11 h-11 rounded-sm bg-white flex items-center justify-center mb-5 shadow-sm">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-[16px] font-bold text-[#191c1e] mb-2">Sello de Verificación</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Perfil verificado por la UIAB. Credibilidad y confianza ante toda la red.</p>
            </motion.div>

            {/* Card 5 */}
            <motion.div variants={fadeUp} custom={4} className="bg-[#f7f9fb] rounded-sm p-7 group hover:shadow-lg transition-all duration-400" style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}>
              <div className="w-11 h-11 rounded-sm bg-white flex items-center justify-center mb-5 shadow-sm">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-[16px] font-bold text-[#191c1e] mb-2">Gestión Documental</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Suba habilitaciones, certificaciones y documentos para compartir con la red.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7: LIMITED PREVIEW — DIRECTORY SNEAK PEEK
      ═══════════════════════════════════════════ */}
      <section id="preview" className="py-24 lg:py-32 bg-[#f2f4f6] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-14"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-lg mb-8 lg:mb-0">
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary-50 rounded-sm px-3.5 py-1.5 mb-5">
                  <Star className="w-3.5 h-3.5 text-primary-600" />
                  <span className="text-[12px] font-semibold text-primary-700">Vista previa</span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  custom={1}
                  className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-4"
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                >
                  Conozca algunas de nuestras empresas
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-[15px] text-slate-500 leading-relaxed">
                  Esta es solo una muestra. El directorio completo incluye +100 empresas radicadas con perfiles verificados.
                </motion.p>
              </div>

              <motion.div variants={fadeUp} custom={3}>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-6 rounded-sm font-semibold text-[13px] border-primary-200 text-primary-700 hover:bg-primary-50 transition-all"
                >
                  <Link href="/register">
                    <Lock className="w-3.5 h-3.5 mr-2" />
                    Ver directorio completo
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Preview Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {empresasPreview.map((empresa, i) => (
                <motion.div key={empresa.id} variants={fadeUp} custom={i}>
                  <div
                    className={i === 2 ? "pointer-events-none select-none" : ""}
                    style={i === 2 ? { filter: "blur(6px)", opacity: 0.45 } : undefined}
                  >
                    <ProfileCard entidad={empresa} basePath="/empresas" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Gradient fade + CTA */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f2f4f6] via-[#f2f4f6]/80 to-transparent flex items-end justify-center pb-4 pointer-events-none">
              <div className="pointer-events-auto">
                <Button
                  onClick={openAuthModal}
                  className="h-12 px-8 rounded-sm font-bold text-[14px] bg-[#00213f] hover:bg-[#10375c] text-white shadow-xl shadow-primary-900/15 active:scale-[0.98] transition-all"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Iniciar sesión para ver más
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 8: FINAL CTA — FULL BLEED
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <Building2 className="w-10 h-10 text-primary-200/40 mx-auto mb-6" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Empiece a generar negocios
              <br className="hidden md:block" />
              dentro del directorio comercial
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-primary-200/60 mb-10 max-w-2xl mx-auto leading-relaxed">
              Únase a las más de 100 empresas radicadas que ya operan dentro de UIAB Conecta. Visibilidad, oportunidades y una comunidad industrial activa.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={openAuthModal}
                className="h-13 px-8 rounded-sm font-bold text-[15px] bg-white text-[#00213f] hover:bg-primary-50 shadow-2xl shadow-black/20 active:scale-[0.98] transition-all"
              >
                Crear mi cuenta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <a
                href="https://www.uiab.org"
                target="_blank"
                rel="noopener noreferrer"
                className="h-13 px-8 rounded-sm font-semibold text-[15px] text-white/80 hover:text-white hover:bg-white/10 transition-all inline-flex items-center justify-center border border-white/10"
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
