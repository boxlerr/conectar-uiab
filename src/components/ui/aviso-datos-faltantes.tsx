import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

/**
 * Aviso en el panel de la socia cuando a su ficha le faltan datos de contacto.
 *
 * Tres fichas del padrón no tienen NI correo NI teléfono, y otras 36 tienen uno
 * solo. Eso no es un detalle cosmético: es una ficha publicada en el directorio
 * por la que nadie puede contactarlas, que es exactamente para lo que están ahí.
 * Y del lado de la UIAB tampoco hay a dónde escribirles.
 *
 * Se muestra sólo si falta algo, y nombra qué falta: un "completá tu perfil"
 * genérico no mueve a nadie.
 */

export type CamposFaltantes = {
  email: boolean;
  telefono: boolean;
  descripcion: boolean;
  logo: boolean;
};

/** Qué le falta a la ficha, mirando lo que de verdad importa para que la encuentren. */
export function faltantesDeLaFicha(entidad: Record<string, unknown> | null): CamposFaltantes {
  const vacio = (v: unknown) => typeof v !== "string" || v.trim() === "";
  return {
    email: vacio(entidad?.email),
    telefono: vacio(entidad?.telefono) && vacio(entidad?.whatsapp),
    descripcion: vacio(entidad?.descripcion) && vacio(entidad?.actividad),
    logo: vacio(entidad?.ruta_logo),
  };
}

const ETIQUETAS: Record<keyof CamposFaltantes, string> = {
  email: "un correo de contacto",
  telefono: "un teléfono",
  descripcion: "una descripción de lo que hacen",
  logo: "el logo",
};

export function AvisoDatosFaltantes({ faltantes }: { faltantes: CamposFaltantes }) {
  const faltan = (Object.keys(ETIQUETAS) as (keyof CamposFaltantes)[]).filter((k) => faltantes[k]);
  if (faltan.length === 0) return null;

  // El contacto es lo urgente: sin eso la ficha no sirve para nada. El logo y la
  // descripción son "mejorala", y no ameritan el mismo tono.
  const sinContacto = faltantes.email || faltantes.telefono;

  const lista =
    faltan.length === 1
      ? ETIQUETAS[faltan[0]]
      : faltan.slice(0, -1).map((k) => ETIQUETAS[k]).join(", ") +
        " y " +
        ETIQUETAS[faltan[faltan.length - 1]];

  return (
    <div
      className={`rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
        sinContacto ? "bg-amber-50" : "bg-slate-100/70"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
          sinContacto ? "bg-amber-200/70 text-amber-800" : "bg-slate-200 text-slate-600"
        }`}
      >
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${sinContacto ? "text-amber-900" : "text-slate-800"}`}>
          {sinContacto
            ? "Tu ficha está publicada, pero nadie puede contactarte"
            : "A tu ficha le falta algo para lucirse"}
        </p>
        <p className={`text-xs mt-0.5 ${sinContacto ? "text-amber-800/80" : "text-slate-500"}`}>
          Falta cargar {lista}.
          {sinContacto
            ? " Sin datos de contacto, quien te encuentre en el directorio no tiene cómo escribirte."
            : " Las fichas completas reciben más consultas."}
        </p>
      </div>

      <Link
        href="/perfil/datos"
        className={`shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded text-sm font-bold transition-colors ${
          sinContacto
            ? "bg-amber-900 hover:bg-amber-950 text-white"
            : "bg-white hover:bg-slate-50 text-slate-700 ring-1 ring-slate-200"
        }`}
      >
        Completar ahora
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
