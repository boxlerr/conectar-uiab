"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Copy,
  Loader2,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import type { Match } from "@/modulos/oportunidades/servicio-oportunidades";
import {
  cerrarOportunidadPropia,
  duplicarOportunidad,
  eliminarOportunidadPropia,
  type ResultadoAccionDuena,
} from "./acciones";
import { DialogoInvitar } from "./DialogoInvitar";

const manrope = { fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" } as const;

type Confirmacion = "duplicar" | "cerrar" | "eliminar" | null;

/**
 * Tarjeta "Acciones rápidas" del dueño: invitar, duplicar, cerrar y eliminar.
 * Cerrar y eliminar confirman antes (eliminar no tiene vuelta atrás); duplicar
 * también, porque crea una publicación nueva visible para toda la red.
 */
export function AccionesRapidas({
  oportunidadId,
  estado,
  candidatos,
  onCerrada,
}: {
  oportunidadId: string;
  estado: string;
  candidatos: Match[];
  /** La página actualiza su estado local sin refetch. */
  onCerrada: () => void;
}) {
  const router = useRouter();
  const [confirmacion, setConfirmacion] = useState<Confirmacion>(null);
  const [invitarAbierto, setInvitarAbierto] = useState(false);
  const [enCurso, startTransition] = useTransition();

  const abierta = estado === "abierta";

  const ejecutar = (
    accion: () => Promise<ResultadoAccionDuena>,
    despues: (resultado: ResultadoAccionDuena) => void
  ) => {
    startTransition(async () => {
      const resultado = await llamarAccion(accion);
      if (fallo(resultado) || !resultado.success) {
        toast.error("No se pudo completar", {
          description: fallo(resultado) ? resultado.error : resultado.error,
        });
        setConfirmacion(null);
        return;
      }
      despues(resultado);
    });
  };

  const manejarConfirmar = () => {
    if (confirmacion === "duplicar") {
      ejecutar(
        () => duplicarOportunidad(oportunidadId),
        (resultado) => {
          toast.success("Copia creada", {
            description: "Estás viendo la nueva oportunidad. Editala para ajustar lo que necesites.",
          });
          if (resultado.redirect) {
            router.push(resultado.redirect);
            router.refresh();
          }
        }
      );
    } else if (confirmacion === "cerrar") {
      ejecutar(
        () => cerrarOportunidadPropia(oportunidadId),
        () => {
          toast.success("Oportunidad cerrada", {
            description: "Ya no recibe postulaciones ni aparece en la cartelera.",
          });
          setConfirmacion(null);
          onCerrada();
          router.refresh();
        }
      );
    } else if (confirmacion === "eliminar") {
      ejecutar(
        () => eliminarOportunidadPropia(oportunidadId),
        () => {
          toast.success("Oportunidad eliminada");
          router.push("/oportunidades");
          router.refresh();
        }
      );
    }
  };

  const TEXTOS: Record<
    Exclude<Confirmacion, null>,
    { titulo: string; descripcion: string; boton: string; destructiva: boolean }
  > = {
    duplicar: {
      titulo: "¿Duplicar esta oportunidad?",
      descripcion:
        "Se crea una copia abierta con los mismos datos, etiquetas y archivos, lista para editar y publicar de nuevo.",
      boton: "Crear copia",
      destructiva: false,
    },
    cerrar: {
      titulo: "¿Cerrar esta oportunidad?",
      descripcion:
        "Deja de aparecer en la cartelera y de recibir postulaciones. Las conversaciones ya iniciadas siguen en tu bandeja.",
      boton: "Cerrar oportunidad",
      destructiva: true,
    },
    eliminar: {
      titulo: "¿Eliminar esta oportunidad?",
      descripcion:
        "Se borra la publicación, sus archivos y los candidatos sugeridos. Esta acción no se puede deshacer.",
      boton: "Eliminar definitivamente",
      destructiva: true,
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
      <p className="px-4 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Acciones rápidas
      </p>

      <div className="p-2">
        {abierta && (
          <FilaAccion
            icono={<UserPlus className="h-5 w-5" aria-hidden="true" />}
            tono="azul"
            titulo="Invitar proveedores"
            subtitulo="Sumá empresas a tu oportunidad"
            onClick={() => setInvitarAbierto(true)}
          />
        )}
        <FilaAccion
          icono={<Copy className="h-5 w-5" aria-hidden="true" />}
          tono="azul"
          titulo="Duplicar oportunidad"
          subtitulo="Crear una copia para reutilizar"
          onClick={() => setConfirmacion("duplicar")}
        />
        {abierta && (
          <FilaAccion
            icono={<XCircle className="h-5 w-5" aria-hidden="true" />}
            tono="rojo"
            titulo="Cerrar oportunidad"
            subtitulo="Marcar como cerrada"
            onClick={() => setConfirmacion("cerrar")}
          />
        )}
        <FilaAccion
          icono={<Trash2 className="h-5 w-5" aria-hidden="true" />}
          tono="rojo"
          titulo="Eliminar oportunidad"
          subtitulo="Esta acción no se puede deshacer"
          onClick={() => setConfirmacion("eliminar")}
        />
      </div>

      {confirmacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !enCurso && setConfirmacion(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={TEXTOS[confirmacion].titulo}
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(evento) => evento.stopPropagation()}
          >
            <h3 style={manrope} className="text-xl font-black tracking-tight text-[#00213f]">
              {TEXTOS[confirmacion].titulo}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {TEXTOS[confirmacion].descripcion}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                disabled={enCurso}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={manejarConfirmar}
                disabled={enCurso}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                  TEXTOS[confirmacion].destructiva
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {enCurso && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {TEXTOS[confirmacion].boton}
              </button>
            </div>
          </div>
        </div>
      )}

      {invitarAbierto && (
        <DialogoInvitar
          oportunidadId={oportunidadId}
          candidatos={candidatos}
          onCerrar={() => setInvitarAbierto(false)}
        />
      )}
    </div>
  );
}

function FilaAccion({
  icono,
  tono,
  titulo,
  subtitulo,
  onClick,
}: {
  icono: React.ReactNode;
  tono: "azul" | "rojo";
  titulo: string;
  subtitulo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          tono === "rojo" ? "bg-red-50 text-red-500" : "bg-primary-50 text-primary-600"
        }`}
      >
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-bold ${
            tono === "rojo" ? "text-red-600" : "text-[#00213f]"
          }`}
        >
          {titulo}
        </span>
        <span className="block truncate text-xs text-slate-400">{subtitulo}</span>
      </span>
      <ArrowRight
        className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 ${
          tono === "rojo" ? "text-red-300" : "text-slate-300"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
