import { describe, it, expect } from "vitest";
import {
  detectarSeparador,
  normalizarCuit,
  parsearFecha,
  parsearMonto,
  parsearReporteCobros,
} from "@/lib/sipago/conciliacion";

/**
 * Este parser es lo único que conecta los cobros recurrentes de Sipago con la
 * plataforma, así que lo que se prueba acá es que no invente ni descarte plata.
 * Se lo escribió sin tener el reporte real a la vista —la cuenta todavía no
 * tenía cobros—, y por eso reconoce cada dato por su forma en vez de por el
 * nombre de la columna. Estos tests son el contrato de esa decisión.
 */

describe("el CUIT", () => {
  it("acepta los formatos en que se escribe", () => {
    expect(normalizarCuit("30-71161518-7")).toBe("30711615187");
    expect(normalizarCuit("30711615187")).toBe("30711615187");
    expect(normalizarCuit(" 30 71161518 7 ")).toBe("30711615187");
  });

  it("rechaza números de once dígitos que no son CUIT", () => {
    // Un teléfono con característica también tiene once dígitos. Sin el chequeo
    // de prefijo se colaba como si fuera un CUIT y matcheaba con nadie.
    expect(normalizarCuit("11987654321")).toBeNull();
    expect(normalizarCuit("54911223344")).toBeNull();
  });

  it("rechaza lo que no tiene largo de CUIT", () => {
    expect(normalizarCuit("3071161518")).toBeNull();
    expect(normalizarCuit("307116151870")).toBeNull();
    expect(normalizarCuit("")).toBeNull();
  });
});

describe("los importes", () => {
  it("lee el formato argentino", () => {
    // Lo que rompe si se lee como inglés: "50.000" son cincuenta mil pesos, no
    // cincuenta. Confundirlo descarta el cobro por no llegar al monto esperado.
    expect(parsearMonto("50.000,00")).toBe(50000);
    expect(parsearMonto("$ 50.000,00")).toBe(50000);
    expect(parsearMonto("1.234,56")).toBe(1234.56);
    expect(parsearMonto("50.000")).toBe(50000);
    expect(parsearMonto("50000")).toBe(50000);
  });

  it("también lee el formato inglés por las dudas", () => {
    expect(parsearMonto("50,000.00")).toBe(50000);
    expect(parsearMonto("1,234.56")).toBe(1234.56);
  });

  it("distingue decimales de separadores de miles", () => {
    expect(parsearMonto("1234,56")).toBe(1234.56);
    expect(parsearMonto("1,234")).toBe(1234);
  });

  it("no inventa números", () => {
    expect(parsearMonto("")).toBeNull();
    expect(parsearMonto("APROBADO")).toBeNull();
    expect(parsearMonto("-")).toBeNull();
  });
});

describe("las fechas", () => {
  it("lee dd/mm/aaaa y lo pasa a ISO", () => {
    expect(parsearFecha("20/08/2026")).toBe("2026-08-20");
    expect(parsearFecha("5/8/2026")).toBe("2026-08-05");
    expect(parsearFecha("20-08-2026")).toBe("2026-08-20");
    expect(parsearFecha("20/08/26")).toBe("2026-08-20");
  });

  it("lee ISO", () => {
    expect(parsearFecha("2026-08-20")).toBe("2026-08-20");
    expect(parsearFecha("2026-08-20T15:04:00Z")).toBe("2026-08-20");
  });

  it("descarta lo que no es fecha", () => {
    expect(parsearFecha("30711615187")).toBeNull();
    expect(parsearFecha("ninguna")).toBeNull();
    expect(parsearFecha("45/13/2026")).toBeNull();
  });
});

describe("el separador", () => {
  it("elige el que parte todas las líneas igual", () => {
    expect(detectarSeparador(["a;b;c", "1;2;3"])).toBe(";");
    expect(detectarSeparador(["a\tb\tc", "1\t2\t3"])).toBe("\t");
    expect(detectarSeparador(["a,b,c", "1,2,3"])).toBe(",");
  });

  it("no se deja engañar por comas adentro de los importes", () => {
    // Con ";" las dos líneas dan 3 columnas; con "," dan 3 y 4. Gana ";".
    const lineas = ["CUIT;Monto;Estado", "30-71161518-7;50.000,00;APROBADO"];
    expect(detectarSeparador(lineas)).toBe(";");
  });
});

describe("el reporte completo", () => {
  const reporte = [
    "Cliente;CUIT;Fecha;Monto;Estado;Referencia",
    "METALURGICA DEL SUR SA;30-71161518-7;20/08/2026;50.000,00;APROBADO;AUT892034",
    "TORNERIA GARCIA SRL;30-99999999-0;20/08/2026;50.000,00;RECHAZADO;",
    "TOTALES;;;100.000,00;;",
  ].join("\n");

  it("se queda con las filas que tienen CUIT y descarta el resto", () => {
    const r = parsearReporteCobros(reporte);
    expect(r.filas).toHaveLength(2);
    // El encabezado y la fila de totales no tienen CUIT: se van solas, sin
    // tener que adivinar cuál era el encabezado.
    expect(r.ignoradas).toBe(2);
    expect(r.separador).toBe(";");
  });

  it("saca bien cada dato de la fila", () => {
    const [primera] = parsearReporteCobros(reporte).filas;
    expect(primera.cuit).toBe("30711615187");
    expect(primera.monto).toBe(50000);
    expect(primera.fecha).toBe("2026-08-20");
    expect(primera.aprobado).toBe(true);
    expect(primera.referencia).toBe("AUT892034");
  });

  it("marca como no aprobado lo que el reporte dice que se rechazó", () => {
    const [, segunda] = parsearReporteCobros(reporte).filas;
    expect(segunda.aprobado).toBe(false);
  });

  it("no confunde el CUIT con el importe", () => {
    // Es la trampa del parseo por contenido: un CUIT también es un número
    // grande. Si lo tomara como monto, activaría suscripciones por $30.711.615.
    const [primera] = parsearReporteCobros(reporte).filas;
    expect(primera.monto).toBe(50000);
    expect(primera.monto).not.toBe(30711615187);
  });

  it("aguanta tabulaciones, que es lo que sale de pegar desde una planilla", () => {
    const pegado = "CUIT\tMonto\tEstado\n30-71161518-7\t50.000,00\tAprobado";
    const r = parsearReporteCobros(pegado);
    expect(r.separador).toBe("\t");
    expect(r.filas).toHaveLength(1);
    expect(r.filas[0].monto).toBe(50000);
  });

  it("sin columna de estado asume que el reporte lista cobros hechos", () => {
    // Es la lectura conservadora: el importe igual se valida después contra lo
    // que la suscripción debería costar, así que asumir de más no activa nada
    // que no corresponda.
    const r = parsearReporteCobros("30-71161518-7;20/08/2026;50.000,00");
    expect(r.filas[0].aprobado).toBe(true);
  });

  it("con un texto vacío no explota", () => {
    expect(parsearReporteCobros("")).toEqual({ filas: [], ignoradas: 0, separador: ";" });
    expect(parsearReporteCobros("\n\n  \n").filas).toHaveLength(0);
  });

  it("una fila sin importe se conserva pero con monto null", () => {
    // No se descarta: el admin tiene que poder ver que vino incompleta en vez
    // de que desaparezca sin explicación.
    const r = parsearReporteCobros("30-71161518-7;20/08/2026;;APROBADO");
    expect(r.filas).toHaveLength(1);
    expect(r.filas[0].monto).toBeNull();
  });
});

// ─── La decisión ────────────────────────────────────────────────────────────

import { decidirAccion } from "@/lib/sipago/conciliacion";

const cobro = (extra: Partial<Parameters<typeof decidirAccion>[0]["fila"]> = {}) => ({
  cuit: "30711615187", monto: 50000, fecha: "2026-08-20",
  aprobado: true, referencia: null, crudo: [], ...extra,
});

describe("a quién se le cobra y a quién no", () => {
  const socia = { nombre: "Metalúrgica del Sur SA" };

  it("A LAS SOCIAS DEL PADRÓN NO SE LES COBRA", () => {
    // La regla de negocio de la UIAB: las 57 empresas del padrón tienen acceso
    // de cortesía y sólo se cobra a las que se dan de alta nuevas por el
    // registro. Si una cae en un reporte, no se la toca.
    expect(
      decidirAccion({
        fila: cobro(),
        entidad: socia,
        suscripcion: { metodo_pago: "cortesia", monto: 0 },
        yaCargado: false,
      }).accion
    ).toBe("cortesia");
  });

  it("monto 0 también es cortesía, aunque el método diga otra cosa", () => {
    // Las dos condiciones valen por separado: hay filas viejas con monto 0 y
    // método heredado, y no dejan de ser acceso sin cargo por eso.
    expect(
      decidirAccion({
        fila: cobro(),
        entidad: socia,
        suscripcion: { metodo_pago: "transferencia", monto: 0 },
        yaCargado: false,
      }).accion
    ).toBe("cortesia");
  });

  it("la cortesía gana incluso si el monto del reporte cierra", () => {
    // El chequeo de cortesía va ANTES que el de monto justamente para esto:
    // ninguna rama posterior puede pasarlo por arriba.
    expect(
      decidirAccion({
        fila: cobro({ monto: 50000 }),
        entidad: socia,
        suscripcion: { metodo_pago: "cortesia", monto: 0 },
        yaCargado: false,
      }).accion
    ).toBe("cortesia");
  });

  it("a una socia nueva del registro sí se le activa", () => {
    expect(
      decidirAccion({
        fila: cobro(),
        entidad: socia,
        suscripcion: { metodo_pago: "sipago_suscripcion", monto: 50000 },
        yaCargado: false,
      }).accion
    ).toBe("activar");
  });

  it("un CUIT que no es de nadie no activa nada", () => {
    expect(
      decidirAccion({ fila: cobro(), entidad: null, suscripcion: null, yaCargado: false }).accion
    ).toBe("cuit_desconocido");
  });

  it("un cobro rechazado no activa nada", () => {
    expect(
      decidirAccion({
        fila: cobro({ aprobado: false }),
        entidad: socia,
        suscripcion: { metodo_pago: "sipago_suscripcion", monto: 50000 },
        yaCargado: false,
      }).accion
    ).toBe("rechazado");
  });

  it("pegar el mismo reporte dos veces no cobra dos veces", () => {
    expect(
      decidirAccion({
        fila: cobro(),
        entidad: socia,
        suscripcion: { metodo_pago: "sipago_suscripcion", monto: 50000 },
        yaCargado: true,
      }).accion
    ).toBe("ya_registrado");
  });

  it("un importe que no cierra se marca y no se aplica", () => {
    const r = decidirAccion({
      fila: cobro({ monto: 500 }),
      entidad: socia,
      suscripcion: { metodo_pago: "sipago_suscripcion", monto: 50000 },
      yaCargado: false,
    });
    expect(r.accion).toBe("monto_no_coincide");
    expect(r.detalle).toContain("500");
  });

  it("una diferencia de centavos no frena el cobro", () => {
    // Redondeos del reporte no pueden dejar a un socio sin activar.
    expect(
      decidirAccion({
        fila: cobro({ monto: 50000.4 }),
        entidad: socia,
        suscripcion: { metodo_pago: "sipago_suscripcion", monto: 50000 },
        yaCargado: false,
      }).accion
    ).toBe("activar");
  });

  it("sin suscripción previa se activa igual: es un alta nueva que pagó", () => {
    expect(
      decidirAccion({ fila: cobro(), entidad: socia, suscripcion: null, yaCargado: false }).accion
    ).toBe("activar");
  });

  it("una fila sin importe no se frena por el monto", () => {
    expect(
      decidirAccion({
        fila: cobro({ monto: null }),
        entidad: socia,
        suscripcion: { metodo_pago: "sipago_suscripcion", monto: 50000 },
        yaCargado: false,
      }).accion
    ).toBe("activar");
  });
});
