import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { destinatariosDelBoletin } from "@/modulos/boletin/destinatarios";
import { extractoDeCuerpo } from "@/modulos/boletin/aviso";

/**
 * A quién le llega el aviso del Boletín, y con cuánto texto.
 *
 * Lo que estos tests cuidan es que NADIE RECIBA LA MISMA NOTA DOS VECES y que
 * una fila mal cargada no deje sin aviso a las que venían después. Las dos
 * cosas son invisibles en desarrollo —la base real tiene los datos limpios— y
 * sólo se notan cuando el correo ya salió a 103 casillas.
 */

type FilaEmpresa = {
  razon_social: string;
  email: string | null;
  email_referente: string | null;
};

/**
 * Un cliente de Supabase de mentira: sólo sabe responder
 * `from("empresas").select(...).eq("estado", "aprobada")`.
 *
 * Se afirma sobre la tabla y el filtro porque son parte del contrato: si
 * mañana alguien saca el `.eq("estado", "aprobada")`, el aviso le llegaría
 * también a las rechazadas y a las pausadas, y ningún otro test lo notaría.
 */
function dbFalsa(filas: FilaEmpresa[], opciones?: { error?: string }) {
  const visto: { tabla?: string; estado?: string } = {};
  const db = {
    from(tabla: string) {
      visto.tabla = tabla;
      return {
        select() {
          return {
            eq(columna: string, valor: string) {
              if (columna === "estado") visto.estado = valor;
              return Promise.resolve(
                opciones?.error
                  ? { data: null, error: { message: opciones.error } }
                  : { data: filas, error: null }
              );
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { db, visto };
}

const empresa = (
  razon_social: string,
  email: string | null,
  email_referente: string | null = null
): FilaEmpresa => ({ razon_social, email, email_referente });

describe("destinatarios del aviso", () => {
  it("junta la casilla de la empresa y la del referente", async () => {
    const { db } = dbFalsa([empresa("Metal SA", "info@metal.com", "juan@metal.com")]);
    const { emails } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["info@metal.com", "juan@metal.com"]);
  });

  it("lee sólo las fichas aprobadas", async () => {
    const { db, visto } = dbFalsa([empresa("Metal SA", "info@metal.com")]);
    await destinatariosDelBoletin(db);
    expect(visto.tabla).toBe("empresas");
    expect(visto.estado).toBe("aprobada");
  });

  it("no manda dos veces a la misma casilla dentro de una ficha", async () => {
    // Pasa de verdad: en varias fichas el referente cargó su propia casilla
    // también como email de la empresa.
    const { db } = dbFalsa([empresa("Metal SA", "juan@metal.com", "juan@metal.com")]);
    const { emails } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["juan@metal.com"]);
  });

  it("no manda dos veces a la misma casilla entre fichas distintas", async () => {
    // Seis dominios del padrón tienen dos fichas (plaquimet, genrod, …).
    const { db } = dbFalsa([
      empresa("Plaquimet SA", "ventas@plaquimet.com"),
      empresa("Plaquimet Servicios", "ventas@plaquimet.com"),
    ]);
    const { emails } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["ventas@plaquimet.com"]);
  });

  it("trata la misma dirección en mayúsculas como una sola", async () => {
    const { db } = dbFalsa([
      empresa("Metal SA", "Info@Metal.com"),
      empresa("Otra SA", "info@metal.com"),
    ]);
    const { emails } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["info@metal.com"]);
  });

  it("descarta lo que el SMTP rechazaría, sin perder el resto de la ficha", async () => {
    // Una dirección rota hace tirar a sendMail; como la tanda es secuencial,
    // sin este filtro cortaría el aviso para todas las que venían después.
    const { db } = dbFalsa([
      empresa("Metal SA", "juan @metal.com", "ok@metal.com"),
      empresa("Sin punto", "raro@localhost", null),
      empresa("Dos juntas", "a@x.com, b@x.com", null),
    ]);
    const { emails } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["ok@metal.com"]);
  });

  it("recorta los espacios de alrededor", async () => {
    const { db } = dbFalsa([empresa("Metal SA", "  info@metal.com  ")]);
    const { emails } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["info@metal.com"]);
  });

  it("avisa cuáles quedaron afuera por no tener ninguna casilla", async () => {
    const { db } = dbFalsa([
      empresa("Metal SA", "info@metal.com"),
      empresa("Sin Correo SRL", null, null),
      empresa("Vacía SA", "  ", ""),
    ]);
    const { emails, empresas, sinEmail } = await destinatariosDelBoletin(db);
    expect(emails).toEqual(["info@metal.com"]);
    expect(empresas).toBe(3);
    expect(sinEmail).toEqual(["Sin Correo SRL", "Vacía SA"]);
  });

  it("si no se puede leer el padrón, tira en vez de mandar a medias", async () => {
    // Devolver una lista vacía haría que el candado se suelte y que el panel
    // diga "aviso pendiente" para siempre, sin decir por qué.
    const { db } = dbFalsa([], { error: "permission denied" });
    await expect(destinatariosDelBoletin(db)).rejects.toThrow(/permission denied/);
  });
});

describe("el adelanto que va en el correo", () => {
  it("saca las marcas de subtítulo", () => {
    const { extracto } = extractoDeCuerpo("## Lo que viene\nEl jueves abre la inscripción.");
    expect(extracto).toBe("Lo que viene\nEl jueves abre la inscripción.");
    expect(extracto).not.toContain("##");
  });

  it("una nota corta entra entera y no promete más", () => {
    const { extracto, hayMas } = extractoDeCuerpo("Cambia el horario de atención.");
    expect(extracto).toBe("Cambia el horario de atención.");
    expect(hayMas).toBe(false);
  });

  it("una nota larga se corta en palabra entera", () => {
    const { extracto, hayMas } = extractoDeCuerpo(`${"palabra ".repeat(200)}final`);
    expect(hayMas).toBe(true);
    expect(extracto.length).toBeLessThanOrEqual(420);
    // Cortar a mitad de una palabra se nota y queda mal en el correo.
    expect(extracto.endsWith("palabra")).toBe(true);
  });

  it("colapsa los huecos de más de un renglón", () => {
    // La plantilla pasa cada \n a <br/>: cinco seguidos dejan un agujero que
    // parece un error de maquetado.
    const { extracto } = extractoDeCuerpo("Primero\n\n\n\n\nSegundo");
    expect(extracto).toBe("Primero\n\nSegundo");
  });

  it("una publicación que es sólo una foto no tiene adelanto", () => {
    const { extracto, hayMas } = extractoDeCuerpo("   ");
    expect(extracto).toBe("");
    expect(hayMas).toBe(false);
  });
});
