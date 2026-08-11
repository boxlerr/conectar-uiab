"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  Search,
  TrendingUp,
  Wrench,
  Briefcase,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { BannerLogosSocias } from "@/components/ui/directorio/banner-logos-socias";
import type { SociaConLogo } from "@/lib/datos/socias-logos";
import { PreviewDirectorio } from "@/components/ui/directorio/preview-directorio";
import { SeccionBeneficios } from "@/components/ui/directorio/seccion-beneficios";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { useRouter } from "next/navigation";
import { PRECIO_MENSUAL, PRECIO_ANUAL } from "@/lib/mercadopago/suscripciones";

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

/* ─── Precio ───────────────────────────────────────────────────────────────
   Los montos salen de lib/mercadopago/suscripciones para que la landing no se
   desincronice del billing: si cambia el precio, cambia acá solo.          */
const ars = (n: number) => `$${n.toLocaleString("es-AR")}`;
const PAGANDO_MES_A_MES = PRECIO_MENSUAL * 12; // 600.000 → ancla del plan anual
const AHORRO_ANUAL = PAGANDO_MES_A_MES - PRECIO_ANUAL; // 100.000
const EQUIVALENTE_MENSUAL = Math.round(PRECIO_ANUAL / 12); // 41.667
const MESES_GRATIS = Math.round(AHORRO_ANUAL / PRECIO_MENSUAL); // 2

/* Tres promesas, no seis features: la lista larga hacía que nadie la leyera.
   Cada una es una SECCIÓN real de la plataforma y se llama igual que en el
   menú, así lo que se promete acá es lo que se encuentra adentro. Las dos
   primeras se pueden ir a ver antes de pagar. */
const PROMESAS = [
  {
    icon: Search,
    seccion: "Directorio",
    titulo: "Que te encuentren",
    detalle:
      "Tu ficha con el sello de socia verificada, a la vista de toda la red industrial de Almirante Brown.",
    href: "/directorio",
    cta: "Ver el directorio",
  },
  {
    icon: Zap,
    seccion: "Oportunidades",
    titulo: "Que te lleguen pedidos",
    detalle:
      "Publicá lo que necesitás y respondé lo que otros buscan. Te avisamos apenas alguien pide lo que hacés.",
    href: "/oportunidades",
    cta: "Ver oportunidades",
  },
  {
    icon: Users,
    seccion: "Contacto directo",
    titulo: "Que cierres vos",
    detalle: "Teléfono, email y web de cada empresa. Sin intermediarios ni comisiones.",
    href: null,
    cta: null,
  },
];

const TAMBIEN_INCLUYE = [
  "Catálogo de productos",
  "Certificaciones ISO",
  "Reseñas de la red",
  "Acompañamiento UIAB",
];

export default function Home({ sociasLogos }: { sociasLogos: SociaConLogo[] }) {
  const { openAuthModal, currentUser, loading } = useAuth();
  const router = useRouter();
  // Anual por defecto: es el plan que conviene y el que queremos comparar.
  const [ciclo, setCiclo] = useState<"mensual" | "anual">("anual");
  const esAnual = ciclo === "anual";
  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/panel-de-control');
    }
  }, [currentUser, loading, router]);

  return (
    <main className="min-h-svh bg-[#f7f9fb] overflow-x-hidden selection:bg-primary-200">

      {/* ═══════════════════════════════════════════
          HERO — Split layout: Copy left + Platform visual right
      ═══════════════════════════════════════════ */}
      {/* svh (viewport chico) y no vh/dvh: en Safari iOS el 100vh incluye la barra
          de direcciones, así que el hero quedaba cortado por abajo. dvh tampoco
          sirve: reflowea todo el rato mientras la barra entra y sale. */}
      <section className="relative overflow-hidden min-h-[100svh] flex items-center">
        {/* Background (estático — sin parallax para mejor performance) */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#10375c] to-[#0c2d4a]" />
          {/* Dot grid texture */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 w-full">
          <div className="grid md:grid-cols-12 gap-12 md:gap-8 items-center">

            {/* LEFT — Copy */}
            {/* initial={false}: con "reducir movimiento" activo el hero se quedaba
                en opacity:0 para siempre y la portada salía en blanco (mismo
                gotcha ya resuelto en la sección de precio). */}
            <motion.div
              initial={false}
              animate="visible"
              variants={stagger}
              className="md:col-span-6 lg:col-span-5 xl:col-span-5"
            >
              {/* Badge */}
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 bg-white/[0.08] rounded-sm px-4 py-2 mb-8 border border-white/[0.08]"
              >
                <ShieldCheck className="w-4 h-4 text-primary-300" />
                <span className="text-[12px] font-semibold text-white/60 tracking-[0.08em] uppercase">
                  Conectamos industria con profesionales
                </span>
              </motion.div>

              {/*
                El H1 tiene que contener la marca literal.

                Antes decía "Conectamos / Industria / con Profesionales": un
                buen claim, pero sin una sola aparición de "UIAB Conecta" — que
                además no estaba en NINGÚN H1 del sitio y aparecía una sola vez
                en todo el texto visible de la home. Para una consulta de marca
                en un dominio nuevo y sin backlinks, la coincidencia exacta del
                nombre en title + H1 + primer párrafo es prácticamente la única
                señal de relevancia que el sitio puede aportar por sí mismo; sin
                ella Google resuelve "uiab conecta" hacia uiab.org, que es la
                entidad que ya conoce. El claim viejo no se perdió: pasó al
                kicker de arriba.
              */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-[2.5rem] sm:text-[3rem] md:text-[2.5rem] lg:text-[2.75rem] xl:text-[3.5rem] font-bold text-white leading-[1.06] tracking-[-0.02em] mb-6"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-blue-300">
                  UIAB Conecta
                </span>
                <br />
                el directorio industrial
                <br />
                de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-100">
                  Almirante Brown
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-[16px] text-white/60 max-w-md mb-9 leading-relaxed"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                <strong className="font-semibold text-white/80">UIAB Conecta</strong> es la
                plataforma de la Unión Industrial de Almirante Brown que une a las empresas y
                comercios del partido con proveedores verificados. Directorio, oportunidades y
                networking en un solo lugar.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 mb-10">
                {currentUser ? (
                  <Link
                    href="/panel-de-control"
                    className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all inline-flex items-center justify-center"
                  >
                    <Factory className="w-4 h-4 mr-2" />
                    Ir al Panel de Control
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="h-12 px-7 rounded-sm font-bold text-[14px] bg-white text-[#00213f] hover:bg-primary-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all inline-flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrate
                    </Link>
                    {/* Las socias no pagan y su camino es /sumate, no /register.
                        Sin este botón en el hero terminaban registrándose por el
                        circuito arancelado y había que rescatarlas a mano. */}
                    <Link
                      href="/sumate"
                      className="h-12 px-7 rounded-sm font-bold text-[14px] bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-900/25 active:scale-[0.98] transition-all inline-flex items-center justify-center"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Soy socia de la UIAB
                    </Link>
                    <Link
                      href="/directorio"
                      className="h-12 px-7 rounded-sm font-semibold text-[14px] text-white/80 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
                    >
                      <Factory className="w-4 h-4 mr-2" />
                      Explorar el directorio
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Trust signals */}
              <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/90">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Empresas socias de la UIAB
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Perfiles verificados
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Contacto directo
                </span>
              </motion.div>
            </motion.div>

            {/* RIGHT — Platform visual / Dashboard mockup + Connection graphic */}
            <motion.div
              initial={false}
              animate="visible"
              variants={slideInRight}
              className="md:col-span-6 lg:col-span-5 xl:col-span-7 relative hidden md:block"
            >
              <div className="relative max-w-2xl ml-auto">
                {/* Main Industrial Illustration */}
                <div className="relative z-10 w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                  {/* Foto aérea real de la zona industrial del partido. El
                      4:3 nativo (1448×1086) calza con el aspect del contenedor,
                      así que object-cover no recorta nada. */}
                  <Image
                    src="/landing/hero-industrial-aereo.webp"
                    alt="Vista aérea de la zona industrial de Almirante Brown: plantas, depósitos y el barrio alrededor"
                    fill
                    /* Sólo se renderiza en md+ y como máximo a 672px de ancho:
                       sin esto Next sirve el candidato de viewport completo. */
                    sizes="(min-width: 1280px) 672px, (min-width: 1024px) 560px, (min-width: 768px) 360px, 0px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00213f]/60 via-transparent to-transparent" />
                </div>

                {/* Floating card — Empresas.
                    Las 4 flotantes van "hidden lg:block": están posicionadas por
                    fuera de la foto (-left/-right) asumiendo ~672px de ancho, así
                    que en md (columna angosta) se salen del viewport y generan
                    scroll horizontal. Recién desde lg hay lugar. */}
                <motion.div
                  variants={float}
                  initial="initial"
                  animate="animate"
                  className="hidden lg:block absolute -left-6 top-1/4 bg-[#0c2d4a]/85 rounded-sm px-4 py-3 border border-white/10 shadow-xl shadow-black/30 z-20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-sm bg-primary-500/20 flex items-center justify-center">
                      <Factory className="w-4.5 h-4.5 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-[18px] font-bold text-white">Empresas socias</p>
                      <p className="text-[11px] text-white/50">radicadas en Almirante Brown</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — Proveedores */}
                <motion.div
                  variants={float}
                  initial="initial"
                  animate="animate"
                  className="hidden lg:block absolute -right-4 top-[0%] bg-[#0c2d4a]/85 rounded-sm px-4 py-3 border border-white/10 shadow-xl shadow-black/30 z-20"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-sm bg-primary-500/20 flex items-center justify-center">
                      <Wrench className="w-4.5 h-4.5 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">Productos y servicios</p>
                      <p className="text-[10px] text-white/40">Verificados UIAB</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — UIAB Logo */}
                <motion.div
                  variants={float}
                  initial="initial"
                  animate="animate"
                  className="hidden lg:block absolute -left-10 bottom-[15%] bg-[#10375c]/90 rounded-sm px-5 py-4 border border-white/15 shadow-xl shadow-black/30 z-20"
                  style={{ animationDelay: "0.5s" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-11 h-11 flex items-center justify-center bg-white/10 rounded-sm p-1.5">
                       <Image
                         src="/icono-uiab.svg"
                         alt="Logo UIAB Conecta — Aval institucional Unión Industrial de Almirante Brown"
                         width={1536}
                         height={1536}
                         className="object-contain"
                       />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Aval Institucional</p>
                       <p className="text-[14px] font-black text-white leading-tight">Red Privada<br/>UIAB Conecta</p>
                    </div>
                  </div>
                </motion.div>

                {/*
                  Acá vivía un testimonio inventado: cinco estrellas, una cita
                  ("Ricardo es un excelente profesional…") y una persona con
                  nombre y cargo —"Roberto M., Director en Logística Brown"— que
                  no existe. Es el peor dato falso de todos los que tenía el
                  sitio: no es una cifra optimista, es una reseña fabricada
                  publicada por una cámara empresaria.
                  En su lugar va una afirmación sobre cómo funciona la
                  plataforma, que es verificable mirando el propio directorio.
                  Cuando haya reseñas reales y con consentimiento, este es el
                  lugar donde van (la tabla `resenas` hoy tiene 0 aprobadas).
                */}
                <motion.div
                  variants={float}
                  initial="initial"
                  animate="animate"
                  className="hidden lg:block absolute -right-10 bottom-[10%] bg-[#10375c]/90 rounded-sm px-5 py-5 border border-white/15 shadow-xl shadow-black/30 z-20 max-w-[260px]"
                  style={{ animationDelay: "2s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Padrón UIAB
                    </span>
                  </div>
                  <p className="text-[11px] text-white font-medium leading-relaxed mb-4">
                    Cada ficha de UIAB Conecta corresponde a una empresa socia validada contra el
                    padrón de la Unión Industrial de Almirante Brown.
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center shadow-inner">
                      <Factory className="w-4 h-4 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">Sin intermediarios</p>
                      <p className="text-[9px] text-white/50 uppercase tracking-wider font-bold">
                        Contacto directo con la empresa
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade transition */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f7f9fb] to-transparent z-10" />
      </section>

      {/* ═══════════════════════════════════════════
          BANNER — logos de empresas socias en movimiento
      ═══════════════════════════════════════════ */}
      <BannerLogosSocias empresas={sociasLogos} />

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — 3 step visual with isometric connection
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={false}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center"
          >
            {/* Left — Connection illustration */}
            <motion.div variants={fadeUp} custom={0} className="hidden md:flex justify-center">
              <div className="relative w-full max-w-xl">
                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-[0_32px_80px_-20px_rgba(0,33,63,0.35),0_8px_24px_-8px_rgba(0,33,63,0.15)] ring-1 ring-white/60">
                  {/* Foto aérea real del parque industrial de Almirante Brown
                      con el logo montado en placa: el lockup es navy y sobre la
                      foto pelada no se leía. 3:2 nativo, sin recorte. */}
                  <Image
                    src="/landing/uiab-conecta-parque-industrial.webp"
                    alt="Vista aérea del parque industrial de Almirante Brown con el logo de UIAB Conecta"
                    width={1600}
                    height={1067}
                    /* Sólo se muestra en md+ y el contenedor es max-w-xl. */
                    sizes="(min-width: 1024px) 576px, (min-width: 768px) 45vw, 0px"
                    className="w-full h-auto block"
                  />
                </div>
                {/* reflection glow */}
                <div className="absolute -bottom-6 left-8 right-8 h-10 bg-[#00213f]/15 blur-2xl rounded-full" />
              </div>
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
                    desc: "Más de 60 empresas radicadas publican su perfil, buscan proveedores de servicios y acceden a oportunidades de negocio exclusivas.",
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
                    title: "Proveedores de servicios profesionales",
                    desc: "Empresas socias y proveedores de servicios matriculados: ingeniería, sistemas, contabilidad, mantenimiento técnico y más. Todos verificados.",
                    link: "/empresas?categoria=proveedores",
                    linkLabel: "Ver proveedores de servicios",
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
                        className="inline-flex items-center py-3 -my-3 text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
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

      {/* Directory Preview */}
      <PreviewDirectorio />
      
      {/* ═══════════════════════════════════════════
          CORPORATE BENEFITS — SUBSCRIPTION VALUE
      ═══════════════════════════════════════════ */}
      <SeccionBeneficios />

      {/* ═══════════════════════════════════════════
          PILLARS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#f7f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={false}
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
            initial={false}
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Representatividad",
                body: "Defendemos los intereses del sector industrial ante organismos públicos y privados, asegurando un entorno favorable para los negocios.",
                icon: Building,
              },
              {
                title: "Networking Estratégico",
                body: "Fomentamos la sinergia B2B conectando a empresas líderes con proveedores de servicios confiables para maximizar la cadena de valor.",
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
          PRECIO — MEMBRESÍA ÚNICA (visible desde el inicio)
          Los montos reales del billing viven en src/lib/mercadopago/suscripciones.ts
      ═══════════════════════════════════════════ */}
      <section id="precio" className="py-14 lg:py-16 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* initial={false}: con "reducir movimiento" activo, whileInView deja
              el contenido en opacity:0 para siempre (gotcha ya conocido). */}
          <motion.div initial={false} animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-7 lg:mb-9">
              <span
                className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#00213f]/40"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Precio claro, sin sorpresas
              </span>
              <h2
                className="text-3xl md:text-[2.5rem] font-bold text-[#00213f] mt-2.5 tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Una membresía. Todo incluido.
              </h2>
              <p className="text-slate-500 mt-2.5 max-w-xl mx-auto text-[15px] leading-relaxed">
                Lo único que elegís es cada cuánto pagás.
              </p>
            </motion.div>

            {/* Dos columnas: a la izquierda qué se obtiene, a la derecha cuánto
                sale. Entra completo en una pantalla, sin scroll intermedio. */}
            <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* ─── Qué incluye: 3 promesas en vez de 6 features ───
                  En mobile va después del precio: el visitante ya viene de toda
                  la página, lo que le falta es el número. */}
              <motion.div variants={fadeUp} custom={1} className="md:col-span-5 lg:col-span-5 order-2 md:order-1">
                <ul className="space-y-5">
                  {PROMESAS.map((item) => (
                    <li key={item.titulo} className="flex items-start gap-4">
                      <span className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <item.icon className="w-[18px] h-[18px] text-primary-600" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10.5px] font-black uppercase tracking-[0.16em] text-primary-600 mb-1">
                          {item.seccion}
                        </span>
                        <span className="block text-[16px] font-bold text-[#00213f] leading-snug">
                          {item.titulo}
                        </span>
                        <span className="block text-[13.5px] text-slate-500 leading-snug mt-1">
                          {item.detalle}
                        </span>
                        {/* Se puede ir a ver antes de pagar: baja la fricción y
                            de paso muestra que la sección existe de verdad. */}
                        {item.href && (
                          <Link
                            href={item.href}
                            className="group/link mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
                          >
                            {item.cta}
                            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Lo secundario, en chips: se ve que hay más sin obligar a leerlo. */}
                <div className="flex flex-wrap gap-1.5 mt-6 pt-5 border-t border-slate-100">
                  {TAMBIEN_INCLUYE.map((extra) => (
                    <span
                      key={extra}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600"
                    >
                      <CheckCircle2 className="w-3 h-3 text-primary-600" />
                      {extra}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* ─── Un solo precio + selector de ciclo ───
                  Antes había 3 tarjetas compitiendo. Ahora se compara siempre en
                  $/mes: al pasar a anual el número baja a la vista y ahí se
                  entiende el descuento sin tener que explicarlo. */}
              <motion.div variants={fadeUp} custom={2} className="md:col-span-7 lg:col-span-7 order-1 md:order-2">

                {/* Socias UIAB: va ARRIBA del precio y en verde sólido.
                    Antes era una línea de 13.5px debajo de la tarjeta y se
                    perdía: la mitad de las socias no se enteraba de que su
                    membresía ya está paga. Es lo primero que tiene que leer
                    alguien del padrón, antes que cualquier número.
                    Verde y no ámbar a propósito: el ámbar es el color de
                    "pagar" en esta sección (CTA y badge de meses gratis) y
                    este mensaje dice exactamente lo contrario. */}
                <Link
                  href="/sumate"
                  className="group mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl bg-emerald-600 px-5 py-4 sm:px-6 sm:py-5 shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 transition-colors"
                >
                  <span className="flex items-start sm:items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </span>
                    <span className="leading-snug">
                      <span
                        className="block text-white font-black text-[17px] sm:text-xl tracking-tight"
                        style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                      >
                        ¿Tu empresa ya es socia de la UIAB? No pagás nada.
                      </span>
                      <span className="block text-[13.5px] text-white/80 mt-1">
                        Tu membresía ya está incluida en la cuota que abonás.
                      </span>
                    </span>
                  </span>
                  <span className="pl-12 sm:pl-0 sm:ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[13.5px] font-black text-emerald-700 group-hover:gap-2.5 transition-all">
                    Activar
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>

                {/* Selector */}
                <div
                  role="radiogroup"
                  aria-label="Cada cuánto querés pagar"
                  className="flex p-1 rounded-xl bg-slate-100 mb-4"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!esAnual}
                    onClick={() => setCiclo("mensual")}
                    className={`basis-1/2 h-11 rounded-lg text-[13.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00213f] ${
                      !esAnual ? "bg-white text-[#00213f] shadow-sm" : "text-slate-500 hover:text-[#00213f]"
                    }`}
                  >
                    Mes a mes
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={esAnual}
                    onClick={() => setCiclo("anual")}
                    className={`basis-1/2 h-11 rounded-lg text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00213f] ${
                      esAnual ? "bg-white text-[#00213f] shadow-sm" : "text-slate-500 hover:text-[#00213f]"
                    }`}
                  >
                    Anual
                    <span className="rounded-full bg-amber-400 text-[#00213f] text-[9px] sm:text-[10px] font-black uppercase tracking-wide px-1.5 sm:px-2 py-0.5">
                      {MESES_GRATIS} meses gratis
                    </span>
                  </button>
                </div>

                {/* Tarjeta de precio */}
                <div className="rounded-2xl bg-gradient-to-br from-[#00213f] to-[#10375c] p-6 sm:p-8 shadow-2xl shadow-[#00213f]/20">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Membresía completa
                  </p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className="text-[3.25rem] sm:text-6xl font-black text-white tracking-tight leading-none tabular-nums"
                      style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    >
                      {ars(esAnual ? EQUIVALENTE_MENSUAL : PRECIO_MENSUAL)}
                    </span>
                    <span className="text-white/40 font-semibold text-[15px]">/mes</span>
                  </div>

                  {/* El ancla tachada sólo aparece en anual: es la prueba visual
                      del descuento. En mensual no hay nada que tachar. */}
                  <div className="mt-2 min-h-[22px]">
                    {esAnual && (
                      <p className="text-[13.5px] text-white/50">
                        <span className="line-through">{ars(PRECIO_MENSUAL)}/mes</span> pagando mes a mes
                      </p>
                    )}
                  </div>

                  <p className="text-[13.5px] text-white/70 mt-3 leading-relaxed">
                    {esAnual ? (
                      <>
                        Un solo pago de{" "}
                        <span className="font-bold text-white">{ars(PRECIO_ANUAL)}</span> al año, en
                        lugar de {ars(PAGANDO_MES_A_MES)}.
                      </>
                    ) : (
                      <>Se cobra todos los meses. Cancelás cuando quieras desde tu perfil.</>
                    )}
                  </p>

                  {/* Alto reservado para que el precio no salte al cambiar de
                      ciclo. En mensual el espacio no queda vacío: ofrece el
                      anual justo en el momento de decidir. */}
                  <div className="mt-3 min-h-[34px]">
                    {esAnual ? (
                      <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/15 border border-emerald-300/25 px-3 py-1.5 text-[13px] font-bold text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Te quedan {ars(AHORRO_ANUAL)} en el bolsillo
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCiclo("anual")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 border border-amber-300/25 px-3 py-1.5 text-[13px] font-bold text-amber-300 hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition-colors"
                      >
                        Pagá el año y te queda en {ars(EQUIVALENTE_MENSUAL)}/mes
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/register?ciclo=${ciclo}`}
                    aria-label={
                      esAnual
                        ? `Empezar con el plan anual: ${ars(PRECIO_ANUAL)} al año, ${ars(AHORRO_ANUAL)} de ahorro`
                        : `Empezar con el plan mensual: ${ars(PRECIO_MENSUAL)} por mes`
                    }
                    className="mt-6 flex items-center justify-center gap-2 h-14 w-full rounded-xl bg-amber-400 text-[15px] font-black text-[#00213f] hover:bg-amber-300 shadow-lg shadow-black/15 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#00213f] transition-all"
                  >
                    Empezar ahora
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <p className="text-center text-[12px] text-white/40 mt-3">
                    Sin permanencia · Cancelás cuando quieras · Empresas socias ya publicadas
                  </p>
                </div>

              </motion.div>
            </div>
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

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={false}
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
