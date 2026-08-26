/**
 * Agregación de las visitas a la ficha, en memoria.
 *
 * POR QUÉ EN TYPESCRIPT Y NO EN SQL
 *
 * `visitas_perfil` no tiene ninguna función de agregación en Postgres: las 22
 * RPC de producción no la tocan. Armar la serie diaria con una RPC nueva
 * obligaría a una migración sólo para esto, cuando la tabla entera son ~200
 * filas y la de una socia son decenas. Se traen las crudas de los últimos 60
 * días y se agrupan acá — así, además, la lógica queda pura y verificable sin
 * base.
 *
 * Todo lo que sale de este archivo es un conteo real. No hay ningún número
 * estimado, proyectado ni de relleno: si no hay visitas, los campos vienen en
 * cero y la UI muestra el estado vacío. Es la misma regla que sostiene
 * `src/tests/seo/sin-datos-inventados.test.ts`.
 */

/** Lo mínimo que hace falta de cada fila de `visitas_perfil`. */
export interface FilaVisita {
  creado_en: string;
  visitante_perfil_id: string | null;
}

export interface PuntoSerie {
  /** Día local (Argentina) en formato `YYYY-MM-DD`. */
  dia: string;
  visitas: number;
}

export interface EstadisticasVisitas {
  /** Total histórico. Viene del `count` de la tabla, no de la ventana. */
  total: number;
  ultimos30: number;
  /** Los 30 días anteriores a esos, para poder comparar. */
  previos30: number;
  /**
   * Variación porcentual contra el período anterior, redondeada.
   * `null` cuando el período anterior fue cero: ahí no hay porcentaje que
   * calcular y mostrar "+100%" sería inventar una base que no existió.
   */
  variacion: number | null;
  /** Visitas de los últimos 30 días hechas por alguien con sesión iniciada. */
  identificadas30: number;
  /** Las que no se pueden atribuir a nadie (sin sesión). */
  anonimas30: number;
  /** Exactamente 30 puntos, del más viejo al más nuevo. */
  serie: PuntoSerie[];
  /** El día de más tráfico dentro de la ventana. `null` si no hubo ninguna. */
  pico: PuntoSerie | null;
  /** Cuántos de los 30 días tuvieron al menos una visita. */
  diasConVisitas: number;
}

export const VENTANA_DIAS = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Argentina está en UTC-3 todo el año (no hay horario de verano desde 2009).
 * Restar el offset y quedarse con la fecha UTC da el día calendario local, que
 * es el que la socia espera ver en el gráfico.
 */
const OFFSET_AR_MS = 3 * 60 * 60 * 1000;

/** `2026-08-25T02:30:00Z` → `"2026-08-24"` (todavía es el 24 en Buenos Aires). */
export function diaLocal(ms: number): string {
  return new Date(ms - OFFSET_AR_MS).toISOString().slice(0, 10);
}

/** Nombre corto para el eje: `"25 ago"`. */
export function etiquetaDia(dia: string): string {
  const [anio, mes, d] = dia.split("-").map(Number);
  // Mediodía UTC para que ningún redondeo de zona horaria corra el día.
  return new Date(Date.UTC(anio, mes - 1, d, 12)).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function calcularEstadisticasVisitas(
  filas: FilaVisita[],
  totalHistorico: number,
  ahoraMs: number = Date.now()
): EstadisticasVisitas {
  const inicioVentana = ahoraMs - VENTANA_DIAS * MS_POR_DIA;
  const inicioPrevia = ahoraMs - 2 * VENTANA_DIAS * MS_POR_DIA;

  // Los 30 días de la serie, en orden, aunque no tengan ninguna visita: un
  // gráfico con huecos miente sobre la forma de la curva.
  const conteo = new Map<string, number>();
  const dias: string[] = [];
  for (let i = VENTANA_DIAS - 1; i >= 0; i--) {
    const dia = diaLocal(ahoraMs - i * MS_POR_DIA);
    dias.push(dia);
    conteo.set(dia, 0);
  }

  let ultimos30 = 0;
  let previos30 = 0;
  let identificadas30 = 0;

  for (const fila of filas) {
    const ms = Date.parse(fila.creado_en);
    if (!Number.isFinite(ms)) continue;

    if (ms >= inicioVentana && ms <= ahoraMs) {
      ultimos30++;
      if (fila.visitante_perfil_id) identificadas30++;
      const dia = diaLocal(ms);
      // El bucket puede no existir en el borde: una visita de hace 30 días y
      // pico cae fuera de la grilla aunque entre en la ventana por tiempo.
      if (conteo.has(dia)) conteo.set(dia, conteo.get(dia)! + 1);
    } else if (ms >= inicioPrevia && ms < inicioVentana) {
      previos30++;
    }
  }

  const serie: PuntoSerie[] = dias.map((dia) => ({ dia, visitas: conteo.get(dia) ?? 0 }));

  let pico: PuntoSerie | null = null;
  let diasConVisitas = 0;
  for (const punto of serie) {
    if (punto.visitas === 0) continue;
    diasConVisitas++;
    if (!pico || punto.visitas > pico.visitas) pico = punto;
  }

  return {
    total: totalHistorico,
    ultimos30,
    previos30,
    variacion: previos30 > 0 ? Math.round(((ultimos30 - previos30) / previos30) * 100) : null,
    identificadas30,
    anonimas30: ultimos30 - identificadas30,
    serie,
    pico,
    diasConVisitas,
  };
}

/** Estadísticas en cero, para la socia que todavía no recibió ninguna visita. */
export function estadisticasVacias(ahoraMs: number = Date.now()): EstadisticasVisitas {
  return calcularEstadisticasVisitas([], 0, ahoraMs);
}
