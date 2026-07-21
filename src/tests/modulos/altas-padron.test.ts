import { describe, expect, it } from "vitest";
import { conflictosPendientes, fusionarConPadron, reglaDeCampo } from "@/modulos/altas/padron";

// Caso real que motivó el fix: Metalúrgica Longchamps completó /sumate y su
// empresa ya existía en el padrón. Antes, el update se salteaba entero cuando
// la ficha del padrón ya tenía email — y como 52 de 53 fichas lo tienen, el
// teléfono no llegaba nunca a la ficha pública.
const ALTA_LONGCHAMPS = {
  razon_social: "Metalurgica Longchamps SRL",
  nombre_comercial: "Metalurgica Longchamps",
  cuit: "30712326898",
  email: "cotizaciones@metlongchamps.com",
  telefono: "+541149948136",
  sitio_web: "www.metlongchamps.cm",
  direccion: "H Yrigoyen 17551",
  localidad: "Longchamps",
  actividad: "Servicio de mantenimiento para la industria (mecanizados, soldadura, corte y plegado)",
  referente_nombre: "Lucas Santa Cruz",
  n_socio: null,
};

const PADRON_LONGCHAMPS = {
  razon_social: "METALURGICA LONGCHAMPS",
  nombre_comercial: null,
  cuit: "30-71232689-8",
  email: "info@metlongchamps.com",
  telefono: null,
  sitio_web: "https://metlongchamps.com/",
  direccion: "AV. HIPOLITO YRIGOYEN 17551",
  localidad: "LONGCHAMPS",
  actividad: "FABRICACIÓN DE PRODUCTOS ELABORADOS DE METAL",
  descripcion: null,
  referente: "Lucas Santa Cruz",
  email_referente: "info@metlongchamps.com",
  n_socio: "0079",
};

describe("fusionarConPadron", () => {
  it("completa los datos que faltaban en el padrón", () => {
    const { cambios } = fusionarConPadron(ALTA_LONGCHAMPS, PADRON_LONGCHAMPS);

    expect(cambios.telefono).toBe("+541149948136");
    expect(cambios.nombre_comercial).toBe("Metalurgica Longchamps");
    expect(cambios.descripcion).toBe(ALTA_LONGCHAMPS.actividad);
  });

  it("deja que email y teléfono del formulario pisen al padrón", () => {
    const { cambios } = fusionarConPadron(ALTA_LONGCHAMPS, PADRON_LONGCHAMPS);
    expect(cambios.email).toBe("cotizaciones@metlongchamps.com");
  });

  it("no degrada los datos que el padrón ya tenía bien", () => {
    const { cambios } = fusionarConPadron(ALTA_LONGCHAMPS, PADRON_LONGCHAMPS);

    // El formulario traía el sitio con un typo (.cm) y la dirección abreviada.
    expect(cambios).not.toHaveProperty("sitio_web");
    expect(cambios).not.toHaveProperty("direccion");
    expect(cambios).not.toHaveProperty("localidad");
    expect(cambios).not.toHaveProperty("email_referente");
    expect(cambios).not.toHaveProperty("n_socio");
  });

  it("nunca escribe null sobre un dato existente", () => {
    const { cambios } = fusionarConPadron(
      { ...ALTA_LONGCHAMPS, sitio_web: null, direccion: "", telefono: undefined },
      PADRON_LONGCHAMPS
    );
    for (const valor of Object.values(cambios)) {
      expect(valor).toBeTruthy();
    }
    expect(cambios).not.toHaveProperty("telefono");
  });

  it("anota como conflicto sólo las diferencias reales", () => {
    const { conflictos } = fusionarConPadron(ALTA_LONGCHAMPS, PADRON_LONGCHAMPS);
    const campos = conflictos.map((c) => c.campo).sort();

    expect(campos).toEqual(["direccion", "email", "sitio_web"]);

    // El CUIT está escrito distinto pero es el mismo, y la localidad sólo
    // cambia en mayúsculas: ninguno debe molestar a la socia.
    expect(campos).not.toContain("cuit");
    expect(campos).not.toContain("localidad");
    expect(campos).not.toContain("referente");
    // `email_referente` es interno (no se muestra en ninguna ficha): se
    // completa si falta, pero nunca genera aviso.
    expect(campos).not.toContain("email_referente");
  });

  it("marca qué valor quedó guardado en cada conflicto", () => {
    const { conflictos } = fusionarConPadron(ALTA_LONGCHAMPS, PADRON_LONGCHAMPS);
    const porCampo = Object.fromEntries(conflictos.map((c) => [c.campo, c]));

    expect(porCampo.email.aplicado).toBe("formulario");
    expect(porCampo.direccion.aplicado).toBe("padron");
    expect(porCampo.sitio_web.valor_padron).toBe("https://metlongchamps.com/");
  });

  it("no reporta conflictos cuando la empresa es nueva (padrón vacío)", () => {
    const { cambios, conflictos } = fusionarConPadron(ALTA_LONGCHAMPS, {});
    expect(conflictos).toHaveLength(0);
    expect(cambios.email).toBe("cotizaciones@metlongchamps.com");
    expect(cambios.telefono).toBe("+541149948136");
  });
});

describe("reglaDeCampo", () => {
  it("acepta sólo columnas de la política de fusión", () => {
    expect(reglaDeCampo("telefono")).toBeDefined();
    expect(reglaDeCampo("estado")).toBeUndefined();
    expect(reglaDeCampo("razon_social")).toBeUndefined();
  });
});

describe("conflictosPendientes", () => {
  it("descarta los ya revisados y tolera null", () => {
    const base = { etiqueta: "x", valor_formulario: "a", valor_padron: "b", aplicado: "padron" as const };
    expect(conflictosPendientes(null)).toEqual([]);
    expect(
      conflictosPendientes([
        { ...base, campo: "direccion" },
        { ...base, campo: "sitio_web", resuelto: true },
      ]).map((c) => c.campo)
    ).toEqual(["direccion"]);
  });
});
