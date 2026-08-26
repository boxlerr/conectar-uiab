/**
 * Series para los sparklines de las tarjetas del panel.
 *
 * REGLA: una tarjeta dibuja línea SÓLO si tiene una serie real detrás. Las que
 * no la tienen muestran un guión, igual que en el mockup. Un sparkline
 * decorativo sobre un cero es una tendencia inventada, y este proyecto ya
 * reincidió tres veces en eso — ver `src/tests/seo/sin-datos-inventados.test.ts`.
 *
 * Hoy hay dos series reales:
 *  - visitas a la ficha  → `src/modulos/visitas/estadisticas.ts` (por día)
 *  - socias en el directorio → acá (acumulado de `empresas.aprobada_en`)
 *
 * Prestadores y oportunidades están en cero en producción: no hay serie que
 * armar y la tarjeta lo dice con un guión.
 */
import { diaLocal, VENTANA_DIAS, type PuntoSerie } from "@/modulos/visitas/estadisticas";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export interface SerieAcumulada {
  /** 30 puntos con el TOTAL vigente cada día, no el alta de ese día. */
  serie: PuntoSerie[];
  /** Cuántas se sumaron dentro de la ventana. */
  altasEnVentana: number;
  /**
   * Crecimiento porcentual del total en la ventana, redondeado.
   * `null` si al empezar la ventana no había ninguna: no hay base contra la
   * cual calcular un porcentaje.
   */
  variacion: number | null;
}

/**
 * Acumulado diario a partir de las fechas de alta.
 *
 * Se dibuja el TOTAL y no las altas por día porque el número grande de la
 * tarjeta es el total: una línea de altas diarias (0,0,1,0,0…) al lado de un
 * "59" no explica nada.
 */
export function serieAcumulada(
  fechas: (string | null | undefined)[],
  ahoraMs: number = Date.now()
): SerieAcumulada {
  const marcas = fechas
    .map((f) => (f ? Date.parse(f) : NaN))
    .filter((ms) => Number.isFinite(ms))
    .sort((a, b) => a - b);

  const serie: PuntoSerie[] = [];
  for (let i = VENTANA_DIAS - 1; i >= 0; i--) {
    // Fin del día: todo lo dado de alta hasta esa noche ya cuenta.
    const corte = ahoraMs - i * MS_POR_DIA;
    let total = 0;
    for (const ms of marcas) {
      if (ms > corte) break; // están ordenadas
      total++;
    }
    serie.push({ dia: diaLocal(corte), visitas: total });
  }

  const inicial = serie[0]?.visitas ?? 0;
  const final = serie.at(-1)?.visitas ?? 0;
  const altasEnVentana = final - inicial;

  return {
    serie,
    altasEnVentana,
    variacion: inicial > 0 ? Math.round((altasEnVentana / inicial) * 100) : null,
  };
}

/** Serie vacía, para cuando la métrica no tiene datos con qué armarla. */
export const SIN_SERIE: SerieAcumulada = { serie: [], altasEnVentana: 0, variacion: null };
