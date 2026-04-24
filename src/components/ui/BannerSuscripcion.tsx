"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { CreditCard, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type EstadoSus = "activa" | "pendiente_pago" | "en_mora" | "suspendida" | "cancelada" | null;

const MENSAJES: Record<string, { titulo: string; desc: string; urgente?: boolean; cta: string }> = {
  pendiente_pago: {
    titulo: "Activá tu suscripción para aparecer en el directorio y ver oportunidades",
    desc: "Tu perfil ya está aprobado, solo falta el pago.",
    cta: "Activar suscripción",
  },
  en_mora: {
    titulo: "Tu suscripción venció — perdiste acceso al directorio y oportunidades",
    desc: "Renovála para volver a estar visible.",
    urgente: true,
    cta: "Renovar ahora",
  },
  suspendida: {
    titulo: "Suscripción suspendida — tu perfil dejó de ser visible",
    desc: "Regularizá el pago para reactivar tu presencia.",
    urgente: true,
    cta: "Reactivar",
  },
  cancelada: {
    titulo: "Tu suscripción fue cancelada — ya no aparecés en el directorio",
    desc: "Podés volver a suscribirte cuando quieras.",
    urgente: true,
    cta: "Volver a suscribirse",
  },
};

function useSubscriptionState() {
  const { currentUser, loading: authLoading } = useAuth();
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

  return { estado, cargando };
}

export function BannerSuscripcion() {
  const { estado, cargando } = useSubscriptionState();
  const router = useRouter();

  if (cargando || estado === "activa" || estado === null) return null;

  const msg = MENSAJES[estado] ?? MENSAJES.pendiente_pago;

  return (
    <div className={`w-full border-b px-4 py-2.5 ${msg.urgente ? "bg-red-50 border-red-100" : "bg-[#00213f] border-[#00213f]"}`}>
      <div className="max-w-5xl mx-auto flex items-center gap-4 flex-wrap">
        {msg.urgente && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-semibold ${msg.urgente ? "text-red-800" : "text-white"}`}>
            {msg.titulo}
          </span>
          {msg.desc && (
            <span className={`text-xs ml-2 ${msg.urgente ? "text-red-600" : "text-white/60"}`}>
              {msg.desc}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => router.push("/suscripcion/checkout")}
          className={`h-8 text-xs font-bold gap-1.5 shrink-0 ${
            msg.urgente
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-white text-[#00213f] hover:bg-white/90"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          {msg.cta}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Sin blur ni modal — el dashboard se ve normalmente, el banner de arriba es suficiente
export function DashboardBlurGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
