"use client"

import { useRouter } from "next/navigation"
import { Lock, Clock, AlertTriangle, XCircle, CreditCard, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type EstadoAcceso } from "@/components/ui/acceso-requerido"

const CONFIGS: Record<EstadoAcceso, {
  icon: React.ElementType
  dot: string
  eyebrow: string
  titulo: string
  descripcion: string
  cta: string
  ctaHref: string
  ctaSecundario?: string
  ctaSecundariaHref?: string
}> = {
  pendiente_pago: {
    icon: CreditCard,
    dot: "bg-amber-400",
    eyebrow: "Pago pendiente",
    titulo: "Completá tu suscripción para acceder",
    descripcion: "Completá el pago mensual para activar tu acceso al directorio UIAB Conecta.",
    cta: "Completar pago",
    ctaHref: "/suscripcion/checkout",
    ctaSecundario: "Ver detalle",
    ctaSecundariaHref: "/perfil/suscripcion",
  },
  pendiente_revision: {
    icon: Clock,
    dot: "bg-blue-400 animate-pulse",
    eyebrow: "En revisión",
    titulo: "Tu cuenta está siendo revisada",
    descripcion: "Recibimos tu solicitud y pago. La administración UIAB está evaluando tu perfil y habilitará tu acceso pronto.",
    cta: "Ver mi perfil",
    ctaHref: "/perfil",
  },
  en_mora: {
    icon: AlertTriangle,
    dot: "bg-amber-400",
    eyebrow: "Pago vencido",
    titulo: "Regularizá tu suscripción",
    descripcion: "Tu último pago no fue recibido. Regularizá para mantener acceso completo al directorio.",
    cta: "Regularizar ahora",
    ctaHref: "/suscripcion/checkout",
    ctaSecundario: "Ver detalle",
    ctaSecundariaHref: "/perfil/suscripcion",
  },
  suspendida: {
    icon: Lock,
    dot: "bg-rose-400",
    eyebrow: "Acceso suspendido",
    titulo: "Tu acceso está suspendido",
    descripcion: "El período de gracia expiró. Regularizá tu suscripción para volver a acceder.",
    cta: "Regularizar ahora",
    ctaHref: "/suscripcion/checkout",
    ctaSecundario: "Ver detalle",
    ctaSecundariaHref: "/perfil/suscripcion",
  },
  cancelada: {
    icon: XCircle,
    dot: "bg-slate-400",
    eyebrow: "Suscripción cancelada",
    titulo: "Tu suscripción fue cancelada",
    descripcion: "Reactivá tu suscripción para recuperar el acceso completo a UIAB Conecta.",
    cta: "Reactivar suscripción",
    ctaHref: "/suscripcion/checkout",
  },
  sin_suscripcion: {
    icon: ShieldCheck,
    dot: "bg-slate-400",
    eyebrow: "Suscripción requerida",
    titulo: "Esta sección requiere suscripción activa",
    descripcion: "Para acceder al directorio UIAB Conecta necesitás una suscripción activa.",
    cta: "Activar suscripción",
    ctaHref: "/suscripcion/checkout",
  },
}

interface Props {
  estado: EstadoAcceso
  children: React.ReactNode
}

/**
 * Envuelve contenido con un blur overlay cuando la suscripción no está activa.
 * Muestra el contenido degradado detrás de un panel de acceso bloqueado.
 */
export function GateSuscripcion({ estado, children }: Props) {
  const router = useRouter()
  const cfg = CONFIGS[estado]
  const Icon = cfg.icon

  return (
    <div className="relative">
      {/* Blurred background content */}
      <div className="blur-[3px] brightness-75 pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f7f9fb]/60 to-[#f7f9fb]/95" />

      {/* Gate panel — sticky so it stays visible while scrolling */}
      <div className="absolute inset-0 flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="relative bg-white border border-slate-200 shadow-[0_24px_64px_-12px_rgba(0,33,63,0.18)] overflow-hidden">
            {/* Top accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-[#00213f] to-[#10375c]" />

            <div className="p-8 md:p-10">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-slate-50 border border-slate-200">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-500">
                  {cfg.eyebrow}
                </span>
              </div>

              {/* Icon + Headline */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-[#00213f]/[0.06] flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-[#00213f]" />
                </div>
                <h2
                  className="text-2xl font-black text-[#00213f] tracking-tight leading-tight"
                  style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
                >
                  {cfg.titulo}
                </h2>
              </div>

              {/* Body */}
              <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8 pl-16">
                {cfg.descripcion}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pl-16">
                <Button
                  className="h-11 px-6 rounded-sm bg-[#00213f] hover:bg-[#10375c] text-white font-bold text-sm"
                  onClick={() => router.push(cfg.ctaHref)}
                >
                  {cfg.cta}
                </Button>
                {cfg.ctaSecundario && (
                  <Button
                    variant="outline"
                    className="h-11 px-6 rounded-sm border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
                    onClick={() => router.push(cfg.ctaSecundariaHref!)}
                  >
                    {cfg.ctaSecundario}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Subtle caption */}
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">
            El acceso se activa automáticamente al regularizar tu suscripción.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Devuelve el EstadoAcceso correcto para un usuario sin suscripción activa */
export function resolverEstadoGate(
  subscriptionEstado: string | null,
  isMember: boolean,
): EstadoAcceso {
  if (subscriptionEstado === "activa" && !isMember) return "pendiente_revision"
  if (subscriptionEstado === "pendiente_pago") return "pendiente_pago"
  if (subscriptionEstado === "en_mora") return "en_mora"
  if (subscriptionEstado === "suspendida") return "suspendida"
  if (subscriptionEstado === "cancelada") return "cancelada"
  return "sin_suscripcion"
}
