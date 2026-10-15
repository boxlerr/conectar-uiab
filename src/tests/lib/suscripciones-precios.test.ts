import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * `leerPrecios()` es lo que separa al precio que el admin carga en el panel del
 * que ve quien se registra (el mail de "Completá tu suscripción") y del que se
 * anota para cobrar. Si devuelve la constante cuando la base tiene otro valor,
 * el mail promete un precio y el checkout cobra otro. Si se rompe en vez de caer
 * a la constante, se cae el registro entero por una configuración.
 */

let respuesta: { data: unknown; error: { message: string } | null } = { data: null, error: null };
let explota = false;
const consultas: Array<{ tabla: string; columna: string; valor: string }> = [];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (explota) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurado");
    return {
      from: (tabla: string) => ({
        select: () => ({
          eq: (columna: string, valor: string) => {
            consultas.push({ tabla, columna, valor });
            return { maybeSingle: async () => respuesta };
          },
        }),
      }),
    };
  },
}));

const { leerPrecios, validarPrecios, CLAVE_PRECIOS } = await import("@/lib/suscripciones/precios");
const { PRECIOS_POR_DEFECTO, calcularMontoMensual } = await import("@/lib/suscripciones/modelo");

beforeEach(() => {
  respuesta = { data: null, error: null };
  explota = false;
  consultas.length = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("leerPrecios", () => {
  it("devuelve el precio que el admin cargó en el panel", async () => {
    respuesta = { data: { valor: { mensual: 65_000, anual: 650_000 } }, error: null };

    expect(await leerPrecios()).toEqual({ mensual: 65_000, anual: 650_000 });
    expect(consultas).toEqual([
      { tabla: "configuraciones_sistema", columna: "clave", valor: CLAVE_PRECIOS },
    ]);
  });

  it("lo que lee de la base es lo que llega al monto del registro", async () => {
    respuesta = { data: { valor: { mensual: 65_000, anual: 650_000 } }, error: null };

    // Es la cuenta que hace register-sync para la fila inicial y el mail.
    expect(calcularMontoMensual({ precios: await leerPrecios() })).toBe(65_000);
  });

  it("acepta números guardados como texto y los redondea", async () => {
    respuesta = { data: { valor: { mensual: "65000.4", anual: "650000.6" } }, error: null };

    expect(await leerPrecios()).toEqual({ mensual: 65_000, anual: 650_001 });
  });

  it("cae a los valores por defecto si la clave no existe", async () => {
    expect(await leerPrecios()).toEqual(PRECIOS_POR_DEFECTO);
  });

  it("cae a los valores por defecto si la consulta falla", async () => {
    respuesta = { data: null, error: { message: "timeout" } };

    expect(await leerPrecios()).toEqual(PRECIOS_POR_DEFECTO);
  });

  it("cae a los valores por defecto si ni siquiera se puede armar el cliente", async () => {
    explota = true;

    expect(await leerPrecios()).toEqual(PRECIOS_POR_DEFECTO);
  });

  it.each([
    ["mensual en cero", { mensual: 0, anual: 500_000 }],
    ["anual negativo", { mensual: 50_000, anual: -1 }],
    ["sin anual", { mensual: 50_000 }],
    ["texto que no es número", { mensual: "cincuenta mil", anual: 500_000 }],
    ["un número suelto", 50_000],
  ])("no usa un valor roto (%s): cae a los valores por defecto", async (_caso, valor) => {
    respuesta = { data: { valor }, error: null };

    expect(await leerPrecios()).toEqual(PRECIOS_POR_DEFECTO);
  });
});

describe("validarPrecios", () => {
  it("acepta un par coherente", () => {
    expect(validarPrecios(60_000, 600_000)).toBeNull();
  });

  it("rechaza montos que no son mayores a cero", () => {
    expect(validarPrecios(0, 500_000)).toMatch(/mensual/);
    expect(validarPrecios(50_000, Number.NaN)).toMatch(/anual/);
  });

  it("rechaza un anual más caro que doce meses sueltos", () => {
    expect(validarPrecios(50_000, 600_001)).toMatch(/más caro/);
  });
});
