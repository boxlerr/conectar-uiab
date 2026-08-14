import "server-only";
import ExcelJS from "exceljs";

/**
 * El estilo común de los Excel que exporta el panel.
 *
 * Encabezado en el azul de la UIAB con texto blanco, filas zebra, grilla fina,
 * fila de totales opcional, encabezado fijo y autofiltro. La idea es que todos
 * los exports se vean igual y que la planilla sirva tal cual sale: se puede
 * filtrar y ordenar sin tocar nada.
 *
 * Mismo criterio que usamos en el sistema de Don Joaquín, con los colores de acá.
 */

const AZUL_UIAB = "FF00213F";
const AZUL_SECCION = "FF10375C";
const ZEBRA = "FFF5F8FA";
const BORDE = "FFD9E1E8";
const TOTAL_FONDO = "FFE8EEF3";
const TITULO = "FF00213F";

export type ColAlign = "l" | "c" | "r";

export type ColumnaPlanilla = {
  header: string;
  width?: number;
  align?: ColAlign;
  numFmt?: string;
};

export type ValorCelda = string | number | Date | boolean | null;

/** Resalta una fila entera según su contenido (ej: pintar a los que faltan). */
export type PintarFila = (valores: ValorCelda[], indice: number) => string | null;

export type OpcionesHoja = {
  columns: ColumnaPlanilla[];
  rows?: ValorCelda[][];
  title?: string;
  subtitle?: string;
  /** Línea chica que aclara de dónde salieron los datos y cuándo. */
  fuente?: string;
  totals?: ValorCelda[];
  /** Color de fondo (ARGB) por fila, para marcar lo que hay que mirar. */
  resaltar?: PintarFila;
};

function borde(color = BORDE) {
  const s = { style: "thin" as const, color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
}

function relleno(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function alineacion(a: ColAlign = "c"): Partial<ExcelJS.Alignment> {
  return {
    horizontal: a === "l" ? "left" : a === "r" ? "right" : "center",
    vertical: "middle",
  };
}

export function escribirHoja(ws: ExcelJS.Worksheet, opts: OpcionesHoja): void {
  const { columns, rows, title, subtitle, fuente, totals, resaltar } = opts;
  const n = columns.length;

  ws.columns = columns.map((c) => ({ width: c.width ?? 16 }));

  let fila = 1;
  const enUnaLinea = (texto: string, font: Partial<ExcelJS.Font>, alto?: number) => {
    ws.mergeCells(fila, 1, fila, n);
    const celda = ws.getCell(fila, 1);
    celda.value = texto;
    celda.font = font;
    celda.alignment = { horizontal: "left", vertical: "middle" };
    if (alto) ws.getRow(fila).height = alto;
    fila++;
  };

  if (title) {
    enUnaLinea(title, { bold: true, size: 14, color: { argb: TITULO } }, 24);
    if (subtitle) enUnaLinea(subtitle, { size: 10, color: { argb: "FF6B7A88" } });
    if (fuente) enUnaLinea(fuente, { size: 9, italic: true, color: { argb: "FF94A3B8" } });
    fila++;
  }

  // Encabezado.
  const filaEncabezado = fila;
  const he = ws.getRow(filaEncabezado);
  he.height = 24;
  columns.forEach((c, i) => {
    const celda = he.getCell(i + 1);
    celda.value = c.header;
    celda.fill = relleno(AZUL_UIAB);
    celda.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    celda.border = borde(AZUL_SECCION);
  });
  fila++;

  const escribirFila = (
    valores: ValorCelda[],
    estilo: { zebra?: boolean; total?: boolean; fondo?: string | null; alto?: number } = {}
  ) => {
    const r = ws.getRow(fila);
    r.height = estilo.alto ?? 17;
    columns.forEach((c, ci) => {
      const celda = r.getCell(ci + 1);
      celda.value = valores[ci] ?? null;
      if (c.numFmt && typeof valores[ci] === "number") celda.numFmt = c.numFmt;
      celda.alignment = { ...alineacion(c.align), wrapText: false };
      celda.border = borde();
      if (estilo.total) {
        celda.font = { bold: true, color: { argb: TITULO } };
        celda.fill = relleno(TOTAL_FONDO);
      } else if (estilo.fondo) {
        celda.fill = relleno(estilo.fondo);
      } else if (estilo.zebra) {
        celda.fill = relleno(ZEBRA);
      }
    });
    fila++;
  };

  (rows ?? []).forEach((valores, i) =>
    escribirFila(valores, { zebra: i % 2 === 1, fondo: resaltar?.(valores, i) ?? null })
  );

  const ultimaFilaDatos = fila - 1;
  if (totals) escribirFila(totals, { total: true, alto: 19 });

  // Encabezado fijo y autofiltro: la planilla se usa para trabajar, no para mirar.
  ws.views = [{ state: "frozen", ySplit: filaEncabezado }];
  if (ultimaFilaDatos > filaEncabezado) {
    ws.autoFilter = {
      from: { row: filaEncabezado, column: 1 },
      to: { row: ultimaFilaDatos, column: n },
    };
  }
}

export type Hoja = { name: string; opts: OpcionesHoja };

/** Arma el workbook y devuelve el buffer listo para descargar. */
export async function armarPlanilla(hojas: Hoja[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "UIAB Conecta";
  wb.created = new Date();

  if (hojas.length === 0) {
    wb.addWorksheet("Sin datos").getCell("A1").value = "No hay datos para exportar.";
  }

  const usados = new Set<string>();
  for (const h of hojas) {
    // Excel corta los nombres de hoja en 31 caracteres y no admite repetidos.
    let nombre = (h.name || "Hoja").slice(0, 31);
    let i = 2;
    while (usados.has(nombre)) nombre = `${(h.name || "Hoja").slice(0, 28)} ${i++}`;
    usados.add(nombre);
    escribirHoja(wb.addWorksheet(nombre), h.opts);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
