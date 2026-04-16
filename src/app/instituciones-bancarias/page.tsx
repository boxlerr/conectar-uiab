"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Landmark,
  TrendingUp,
  ShieldCheck,
  Handshake,
  BarChart3,
  Wallet,
  Scale,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  LayoutGrid,
  List,
  Lock,
  FileSignature,
  LineChart,
  Calculator,
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Page content ─── */
const pilares = [
  {
    icon: Wallet,
    eyebrow: "Financiamiento",
    titulo: "Líneas PyME específicas",
    copy:
      "Capital de trabajo, adquisición de bienes de capital, prefinanciación de exportaciones y programas de eficiencia energética — identificados por entidad, con tasas y requisitos explícitos.",
  },
  {
    icon: Briefcase,
    eyebrow: "Asesoramiento",
    titulo: "Oficiales con foco industrial",
    copy:
      "Cada entidad socia expone el referente comercial asignado al polo de Almirante Brown. Interlocutores que conocen el territorio, los sectores y el ciclo operativo de la industria.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Operatoria",
    titulo: "Canal verificado UIAB",
    copy:
      "Acompañamiento en la presentación de carpetas, validación de documentación y negociación de condiciones. La UIAB avala el vínculo y monitorea el servicio a sus socios.",
  },
];

const journey = [
  {
    paso: "01",
    icon: FileSignature,
    titulo: "Consultá el catálogo",
    copy:
      "Revisá cada entidad, sus líneas activas, las condiciones vigentes y el referente comercial para el polo industrial.",
  },
  {
    paso: "02",
    icon: Scale,
    titulo: "Compará condiciones",
    copy:
      "Plazos, tasas, garantías, topes y requisitos expuestos en cada expediente. Sin letra chica ni intermediarios.",
  },
  {
    paso: "03",
    icon: TrendingUp,
    titulo: "Operá con respaldo",
    copy:
      "Presentá tu carpeta con acompañamiento UIAB. Monitoreamos plazos de respuesta y calidad del servicio contigo.",
  },
];

/* Sample rate-board entries — used as editorial illustration in the hero. */
const rateBoard = [
  { linea: "Capital de trabajo", plazo: "24 m", tipo: "Tasa variable" },
  { linea: "Bienes de capital", plazo: "60 m", tipo: "Tasa fija" },
  { linea: "Prefinanciación exportaciones", plazo: "12 m", tipo: "USD / variable" },
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
  const headerY = useTransform(scrollY, [0, 600], ["0%", "40%"]);
  const headerOpacity = useTransform(scrollY, [0, 420], [1, 0.18]);

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
      {/* ─── HERO — "vault / trading floor" ─── */}
      <section className="relative min-h-[78vh] flex items-center overflow-hidden -mt-24 pt-36 pb-20">
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.png"
            alt="Instituciones bancarias UIAB"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#021413] via-[#042f2e]/90 to-[#115e59]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#021413]/85 via-[#021413]/40 to-transparent" />
          {/* Columnar/ledger texture — vertical lines */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 96px)",
            }}
          />
        </motion.div>

        {/* Ambient accents */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.18, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="absolute top-24 right-[6%] w-[340px] h-[340px] rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 blur-[130px] pointer-events-none z-0"
        />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
          >
            {/* Left: editorial copy */}
            <motion.div variants={fadeUp} custom={0} className="lg:col-span-7 max-w-3xl">
              <div className="inline-flex items-center gap-2 backdrop-blur-md rounded bg-emerald-500/15 border border-emerald-300/30 text-emerald-100 px-3 py-1.5 mb-8 shadow-xl">
                <Landmark className="w-4 h-4" />
                <span className="text-[11px] font-black tracking-[0.22em] uppercase">
                  Directorio · Financiero UIAB
                </span>
              </div>

              <h1 className="font-manrope text-white leading-[0.98] tracking-tight mb-7 drop-shadow-[0_2px_30px_rgba(4,47,46,0.55)]">
                <span className="block text-[13px] md:text-sm font-black tracking-[0.35em] uppercase text-emerald-200/80 mb-5">
                  Capital · Territorio · Industria
                </span>
                <span className="block text-4xl sm:text-5xl md:text-[4.4rem] font-black">
                  Capital que entiende
                </span>
                <span className="block text-4xl sm:text-5xl md:text-[4.4rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-emerald-100">
                  el ciclo industrial.
                </span>
              </h1>

              <p className="text-emerald-50/85 text-base md:text-lg font-medium leading-relaxed max-w-2xl mb-10">
                Entidades financieras socias de la UIAB con líneas específicas para el polo
                industrial de Almirante Brown. Contacto verificado, asesoramiento técnico y
                operatoria directa — sin intermediarios.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#directorio"
                  className="group inline-flex items-center gap-3 bg-white text-[#042f2e] px-7 py-4 rounded text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_-8px_rgba(4,47,46,0.6)] hover:shadow-[0_16px_40px_-6px_rgba(4,47,46,0.75)] transition-all duration-500 hover:-translate-y-0.5"
                >
                  Ver entidades
                  <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                </a>
                <a
                  href="#lineas"
                  className="inline-flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/20 text-white px-7 py-4 rounded text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-500"
                >
                  Líneas activas
                </a>
              </div>
            </motion.div>

            {/* Right: editorial "rate board" card */}
            <motion.div variants={fadeUp} custom={2} className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                {/* Ambient glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-300/30 via-teal-500/20 to-transparent rounded-md blur-2xl" />

                <div className="relative backdrop-blur-xl bg-white/8 border border-white/15 rounded-md shadow-[0_24px_60px_-20px_rgba(2,20,19,0.6)] overflow-hidden">
                  {/* Header strip */}
                  <div className="px-7 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                    <div className="flex items-center gap-2 text-emerald-100/80">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-[10px] font-black tracking-[0.3em] uppercase">
                        Tablero de líneas
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-300 tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVO
                    </span>
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-7 py-3 text-[9px] font-black tracking-[0.26em] uppercase text-emerald-200/50 border-b border-white/5">
                    <span>Línea</span>
                    <span className="text-right">Plazo</span>
                    <span className="text-right">Tipo</span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-white/5">
                    {rateBoard.map((row, idx) => (
                      <motion.div
                        key={row.linea}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.12, duration: 0.5 }}
                        className="grid grid-cols-[1fr_auto_auto] gap-4 px-7 py-4 items-center group hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-white font-manrope text-[15px] font-bold tracking-tight">
                          {row.linea}
                        </span>
                        <span className="text-emerald-200 text-[13px] font-black tabular-nums">
                          {row.plazo}
                        </span>
                        <span className="text-emerald-100/80 text-[11px] font-semibold uppercase tracking-wider">
                          {row.tipo}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-7 py-4 bg-white/[0.03] border-t border-white/10 flex items-center justify-between text-emerald-100/70 text-xs">
                    <span className="font-semibold">Condiciones por entidad</span>
                    <span className="inline-flex items-center gap-1 font-black text-emerald-300 tracking-widest text-[10px]">
                      EXPEDIENTE <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-white rounded-md border border-emerald-100/50 -mt-20 z-20 overflow-hidden
                     shadow-[0_20px_60px_-20px_rgba(4,47,46,0.25)]"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            <StatCell
              eyebrow="Entidades"
              valor={cargandoDatos ? "…" : empresas.length > 0 ? `${empresas.length}` : "—"}
              copy="socias del directorio"
              icon={Landmark}
            />
            <StatCell eyebrow="Líneas PyME" valor="Activas" copy="capital · bienes · exportación" icon={Wallet} />
            <StatCell eyebrow="Referentes" valor="Polo AB" copy="oficiales con foco industrial" icon={Handshake} />
            <StatCell eyebrow="Operatoria" valor="UIAB" copy="acompañamiento de carpeta" icon={ShieldCheck} />
          </div>
        </motion.div>
      </div>

      {/* ─── PILARES ─── */}
      <section id="lineas" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-28 scroll-mt-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-14 max-w-3xl"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
            <div className="w-10 h-[2px] bg-emerald-600" />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-700">
              Qué vas a encontrar
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="font-manrope text-3xl md:text-5xl font-black text-[#191c1e] tracking-tight leading-[1.04]"
          >
            Un tablero financiero
            <span className="text-emerald-700"> pensado para la industria de Almirante Brown.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-slate-500 text-[15px] md:text-base font-medium leading-relaxed mt-6 max-w-2xl"
          >
            Cada entidad socia expone sus líneas, condiciones y referente territorial. La UIAB
            monitorea el vínculo: operás con trazabilidad y respaldo gremial.
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
              className="group relative bg-white rounded-md border border-emerald-200/30 p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300/60"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-sm bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-emerald-100 ring-1 ring-emerald-200/50">
                  <p.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald-700/80 mt-3">
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

      {/* ─── LÍNEAS ACTIVAS — Editorial grid of line types (distinctive to bancarias) ─── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="bg-white border border-emerald-100/50 rounded-md p-8 md:p-12 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(4,47,46,0.9) 0, rgba(4,47,46,0.9) 1px, transparent 1px, transparent 48px)",
            }}
          />

          <div className="relative">
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[2px] bg-emerald-600" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-700">
                Líneas activas · Polo industrial
              </span>
            </motion.div>
            <motion.h3
              variants={fadeUp}
              custom={1}
              className="font-manrope text-2xl md:text-[32px] font-black text-[#191c1e] tracking-tight leading-tight mb-10"
            >
              Catálogo típico de financiamiento disponible.
            </motion.h3>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-emerald-100/60 rounded-sm overflow-hidden border border-emerald-100/60"
            >
              {[
                { icon: Wallet, titulo: "Capital de trabajo", copy: "Liquidez operativa de corto y mediano plazo." },
                { icon: LineChart, titulo: "Bienes de capital", copy: "Inversión en maquinaria, planta y equipamiento." },
                { icon: TrendingUp, titulo: "Prefinanciación", copy: "Exportaciones industriales con foco regional." },
                { icon: Calculator, titulo: "Eficiencia energética", copy: "Renovables, reconversión y ahorro energético." },
              ].map((item, idx) => (
                <motion.div
                  key={item.titulo}
                  variants={fadeUp}
                  custom={idx}
                  className="bg-white p-6 md:p-7 group transition-colors hover:bg-emerald-50/30"
                >
                  <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 ring-1 ring-emerald-200/60 group-hover:bg-emerald-100 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-manrope text-[17px] font-extrabold text-[#191c1e] tracking-tight leading-tight mb-2">
                    {item.titulo}
                  </h4>
                  <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                    {item.copy}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              variants={fadeUp}
              custom={5}
              className="mt-8 text-[12px] text-slate-400 font-semibold tracking-wide"
            >
              * Disponibilidad y condiciones específicas por entidad. Consultá el expediente
              individual de cada banco para detalles vigentes.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section id="como-funciona" className="mt-32">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#021413] via-[#042f2e] to-[#0f4a47]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 80px)",
            }}
          />
          <div className="absolute top-0 left-[10%] w-[480px] h-[480px] rounded-full bg-emerald-500/20 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-[5%] w-[420px] h-[420px] rounded-full bg-teal-500/20 blur-[140px] pointer-events-none" />

          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-24 md:py-32">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="max-w-3xl mb-16"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                <div className="w-10 h-[2px] bg-emerald-300" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-200">
                  Cómo funciona
                </span>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-manrope text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.05]"
              >
                Tres pasos para
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-white">
                  operar con una entidad socia.
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
                <motion.div key={j.paso} variants={fadeUp} custom={idx} className="relative group">
                  {idx < journey.length - 1 && (
                    <div className="hidden md:block absolute top-14 -right-4 lg:-right-5 w-8 lg:w-10 h-px bg-gradient-to-r from-emerald-300/50 to-transparent" />
                  )}

                  <div className="relative h-full backdrop-blur-xl bg-white/[0.05] border border-white/10 rounded-md p-8 transition-all duration-500 group-hover:bg-white/[0.08] group-hover:border-emerald-300/40">
                    <div className="flex items-baseline justify-between mb-8">
                      <span className="font-manrope text-[56px] font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-white/30 leading-none tracking-tighter">
                        {j.paso}
                      </span>
                      <div className="w-11 h-11 rounded-sm bg-white/10 border border-white/15 text-emerald-100 flex items-center justify-center">
                        <j.icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="font-manrope text-xl md:text-[22px] font-extrabold text-white leading-tight tracking-tight mb-4">
                      {j.titulo}
                    </h3>
                    <p className="text-emerald-100/70 text-[14px] leading-relaxed font-medium">
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
              <div className="w-10 h-[2px] bg-emerald-600" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-700">
                Directorio activo
              </span>
            </div>
            <h2 className="font-manrope text-3xl md:text-5xl font-black text-[#191c1e] tracking-tight leading-[1.05]">
              Entidades financieras
              <span className="block text-emerald-700">socias de la UIAB.</span>
            </h2>
          </div>

          {currentUser && (
            <p className="text-slate-500 text-sm font-medium md:max-w-xs md:text-right">
              {cargandoDatos
                ? "Cargando tablero financiero…"
                : `${empresas.length} entidades verificadas · ficha completa visible como socio UIAB.`}
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
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-md border border-emerald-100/60 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div>
                  <h3 className="font-manrope text-lg font-bold text-[#191c1e]">
                    {cargandoDatos ? "Buscando…" : `${empresasFiltradas.length} resultados`}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Vista
                  </span>
                  <div className="bg-emerald-50/60 p-1 rounded-md flex gap-1 border border-emerald-100/60">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-sm transition-all ${
                        viewMode === "grid"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-400 hover:text-emerald-700"
                      }`}
                      aria-label="Vista grilla"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-sm transition-all ${
                        viewMode === "list"
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
                      : "bg-white rounded-md border border-emerald-100/60 overflow-hidden divide-y divide-emerald-100/50"
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
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-md bg-gradient-to-br from-[#021413] via-[#042f2e] to-[#115e59] p-10 md:p-16"
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 72px)",
            }}
          />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-400/30 blur-[120px] translate-x-1/3 -translate-y-1/3" />

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 mb-6 text-emerald-200">
                <Landmark className="w-4 h-4" />
                <span className="text-[11px] font-black tracking-[0.3em] uppercase">
                  ¿Representás una entidad financiera?
                </span>
              </div>
              <h3 className="font-manrope text-3xl md:text-[2.5rem] font-black text-white leading-[1.05] tracking-tight mb-5">
                Sumá tus líneas al polo
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-white">
                  industrial más dinámico del Conurbano Sur.
                </span>
              </h3>
              <p className="text-emerald-100/80 text-[15px] font-medium leading-relaxed">
                Acceso directo a más de 60 empresas socias y cientos de PyMEs proveedoras.
                Un canal comercial curado, con respaldo gremial y trazabilidad.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:min-w-[240px]">
              <Link
                href="/contacto"
                className="group inline-flex items-center justify-center gap-2 bg-white text-[#042f2e] px-7 py-4 rounded text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_-8px_rgba(2,20,19,0.55)] hover:shadow-[0_16px_40px_-4px_rgba(2,20,19,0.7)] transition-all duration-500 hover:-translate-y-0.5"
              >
                Contactanos
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
  icon: typeof Landmark;
}) {
  return (
    <div className="p-6 md:p-8 flex items-start gap-4">
      <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 ring-1 ring-emerald-200/60">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-emerald-700/70 uppercase tracking-[0.22em] mb-1">
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
      className="relative overflow-hidden rounded-md border border-emerald-200/40 bg-white p-10 md:p-16"
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-100/60 blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 items-center">
        <div className="w-16 h-16 rounded-sm bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200/60">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-xl">
          <div className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald-700 mb-3">
            Acceso restringido · Socios UIAB
          </div>
          <h3 className="font-manrope text-2xl md:text-[30px] font-extrabold text-[#191c1e] leading-tight tracking-tight mb-3">
            Ingresá para ver tasas y referentes.
          </h3>
          <p className="text-slate-500 text-[15px] font-medium leading-relaxed">
            Las líneas activas, condiciones y contactos comerciales de las entidades socias
            están reservados a empresas verificadas en el ecosistema UIAB.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[200px]">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-[#042f2e] text-white px-6 py-3.5 rounded text-sm font-black uppercase tracking-widest shadow-[0_12px_32px_-12px_rgba(4,47,46,0.55)] hover:bg-[#021413] transition-all duration-500"
          >
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-6 py-3.5 rounded text-sm font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all duration-500"
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
      className="bg-white rounded-md border border-emerald-100/60 p-16 md:p-20 text-center"
    >
      <div className="w-20 h-20 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-200/60">
        <Landmark className="w-9 h-9" />
      </div>
      <h3 className="font-manrope text-2xl font-extrabold text-[#191c1e] mb-3 tracking-tight">
        Sin resultados por ahora
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium text-[14px] leading-relaxed">
        Ajustá los filtros o explorá todas las entidades del tablero financiero UIAB.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 bg-[#042f2e] text-white px-7 py-3.5 rounded text-xs font-black uppercase tracking-widest shadow-[0_10px_24px_-8px_rgba(4,47,46,0.45)] hover:bg-[#021413] transition-all duration-500"
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
          : "bg-white rounded-md border border-emerald-100/60 overflow-hidden divide-y divide-emerald-100/50"
      }
    >
      {Array.from({ length: viewMode === "grid" ? 6 : 5 }).map((_, i) =>
        viewMode === "grid" ? (
          <div
            key={i}
            className="bg-white rounded-md border border-emerald-100/60 p-7 h-[280px] animate-pulse"
          >
            <div className="flex justify-between mb-6">
              <div className="w-14 h-14 rounded-sm bg-emerald-50" />
              <div className="w-24 h-6 rounded-sm bg-emerald-50" />
            </div>
            <div className="h-5 w-3/4 bg-emerald-50 rounded mb-3" />
            <div className="h-3 w-full bg-emerald-50/80 rounded mb-2" />
            <div className="h-3 w-5/6 bg-emerald-50/80 rounded mb-6" />
            <div className="h-8 w-full bg-emerald-50/60 rounded-sm" />
          </div>
        ) : (
          <div key={i} className="px-8 py-6 flex items-center gap-8 animate-pulse">
            <div className="w-20 h-20 rounded-md bg-emerald-50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-emerald-50 rounded" />
              <div className="h-5 w-2/3 bg-emerald-50 rounded" />
              <div className="h-3 w-1/2 bg-emerald-50/80 rounded" />
            </div>
            <div className="hidden md:block w-[170px] space-y-2">
              <div className="h-3 w-16 bg-emerald-50/80 rounded" />
              <div className="h-4 w-28 bg-emerald-50/80 rounded" />
            </div>
            <div className="hidden md:block w-32 h-9 rounded-sm bg-emerald-50" />
          </div>
        ),
      )}
    </div>
  );
}
