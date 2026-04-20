"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { Lock, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type EstadoSus = "activa" | "pendiente_pago" | "en_mora" | "suspendida" | "cancelada" | null;

const MENSAJES: Record<string, { titulo: string; desc: string }> = {
  pendiente_pago: {
    titulo: "Completá tu suscripción para acceder a todo",
    desc: "Tu perfil está activo pero el directorio y las oportunidades están bloqueados hasta que completes el pago.",
  },
  en_mora: {
    titulo: "Tu pago está vencido",
    desc: "El directorio y las oportunidades están bloqueados. Regularizá para recuperar el acceso completo.",
  },
  suspendida: {
    titulo: "Suscripción suspendida",
    desc: "Tu acceso al directorio y oportunidades está suspendido. Regularizá tu suscripción.",
  },
  cancelada: {
    titulo: "Suscripción cancelada",
    desc: "Reactivá tu suscripción para volver a ver el directorio y publicar oportunidades.",
  },
};

export function BannerSuscripcion() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [estado, setEstado] = useState<EstadoSus>(null);
  const [cargando, setCargando] = useState(true);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    if (authLoading || !currentUser?.entityId) {
      setCargando(false);
      return;
    }
    const fk = currentUser.role === "company" ? "empresa_id" : "proveedor_id";
    supabase
      .from("suscripciones")
      .select("estado, gracia_hasta")
      .eq(fk, currentUser.entityId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: { estado: string; gracia_hasta: string | null } | null }) => {
        const est = data?.estado as EstadoSus;
        const gracia = data?.gracia_hasta ? new Date(data.gracia_hasta) : null;
        const bloqueado =
          !est ||
          est === "suspendida" ||
          est === "cancelada" ||
          est === "pendiente_pago" ||
          (est === "en_mora" && (!gracia || gracia < new Date()));
        setEstado(bloqueado ? (est || "pendiente_pago") : "activa");
        setCargando(false);
      });
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  const inactiva = !cargando && estado !== "activa" && estado !== null;
  const msg = MENSAJES[estado ?? ""] || MENSAJES.pendiente_pago;

  if (cargando || estado === "activa" || cerrado) return null;
  if (!inactiva) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative z-50 w-full"
      >
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <span className="text-sm font-bold text-amber-900">{msg.titulo}</span>
            </div>
            <p className="text-xs text-amber-700 flex-1 min-w-0 hidden sm:block">{msg.desc}</p>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <Button
                size="sm"
                className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 shadow-none"
                onClick={() => router.push("/suscripcion/checkout")}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Regularizar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-amber-700 hover:bg-amber-100 text-xs font-semibold gap-1"
                onClick={() => router.push("/perfil/suscripcion")}
              >
                Ver detalle
              </Button>
              <button
                onClick={() => setCerrado(true)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Overlay con blur que cubre el contenido del dashboard cuando la suscripción no está activa
export function DashboardBlurGate({ children }: { children: React.ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [estado, setEstado] = useState<EstadoSus>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser?.entityId) {
      setCargando(false);
      return;
    }
    const fk = currentUser.role === "company" ? "empresa_id" : "proveedor_id";
    supabase
      .from("suscripciones")
      .select("estado, gracia_hasta")
      .eq(fk, currentUser.entityId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: { estado: string; gracia_hasta: string | null } | null }) => {
        const est = data?.estado as EstadoSus;
        const gracia = data?.gracia_hasta ? new Date(data.gracia_hasta) : null;
        const bloqueado =
          !est ||
          est === "suspendida" ||
          est === "cancelada" ||
          est === "pendiente_pago" ||
          (est === "en_mora" && (!gracia || gracia < new Date()));
        setEstado(bloqueado ? (est || "pendiente_pago") : "activa");
        setCargando(false);
      });
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  const inactiva = !cargando && estado !== "activa" && estado !== null;

  return (
    <div className="relative">
      {/* Contenido real — siempre renderizado */}
      <div className={inactiva ? "pointer-events-none select-none" : ""}>
        {children}
      </div>

      {/* Overlay blur cuando inactiva */}
      {inactiva && (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-24 px-4"
          style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(248,250,252,0.55)" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 max-w-md w-full text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 border border-amber-100 mb-5">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-xl font-black text-[#00213f] mb-2 tracking-tight">
              Vista limitada
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Tenés acceso a tu perfil y suscripción. Para usar el directorio y oportunidades necesitás una suscripción activa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push("/suscripcion/checkout")}
                className="bg-primary-600 hover:bg-primary-700 font-bold gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Activar suscripción
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/perfil/suscripcion")}
                className="font-semibold"
              >
                Ver mi suscripción
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
