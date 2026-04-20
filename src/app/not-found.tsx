"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Factory, ArrowLeft, Building2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

// Variantes de animación siguiendo el estilo de la landing
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-[#f7f9fb] flex items-center justify-center p-6 relative overflow-hidden">
      {/* ─── Architectural Anchor (Background) ─── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
        <span className="text-[25rem] lg:text-[40rem] font-black tracking-tighter text-[#00213f] leading-none">
          404
        </span>
      </div>

      {/* ─── Ambient Glows ─── */}
      <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-primary-400/[0.05] blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-primary-300/[0.03] blur-[100px]" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Machine-like Icon Badge */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="inline-flex items-center justify-center w-20 h-20 rounded-sm bg-white border border-slate-200 shadow-sm mb-12"
        >
          <Factory className="w-10 h-10 text-[#00213f]" />
        </motion.div>

        <div className="space-y-6">
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#191c1e] leading-tight"
            style={{ fontFamily: "var(--font-manrope), sans-serif" }}
          >
            Página No Encontrada
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg md:text-xl text-[#191c1e]/50 max-w-lg mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            El recurso que busca ha sido reubicado o ya no se encuentra en el índice del conector UIAB.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="pt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg" className="rounded-sm px-8 font-bold bg-[#00213f] hover:bg-[#10375c]">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-sm px-8 border-slate-200 text-slate-600 hover:bg-slate-50">
            <Link href="/directorio">
              Explorar Directorio
            </Link>
          </Button>
        </motion.div>

        {/* ─── Technical Legend ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="mt-20 pt-8 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-3 gap-8 grayscale opacity-40"
        >
          <div className="flex flex-col items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Infraestructura</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Wrench className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mantenimiento</span>
          </div>
          <div className="hidden md:flex flex-col items-center gap-2">
            <Factory className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Conexiones</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
