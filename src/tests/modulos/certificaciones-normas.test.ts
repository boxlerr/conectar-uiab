import { describe, it, expect } from "vitest";
import {
  NORMAS,
  CODIGO_OTRA,
  normaPorCodigo,
  etiquetaNorma,
  familiaNorma,
  estadoVigencia,
  mapearCertificaciones,
  NORMAS_FRECUENTES,
} from "@/modulos/certificaciones/normas";

describe("catálogo de normas", () => {
  it("no tiene códigos duplicados", () => {
    const codigos = NORMAS.map((n) => n.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("incluye la escotilla 'otra'", () => {
    expect(normaPorCodigo(CODIGO_OTRA)?.familia).toBe("otras");
  });

  it("las normas frecuentes existen en el catálogo", () => {
    for (const codigo of NORMAS_FRECUENTES) {
      expect(normaPorCodigo(codigo)).toBeDefined();
    }
  });
});

describe("etiquetaNorma", () => {
  it("usa la etiqueta del catálogo", () => {
    expect(etiquetaNorma("iso-9001")).toBe("ISO 9001");
  });

  it("usa el nombre libre para 'otra'", () => {
    expect(etiquetaNorma(CODIGO_OTRA, "Sello Verde")).toBe("Sello Verde");
  });

  it("cae a un texto genérico si 'otra' viene sin nombre", () => {
    expect(etiquetaNorma(CODIGO_OTRA, "")).toBe("Certificación");
  });

  it("un código desconocido no rompe", () => {
    expect(familiaNorma("codigo-inexistente")).toBe("otras");
  });
});

describe("estadoVigencia", () => {
  const hoy = new Date(2026, 6, 21); // 2026-07-21

  it("sin fecha = sin vencimiento", () => {
    expect(estadoVigencia(null, hoy)).toBe("sin_vencimiento");
    expect(estadoVigencia(undefined, hoy)).toBe("sin_vencimiento");
  });

  it("fecha lejana = vigente", () => {
    expect(estadoVigencia("2027-12-31", hoy)).toBe("vigente");
  });

  it("dentro de 60 días = por vencer", () => {
    expect(estadoVigencia("2026-08-10", hoy)).toBe("por_vencer");
  });

  it("fecha pasada = vencida", () => {
    expect(estadoVigencia("2026-01-01", hoy)).toBe("vencida");
  });

  it("una fecha inválida no rompe", () => {
    expect(estadoVigencia("no-es-fecha", hoy)).toBe("sin_vencimiento");
  });
});

describe("mapearCertificaciones", () => {
  it("agrupa por entidad y pone las verificadas primero", () => {
    const mapa = mapearCertificaciones([
      { empresa_id: "e1", codigo_norma: "iso-14001", verificada: false },
      { empresa_id: "e1", codigo_norma: "iso-9001", verificada: true },
      { proveedor_id: "p1", codigo_norma: "haccp", verificada: false },
    ]);

    const e1 = mapa.get("e1")!;
    expect(e1).toHaveLength(2);
    expect(e1[0].etiqueta).toBe("ISO 9001");
    expect(e1[0].verificada).toBe(true);

    const p1 = mapa.get("p1")!;
    expect(p1[0].familia).toBe("alimentos");
  });

  it("ignora filas sin entidad o sin código", () => {
    const mapa = mapearCertificaciones([
      { codigo_norma: "iso-9001", verificada: true },
      { empresa_id: "e1", codigo_norma: "", verificada: true },
    ] as any);
    expect(mapa.size).toBe(0);
  });

  it("tolera null/undefined", () => {
    expect(mapearCertificaciones(null).size).toBe(0);
    expect(mapearCertificaciones(undefined).size).toBe(0);
  });
});
