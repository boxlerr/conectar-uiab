"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Lock,
  Star,
  ChevronRight,
  ShieldCheck,
  Clock,
  Users,
  BadgeCheck,
  Zap,
  Thermometer,
  Truck,
  Cog,
  Phone,
  Calendar,
  Globe,
  FileText,
  HardHat,
  Droplets,
  Building2,
  Handshake,
  LayoutGrid,
  User,
  Factory,
} from "lucide-react";
import { LandingProfileCard } from "@/components/ui/directorio/tarjeta-perfil-landing";
import { getEmpresas, getProveedores } from "@/lib/datos/directorio";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Oficios & Rubros (unified dual-audience catalog) ─── */
const rubrosEmpresas = [
  { nombre: "Metalúrgica & Mecánica", icon: Factory, desc: "Fabricación y procesos" },
  { nombre: "Química & Plásticos", icon: Zap, desc: "Insumos industriales" },
  { nombre: "Alimentaria", icon: Globe, desc: "Producción y distribución" },
  { nombre: "Logística & Transporte", icon: Truck, desc: "Empresas de logística" },
  { nombre: "Construcción", icon: HardHat, desc: "Obra e infraestructura" },
  { nombre: "Servicios B2B", icon: Handshake, desc: "Empresas socias UIAB" },
];

const oficiosParticulares = [
  { nombre: "Electricista", icon: Zap, desc: "Instalaciones · bajo y media tensión" },
  { nombre: "Gasista & Plomero", icon: Droplets, desc: "Gas natural · sanitaria" },
  { nombre: "Refrigeración (HVAC)", icon: Thermometer, desc: "Frío industrial · A/A" },
  { nombre: "Albañil & Construcción", icon: HardHat, desc: "Obra · reformas · pintura" },
  { nombre: "Carpintero & Herrero", icon: Wrench, desc: "Madera · herrería · soldadura" },
  { nombre: "Contador / Asesor Fiscal", icon: FileText, desc: "Monotributo · impuestos" },
  { nombre: "Abogado / Asesor Legal", icon: ShieldCheck, desc: "Laboral · comercial" },
  { nombre: "Programador / Técnico IT", icon: Cog, desc: "Software · soporte · redes" },
  { nombre: "Diseñador / Publicidad", icon: LayoutGrid, desc: "Gráfico · web · marcas" },
  { nombre: "Seguridad & Higiene", icon: BadgeCheck, desc: "Auditorías · habilitaciones" },
];

const pasos = [
  {
    numero: "01",
    titulo: "Elegí quién sos",
    descripcion:
      "¿Sos una empresa socia UIAB con productos o servicios, o sos un profesional particular matriculado? El directorio tiene un lugar para cada uno.",
    detalle: "Empresa o particular",
    audiencia: "ambos",
  },
  {
    numero: "02",
    titulo: "La UIAB valida tu perfil",
    descripcion:
      "Verificamos habilitación, matrícula profesional y referencias. Una vez aprobado, recibís el sello de Socio UIAB (para empresas) o el alta como profesional en la red.",
    detalle: "Respuesta en 48hs",
    audiencia: "ambos",
  },
  {
    numero: "03",
    titulo: "Recibí clientes sin intermediarios",
    descripcion:
      "Las empresas del partido te contactan directo, o podés publicar y responder oportunidades abiertas. Sin comisiones, sin mediadores digitales.",
    detalle: "Contacto directo",
    audiencia: "ambos",
  },
];

const historias = [
  {
    nombre: "Ingeniería Martín SRL",
    oficio: "Empresa socia · Metalmecánica",
    tipo: "empresa",
    texto:
      "Pasamos de ser desconocidos en el partido a tener una cartera estable de clientes industriales. Las oportunidades que circulan en la red son reales y relevantes.",
    metric: "+12 proyectos/año",
  },
  {
    nombre: "Elena F.",
    oficio: "Particular · Contabilidad y Auditoría",
    tipo: "particular",
    texto:
      "El sello de Particular UIAB me dio la confianza que las PyMEs comerciales de Almirante Brown necesitaban. Hoy asesoro a más de 12 comercios locales.",
    metric: "12 clientes fijos",
  },
  {
    nombre: "Marcos L.",
    oficio: "Particular · Sistemas y Soporte IT",
    tipo: "particular",
    texto:
      "Increíble la cantidad de empresas que buscan digitalizarse. A través del directorio encontré proyectos de automatización y trazabilidad en tiempo récord.",
    metric: "8 proyectos IT",
  },
];

/* ─── Component ─── */
export function PublicProveedoresParticularesLanding() {
  const { openAuthModal } = useAuth();
  const empresasPreview = getEmpresas().slice(0, 1);
  const particularesPreview = getProveedores().slice(0, 2);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <div className="bg-[#f7f9fb] overflow-x-hidden">
      {/* ═══════════════════════════════════════════
          SECTION 1: HERO — FULL BLEED CINEMATIC
      ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden w-full min-h-[100svh] flex flex-col bg-[#00213f] -mt-16 sm:-mt-20"
      >
        {/* Background Image w/ Parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0 overflow-hidden scale-[1.08]">
          <Image
            src="/landing/hero-industrial.png"
            alt="Parque industrial de Almirante Brown"
            fill
            quality={100}
            className="object-cover object-left"
            priority
            sizes="100vw"
          />
        </motion.div>

        {/* Dark Gradient Overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-[#00182e] via-[#00213f]/80 to-transparent" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#00182e]/90 via-[#00182e]/50 to-transparent" />
        {/* Amber accent glow — señal de la dualidad */}
        <div className="absolute bottom-0 right-0 z-[2] w-[600px] h-[400px] bg-amber-500/10 blur-[140px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 z-[2] opacity-[0.02]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center pt-28 sm:pt-32 lg:pt-36 pb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-sm px-4 py-1.5 mb-5 border border-white/20 shadow-xl shadow-black/10"
            >
              <Wrench className="w-3.5 h-3.5 text-primary-200" />
              <span className="text-[12px] font-medium text-white tracking-[0.06em] uppercase">
                Servicios & Productos · UIAB Conecta
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.05] tracking-[-0.03em] mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Todo el ecosistema productivo
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-primary-200 to-amber-200">
                del partido en un solo directorio.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[15px] lg:text-[17px] text-white/80 max-w-xl mb-8 leading-relaxed font-medium"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              Empresas socias UIAB con oferta industrial B2B,{" "}
              <strong className="text-white">junto con</strong> proveedores de servicios matriculados
              — electricistas, gasistas, contadores, programadores y más.
              Directo, sin intermediarios.
            </motion.p>



            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button
                onClick={openAuthModal}
                className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
              >
                Acceder al directorio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <a
                href="#quienes-estan"
                className="h-12 px-7 rounded-sm font-semibold text-[14px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center border border-white/10"
              >
                ¿Quiénes están adentro?
                <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/70"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verificación UIAB
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Matrícula & habilitación
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-4 h-4 text-emerald-400" /> En 48hs activo
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Floating stats row */}
      <div className="relative z-20 -mt-10 lg:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          {[
            { val: "+60", label: "Empresas socias" },
            { val: "50+", label: "Proveedores activos" },
            { val: "24h", label: "Tiempo de contacto" },
            { val: "20+", label: "Rubros & oficios" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={i}
              className="bg-[#00182e]/60 backdrop-blur-xl rounded-xl px-5 py-4 border border-white/10 shadow-2xl shadow-black/20 hover:bg-[#00182e]/80 transition-all duration-300 group"
            >
              <div className="text-xl lg:text-3xl font-bold text-white mb-0.5 tracking-tight">
                {s.val}
              </div>
              <div className="text-[11px] text-white/50 font-semibold tracking-wide uppercase">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 2: QUIÉNES ESTÁN ADENTRO — DUAL COLUMNS
          The clarifying section: empresas socias ≠ particulares
      ═══════════════════════════════════════════ */}
      <section id="quienes-estan" className="py-24 lg:py-36 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="max-w-3xl mb-16 lg:mb-20"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-4"
            >
              Cómo está organizado el directorio
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.75rem] font-bold text-[#191c1e] leading-[1.1] tracking-[-0.01em]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Dos tipos de actores,
              <br />
              un único directorio verificado.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-slate-500 leading-relaxed mt-6 max-w-2xl"
            >
              Cuando hablamos de <em className="text-[#191c1e] font-semibold">servicios y productos</em>,
              no nos referimos a un único tipo de perfil. En el partido conviven —y se necesitan mutuamente—
              las empresas socias UIAB y los proveedores de servicios.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Column A — Empresas socias */}
            <motion.article
              variants={fadeUp}
              custom={0}
              className="group relative bg-white rounded-md border border-blue-200/40 p-8 lg:p-10 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-blue-300/60 hover:shadow-[0_24px_60px_-20px_rgba(0,33,63,0.2)]"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#00213f] to-blue-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-sm bg-blue-50 text-[#00213f] flex items-center justify-center ring-1 ring-blue-200/60">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-gradient-to-tr from-[#00213f] to-blue-600 text-white">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Empresas socias</span>
                </div>
              </div>

              <h3
                className="font-manrope text-2xl font-extrabold text-[#191c1e] tracking-tight leading-tight mb-4"
              >
                PyMEs industriales socias UIAB
              </h3>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
                Empresas radicadas en Almirante Brown, con habilitación municipal, que ofrecen productos
                industriales o servicios B2B formalmente. Son las mismas que integran la UIAB como
                institución: metalúrgicas, químicas, alimentarias, constructoras, logísticas y más.
              </p>

              <ul className="space-y-3 mb-7">
                {[
                  "Razón social y habilitación verificadas",
                  "Perfil corporativo con catálogo de rubros",
                  "Contacto institucional directo",
                  "Credibilidad del sello Socio UIAB",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-sm text-[11px] font-black text-[#00213f] tracking-wider uppercase">
                Ejemplos: Metalúrgica · Química · Alimentaria
              </div>
            </motion.article>

            {/* Column B — Particulares */}
            <motion.article
              variants={fadeUp}
              custom={1}
              className="group relative bg-white rounded-md border border-amber-200/40 p-8 lg:p-10 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-[0_24px_60px_-20px_rgba(245,158,11,0.25)]"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 to-orange-400 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center ring-1 ring-amber-200/60">
                  <User className="w-5 h-5" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Proveedores de servicios</span>
                </div>
              </div>

              <h3
                className="font-manrope text-2xl font-extrabold text-[#191c1e] tracking-tight leading-tight mb-4"
              >
                Profesionales matriculados independientes
              </h3>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
                Ingenieros, técnicos, contadores, diseñadores, programadores, asesores y oficios
                habilitados que trabajan por cuenta propia. Son personas físicas con matrícula o
                habilitación individual, no empresas. Por eso los llamamos{" "}
                <strong className="text-[#191c1e]">proveedores de servicios</strong>: individuos que ofrecen
                servicios de manera autónoma, en paralelo a las empresas socias.
              </p>

              <ul className="space-y-3 mb-7">
                {[
                  "Matrícula profesional verificada",
                  "Perfil personal con especialidad y oficio",
                  "Contacto directo por WhatsApp / email",
                  "Sello de Proveedor de servicios UIAB",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="inline-flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-sm text-[11px] font-black text-amber-800 tracking-wider uppercase">
                Ejemplos: Ingeniero · Contador · Electricista
              </div>
            </motion.article>
          </motion.div>

          {/* Unifying footnote */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex items-start gap-4 p-6 bg-[#f2f4f6] rounded-sm border border-slate-200/60 max-w-4xl"
          >
            <div className="w-10 h-10 rounded-sm bg-white text-[#00213f] flex items-center justify-center shrink-0 shadow-sm">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              <strong className="text-[#191c1e]">Dentro del directorio</strong> vas a encontrar los dos en
              pestañas separadas: <span className="font-semibold text-[#00213f]">Empresas socias</span> y{" "}
              <span className="font-semibold text-amber-700">Proveedores de servicios</span>. Buscá por rubro, oficio
              o localidad — y contactá sin intermediarios.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: RUBROS & OFICIOS — DUAL GRID
      ═══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Rubros de empresas socias */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-[2px] bg-[#00213f]" />
              <span className="text-[11px] font-black tracking-[0.22em] uppercase text-[#00213f]">
                Rubros · Empresas socias
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.4rem] font-bold text-[#191c1e] tracking-tight mb-10 max-w-2xl leading-[1.1]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Qué producen y ofrecen las empresas del partido?
            </motion.h2>

            <motion.div
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {rubrosEmpresas.map((r, i) => {
                const Icon = r.icon;
                return (
                  <motion.div
                    key={r.nombre}
                    variants={fadeUp}
                    custom={i}
                    className="bg-white rounded-sm px-5 py-5 group hover:bg-[#e8f0fb] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default border border-transparent hover:border-[#00213f]/10"
                    style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.03)" }}
                  >
                    <Icon className="w-6 h-6 text-[#191c1e]/30 group-hover:text-[#00213f] transition-colors mb-3" />
                    <p className="text-[13px] font-bold text-[#191c1e] mb-0.5 leading-tight">{r.nombre}</p>
                    <p className="text-[10px] text-[#191c1e]/50 font-medium group-hover:text-[#00213f]/60">{r.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Oficios de particulares */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-[2px] bg-amber-500" />
              <span className="text-[11px] font-black tracking-[0.22em] uppercase text-amber-700">
                Oficios · Proveedores de servicios matriculados
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.4rem] font-bold text-[#191c1e] tracking-tight mb-10 max-w-2xl leading-[1.1]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Qué oficios y profesionales independientes están en el directorio?
            </motion.h2>

            <motion.div
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              {oficiosParticulares.map((oficio, i) => {
                const Icon = oficio.icon;
                return (
                  <motion.div
                    key={oficio.nombre}
                    variants={fadeUp}
                    custom={i}
                    className="bg-white rounded-sm px-5 py-5 group hover:bg-amber-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default border border-transparent hover:border-amber-200/60"
                    style={{ boxShadow: "0 1px 2px rgba(245,158,11,0.04)" }}
                  >
                    <Icon className="w-6 h-6 text-[#191c1e]/30 group-hover:text-amber-600 transition-colors mb-3" />
                    <p className="text-[13px] font-bold text-[#191c1e] mb-0.5 leading-tight">
                      {oficio.nombre}
                    </p>
                    <p className="text-[10px] text-amber-700/60 font-medium group-hover:text-amber-700">{oficio.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: VALUE PROPS — ALTERNATING BLOCKS
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-36 bg-[#f7f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="max-w-xl mb-20 lg:mb-28"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-4"
            >
              ¿Por qué estar adentro?
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.75rem] font-bold text-[#191c1e] leading-[1.12] tracking-[-0.01em]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Las empresas te buscan.
              <br />
              Nosotros te conectamos.
            </motion.h2>
          </motion.div>

          <div className="space-y-0">
            {[
              {
                num: "+60",
                label: "Empresas industriales",
                heading: "Empresas y comercios del partido necesitan tu servicio",
                body: "Cientos de empresas y emprendimientos en Almirante Brown necesitan productos, servicios, profesionales, técnicos y oficios todas las semanas. Cada fábrica, cada negocio y cada PyME del partido es un cliente potencial tanto para empresas socias como para proveedores de servicios.",
                icon: Users,
                tone: "blue" as const,
              },
              {
                num: "24h",
                label: "Tiempo promedio de contacto",
                heading: "Contacto directo vía email, teléfono o WhatsApp",
                body: "Cuando una empresa necesita tu servicio te contactará directamente, o podés ser vos quien los contacte al ver sus oportunidades publicadas. Sin plataformas que se queden con un porcentaje, sin intermediarios.",
                icon: Phone,
                tone: "blue" as const,
              },
              {
                num: "100%",
                label: "Credibilidad UIAB",
                heading: "Verificación institucional real, no un perfil anónimo",
                body: "El sello UIAB —Socio (si sos empresa)— le dice a las empresas que tu habilitación, matrícula y trayectoria son reales y fueron validadas institucionalmente. No es un perfil suelto en una red social: es respaldo institucional verificado.",
                icon: BadgeCheck,
                tone: "amber" as const,
              },
            ].map((block, i) => (
              <motion.div
                key={block.num}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, staggerChildren: 0.1 },
                  },
                }}
                className={`grid lg:grid-cols-12 gap-8 lg:gap-16 items-center py-16 lg:py-20 px-6 -mx-6 group ${
                  i < 2 ? "border-b border-[#e2e5e8]/40" : ""
                }`}
              >
                {/* Large metric */}
                <motion.div className={`lg:col-span-3 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <motion.span
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      visible: { opacity: 1, scale: 1 },
                      hover: { 
                        scale: 1.05, 
                        opacity: 1,
                        color: block.tone === "amber" ? "var(--color-accent-500)" : "var(--color-primary-400)" 
                      },
                    }}
                    className={`text-[4.5rem] lg:text-[6rem] font-bold leading-none tracking-tighter block cursor-default transition-all duration-300 ${
                      block.tone === "amber" ? "text-amber-600/20" : "text-[#00213f]/15"
                    }`}
                    style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                  >
                    {block.num}
                  </motion.span>
                  <span
                    className={`text-[12px] font-bold tracking-[0.04em] uppercase block ${
                      block.tone === "amber" ? "text-amber-700/60" : "text-[#00213f]/40"
                    }`}
                  >
                    {block.label}
                  </span>
                </motion.div>

                {/* Content */}
                <motion.div className={`lg:col-span-9 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="flex items-start gap-5 mb-4">
                    <div
                      className={`w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm ${
                        block.tone === "amber"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-primary-50 text-primary-600"
                      }`}
                    >
                      <block.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-2xl lg:text-3xl font-bold text-[#191c1e] leading-snug cursor-default"
                        style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                      >
                        {block.heading}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[16px] text-[#191c1e]/50 leading-relaxed max-w-2xl lg:ml-16">
                    {block.body}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5: TRADES COLLAGE — 4-PANEL MOSAIC
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-[420px] lg:h-[580px] overflow-hidden flex items-center">
        {/* Background Grid Mosaic */}
        <div className="absolute inset-0 z-0 grid grid-cols-2 lg:grid-cols-4">
          {[
            { src: "/landing/gasista_industrial.png", alt: "Gasista Industrial" },
            { src: "/landing/electricista_industrial.png", alt: "Electricista Industrial" },
            { src: "/landing/contador_profesional.png", alt: "Contador Profesional" },
            { src: "/landing/disenador_ingeniero.png", alt: "Diseñador / Ingeniero" },
          ].map((panel, idx) => (
            <div
              key={idx}
              className="relative w-full h-full overflow-hidden group border-r border-white/5 last:border-0"
            >
              <Image
                src={panel.src}
                alt={panel.alt}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>

        {/* Institutional overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00213f]/95 via-[#00213f]/75 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-[#00182e]/40 z-[1] lg:hidden" />

        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-xl"
          >
            <motion.blockquote
              variants={fadeUp}
              custom={0}
              className="text-2xl lg:text-3xl text-white font-bold leading-[1.15] tracking-tight mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              &ldquo;Metalúrgicas, contadores, gasistas, diseñadores industriales.
              Cada producto y cada oficio tiene su lugar en Almirante Brown.&rdquo;
            </motion.blockquote>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-primary-200/60 text-[13px] font-semibold tracking-wider uppercase mb-8"
            >
              — Directorio UIAB Conecta
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="h-12 px-8 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 active:scale-[0.98] transition-all shadow-xl shadow-black/20"
              >
                <Link href="/register?role=company">
                  Registrar mi empresa
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 px-8 rounded-sm font-bold text-[14px] bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98] transition-all shadow-xl shadow-black/20"
              >
                <Link href="/register?role=provider">
                  Registrar mi servicio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: CÓMO FUNCIONA — 3 STEPS
      ═══════════════════════════════════════════ */}
      <section id="como-funciona" className="py-24 lg:py-36 scroll-mt-24 bg-[#f7f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-3"
            >
              Simple y directo
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Cómo funciona?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[15px] text-[#191c1e]/60 leading-relaxed"
            >
              Tres pasos para entrar al directorio y empezar a recibir trabajos reales,
              tanto para empresas socias como para proveedores de servicios.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {pasos.map((paso, i) => (
              <motion.div
                key={paso.numero}
                variants={fadeUp}
                custom={i}
                whileHover="hover"
                className="bg-white rounded-sm p-8 relative group hover:shadow-md transition-all duration-300"
                style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.03)" }}
              >
                <motion.span
                  variants={{
                    hover: { 
                      scale: 1.1, 
                      opacity: 1,
                      color: "var(--color-primary-400)"
                    },
                  }}
                  className="absolute top-4 right-5 text-[5rem] font-bold text-[#00213f]/5 leading-none select-none transition-all duration-300"
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                >
                  {paso.numero}
                </motion.span>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-sm bg-primary-50 flex items-center justify-center mb-5">
                    {paso.numero === "01" && <Users className="w-5 h-5 text-primary-600" />}
                    {paso.numero === "02" && <ShieldCheck className="w-5 h-5 text-primary-600" />}
                    {paso.numero === "03" && <Phone className="w-5 h-5 text-primary-600" />}
                  </div>

                  <h3 className="text-[17px] font-bold text-[#191c1e] mb-2">{paso.titulo}</h3>
                  <p className="text-[13px] text-[#191c1e]/45 leading-relaxed mb-5">
                    {paso.descripcion}
                  </p>

                  <div className="inline-flex items-center gap-1.5 bg-[#f2f4f6] rounded-sm px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[11px] font-semibold text-[#191c1e]/50">{paso.detalle}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Dual-path footer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 grid md:grid-cols-2 gap-4 max-w-4xl mx-auto"
          >
            <Link
              href="/register?role=company"
              className="group flex items-center gap-4 p-5 bg-white border border-blue-200/50 rounded-sm hover:border-blue-300 transition-all"
            >
              <div className="w-10 h-10 rounded-sm bg-blue-50 text-[#00213f] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-[#191c1e] uppercase tracking-wide mb-0.5">
                  Soy una empresa
                </p>
                <p className="text-[12px] text-slate-500">Registro institucional de socio UIAB</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#00213f] group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register?role=provider"
              className="group flex items-center gap-4 p-5 bg-white border border-amber-200/50 rounded-sm hover:border-amber-300 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-[#191c1e] uppercase tracking-wide mb-0.5">
                  Soy proveedor de servicios
                </p>
                <p className="text-[12px] text-slate-500">Registro personal con matrícula</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7: TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16"
          >
            <div className="max-w-md mb-6 lg:mb-0">
              <motion.span
                variants={fadeUp}
                custom={0}
                className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-3"
              >
                Historias reales
              </motion.span>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Empresas y proveedores de servicios que ya trabajan con la red
              </motion.h2>
            </div>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[13px] text-[#191c1e]/60 max-w-sm"
            >
              Cada historia es de un socio UIAB o profesional independiente que hoy tiene clientes
              industriales fijos gracias a UIAB Conecta.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-5 relative"
          >
            <div
              aria-hidden
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                background: "rgba(255,255,255,0.35)",
              }}
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-sm px-6 py-5 shadow-xl max-w-sm text-center">
                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-semibold text-[#191c1e] leading-snug">
                  Iniciá sesión o registrate para leer las reseñas completas de la red.
                </p>
                <Button
                  onClick={openAuthModal}
                  className="h-10 px-5 rounded-sm font-bold text-[12px] bg-[#00213f] hover:bg-[#10375c] text-white shadow-md active:scale-[0.98] transition-all"
                >
                  Iniciar sesión o registrarse
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
            {historias.map((h, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                aria-hidden
                className="bg-[#f7f9fb] rounded-sm p-7 relative group border border-slate-100 select-none"
                style={{ filter: "blur(5px)" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 flex items-center justify-center text-white font-bold text-[13px] ${
                      h.tipo === "empresa"
                        ? "rounded-sm bg-[#00213f]"
                        : "rounded-full bg-amber-600"
                    }`}
                  >
                    {h.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#191c1e]">{h.nombre}</p>
                    <p className="text-[11px] text-[#191c1e]/35">{h.oficio}</p>
                  </div>
                </div>

                <p className="text-[14px] text-[#191c1e]/75 leading-relaxed mb-5">
                  &ldquo;{h.texto}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="w-3 h-3 text-primary-500 fill-primary-500" />
                    ))}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-sm ${
                      h.tipo === "empresa"
                        ? "text-primary-700 bg-primary-50"
                        : "text-amber-800 bg-amber-50"
                    }`}
                  >
                    {h.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 8: LIMITED PREVIEW — mix of empresa + particulares
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-[#f2f4f6]">
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
                <motion.div
                  variants={fadeUp}
                  custom={0}
                  className="inline-flex items-center gap-2 bg-primary-50 rounded-sm px-3.5 py-1.5 mb-5"
                >
                  <Star className="w-3.5 h-3.5 text-primary-600" />
                  <span className="text-[12px] font-semibold text-primary-700">Vista previa</span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  custom={1}
                  className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-3"
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                >
                  Una muestra del directorio
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  custom={2}
                  className="text-[14px] text-[#191c1e]/40 leading-relaxed"
                >
                  Empresas socias y proveedores de servicios, conviviendo en el mismo directorio.
                  Accedé al catálogo completo con datos de contacto.
                </motion.p>
              </div>
              <motion.div variants={fadeUp} custom={3}>
                <Button
                  onClick={openAuthModal}
                  variant="outline"
                  className="h-10 px-5 rounded-sm font-semibold text-[12px] border-primary-200 text-primary-700 hover:bg-primary-50 transition-all"
                >
                  <Lock className="w-3 h-3 mr-1.5" />
                  Ver catálogo completo
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {empresasPreview.map((emp, i) => (
                <motion.div key={`emp-${emp.id}`} variants={fadeUp} custom={i}>
                  <LandingProfileCard entidad={emp} basePath="/empresas" />
                </motion.div>
              ))}
              {particularesPreview.map((prov, i) => (
                <motion.div key={`prov-${prov.id}`} variants={fadeUp} custom={i + 1}>
                  <div
                    className={i === 1 ? "pointer-events-none select-none" : ""}
                    style={i === 1 ? { filter: "blur(6px)", opacity: 0.4 } : undefined}
                  >
                    <LandingProfileCard entidad={prov} basePath="/empresas" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#f2f4f6] via-[#f2f4f6]/80 to-transparent flex items-end justify-center pb-3 pointer-events-none">
              <div className="pointer-events-auto">
                <Button
                  onClick={openAuthModal}
                  className="h-11 px-7 rounded-sm font-bold text-[13px] bg-[#00213f] hover:bg-[#10375c] text-white shadow-md active:scale-[0.98] transition-all"
                >
                  <Lock className="w-3.5 h-3.5 mr-2" />
                  Iniciar sesión para ver más
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 9: BOTTOM CTA — DUAL AUDIENCE
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Amber accent glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-primary-200/40" />
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <User className="w-5 h-5 text-amber-200/50" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.75rem] font-bold text-white leading-[1.12] tracking-tight mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Tu empresa o tu oficio
              <br />
              merecen clientes en Almirante Brown.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-primary-200/50 text-[15px] mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Registrá tu empresa socia o tu servicio profesional, verificá tu habilitación y empezá
              a recibir pedidos de fábricas, comercios y particulares de la zona sur de Buenos Aires.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                asChild
                className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
              >
                <Link href="/register?role=company">
                  <Building2 className="w-4 h-4 mr-2" />
                  Registrar empresa
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 px-7 rounded-sm font-bold text-[14px] bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
              >
                <Link href="/register?role=provider">
                  <User className="w-4 h-4 mr-2" />
                  Registrar mi servicio
                </Link>
              </Button>
              <Button
                onClick={openAuthModal}
                variant="ghost"
                className="h-12 px-6 rounded-sm font-semibold text-[14px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
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
