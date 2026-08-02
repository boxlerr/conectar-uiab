"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Entidad } from "@/lib/datos/directorio";
import {
  TIPOS_ENTIDAD,
  TIPOS_ENTIDAD_META,
  parseTipoEntidad,
  type TipoEntidad,
} from "@/lib/datos/tipos-entidad";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { SliderLogosDirectorio, type LogoDirectorio } from "@/components/ui/directorio/slider-logos-directorio";
import { SelectUIAB } from "@/components/ui/select-uiab";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
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
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import Image from "next/image";

/** Criterio del control "Ordenar por". `sugerido` = orden justo que llega del SSR. */
type Orden = "sugerido" | "az" | "za" | "certificaciones";

const OPCIONES_ORDEN: { valor: Orden; etiqueta: string }[] = [
  { valor: "sugerido", etiqueta: "Sugerido" },
  { valor: "az", etiqueta: "A–Z" },
  { valor: "za", etiqueta: "Z–A" },
  { valor: "certificaciones", etiqueta: "Con certificaciones primero" },
];

/** Íconos por tipo. Viven acá y no en el meta compartido para no arrastrar
    lucide a los módulos que importa el servidor. */
const ICONO_TIPO: Record<TipoEntidad, LucideIcon> = {
  empresa: Building2,
  prestador: Wrench,
  financiera: Landmark,
  educativa: GraduationCap,
  cooperativa: HeartHandshake,
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
  /** Directorio unificado: todos los tipos en una sola lista. */
  entidades: Entidad[];
}

export function DirectorioCliente({ entidades }: DirectorioClienteProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  // Logos para el slider: vienen del SSR (ya tienen logoUrl), así que se
  // muestran al instante, sin fetch client-side ni skeleton colgado. Sólo
  // socias: los prestadores particulares no tienen logo institucional.
  // La UIAB sale del slider por el mismo motivo que en la home: creó la
  // plataforma, no es una socia participante. Su ficha sigue viva igual.
  const logosSocias: LogoDirectorio[] = entidades
    .filter((e) => !!e.logoUrl && e.esSocio !== false && !esEmpresaInstitucional(e.id))
    .map((e) => ({ slug: e.slug, nombre: e.nombre, logoUrl: e.logoUrl as string }));

  // La URL manda sobre el tipo activo: así `/directorio?tipo=financiera` es un
  // link compartible y los viejos `?tab=prestadores` siguen funcionando.
  const tipoSeleccionado = parseTipoEntidad(
    searchParams.get("tipo") ?? searchParams.get("tab")
  );

  // searchTerm se inicializa desde ?q= para que el cuadro de búsqueda de Google
  // (SearchAction) lleve directo al término buscado.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [orden, setOrden] = useState<Orden>("sugerido");

  // Parallax sutil de posición del fondo del hero. Nunca tocamos la opacidad:
  // el fondo tiene que ser estable siempre (bug previo: fundía a blanco).
  const { scrollY } = useScroll();
  const fondoY = useTransform(scrollY, [0, 700], [0, 110]);

  /**
   * Cambiar el tipo NO borra lo que escribiste: la búsqueda corre sobre todo el
   * directorio y el tipo sólo la acota. Sí se resetea el sector, porque el
   * listado de sectores depende del tipo elegido.
   */
  const handleTipoChange = (tipo: TipoEntidad | null) => {
    setCategoriaSeleccionada(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab"); // el alias viejo no debe pisar al nuevo
    if (tipo) params.set("tipo", tipo);
    else params.delete("tipo");
    const qs = params.toString();
    router.replace(qs ? `/directorio?${qs}` : "/directorio", { scroll: false });
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

  // Conteos por tipo sobre el total (no sobre lo filtrado): el facet tiene que
  // mostrar cuántas hay de cada tipo aunque estés viendo otro.
  const conteosPorTipo = useMemo(() => {
    const mapa = new Map<TipoEntidad, number>();
    for (const e of entidades) {
      const t = e.tipoEntidad ?? "empresa";
      mapa.set(t, (mapa.get(t) ?? 0) + 1);
    }
    return TIPOS_ENTIDAD.map((tipo) => ({ tipo, count: mapa.get(tipo) ?? 0 })).filter(
      (c) => c.count > 0
    );
  }, [entidades]);

  // Universo sobre el que se ofrecen sectores y se filtra: todo el directorio,
  // o sólo el tipo elegido.
  const entidadesDelTipo = useMemo(
    () =>
      tipoSeleccionado
        ? entidades.filter((e) => (e.tipoEntidad ?? "empresa") === tipoSeleccionado)
        : entidades,
    [entidades, tipoSeleccionado]
  );

  // Sectores filtrables: la categoría principal + las secundarias de cada
  // entidad (pedido reunión 2-jul: poder buscar/filtrar por sector).
  const categoriasActivas = useMemo(() => {
    return Array.from(
      new Set(entidadesDelTipo.flatMap((e) => [e.categoria, ...e.servicios]))
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [entidadesDelTipo]);

  const entidadesFiltradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return entidadesDelTipo.filter((e) => {
      // El sector elegido matchea la categoría principal O cualquier secundaria.
      const matchCategoria = categoriaSeleccionada
        ? e.categoria === categoriaSeleccionada ||
          e.servicios.includes(categoriaSeleccionada)
        : true;
      const matchSearch =
        term === "" ||
        e.nombre.toLowerCase().includes(term) ||
        e.categoria.toLowerCase().includes(term) ||
        e.descripcionCorta.toLowerCase().includes(term) ||
        e.ubicacion.toLowerCase().includes(term) ||
        e.servicios.some((s: string) => s.toLowerCase().includes(term)) ||
        e.tags.some((t: string) => t.toLowerCase().includes(term)) ||
        (e.certificaciones ?? []).some((c) => c.etiqueta.toLowerCase().includes(term));
      return matchCategoria && matchSearch;
    });
  }, [entidadesDelTipo, categoriaSeleccionada, searchTerm]);

  // Orden aplicado DESPUÉS del filtrado, sobre una copia (nunca mutamos props).
  // `sugerido` devuelve tal cual el orden justo del SSR. Para "con
  // certificaciones primero" agrupamos ese subconjunto adelante y, como
  // Array.sort es estable, dentro de cada grupo se respeta el orden sugerido.
  const entidadesOrdenadas = useMemo(() => {
    if (orden === "sugerido") return entidadesFiltradas;
    const copia = entidadesFiltradas.slice();
    const porNombre = (a: Entidad, b: Entidad) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    const tieneCerts = (e: Entidad) => ((e.certificaciones?.length ?? 0) > 0 ? 1 : 0);
    switch (orden) {
      case "az":
        return copia.sort(porNombre);
      case "za":
        return copia.sort((a, b) => porNombre(b, a));
      case "certificaciones":
        return copia.sort((a, b) => tieneCerts(b) - tieneCerts(a));
      default:
        return copia;
    }
  }, [entidadesFiltradas, orden]);

  const basePath = "/empresas";
  const hayFiltrosActivos =
    searchTerm !== "" || categoriaSeleccionada !== null || tipoSeleccionado !== null;

  const metaTipo = tipoSeleccionado ? TIPOS_ENTIDAD_META[tipoSeleccionado] : null;
  const n = entidadesFiltradas.length;

  // "3 empresas socias encontradas" / "58 organizaciones encontradas".
  const rotuloResultados = metaTipo
    ? `${n === 1 ? metaTipo.singular : metaTipo.plural} encontrad${
        metaTipo.genero === "f" ? "a" : "o"
      }${n === 1 ? "" : "s"}`
    : `${n === 1 ? "organización" : "organizaciones"} encontrada${n === 1 ? "" : "s"}`;

  const limpiarFiltros = () => {
    setSearchTerm("");
    setCategoriaSeleccionada(null);
    if (tipoSeleccionado) handleTipoChange(null);
  };

  return (
    // svh y no vh: en Safari iOS vh cuenta la barra de direcciones y la página
    // termina cortada. Nunca dvh, que hace reflow mientras la barra entra/sale.
    <div className="min-h-svh bg-[#f7f9fb] font-inter pb-20">
      {/* ─── Hero Header ───
          El margen negativo compensa el spacer del header (h-20 lg:h-24), así
          que tiene que escalar igual que él: -20 abajo de lg, -24 arriba. */}
      <div
        data-tour="directorio-hero"
        className="relative overflow-hidden -mt-20 lg:-mt-24 pt-28 lg:pt-32 pb-16 mb-8 bg-[#00182e]"
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

            <motion.h1
              variants={heroItem}
              className="font-manrope text-2xl sm:text-3xl font-black text-white tracking-tight mb-2"
            >
              Toda la red UIAB, en un solo buscador
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-blue-100/80 text-sm sm:text-base font-medium max-w-xl mx-auto mb-6"
            >
              Empresas socias, prestadores, entidades financieras y educativas y
              cooperativas de Almirante Brown. Buscá una vez y contactá directo.
            </motion.p>

            {/* Buscador protagonista */}
            <motion.div
              variants={heroItem}
              className="relative w-full max-w-2xl mx-auto group"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400/30 via-cyan-300/25 to-blue-400/30 blur-md opacity-60 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3 bg-white rounded-xl shadow-2xl shadow-[#00182e]/40 px-4 sm:px-5 ring-1 ring-white/40">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                {/* text-base fijo: con menos de 16px Safari iOS hace zoom al
                    enfocar el campo y deja el hero corrido. */}
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
                  placeholder="Buscá una empresa, un banco, un rubro o una especialidad…"
                  aria-label="Buscar en todo el directorio"
                  className="w-full bg-transparent py-4 sm:py-[18px] text-slate-800 placeholder:text-slate-400 font-medium text-base focus:outline-none"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Borrar la búsqueda"
                    className="shrink-0 p-2.5 -mr-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="hidden md:inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 shrink-0">
                    Enter
                  </kbd>
                )}
              </div>
            </motion.div>

            {/* CTAs solo para visitantes: si ya estás logueado no tienen sentido. */}
            {!currentUser && (
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
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Slider de logos de las empresas de la red. */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          data-tour="directorio-stats"
          className="bg-white rounded-2xl py-5 shadow-xl shadow-primary/5 border border-slate-200/60 mb-8 relative overflow-hidden -mt-10 z-20"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-6 mb-4">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Empresas de la red UIAB
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Contactos directos
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Perfiles verificados
              </span>
            </div>
          </div>
          <SliderLogosDirectorio logos={logosSocias} />
        </motion.div>

        {/* A partir de tab: (720px, cubre iPad mini) los filtros pasan a ser un
            rail angosto y pegajoso en vez de un bloque arriba de la grilla. */}
        <div className="flex flex-col tab:flex-row gap-8 tab:gap-6 lg:gap-14">
          {/* Sidebar */}
          <aside
            data-tour="directorio-sidebar"
            className="w-full tab:w-52 md:w-60 lg:w-3/12 xl:w-1/4 shrink-0 tab:sticky tab:top-24 tab:self-start"
          >
            <FilterSidebar
              categorias={categoriasActivas}
              categoriaSeleccionada={categoriaSeleccionada}
              onCategoriaChange={setCategoriaSeleccionada}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              colorScheme="blue"
              tipos={conteosPorTipo}
              tipoSeleccionado={tipoSeleccionado}
              onTipoChange={handleTipoChange}
              totalTipos={entidades.length}
            />
          </aside>

          {/* Main Grid */}
          <main className="w-full tab:flex-1 tab:min-w-0 lg:w-9/12 xl:w-3/4">
            {/* Toolbar */}
            <div data-tour="directorio-toolbar" className="mb-6 scroll-mt-28 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h2 className="font-manrope text-lg font-bold text-slate-800">
                  {n} {rotuloResultados}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                {/* Ordenar por: el usuario elige; "Sugerido" respeta el orden
                    justo (shuffle diario) que trae el SSR. */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="orden-directorio"
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0"
                  >
                    Ordenar por:
                  </label>
                  <SelectUIAB
                    id="orden-directorio"
                    ariaLabel="Ordenar por"
                    value={orden}
                    onValueChange={(v) => setOrden(v as Orden)}
                    options={OPCIONES_ORDEN.map((o) => ({ value: o.valor, label: o.etiqueta }))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-bold text-slate-700"
                  />
                </div>

                <div data-tour="directorio-vista" className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Vista:
                  </span>
                  <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      aria-label="Vista en grilla"
                      aria-pressed={viewMode === "grid"}
                      className={`flex h-11 w-11 items-center justify-center rounded-md transition-all lg:h-9 lg:w-9 ${
                        viewMode === "grid"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      aria-label="Vista en lista"
                      aria-pressed={viewMode === "list"}
                      className={`flex h-11 w-11 items-center justify-center rounded-md transition-all lg:h-9 lg:w-9 ${
                        viewMode === "list"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros activos: se ven y se sacan de a uno. Sin esto, un filtro
                de tipo puesto desde la barra lateral queda invisible al
                scrollear y parece que faltan empresas. */}
            {hayFiltrosActivos && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                  Filtros:
                </span>
                {metaTipo && (
                  <ChipFiltro
                    etiqueta={metaTipo.etiqueta}
                    onQuitar={() => handleTipoChange(null)}
                  />
                )}
                {categoriaSeleccionada && (
                  <ChipFiltro
                    etiqueta={categoriaSeleccionada}
                    onQuitar={() => setCategoriaSeleccionada(null)}
                  />
                )}
                {searchTerm && (
                  <ChipFiltro
                    etiqueta={`“${searchTerm}”`}
                    onQuitar={() => setSearchTerm("")}
                    /* Tal cual lo escribió: capitalizarlo confunde. */
                    respetarMayusculas
                  />
                )}
                <button
                  onClick={limpiarFiltros}
                  className="text-[12px] font-bold text-slate-500 hover:text-[#10375c] underline underline-offset-2 ml-1"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Results */}
            {n > 0 ? (
              <div
                key={viewMode}
                data-tour="directorio-resultados"
                className={
                  viewMode === "grid"
                    ? // sin sm:grid-cols-2: con el rail de filtros al costado el
                      // main queda en ~460px y dos columnas no entran.
                      "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_32px_-12px_rgba(15,23,42,0.08)] overflow-hidden divide-y divide-slate-200/70"
                }
              >
                {entidadesOrdenadas.map((entidad) => (
                  <DirectoryProfileCard
                    key={entidad.id}
                    entidad={entidad}
                    basePath={basePath}
                    variant={viewMode}
                    colorScheme="blue"
                  />
                ))}
              </div>
            ) : entidades.length === 0 ? (
              /* Empty state invitacional: el directorio todavía no tiene nada */
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-slate-200 shadow-sm"
              >
                <div className="w-24 h-24 bg-blue-50 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 border">
                  <Building2 className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">
                  Todavía no hay organizaciones publicadas
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  ¿Todavía no estás en el directorio? Creá tu cuenta y sumá tu
                  organización a la red UIAB.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-8 py-3.5 rounded-lg font-bold shadow-lg transition-all uppercase tracking-widest text-xs"
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
                className="bg-white rounded-2xl p-16 sm:p-20 text-center border border-slate-200 shadow-sm"
              >
                <div className="w-24 h-24 bg-blue-50 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 border">
                  <Search className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">
                  No encontramos organizaciones con esos filtros
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  {tipoSeleccionado
                    ? "Probá buscar en todo el directorio: puede estar cargada con otro tipo de organización."
                    : "Probá con otro término o quitá algún filtro."}
                </p>
                <button
                  onClick={limpiarFiltros}
                  className="bg-primary hover:bg-blue-800 text-white px-8 py-3.5 rounded-lg font-bold shadow-lg transition-all uppercase tracking-widest text-xs"
                >
                  Buscar en todo el directorio
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

              <div className="relative z-10 grid md:grid-cols-12 gap-10 lg:gap-8 items-center px-6 py-14 sm:px-12 md:px-14 lg:py-16">
                {/* Columna texto (asimétrica: más ancha) */}
                <div className="md:col-span-7 lg:col-span-7">
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
                <div className="md:col-span-5 lg:col-span-5">
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-2xl p-6 shadow-xl shadow-[#00182e]/30 lg:-rotate-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-300" />
                      <span className="text-[10px] font-black text-blue-200/80 uppercase tracking-widest">
                        La red hoy
                      </span>
                    </div>
                    <p className="font-manrope text-5xl font-black text-white leading-none">
                      {entidades.length}
                    </p>
                    <p className="text-sm font-semibold text-blue-100/70 mt-1">
                      organizaciones publicadas
                    </p>
                  </div>

                  {conteosPorTipo.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-4 lg:pl-6">
                      {conteosPorTipo.slice(0, 4).map(({ tipo, count }) => {
                        const Icono = ICONO_TIPO[tipo];
                        const meta = TIPOS_ENTIDAD_META[tipo];
                        return (
                          <div
                            key={tipo}
                            className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3"
                          >
                            <Icono className="w-4 h-4 text-blue-300 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-manrope text-lg font-black text-white leading-none">
                                {count}
                              </p>
                              <p className="text-[11px] font-semibold text-blue-100/60 truncate first-letter:uppercase">
                                {count === 1 ? meta.chip : `${meta.chip}s`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
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

/** Chip de filtro activo con su "x" para quitarlo. */
function ChipFiltro({
  etiqueta,
  onQuitar,
  respetarMayusculas = false,
}: {
  etiqueta: string;
  onQuitar: () => void;
  respetarMayusculas?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10375c]/8 border border-[#10375c]/15 pl-3 pr-1.5 py-1 text-[12px] font-bold text-[#10375c]">
      <span
        className={`max-w-[220px] truncate ${respetarMayusculas ? "" : "first-letter:uppercase"}`}
      >
        {etiqueta}
      </span>
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar el filtro ${etiqueta}`}
        className="rounded-full p-0.5 hover:bg-[#10375c]/15 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
