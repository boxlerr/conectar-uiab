import { describe, expect, it } from "vitest";
import {
  ERROR_SIN_SERVICIO,
  interpretarServicioDelRegistro,
} from "@/modulos/registro/servicio-del-registro";

/**
 * El rubro es obligatorio para un particular, y hasta ahora sólo lo pedía el
 * wizard: `register-sync` hacía `if (sectorId)` y seguía. Una ficha sin rubro no
 * aparece en ninguna búsqueda del directorio.
 */
const UUID = "1ca1d833-461f-4399-9579-7fa8cc6837b9";

describe("interpretarServicioDelRegistro", () => {
  it("toma la categoría del catálogo cuando viene un uuid", () => {
    expect(interpretarServicioDelRegistro(UUID, "")).toEqual({
      tipo: "catalogo",
      categoriaId: UUID,
    });
  });

  it("el catálogo le gana al texto libre: lo escrito es residuo del formulario", () => {
    const r = interpretarServicioDelRegistro(UUID, "otra cosa");
    expect(r).toEqual({ tipo: "catalogo", categoriaId: UUID });
  });

  it("sin nada, falta el servicio", () => {
    expect(interpretarServicioDelRegistro("", "")).toEqual({
      tipo: "falta",
      error: ERROR_SIN_SERVICIO,
    });
    expect(interpretarServicioDelRegistro(undefined, undefined).tipo).toBe("falta");
    expect(interpretarServicioDelRegistro(null, "   ").tipo).toBe("falta");
  });

  it("un sectorId que no es uuid no alcanza: cae al texto libre", () => {
    expect(interpretarServicioDelRegistro("metalmecanica", "").tipo).toBe("falta");
  });

  it("acepta el servicio escrito a mano", () => {
    expect(interpretarServicioDelRegistro("", "Reparación de compresores")).toEqual({
      tipo: "libre",
      nombre: "Reparación de compresores",
      slug: "reparacion-de-compresores",
    });
  });

  it("colapsa los espacios de más antes de guardarlo", () => {
    const r = interpretarServicioDelRegistro("", "  reparación   de compresores ");
    expect(r).toMatchObject({ tipo: "libre", nombre: "reparación de compresores" });
  });

  it("rechaza un texto que no es un rubro", () => {
    const r = interpretarServicioDelRegistro("", "a");
    expect(r.tipo).toBe("falta");
    expect(r.tipo === "falta" && r.error).toContain("corta");
  });

  it("rechaza una descripción entera disfrazada de rubro", () => {
    const largo = "Ofrezco todo tipo de servicios industriales para plantas de la zona sur";
    const r = interpretarServicioDelRegistro("", largo);
    expect(r.tipo).toBe("falta");
  });

  it("rechaza emojis y símbolos raros", () => {
    const r = interpretarServicioDelRegistro("", "soldadura 🔥🔥");
    expect(r.tipo).toBe("falta");
  });

  it("dos personas que escriben lo mismo con distinta puntuación comparten slug", () => {
    const a = interpretarServicioDelRegistro("", "Reparación de Compresores");
    const b = interpretarServicioDelRegistro("", "reparacion de compresores");
    expect(a.tipo === "libre" && b.tipo === "libre" && a.slug === b.slug).toBe(true);
  });
});
