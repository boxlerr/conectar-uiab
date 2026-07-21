// Fusión entre lo que la socia cargó en /sumate y la ficha que ya existía en el
// padrón UIAB (el caso normal: la empresa ya es socia, así que su fila en
// `empresas` viene del padrón importado).
//
// Regla definida por UIAB:
//  - `email` y `telefono` del formulario PISAN al padrón: son los datos con los
//    que la socia se registró, y a ese correo le llegó la invitación.
//  - El resto sólo COMPLETA lo que está vacío. El padrón no se degrada: el
//    formulario de Metalúrgica Longchamps, por ejemplo, traía el sitio web mal
//    escrito ("metlongchamps.cm") y la dirección abreviada, y el padrón tenía
//    las dos bien.
//  - Toda diferencia real queda en `altas_socios.conflictos_padron` para
//    mostrársela a la socia en su primer ingreso y que confirme cuál va.
//
// Módulo puro a propósito: sin "use server" ni "server-only", porque lo importan
// tanto la server action del alta como el banner (client component) del
// dashboard. Ver la nota de server-only + Turbopack en el historial del repo.

export type OrigenDato = "formulario" | "padron";

export type ConflictoPadron = {
  /** Columna de `empresas` en disputa. */
  campo: string;
  /** Cómo se lo nombramos a la socia. */
  etiqueta: string;
  valor_formulario: string;
  valor_padron: string;
  /** Cuál de los dos quedó guardado al crear la cuenta. */
  aplicado: OrigenDato;
  /** La socia ya lo revisó desde su panel. */
  resuelto?: boolean;
};

type Regla = {
  /** Columna destino en `empresas`. */
  columna: string;
  /** Columna de origen en `altas_socios`. */
  desdeAlta: string;
  etiqueta: string;
  /** true → el formulario pisa al padrón; false → sólo completa si está vacío. */
  pisa: boolean;
  /** No genera aviso: campo interno, la socia no lo ve en ninguna ficha. */
  silencioso?: boolean;
};

// `descripcion` toma la actividad declarada en el formulario y NO pisa a
// `empresas.actividad` (el rubro del padrón, estilo AFIP): son dos textos
// distintos y las fichas públicas muestran `descripcion || actividad`.
const REGLAS: Regla[] = [
  { columna: "email", desdeAlta: "email", etiqueta: "Correo", pisa: true },
  { columna: "email_compras", desdeAlta: "email_compras", etiqueta: "Correo de compras", pisa: false },
  { columna: "telefono", desdeAlta: "telefono", etiqueta: "Teléfono", pisa: true },
  { columna: "nombre_comercial", desdeAlta: "nombre_comercial", etiqueta: "Nombre comercial", pisa: false },
  { columna: "sitio_web", desdeAlta: "sitio_web", etiqueta: "Sitio web", pisa: false },
  { columna: "direccion", desdeAlta: "direccion", etiqueta: "Dirección", pisa: false },
  { columna: "localidad", desdeAlta: "localidad", etiqueta: "Localidad", pisa: false },
  { columna: "descripcion", desdeAlta: "actividad", etiqueta: "Descripción", pisa: false },
  { columna: "referente", desdeAlta: "referente_nombre", etiqueta: "Referente", pisa: false },
  { columna: "email_referente", desdeAlta: "email", etiqueta: "Correo del referente", pisa: false, silencioso: true },
  { columna: "n_socio", desdeAlta: "n_socio", etiqueta: "N° de socio", pisa: false },
  { columna: "cuit", desdeAlta: "cuit", etiqueta: "CUIT", pisa: false },
];

const REGLA_POR_COLUMNA = new Map(REGLAS.map((r) => [r.columna, r]));

/** Sólo estas columnas puede tocar la socia al resolver un conflicto. */
export function reglaDeCampo(campo: string): Regla | undefined {
  return REGLA_POR_COLUMNA.get(campo);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Compara "el mismo dato escrito distinto" sin marcarlo como conflicto:
// "30-71232689-8" y "30712326898" son el mismo CUIT, y "www.sitio.com/" y
// "https://sitio.com" el mismo sitio.
function normalizar(columna: string, valor: string): string {
  const base = valor.trim().toLowerCase().replace(/\s+/g, " ");
  if (columna === "cuit") return base.replace(/\D/g, "");
  if (columna === "telefono") return base.replace(/\D/g, "");
  if (columna === "sitio_web") {
    return base.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  }
  return base;
}

/**
 * Devuelve qué escribir en `empresas` y qué diferencias avisarle a la socia.
 * Nunca produce un cambio que borre un dato existente.
 */
export function fusionarConPadron(
  alta: Record<string, unknown>,
  empresa: Record<string, unknown>
): { cambios: Record<string, string>; conflictos: ConflictoPadron[] } {
  const cambios: Record<string, string> = {};
  const conflictos: ConflictoPadron[] = [];

  for (const regla of REGLAS) {
    const delFormulario = texto(alta[regla.desdeAlta]);
    if (!delFormulario) continue; // sin dato nuevo no hay nada que hacer

    const delPadron = texto(empresa[regla.columna]);

    if (!delPadron) {
      cambios[regla.columna] = delFormulario; // dato faltante → se completa
      continue;
    }

    if (normalizar(regla.columna, delFormulario) === normalizar(regla.columna, delPadron)) {
      continue; // mismo dato, distinta escritura
    }

    if (regla.pisa) cambios[regla.columna] = delFormulario;
    if (regla.silencioso) continue;

    conflictos.push({
      campo: regla.columna,
      etiqueta: regla.etiqueta,
      valor_formulario: delFormulario,
      valor_padron: delPadron,
      aplicado: regla.pisa ? "formulario" : "padron",
    });
  }

  return { cambios, conflictos };
}

/** Los que todavía le pedimos confirmar a la socia. */
export function conflictosPendientes(conflictos: ConflictoPadron[] | null | undefined) {
  return (conflictos ?? []).filter((c) => !c.resuelto);
}
