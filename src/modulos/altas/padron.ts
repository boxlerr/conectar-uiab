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

/**
 * Deja sólo los dígitos del CUIT ("30-12345678-9" → "30123456789").
 * Con menos de 8 dígitos devuelve null, para no matchear basura contra strings
 * cortos. Vive acá y no en la server action del alta porque el padrón se
 * consulta desde tres lados — el alta de /sumate, /api/auth/check-cuit y
 * register-sync — y comparar con criterios distintos es justamente lo que dejó
 * a Metalúrgica Longchamps duplicada: "30-71232689-8" en el padrón contra
 * "30712326898" en el registro.
 */
export function normalizarCuit(v: string | null | undefined): string | null {
  const digitos = (v ?? "").replace(/\D/g, "");
  return digitos.length < 8 ? null : digitos;
}

/**
 * Formas societarias y sus pedazos sueltos. Después de sacar la puntuación,
 * "S.R.L." queda como tres tokens ("s", "r", "l") y "S.A.I.C.I.F.Y.A" como ocho,
 * así que la lista incluye las letras solas: se recortan de a una desde el final.
 */
const FORMAS_SOCIETARIAS = new Set([
  "s", "a", "r", "l", "c", "i", "f", "y", "h",
  "sa", "srl", "sas", "sh", "sca", "scs", "sac", "saic", "sacif", "sacifi",
  "ltda", "limitada", "soc", "sociedad", "anonima", "resp", "responsabilidad",
  "coop",
]);

/**
 * Palabras que no distinguen a una empresa de otra. No se borran del nombre
 * normalizado (ahí importa la igualdad literal), sólo se ignoran al comparar
 * "¿es la misma empresa escrita más larga?".
 */
const PALABRAS_VACIAS = new Set([
  "empresa", "empresas", "establecimiento", "establecimientos", "grupo",
  "cia", "compania", "y", "e", "de", "del", "la", "el", "los", "las",
]);

/**
 * Nombre de empresa comparable: sin acentos, sin puntuación, en minúsculas y sin
 * la forma societaria del final.
 *
 * "EMPRESA TRANSPORTE GAV SRL" → "empresa transporte gav"
 * "A. D. BARBIERI S.A."        → "a d barbieri"
 * "Pinturería Giannoni S.A."   → "pintureria giannoni"
 *
 * También se van los corchetes con anotaciones internas ("[DUPLICADA — retirada
 * 2026-08-04]"), que son nuestras y no parte del nombre de nadie.
 */
export function normalizarNombreEmpresa(v: string | null | undefined): string {
  if (!v) return "";
  const sinAcentos = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const sinAnotaciones = sinAcentos.replace(/\[.*?\]/g, " ");
  const tokens = sinAnotaciones.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && FORMAS_SOCIETARIAS.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(" ");
}

/** Los tokens del nombre que de verdad identifican a la empresa. */
export function tokensSignificativos(v: string | null | undefined): string[] {
  return normalizarNombreEmpresa(v)
    .split(" ")
    .filter((t) => t.length > 1 && !PALABRAS_VACIAS.has(t));
}

/**
 * ¿Son el mismo nombre, uno escrito más largo que el otro?
 *
 * El caso que motivó esto: la ficha del padrón dice "Transporte Gav" y la empresa
 * se registró como "EMPRESA TRANSPORTE GAV SRL". Sin CUIT en la ficha del padrón
 * — 6 de las 63 no lo tienen — el único puente entre las dos es el nombre.
 *
 * Se exige que TODOS los tokens significativos del más corto estén en el más
 * largo, y que el más corto aporte al menos dos tokens o uno de cuatro letras
 * para arriba. "gav" solo no alcanza; "transporte gav" sí.
 */
export function nombreContenido(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const ta = tokensSignificativos(a);
  const tb = tokensSignificativos(b);
  if (ta.length === 0 || tb.length === 0) return false;

  const [corto, largo] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (corto.length < 2 && !corto.some((t) => t.length >= 4)) return false;

  const enLargo = new Set(largo);
  return corto.every((t) => enLargo.has(t));
}

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
  { columna: "email_mantenimiento", desdeAlta: "email_mantenimiento", etiqueta: "Correo de mantenimiento", pisa: false },
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
