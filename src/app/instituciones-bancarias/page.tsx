"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Landmark,
  Building2,
  Users,
  Network,
  ShieldCheck,
  Handshake,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  LayoutGrid,
  List,
  Lock,
  Globe,
  Target,
  Zap,
  Award,
  TrendingUp,
  MapPin,
  Factory,
  Briefcase,
} from "lucide-react";

import { Entidad } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { crearSlug } from "@/lib/utilidades";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ─── Page content — REENFOCADO: Bancos como CLIENTES que se unen a la red ─── */
const beneficiosRed = [
  {
    icon: Factory,
    titulo: "Acceso a +60 empresas industriales",
    copy: "Conecta directamente con empresas manufactureras, metalurgicas, quimicas y de servicios industriales del polo de Almirante Brown.",
  },
  {
    icon: Users,
    titulo: "Red de particulares verificados",
    copy: "Mas de 50 particulares auditados por la UIAB. Servicios profesionales, insumos industriales, logistica y mas.",
  },
  {
    icon: Target,
    titulo: "Segmentacion territorial",
    copy: "Foco exclusivo en el Conurbano Sur. Conocimiento profundo del tejido productivo local y sus necesidades.",
  },
  {
    icon: ShieldCheck,
    titulo: "Validacion institucional",
    copy: "La UIAB respalda cada conexion. Empresas verificadas, trayectoria auditada, interlocutores reales.",
  },
];

const comoFunciona = [
  {
    paso: "01",
    icon: Landmark,
    titulo: "Tu entidad se suma al directorio",
    copy: "Registra tu banco o entidad financiera en la red UIAB. Completa tu perfil institucional con servicios, cobertura y contacto comercial.",
  },
  {
    paso: "02",
    icon: Globe,
    titulo: "Visibilidad ante empresas y particulares",
    copy: "Tu ficha queda expuesta en el directorio. Empresas y profesionales de la red pueden consultarte directamente.",
  },
  {
    paso: "03",
    icon: Handshake,
    titulo: "Conexiones comerciales directas",
    copy: "Recibe consultas de empresas industriales buscando servicios financieros. Sin intermediarios, con trazabilidad UIAB.",
  },
];

const cifrasRed = [
  { valor: "60+", label: "Empresas industriales", sublabel: "en el directorio activo" },
  { valor: "50+", label: "Particulares verificados", sublabel: "auditados por UIAB" },
  { valor: "100%", label: "Cobertura territorial", sublabel: "Almirante Brown y Conurbano Sur" },
  { valor: "24/7", label: "Directorio online", sublabel: "acceso permanente" },
];

const serviciosBuscados = [
  "Cuentas corporativas",
  "Financiamiento PyME",
  "Comercio exterior",
  "Leasing de equipos",
  "Factoring",
  "Seguros empresariales",
  "Inversiones institucionales",
  "Pagos y cobranzas",
];

/* ─── Main page ─── */
export default function InstitucionesBancariasPage() {
  const { currentUser, loading } = useAuth();

  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.1]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const fetchBancos = useCallback(async () => {
    if (!currentUser) {
      setCargandoDatos(false);
      return;
    }
    setCargandoDatos(true);
    setEmpresas([]);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("vista_directorio")
      .select("*")
      .eq("categoria_socio", "instituciones_bancarias");

    if (error || !data) {
      console.error("Error fetching instituciones bancarias:", error);
      setCargandoDatos(false);
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
      const mainCat = cats.length > 0 ? cats[0] : "Banca PyME";
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
        descripcionCorta: item.actividad || item.descripcion_corta || "Entidad financiera socia UIAB",
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
    setCargandoDatos(false);
  }, [currentUser]);

  useEffect(() => {
    if (loading) return;
    fetchBancos();
  }, [loading, fetchBancos]);

  const categorias = useMemo(
    () => Array.from(new Set(empresas.map((e) => e.categoria))).filter(Boolean).sort(),
    [empresas]
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

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* ─────────────────────────────────────────────────────────────────────────
          HERO — Layout SPLIT minimalista, fondo claro, sin imagen AI
          Texto izquierda + Card visual derecha con stats
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden bg-white">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" />

        {/* Geometric accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 blur-[100px] pointer-events-none" />

        {/* Grid pattern - very subtle */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, #0f172a 0, #0f172a 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, #0f172a 0, #0f172a 1px, transparent 1px, transparent 60px)"
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0} className="mb-4 md:mb-6">
                <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-black tracking-[0.2em] uppercase text-emerald-700">
                    Red Financiera
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-manrope text-slate-900 leading-[1.05] tracking-tight mb-6"
              >
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black">
                  Conecta tu entidad
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black">
                  financiera con el
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black text-emerald-600">
                  polo industrial.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-slate-600 text-base md:text-lg leading-relaxed mb-8 max-w-lg"
              >
                Suma tu banco al directorio de la UIAB y accede a mas de 60 empresas
                industriales y 50 particulares verificados del Conurbano Sur.
                Una red comercial curada, con respaldo institucional.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <Link
                  href="/contacto"
                  className="group inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-7 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Sumar mi entidad
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#beneficios"
                  className="inline-flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-300 px-7 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  Ver beneficios
                </a>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500 text-sm"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Red verificada
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  +110 miembros
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Almirante Brown
                </span>
              </motion.div>
            </motion.div>

            {/* Right: Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Main card */}
              <div className="bg-slate-900 p-8 md:p-10 relative overflow-hidden">
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10" />
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/20" />

                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 flex items-center justify-center">
                      <Network className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-400">
                        Red UIAB
                      </div>
                      <div className="text-white font-bold text-lg">
                        Directorio Activo
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    EN VIVO
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {cifrasRed.map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      className="text-center p-4 bg-white/5 border border-white/10"
                    >
                      <div className="font-manrope text-2xl md:text-3xl font-black text-white mb-1">
                        {stat.valor}
                      </div>
                      <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Services list */}
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-3">
                    Servicios mas buscados
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {serviciosBuscados.slice(0, 6).map((servicio) => (
                      <span
                        key={servicio}
                        className="inline-flex items-center px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium"
                      >
                        {servicio}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating accent card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 -left-6 bg-white p-4 shadow-xl border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Verificado UIAB</div>
                    <div className="text-xs text-slate-500">Respaldo institucional</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          CIFRAS — Stats horizontales justo despues del hero
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-800">
            {cifrasRed.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="p-8 md:p-10 text-center"
              >
                <div className="font-manrope text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                  {stat.valor}
                </div>
                <div className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">
                  {stat.label}
                </div>
                <div className="text-slate-500 text-xs font-medium">
                  {stat.sublabel}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          PROPUESTA DE VALOR — Layout asimetrico con imagen
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Imagen lado izquierdo */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/landing/bancarias-red.jpg"
                  alt="Red de negocios UIAB"
                  fill
                  className="object-cover"
                />
                {/* Overlay accent */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/30 to-transparent" />
              </div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute -bottom-8 -right-8 bg-white p-6 shadow-2xl border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 flex items-center justify-center">
                    <Network className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">110+</div>
                    <div className="text-sm text-slate-500 font-medium">Miembros en la red</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Contenido lado derecho */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:pl-8"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <div className="w-12 h-[2px] bg-emerald-600" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-700">
                  Por que sumarte
                </span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6"
              >
                Una red comercial
                <span className="text-emerald-700"> pensada para el sector financiero.</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-slate-600 text-base md:text-lg leading-relaxed mb-10"
              >
                La UIAB nuclea a las principales empresas industriales y particulares
                del Conurbano Sur. Tu entidad financiera puede conectar directamente
                con este ecosistema productivo, ofreciendo tus servicios a empresas
                verificadas con necesidades reales.
              </motion.p>

              {/* Lista de servicios buscados */}
              <motion.div variants={fadeUp} custom={3}>
                <h4 className="text-[11px] font-black tracking-[0.25em] uppercase text-slate-500 mb-4">
                  Servicios mas buscados por las empresas:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {serviciosBuscados.map((servicio) => (
                    <span
                      key={servicio}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                      {servicio}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          BENEFICIOS — Grid de 4 cards
      ───────────────────────────────────────────────────────────────────────── */}
      <section id="beneficios" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[2px] bg-emerald-600" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-700">
                Beneficios de la red
              </span>
              <div className="w-12 h-[2px] bg-emerald-600" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto"
            >
              Que obtiene tu entidad al sumarse a la red UIAB.
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {beneficiosRed.map((beneficio, idx) => (
              <motion.article
                key={beneficio.titulo}
                variants={fadeUp}
                custom={idx}
                className="group relative bg-slate-50 border border-slate-200 p-8 md:p-10 transition-all duration-500 hover:bg-white hover:border-emerald-200 hover:shadow-xl"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <beneficio.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-manrope text-xl font-bold text-slate-900 mb-3 tracking-tight">
                      {beneficio.titulo}
                    </h3>
                    <p className="text-slate-600 text-[15px] leading-relaxed">
                      {beneficio.copy}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          COMO FUNCIONA — Seccion oscura con steps
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950" />

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[2px] bg-emerald-400" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-300">
                Como funciona
              </span>
              <div className="w-12 h-[2px] bg-emerald-400" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto"
            >
              Tres pasos para conectar con el
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300"> ecosistema industrial.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {comoFunciona.map((step, idx) => (
              <motion.div
                key={step.paso}
                variants={fadeUp}
                custom={idx}
                className="relative group"
              >
                {/* Connector line */}
                {idx < comoFunciona.length - 1 && (
                  <div className="hidden md:block absolute top-16 -right-4 w-8 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 h-full transition-all duration-300 hover:bg-white/10 hover:border-emerald-500/30">
                  <div className="flex items-start justify-between mb-8">
                    <span className="font-manrope text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600/30">
                      {step.paso}
                    </span>
                    <div className="w-12 h-12 bg-white/10 border border-white/20 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-emerald-300" />
                    </div>
                  </div>

                  <h3 className="font-manrope text-xl font-bold text-white mb-4 tracking-tight">
                    {step.titulo}
                  </h3>
                  <p className="text-slate-400 text-[15px] leading-relaxed">
                    {step.copy}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          IMAGEN + CTA — Seccion visual con imagen
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden border border-slate-200">
            {/* Imagen - ocupa 3 columnas */}
            <div className="lg:col-span-3 relative aspect-[16/10] lg:aspect-auto">
              <Image
                src="/landing/bancarias-meeting.jpg"
                alt="Reunion de negocios"
                fill
                className="object-cover"
              />
            </div>

            {/* Contenido - ocupa 2 columnas */}
            <div className="lg:col-span-2 bg-slate-900 p-10 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-400 mb-6">
                <Award className="w-5 h-5" />
                <span className="text-[11px] font-black tracking-[0.25em] uppercase">
                  Respaldo institucional
                </span>
              </div>

              <h3 className="font-manrope text-2xl md:text-3xl font-black text-white leading-tight tracking-tight mb-5">
                La Union Industrial de Almirante Brown respalda cada conexion.
              </h3>

              <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
                Mas de 40 anos nucleando al sector productivo del Conurbano Sur.
                Tu entidad se suma a una red con trayectoria, empresas verificadas
                y un compromiso real con el desarrollo industrial local.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contacto"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-emerald-50 transition-colors"
                >
                  Contactar
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/nosotros"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
                >
                  Conocer la UIAB
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          DIRECTORIO — Entidades financieras ya en la red
      ───────────────────────────────────────────────────────────────────────── */}
      <section id="directorio" className="py-24 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-[2px] bg-emerald-600" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-700">
                  Directorio financiero
                </span>
              </div>
              <h2 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.05]">
                Entidades financieras
                <span className="block text-emerald-700">en la red UIAB.</span>
              </h2>
            </div>

            {currentUser && (
              <p className="text-slate-500 text-sm font-medium md:max-w-xs md:text-right">
                {cargandoDatos
                  ? "Cargando entidades..."
                  : `${empresas.length} entidades verificadas en el directorio.`}
              </p>
            )}
          </motion.div>

          {!currentUser && !loading ? (
            <AccesoBloqueadoCard />
          ) : (
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
              {/* Sidebar */}
              <aside className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
                <FilterSidebar
                  categorias={categorias}
                  categoriaSeleccionada={categoriaSeleccionada}
                  onCategoriaChange={setCategoriaSeleccionada}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  colorScheme="emerald"
                />
              </aside>

              {/* Main area */}
              <main className="w-full lg:w-9/12 xl:w-3/4">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200">
                  <div>
                    <h3 className="font-manrope text-lg font-bold text-slate-900">
                      {cargandoDatos ? "Buscando..." : `${empresasFiltradas.length} resultados`}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Vista
                    </span>
                    <div className="bg-slate-100 p-1 flex gap-1 border border-slate-200">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 transition-all ${viewMode === "grid"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-400 hover:text-emerald-700"
                          }`}
                        aria-label="Vista grilla"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 transition-all ${viewMode === "list"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-400 hover:text-emerald-700"
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
                        colorScheme="emerald"
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
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          CTA FINAL
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 text-emerald-600 mb-6">
              <Landmark className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase">
                Suma tu entidad
              </span>
            </div>

            <h2 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
              Conecta con el polo industrial mas dinamico del Conurbano Sur.
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Mas de 60 empresas industriales y 50 particulares verificados esperan conocer
              los servicios financieros de tu entidad. Sumarte es simple y la visibilidad es inmediata.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contacto"
                className="group inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Contactanos
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/directorio"
                className="inline-flex items-center gap-3 bg-slate-100 text-slate-700 border border-slate-200 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Ver directorio completo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function AccesoBloqueadoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative overflow-hidden bg-white border border-slate-200 p-10 md:p-16"
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500" />

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 items-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-600 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-xl">
          <div className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald-700 mb-3">
            Acceso restringido
          </div>
          <h3 className="font-manrope text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight mb-3">
            Ingresa para ver el directorio completo.
          </h3>
          <p className="text-slate-600 text-[15px] leading-relaxed">
            Las fichas completas de las entidades financieras estan disponibles
            para miembros verificados del ecosistema UIAB.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[200px]">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
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
      <div className="w-20 h-20 bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-6">
        <Landmark className="w-9 h-9" />
      </div>
      <h3 className="font-manrope text-2xl font-bold text-slate-900 mb-3 tracking-tight">
        Sin resultados
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8 text-[14px] leading-relaxed">
        Ajusta los filtros o explora todas las entidades disponibles.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 text-sm font-bold hover:bg-slate-200 transition-colors"
      >
        Limpiar filtros
      </button>
    </motion.div>
  );
}

function SkeletonDirectorio({ viewMode }: { viewMode: "grid" | "list" }) {
  const skeletons = Array.from({ length: 6 });

  if (viewMode === "list") {
    return (
      <div className="bg-white border border-slate-200 divide-y divide-slate-100">
        {skeletons.map((_, i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-200" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-200 w-1/3" />
                <div className="h-3 bg-slate-100 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {skeletons.map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 p-6 animate-pulse">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 w-3/4" />
              <div className="h-3 bg-slate-100 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 w-full" />
            <div className="h-3 bg-slate-100 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
