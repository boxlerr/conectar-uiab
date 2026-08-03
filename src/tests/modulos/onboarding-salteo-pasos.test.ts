import { describe, expect, it } from "vitest";
import {
  proximoPasoMostrable,
  type PasoUbicable,
} from "@/modulos/onboarding/salteo-pasos";

// Caso real que motivó el fix (reporte de Lucas, Metalúrgica Longchamps,
// 2026-08-03): "el tutorial guiado se corta a mitad de recorrido". El tour del
// panel apunta a secciones que sólo se renderizan para ciertos roles, y con
// joyride en modo controlado un target faltante dejaba el recorrido congelado.
const PANEL = "/panel-de-control";

const PASOS_PANEL: PasoUbicable[] = [
  { target: "body", ruta: PANEL }, // bienvenida (centrada)
  { target: '[data-tour="dash-hero"]', ruta: PANEL },
  { target: '[data-tour="dash-kpis"]', ruta: PANEL },
  { target: '[data-tour="dash-matches"]', ruta: PANEL }, // sólo company/provider
  { target: '[data-tour="dash-items"]', ruta: PANEL }, // sólo company/provider
  { target: '[data-tour="dash-quick"]', ruta: PANEL },
  { target: "body", ruta: PANEL }, // cierre (centrada)
];

/** Predicado de DOM falso: presentes los selectores que le pasemos. */
const dom = (...presentes: string[]) => (sel: string) => presentes.includes(sel);

describe("proximoPasoMostrable", () => {
  it("saltea el paso cuya sección no se renderizó y sigue en la próxima que existe", () => {
    // Un rol sin matches ni catálogo: dash-matches y dash-items no están.
    const existe = dom(
      '[data-tour="dash-hero"]',
      '[data-tour="dash-kpis"]',
      '[data-tour="dash-quick"]'
    );
    // Se congelaba en el índice 3 (dash-matches). Ahora salta a dash-quick.
    expect(proximoPasoMostrable(PASOS_PANEL, 3, PANEL, existe)).toBe(5);
  });

  it("saltea varios faltantes seguidos sin quedarse en el medio", () => {
    const existe = dom('[data-tour="dash-hero"]');
    // Desde dash-kpis (2) no hay más targets: cae en el paso de cierre (body).
    expect(proximoPasoMostrable(PASOS_PANEL, 2, PANEL, existe)).toBe(6);
  });

  it("da por buenos los pasos centrados: body siempre existe", () => {
    expect(proximoPasoMostrable(PASOS_PANEL, 5, PANEL, dom())).toBe(6);
  });

  it("devuelve -1 cuando no queda ningún paso mostrable, para cerrar prolijo", () => {
    const sinCierre = PASOS_PANEL.slice(0, 6); // sin el body final
    expect(proximoPasoMostrable(sinCierre, 2, PANEL, dom())).toBe(-1);
  });

  it("nunca vuelve atrás ni se queda en el paso roto", () => {
    const existe = dom('[data-tour="dash-hero"]');
    // El único target presente está ANTES del índice actual.
    expect(proximoPasoMostrable(PASOS_PANEL, 3, PANEL, existe)).toBe(6);
  });

  it("acepta un paso de otra ruta sin mirar el DOM: se evalúa después de navegar", () => {
    const pasos: PasoUbicable[] = [
      { target: '[data-tour="dash-kpis"]', ruta: PANEL },
      { target: '[data-tour="op-listado"]', ruta: "/oportunidades" },
    ];
    // El target de /oportunidades no puede existir todavía — estamos en el panel.
    expect(proximoPasoMostrable(pasos, 0, PANEL, dom())).toBe(1);
  });

  it("un paso sin ruta declarada se resuelve por DOM", () => {
    const pasos: PasoUbicable[] = [
      { target: '[data-tour="a"]' },
      { target: '[data-tour="b"]' },
      { target: '[data-tour="c"]' },
    ];
    expect(proximoPasoMostrable(pasos, 0, PANEL, dom('[data-tour="c"]'))).toBe(2);
  });
});
