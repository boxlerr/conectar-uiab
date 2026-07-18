"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Handshake,
  Users,
  Network,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  List,
  Globe,
  Target,
  Award,
  Factory,
} from "lucide-react";

import { Entidad } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { AccesoRequerido } from "@/components/ui/acceso-requerido";
import { resolverEstadoGate } from "@/components/ui/gate-suscripcion";
import { createClient } from "@/lib/supabase/cliente";
import { leerCacheDirectorio, guardarCacheDirectorio } from "@/lib/datos/cache-directorio";
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Page content — Cooperativas como SOCIAS que se suman a la red ─── */
const beneficiosRed = [
  {
    icon: Factory,
    titulo: "Acceso a +60 Socios UIAB",
    copy: "Conecta tu cooperativa directamente con empresas manufactureras, metalúrgicas, químicas y de servicios industriales del polo de Almirante Brown.",
  },
  {
    icon: Users,
    titulo: "Demanda real de producción y servicios",
    copy: "Las empresas de la red buscan proveedores de producción, mantenimiento, logística y servicios. Tu cooperativa puede cubrir esa demanda.",
  },
  {
    icon: Target,
    titulo: "Segmentación territorial",
    copy: "Foco exclusivo en el Conurbano Sur. Conocimiento profundo del tejido productivo local y sus necesidades.",
  },
  {
    icon: ShieldCheck,
    titulo: "Validación institucional",
    copy: "La UIAB respalda cada conexión. Cooperativas verificadas, trayectoria auditada, interlocutores reales.",
  },
];

const comoFunciona = [
  {
    paso: "01",
    icon: Handshake,
    titulo: "Tu cooperativa se suma al directorio",
    copy: "Registra tu cooperativa de trabajo o producción en la red UIAB. Completa tu perfil institucional con rubros, capacidad productiva y contacto comercial.",
  },
  {
    paso: "02",
    icon: Globe,
    titulo: "Visibilidad ante empresas y proveedores",
    copy: "Tu ficha queda expuesta en el directorio. Empresas y profesionales de la red pueden consultarte directamente.",
  },
  {
    paso: "03",
    icon: Network,
    titulo: "Conexiones comerciales directas",
    copy: "Recibe consultas de Socios UIAB buscando producción y servicios cooperativos. Sin intermediarios, con trazabilidad UIAB.",
  },
];

const cifrasRed = [
  { valor: "60+", label: "Socios UIAB", sublabel: "en el directorio activo" },
  { valor: "50+", label: "Proveedores de servicios verificados", sublabel: "auditados por UIAB" },
  { valor: "100%", label: "Cobertura territorial", sublabel: "Almirante Brown y Conurbano Sur" },
  { valor: "24/7", label: "Directorio online", sublabel: "acceso permanente" },
];

const rubrosCooperativos = [
  "Producción metalúrgica",
  "Textil e indumentaria",
  "Reciclado y economía circular",
  "Mantenimiento industrial",
  "Logística y transporte",
  "Alimentos y bebidas",
  "Construcción",
  "Servicios profesionales",
];

/* ─── Main page ─── */
export default function CooperativasPage() {
  const { currentUser, loading } = useAuth();

  const [cooperativas, setCooperativas] = useState<Entidad[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Evita el mismatch de hidratación: el contenido depende del estado de auth
  // (resuelto en el cliente), así que el server y el primer render del cliente
  // se mantienen idénticos hasta que el componente monta.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fetchCooperativas = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.subscriptionEstado !== 'activa')) {
      setCargandoDatos(false);
      return;
    }
    if (!silent) {
      setCargandoDatos(true);
      setCooperativas([]);
    }

    try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vista_directorio")
      .select("*")
      .eq("categoria_socio", "cooperativas");

    if (error || !data) {
      console.error("Error fetching cooperativas:", error);
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
      const mainCat = cats.length > 0 ? cats[0] : "Cooperativa";
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
        descripcionCorta: item.actividad || item.descripcion_corta || "Cooperativa socia UIAB",
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

    guardarCacheDirectorio("cooperativas", mapped);
    setCooperativas(mapped);
    } catch (err) {
      console.error("[cooperativas] fetch falló:", err);
    } finally {
      setCargandoDatos(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (loading) return;
    const cacheado = leerCacheDirectorio("cooperativas");
    if (cacheado) {
      setCooperativas(cacheado);
      setCargandoDatos(false);
      fetchCooperativas({ silent: true });
    } else {
      fetchCooperativas();
    }
  }, [loading, fetchCooperativas]);

  const categorias = useMemo(
    () => Array.from(new Set(cooperativas.map((e) => e.categoria))).filter(Boolean).sort(),
    [cooperativas]
  );

  const cooperativasFiltradas = useMemo(() => {
    return cooperativas.filter((coop) => {
      const term = searchTerm.toLowerCase();
      const matchCat = categoriaSeleccionada ? coop.categoria === categoriaSeleccionada : true;
      const matchTerm =
        term === "" ||
        coop.nombre.toLowerCase().includes(term) ||
        coop.descripcionCorta.toLowerCase().includes(term) ||
        coop.servicios.some((s: string) => s.toLowerCase().includes(term));
      return matchCat && matchTerm;
    });
  }, [cooperativas, categoriaSeleccionada, searchTerm]);

  const tieneAcceso       = currentUser?.role === 'admin' || currentUser?.subscriptionEstado === 'activa';
  const mostrarInformativo = mounted && !loading && !currentUser;
  const mostrarBloqueado   = mounted && !loading && !!currentUser && !tieneAcceso;
  const mostrarDirectorio  = mounted && !loading && !!currentUser && tieneAcceso;

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {mostrarInformativo && (
      <>
      {/* ─────────────────────────────────────────────────────────────────────────
          HERO — Layout SPLIT minimalista, fondo claro
          Texto izquierda + Card visual derecha con stats
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden bg-white">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50/30" />

        {/* Geometric accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-50/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-100/40 rounded-full pointer-events-none" />

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
                <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2">
                  <Handshake className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-black tracking-[0.2em] uppercase text-amber-700">
                    Red Cooperativa
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
                  Suma tu cooperativa
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black">
                  a la red de
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black text-amber-600">
                  Socios UIAB.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-slate-600 text-base md:text-lg leading-relaxed mb-8 max-w-lg"
              >
                Conecta tu cooperativa de trabajo o producción con más de 60 Socios
                UIAB y 50 proveedores de servicios verificados del Conurbano Sur.
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
                  Sumar mi cooperativa
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
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  Red verificada
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  +110 miembros
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
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
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10" />
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/20" />

                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 flex items-center justify-center">
                      <Network className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400">
                        Red UIAB
                      </div>
                      <div className="text-white font-bold text-lg">
                        Directorio Activo
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
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
                      <div className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Rubros list */}
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-3">
                    Rubros cooperativos
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rubrosCooperativos.slice(0, 6).map((rubro) => (
                      <span
                        key={rubro}
                        className="inline-flex items-center px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium"
                      >
                        {rubro}
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
                  <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
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
                <div className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-1">
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
                  src="/landing/b2b-trust-partnership.png"
                  alt="Red cooperativa UIAB"
                  fill
                  className="object-cover"
                />
                {/* Overlay accent */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/30 to-transparent" />
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
                  <div className="w-12 h-12 bg-amber-50 flex items-center justify-center">
                    <Network className="w-6 h-6 text-amber-600" />
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
                <div className="w-12 h-[2px] bg-amber-600" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-700">
                  Por que sumarte
                </span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6"
              >
                Una red comercial
                <span className="text-amber-700"> pensada para el sector cooperativo.</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-slate-600 text-base md:text-lg leading-relaxed mb-10"
              >
                La UIAB nuclea a las principales empresas y socios de Almirante Brown.
                Tu cooperativa puede conectar directamente con este ecosistema
                productivo, ofreciendo producción y servicios a Socios UIAB
                verificados con necesidades reales.
              </motion.p>

              {/* Lista de rubros */}
              <motion.div variants={fadeUp} custom={3}>
                <h4 className="text-[11px] font-black tracking-[0.25em] uppercase text-slate-500 mb-4">
                  Rubros con demanda en la red:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {rubrosCooperativos.map((rubro) => (
                    <span
                      key={rubro}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                      {rubro}
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
              <div className="w-12 h-[2px] bg-amber-600" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-700">
                Beneficios de la red
              </span>
              <div className="w-12 h-[2px] bg-amber-600" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto"
            >
              Que obtiene tu cooperativa al sumarse a la red UIAB.
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
                className="group relative bg-slate-50 border border-slate-200 p-8 md:p-10 transition-all duration-500 hover:bg-white hover:border-amber-200 hover:shadow-xl"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950" />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[2px] bg-amber-400" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-300">
                Como funciona
              </span>
              <div className="w-12 h-[2px] bg-amber-400" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto"
            >
              Tres pasos para conectar con el
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300"> ecosistema industrial.</span>
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
                  <div className="hidden md:block absolute top-16 -right-4 w-8 h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
                )}

                <div className="bg-white/[0.06] border border-white/10 p-8 h-full transition-colors duration-300 hover:bg-white/10 hover:border-amber-500/30">
                  <div className="flex items-start justify-between mb-8">
                    <span className="font-manrope text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-amber-600/30">
                      {step.paso}
                    </span>
                    <div className="w-12 h-12 bg-white/10 border border-white/20 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-amber-300" />
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
                src="/landing/business-partnership.png"
                alt="Cooperativas en la red UIAB"
                fill
                className="object-cover"
              />
            </div>

            {/* Contenido - ocupa 2 columnas */}
            <div className="lg:col-span-2 bg-slate-900 p-10 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-amber-400 mb-6">
                <Award className="w-5 h-5" />
                <span className="text-[11px] font-black tracking-[0.25em] uppercase">
                  Respaldo institucional
                </span>
              </div>

              <h3 className="font-manrope text-2xl md:text-3xl font-black text-white leading-tight tracking-tight mb-5">
                La Union Industrial de Almirante Brown respalda cada conexion.
              </h3>

              <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
                Desde 2007 nucleando al sector productivo del Conurbano Sur.
                Tu cooperativa se suma a una red con trayectoria, empresas verificadas
                y un compromiso real con el desarrollo industrial local.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contacto"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-amber-50 transition-colors"
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
      {/* ─────────────────────────────────────────────────────────────────────────
          DIRECTORIO — Cooperativas ya en la red
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
                <div className="w-12 h-[2px] bg-amber-600" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-700">
                  Directorio cooperativo
                </span>
              </div>
              <h2 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.05]">
                Cooperativas
                <span className="block text-amber-700">en la red UIAB.</span>
              </h2>
            </div>

            <p className="text-slate-500 text-sm font-medium md:max-w-xs md:text-right">
              {cargandoDatos
                ? "Cargando cooperativas..."
                : `${cooperativas.length} cooperativas verificadas en el directorio.`}
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
                  colorScheme="amber"
                />
              </aside>

              {/* Main area */}
              <main className="w-full lg:w-9/12 xl:w-3/4">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200">
                  <div>
                    <h3 className="font-manrope text-lg font-bold text-slate-900">
                      {cargandoDatos ? "Buscando..." : `${cooperativasFiltradas.length} resultados`}
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
                          ? "bg-white text-amber-700 shadow-sm"
                          : "text-slate-400 hover:text-amber-700"
                          }`}
                        aria-label="Vista grilla"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 transition-all ${viewMode === "list"
                          ? "bg-white text-amber-700 shadow-sm"
                          : "text-slate-400 hover:text-amber-700"
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
                ) : cooperativasFiltradas.length > 0 ? (
                  <div
                    key={viewMode}
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100"
                    }
                  >
                    {cooperativasFiltradas.map((coop) => (
                      <DirectoryProfileCard
                        key={coop.id}
                        entidad={coop}
                        basePath="/empresas"
                        variant={viewMode}
                        colorScheme="amber"
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
        </div>
      </section>
      </>
      )}

      {mostrarInformativo && (
      <>
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
            <div className="inline-flex items-center gap-2 text-amber-600 mb-6">
              <Handshake className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase">
                Suma tu cooperativa
              </span>
            </div>

            <h2 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
              Conecta con los socios UIAB más dinámicos del Conurbano Sur.
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Más de 60 socios UIAB y 50 proveedores de servicios verificados esperan conocer
              la producción y los servicios de tu cooperativa. Sumarte es simple y la visibilidad es inmediata.
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
      </>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white border border-slate-200 p-16 md:p-20 text-center"
    >
      <div className="w-20 h-20 bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-6">
        <Handshake className="w-9 h-9" />
      </div>
      <h3 className="font-manrope text-2xl font-bold text-slate-900 mb-3 tracking-tight">
        Sin resultados
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8 text-[14px] leading-relaxed">
        Ajusta los filtros o explora todas las cooperativas disponibles.
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
