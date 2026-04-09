"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Briefcase, Building2, MapPin, ArrowRight, ShieldCheck, Lock, Navigation, CheckCircle2, Factory, TrendingUp, Target, Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Oportunidad } from "@/modulos/oportunidades/oportunidadesService";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const MOCK_PREVIEW = [
  {
    id: "mock1",
    titulo: "Provisión de Tableros Eléctricos Industriales",
    descripcion: "Se busca empresa o taller certificado para la provisión armada de 4 tableros generales de baja tensión para ampliación de planta.",
    estado: "abierta",
    localidad: "Burzaco",
    categoria: { nombre: "Electricidad" },
    empresa: { razon_social: "Industria Metalúrgica" }
  },
  {
    id: "mock2",
    titulo: "Servicio Mensual de Mantenimiento HVAC",
    descripcion: "Requerimos proveedor especialista en equipos de climatización industrial para mantenimiento preventivo en 2 naves.",
    estado: "abierta",
    localidad: "Adrogué",
    categoria: { nombre: "Mantenimiento" },
    empresa: { razon_social: "Laboratorio Farmacéutico" }
  },
  {
    id: "mock3",
    titulo: "Desarrollo de Software de Trazabilidad",
    descripcion: "Buscamos consultora informática para el desarrollo e implementación de un módulo de trazabilidad de stock y despacho.",
    estado: "abierta",
    localidad: "Longchamps",
    categoria: { nombre: "Sistemas" },
    empresa: { razon_social: "Distribuidora Logística" }
  }
];

export function PublicOportunidadesLanding({ oportunidades, loading }: { oportunidades: Oportunidad[], loading: boolean }) {
  const { openAuthModal } = useAuth();
  
  const displayItems = oportunidades.length > 0 ? oportunidades : (MOCK_PREVIEW as any);
  const previewItems = displayItems.slice(0, 3);
  const totalCount = oportunidades.length > 0 ? oportunidades.length : 145;

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <div className="bg-[#f7f9fb] min-h-screen pt-0 overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════
          SECTION 1: HERO (DARK MULTIMEDIA B2B)
      ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative overflow-hidden w-full lg:min-h-[90svh] flex flex-col bg-[#00213f] pt-24 lg:pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#10375c] to-[#0c2d4a]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center w-full">
            
            {/* Left Column — Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-6 xl:col-span-5"
            >
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2.5 bg-white/[0.06] backdrop-blur-md rounded-sm px-4 py-1.5 mb-6 border border-white/[0.08]">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span className="text-[12px] font-bold text-white/80 tracking-[0.06em] uppercase">Cartelera de Licitaciones B2B</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-6"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Conseguí grandes
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-primary-300">clientes locales</span>
              </motion.h1>

              <motion.p 
                variants={fadeUp} 
                custom={2} 
                className="text-base lg:text-lg text-white/70 max-w-xl mb-8 leading-relaxed"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Accedé a la cartelera privada donde las industrias de Almirante Brown publican sus necesidades de servicios y contrataciones. Tu próximo gran contrato está a un clic.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={openAuthModal}
                  className="h-14 px-8 rounded-sm font-bold text-[15px] bg-white text-[#00213f] hover:bg-emerald-50 shadow-xl shadow-black/15 active:scale-[0.98] transition-all"
                >
                  Ver Oportunidades
                  <ArrowRight className="w-5 h-5 ml-2 text-primary-600" />
                </Button>
                <Button
                  onClick={openAuthModal}
                  variant="outline"
                  className="h-14 px-8 rounded-sm font-bold text-[15px] border-white/20 text-white hover:bg-white/10 transition-all bg-transparent"
                >
                  Soy Empresa (Publicar)
                </Button>
              </motion.div>
              
              {/* Trust signals */}
              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 text-[12px] text-white/90">
                <span className="flex items-center gap-1.5 font-bold"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Red Privada UIAB</span>
                <span className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Trato Directo</span>
              </motion.div>
            </motion.div>

            {/* Right Column — Large Dashboard Image */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInRight}
              className="lg:col-span-6 xl:col-span-7 relative hidden lg:block"
            >
              <div className="relative w-full aspect-[4/3] max-w-2xl ml-auto">
                <motion.div style={{ y: heroY }} className="relative w-full h-full">
                  {/* Glowing background blob */}
                  <div className="absolute inset-0 bg-primary-500/20 blur-[100px] rounded-full mix-blend-screen" />
                  
                  {/* Main Dashboard Image */}
                  <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                     <Image
                       src="/landing/platform-preview.png"
                       alt="Dashboard de Oportunidades Comerciales"
                       fill
                       className="object-cover"
                       priority
                     />
                  </div>

                  {/* Floating Notification */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute -bottom-6 -left-6 z-20 bg-[#00182e]/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl p-4 pr-6 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                       <Briefcase className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Nueva Solicitud</p>
                       <p className="text-sm font-black text-white">Aserradero Los Robles S.A.</p>
                    </div>
                  </motion.div>
                  
                  {/* Floating Match */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="absolute -top-6 right-8 z-20 bg-[#00182e]/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                       <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-white pr-2">Coincidencia Directa</p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating stats row */}
      <div className="relative z-20 -mt-10 lg:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          {[
            { val: "20+", label: "Nuevas / Semana" },
            { val: "100%", label: "Directo, sin comisión" },
            { val: "Verificadas", label: "Empresas reales" },
            { val: "+140", label: "Licitaciones Activas" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={i}
              className="bg-white rounded-xl px-5 py-5 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300"
            >
              <div 
                className="text-xl lg:text-2xl font-black text-[#00213f] mb-1 tracking-tight"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                {s.val}
              </div>
              <div 
                className="text-[11px] text-slate-500 font-bold tracking-widest uppercase"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 2: COMO FUNCIONA (VISUAL SPLIT)
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             {/* Left: Image composition */}
             <motion.div
               initial={{ opacity: 0, x: -40 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="relative order-2 lg:order-1"
             >
                <div className="relative aspect-square sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-slate-100">
                  <Image 
                    src="/landing/b2b-trust-partnership.png" 
                    alt="Trabajo en conjunto y acuerdos industriales" 
                    fill 
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 bg-[#00213f]/10" />
                </div>
                
                {/* Floating UI element */}
                <div className="absolute -right-8 bottom-12 bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-[240px] hidden sm:block">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                         <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] uppercase">Aprobada</Badge>
                   </div>
                   <p className="font-bold text-[#00213f] text-sm leading-tight mb-2">Presupuesto aceptado</p>
                   <p className="text-xs text-slate-500 leading-relaxed">Empezá a trabajar directamente con tu nuevo cliente.</p>
                </div>
             </motion.div>

             {/* Right: Copy & Steps */}
             <motion.div
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               variants={stagger}
               className="order-1 lg:order-2"
             >
                <motion.div variants={fadeUp} custom={0} className="mb-12">
                   <h2 
                    className="text-3xl lg:text-4xl font-black tracking-tight text-[#00213f] mb-4"
                    style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                   >
                    Un canal B2B transparente
                   </h2>
                   <p 
                    className="text-slate-500 text-lg leading-relaxed"
                    style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                   >
                    Olvidate de comisiones ocultas o intermediarios. La UIAB actúa como validador para que empresas de Brown contraten proveedores de Brown, potenciando la región.
                   </p>
                </motion.div>

                <div className="space-y-8">
                  {[
                    { step: "01", icon: Factory, title: "Publicación Verificada", desc: "Las industrias, parques industriales y comercios adheridos publican requerimientos concretos de servicios u obras." },
                    { step: "02", icon: Bell, title: "Notificación Directa", desc: "Si tu perfil, especialidad y zona matchean con la oportunidad, recibís una alerta inmediatamente a tu correo." },
                    { step: "03", icon: ShieldCheck, title: "Envío de Cotización", desc: "Contactás a la empresa de forma directa. Ellos reciben tu oferta validada con el sello de la UIAB, lo que te da prioridad y suma confianza." }
                  ].map((item, i) => (
                    <motion.div key={i} variants={fadeUp} custom={i} className="flex gap-6">
                      <div className="shrink-0 flex flex-col items-center">
                         <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 text-primary-600">
                           <item.icon className="w-5 h-5" />
                         </div>
                         {i !== 2 && <div className="w-px h-full bg-slate-200 mt-2" />}
                      </div>
                      <div className="pb-8">
                         <h3 
                          className="text-lg font-bold text-[#00213f] mb-2"
                          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                         >
                          {item.title}
                         </h3>
                         <p 
                          className="text-slate-500 text-sm leading-relaxed max-w-sm"
                          style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                         >
                          {item.desc}
                         </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: PREVIEW & GATED CONTENT
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#f2f4f6] relative border-t border-slate-200/60">
        <div className="absolute top-0 left-0 w-full h-96 bg-white shrink-0 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-800 border-none px-4 py-1.5 font-bold mb-4 uppercase tracking-widest text-[10px]">Licitaciones Abiertas</Badge>
            <h2 
              className="text-3xl lg:text-4xl font-black tracking-tight text-[#00213f]"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Vista Previa de la Cartelera
            </h2>
            <p 
              className="text-base text-slate-500 mt-3 max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              Estas son algunas de las ofertas de trabajo publicadas recientemente por empresas en el partido de Almirante Brown.
            </p>
          </div>

          <div className="relative">
            {/* The Cards Preview */}
            <div className="grid gap-6 relative z-10">
              {loading ? (
                [1, 2, 3].map(i => <Card key={i} className="h-48 bg-white/50 animate-pulse border-none rounded-xl" />)
              ) : previewItems.length > 0 ? (
                previewItems.map((op, index) => (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border border-slate-100 shadow-sm hover:shadow-xl transition-all rounded-2xl bg-white overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-8 sm:p-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                          <div>
                            <div className="flex items-center gap-2 mb-3 font-bold text-[10px] uppercase tracking-widest text-primary-600">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              {op.categoria?.nombre || "General"}
                            </div>
                            <h3 
                              className="text-xl sm:text-2xl font-black text-[#00213f] leading-tight"
                              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                            >
                              {op.titulo}
                            </h3>
                          </div>
                          <Badge 
                            className="shrink-0 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                            style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                          >
                            Hace 2 días
                          </Badge>
                        </div>
                        
                        <p 
                          className="text-slate-600 mb-8 line-clamp-2 text-[15px] leading-relaxed max-w-3xl"
                          style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                        >
                          {op.descripcion}
                        </p>

                        <div 
                          className="flex flex-wrap items-center justify-between pt-5 border-t border-slate-100 text-sm gap-4"
                          style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                        >
                          <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2 font-bold text-slate-500">
                               <Building2 className="w-4 h-4 text-slate-400" />
                               {op.empresa?.razon_social || "Empresa Verificada"}
                             </div>
                             <div className="flex items-center gap-2 font-medium text-slate-500">
                               <MapPin className="w-4 h-4 text-slate-400" />
                               {op.localidad}
                             </div>
                          </div>
                          <span className="font-bold text-white bg-primary-600 px-4 py-2 rounded-lg flex items-center gap-1.5 opacity-50 cursor-not-allowed">
                            Visualizar <Lock className="w-3.5 h-3.5 ml-1" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="p-12 text-center border-dashed border-2">
                  <p className="text-slate-500 font-medium">Oportunidades cargando...</p>
                </Card>
              )}
            </div>

            {/* Premium Paywall Overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-[500px] z-20 flex flex-col justify-end items-center pb-12 rounded-b-3xl" style={{ background: "linear-gradient(to top, #f2f4f6 0%, #f2f4f6 20%, rgba(242, 244, 246, 0.9) 45%, rgba(242, 244, 246, 0) 100%)" }}>
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="bg-white border text-center border-slate-200/50 p-10 sm:p-12 rounded-3xl shadow-2xl max-w-xl mx-auto backdrop-blur-md"
               >
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Lock className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 
                    className="text-3xl font-black text-[#00213f] mb-4"
                    style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                  >
                     Desbloqueá {totalCount > 3 ? totalCount - 3 : '+100'} Licitaciones Más
                  </h3>
                  <p 
                    className="text-slate-500 mb-8 text-[15px] leading-relaxed max-w-md mx-auto"
                    style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                  >
                    Creá tu cuenta en menos de 2 minutos para acceder al listado completo de oportunidades y enviar tus presupuestos de manera directa.
                  </p>
                  <Button asChild className="w-full h-14 bg-[#00213f] text-white font-bold text-lg rounded-xl shadow-xl shadow-[#00213f]/20 hover:bg-black active:scale-[0.98] transition-all cursor-pointer">
                    <Link href="/register">
                      Crear mi cuenta y acceder <Navigation className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
               </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
