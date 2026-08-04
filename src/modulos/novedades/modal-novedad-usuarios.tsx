"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Users, X, Check, KeyRound, UserX } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import { marcarNovedadVista } from "./acciones";
import { claveNovedad } from "./novedades";

/**
 * Cartel de novedad: "ahora podés dar acceso a tu equipo".
 *
 * Aparece centrado apenas la socia entra (o recarga estando logueada) y se
 * muestra UNA sola vez: al cerrarlo se marca en `perfiles.tutoriales_vistos`.
 * No usa localStorage a propósito — si no, volvería a aparecer en cada
 * dispositivo y en cada navegador.
 *
 * Se decide con el `currentUser` que ya vino del servidor, así que no hay
 * fetch extra ni parpadeo: o está en el primer render o no está.
 */

const CLAVE = claveNovedad("usuarios_empresa");

/** Rutas donde un cartel modal sólo estorba (formularios de acceso). */
const RUTAS_SIN_CARTEL = [
  "/login",
  "/register",
  "/recovery",
  "/restablecer-password",
  "/definir-password",
  "/suscripcion/checkout",
];

export function ModalNovedadUsuarios() {
  const { currentUser, refreshUser } = useAuth();
  const pathname = usePathname();
  const [cerrado, setCerrado] = useState(false);

  const yaLaVio = Boolean(currentUser?.tutorialesVistos?.[CLAVE]);
  // Sólo a quien administra una ficha: es la única que puede dar accesos.
  const tieneFicha = Boolean(tipoEntidadDe(currentUser));
  const enRutaDeAcceso = RUTAS_SIN_CARTEL.some((r) => pathname.startsWith(r));

  if (!currentUser || !tieneFicha || yaLaVio || cerrado || enRutaDeAcceso) return null;

  async function cerrar() {
    setCerrado(true);
    const r = await marcarNovedadVista("usuarios_empresa");
    // Refrescamos el perfil para que el mapa de vistos quede al día en el
    // contexto; si falla, el cartel igual ya no molesta en esta sesión.
    if (r.ok) refreshUser();
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novedad-titulo"
    >
      <div className="relative w-full max-w-[520px] bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* ── Header con la marca: mismo gradiente y trama que el login ── */}
        <div
          className="relative px-6 sm:px-8 pt-7 pb-6 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #00213f 0%, #10375c 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-sky-400/10 blur-[80px]" />

          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Novedad — UIAB Conecta
            </span>
            <h2
              id="novedad-titulo"
              className="text-2xl font-bold text-white tracking-tight leading-tight mt-2"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Ya podés sumar a tu equipo
            </h2>
            <p className="text-sm text-white/70 mt-2 max-w-md leading-relaxed">
              Compras, Mantenimiento, RRHH, Logística… cada persona de tu empresa puede tener
              su propio usuario, con su email y su contraseña.
            </p>
          </div>
        </div>

        {/* ── Mini vista de la pantalla nueva ── */}
        <div className="px-6 sm:px-8 pt-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            {[
              { inicial: "E", nombre: "Evelyn G.", area: "Compras", mail: "compras@tuempresa.com.ar" },
              { inicial: "M", nombre: "Martín D.", area: "Mantenimiento", mail: "manto@tuempresa.com.ar" },
            ].map((p) => (
              <div
                key={p.inicial}
                className="flex items-center gap-3 rounded-lg bg-white border border-slate-200 px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 border border-primary-100 flex items-center justify-center text-xs font-bold shrink-0">
                  {p.inicial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">
                    {p.nombre}
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {p.area}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{p.mail}</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                  <Check className="w-3 h-3" />
                  Activo
                </span>
              </div>
            ))}
          </div>

          <ul className="mt-4 space-y-2">
            {[
              { icon: KeyRound, texto: "Les creás el acceso y te queda listo para copiar y mandar por WhatsApp." },
              { icon: Users, texto: "Ven y editan lo mismo que vos: no hay permisos que configurar." },
              { icon: UserX, texto: "Cuando alguien se va de la empresa, lo desactivás y deja de entrar." },
            ].map(({ icon: Icon, texto }, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                <span className="w-5 h-5 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3 h-3" />
                </span>
                {texto}
              </li>
            ))}
          </ul>

          {/* ── Errores reportados por las socias y ya corregidos ──
              Se listan acá y no en un cartel aparte para no encadenar dos
              modales. Sólo van los que la socia sufrió en primera persona: los
              arreglos internos del panel de admin no le dicen nada. */}
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-2.5">
              También arreglamos lo que nos reportaron
            </p>
            <ul className="space-y-1.5">
              {[
                "Guardar los datos de tu ficha ya funciona: se terminó el cartel de “problema de sincronización temporal”.",
                "El logo se sube y queda guardado. Antes se cargaba pero se perdía al guardar.",
                "Si sos socia de la UIAB ya no se te pide pagar la suscripción: tu acceso es sin cargo.",
              ].map((texto, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-900/80">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-[3px]" />
                  <span className="leading-snug">{texto}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-emerald-800/60 mt-3 leading-snug">
              Gracias por avisarnos. Si ves algo raro, escribinos desde Contacto.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 sm:px-8 py-6">
          <button
            onClick={cerrar}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            Después
          </button>
          <Link
            href="/perfil/usuarios"
            onClick={cerrar}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
          >
            Configurar mis usuarios
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
