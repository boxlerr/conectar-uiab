"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Entidad } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import {
  Building2,
  Wrench,
  LayoutGrid,
  List,
  CheckCircle2,
  LockOpen,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

type Tab = "empresas" | "prestadores";

interface DirectorioClienteProps {
  empresas: Entidad[];
  prestadores: Entidad[];
}

export function DirectorioCliente({ empresas, prestadores }: DirectorioClienteProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // La URL es la fuente de verdad del tab activo (evita sincronizar estado en
  // un effect). Cambiar de tab navega y el componente re-renderiza.
  const tabParam = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = tabParam === "prestadores" ? "prestadores" : "empresas";

  // Shared filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "50%"]);
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Reset filters on tab change
  const handleTabChange = (tab: Tab) => {
    setSearchTerm("");
    setCategoriaSeleccionada(null);
    const url = tab === "prestadores" ? "/directorio?tab=prestadores" : "/directorio";
    router.replace(url, { scroll: false });
  };

  const entidadesActivas = useMemo(() => {
    return activeTab === "empresas" ? empresas : prestadores;
  }, [activeTab, empresas, prestadores]);

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
        e.servicios.some((s: string) => s.toLowerCase().includes(term));
      return matchCategoria && matchSearch;
    });
  }, [entidadesActivas, categoriaSeleccionada, searchTerm]);

  const isEmpresas = activeTab === "empresas";
  const effectiveViewMode = isEmpresas ? viewMode : "list";
  const colorAccent = isEmpresas ? "blue" : "emerald";
  const basePath = "/empresas";

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-20">
      {/* ─── Hero Header ─── */}
      <div data-tour="directorio-hero" className="relative h-[48vh] min-h-[460px] flex items-center justify-center overflow-hidden -mt-24 pt-44 pb-24 mb-16">
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/landing/hero-industrial.png"
            alt="Directorio UIAB"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/80 to-[#10375c]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] to-transparent opacity-90" />
        </motion.div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-12 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded border border-white/20 px-3 py-1.5 mb-6 shadow-xl">
              <LockOpen className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                Directorio público UIAB
              </span>
            </div>

            <h1 className="font-manrope text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-xl">
              Directorio UIAB <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                Verificado
              </span>
            </h1>

            <p className="text-blue-100/80 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Accedé al ecosistema completo: empresas socias UIAB y prestadores de
              productos y servicios (no socios) verificados de la red.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Dashboard Value Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          data-tour="directorio-stats"
          className="bg-white rounded-2xl p-6 shadow-xl shadow-primary/5 border border-slate-200/60 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden -mt-24 z-20"
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
                {empresas.length} empresas · {prestadores.length} prestadores
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
        <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => handleTabChange("empresas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "empresas"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresas socias
            <span className="ml-1 text-xs font-black text-slate-400">
              {empresas.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("prestadores")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "prestadores"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Prestadores de productos y servicios
            <span className="ml-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              No socios
            </span>
            <span className="ml-1 text-xs font-black text-slate-400">
              {prestadores.length}
            </span>
          </button>
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
            <div data-tour="directorio-toolbar" className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h3 className="font-manrope text-lg font-bold text-slate-800">
                  {entidadesFiltradas.length}{" "}
                  {isEmpresas ? "empresas" : "prestadores"} encontrados
                </h3>
              </div>

              {isEmpresas && (
                <div data-tour="directorio-vista" className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Vista:
                  </span>
                  <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-all ${
                        effectiveViewMode === "grid"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-all ${
                        effectiveViewMode === "list"
                          ? "bg-white text-blue-600 shadow-sm"
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
                key={`${effectiveViewMode}-${activeTab}`}
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
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-slate-200 shadow-sm"
              >
                <div
                  className={`w-24 h-24 ${isEmpresas ? "bg-blue-50 border-blue-100" : "bg-emerald-50 border-emerald-100"} rounded-full flex items-center justify-center mx-auto mb-6 border`}
                >
                  {isEmpresas ? (
                    <Building2
                      className={`w-10 h-10 ${isEmpresas ? "text-blue-300" : "text-emerald-400"}`}
                    />
                  ) : (
                    <Wrench className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">
                  No se encontraron{" "}
                  {isEmpresas ? "empresas" : "prestadores"}
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
                  className={`${isEmpresas ? "bg-primary hover:bg-blue-800" : "bg-emerald-700 hover:bg-emerald-800"} text-white px-8 py-3.5 rounded-lg font-bold shadow-lg transition-all uppercase tracking-widest text-xs`}
                >
                  Restablecer
                </button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
