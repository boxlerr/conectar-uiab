"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { FormularioAlta } from "./FormularioAlta";

/**
 * Lo de abajo del hero de /sumate: la pregunta de entrada o, si ya sabemos que
 * es socia, el formulario precargado con el listado al costado.
 *
 * Lo decide el query, y el query lo lee el navegador: si lo leyera el servidor
 * (`searchParams`) la página sería dinámica y no podría salir del CDN. El
 * Suspense tiene a la PREGUNTA de fallback a propósito: en el prerender
 * estático `useSearchParams` corta en este boundary, y lo que queda en el HTML
 * —lo que lee Google en /sumate— es justamente la pregunta.
 */
export function SumateSegunQuery({ pregunta, listado }: { pregunta: ReactNode; listado: ReactNode }) {
  return (
    <Suspense fallback={pregunta}>
      <SegunQuery pregunta={pregunta} listado={listado} />
    </Suspense>
  );
}

function SegunQuery({ pregunta, listado }: { pregunta: ReactNode; listado: ReactNode }) {
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

        {listado}
      </div>
    </div>
  );
}
