"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Landmark,
  GraduationCap,
  Lock,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";

interface BranchTheme {
  id: string;
  title: string;
  short: string;
  tagline: string;
  icon: React.ElementType;
  href: string;
  ctaLabel: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  glow: string;
  image: string;
  imageAlt: string;
  /** Demo profile shown as anatomy/example */
  demo: {
    badge: string;
    initials: string;
    nombrePlaceholder: string;
    descPlaceholder: string;
    ubicacion: string;
    servicios: string[];
    certificacion: string;
  };
  /** Real category types found in this branch */
  tipos: string[];
}

export function PreviewDirectorio() {
  const { openAuthModal } = useAuth();

  const branches: BranchTheme[] = [
    {
      id: "empresas",
      title: "Empresas y particulares",
      short: "Empresas",
      tagline: "Industria, servicios y profesionales del partido",
      icon: Package,
      href: "/empresas?categoria=proveedores",
      ctaLabel: "Explorar empresas y particulares",
      accent: "#10375c",
      accentSoft: "rgba(16,55,92,0.06)",
      accentInk: "#00213f",
      glow: "rgba(16,55,92,0.18)",
      image: "/landing/hero-industrial.png",
      imageAlt: "Industria en Almirante Brown",
      demo: {
        badge: "Empresa industrial",
        initials: "TE",
        nombrePlaceholder: "Tu Empresa S.A.",
        descPlaceholder:
          "Descripción breve de tu actividad, sector y propuesta de valor para la red industrial UIAB.",
        ubicacion: "Tu localidad · Almirante Brown",
        servicios: ["Sector", "Servicios", "Productos", "Capacidad"],
        certificacion: "ISO 9001",
      },
      tipos: [
        "Metalúrgica",
        "Química",
        "Alimentaria",
        "Automotriz",
        "Logística",
        "Consultoría",
        "Maquinaria",
        "Profesionales independientes",
        "Oficios industriales",
      ],
    },
    {
      id: "educativas",
      title: "Instituciones educativas",
      short: "Educativas",
      tagline: "Centros de formación aliados",
      icon: GraduationCap,
      href: "/instituciones-educativas",
      ctaLabel: "Explorar centros educativos",
      accent: "#6d28d9",
      accentSoft: "rgba(109,40,217,0.06)",
      accentInk: "#4c1d95",
      glow: "rgba(109,40,217,0.18)",
      image: "/landing/instituciones-laboratorio.jpg",
      imageAlt: "Laboratorio de formación técnica",
      demo: {
        badge: "Centro de formación",
        initials: "TI",
        nombrePlaceholder: "Tu Institución Educativa",
        descPlaceholder:
          "Carreras, capacitaciones y vínculos con la industria local. Articulación con empresas socias.",
        ubicacion: "Sede · Almirante Brown",
        servicios: ["Carreras", "Talleres", "Capacitación", "Convenios"],
        certificacion: "Aval UIAB",
      },
      tipos: ["Universidad técnica", "Educación técnica", "Formación profesional"],
    },
    {
      id: "bancarias",
      title: "Instituciones bancarias",
      short: "Bancarias",
      tagline: "Entidades financieras socias",
      icon: Landmark,
      href: "/instituciones-bancarias",
      ctaLabel: "Explorar entidades financieras",
      accent: "#0f766e",
      accentSoft: "rgba(15,118,110,0.07)",
      accentInk: "#134e4a",
      glow: "rgba(15,118,110,0.18)",
      image: "/landing/bancarias-meeting.jpg",
      imageAlt: "Reunión de banca con PyMEs industriales",
      demo: {
        badge: "Entidad financiera",
        initials: "TB",
        nombrePlaceholder: "Tu Banco / Financiera",
        descPlaceholder:
          "Líneas de crédito, asesoría financiera y productos para PyMEs industriales del corredor sur.",
        ubicacion: "Sucursal · Almirante Brown",
        servicios: ["Banca PyME", "Crédito", "Inversión", "Comercio exterior"],
        certificacion: "Convenio UIAB",
      },
      tipos: ["Banca PyME", "Banca corporativa", "Servicios financieros"],
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const active = branches[activeIdx];
  const ActiveIcon = active.icon;

  useEffect(() => {
    if (isHovering) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % branches.length);
    }, 6500);
    return () => clearInterval(id);
  }, [isHovering, branches.length]);

  return (
    <section className="relative pt-6 pb-16 lg:pt-8 lg:pb-24 overflow-hidden bg-[#f7f9fb]">
      {/* Ambient glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(45% 40% at 85% 25%, ${active.glow} 0%, transparent 60%), radial-gradient(40% 35% at 5% 90%, ${active.glow} 0%, transparent 60%)`,
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-7 gap-4">
          <div className="max-w-xl">
            <span className="text-[10.5px] font-bold text-[#10375c] tracking-[0.16em] uppercase mb-2 block">
              Así se ve la red UIAB
            </span>
            <h2
              className="text-[26px] lg:text-[32px] leading-[1.1] font-bold text-[#191c1e] tracking-tight"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Tres ramas, <span className="italic font-light text-[#10375c]">un mismo</span> ecosistema.
            </h2>
            <p className="mt-2 text-[13.5px] text-[#191c1e]/55 leading-relaxed">
              Empresas, centros educativos y entidades financieras conectados en un mismo directorio.
              Mire cómo se vería su perfil dentro de la red.
            </p>
          </div>

          <button
            onClick={openAuthModal}
            className="self-start md:self-end inline-flex items-center gap-2 h-10 px-4 rounded-full font-bold text-[12px] bg-[#00213f] hover:bg-[#10375c] text-white shadow-md shadow-[#00213f]/15 active:scale-[0.98] transition-all shrink-0"
          >
            <Lock className="w-3 h-3" />
            Acceder al directorio
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="relative mb-5 flex flex-wrap gap-1 p-1 bg-white/70 backdrop-blur rounded-full border border-[#191c1e]/6 w-fit mx-auto shadow-sm"
          role="tablist"
        >
          {branches.map((b, i) => {
            const Icon = b.icon;
            const isActive = i === activeIdx;
            return (
              <button
                key={b.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIdx(i)}
                className="relative px-3 sm:px-4 h-9 rounded-full text-[12px] font-bold transition-colors flex items-center gap-1.5 z-10"
                style={{ color: isActive ? "white" : "#191c1e99" }}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-tab-bg"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: b.accent }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{b.title}</span>
                <span className="sm:hidden">{b.short}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Panel */}
        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative rounded-[24px] bg-white/85 backdrop-blur-xl border border-[#191c1e]/6 shadow-[0_24px_60px_-30px_rgba(0,33,63,0.20)] overflow-hidden"
        >
          {/* Auto-advance progress bar */}
          <AnimatePresence mode="wait">
            {!isHovering && (
              <motion.div
                key={`progress-${activeIdx}`}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 6.5, ease: "linear" }}
                className="absolute top-0 left-0 h-[2px] z-20"
                style={{ background: active.accent }}
              />
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-[0.95fr_1.1fr]">
            {/* LEFT — hero image with overlay info */}
            <div className="relative h-[260px] sm:h-[320px] lg:h-auto lg:min-h-[460px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`img-${active.id}`}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.image}
                    alt={active.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority={activeIdx === 0}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(140deg, ${active.accentInk}f0 0%, ${active.accent}b3 45%, ${active.accent}40 100%)`,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
                    style={{
                      backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                      backgroundSize: "28px 28px",
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Overlay content */}
              <div className="relative h-full flex flex-col justify-between p-6 sm:p-7 lg:p-8 text-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`text-${active.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                        <ActiveIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                        {active.tagline}
                      </span>
                    </div>
                    <h3
                      className="text-[28px] lg:text-[32px] leading-[1.05] font-bold tracking-tight max-w-[14ch]"
                      style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    >
                      {active.title}
                    </h3>
                  </motion.div>
                </AnimatePresence>

                {/* Feature pills — honest, not fake stats */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`feats-${active.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-2 mt-6"
                  >
                    {[
                      { icon: ShieldCheck, label: "Perfiles verificados por la UIAB" },
                      { icon: Phone, label: "Contacto directo, sin intermediarios" },
                      { icon: CheckCircle2, label: "Categorización por sector y servicio" },
                    ].map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <motion.div
                          key={f.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                          className="flex items-center gap-2.5 text-[12.5px] text-white/90"
                        >
                          <Icon className="w-3.5 h-3.5 text-white/80 shrink-0" />
                          <span>{f.label}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT — example profile anatomy */}
            <div className="relative p-5 sm:p-6 lg:p-7 flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: active.accent }}
                  >
                    Perfil de ejemplo
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#191c1e]/30">
                    · vista pública
                  </span>
                </div>
                <Link
                  href={active.href}
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold group/link"
                  style={{ color: active.accent }}
                >
                  {active.ctaLabel}
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </Link>
              </div>

              {/* Demo profile card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`demo-${active.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl border bg-white p-4 sm:p-5 shadow-[0_18px_40px_-22px_rgba(0,33,63,0.18)]"
                  style={{ borderColor: `${active.accent}26` }}
                >
                  {/* Top: logo + verification + rating */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-[16px] tracking-tight"
                        style={{
                          background: active.accentSoft,
                          color: active.accent,
                          fontFamily: "var(--font-manrope, 'Manrope', sans-serif)",
                        }}
                      >
                        {active.demo.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="text-[9.5px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                            style={{ background: active.accentSoft, color: active.accent }}
                          >
                            {active.demo.badge}
                          </span>
                          <span
                            className="inline-flex items-center gap-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                            style={{ background: "#10375c0d", color: "#10375c" }}
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Verificado
                          </span>
                        </div>
                        <h4
                          className="text-[15px] font-extrabold text-[#191c1e] tracking-tight leading-tight truncate"
                          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                        >
                          {active.demo.nombrePlaceholder}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-amber-50 shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="text-[10.5px] font-black text-amber-700">5.0</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[12.5px] text-[#191c1e]/55 leading-relaxed mb-3">
                    {active.demo.descPlaceholder}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#191c1e]/55 font-semibold mb-3">
                    <MapPin className="w-3 h-3" style={{ color: active.accent }} />
                    {active.demo.ubicacion}
                  </div>

                  {/* Service chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {active.demo.servicios.map((s) => (
                      <span
                        key={s}
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          color: active.accentInk,
                          background: "white",
                          borderColor: `${active.accent}33`,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Footer: contact actions */}
                  <div className="pt-3 border-t border-[#191c1e]/6 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {[Mail, Phone, Globe].map((Icon, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ background: active.accentSoft }}
                        >
                          <Icon className="w-3 h-3" style={{ color: active.accent }} />
                        </div>
                      ))}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider"
                      style={{ color: active.accent }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {active.demo.certificacion}
                    </span>
                  </div>

                  {/* Corner ribbon */}
                  <div
                    className="absolute -top-2 right-4 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-[0.16em]"
                    style={{ background: active.accent, color: "white" }}
                  >
                    Ejemplo
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Tipos de perfil */}
              <div className="mt-5 pt-4 border-t border-[#191c1e]/6">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#191c1e]/40 block mb-2.5">
                  Tipos de perfil que vas a encontrar
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`tipos-${active.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-wrap gap-1.5"
                  >
                    {active.tipos.map((t, idx) => (
                      <motion.span
                        key={t}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + idx * 0.03, duration: 0.3 }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          color: active.accentInk,
                          background: active.accentSoft,
                        }}
                      >
                        {t}
                      </motion.span>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {branches.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setActiveIdx(i)}
              aria-label={`Ver ${b.title}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === activeIdx ? 24 : 6,
                background: i === activeIdx ? b.accent : "#191c1e22",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
