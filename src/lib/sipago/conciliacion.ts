/**
 * Leer el reporte de Cobros de Sipago.
 *
 * El plan recurrente cobra solo, pero no avisa: no hay webhook ni API pública
 * para el módulo de Suscripciones del portal. La única forma de que la
 * plataforma se entere es que alguien traiga el reporte de
 * `portal.sipago.coop → Suscripciones → Cobros → Generar reporte`.
 *
 * ESTE PARSER NO MIRA LOS NOMBRES DE LAS COLUMNAS, A PROPÓSITO.
 *
 * No tenemos el formato del reporte —cuando se escribió esto la cuenta todavía
 * no tenía ningún cobro— y aunque lo tuviéramos, atarse a los encabezados
 * significa romperse el día que Sipago traduzca un título o agregue una columna.
 * En vez de eso se reconoce cada dato por su forma: un CUIT son once dígitos con
 * un prefijo válido, un importe tiene separadores de miles y coma decimal, una
 * fecha se parece a una fecha. Es la diferencia entre un importador que
 * sobrevive un cambio de formato y uno que hay que arreglar cada vez.
 *
 * Módulo puro: no habla con la base ni con la red, así que se puede probar
 * entero.
 */

export interface FilaCobro {
  /** CUIT normalizado a 11 dígitos. Es la clave contra `empresas.cuit`. */
  cuit: string;
  /** Importe en PESOS, o null si la fila no traía uno reconocible. */
  monto: number | null;
  /** Fecha del cobro en ISO (sólo el día), o null. */
  fecha: string | null;
  /** true = cobro exitoso. Sólo estos activan una suscripción. */
  aprobado: boolean;
  /** Lo que hubiera de referencia/autorización, para el comprobante. */
  referencia: string | null;
  /** La fila tal cual vino, para poder mostrarla si algo no cierra. */
  crudo: string[];
}

export interface ResultadoParseo {
  filas: FilaCobro[];
  /** Líneas que no tenían un CUIT reconocible (encabezados, totales, basura). */
  ignoradas: number;
  /** Qué separador se detectó. Útil para mostrarlo si el resultado sorprende. */
  separador: string;
}

const SEPARADORES = [";", "\t", ",", "|"];

/**
 * Los prefijos válidos de CUIT/CUIL en Argentina. Sin esto, cualquier número de
 * once dígitos —un teléfono con característica, un número de operación— se
 * colaba como si fuera un CUIT.
 */
const PREFIJOS_CUIT = new Set(["20", "23", "24", "27", "30", "33", "34"]);

// Sin `\b` al final a propósito: son raíces, no palabras. `\baprobad\b` no
// matchea "APROBADO" —la "o" que sigue es carácter de palabra— y el estado se
// colaba después como número de referencia.
const APROBADO = /\b(aprobad|approved|success|exitos|cobrad|acreditad|pagad|ok)/i;
const RECHAZADO = /\b(rechazad|denied|declin|fail|error|pendiente|cancelad|vencid)/i;

/** Detecta el separador contando cuál aparece parejo en todas las líneas. */
export function detectarSeparador(lineas: string[]): string {
  let mejor = ";";
  let mejorPuntaje = -1;
  for (const sep of SEPARADORES) {
    const cuentas = lineas.map((l) => l.split(sep).length);
    const columnas = Math.max(...cuentas);
    if (columnas < 2) continue;
    // Se premia que TODAS las líneas tengan la misma cantidad de columnas: un
    // separador equivocado parte cada línea en una cantidad distinta.
    const parejas = cuentas.filter((c) => c === columnas).length / cuentas.length;
    const puntaje = columnas * parejas;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = sep;
    }
  }
  return mejor;
}

/** Deja sólo los dígitos y valida que sea un CUIT plausible. */
export function normalizarCuit(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length !== 11) return null;
  if (!PREFIJOS_CUIT.has(digitos.slice(0, 2))) return null;
  return digitos;
}

/**
 * Importes en formato argentino: "1.234,56", "$ 50.000,00", "50000".
 *
 * El punto es separador de miles y la coma es decimal, al revés que en inglés.
 * Leer "50.000" como cincuenta con cero decimales sería descartar un cobro por
 * no llegar al monto esperado.
 */
export function parsearMonto(valor: string): number | null {
  const limpio = valor.replace(/[^\d.,-]/g, "").trim();
  if (!limpio || !/\d/.test(limpio)) return null;

  const tieneComa = limpio.includes(",");
  const tienePunto = limpio.includes(".");

  let normal: string;
  if (tieneComa && tienePunto) {
    // El último que aparece es el decimal.
    normal = limpio.lastIndexOf(",") > limpio.lastIndexOf(".")
      ? limpio.replace(/\./g, "").replace(",", ".")
      : limpio.replace(/,/g, "");
  } else if (tieneComa) {
    // "1234,56" decimal; "1,234" con tres dígitos después es separador de miles.
    const [, dec] = limpio.split(",");
    normal = dec && dec.length === 3 ? limpio.replace(",", "") : limpio.replace(",", ".");
  } else if (tienePunto) {
    const [, dec] = limpio.split(".");
    normal = dec && dec.length === 3 ? limpio.replace(/\./g, "") : limpio;
  } else {
    normal = limpio;
  }

  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

/** Fechas dd/mm/aaaa, dd-mm-aaaa e ISO. Devuelve "aaaa-mm-dd". */
export function parsearFecha(valor: string): string | null {
  const t = valor.trim();

  // Sin `\b` final: en "2026-08-20T15:04:00Z" el día pega contra la "T" y no hay
  // borde de palabra, así que la fecha con hora no se reconocía.
  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const latino = t.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (latino) {
    const [, d, m, a] = latino;
    const anio = a.length === 2 ? `20${a}` : a;
    const dia = d.padStart(2, "0");
    const mes = m.padStart(2, "0");
    if (Number(mes) < 1 || Number(mes) > 12) return null;
    if (Number(dia) < 1 || Number(dia) > 31) return null;
    return `${anio}-${mes}-${dia}`;
  }
  return null;
}

function esColumnaDeEstado(celda: string): "aprobado" | "rechazado" | null {
  if (APROBADO.test(celda)) return "aprobado";
  if (RECHAZADO.test(celda)) return "rechazado";
  return null;
}

/**
 * Convierte el reporte pegado en filas utilizables.
 *
 * Una fila entra sólo si tiene un CUIT: eso descarta encabezados, totales y
 * líneas en blanco sin tener que adivinar cuál era el encabezado.
 */
export function parsearReporteCobros(texto: string): ResultadoParseo {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lineas.length === 0) return { filas: [], ignoradas: 0, separador: ";" };

  const separador = detectarSeparador(lineas);
  const filas: FilaCobro[] = [];
  let ignoradas = 0;

  for (const linea of lineas) {
    const celdas = linea.split(separador).map((c) => c.trim().replace(/^"|"$/g, ""));

    let cuit: string | null = null;
    let monto: number | null = null;
    let fecha: string | null = null;
    let estado: "aprobado" | "rechazado" | null = null;
    let referencia: string | null = null;

    for (const celda of celdas) {
      if (!cuit) {
        const c = normalizarCuit(celda);
        if (c) { cuit = c; continue; }
      }
      if (!fecha) {
        const f = parsearFecha(celda);
        if (f) { fecha = f; continue; }
      }
      if (!estado) {
        const e = esColumnaDeEstado(celda);
        if (e) { estado = e; continue; }
      }
      // El importe se busca al final: un CUIT y una fecha también son números y
      // se los comerían las reglas de monto si fueran primero.
      if (monto === null && /\d/.test(celda) && !/^\d{11}$/.test(celda.replace(/\D/g, ""))) {
        const m = parsearMonto(celda);
        if (m !== null && m > 0) { monto = m; continue; }
      }
      if (!referencia && /^[A-Za-z0-9-]{6,}$/.test(celda)) referencia = celda;
    }

    if (!cuit) { ignoradas++; continue; }

    filas.push({
      cuit,
      monto,
      fecha,
      // Sin columna de estado se asume que el reporte lista cobros hechos. Es la
      // lectura conservadora del lado correcto: el importe se valida igual
      // contra lo que la suscripción debería costar antes de activar nada.
      aprobado: estado !== "rechazado",
      referencia,
      crudo: celdas,
    });
  }

  return { filas, ignoradas, separador };
}

// ─── Qué hacer con cada fila ────────────────────────────────────────────────

export type AccionConciliacion =
  | "activar"
  | "ya_registrado"
  | "cuit_desconocido"
  | "rechazado"
  | "cortesia"
  | "monto_no_coincide";

export interface EntradaDecision {
  fila: FilaCobro;
  /** La ficha que matcheó por CUIT, o null si ninguna. */
  entidad: { nombre: string } | null;
  /** Su suscripción más reciente, si tiene. */
  suscripcion: { metodo_pago: string | null; monto: number | string | null } | null;
  /** ¿Este mismo cobro ya está cargado? */
  yaCargado: boolean;
}

/**
 * La decisión, sin base de datos de por medio.
 *
 * Vive separada del endpoint para poder probarla sola, porque acá está la regla
 * que más caro sale romper: **a las socias del padrón no se les cobra**. Son 57
 * empresas con acceso de cortesía por decisión de la UIAB, y sólo se cobra a las
 * que se dan de alta nuevas por el registro. Si una apareciera en un reporte
 * —por un cobro de prueba, por un CUIT repetido, por un dedazo— activarle una
 * suscripción paga le cambiaría el estado por algo que nadie decidió.
 *
 * El orden de los chequeos importa: cortesía se pregunta ANTES que el monto y
 * que cualquier otra cosa, así que ninguna rama posterior puede pasarla por
 * arriba.
 */
export function decidirAccion(e: EntradaDecision): { accion: AccionConciliacion; detalle: string } {
  if (!e.fila.aprobado) {
    return { accion: "rechazado", detalle: "El reporte lo marca como no cobrado." };
  }

  if (!e.entidad) {
    return { accion: "cuit_desconocido", detalle: "Ningún socio tiene este CUIT cargado." };
  }

  const esCortesia =
    e.suscripcion !== null &&
    (e.suscripcion.metodo_pago === "cortesia" || Number(e.suscripcion.monto) === 0);

  if (esCortesia) {
    return { accion: "cortesia", detalle: "Es socia del padrón, tiene acceso sin cargo. No se toca." };
  }

  if (e.yaCargado) {
    return { accion: "ya_registrado", detalle: "Este cobro ya estaba cargado." };
  }

  const esperado = Number(e.suscripcion?.monto) || 0;
  if (e.fila.monto !== null && esperado > 0 && Math.abs(e.fila.monto - esperado) > 0.5) {
    return {
      accion: "monto_no_coincide",
      detalle:
        `El reporte dice $${e.fila.monto.toLocaleString("es-AR")} y ` +
        `la suscripción figura en $${esperado.toLocaleString("es-AR")}.`,
    };
  }

  return { accion: "activar", detalle: "Se va a registrar el pago y activar la suscripción." };
}
