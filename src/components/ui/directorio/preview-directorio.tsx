"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Landmark,
  GraduationCap,
  User,
  Lock,
  ChevronRight,
  Star,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import {
  Entidad,
  getSociosIndustriales,
  getInstitucionesBancarias,
  getInstitucionesEducativas,
  getParticulares,
} from "@/lib/datos/directorio";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Types ─── */
interface DirectoryBranch {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeText: string;
  badgeBg: string;
  href: string;
  ctaLabel: string;
  entidades: Entidad[];
}

/* ─── Card Sub-component ─── */
function PreviewCard({
  entidad,
  isBlurred,
  isParticular,
}: {
  entidad: Entidad;
  isBlurred: boolean;
  isParticular?: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-md flex flex-col h-full overflow-hidden transition-all duration-300 ${
        isBlurred
          ? "pointer-events-none select-none"
          : "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(0,33,63,0.12)]"
      }`}
      style={{
        boxShadow: isBlurred ? undefined : "0 1px 3px rgba(0,33,63,0.04)",
        filter: isBlurred ? "blur(6px)" : undefined,
        opacity: isBlurred ? 0.4 : 1,
      }}
    >
      {/* Header */}
      <div className="bg-[#f7f9fb] px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 flex items-center justify-center font-manrope font-black text-lg overflow-hidden relative shrink-0 ${
              isParticular
                ? "rounded-full bg-[#bf7035]/8 text-[#bf7035]"
                : "rounded-md bg-[#10375c]/8 text-[#10375c]"
            }`}
          >
            {entidad.logo}
          </div>

          <div className="flex flex-col items-end gap-1">
            <div
              className={`w-6 h-6 rounded-sm flex items-center justify-center ${
                isParticular ? "bg-[#bf7035] text-white" : "bg-[#10375c] text-white"
              }`}
            >
              {isParticular ? <User className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
            </div>
            {entidad.rating && entidad.rating > 0 && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-[2px] bg-amber-50">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span className="text-[9px] font-black text-amber-700">{entidad.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5">
          <span
            className={`inline-flex items-center text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-[2px] ${
              isParticular ? "bg-[#bf7035]/8 text-[#bf7035]" : "bg-[#10375c]/8 text-[#10375c]"
            }`}
          >
            {entidad.categoria}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-3 pb-4 flex flex-col flex-1">
        <h4 className="font-manrope text-[15px] font-extrabold text-[#191c1e] tracking-tight leading-tight mb-1.5 line-clamp-2 break-words">
          {entidad.nombre}
        </h4>
        <p className="text-[#191c1e]/50 text-[12px] leading-relaxed line-clamp-2 flex-grow">
          {entidad.descripcionCorta}
        </p>

        {entidad.ubicacion && (
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#10375c]/4">
            <MapPin className="w-3 h-3 text-[#10375c]/40 shrink-0" />
            <span className="text-[10px] font-semibold text-[#10375c]/80 uppercase tracking-wider truncate">
              {entidad.ubicacion}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function PreviewDirectorio() {
  const { openAuthModal } = useAuth();

  const branches: DirectoryBranch[] = [
    {
      id: "socios",
      title: "Socios Industriales",
      subtitle: "Empresas manufactureras y de servicios radicadas en Almirante Brown",
      icon: Building2,
      iconBg: "bg-[#10375c]/8",
      iconColor: "text-[#10375c]",
      badgeText: "Verificado UIAB",
      badgeBg: "bg-[#10375c]/8 text-[#10375c]",
      href: "/empresas",
      ctaLabel: "Ver directorio de socios",
      entidades: getSociosIndustriales().slice(0, 3),
    },
    {
      id: "bancarias",
      title: "Instituciones Bancarias",
      subtitle: "Entidades financieras aliadas a la red UIAB",
      icon: Landmark,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      badgeText: "Red Financiera",
      badgeBg: "bg-emerald-50 text-emerald-700",
      href: "/instituciones-bancarias",
      ctaLabel: "Ver instituciones bancarias",
      entidades: getInstitucionesBancarias().slice(0, 3),
    },
    {
      id: "educativas",
      title: "Instituciones Educativas",
      subtitle: "Centros de formación técnica y universitaria aliados",
      icon: GraduationCap,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-700",
      badgeText: "Red Educativa",
      badgeBg: "bg-violet-50 text-violet-700",
      href: "/instituciones-educativas",
      ctaLabel: "Ver instituciones educativas",
      entidades: getInstitucionesEducativas().slice(0, 3),
    },
    {
      id: "particulares",
      title: "Particulares",
      subtitle: "Profesionales independientes verificados por la UIAB",
      icon: User,
      iconBg: "bg-[#bf7035]/8",
      iconColor: "text-[#bf7035]",
      badgeText: "Profesional",
      badgeBg: "bg-[#bf7035]/8 text-[#bf7035]",
      href: "/empresas?categoria=proveedores",
      ctaLabel: "Ver directorio de particulares",
      entidades: getParticulares().slice(0, 3),
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#f7f9fb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-14"
        >
          <div className="max-w-lg mb-8 lg:mb-0">
            <motion.span
              variants={fadeUp}
              custom={0}
              className="text-[11px] font-bold text-[#10375c] tracking-[0.14em] uppercase block mb-3"
            >
              Vista Previa del Directorio
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl lg:text-4xl font-bold text-[#191c1e] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Conozca nuestro ecosistema
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[15px] text-[#191c1e]/50 leading-relaxed"
            >
              Una muestra de las 4 ramas del directorio UIAB. Socios industriales,
              instituciones financieras, centros educativos y profesionales independientes.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} custom={3}>
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-sm font-bold text-[13px] bg-[#00213f] hover:bg-[#10375c] text-white shadow-lg shadow-[#00213f]/15 active:scale-[0.98] transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Acceder al directorio completo
            </button>
          </motion.div>
        </motion.div>

        {/* Branches */}
        <div className="space-y-10">
          {branches.map((branch, branchIdx) => {
            const Icon = branch.icon;
            const isParticular = branch.id === "particulares";

            return (
              <motion.div
                key={branch.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={stagger}
                className="relative"
              >
                {/* Branch Header */}
                <motion.div
                  variants={fadeUp}
                  custom={0}
                  className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-sm ${branch.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${branch.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3
                          className="text-[18px] font-bold text-[#191c1e] tracking-tight"
                          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                        >
                          {branch.title}
                        </h3>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-[2px] ${branch.badgeBg}`}>
                          {branch.badgeText}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#191c1e]/40 font-medium mt-0.5">
                        {branch.subtitle}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={branch.href}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#191c1e]/40 hover:text-[#10375c] transition-colors group/link shrink-0"
                  >
                    {branch.ctaLabel}
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </Link>
                </motion.div>

                {/* Cards Grid */}
                <div className="relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {branch.entidades.map((entidad, cardIdx) => (
                      <motion.div key={entidad.id} variants={fadeUp} custom={cardIdx + 1}>
                        <PreviewCard
                          entidad={entidad}
                          isBlurred={cardIdx === 2}
                          isParticular={isParticular}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Gradient fade on last card */}
                  <div className="absolute top-0 right-0 bottom-0 w-1/3 lg:w-[34%] bg-gradient-to-l from-[#f7f9fb] via-[#f7f9fb]/60 to-transparent pointer-events-none hidden lg:block" />
                </div>

                {/* Separator */}
                {branchIdx < branches.length - 1 && (
                  <div className="mt-10 h-px bg-[#191c1e]/6" />
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
