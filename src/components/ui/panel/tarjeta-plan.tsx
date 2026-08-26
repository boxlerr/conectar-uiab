import Link from "next/link";
import { AlertTriangle, CalendarClock, Crown, ShieldCheck } from "lucide-react";

/**
 * "Tu plan": el estado de la cuota, en el panel.
 *
 * El panel no mostraba nada de esto: la socia se enteraba de que estaba en mora
 * sólo por la barra roja de arriba, y de que su acceso era de cortesía no se
 * enteraba nunca. Los dos casos importan — la cortesía es la mitad del padrón.
 *
 * El título sale del estado real de `suscripciones`. NO dice "Plan Premium":
 * ese plan no existe. La plataforma tiene un solo plan y dos ciclos, y ponerle
 * un nombre comercial inventado al costado de un botón que cobra es
 * exactamente la clase de dato que este repo ya tuvo que sacar tres veces.
 */

export type EstadoSuscripcion =
  | "activa"
  | "pendiente_pago"
  | "en_mora"
  | "suspendida"
  | "cancelada";

interface TarjetaPlanProps {
  estado: EstadoSuscripcion | null;
  /** `"mensual" | "anual"`, tal como está en la fila. */
  ciclo: string | null;
  /** `metodo_pago === "cortesia"` o monto 0: socia UIAB, no paga. */
  esCortesia: boolean;
  proximoCobro: string | null;
  graciaHasta: string | null;
}

const COPY: Record<
  EstadoSuscripcion,
  { titulo: string; detalle: string; cta: string; urgente: boolean }
> = {
  activa: {
    titulo: "Tu cuota está al día",
    detalle: "Acceso completo al directorio, la cartelera y tu ficha pública.",
    cta: "Ver detalles del plan",
    urgente: false,
  },
  pendiente_pago: {
    titulo: "Tu suscripción no está activa",
    detalle: "Activala para publicar, contactar socias y aparecer en el directorio.",
    cta: "Activar suscripción",
    urgente: true,
  },
  en_mora: {
    titulo: "No registramos tu último pago",
    detalle: "Seguís entrando durante los días de gracia. Después se suspende.",
    cta: "Regularizar ahora",
    urgente: true,
  },
  suspendida: {
    titulo: "Tu suscripción está suspendida",
    detalle: "Se suspendió por falta de pago. Regularizala para volver a entrar.",
    cta: "Reactivar",
    urgente: true,
  },
  cancelada: {
    titulo: "Diste de baja tu suscripción",
    detalle: "Podés volver cuando quieras: tu ficha y tus datos quedan guardados.",
    cta: "Volver a suscribirme",
    urgente: true,
  },
};

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

export function TarjetaPlan({
  estado,
  ciclo,
  esCortesia,
  proximoCobro,
  graciaHasta,
}: TarjetaPlanProps) {
  // Sin fila de suscripción se trata como "nunca activó": es lo mismo que hace
  // el gate del middleware, y decir "al día" ahí sería mentira.
  const copy = COPY[estado ?? "pendiente_pago"];
  const alDia = !copy.urgente;
  const cortesiaActiva = esCortesia && alDia;

  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(150deg, #001829 0%, #00213f 52%, #0b3268 100%)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: "url('/panel/textura-parque-industrial.webp')" }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(150deg, rgba(0,24,41,0.93) 0%, rgba(0,33,63,0.9) 52%, rgba(11,50,104,0.86) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="relative z-10 p-6">
        <div className="mb-3.5 flex items-center gap-2">
          {cortesiaActiva ? (
            <Crown className="h-[18px] w-[18px] text-amber-300" strokeWidth={2.2} />
          ) : alDia ? (
            <ShieldCheck className="h-[18px] w-[18px] text-emerald-300" strokeWidth={2.2} />
          ) : (
            <AlertTriangle className="h-[18px] w-[18px] text-amber-300" strokeWidth={2.2} />
          )}
          <span className="text-[13px] font-semibold text-white/55">Tu plan actual</span>
        </div>

        <h3 className="font-poppins text-[21px] font-black leading-tight tracking-tight text-white">
          {cortesiaActiva ? "Acceso sin cargo" : copy.titulo}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-white/50">
          {cortesiaActiva
            ? "Tu cuota de socia de la UIAB ya cubre el acceso a la plataforma. No se te va a cobrar nada."
            : copy.detalle}
        </p>

        {!esCortesia && (ciclo || proximoCobro || graciaHasta) && (
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3.5">
            {ciclo && (
              <p className="flex items-center gap-2 text-[12.5px] text-white/45">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                Pago <span className="font-semibold capitalize text-white/70">{ciclo}</span>
              </p>
            )}
            {estado === "en_mora" && graciaHasta ? (
              <p className="flex items-center gap-2 text-[12.5px] text-amber-200/80">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                Podés entrar hasta el{" "}
                <span className="font-semibold">{fechaCorta(graciaHasta)}</span>
              </p>
            ) : (
              proximoCobro &&
              estado === "activa" && (
                <p className="flex items-center gap-2 text-[12.5px] text-white/45">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  Próximo cobro:{" "}
                  <span className="font-semibold text-white/70">{fechaCorta(proximoCobro)}</span>
                </p>
              )
            )}
          </div>
        )}

        <Link
          href={copy.urgente ? "/suscripcion/checkout" : "/perfil/suscripcion"}
          className={`mt-5 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all ${
            copy.urgente
              ? "bg-white text-[#00213f] shadow-lg shadow-black/25 hover:bg-sky-50"
              : "border border-white/25 text-white hover:border-white/50 hover:bg-white/10"
          }`}
        >
          {cortesiaActiva ? "Ver detalles del plan" : copy.cta}
        </Link>
      </div>
    </section>
  );
}
