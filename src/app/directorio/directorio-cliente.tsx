"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Entidad } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import {
  Building2,
  Wrench,
  Landmark,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  List,
  CheckCircle2,
  LockOpen,
  ArrowRight,
  Search,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";

type TabKey =
  | "empresas"
  | "prestadores"
  | "financieras"
  | "educativas"
  | "cooperativas";

type Esquema = "blue" | "emerald" | "violet" | "amber" | "teal";

interface ConfigTab {
  key: TabKey;
  etiqueta: string;
  Icono: LucideIcon;
  esquema: Esquema;
  /** Badge extra en la pestaña (p.ej. "No socios" para prestadores). */
  badge?: string;
  singular: string;
  plural: string;
  /** Formas breves para los slots que truncan (mini-stats del CTA). Default: singular/plural. */
  singularCorto?: string;
  pluralCorto?: string;
  genero: "f" | "m";
  /** Título del empty state invitacional cuando la pestaña no tiene entidades. */
  tituloVacio: string;
  /** Si permite alternar vista grid/list (los prestadores van siempre en lista). */
  permiteVista: boolean;
}

const TABS: ConfigTab[] = [
  {
    key: "empresas",
    etiqueta: "Empresas socias",
    Icono: Building2,
    esquema: "blue",
    singular: "empresa socia",
    plural: "empresas socias",
    genero: "f",
    tituloVacio: "Todavía no hay empresas socias publicadas en el directorio",
    permiteVista: true,
  },
  {
    key: "prestadores",
    etiqueta: "Prestadores de productos y servicios",
    Icono: Wrench,
    esquema: "emerald",
    badge: "No socios",
    singular: "prestador de productos y servicios",
    plural: "prestadores de productos y servicios",
    singularCorto: "prestador",
    pluralCorto: "prestadores",
    genero: "m",
    tituloVacio:
      "Todavía no hay prestadores de productos y servicios publicados en el directorio",
    permiteVista: false,
  },
  {
    key: "financieras",
    etiqueta: "Entidades financieras",
    Icono: Landmark,
    esquema: "violet",
    singular: "entidad financiera",
    plural: "entidades financieras",
    genero: "f",
    tituloVacio:
      "Todavía no hay entidades financieras publicadas en el directorio",
    permiteVista: true,
  },
  {
    key: "educativas",
    etiqueta: "Entidades educativas",
    Icono: GraduationCap,
    esquema: "amber",
    singular: "entidad educativa",
    plural: "entidades educativas",
    genero: "f",
    tituloVacio:
      "Todavía no hay entidades educativas publicadas en el directorio",
    permiteVista: true,
  },
  {
    key: "cooperativas",
    etiqueta: "Cooperativas",
    Icono: HeartHandshake,
    esquema: "teal",
    singular: "cooperativa",
    plural: "cooperativas",
    genero: "f",
    tituloVacio: "Todavía no hay cooperativas publicadas en el directorio",
    permiteVista: true,
  },
];

/** Rótulo completo según el conteo ("1 prestador de productos y servicios"). */
const rotulo = (tab: ConfigTab, n: number) => (n === 1 ? tab.singular : tab.plural);

/** Rótulo breve, sólo para los slots que truncan. */
const rotuloCorto = (tab: ConfigTab, n: number) =>
  n === 1 ? (tab.singularCorto ?? tab.singular) : (tab.pluralCorto ?? tab.plural);

// Mapas de clases estáticas por esquema (nunca interpolar colores en Tailwind).
const ESTILOS_TAB_ACTIVA: Record<Esquema, string> = {
  blue: "bg-white text-blue-700 shadow-sm border border-slate-200",
  emerald: "bg-white text-emerald-700 shadow-sm border border-slate-200",
  violet: "bg-white text-violet-700 shadow-sm border border-slate-200",
  amber: "bg-white text-amber-700 shadow-sm border border-slate-200",
  teal: "bg-white text-teal-700 shadow-sm border border-slate-200",
};

const ESTILOS_VISTA_ACTIVA: Record<Esquema, string> = {
  blue: "bg-white text-blue-600 shadow-sm",
  emerald: "bg-white text-emerald-600 shadow-sm",
  violet: "bg-white text-violet-600 shadow-sm",
  amber: "bg-white text-amber-600 shadow-sm",
  teal: "bg-white text-teal-600 shadow-sm",
};

const ESTILOS_VACIO: Record<
  Esquema,
  { circulo: string; icono: string; boton: string }
> = {
  blue: {
    circulo: "bg-blue-50 border-blue-100",
    icono: "text-blue-300",
    boton: "bg-primary hover:bg-blue-800",
  },
  emerald: {
    circulo: "bg-emerald-50 border-emerald-100",
    icono: "text-emerald-400",
    boton: "bg-emerald-700 hover:bg-emerald-800",
  },
  violet: {
    circulo: "bg-violet-50 border-violet-100",
    icono: "text-violet-400",
    boton: "bg-violet-700 hover:bg-violet-800",
  },
  amber: {
    circulo: "bg-amber-50 border-amber-100",
    icono: "text-amber-400",
    boton: "bg-amber-600 hover:bg-amber-700",
  },
  teal: {
    circulo: "bg-teal-50 border-teal-100",
    icono: "text-teal-400",
    boton: "bg-teal-700 hover:bg-teal-800",
  },
};

// Variants de entrada del hero (stagger sutil).
const heroContenedor: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

interface DirectorioClienteProps {
  empresas: Entidad[];
  prestadores: Entidad[];
  financieras: Entidad[];
  educativas: Entidad[];
  cooperativas: Entidad[];
}

export function DirectorioCliente({
  empresas,
  prestadores,
  financieras,
  educativas,
  cooperativas,
}: DirectorioClienteProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const datosPorTab: Record<TabKey, Entidad[]> = {
    empresas,
    prestadores,
    financieras,
    educativas,
    cooperativas,
  };

  // La URL es la fuente de verdad del tab activo (evita sincronizar estado en
  // un effect). Cambiar de tab navega y el componente re-renderiza.
  const tabParam = searchParams.get("tab");
  const tabActiva: ConfigTab =
    TABS.find((t) => t.key === tabParam) ?? TABS[0];

  // Shared filter state. searchTerm se inicializa desde ?q= para que el cuadro
  // de búsqueda de Google (SearchAction) lleve directo al término buscado.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Parallax sutil de posición del fondo del hero. Nunca tocamos la opacidad:
  // el fondo tiene que ser estable siempre (bug previo: fundía a blanco).
  const { scrollY } = useScroll();
  const fondoY = useTransform(scrollY, [0, 700], [0, 110]);

  // Reset filters on tab change
  const handleTabChange = (key: TabKey) => {
    setSearchTerm("");
    setCategoriaSeleccionada(null);
    const url = key === "empresas" ? "/directorio" : `/directorio?tab=${key}`;
    router.replace(url, { scroll: false });
  };

  // Scroll suave desde el buscador del hero hasta la zona de resultados.
  const scrollAResultados = () => {
    document
      .querySelector('[data-tour="directorio-toolbar"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const manejarBusquedaHero = (valor: string) => {
    const empezoAEscribir = searchTerm === "" && valor.trim() !== "";
    setSearchTerm(valor);
    if (empezoAEscribir) scrollAResultados();
  };

  const entidadesActivas = datosPorTab[tabActiva.key];

  const categoriasActivas = useMemo(() => {
    return Array.from(new Set(entidadesActivas.map((e) => e.categoria)))
      .filter(Boolean)
      .sort();
  }, [entidadesActivas]);

  const entidadesFiltradas = useMemo(() => {
    return entidadesActivas.filter((e) => {
      const matchCategoria = categoriaSeleccionada
        ? e.categoria === categoriaSeleccionada
        : true;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        term === "" ||
        e.nombre.toLowerCase().includes(term) ||
        e.descripcionCorta.toLowerCase().includes(term) ||
        e.servicios.some((s: string) => s.toLowerCase().includes(term)) ||
        e.tags.some((t: string) => t.toLowerCase().includes(term)) ||
        (e.certificaciones ?? []).some((c) => c.etiqueta.toLowerCase().includes(term));
      return matchCategoria && matchSearch;
    });
  }, [entidadesActivas, categoriaSeleccionada, searchTerm]);

  const effectiveViewMode = tabActiva.permiteVista ? viewMode : "list";
  const colorAccent = tabActiva.esquema;
  const basePath = "/empresas";

  const hayFiltrosActivos = searchTerm !== "" || categoriaSeleccionada !== null;
  const estilosVacio = ESTILOS_VACIO[colorAccent];
  const IconoTab = tabActiva.Icono;

  // Counts por categoría para el hero y la barra de stats (solo > 0).
  const conteos = TABS.map((tab) => ({
    tab,
    count: datosPorTab[tab.key].length,
  })).filter((c) => c.count > 0);

  const totalEntidades = TABS.reduce(
    (acc, tab) => acc + datosPorTab[tab.key].length,
    0
  );

  const resumenConteos =
    conteos
      .map(({ tab, count }) => `${count} ${rotulo(tab, count)}`)
      .join(" · ") || "Sin organizaciones publicadas";

  const sufijoEncontrado = `encontrad${tabActiva.genero === "f" ? "a" : "o"}${
    entidadesFiltradas.length === 1 ? "" : "s"
  }`;

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-20">
      {/* ─── Hero Header ─── */}
      <div
        data-tour="directorio-hero"
        className="relative overflow-hidden -mt-24 pt-32 pb-16 mb-8 bg-[#00182e]"
      >
        {/* Fondo estable: gradiente profundo + textura industrial con opacidad
            FIJA + grilla fina + orbes de profundidad. Solo parallax de posición,
            jamás fade de opacidad (el fondo nunca se funde a blanco). */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-[#00182e] via-[#041d33] to-[#0a2540]" />

          <motion.div
            style={{ y: fondoY }}
            className="absolute -top-[14%] -bottom-[14%] left-0 right-0"
          >
            <Image
              src="/landing/hero-industrial.webp"
              alt=""
              fill
              className="object-cover object-center opacity-[0.16] mix-blend-luminosity"
              priority
            />
          </motion.div>

          {/* Veladura para integrar la textura con el gradiente */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00182e]/60 via-transparent to-[#0a2540]/80" />

          {/* Grilla fina sutil */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* Orbes difusos de profundidad */}
          <div className="absolute -top-24 right-[4%] w-[30rem] h-[30rem] rounded-full bg-blue-500/15 blur-[130px]" />
          <div className="absolute -bottom-36 -left-28 w-[28rem] h-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[24rem] h-[24rem] rounded-full bg-[#1a6496]/25 blur-[110px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            variants={heroContenedor}
            initial={false}
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              variants={heroItem}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-4 py-1.5 mb-5 shadow-xl"
            >
              <LockOpen className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                Directorio público UIAB
              </span>
            </motion.div>

            {/* Buscador protagonista */}
            <motion.div
              variants={heroItem}
              className="relative w-full max-w-2xl mx-auto group"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400/30 via-cyan-300/25 to-blue-400/30 blur-md opacity-60 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3 bg-white rounded-xl shadow-2xl shadow-[#00182e]/40 px-4 sm:px-5 ring-1 ring-white/40">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(ev) => manejarBusquedaHero(ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault();
                      scrollAResultados();
                    }
                  }}
                  placeholder="Buscá por empresa, rubro o especialidad…"
                  aria-label="Buscar en el directorio"
                  className="w-full bg-transparent py-4 sm:py-[18px] text-slate-800 placeholder:text-slate-400 font-medium text-sm sm:text-base focus:outline-none"
                />
                <kbd className="hidden md:inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 shrink-0">
                  Enter
                </kbd>
              </div>
            </motion.div>

            {/* Chips-tab por categoría (fusionan navegación + conteos) */}
            <motion.div
              variants={heroItem}
              className="flex flex-wrap justify-center gap-2 sm:gap-2.5 mt-6"
            >
              {TABS.map((tab) => {
                const activa = tab.key === tabActiva.key;
                const count = datosPorTab[tab.key].length;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={
                      activa
                        ? "inline-flex items-center gap-2 bg-white text-[#00213f] border border-white rounded-full px-4 py-2 shadow-lg shadow-blue-900/30 transition-all"
                        : "inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-md border border-white/15 text-blue-100 rounded-full px-4 py-2 hover:bg-white/[0.16] hover:border-white/30 transition-all"
                    }
                  >
                    <tab.Icono
                      className={
                        activa
                          ? "w-4 h-4 text-[#00213f]"
                          : "w-4 h-4 text-blue-200"
                      }
                    />
                    {/* Rótulo fijo (no singulariza por conteo): el chip tiene que
                        decir lo mismo que su pestaña de más abajo. */}
                    <span className="text-xs font-bold whitespace-nowrap">
                      {tab.etiqueta}
                    </span>
                    <span
                      className={
                        activa
                          ? "font-manrope text-xs font-black bg-[#00213f] text-white rounded-full px-1.5 py-0.5 min-w-[22px]"
                          : "font-manrope text-xs font-black bg-white/10 text-white rounded-full px-1.5 py-0.5 min-w-[22px]"
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            <motion.div
              variants={heroItem}
              className="flex flex-wrap justify-center gap-3 mt-6"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 bg-white text-[#00213f] px-6 py-3 rounded-lg font-manrope font-extrabold text-sm shadow-xl hover:bg-blue-50 hover:-translate-y-0.5 transition-all"
              >
                Sumá tu organización
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/25 text-white px-6 py-3 rounded-lg font-manrope font-bold text-sm hover:bg-white/15 hover:border-white/50 transition-all"
              >
                Conocé la UIAB
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Dashboard Value Bar */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          data-tour="directorio-stats"
          className="bg-white rounded-2xl p-6 shadow-xl shadow-primary/5 border border-slate-200/60 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden -mt-10 z-20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-manrope text-xl font-bold text-slate-800">
                Directorio Activo
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {resumenConteos}
              </p>
            </div>
          </div>

          <div className="flex gap-6 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                Contactos directos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                Perfiles verificados
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── Tabs ─── */}
        <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-max">
            {TABS.map((tab) => {
              const activa = tab.key === tabActiva.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                    activa
                      ? ESTILOS_TAB_ACTIVA[tab.esquema]
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <tab.Icono className="w-4 h-4" />
                  {tab.etiqueta}
                  {tab.badge && (
                    <span className="ml-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                      {tab.badge}
                    </span>
                  )}
                  <span className="ml-1 text-xs font-black text-slate-400">
                    {datosPorTab[tab.key].length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Sidebar */}
          <aside data-tour="directorio-sidebar" className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
            <FilterSidebar
              categorias={categoriasActivas}
              categoriaSeleccionada={categoriaSeleccionada}
              onCategoriaChange={setCategoriaSeleccionada}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              colorScheme={colorAccent}
            />
          </aside>

          {/* Main Grid */}
          <main className="w-full lg:w-9/12 xl:w-3/4">
            {/* Toolbar */}
            <div data-tour="directorio-toolbar" className="mb-8 scroll-mt-28 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h3 className="font-manrope text-lg font-bold text-slate-800">
                  {entidadesFiltradas.length}{" "}
                  {rotulo(tabActiva, entidadesFiltradas.length)} {sufijoEncontrado}
                </h3>
              </div>

              {tabActiva.permiteVista && (
                <div data-tour="directorio-vista" className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Vista:
                  </span>
                  <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-all ${
                        effectiveViewMode === "grid"
                          ? ESTILOS_VISTA_ACTIVA[colorAccent]
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-all ${
                        effectiveViewMode === "list"
                          ? ESTILOS_VISTA_ACTIVA[colorAccent]
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {entidadesFiltradas.length > 0 ? (
              <div
                key={`${effectiveViewMode}-${tabActiva.key}`}
                data-tour="directorio-resultados"
                className={
                  effectiveViewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_32px_-12px_rgba(15,23,42,0.08)] overflow-hidden divide-y divide-slate-200/70"
                }
              >
                {entidadesFiltradas.map((entidad) => (
                  <DirectoryProfileCard
                    key={entidad.id}
                    entidad={entidad}
                    basePath={basePath}
                    variant={effectiveViewMode}
                    colorScheme={colorAccent}
                  />
                ))}
              </div>
            ) : entidadesActivas.length === 0 && !hayFiltrosActivos ? (
              /* Empty state invitacional: la pestaña todavía no tiene entidades */
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-slate-200 shadow-sm"
              >
                <div
                  className={`w-24 h-24 ${estilosVacio.circulo} rounded-full flex items-center justify-center mx-auto mb-6 border`}
                >
                  <IconoTab className={`w-10 h-10 ${estilosVacio.icono}`} />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">
                  {tabActiva.tituloVacio}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  ¿Todavía no estás en el directorio? Creá tu cuenta y sumá tu
                  organización a la red UIAB.
                </p>
                <Link
                  href="/register"
                  className={`inline-flex items-center gap-2 ${estilosVacio.boton} text-white px-8 py-3.5 rounded-lg font-bold shadow-lg transition-all uppercase tracking-widest text-xs`}
                >
                  Sumá tu organización
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : (
              /* Sin resultados con filtros activos */
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-slate-200 shadow-sm"
              >
                <div
                  className={`w-24 h-24 ${estilosVacio.circulo} rounded-full flex items-center justify-center mx-auto mb-6 border`}
                >
                  <IconoTab className={`w-10 h-10 ${estilosVacio.icono}`} />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">
                  No se encontraron {tabActiva.plural}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  Probá ajustando los filtros o ingresando otro término de
                  búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoriaSeleccionada(null);
                  }}
                  className={`${estilosVacio.boton} text-white px-8 py-3.5 rounded-lg font-bold shadow-lg transition-all uppercase tracking-widest text-xs`}
                >
                  Restablecer
                </button>
              </motion.div>
            )}
          </main>
        </div>

        {/* ─── CTA Sumate ─── */}
        <section className="mt-24">
          {/* Borde luminoso: wrapper con gradiente + panel interno oscuro */}
          <div className="relative rounded-[2rem] p-px bg-gradient-to-br from-blue-300/40 via-white/10 to-blue-500/25 shadow-2xl shadow-[#00213f]/25">
            <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-gradient-to-br from-[#00213f] via-[#062c4e] to-[#10375c]">
              {/* Fondo: grilla fina + glows, misma familia visual que el hero */}
              <div className="absolute inset-0" aria-hidden="true">
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                  }}
                />
                <div className="absolute -top-40 right-[12%] w-[26rem] h-[26rem] bg-blue-400/15 rounded-full blur-[110px]" />
                <div className="absolute -bottom-32 -left-24 w-[22rem] h-[22rem] bg-cyan-400/10 rounded-full blur-[100px]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>

              <div className="relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center px-6 py-14 sm:px-12 md:px-14 lg:py-16">
                {/* Columna texto (asimétrica: más ancha) */}
                <div className="lg:col-span-7">
                  <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-xs font-bold text-white tracking-widest uppercase">
                    <HeartHandshake className="w-4 h-4 text-blue-300" />
                    Red UIAB
                  </span>

                  <h2 className="font-manrope text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-4">
                    ¿Tu organización todavía no{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-100 to-white">
                      aparece en el directorio?
                    </span>
                  </h2>

                  <p className="text-blue-100/80 text-base md:text-lg font-medium leading-relaxed mb-8">
                    Sumate a la red de la Unión Industrial de Almirante Brown:
                    empresas, prestadores, entidades financieras y educativas, y
                    cooperativas. Creá tu cuenta y publicá tu perfil verificado.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/register"
                      className="group inline-flex items-center gap-2 bg-white text-[#00213f] px-7 py-3.5 rounded-lg font-manrope font-extrabold text-sm shadow-xl hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(147,197,253,0.45)] transition-all"
                    >
                      Sumá tu organización
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/contacto"
                      className="inline-flex items-center gap-2 bg-white/5 border border-white/25 text-white px-7 py-3.5 rounded-lg font-manrope font-bold text-sm hover:bg-white/15 hover:border-white/50 transition-all"
                    >
                      Hablá con la UIAB
                    </Link>
                  </div>
                </div>

                {/* Columna mini-stats de la red (counts reales) */}
                <div className="lg:col-span-5">
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-xl shadow-[#00182e]/30 lg:-rotate-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-300" />
                      <span className="text-[10px] font-black text-blue-200/80 uppercase tracking-widest">
                        La red hoy
                      </span>
                    </div>
                    <p className="font-manrope text-5xl font-black text-white leading-none">
                      {totalEntidades}
                    </p>
                    <p className="text-sm font-semibold text-blue-100/70 mt-1">
                      organizaciones publicadas
                    </p>
                  </div>

                  {conteos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-4 lg:pl-6">
                      {conteos.slice(0, 4).map(({ tab, count }) => (
                        <div
                          key={tab.key}
                          className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3"
                        >
                          <tab.Icono className="w-4 h-4 text-blue-300 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-manrope text-lg font-black text-white leading-none">
                              {count}
                            </p>
                            <p className="text-[11px] font-semibold text-blue-100/60 truncate first-letter:uppercase">
                              {rotuloCorto(tab, count)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
