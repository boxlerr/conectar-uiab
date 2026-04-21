"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Bell, Star, Check, X, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utilidades";
import {
  obtenerNotificaciones,
  marcarTodasLeidas,
  marcarLeida,
  type Notificacion,
} from "@/modulos/notificaciones/acciones";
import { useRouter } from "next/navigation";

const ICONO: Record<Notificacion["tipo"], React.ReactNode> = {
  resena_aprobada: <Check className="w-3.5 h-3.5 text-emerald-600" />,
  resena_rechazada: <X className="w-3.5 h-3.5 text-rose-600" />,
  resena_recibida: <Star className="w-3.5 h-3.5 text-amber-500" />,
};

const FONDO: Record<Notificacion["tipo"], string> = {
  resena_aprobada: "bg-emerald-50",
  resena_rechazada: "bg-rose-50",
  resena_recibida: "bg-amber-50",
};

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export function CampanaNotificaciones() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function cargar() {
    setCargando(true);
    try {
      const res = await obtenerNotificaciones();
      setNotificaciones(res.notificaciones);
      setSinLeer(res.sinLeer);
    } finally {
      setCargando(false);
    }
  }

  // Carga inicial y polling cada 60s
  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => !prev);
    // Marcar como leídas al abrir
    if (!open && sinLeer > 0) {
      setSinLeer(0);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      startTransition(() => marcarTodasLeidas());
    }
  }

  async function handleClick(n: Notificacion) {
    if (!n.leida) {
      setNotificaciones((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x))
      );
      await marcarLeida(n.id);
    }
    setOpen(false);
    if (n.url) router.push(n.url);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggleOpen}
        aria-label="Notificaciones"
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-full border transition-all",
          open
            ? "bg-primary-50 border-primary-200 text-primary-700"
            : "bg-white/50 border-slate-200/50 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
        )}
      >
        <Bell className="w-4 h-4" />
        {sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-sm font-bold text-slate-900">Notificaciones</p>
              {notificaciones.length > 0 && (
                <button
                  onClick={() => {
                    setSinLeer(0);
                    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
                    startTransition(() => marcarTodasLeidas());
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-600 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
              {cargando && notificaciones.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">Cargando...</div>
              ) : notificaciones.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin notificaciones</p>
                </div>
              ) : (
                notificaciones.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-slate-50",
                      !n.leida && "bg-blue-50/40"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", FONDO[n.tipo])}>
                      {ICONO[n.tipo]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", !n.leida ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug">{n.mensaje}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{tiempoRelativo(n.creada_en)}</p>
                    </div>
                    {!n.leida && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
