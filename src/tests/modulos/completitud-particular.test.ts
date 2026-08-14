import { describe, expect, it } from "vitest";
import {
  CAMPOS_PARTICULAR,
  completitudDeParticular,
  serviciosFueraDelCatalogo,
  type ServicioDeclarado,
} from "@/modulos/admin/completitud-particular";

const servicio = (over: Partial<ServicioDeclarado> = {}): ServicioDeclarado => ({
  id: "s1",
  nombre: "Tornería y CNC",
  oficial: true,
  activa: true,
  ...over,
});

describe("completitudDeParticular", () => {
  it("una ficha vacía sin servicios no completa nada", () => {
    const c = completitudDeParticular({ servicios: [] });
    expect(c.completos).toBe(0);
    expect(c.pct).toBe(0);
    expect(c.conServicios).toBe(false);
    expect(c.vacios).toHaveLength(CAMPOS_PARTICULAR.length);
  });

  it("los servicios cuentan como un campo más", () => {
    const c = completitudDeParticular({ servicios: [servicio()] });
    expect(c.conServicios).toBe(true);
    expect(c.completos).toBe(1);
    expect(c.total).toBe(CAMPOS_PARTICULAR.length + 1);
  });

  it("una ficha con todos los datos pero sin servicios NO llega al 100%", () => {
    const llena: Record<string, unknown> = { servicios: [] };
    for (const campo of CAMPOS_PARTICULAR) llena[campo.clave] = "algo";
    const c = completitudDeParticular(llena as never);
    expect(c.cargados).toHaveLength(CAMPOS_PARTICULAR.length);
    expect(c.pct).toBeLessThan(100);
  });

  it("con servicios y todos los datos sí llega al 100%", () => {
    const llena: Record<string, unknown> = { servicios: [servicio()] };
    for (const campo of CAMPOS_PARTICULAR) llena[campo.clave] = "algo";
    expect(completitudDeParticular(llena as never).pct).toBe(100);
  });

  it("el whatsapp alcanza para dar el teléfono por cargado", () => {
    const c = completitudDeParticular({ servicios: [], whatsapp: "1122334455" });
    expect(c.cargados.map((x) => x.clave)).toContain("telefono");
  });

  it("un string en blanco no cuenta como cargado", () => {
    const c = completitudDeParticular({ servicios: [], email: "   " });
    expect(c.cargados).toHaveLength(0);
  });

  it("cargados y vacíos parten el listado sin superponerse", () => {
    const c = completitudDeParticular({ servicios: [], email: "a@b.com" });
    expect(c.cargados.length + c.vacios.length).toBe(CAMPOS_PARTICULAR.length);
    expect(c.cargados.some((x) => c.vacios.includes(x))).toBe(false);
  });
});

describe("serviciosFueraDelCatalogo", () => {
  it("son los que el particular escribió a mano", () => {
    const fuera = serviciosFueraDelCatalogo([
      servicio({ id: "a", oficial: true }),
      servicio({ id: "b", nombre: "alquiler autoelevador", oficial: false }),
    ]);
    expect(fuera.map((s) => s.id)).toEqual(["b"]);
  });

  it("sin servicios, no hay nada que subir", () => {
    expect(serviciosFueraDelCatalogo([])).toEqual([]);
  });
});
