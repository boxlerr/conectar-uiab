import { describe, it, expect } from "vitest";
import {
  calcularEstadisticasVisitas,
  diaLocal,
  estadisticasVacias,
  VENTANA_DIAS,
  type FilaVisita,
} from "@/modulos/visitas/estadisticas";

/**
 * Las estadísticas del panel son la única métrica de la plataforma con datos
 * reales, y son las que la socia va a leer para decidir si le sirve pagar la
 * cuota. Un número mal agrupado acá no se nota a ojo: da un gráfico plausible.
 *
 * Lo que se cubre: que la ventana no se coma ni invente días, que el "vs. mes
 * anterior" no se apoye en una base de cero, y que el día se calcule en hora de
 * Argentina y no en UTC.
 */

const MS_DIA = 24 * 60 * 60 * 1000;
/** 2026-08-25, 15:00 en Buenos Aires (18:00 UTC). */
const AHORA = Date.parse("2026-08-25T18:00:00Z");

function visita(iso: string, perfil: string | null = null): FilaVisita {
  return { creado_en: iso, visitante_perfil_id: perfil };
}

describe("diaLocal", () => {
  it("usa el día de Argentina, no el de UTC", () => {
    // 01:30 UTC del 25 son las 22:30 del 24 en Buenos Aires.
    expect(diaLocal(Date.parse("2026-08-25T01:30:00Z"))).toBe("2026-08-24");
    expect(diaLocal(Date.parse("2026-08-25T03:30:00Z"))).toBe("2026-08-25");
  });
});

describe("calcularEstadisticasVisitas", () => {
  it("devuelve una serie de exactamente 30 días, terminada hoy", () => {
    const stats = calcularEstadisticasVisitas([], 0, AHORA);
    expect(stats.serie).toHaveLength(VENTANA_DIAS);
    expect(stats.serie.at(-1)!.dia).toBe(diaLocal(AHORA));
    expect(stats.serie[0].dia).toBe(diaLocal(AHORA - (VENTANA_DIAS - 1) * MS_DIA));
  });

  it("no inventa nada cuando no hay visitas", () => {
    const stats = estadisticasVacias(AHORA);
    expect(stats.total).toBe(0);
    expect(stats.ultimos30).toBe(0);
    expect(stats.pico).toBeNull();
    expect(stats.variacion).toBeNull();
    expect(stats.serie.every((p) => p.visitas === 0)).toBe(true);
  });

  it("agrupa por día y encuentra el pico", () => {
    const hace2 = new Date(AHORA - 2 * MS_DIA).toISOString();
    const hace5 = new Date(AHORA - 5 * MS_DIA).toISOString();
    const stats = calcularEstadisticasVisitas(
      [visita(hace2), visita(hace2), visita(hace2), visita(hace5)],
      4,
      AHORA
    );

    expect(stats.ultimos30).toBe(4);
    expect(stats.diasConVisitas).toBe(2);
    expect(stats.pico).toEqual({ dia: diaLocal(AHORA - 2 * MS_DIA), visitas: 3 });
    expect(stats.serie.reduce((a, p) => a + p.visitas, 0)).toBe(4);
  });

  it("separa las visitas con sesión de las anónimas", () => {
    const ayer = new Date(AHORA - MS_DIA).toISOString();
    const stats = calcularEstadisticasVisitas(
      [visita(ayer, "perfil-1"), visita(ayer, "perfil-2"), visita(ayer, null)],
      3,
      AHORA
    );
    expect(stats.identificadas30).toBe(2);
    expect(stats.anonimas30).toBe(1);
  });

  it("no cuenta en la ventana lo que cayó en el período anterior", () => {
    const dentro = new Date(AHORA - 10 * MS_DIA).toISOString();
    const previo = new Date(AHORA - 40 * MS_DIA).toISOString();
    const viejisimo = new Date(AHORA - 200 * MS_DIA).toISOString();

    const stats = calcularEstadisticasVisitas(
      [visita(dentro), visita(previo), visita(previo), visita(viejisimo)],
      4,
      AHORA
    );
    expect(stats.ultimos30).toBe(1);
    expect(stats.previos30).toBe(2);
    // El total es histórico y viene del count, no de las filas de la ventana.
    expect(stats.total).toBe(4);
  });

  it("calcula la variación contra el período anterior", () => {
    const dentro = new Date(AHORA - 5 * MS_DIA).toISOString();
    const previo = new Date(AHORA - 40 * MS_DIA).toISOString();
    const stats = calcularEstadisticasVisitas(
      [visita(dentro), visita(dentro), visita(dentro), visita(previo), visita(previo)],
      5,
      AHORA
    );
    // 3 contra 2 → +50%
    expect(stats.variacion).toBe(50);
  });

  it("no afirma un porcentaje cuando el período anterior fue cero", () => {
    // Un "+100%" acá se apoyaría en una base que no existió. La UI muestra el
    // número pelado en su lugar.
    const stats = calcularEstadisticasVisitas(
      [visita(new Date(AHORA - MS_DIA).toISOString())],
      1,
      AHORA
    );
    expect(stats.previos30).toBe(0);
    expect(stats.variacion).toBeNull();
  });

  it("ignora fechas que no se pueden parsear en vez de romper el panel", () => {
    const stats = calcularEstadisticasVisitas(
      [visita("no-es-una-fecha"), visita(new Date(AHORA - MS_DIA).toISOString())],
      2,
      AHORA
    );
    expect(stats.ultimos30).toBe(1);
  });
});
