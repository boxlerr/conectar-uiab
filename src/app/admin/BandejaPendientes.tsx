"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building,
  Check,
  Loader2,
  MessageSquare,
  Star,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fallo, llamarAccion } from "@/lib/accion-segura";
import { aprobarEmpresa, rechazarEmpresa, toggleActivarUsuario } from "@/modulos/admin/acciones";
import { crearCuentaDesdeAlta } from "@/modulos/altas/acciones";

/**
 * La bandeja de trabajo del panel.
 *
 * Antes esto era una lista de contadores: decía "3 pendientes" y te mandaba a
 * otra pantalla a buscarlos. Para las dos cosas que la UIAB hace todos los días
 * —dar acceso a una socia y habilitar a una persona— eso son tres clics y un
 * cambio de contexto para una decisión de un segundo.
 *
 * Ahora cada pendiente es una fila con nombre y apellido y su botón al lado. Lo
 * que necesita leer con calma (una reseña, una ficha entera) sigue teniendo su
 * link: no toda decisión se puede tomar desde un renglón.
 */

type Alta = {
  id: string;
  nombre: string;
  referente: string;
  email: string;
  porRegistro: boolean;
  yaVinculada: boolean;
  contactada: boolean;
  fecha: string;
};
type Persona = { id: string; nombre: string; email: string; fecha: string };
type EmpresaPendiente = { id: string; nombre: string; email: string; localidad: string; fecha: string };
type Resena = { id: string; calificacion: number; comentario: string; fecha: string };

export type Bandeja = {
  altas: Alta[];
  personas: Persona[];
  empresas: EmpresaPendiente[];
  resenas: Resena[];
};

function haceCuanto(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `hace ${Math.max(min, 1)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

/** Fila genérica: a la izquierda quién es, a la derecha qué se puede hacer. */
function Fila({
  icono,
  tono,
  titulo,
  detalle,
  meta,
  children,
}: {
  icono: React.ElementType;
  tono: string;
  titulo: string;
  detalle: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  const Icono = icono;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
      <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${tono}`}>
        <Icono className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 text-sm truncate">{titulo}</p>
        <p className="text-xs text-slate-500 truncate">{detalle}</p>
        {meta}
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

function Grupo({
  titulo,
  ayuda,
  verTodo,
  children,
}: {
  titulo: string;
  ayuda: string;
  verTodo: { href: string; etiqueta: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
          <p className="text-xs text-slate-500">{ayuda}</p>
        </div>
        <Link
          href={verTodo.href}
          className="text-xs font-semibold text-primary-700 hover:text-primary-900 whitespace-nowrap flex items-center gap-1"
        >
          {verTodo.etiqueta} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

export function BandejaPendientes({ bandeja }: { bandeja: Bandeja }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);

  const total =
    bandeja.altas.length + bandeja.personas.length + bandeja.empresas.length + bandeja.resenas.length;

  function refrescar() {
    startTransition(() => router.refresh());
  }

  /** Corre una acción marcando la fila como ocupada y contando siempre el resultado. */
  async function correr<T>(clave: string, accion: () => Promise<T>, alSalirBien: (r: T) => void) {
    setOcupado(clave);
    try {
      const res = await llamarAccion(accion);
      if (fallo(res)) {
        toast.error(res.error);
        return;
      }
      alSalirBien(res as T);
      refrescar();
    } finally {
      setOcupado(null);
    }
  }

  async function darAcceso(a: Alta) {
    if (
      !confirm(
        `Dar acceso a ${a.nombre}?\n\n` +
          "Se crea el usuario de " +
          a.referente +
          ", se vincula su ficha del directorio y se le manda el correo para que defina su contraseña."
      )
    )
      return;

    await correr(`alta-${a.id}`, () => crearCuentaDesdeAlta(a.id), (res) => {
      // El alta puede necesitar que un humano elija la ficha (nombre parecido, o
      // dos fichas empatadas). Eso no se resuelve desde un renglón: se avisa y se
      // manda al panel de altas, que tiene el selector.
      if (res && typeof res === "object" && "requiereDecision" in res) {
        toast.warning("Hay que elegir la ficha a mano", {
          description: (res as { error?: string }).error,
          action: { label: "Ir a Altas", onClick: () => router.push("/admin/altas") },
        });
        return;
      }
      const enviado = res && typeof res === "object" && "emailEnviado" in res && res.emailEnviado;
      toast.success(`${a.nombre} ya tiene acceso`, {
        description: enviado
          ? "Le mandamos el correo para definir su contraseña."
          : "El correo no salió: revisalo desde Altas de socios.",
      });
    });
  }

  async function habilitar(p: Persona) {
    if (!confirm(`Habilitar el acceso de ${p.nombre}?\n\nSe activa el perfil, se levanta el bloqueo y se le confirma el correo.`))
      return;
    const avisar = confirm(`¿Le mandamos el correo avisándole que ya puede entrar?\n\nVa a ${p.email}.\n\nCancelar = lo habilitamos igual, sin mandar nada.`);
    await correr(`persona-${p.id}`, () => toggleActivarUsuario(p.id, true, { avisarPorEmail: avisar }), () => {
      toast.success(`${p.nombre} ya puede entrar`);
    });
  }

  async function aprobar(e: EmpresaPendiente) {
    if (!confirm(`Publicar la ficha de ${e.nombre} en el directorio?`)) return;
    await correr(`emp-${e.id}`, () => aprobarEmpresa(e.id), () => {
      toast.success(`${e.nombre} ya está publicada`);
    });
  }

  async function rechazar(e: EmpresaPendiente) {
    const motivo = prompt(`¿Por qué se rechaza la ficha de ${e.nombre}?\n\nEl motivo le llega por correo.`);
    if (!motivo || !motivo.trim()) return;
    await correr(`emp-${e.id}`, () => rechazarEmpresa(e.id, motivo.trim()), () => {
      toast.success(`${e.nombre} quedó rechazada`);
    });
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg ring-1 ring-slate-100 p-8 text-center">
        <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Check className="w-5 h-5" />
        </div>
        <p className="font-bold text-slate-900">No hay nada esperándote</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Ninguna socia pidió acceso, ninguna persona quedó trabada y no hay fichas ni reseñas
          por revisar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg ring-1 ring-slate-100 p-4 sm:p-5 space-y-6">
      {bandeja.altas.length > 0 && (
        <Grupo
          titulo={`Socias esperando el acceso (${bandeja.altas.length})`}
          ayuda="Cargaron sus datos y todavía no pueden entrar."
          verTodo={{ href: "/admin/altas", etiqueta: "Ver todas" }}
        >
          {bandeja.altas.map((a) => (
            <Fila
              key={a.id}
              icono={UserPlus}
              tono="bg-primary-50 text-primary-700"
              titulo={a.nombre}
              detalle={`${a.referente} · ${a.email}`}
              meta={
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-slate-200/70 text-slate-600">
                    {a.porRegistro ? "Se registró sola" : "Vino por Sumate"}
                  </span>
                  {a.yaVinculada && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700">
                      Ficha vinculada
                    </span>
                  )}
                  {a.contactada && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-slate-200/70 text-slate-600">
                      Ya contactada
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{haceCuanto(a.fecha)}</span>
                </div>
              }
            >
              <button
                onClick={() => darAcceso(a)}
                disabled={ocupado !== null}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                {ocupado === `alta-${a.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                Dar acceso
              </button>
            </Fila>
          ))}
        </Grupo>
      )}

      {bandeja.personas.length > 0 && (
        <Grupo
          titulo={`Personas que no pueden entrar (${bandeja.personas.length})`}
          ayuda="Tienen cuenta pero algo las frena: desactivadas, bloqueadas o sin confirmar el correo."
          verTodo={{ href: "/admin/usuarios?estado=pendientes", etiqueta: "Ver todas" }}
        >
          {bandeja.personas.map((p) => (
            <Fila
              key={p.id}
              icono={UserCheck}
              tono="bg-rose-50 text-rose-700"
              titulo={p.nombre}
              detalle={p.email}
              meta={<p className="text-[10px] text-slate-400 mt-1">Se registró {haceCuanto(p.fecha)}</p>}
            >
              <button
                onClick={() => habilitar(p)}
                disabled={ocupado !== null}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                {ocupado === `persona-${p.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                Habilitar
              </button>
            </Fila>
          ))}
        </Grupo>
      )}

      {bandeja.empresas.length > 0 && (
        <Grupo
          titulo={`Fichas por revisar (${bandeja.empresas.length})`}
          ayuda="Se registraron por su cuenta y todavía no están en el directorio."
          verTodo={{ href: "/admin/empresas", etiqueta: "Ver todas" }}
        >
          {bandeja.empresas.map((e) => (
            <Fila
              key={e.id}
              icono={Building}
              tono="bg-blue-50 text-blue-700"
              titulo={e.nombre}
              detalle={[e.email, e.localidad].filter(Boolean).join(" · ") || "Sin datos de contacto"}
              meta={<p className="text-[10px] text-slate-400 mt-1">{haceCuanto(e.fecha)}</p>}
            >
              <button
                onClick={() => aprobar(e)}
                disabled={ocupado !== null}
                title="Publicar en el directorio"
                className="inline-flex items-center justify-center w-9 h-9 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors"
              >
                {ocupado === `emp-${e.id}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => rechazar(e)}
                disabled={ocupado !== null}
                title="Rechazar"
                className="inline-flex items-center justify-center w-9 h-9 rounded bg-white ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Fila>
          ))}
        </Grupo>
      )}

      {bandeja.resenas.length > 0 && (
        <Grupo
          titulo={`Reseñas por moderar (${bandeja.resenas.length})`}
          ayuda="Hay que leerlas antes de decidir, así que se resuelven en su pantalla."
          verTodo={{ href: "/admin/resenas", etiqueta: "Moderar" }}
        >
          {bandeja.resenas.map((r) => (
            <Fila
              key={r.id}
              icono={MessageSquare}
              tono="bg-amber-50 text-amber-700"
              titulo={`${r.calificacion} de 5`}
              detalle={r.comentario || "Sin comentario"}
              meta={<p className="text-[10px] text-slate-400 mt-1">{haceCuanto(r.fecha)}</p>}
            >
              <Link
                href="/admin/resenas"
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Leer
              </Link>
            </Fila>
          ))}
        </Grupo>
      )}
    </div>
  );
}
