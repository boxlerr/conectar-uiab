"use client"

import { useRouter } from "next/navigation"
import { Lock, Clock, AlertTriangle, XCircle, CreditCard, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export type EstadoAcceso =
  | "pendiente_pago"
  | "pendiente_revision"
  | "en_mora"
  | "suspendida"
  | "cancelada"
  | "sin_suscripcion"

interface Cfg {
  icon: React.ElementType
  dot: string
  eyebrow: string
  titulo: string
  descripcion: string
  cta: string
  ctaHref: string
  ctaSecundario?: string
  ctaSecundariaHref?: string
}

const CONFIGS: Record<EstadoAcceso, Cfg> = {
  pendiente_pago: {
    icon: CreditCard,
    dot: "bg-amber-400",
    eyebrow: "Pago pendiente",
    titulo: "Completá tu suscripción",
    descripcion:
      "Tu perfil fue registrado. Completá el pago mensual para activar tu acceso al directorio UIAB Conecta.",
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
    descripcion:
      "Recibimos tu solicitud y pago. La administración UIAB está evaluando tu perfil. Te notificaremos por email cuando sea aprobado.",
    cta: "Ver mi perfil",
    ctaHref: "/perfil",
  },
  en_mora: {
    icon: AlertTriangle,
    dot: "bg-amber-400",
    eyebrow: "Pago vencido",
    titulo: "Tu pago está vencido",
    descripcion:
      "No recibimos tu último pago. Regularizá tu suscripción para mantener el acceso completo.",
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
    descripcion:
      "El período de gracia expiró sin recibir pago. Regularizá tu suscripción para volver a aparecer en el directorio.",
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
    descripcion:
      "Reactivá tu suscripción para recuperar el acceso completo a UIAB Conecta.",
    cta: "Reactivar suscripción",
    ctaHref: "/suscripcion/checkout",
  },
  sin_suscripcion: {
    icon: ShieldCheck,
    dot: "bg-slate-400",
    eyebrow: "Suscripción requerida",
    titulo: "Esta sección requiere suscripción",
    descripcion:
      "Para acceder necesitás una suscripción activa a UIAB Conecta.",
    cta: "Activar suscripción",
    ctaHref: "/suscripcion/checkout",
  },
}

interface Props {
  estado?: EstadoAcceso
  className?: string
}

export function AccesoRequerido({ estado = "sin_suscripcion", className = "" }: Props) {
  const router = useRouter()
  const cfg = CONFIGS[estado]
  const Icon = cfg.icon

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Industrial blue background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0a2d50] to-[#10375c]" />
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center py-28 px-6 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 bg-white/[0.07] border border-white/[0.12]">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/50">
            {cfg.eyebrow}
          </span>
        </div>

        {/* Icon */}
        <div className="w-[72px] h-[72px] bg-white/[0.08] border border-white/[0.12] flex items-center justify-center mb-8">
          <Icon className="w-8 h-8 text-white/80" />
        </div>

        {/* Headline */}
        <h2
          className="text-3xl md:text-4xl font-black text-white tracking-tight leading-[1.08] mb-5 max-w-lg"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          {cfg.titulo}
        </h2>

        {/* Body */}
        <p className="text-white/55 text-[15px] font-medium leading-relaxed max-w-md mb-10 font-inter">
          {cfg.descripcion}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="h-12 px-8 rounded-sm bg-white text-[#00213f] hover:bg-white/90 font-bold text-sm"
            onClick={() => router.push(cfg.ctaHref)}
          >
            {cfg.cta}
          </Button>
          {cfg.ctaSecundario && (
            <Button
              size="lg"
              variant="ghost"
              className="h-12 px-8 rounded-sm text-white/70 hover:text-white hover:bg-white/10 border border-white/20 text-sm"
              onClick={() => router.push(cfg.ctaSecundariaHref!)}
            >
              {cfg.ctaSecundario}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
