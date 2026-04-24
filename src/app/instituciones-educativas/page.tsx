"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Users2,
  Compass,
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  Lock,
  Library,
  Handshake,
  FlaskConical,
  Lightbulb,
  Building2,
  Award,
  MapPin,
  Wrench,
  Cog,
  Zap,
  Briefcase,
  Star,
  ChevronRight,
} from "lucide-react";

import { Entidad } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { crearSlug } from "@/lib/utilidades";
import { AccesoRequerido } from "@/components/ui/acceso-requerido";
import { resolverEstadoGate } from "@/components/ui/gate-suscripcion";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Page content (academic voice) ─── */
const pilares = [
  {
    icon: GraduationCap,
    eyebrow: "Oferta académica",
    titulo: "Formación técnica y profesional",
    copy:
      "Escuelas técnicas, institutos terciarios y casas de altos estudios con orientaciones en metalurgia, química, automatización, electricidad y gestión industrial. Mapeadas por especialidad para acelerar tu búsqueda.",
  },
  {
    icon: Handshake,
    eyebrow: "Vinculación",
    titulo: "Pasantías y prácticas supervisadas",
    copy:
      "Programas acreditados de prácticas profesionales y residencias, con protocolos homologados entre la institución, la empresa socia y la UIAB. Un canal directo al talento formado en el territorio.",
  },
  {
    icon: FlaskConical,
    eyebrow: "Innovación abierta",
    titulo: "Laboratorios e I+D aplicado",
    copy:
      "Centros de transferencia tecnológica, unidades de ensayo y proyectos conjuntos de investigación abiertos a la industria. Resolvé desafíos técnicos con equipos académicos de Almirante Brown.",
  },
];

const journey = [
  {
    paso: "01",
    icon: Compass,
    titulo: "Explorá el expediente",
    copy:
      "Revisá oferta académica, referentes de vinculación y casos de éxito con la industria local. Todo auditado y curado por la UIAB.",
  },
  {
    paso: "02",
    icon: Users2,
    titulo: "Conectá con el referente",
    copy:
      "Cada institución expone un contacto directo para el sector productivo. Sin intermediarios, sin burocracia, con respuesta acordada.",
  },
  {
    paso: "03",
    icon: Lightbulb,
    titulo: "Construyan el programa",
    copy:
      "Diseñen pasantías, cursos a medida o proyectos de I+D. La UIAB acompaña la implementación con su red de empresas socias.",
  },
];

const especialidades = [
  { nombre: "Metalurgia", icon: Wrench, cantidad: "8" },
  { nombre: "Electromecánica", icon: Cog, cantidad: "12" },
  { nombre: "Química Industrial", icon: FlaskConical, cantidad: "5" },
  { nombre: "Automatización", icon: Zap, cantidad: "6" },
  { nombre: "Gestión Industrial", icon: Briefcase, cantidad: "4" },
  { nombre: "Electricidad", icon: Sparkles, cantidad: "9" },
];

const beneficios = [
  {
    icon: Users2,
    titulo: "Talento formado en el territorio",
    descripcion: "Accedé a egresados y pasantes de instituciones de Almirante Brown, con formación técnica específica para tu industria.",
  },
  {
    icon: Award,
    titulo: "Protocolos homologados",
    descripcion: "Convenios de pasantías y prácticas con marcos legales ya establecidos. Sin burocracia, listos para implementar.",
  },
  {
    icon: FlaskConical,
    titulo: "Laboratorios de I+D",
    descripcion: "Accedé a equipamiento y conocimiento académico para resolver desafíos técnicos de tu empresa.",
  },
  {
    icon: BookOpen,
    titulo: "Cursos a medida",
    descripcion: "Las instituciones pueden diseñar capacitaciones específicas para las necesidades de tu equipo productivo.",
  },
];

/* ─── Main page ─── */
export default function InstitucionesEducativasPage() {
  const { currentUser, loading } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);

  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [totalInstituciones, setTotalInstituciones] = useState<string>("—");
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "35%"]);
  const headerOpacity = useTransform(scrollY, [0, 900], [1, 1]);

  const fetchInstitucionesCount = useCallback(async () => {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("vista_directorio")
      .select("*", { count: "exact", head: true })
      .eq("categoria_socio", "instituciones_educativas");

    if (!error && count !== null) {
      setTotalInstituciones(String(count));
    }
  }, []);

  const fetchInstituciones = useCallback(async () => {
    fetchInstitucionesCount();

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.subscriptionEstado !== 'activa')) {
      setCargandoDatos(false);
      return;
    }
    setCargandoDatos(true);
    setEmpresas([]);

    try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vista_directorio")
      .select("*")
      .eq("categoria_socio", "instituciones_educativas");

    if (error || !data) {
      console.error("Error fetching instituciones educativas:", error);
      return;
    }

    const empresaIds = data.filter((d: any) => d.tipo_entidad === "empresa").map((d: any) => d.id);

    const [resEmp, resResenas] = await Promise.all([
      empresaIds.length > 0
        ? supabase
          .from("empresas_categorias")
          .select("empresa_id, categorias(nombre)")
          .in("empresa_id", empresaIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("resenas").select("calificacion, empresa_resenada_id").eq("estado", "aprobada"),
    ]);

    const catMap = new Map<string, string[]>();
    (resEmp.data ?? []).forEach((ec: any) => {
      const current = catMap.get(ec.empresa_id) || [];
      if (ec.categorias?.nombre) current.push(ec.categorias.nombre);
      catMap.set(ec.empresa_id, current);
    });

    const ratingsMap = new Map<string, { sum: number; count: number }>();
    (resResenas.data ?? []).forEach((r: any) => {
      const id = r.empresa_resenada_id;
      if (!id) return;
      const current = ratingsMap.get(id) || { sum: 0, count: 0 };
      current.sum += r.calificacion;
      current.count += 1;
      ratingsMap.set(id, current);
    });

    const mapped: Entidad[] = data.map((item: any) => {
      const cats = catMap.get(item.id) || [];
      const mainCat = cats.length > 0 ? cats[0] : "Formación académica";
      const nombre = item.razon_social || item.nombre || "Sin nombre";
      const logoUrl =
        item.bucket_logo && item.ruta_logo
          ? supabase.storage.from(item.bucket_logo).getPublicUrl(item.ruta_logo).data.publicUrl
          : null;
      const rData = ratingsMap.get(item.id);
      const rating = rData ? Number((rData.sum / rData.count).toFixed(1)) : undefined;

      return {
        id: item.id,
        tipo: item.tipo_entidad || "empresa",
        slug: crearSlug(nombre),
        nombre,
        categoria: mainCat,
        descripcionCorta: item.actividad || item.descripcion_corta || "Institución educativa aliada a la UIAB",
        descripcionLarga: item.actividad || item.descripcion || "",
        logo: nombre.charAt(0).toUpperCase(),
        logoUrl,
        ubicacion: `${item.localidad || ""}, ${item.direccion || ""}`.replace(/^, | ,|, $/g, ""),
        servicios: cats.slice(1),
        contacto: {
          email: item.email || "",
          telefono: item.telefono || "",
          sitioWeb: item.sitio_web || "",
        },
        esSocio: true,
        rating,
        reviews: rData?.count,
      };
    });

    setEmpresas(mapped);
    } catch (err) {
      console.error("[instituciones-educativas] fetch falló:", err);
    } finally {
      setCargandoDatos(false);
    }
  }, [currentUser, fetchInstitucionesCount]);

  useEffect(() => {
    if (loading) return;
    fetchInstituciones();
  }, [loading, fetchInstituciones]);

  const categorias = useMemo(
    () => Array.from(new Set(empresas.map((e) => e.categoria))).filter(Boolean).sort(),
    [empresas],
  );

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((empresa) => {
      const term = searchTerm.toLowerCase();
      const matchCat = categoriaSeleccionada ? empresa.categoria === categoriaSeleccionada : true;
      const matchTerm =
        term === "" ||
        empresa.nombre.toLowerCase().includes(term) ||
        empresa.descripcionCorta.toLowerCase().includes(term) ||
        empresa.servicios.some((s: string) => s.toLowerCase().includes(term));
      return matchCat && matchTerm;
    });
  }, [empresas, categoriaSeleccionada, searchTerm]);

  const tieneAcceso        = currentUser?.role === 'admin' || currentUser?.subscriptionEstado === 'activa';
  const mostrarInformativo = !loading && !currentUser;
  const mostrarBloqueado   = !loading && !!currentUser && !tieneAcceso;
  const mostrarDirectorio  = !loading && !!currentUser && tieneAcceso;

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {mostrarInformativo && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════════════
          HERO SECTION - Industrial Academic Design
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden">
        {/* Background with Parallax */}
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/landing/instituciones-hero.jpg"
            alt="Campus universitario industrial"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Violet academic overlay - clean, no grid */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/80 via-violet-900/70 to-[#1a0d2e]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d2e]/90 via-transparent to-transparent" />
        </motion.div>

        {/* Ambient light orbs */}
        <div className="absolute top-20 right-[15%] w-[400px] h-[400px] rounded-full bg-violet-500/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-40 left-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-16 sm:pt-24 pb-28 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Left Column - Main Copy */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0} className="mb-6 md:mb-8">
                <div className="inline-flex items-center gap-3 bg-violet-500/10 border border-violet-400/25 px-5 py-2.5">
                  <GraduationCap className="w-4 h-4 text-violet-300" />
                  <span className="text-[11px] font-black tracking-[0.25em] uppercase text-violet-200">
                    Directorio Educativo
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={fadeUp} custom={1} className="font-manrope text-white leading-[0.95] tracking-tight mb-6 md:mb-8">
                <span className="block text-[11px] md:text-xs font-black tracking-[0.4em] uppercase text-violet-300/70 mb-5">
                  Academia + Industria + Territorio
                </span>
                <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] font-black">
                  Formación técnica
                </span>
                <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-white to-violet-200 mt-2">
                  al servicio de
                </span>
                <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] font-black mt-2">
                  la industria local.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-white/70 text-base md:text-lg font-medium leading-relaxed max-w-xl mb-8 md:mb-10"
              >
                Escuelas técnicas, institutos terciarios y universidades aliadas a la UIAB.
                Un puente curado entre el talento que se forma en Almirante Brown
                y las empresas del polo industrial que lo necesitan.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4 mb-10 md:mb-12">
                <a
                  href="#directorio"
                  className="group inline-flex items-center gap-3 bg-white text-violet-950 px-8 py-4 text-[13px] font-black uppercase tracking-[0.12em] hover:bg-violet-50 transition-all duration-300"
                >
                  Explorar instituciones
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-3 bg-white/5 border border-white/20 text-white px-8 py-4 text-[13px] font-bold uppercase tracking-[0.12em] hover:bg-white/10 transition-all duration-300"
                >
                  Cómo funciona
                </a>
              </motion.div>

              {/* Trust indicators */}
              <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-8">
                {[
                  { icon: CheckCircle2, text: `${totalInstituciones === "—" ? "15+" : totalInstituciones} instituciones` },
                  { icon: Award, text: "Verificadas UIAB" },
                  { icon: MapPin, text: "Almirante Brown" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-violet-200/60">
                    <Icon className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold">{text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Expediente Card */}
            <motion.div variants={fadeUp} custom={3} className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-8 bg-violet-500/10 blur-3xl" />

                {/* Card */}
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-violet-500/15 flex items-center justify-center">
                        <Library className="w-5 h-5 text-violet-300" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black tracking-[0.25em] uppercase text-violet-400">
                          Expediente Abierto
                        </div>
                        <div className="text-sm font-bold text-white">Red Académica UIAB</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400">ACTIVO</span>
                    </div>
                  </div>

                  {/* Data rows */}
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-violet-400/60 mb-2">
                        Niveles cubiertos
                      </div>
                      <div className="text-base font-bold text-white">
                        Secundario técnico / Terciario / Universitario
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-violet-500/25 via-white/10 to-transparent" />

                    <div>
                      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-violet-400/60 mb-2">
                        Formatos de vinculación
                      </div>
                      <div className="text-base font-bold text-white">
                        Pasantías / Cursos a medida / I+D aplicado
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-violet-500/25 via-white/10 to-transparent" />

                    <div>
                      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-violet-400/60 mb-2">
                        Cobertura territorial
                      </div>
                      <div className="text-base font-bold text-white">
                        Almirante Brown y Conurbano Sur
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-200/70">
                      Auditado y curado por la UIAB
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-white/25 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-1.5 bg-white/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative bg-white border border-violet-100/60 -mt-20 z-20 shadow-[0_20px_60px_-20px_rgba(58,28,140,0.2)]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <StatCell
              eyebrow="Instituciones"
              valor={cargandoDatos && totalInstituciones === "—" ? "…" : totalInstituciones}
              copy="aliadas al ecosistema"
              icon={GraduationCap}
            />
            <StatCell eyebrow="Niveles" valor="3" copy="técnico / terciario / universidad" icon={BookOpen} />
            <StatCell eyebrow="Acuerdos" valor="Red" copy="de pasantías y prácticas" icon={Handshake} />
            <StatCell eyebrow="Vinculación" valor="I+D" copy="laboratorios abiertos" icon={FlaskConical} />
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ESPECIALIDADES TÉCNICAS
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-[2px] bg-violet-600" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-violet-600">
              Orientaciones disponibles
            </span>
          </div>
          <h2 className="font-manrope text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            Especialidades técnicas mapeadas
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium mt-3 max-w-2xl">
            Encontrá instituciones por su orientación académica. Cada especialidad conecta
            directamente con las necesidades del sector productivo local.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {especialidades.map((esp, idx) => (
            <motion.div
              key={esp.nombre}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white border border-slate-200 p-5 hover:border-violet-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                <esp.icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{esp.nombre}</h3>
              <p className="text-xs text-slate-500">{esp.cantidad} instituciones</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          VISUAL SHOWCASE - Two Images
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] overflow-hidden group"
          >
            <Image
              src="/landing/instituciones-taller.jpg"
              alt="Taller técnico industrial"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-violet-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-violet-300 mb-2 block">
                Formación práctica
              </span>
              <h3 className="font-manrope text-xl font-bold text-white">
                Talleres equipados con tecnología industrial
              </h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] overflow-hidden group"
          >
            <Image
              src="/landing/instituciones-laboratorio.jpg"
              alt="Laboratorio de investigación"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-violet-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-violet-300 mb-2 block">
                Innovación abierta
              </span>
              <h3 className="font-manrope text-xl font-bold text-white">
                Laboratorios de I+D para la industria
              </h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PILARES - Qué vas a encontrar
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-14 max-w-3xl"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
            <div className="w-10 h-[2px] bg-violet-600" />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-violet-700">
              Qué vas a encontrar
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="font-manrope text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.04]"
          >
            Un directorio pensado como biblioteca académica,
            <span className="text-violet-700"> con el rigor de un expediente B2B.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-slate-500 text-[15px] md:text-base font-medium leading-relaxed mt-6 max-w-2xl"
          >
            Cada ficha está organizada para responder a la misma pregunta: ¿cómo puedo vincular
            mi empresa con esta institución, hoy?
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {pilares.map((p, idx) => (
            <motion.article
              key={p.titulo}
              variants={fadeUp}
              custom={idx}
              className="group relative bg-white border border-slate-200 p-8 overflow-hidden transition-all duration-300 hover:border-violet-300 hover:shadow-lg"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                  <p.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-violet-600/80 mt-3">
                  {p.eyebrow}
                </span>
              </div>

              <h3 className="font-manrope text-xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
                {p.titulo}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {p.copy}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          BENEFICIOS PARA EMPRESAS
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-[2px] bg-violet-600" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-violet-600">
              Para empresas
            </span>
          </div>
          <h2 className="font-manrope text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            ¿Por qué vincular tu empresa con instituciones educativas?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {beneficios.map((ben, idx) => (
            <motion.div
              key={ben.titulo}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="flex gap-5 p-6 bg-white border border-slate-200 hover:border-violet-200 transition-colors"
            >
              <div className="w-12 h-12 bg-violet-50 flex items-center justify-center shrink-0">
                <ben.icon className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">{ben.titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{ben.descripcion}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CÓMO FUNCIONA
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="mt-28">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-violet-900 to-[#2a1454]" />

          {/* Ambient orbs */}
          <div className="absolute top-0 left-[10%] w-[400px] h-[400px] rounded-full bg-violet-500/15 blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 right-[5%] w-[350px] h-[350px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />

          <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 py-24 md:py-32">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-3xl mb-16"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                <div className="w-10 h-[2px] bg-violet-300" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-violet-200">
                  Cómo funciona
                </span>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-manrope text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.05]"
              >
                Tres pasos para
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-white">
                  abrir un vínculo académico-industrial.
                </span>
              </motion.h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            >
              {journey.map((j, idx) => (
                <motion.div
                  key={j.paso}
                  variants={fadeUp}
                  custom={idx}
                  className="relative group"
                >
                  {/* Connector line */}
                  {idx < journey.length - 1 && (
                    <div className="hidden md:block absolute top-14 -right-4 lg:-right-5 w-8 lg:w-10 h-px bg-gradient-to-r from-violet-400/40 to-transparent" />
                  )}

                  <div className="relative h-full backdrop-blur-sm bg-white/[0.04] border border-white/10 p-8 transition-all duration-300 group-hover:bg-white/[0.06] group-hover:border-violet-400/30">
                    <div className="flex items-baseline justify-between mb-8">
                      <span className="font-manrope text-[52px] font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-300 to-white/20 leading-none tracking-tighter">
                        {j.paso}
                      </span>
                      <div className="w-11 h-11 bg-white/10 border border-white/15 text-violet-100 flex items-center justify-center">
                        <j.icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="font-manrope text-xl font-bold text-white leading-tight tracking-tight mb-4">
                      {j.titulo}
                    </h3>
                    <p className="text-violet-100/70 text-sm leading-relaxed font-medium">
                      {j.copy}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      </>
      )}

      {mostrarBloqueado && currentUser && (
        <AccesoRequerido
          estado={resolverEstadoGate(currentUser.subscriptionEstado ?? null, currentUser.isMember)}
          className="min-h-[calc(100vh-5rem)]"
        />
      )}

      {mostrarDirectorio && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════════════
          DIRECTORIO INTEGRADO
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="directorio" className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-24 scroll-mt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-[2px] bg-violet-600" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-violet-700">
                Directorio activo
              </span>
            </div>
            <h2 className="font-manrope text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.05]">
              Instituciones educativas
              <span className="block text-violet-700">aliadas a la UIAB.</span>
            </h2>
          </div>

          <p className="text-slate-500 text-sm font-medium md:max-w-xs md:text-right">
            {cargandoDatos
              ? "Cargando expedientes académicos…"
              : `${empresas.length} instituciones verificadas · ficha completa visible como socio UIAB.`}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            {/* Sidebar */}
            <aside className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
              <FilterSidebar
                categorias={categorias}
                categoriaSeleccionada={categoriaSeleccionada}
                onCategoriaChange={setCategoriaSeleccionada}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                colorScheme="violet"
              />
            </aside>

            {/* Main area */}
            <main className="w-full lg:w-9/12 xl:w-3/4">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200">
                <div>
                  <h3 className="font-manrope text-lg font-bold text-slate-900">
                    {cargandoDatos ? "Buscando…" : `${empresasFiltradas.length} resultados`}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Vista
                  </span>
                  <div className="bg-slate-50 p-1 flex gap-1 border border-slate-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition-all ${viewMode === "grid"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-slate-400 hover:text-violet-700"
                        }`}
                      aria-label="Vista grilla"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-all ${viewMode === "list"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-slate-400 hover:text-violet-700"
                        }`}
                      aria-label="Vista lista"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {cargandoDatos ? (
                <SkeletonDirectorio viewMode={viewMode} />
              ) : empresasFiltradas.length > 0 ? (
                <div
                  key={viewMode}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100"
                  }
                >
                  {empresasFiltradas.map((inst) => (
                    <DirectoryProfileCard
                      key={inst.id}
                      entidad={inst}
                      basePath="/empresas"
                      variant={viewMode}
                      colorScheme="violet"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  onReset={() => {
                    setSearchTerm("");
                    setCategoriaSeleccionada(null);
                  }}
                />
              )}
            </main>
          </div>
      </section>
      </>
      )}

      {mostrarInformativo && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-[#3b2a6b] p-10 md:p-16"
        >
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-500/25 blur-[120px] translate-x-1/3 -translate-y-1/3" />

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 mb-6 text-violet-200">
                <GraduationCap className="w-4 h-4" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase">
                  ¿Representás una institución educativa?
                </span>
              </div>
              <h3 className="font-manrope text-3xl md:text-[2.5rem] font-black text-white leading-[1.05] tracking-tight mb-5">
                Sumá tu casa de estudios al
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-white">
                  ecosistema industrial UIAB.
                </span>
              </h3>
              <p className="text-violet-100/80 text-[15px] font-medium leading-relaxed">
                Amplificá el vínculo con las empresas del polo de Almirante Brown: pasantías,
                cursos a medida, I+D aplicado y un canal directo con la industria formal.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:min-w-[240px]">
              <Link
                href="/contacto"
                className="group inline-flex items-center justify-center gap-2 bg-white text-violet-950 px-7 py-4 text-sm font-black uppercase tracking-widest hover:bg-violet-50 transition-all duration-300"
              >
                Registrar institución
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/directorio"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/20 text-white px-7 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-300"
              >
                Ver directorio completo
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
      </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function StatCell({
  eyebrow,
  valor,
  copy,
  icon: Icon,
}: {
  eyebrow: string;
  valor: string;
  copy: string;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="p-7 md:p-10 flex flex-col items-center text-center lg:items-start lg:text-left gap-5 group hover:bg-slate-50/50 transition-colors">
      <div className="w-12 h-12 bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">
          {eyebrow}
        </div>
        <div className="font-manrope text-[32px] md:text-[42px] font-black text-slate-900 leading-none tracking-tight mb-2">
          {valor}
        </div>
        <div className="text-[12px] text-slate-400 font-semibold leading-snug tracking-wide uppercase">
          {copy}
        </div>
      </div>
    </div>
  );
}

function AccesoBloqueadoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative overflow-hidden border border-violet-200/40 bg-white p-10 md:p-16"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-500" />
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-100/40 blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 items-center">
        <div className="w-16 h-16 bg-violet-50 text-violet-700 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-xl">
          <div className="text-[10px] font-black tracking-[0.25em] uppercase text-violet-700 mb-3">
            Acceso restringido · Socios UIAB
          </div>
          <h3 className="font-manrope text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight mb-3">
            Ingresá para ver expedientes completos.
          </h3>
          <p className="text-slate-500 text-[15px] font-medium leading-relaxed">
            El directorio de instituciones educativas y sus contactos de vinculación
            están disponibles para empresas socias y profesionales verificados.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[200px]">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-violet-700 text-white px-6 py-3.5 text-sm font-black uppercase tracking-widest hover:bg-violet-800 transition-all duration-300"
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-2 bg-violet-50 text-violet-800 border border-violet-200 px-6 py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-violet-100 transition-all duration-300"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white border border-slate-200 p-16 md:p-20 text-center"
    >
      <div className="w-20 h-20 bg-violet-50 text-violet-500 flex items-center justify-center mx-auto mb-6">
        <GraduationCap className="w-9 h-9" />
      </div>
      <h3 className="font-manrope text-2xl font-bold text-slate-900 mb-3 tracking-tight">
        Sin resultados por ahora
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium text-sm leading-relaxed">
        Ajustá los filtros o explorá todas las instituciones del directorio académico UIAB.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 bg-violet-700 text-white px-7 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-violet-800 transition-all duration-300"
      >
        Restablecer filtros
        <CheckCircle2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function SkeletonDirectorio({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          : "bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100"
      }
    >
      {Array.from({ length: viewMode === "grid" ? 6 : 5 }).map((_, i) =>
        viewMode === "grid" ? (
          <div
            key={i}
            className="bg-white border border-slate-200 p-7 h-[280px] animate-pulse"
          >
            <div className="flex justify-between mb-6">
              <div className="w-14 h-14 bg-violet-50" />
              <div className="w-24 h-6 bg-violet-50" />
            </div>
            <div className="h-5 w-3/4 bg-violet-50 mb-3" />
            <div className="h-3 w-full bg-violet-50/80 mb-2" />
            <div className="h-3 w-5/6 bg-violet-50/80 mb-6" />
            <div className="h-8 w-full bg-violet-50/60" />
          </div>
        ) : (
          <div key={i} className="px-8 py-6 flex items-center gap-8 animate-pulse">
            <div className="w-20 h-20 bg-violet-50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-violet-50" />
              <div className="h-5 w-2/3 bg-violet-50" />
              <div className="h-3 w-1/2 bg-violet-50/80" />
            </div>
            <div className="hidden md:block w-[170px] space-y-2">
              <div className="h-3 w-16 bg-violet-50/80" />
              <div className="h-4 w-28 bg-violet-50/80" />
            </div>
            <div className="hidden md:block w-32 h-9 bg-violet-50" />
          </div>
        ),
      )}
    </div>
  );
}
