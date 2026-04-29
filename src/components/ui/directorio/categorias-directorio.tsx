"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  User,
  ChevronRight,
  Factory,
  FlaskConical,
  Car,
  Cpu,
  Shirt,
  Cookie,
  Package,
  Truck,
  Wrench,
  Zap,
  ShieldCheck,
  Calculator,
  HardHat,
  Paintbrush,
  Cog,
  Leaf,
  Hammer,
  MonitorSmartphone,
  Warehouse,
  Cable,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

/* ─── Static category lists (comprehensive) ─── */
const CATEGORIAS_SOCIOS: { nombre: string; icon: React.ElementType; total: number }[] = [
  { nombre: "Metalúrgica", icon: Factory, total: 18 },
  { nombre: "Química y Plásticos", icon: FlaskConical, total: 15 },
  { nombre: "Automotriz", icon: Car, total: 12 },
  { nombre: "Electrónica", icon: Cpu, total: 10 },
  { nombre: "Textil e Indumentaria", icon: Shirt, total: 8 },
  { nombre: "Alimentaria", icon: Cookie, total: 14 },
  { nombre: "Packaging", icon: Package, total: 9 },
  { nombre: "Logística", icon: Truck, total: 11 },
  { nombre: "Construcción", icon: HardHat, total: 16 },
  { nombre: "Maquinaria Industrial", icon: Cog, total: 7 },
  { nombre: "Agroquímica", icon: Leaf, total: 5 },
  { nombre: "Depósito y Almacenaje", icon: Warehouse, total: 6 },
];

const CATEGORIAS_PARTICULARES: { nombre: string; icon: React.ElementType; total: number }[] = [
  { nombre: "Electricidad Industrial", icon: Zap, total: 22 },
  { nombre: "Contabilidad e Impuestos", icon: Calculator, total: 18 },
  { nombre: "Seguridad e Higiene", icon: ShieldCheck, total: 14 },
  { nombre: "Ingeniería y Proyectos", icon: Wrench, total: 11 },
  { nombre: "Sistemas y Software", icon: MonitorSmartphone, total: 9 },
  { nombre: "Mantenimiento Industrial", icon: Hammer, total: 16 },
  { nombre: "Pintura y Revestimientos", icon: Paintbrush, total: 7 },
  { nombre: "Consultoría de Gestión", icon: BadgeCheck, total: 12 },
  { nombre: "Instalaciones Eléctricas", icon: Cable, total: 8 },
  { nombre: "Logística y Transporte", icon: Truck, total: 10 },
];

/* ─── Category Chip ─── */
function CategoryChip({
  nombre,
  icon: Icon,
  total,
  href,
  variant,
}: {
  nombre: string;
  icon: React.ElementType;
  total: number;
  href: string;
  variant: "socio" | "particular";
}) {
  const isSocio = variant === "socio";
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-[3px] border transition-all duration-300 hover:-translate-y-0.5 ${
        isSocio
          ? "bg-white border-[#10375c]/8 hover:border-[#10375c]/25 hover:shadow-[0_8px_20px_-6px_rgba(16,55,92,0.15)]"
          : "bg-white border-[#bf7035]/8 hover:border-[#bf7035]/25 hover:shadow-[0_8px_20px_-6px_rgba(191,112,53,0.15)]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-[2px] flex items-center justify-center shrink-0 transition-colors duration-300 ${
            isSocio
              ? "bg-[#10375c]/6 text-[#10375c] group-hover:bg-[#10375c] group-hover:text-white"
              : "bg-[#bf7035]/6 text-[#bf7035] group-hover:bg-[#bf7035] group-hover:text-white"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-[#191c1e] leading-tight truncate">{nombre}</span>
      </div>
      <span
        className={`text-[11px] font-black shrink-0 tabular-nums ${
          isSocio ? "text-[#10375c]/40" : "text-[#bf7035]/40"
        }`}
      >
        {total}
      </span>
    </Link>
  );
}

/* ─── Main Component ─── */
export function CategoriasDirectorio() {
  const totalSocios = CATEGORIAS_SOCIOS.reduce((a, c) => a + c.total, 0);
  const totalParticulares = CATEGORIAS_PARTICULARES.reduce((a, c) => a + c.total, 0);

  return (
    <section className="pt-12 pb-20 lg:pb-28 bg-white border-t border-[#f2f4f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12"
        >
          <div className="max-w-xl mb-8 lg:mb-0">
            <motion.span
              variants={fadeUp}
              custom={0}
              className="text-[11px] font-bold text-[#10375c] tracking-[0.14em] uppercase block mb-3"
            >
              Diversidad del Directorio
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-[2.5rem] font-bold text-[#191c1e] tracking-tight leading-[1.1] mb-4"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Socios e industriales en{" "}
              <span className="text-[#10375c]">26 rubros</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[15px] text-[#191c1e]/50 leading-relaxed"
            >
              La red UIAB nuclea empresas radicadas y proveedores de servicios profesionales en categorías
              diferenciadas. Cada tipo tiene su propio directorio, rubros y criterios de verificación.
            </motion.p>
          </div>

          {/* Stats pills */}
          <motion.div variants={fadeUp} custom={3} className="flex gap-3 shrink-0">
            <div className="bg-white rounded-[3px] px-5 py-4 text-center" style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}>
              <div className="text-2xl font-black text-[#10375c] font-manrope">{totalSocios}+</div>
              <div className="text-[10px] font-bold text-[#191c1e]/40 uppercase tracking-wider mt-0.5">Socios</div>
            </div>
            <div className="bg-white rounded-[3px] px-5 py-4 text-center" style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}>
              <div className="text-2xl font-black text-[#bf7035] font-manrope">{totalParticulares}+</div>
              <div className="text-[10px] font-bold text-[#191c1e]/40 uppercase tracking-wider mt-0.5">Proveedores de servicios</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── Socios Column ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
          >
            {/* Column Header */}
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-5">
              <div className="h-[3px] w-8 bg-gradient-to-r from-[#10375c] to-[#1a6496] rounded-full" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[2px] bg-[#10375c] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[15px] font-bold text-[#191c1e] leading-tight block">
                    Empresas Socias UIAB
                  </span>
                  <span className="text-[11px] text-[#191c1e]/40">
                    {CATEGORIAS_SOCIOS.length} rubros · Verificadas
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIAS_SOCIOS.map((cat, i) => (
                <motion.div key={cat.nombre} variants={fadeUp} custom={i + 1}>
                  <CategoryChip
                    nombre={cat.nombre}
                    icon={cat.icon}
                    total={cat.total}
                    href="/empresas"
                    variant="socio"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} custom={CATEGORIAS_SOCIOS.length + 1} className="mt-5">
              <Link
                href="/empresas"
                className="inline-flex items-center gap-2 text-[13px] font-bold text-[#10375c] hover:text-[#00213f] transition-colors group"
              >
                Ver directorio completo de socios
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* ─── Particulares Column ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
          >
            {/* Column Header */}
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-5">
              <div className="h-[3px] w-8 bg-gradient-to-r from-[#bf7035] to-[#d4894a] rounded-full" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#bf7035] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[15px] font-bold text-[#191c1e] leading-tight block">
                    Proveedores de servicios profesionales
                  </span>
                  <span className="text-[11px] text-[#191c1e]/40">
                    {CATEGORIAS_PARTICULARES.length} especialidades · Auditados
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIAS_PARTICULARES.map((cat, i) => (
                <motion.div key={cat.nombre} variants={fadeUp} custom={i + 1}>
                  <CategoryChip
                    nombre={cat.nombre}
                    icon={cat.icon}
                    total={cat.total}
                    href="/empresas?categoria=proveedores"
                    variant="particular"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} custom={CATEGORIAS_PARTICULARES.length + 1} className="mt-5">
              <Link
                href="/empresas?categoria=proveedores"
                className="inline-flex items-center gap-2 text-[13px] font-bold text-[#bf7035] hover:text-[#a05e28] transition-colors group"
              >
                Ver directorio de proveedores de servicios
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom info strip */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-[3px] px-6 py-4"
          style={{ boxShadow: "0 1px 2px rgba(0,33,63,0.04)" }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { label: "Perfiles verificados UIAB", color: "bg-emerald-500" },
              { label: "Contacto directo sin intermediarios", color: "bg-[#10375c]" },
              { label: "26 sectores disponibles", color: "bg-[#bf7035]" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-[12px] font-medium text-[#191c1e]/60">{item.label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-[2px] bg-[#00213f] hover:bg-[#10375c] text-white text-[12px] font-bold transition-colors shrink-0"
          >
            Explorar todo <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
