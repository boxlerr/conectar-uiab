"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  Lock,
  Star,
  ChevronRight,
  ShieldCheck,
  Clock,
  Bell,
  Users,
  BadgeCheck,
  Zap,
  Flame,
  Droplets,
  Hammer,
  HardHat,
  Cable,
  Thermometer,
  PaintBucket,
  Truck,
  Cog,
  Phone,
  Calendar,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { ProfileCard } from "@/components/ui/directorio/ProfileCard";
import { getProveedores } from "@/lib/data/directorio";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
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

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Oficios & Categories ─── */
const oficios = [
  { nombre: "Electricista", icon: Zap, trabajos: "+120 trabajos/mes" },
  { nombre: "Gasista Matriculado", icon: Flame, trabajos: "+85 trabajos/mes" },
  { nombre: "Plomero", icon: Droplets, trabajos: "+95 trabajos/mes" },
  { nombre: "Techista", icon: HardHat, trabajos: "+60 trabajos/mes" },
  { nombre: "Soldador", icon: Cable, trabajos: "+70 trabajos/mes" },
  { nombre: "Refrigeración", icon: Thermometer, trabajos: "+55 trabajos/mes" },
  { nombre: "Pintor Industrial", icon: PaintBucket, trabajos: "+45 trabajos/mes" },
  { nombre: "Cerrajero", icon: Cog, trabajos: "+50 trabajos/mes" },
  { nombre: "Albañil", icon: Hammer, trabajos: "+80 trabajos/mes" },
  { nombre: "Transporte", icon: Truck, trabajos: "+40 trabajos/mes" },
];

const pasos = [
  {
    numero: "01",
    titulo: "Cree su perfil profesional",
    descripcion: "Indicá tu oficio, zona de cobertura, matrícula habilitante y fotos de trabajos realizados. Es gratis y toma 5 minutos.",
    detalle: "5 min • Gratis",
  },
  {
    numero: "02",
    titulo: "La UIAB valida su matrícula",
    descripcion: "Verificamos su habilitación profesional, referencias y experiencia. Una vez aprobado, recibe el sello de Proveedor Verificado.",
    detalle: "Respuesta en 48hs",
  },
  {
    numero: "03",
    titulo: "Empezá a recibir trabajos",
    descripcion: "Las empresas y particulares del partido te contactan cuando necesitan tu servicio. Vos cotizás, ellos contratan. Sin intermediarios.",
    detalle: "Contacto directo",
  },
];

const historias = [
  {
    nombre: "Carlos M.",
    oficio: "Electricista Industrial",
    texto: "Antes dependía del boca a boca. Ahora las empresas me llaman directo cuando necesitan un electricista. Tengo trabajo fijo todas las semanas.",
    metric: "4 clientes fijos",
  },
  {
    nombre: "Laura P.",
    oficio: "Gasista Matriculada",
    texto: "El sello UIAB me dio credibilidad instantánea. Las empresas confían porque saben que mi matrícula está verificada. Tripliqué mis ingresos.",
    metric: "3x ingresos",
  },
  {
    nombre: "Martín R.",
    oficio: "Techista y Canaletas",
    texto: "Recibo solicitudes de cotización cada semana. Las fábricas del parque siempre necesitan mantenimiento de techos. Es un flujo constante.",
    metric: "6 cotiz./semana",
  },
];

/* ─── Component ─── */
export function PublicProveedoresLanding() {
  const { openAuthModal } = useAuth();
  const proveedoresPreview = getProveedores().slice(0, 2);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <div className="bg-[#f7f9fb] overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          SECTION 1: HERO — SPLIT LAYOUT
          Left: Copy. Right: Portrait photo.
      ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[90vh] overflow-hidden">
        {/* UIAB Primary background — FIXED gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#10375c] to-[#0c2d4a]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:py-0 lg:min-h-[90vh] flex items-center">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center w-full">

            {/* Left Column — Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-6 xl:col-span-5"
            >
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-md rounded-sm px-3.5 py-2 mb-7">
                <Wrench className="w-3.5 h-3.5 text-primary-200" />
                <span className="text-[12px] font-semibold text-white/70 tracking-[0.08em] uppercase">Para profesionales independientes</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] font-bold text-white leading-[1.06] tracking-[-0.02em] mb-6"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Tu oficio,
                <br />
                tu cartera
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-blue-300">de clientes</span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-[16px] text-white/70 max-w-md mb-8 leading-relaxed" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
                Electricistas, gasistas, plomeros, techistas y más.
                Registrá tu servicio y empezá a recibir trabajos de empresas y clientes de Almirante Brown.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button
                  onClick={openAuthModal}
                  className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
                >
                  Registrar mi servicio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <a
                  href="#como-funciona"
                  className="h-12 px-7 rounded-sm font-semibold text-[14px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
                >
                  ¿Cómo funciona?
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </motion.div>

              {/* Trust signals */}
              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 text-[12px] text-white/35">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary-300/60" /> Registro gratuito</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary-300/60" /> Matrícula verificada</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-300/60" /> En 48hs activo</span>
              </motion.div>
            </motion.div>

            {/* Right Column — Portrait Image */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInRight}
              className="lg:col-span-6 xl:col-span-7 relative hidden lg:block"
            >
              <div className="relative">
                <motion.div style={{ y: heroY }}>
                  <Image
                    src="/landing/pro-tradesperson.png"
                    alt="Profesional independiente verificado"
                    width={700}
                    height={700}
                    className="w-full h-auto rounded-sm object-cover"
                    priority
                  />
                </motion.div>
                {/* Gradient fade on edges to blend */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#10375c] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c2d4a] to-transparent" />

                {/* Floating stat card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-8 left-8 bg-white/[0.08] backdrop-blur-xl rounded-sm px-5 py-4 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-primary-200/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-[18px] font-bold text-white">+50 profesionales</p>
                      <p className="text-[11px] text-white/40">verificados en la red</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar at the bottom of the hero (mobile visible too) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { val: "50+", label: "Profesionales Verificados" },
              { val: "500+", label: "Empresas en la Red" },
              { val: "24h", label: "Tiempo de Contacto" },
              { val: "10", label: "Oficios Disponibles" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={i + 5}
                className="bg-white/[0.06] backdrop-blur-md rounded-sm px-5 py-4 border border-white/[0.06]"
              >
                <div className="text-2xl font-bold text-white mb-0.5 tracking-tight">{s.val}</div>
                <div className="text-[11px] text-white/40 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: OFICIOS GRID
      ═══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-3">
              Oficios con demanda real
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.5rem] font-bold text-[#191c1e] tracking-tight"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Cuál es tu oficio?
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {oficios.map((oficio, i) => {
              const Icon = oficio.icon;
              return (
                <motion.div
                  key={oficio.nombre}
                  variants={fadeUp}
                  custom={i}
                  className="bg-white rounded-sm px-5 py-5 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                  style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.03)" }}
                >
                  <Icon className="w-6 h-6 text-[#191c1e]/30 group-hover:text-primary-600 transition-colors mb-3" />
                  <p className="text-[14px] font-bold text-[#191c1e] mb-0.5">{oficio.nombre}</p>
                  <p className="text-[11px] text-[#191c1e]/50 font-medium">{oficio.trabajos}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: VALUE PROPOSITION — ALTERNATING BLOCKS WITH POWER ANCHORS
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
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-4">
              ¿Por qué registrarte?
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
                num: "100+",
                label: "Empresas industriales",
                heading: "Empresas y comercios de todo el partido necesitan tu servicio",
                body: "Cientos de empresas y emprendimientos en Almirante Brown necesitan profesionales, técnicos y oficios particulares todas las semanas. Cada fábrica, cada negocio y particular del partido es un cliente potencial para vos.",
                icon: Users,
              },
              {
                num: "24h",
                label: "Tiempo promedio de contacto",
                heading: "Recibí solicitudes de trabajo en tu celular",
                body: "Cuando una empresa del parque necesita tu oficio, te llega una notificación. Vos cotizás, ellos te contratan. Sin plataformas que se queden con un porcentaje, sin intermediarios. El contacto es directo entre vos y la empresa.",
                icon: Phone,
              },
              {
                num: "100%",
                label: "Credibilidad profesional",
                heading: "Tu matrícula verificada por la UIAB",
                body: "El sello de Proveedor Verificado UIAB le dice a las empresas que tu habilitación es real, que tu experiencia fue validada y que sos un profesional confiable. No es un perfil anónimo en una red social — es respaldo institucional.",
                icon: BadgeCheck,
              },
            ].map((block, i) => (
              <motion.div
                key={block.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={stagger}
                className={`grid lg:grid-cols-12 gap-8 lg:gap-16 items-center py-16 lg:py-20 ${
                  i < 2 ? "border-b border-[#e2e5e8]/40" : ""
                }`}
              >
                {/* Large metric */}
                <motion.div variants={fadeUp} custom={0} className={`lg:col-span-3 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <span
                    className="text-[4.5rem] lg:text-[6rem] font-bold text-[#00213f]/15 leading-none tracking-tighter block"
                    style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                  >
                    {block.num}
                  </span>
                  <span className="text-[12px] font-bold text-[#00213f]/40 tracking-[0.04em] uppercase">{block.label}</span>
                </motion.div>

                {/* Content */}
                <motion.div variants={fadeUp} custom={1} className={`lg:col-span-9 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-sm bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <block.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3
                      className="text-xl lg:text-2xl font-bold text-[#191c1e] leading-snug"
                      style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    >
                      {block.heading}
                    </h3>
                  </div>
                  <p className="text-[15px] text-[#191c1e]/50 leading-relaxed max-w-2xl lg:ml-14">
                    {block.body}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: TRADES COLLAGE — FULL-BLEED IMAGE
      ═══════════════════════════════════════════ */}
      <section className="relative h-[420px] lg:h-[520px] overflow-hidden">
        <Image
          src="/landing/trades-collage.png"
          alt="Profesionales de diferentes oficios trabajando"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#00213f]/90 via-[#00213f]/60 to-transparent" />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-lg"
          >
            <motion.blockquote
              variants={fadeUp}
              custom={0}
              className="text-2xl lg:text-3xl text-white font-bold leading-snug tracking-tight mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              &ldquo;Plomeros, electricistas, gasistas y techistas.
              Cada oficio tiene su lugar en la industria.&rdquo;
            </motion.blockquote>
            <motion.p variants={fadeUp} custom={1} className="text-primary-200/50 text-[13px] mb-7">
              — Red de Proveedores UIAB
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button
                onClick={openAuthModal}
                className="h-11 px-6 rounded-sm font-bold text-[13px] bg-white text-[#00213f] hover:bg-primary-50 active:scale-[0.98] transition-all shadow-lg"
              >
                Quiero registrarme
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5: ¿CÓMO FUNCIONA? — HORIZONTAL CARDS
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
            <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-3">
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
            <motion.p variants={fadeUp} custom={2} className="text-[15px] text-[#191c1e]/60 leading-relaxed">
              Tres pasos para conectar y recibir trabajos formales en el partido.
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
                className="bg-white rounded-sm p-8 relative group hover:shadow-md transition-all duration-300"
                style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.03)" }}
              >
                <span
                  className="absolute top-4 right-5 text-[5rem] font-bold text-[#00213f]/5 leading-none select-none group-hover:text-[#00213f]/10 transition-colors"
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                >
                  {paso.numero}
                </span>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-sm bg-primary-50 flex items-center justify-center mb-5">
                    {paso.numero === "01" && <Calendar className="w-5 h-5 text-primary-600" />}
                    {paso.numero === "02" && <ShieldCheck className="w-5 h-5 text-primary-600" />}
                    {paso.numero === "03" && <Phone className="w-5 h-5 text-primary-600" />}
                  </div>

                  <h3 className="text-[17px] font-bold text-[#191c1e] mb-2">{paso.titulo}</h3>
                  <p className="text-[13px] text-[#191c1e]/45 leading-relaxed mb-5">{paso.descripcion}</p>

                  <div className="inline-flex items-center gap-1.5 bg-[#f2f4f6] rounded-sm px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[11px] font-semibold text-[#191c1e]/50">{paso.detalle}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: TESTIMONIALS / HISTORIAS
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
              <motion.span variants={fadeUp} custom={0} className="text-[11px] font-semibold text-primary-600 tracking-[0.14em] uppercase block mb-3">
                Historias reales
              </motion.span>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Profesionales que ya trabajan con la red
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} custom={2} className="text-[13px] text-[#191c1e]/60 max-w-sm">
              Cada historia es de un profesional independiente que hoy tiene clientes industriales fijos gracias a UIAB Conecta.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-5"
          >
            {historias.map((h, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-[#f7f9fb] rounded-sm p-7 relative group"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-sm bg-[#00213f] flex items-center justify-center text-white font-bold text-[13px]">
                    {h.nombre.split(" ").map(n => n[0]).join("")}
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
                  <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-sm">
                    {h.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7: LIMITED PREVIEW
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
                <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary-50 rounded-sm px-3.5 py-1.5 mb-5">
                  <Star className="w-3.5 h-3.5 text-primary-600" />
                  <span className="text-[12px] font-semibold text-primary-700">Vista previa</span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  custom={1}
                  className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-3"
                  style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                >
                  Profesionales destacados
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-[14px] text-[#191c1e]/40 leading-relaxed">
                  Estos son solo algunos de los proveedores verificados. Accedé al catálogo completo con datos de contacto.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {proveedoresPreview.map((prov, i) => (
                <motion.div key={prov.id} variants={fadeUp} custom={i}>
                  <div
                    className={i === 1 ? "pointer-events-none select-none" : ""}
                    style={i === 1 ? { filter: "blur(6px)", opacity: 0.4 } : undefined}
                  >
                    <ProfileCard entidad={prov} basePath="/proveedores" />
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
          SECTION 8: BOTTOM CTA
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] to-[#10375c]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <Wrench className="w-9 h-9 text-primary-200/30 mx-auto mb-5" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.75rem] font-bold text-white leading-[1.12] tracking-tight mb-5"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Tu oficio merece
              <br />
              clientes industriales
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-primary-200/40 text-[15px] mb-9 max-w-xl mx-auto leading-relaxed">
              Registrá tu servicio, verificá tu matrícula y empezá a recibir trabajos de las empresas más importantes de la zona sur.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={openAuthModal}
                className="h-12 px-8 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
              >
                Registrar mi servicio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={openAuthModal}
                variant="ghost"
                className="h-12 px-7 rounded-sm font-semibold text-[14px] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
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
