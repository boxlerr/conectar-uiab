"use client";

import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Building2, Users } from "lucide-react";

/**
 * Diferido: el visitante que llega en frío ve la pregunta y nunca el
 * formulario. Importado de una sumaba ~21 KB al JS de cada visita a /sumate
 * (medido antes del `load`); antes ni se bajaba, porque lo elegía el servidor.
 */
const FormularioAlta = dynamic(() => import("./FormularioAlta").then((m) => m.FormularioAlta));

export type EmpresaPublicada = {
  nombre: string;
  localidad: string | null;
  logoUrl: string | null;
};

/**
 * Lo de abajo del hero de /sumate: la pregunta de entrada o, si ya sabemos que
 * es socia, el formulario precargado con el listado al costado.
 *
 * Lo decide el query, y el query lo lee el navegador: si lo leyera el servidor
 * (`searchParams`) la página sería dinámica y no podría salir del CDN. El
 * Suspense tiene a la PREGUNTA de fallback a propósito: en el prerender
 * estático `useSearchParams` corta en este boundary, y lo que queda en el HTML
 * —lo que lee Google en /sumate— es justamente la pregunta.
 *
 * El listado viaja como DATOS y se dibuja acá: pasado como JSX desde el
 * servidor, el árbol entero (clases incluidas, ×60 empresas) iba serializado en
 * el payload de TODAS las visitas, y el HTML de /sumate pasaba de 59 a 113 KB.
 */
export function SumateSegunQuery({ pregunta, publicadas }: { pregunta: ReactNode; publicadas: EmpresaPublicada[] }) {
  return (
    <Suspense fallback={pregunta}>
      <SegunQuery pregunta={pregunta} publicadas={publicadas} />
    </Suspense>
  );
}

function SegunQuery({ pregunta, publicadas }: { pregunta: ReactNode; publicadas: EmpresaPublicada[] }) {
  // Los datos vienen de /register: si la empresa ya está en el padrón se corta
  // el registro y se la manda acá, con lo que ya había escrito puesto.
  const params = useSearchParams();
  const param = (clave: string) => params.get(clave) ?? undefined;

  /**
   * La pregunta de entrada sólo aparece cuando la persona llega en frío.
   *
   * Por qué existe: /sumate daba por sentado que quien entraba ya era socia, y
   * a quien no lo era lo rechazaba recién al final, con un toast, después de
   * haber cargado quince campos. Peor todavía: una socia rebotada desde
   * /register llegaba con el checkbox destildado y no lo tildaba —el sistema
   * acababa de decirle que YA era socia— así que el error la mandaba de vuelta
   * a /register, que la volvía a mandar acá. Preguntar primero corta el loop y
   * manda a cada uno por su camino antes de pedirle un solo dato.
   *
   * Si ya sabemos la respuesta (viene de /register, del panel de la UIAB, o ya
   * contestó) no se le pregunta de nuevo.
   */
  const yaSabemosQueEsSocia =
    param("socia") === "si" ||
    param("desde") === "registro" ||
    Boolean(param("empresa") || param("cuit") || param("referente"));

  if (!yaSabemosQueEsSocia) return pregunta;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Formulario ─── */}
        <div className="lg:col-span-7">
          <FormularioAlta
            desdeRegistro={param("desde") === "registro"}
            inicial={{
              // Ya contestó que es socia en la pregunta de entrada (o llegó
              // rebotada desde /register, que es el sistema diciéndole que lo
              // es): volver a pedirle que lo tilde era el paso donde se trababa.
              ya_es_socio: true,
              razon_social: param("empresa") ?? "",
              nombre_comercial: param("comercial") ?? "",
              cuit: param("cuit") ?? "",
              email: param("email") ?? "",
              telefono: param("telefono") ?? "",
              localidad: param("localidad") ?? "",
              referente_nombre: param("referente") ?? "",
            }}
          />
        </div>

        <ListadoPublicadas publicadas={publicadas} />
      </div>
    </div>
  );
}

/** ─── Listado en vivo ─── Las empresas que ya están en el directorio. */
function ListadoPublicadas({ publicadas }: { publicadas: EmpresaPublicada[] }) {
  return (
    <aside className="lg:col-span-5">
      <div className="bg-white rounded-xl shadow-2xl shadow-primary/5 overflow-hidden sticky top-20">
        <div className="bg-[#00213f] text-white px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold tracking-tight">Ya están en el directorio</h2>
            <p className="text-white/50 text-xs">
              {publicadas.length}{" "}
              {publicadas.length === 1
                ? "empresa de la red UIAB"
                : "empresas y entidades de la red UIAB"}
            </p>
          </div>
        </div>

        {publicadas.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Todavía no hay empresas publicadas. <br />¡Sé la primera!
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
            {publicadas.map((a, i) => {
              const nombre = a.nombre;
              return (
                <li key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                  {a.logoUrl ? (
                    // Caja apaisada: la mayoría de los logos son horizontales
                    // y en un cuadrado de 40px quedan ilegibles.
                    <div className="w-16 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      <Image
                        src={a.logoUrl}
                        alt={`Logo de ${nombre}`}
                        width={128}
                        height={96}
                        className="w-full h-full object-contain p-1.5"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold uppercase shrink-0 text-base">
                      {nombre.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{nombre}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {a.localidad ?? "Almirante Brown"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
