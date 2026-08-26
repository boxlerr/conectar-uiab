"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  CreditCard,
  Inbox,
  MessageSquare,
  Star,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { llamarAccion } from "@/lib/accion-segura";
import { marcarLeida, marcarTodasLeidas } from "@/modulos/notificaciones/acciones";
import {
  tiempoRelativoNotificacion,
  type Notificacion,
  type TipoNotificacion,
} from "@/modulos/notificaciones/tipos";
import { TARJETA } from "./piezas";

/**
 * Las notificaciones del usuario, dentro del panel.
 *
 * Antes acá había un cartel fijo que decía "Tu cuenta está al día" pasara lo
 * que pasara: no consultaba nada. Las notificaciones reales sólo se veían en la
 * campana del header, que además está dentro de un `hidden lg:flex` — o sea que
 * en teléfono y tablet no se veían en ningún lado.
 *
 * A diferencia de la campana, acá NO se marcan todas como leídas al aparecer.
 * El panel está siempre a la vista: hacer eso vaciaría el contador con sólo
 * entrar, y la socia no se enteraría nunca de lo que le llegó.
 */

const ICONO: Record<TipoNotificacion, LucideIcon> = {
  resena_aprobada: Check,
  resena_rechazada: X,
  resena_recibida: Star,
  oportunidad_solicitud: Inbox,
  solicitud_respondida: MessageSquare,
  pago_confirmado: CreditCard,
  pago_fallido: CreditCard,
  suscripcion_por_vencer: Clock,
  suscripcion_en_mora: AlertTriangle,
  suscripcion_suspendida: Ban,
  etiquetas_precargadas: Tag,
};

const TONO: Record<TipoNotificacion, string> = {
  resena_aprobada: "bg-emerald-50 text-emerald-500",
  resena_rechazada: "bg-rose-50 text-rose-500",
  resena_recibida: "bg-amber-50 text-amber-500",
  oportunidad_solicitud: "bg-indigo-50 text-indigo-500",
  solicitud_respondida: "bg-emerald-50 text-emerald-500",
  pago_confirmado: "bg-emerald-50 text-emerald-500",
  pago_fallido: "bg-rose-50 text-rose-500",
  suscripcion_por_vencer: "bg-amber-50 text-amber-500",
  suscripcion_en_mora: "bg-orange-50 text-orange-500",
  suscripcion_suspendida: "bg-rose-50 text-rose-500",
  etiquetas_precargadas: "bg-sky-50 text-sky-500",
};

interface PanelNotificacionesProps {
  notificaciones: Notificacion[];
  /** Conteo real de no leídas sobre la tabla, no sobre las traídas. */
  sinLeer: number;
}

export function PanelNotificaciones({ notificaciones, sinLeer }: PanelNotificacionesProps) {
  // Copia local para poder tachar en el acto: el `revalidatePath` del server
  // action tarda un viaje y sin esto el ítem queda en negrita después del click.
  const [leidasLocal, setLeidasLocal] = useState<Set<string>>(new Set());
  const [todasLeidas, setTodasLeidas] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();

  const estaLeida = (n: Notificacion) => n.leida || todasLeidas || leidasLocal.has(n.id);
  const pendientes = todasLeidas ? 0 : Math.max(0, sinLeer - leidasLocal.size);

  function abrir(n: Notificacion) {
    if (!estaLeida(n)) {
      setLeidasLocal((prev) => new Set(prev).add(n.id));
      startTransition(() => {
        llamarAccion(() => marcarLeida(n.id));
      });
    }
    if (n.url) router.push(n.url);
  }

  return (
    <section className={TARJETA}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Bell className="h-[18px] w-[18px] shrink-0 text-amber-400" strokeWidth={2.2} />
          <h2 className="truncate font-poppins text-[15px] font-bold tracking-tight text-[#00213f]">
            Notificaciones
          </h2>
          {pendientes > 0 && (
            <span className="shrink-0 rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[10px] font-black tabular-nums text-white">
              {pendientes}
            </span>
          )}
        </div>
        {pendientes > 0 && (
          <button
            type="button"
            onClick={() => {
              setTodasLeidas(true);
              startTransition(() => {
                llamarAccion(() => marcarTodasLeidas());
              });
            }}
            disabled={pendiente}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[12.5px] font-semibold text-[#2563eb] transition-colors hover:text-[#00213f] disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {notificaciones.length > 0 ? (
        <>
          <ul className="divide-y divide-slate-50">
            {notificaciones.map((n) => {
              const Icono = ICONO[n.tipo] ?? Bell;
              const tono = TONO[n.tipo] ?? "bg-slate-50 text-slate-400";
              const leida = estaLeida(n);

              // Sin `url` no hay a dónde ir (`resena_rechazada` nunca la trae):
              // ahí el botón sólo marca leído, no es un link muerto.
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#f8fafc] sm:px-6"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tono}`}
                    >
                      <Icono className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={`truncate text-[13px] ${
                            leida ? "font-semibold text-slate-500" : "font-bold text-[#00213f]"
                          }`}
                        >
                          {n.titulo}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-[11.5px] text-slate-400">
                          {tiempoRelativoNotificacion(n.creada_en)}
                        </span>
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-[12px] leading-snug text-slate-400">
                        {n.mensaje}
                      </span>
                    </span>
                    {!leida && (
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                        aria-label="Sin leer"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="px-4 pb-4 pt-2">
            <button
              type="button"
              onClick={() => router.push("/perfil/solicitudes")}
              className="flex w-full items-center justify-center gap-1 rounded-xl bg-[#eff6ff] px-4 py-2.5 text-[13px] font-bold text-[#2563eb] transition-colors hover:bg-[#dbeafe]"
            >
              Ir a la bandeja de entrada
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <div className="px-6 py-8 text-center">
          <Image
            src="/panel/ilustracion-notificaciones.webp"
            alt=""
            width={220}
            height={220}
            className="mx-auto h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200/70"
            aria-hidden
          />
          <p className="mt-3.5 text-[13px] font-bold text-[#00213f]">No tenés avisos nuevos</p>
          <p className="mx-auto mt-1 max-w-[28ch] text-[12px] leading-relaxed text-slate-400">
            Acá te van a llegar las reseñas, los pedidos de presupuesto y el estado de tu cuota.
          </p>
        </div>
      )}
    </section>
  );
}
