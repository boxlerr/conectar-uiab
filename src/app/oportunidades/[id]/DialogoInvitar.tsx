"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Building2, Check, Link2, Loader2, Send, User, X } from "lucide-react";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import type { Match } from "@/modulos/oportunidades/servicio-oportunidades";
import { urlPublicaDeLogo } from "@/modulos/oportunidades/solicitante";
import { invitarCandidatosAOportunidad } from "./acciones";

const manrope = { fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" } as const;

/** Tope que también aplica el action del lado del servidor. */
const MAX_SELECCION = 10;

/**
 * Invitar candidatos a cotizar: elegís entre los sugeridos por el match y les
 * llega una notificación con el link del detalle. Si el cruce todavía no
 * sugirió a nadie, queda el plan B de copiar el link.
 */
export function DialogoInvitar({
  oportunidadId,
  candidatos,
  onCerrar,
}: {
  oportunidadId: string;
  candidatos: Match[];
  onCerrar: () => void;
}) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [enviando, startTransition] = useTransition();

  const filas = useMemo(
    () =>
      candidatos
        .map((match) => {
          const esEmpresa = Boolean(match.empresa_candidata_id);
          const nombre = esEmpresa
            ? match.empresa?.nombre_comercial || match.empresa?.razon_social
            : match.proveedor?.nombre_comercial || match.proveedor?.nombre;
          if (!nombre) return null;
          return {
            id: match.id,
            esEmpresa,
            empresaId: match.empresa_candidata_id ?? null,
            proveedorId: match.proveedor_candidato_id ?? null,
            nombre,
            localidad: esEmpresa ? match.empresa?.localidad : match.proveedor?.localidad,
            logoUrl: urlPublicaDeLogo(
              esEmpresa ? match.empresa?.bucket_logo : match.proveedor?.bucket_logo,
              esEmpresa ? match.empresa?.ruta_logo : match.proveedor?.ruta_logo
            ),
          };
        })
        .filter((fila): fila is NonNullable<typeof fila> => fila !== null),
    [candidatos]
  );

  const alternar = (id: string) => {
    setSeleccion((previa) => {
      const proxima = new Set(previa);
      if (proxima.has(id)) {
        proxima.delete(id);
      } else if (proxima.size < MAX_SELECCION) {
        proxima.add(id);
      } else {
        toast.error(`Hasta ${MAX_SELECCION} invitaciones por vez.`);
      }
      return proxima;
    });
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/oportunidades/${oportunidadId}`
      );
      toast.success("Link copiado", {
        description: "Compartilo por donde quieras: correo, WhatsApp…",
      });
    } catch {
      toast.error("No se pudo copiar el link.");
    }
  };

  const enviar = () => {
    const elegidos = filas.filter((fila) => seleccion.has(fila.id));
    if (elegidos.length === 0) return;

    startTransition(async () => {
      const resultado = await llamarAccion(() =>
        invitarCandidatosAOportunidad(
          oportunidadId,
          elegidos.map((fila) => ({
            empresaId: fila.empresaId,
            proveedorId: fila.proveedorId,
          }))
        )
      );

      if (fallo(resultado) || !resultado.success) {
        toast.error("No se pudieron enviar", {
          description: fallo(resultado) ? resultado.error : resultado.error,
        });
        return;
      }

      toast.success(
        `Invitación enviada a ${elegidos.length} candidato${elegidos.length === 1 ? "" : "s"}`,
        { description: "Les llega una notificación con el link de tu oportunidad." }
      );
      onCerrar();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => !enviando && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invitar proveedores"
        className="flex max-h-[85svh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h3 style={manrope} className="text-xl font-black tracking-tight text-[#00213f]">
              Invitar proveedores
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Elegí candidatos sugeridos por el cruce y les avisamos con un link
              directo a tu oportunidad.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {filas.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm leading-relaxed text-slate-500">
                Todavía no hay candidatos sugeridos para invitar. Sumale
                etiquetas a tu oportunidad para que el cruce encuentre más
                coincidencias, o compartí el link directo.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filas.map((fila) => {
                const activa = seleccion.has(fila.id);
                return (
                  <li key={fila.id}>
                    <button
                      type="button"
                      onClick={() => alternar(fila.id)}
                      aria-pressed={activa}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                        activa
                          ? "border-primary-500 bg-primary-50/60"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      {fila.logoUrl ? (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white">
                          <Image
                            src={fila.logoUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-contain p-1"
                          />
                        </span>
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          {fila.esEmpresa ? (
                            <Building2 className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <User className="h-5 w-5" aria-hidden="true" />
                          )}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#00213f]">
                          {fila.nombre}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {fila.esEmpresa ? "Empresa socia" : "Prestador de servicios"}
                          {fila.localidad ? ` · ${fila.localidad}` : ""}
                        </span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          activa
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-slate-200 text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={copiarLink}
            disabled={enviando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || seleccion.size === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-50"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Invitar{seleccion.size > 0 ? ` (${seleccion.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
