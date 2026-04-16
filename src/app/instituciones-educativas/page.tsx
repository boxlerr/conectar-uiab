"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

/* ─── Main page ─── */
export default function InstitucionesEducativasPage() {
  const { currentUser, loading } = useAuth();

  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "42%"]);
  const headerOpacity = useTransform(scrollY, [0, 420], [1, 0.15]);

  const fetchInstituciones = useCallback(async () => {
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
      .eq("categoria_socio", "instituciones_educativas");

    if (error || !data) {
      console.error("Error fetching instituciones educativas:", error);
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
    setCargandoDatos(false);
  }, [currentUser]);

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

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[78vh] flex items-center overflow-hidden -mt-24 pt-36 pb-20">
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.png"
            alt="Academia e industria"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#2a1454] via-[#3b2a6b]/90 to-[#6b3aa0]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0b36]/85 via-[#1a0b36]/40 to-transparent" />
          {/* Subtle academic ruling pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 48px)",
            }}
          />
        </motion.div>

        {/* Floating academic accents */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="absolute top-32 right-[8%] w-[320px] h-[320px] rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 blur-[120px] pointer-events-none z-0"
        />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Left: editorial copy */}
            <motion.div variants={fadeUp} custom={0} className="lg:col-span-8 max-w-3xl">
              <div className="inline-flex items-center gap-2 backdrop-blur-md rounded bg-violet-500/15 border border-violet-300/30 text-violet-200 px-3 py-1.5 mb-8 shadow-xl">
                <GraduationCap className="w-4 h-4" />
                <span className="text-[11px] font-black tracking-[0.22em] uppercase">
                  Directorio · Educación UIAB
                </span>
              </div>

              <h1 className="font-manrope text-white leading-[0.98] tracking-tight mb-7 drop-shadow-[0_2px_30px_rgba(58,28,140,0.45)]">
                <span className="block text-[13px] md:text-sm font-black tracking-[0.35em] uppercase text-violet-200/80 mb-5">
                  Academia · Industria · Territorio
                </span>
                <span className="block text-4xl sm:text-5xl md:text-[4.4rem] font-black">
                  La formación técnica
                </span>
                <span className="block text-4xl sm:text-5xl md:text-[4.4rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-violet-100">
                  al servicio de la industria.
                </span>
              </h1>

              <p className="text-violet-50/80 text-base md:text-lg font-medium leading-relaxed max-w-2xl mb-10">
                Centros de formación técnica, terciaria y universitaria aliados a la UIAB.
                Un puente curado entre el talento que se forma en Almirante Brown
                y las empresas del polo industrial que lo necesitan.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#directorio"
                  className="group inline-flex items-center gap-3 bg-white text-[#3b2a6b] px-7 py-4 rounded text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_-8px_rgba(58,28,140,0.55)] hover:shadow-[0_16px_40px_-6px_rgba(58,28,140,0.7)] transition-all duration-500 hover:-translate-y-0.5"
                >
                  Explorar instituciones
                  <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/20 text-white px-7 py-4 rounded text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-500"
                >
                  Cómo funciona
                </a>
              </div>
            </motion.div>

            {/* Right: editorial "ledger" card */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="lg:col-span-4 hidden lg:block"
            >
              <div className="relative">
                {/* Ambient glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-violet-400/30 via-indigo-500/20 to-transparent rounded-md blur-2xl" />

                <div className="relative backdrop-blur-xl bg-white/8 border border-white/15 rounded-md p-8 shadow-[0_24px_60px_-20px_rgba(20,10,50,0.6)]">
                  <div className="flex items-center gap-2 text-violet-200/80 mb-6">
                    <Library className="w-4 h-4" />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase">
                      Expediente abierto
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-[10px] font-black text-violet-300/60 uppercase tracking-[0.22em] mb-1.5">
                        Niveles cubiertos
                      </div>
                      <div className="font-manrope text-xl font-extrabold text-white leading-tight">
                        Secundario técnico · Terciario · Universitario
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-violet-300/30 via-white/10 to-transparent" />

                    <div>
                      <div className="text-[10px] font-black text-violet-300/60 uppercase tracking-[0.22em] mb-1.5">
                        Formato de vínculo
                      </div>
                      <div className="font-manrope text-xl font-extrabold text-white leading-tight">
                        Pasantías · Cursos a medida · I+D aplicado
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-violet-300/30 via-white/10 to-transparent" />

                    <div>
                      <div className="text-[10px] font-black text-violet-300/60 uppercase tracking-[0.22em] mb-1.5">
                        Cobertura territorial
                      </div>
                      <div className="font-manrope text-xl font-extrabold text-white leading-tight">
                        Almirante Brown y Conurbano Sur
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 flex items-center gap-3 text-violet-100/80">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Auditado y curado por la UIAB
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR (editorial ledger strip) ─── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white rounded-md border border-violet-100/50 -mt-20 z-20 overflow-hidden
                     shadow-[0_20px_60px_-20px_rgba(58,28,140,0.25)]"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />

          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            <StatCell
              eyebrow="Instituciones"
              valor={cargandoDatos ? "…" : empresas.length > 0 ? `${empresas.length}` : "—"}
              copy="aliadas al ecosistema"
              icon={GraduationCap}
            />
            <StatCell eyebrow="Niveles" valor="3" copy="técnico · terciario · universidad" icon={BookOpen} />
            <StatCell eyebrow="Acuerdos" valor="Red" copy="de pasantías y prácticas" icon={Handshake} />
            <StatCell eyebrow="Vinculación" valor="I+D" copy="laboratorios abiertos a la industria" icon={FlaskConical} />
          </div>
        </motion.div>
      </div>

      {/* ─── PILARES — Qué vas a encontrar ─── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-28">
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
            className="font-manrope text-3xl md:text-5xl font-black text-[#191c1e] tracking-tight leading-[1.04]"
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
              className="group relative bg-white rounded-md border border-violet-200/30 p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-violet-300/60"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-sm bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-violet-100 ring-1 ring-violet-200/50">
                  <p.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-[0.28em] uppercase text-violet-700/80 mt-3">
                  {p.eyebrow}
                </span>
              </div>

              <h3 className="font-manrope text-[22px] font-extrabold text-[#191c1e] leading-tight mb-4 tracking-tight">
                {p.titulo}
              </h3>
              <p className="text-slate-500 text-[14px] leading-relaxed font-medium">
                {p.copy}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section id="como-funciona" className="mt-32">
        <div className="relative overflow-hidden">
          {/* Tonal underlay — editorial "dark reading" strip */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b36] via-[#2a1454] to-[#3b2a6b]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 80px)",
            }}
          />
          <div className="absolute top-0 left-[10%] w-[480px] h-[480px] rounded-full bg-violet-500/20 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-[5%] w-[420px] h-[420px] rounded-full bg-indigo-500/20 blur-[140px] pointer-events-none" />

          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-24 md:py-32">
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
                  {/* Connector line to next step */}
                  {idx < journey.length - 1 && (
                    <div className="hidden md:block absolute top-14 -right-4 lg:-right-5 w-8 lg:w-10 h-px bg-gradient-to-r from-violet-300/50 to-transparent" />
                  )}

                  <div className="relative h-full backdrop-blur-xl bg-white/[0.05] border border-white/10 rounded-md p-8 transition-all duration-500 group-hover:bg-white/[0.08] group-hover:border-violet-300/40">
                    <div className="flex items-baseline justify-between mb-8">
                      <span className="font-manrope text-[56px] font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-300 to-white/30 leading-none tracking-tighter">
                        {j.paso}
                      </span>
                      <div className="w-11 h-11 rounded-sm bg-white/10 border border-white/15 text-violet-100 flex items-center justify-center">
                        <j.icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="font-manrope text-xl md:text-[22px] font-extrabold text-white leading-tight tracking-tight mb-4">
                      {j.titulo}
                    </h3>
                    <p className="text-violet-100/70 text-[14px] leading-relaxed font-medium">
                      {j.copy}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── DIRECTORIO INTEGRADO ─── */}
      <section id="directorio" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-24 scroll-mt-28">
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
            <h2 className="font-manrope text-3xl md:text-5xl font-black text-[#191c1e] tracking-tight leading-[1.05]">
              Instituciones educativas
              <span className="block text-violet-700">aliadas a la UIAB.</span>
            </h2>
          </div>

          {currentUser && (
            <p className="text-slate-500 text-sm font-medium md:max-w-xs md:text-right">
              {cargandoDatos
                ? "Cargando expedientes académicos…"
                : `${empresas.length} instituciones verificadas · ficha completa visible como socio UIAB.`}
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
                colorScheme="violet"
              />
            </aside>

            {/* Main area */}
            <main className="w-full lg:w-9/12 xl:w-3/4">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-md border border-violet-100/60 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div>
                  <h3 className="font-manrope text-lg font-bold text-[#191c1e]">
                    {cargandoDatos ? "Buscando…" : `${empresasFiltradas.length} resultados`}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Vista
                  </span>
                  <div className="bg-violet-50/60 p-1 rounded-md flex gap-1 border border-violet-100/60">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-sm transition-all ${
                        viewMode === "grid"
                          ? "bg-white text-violet-700 shadow-sm"
                          : "text-slate-400 hover:text-violet-700"
                      }`}
                      aria-label="Vista grilla"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-sm transition-all ${
                        viewMode === "list"
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
                      : "bg-white rounded-md border border-violet-100/60 overflow-hidden divide-y divide-violet-100/50"
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
        )}
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-md bg-gradient-to-br from-[#2a1454] via-[#3b2a6b] to-[#6b3aa0] p-10 md:p-16"
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 44px)",
            }}
          />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-400/30 blur-[120px] translate-x-1/3 -translate-y-1/3" />

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
                className="group inline-flex items-center justify-center gap-2 bg-white text-[#3b2a6b] px-7 py-4 rounded text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_-8px_rgba(20,10,50,0.55)] hover:shadow-[0_16px_40px_-4px_rgba(20,10,50,0.7)] transition-all duration-500 hover:-translate-y-0.5"
              >
                Registrar institución
                <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/directorio"
                className="inline-flex items-center justify-center gap-2 backdrop-blur-md bg-white/5 border border-white/20 text-white px-7 py-4 rounded text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-500"
              >
                Ver directorio completo
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

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
    <div className="p-6 md:p-8 flex items-start gap-4">
      <div className="w-10 h-10 rounded-sm bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 ring-1 ring-violet-200/60">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-violet-600/70 uppercase tracking-[0.22em] mb-1">
          {eyebrow}
        </div>
        <div className="font-manrope text-[28px] md:text-[34px] font-black text-[#191c1e] leading-none tracking-tight mb-1.5">
          {valor}
        </div>
        <div className="text-[12px] text-slate-500 font-medium leading-snug line-clamp-2">
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
      className="relative overflow-hidden rounded-md border border-violet-200/40 bg-white p-10 md:p-16"
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500" />
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-100/60 blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 items-center">
        <div className="w-16 h-16 rounded-sm bg-violet-50 text-violet-700 flex items-center justify-center ring-1 ring-violet-200/60">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-xl">
          <div className="text-[10px] font-black tracking-[0.28em] uppercase text-violet-700 mb-3">
            Acceso restringido · Socios UIAB
          </div>
          <h3 className="font-manrope text-2xl md:text-[30px] font-extrabold text-[#191c1e] leading-tight tracking-tight mb-3">
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
            className="inline-flex items-center justify-center gap-2 bg-[#3b2a6b] text-white px-6 py-3.5 rounded text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_-12px_rgba(58,28,140,0.55)] hover:bg-[#2a1454] transition-all duration-500"
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-2 bg-violet-50 text-violet-800 border border-violet-200/80 px-6 py-3.5 rounded text-sm font-bold uppercase tracking-widest hover:bg-violet-100 transition-all duration-500"
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
      className="bg-white rounded-md border border-violet-100/60 p-16 md:p-20 text-center"
    >
      <div className="w-20 h-20 rounded-sm bg-violet-50 text-violet-500 flex items-center justify-center mx-auto mb-6 ring-1 ring-violet-200/60">
        <GraduationCap className="w-9 h-9" />
      </div>
      <h3 className="font-manrope text-2xl font-extrabold text-[#191c1e] mb-3 tracking-tight">
        Sin resultados por ahora
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium text-[14px] leading-relaxed">
        Ajustá los filtros o explorá todas las instituciones del directorio académico UIAB.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 bg-[#3b2a6b] text-white px-7 py-3.5 rounded text-xs font-black uppercase tracking-widest shadow-[0_10px_24px_-8px_rgba(58,28,140,0.45)] hover:bg-[#2a1454] transition-all duration-500"
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
          : "bg-white rounded-md border border-violet-100/60 overflow-hidden divide-y divide-violet-100/50"
      }
    >
      {Array.from({ length: viewMode === "grid" ? 6 : 5 }).map((_, i) =>
        viewMode === "grid" ? (
          <div
            key={i}
            className="bg-white rounded-md border border-violet-100/60 p-7 h-[280px] animate-pulse"
          >
            <div className="flex justify-between mb-6">
              <div className="w-14 h-14 rounded-sm bg-violet-50" />
              <div className="w-24 h-6 rounded-sm bg-violet-50" />
            </div>
            <div className="h-5 w-3/4 bg-violet-50 rounded mb-3" />
            <div className="h-3 w-full bg-violet-50/80 rounded mb-2" />
            <div className="h-3 w-5/6 bg-violet-50/80 rounded mb-6" />
            <div className="h-8 w-full bg-violet-50/60 rounded-sm" />
          </div>
        ) : (
          <div key={i} className="px-8 py-6 flex items-center gap-8 animate-pulse">
            <div className="w-20 h-20 rounded-md bg-violet-50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-violet-50 rounded" />
              <div className="h-5 w-2/3 bg-violet-50 rounded" />
              <div className="h-3 w-1/2 bg-violet-50/80 rounded" />
            </div>
            <div className="hidden md:block w-[170px] space-y-2">
              <div className="h-3 w-16 bg-violet-50/80 rounded" />
              <div className="h-4 w-28 bg-violet-50/80 rounded" />
            </div>
            <div className="hidden md:block w-32 h-9 rounded-sm bg-violet-50" />
          </div>
        ),
      )}
    </div>
  );
}

