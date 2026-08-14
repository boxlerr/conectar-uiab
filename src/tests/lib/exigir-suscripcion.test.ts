import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * El gate de pago vivía SÓLO en el ruteo: el middleware corta la navegación a
 * /perfil, pero un Server Action es un POST con su id publicado en el bundle y
 * se puede invocar desde cualquier URL. Sin este guard, "pagás para aparecer"
 * era cierto nada más del lado del navegador.
 *
 * Se testea con dobles porque la función real habla con Supabase; lo que importa
 * es la decisión, no el transporte.
 */

const estado = {
  user: { id: "u1" } as { id: string } | null,
  perfil: { rol_sistema: "company", activo: true } as Record<string, unknown> | null,
  miembroEmpresa: [{ empresa_id: "e1" }] as { empresa_id: string }[],
  miembroProveedor: [] as { proveedor_id: string }[],
  suscripcion: [{ estado: "activa", gracia_hasta: null }] as
    | { estado: string; gracia_hasta: string | null }[]
    | null,
};

vi.mock("@/lib/supabase/servidor", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: estado.user } }) },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(tabla: string) {
      const constructor = {
        select: () => constructor,
        eq: () => constructor,
        order: () => constructor,
        limit: () => Promise.resolve({ data: datosDe(tabla) }),
        maybeSingle: () => Promise.resolve({ data: estado.perfil }),
      };
      return constructor;
    },
  }),
}));

function datosDe(tabla: string) {
  if (tabla === "miembros_empresa") return estado.miembroEmpresa;
  if (tabla === "miembros_proveedor") return estado.miembroProveedor;
  if (tabla === "suscripciones") return estado.suscripcion;
  return [];
}

const { exigirSuscripcion } = await import("@/lib/autenticacion/exigir-suscripcion");

beforeEach(() => {
  estado.user = { id: "u1" };
  estado.perfil = { rol_sistema: "company", activo: true };
  estado.miembroEmpresa = [{ empresa_id: "e1" }];
  estado.miembroProveedor = [];
  estado.suscripcion = [{ estado: "activa", gracia_hasta: null }];
});

describe("exigirSuscripcion", () => {
  it("con la suscripción activa deja guardar", async () => {
    expect(await exigirSuscripcion()).toBeNull();
  });

  it("con pendiente_pago NO deja guardar: es el agujero que cierra", async () => {
    estado.suscripcion = [{ estado: "pendiente_pago", gracia_hasta: null }];
    const r = await exigirSuscripcion();
    expect(r?.error).toContain("no está al día");
  });

  it("la socia de cortesía pasa: su suscripción es 'activa' con monto 0", async () => {
    estado.suscripcion = [{ estado: "activa", gracia_hasta: null }];
    expect(await exigirSuscripcion()).toBeNull();
  });

  it("en mora dentro de la gracia sigue pudiendo trabajar", async () => {
    const futuro = new Date(Date.now() + 3 * 86400000).toISOString();
    estado.suscripcion = [{ estado: "en_mora", gracia_hasta: futuro }];
    expect(await exigirSuscripcion()).toBeNull();
  });

  it("en mora con la gracia vencida ya no", async () => {
    const pasado = new Date(Date.now() - 86400000).toISOString();
    estado.suscripcion = [{ estado: "en_mora", gracia_hasta: pasado }];
    expect(await exigirSuscripcion()).not.toBeNull();
  });

  it("sin suscripción tampoco", async () => {
    estado.suscripcion = [];
    expect(await exigirSuscripcion()).not.toBeNull();
  });

  it("el admin pasa siempre: gestiona fichas ajenas por definición", async () => {
    estado.perfil = { rol_sistema: "admin", activo: true };
    estado.suscripcion = [{ estado: "cancelada", gracia_hasta: null }];
    expect(await exigirSuscripcion()).toBeNull();
  });

  it("el usuario desactivado no guarda ni con la suscripción al día", async () => {
    estado.perfil = { rol_sistema: "company", activo: false };
    const r = await exigirSuscripcion();
    expect(r?.error).toContain("desactivado");
  });

  it("sin sesión, no", async () => {
    estado.user = null;
    const r = await exigirSuscripcion();
    expect(r?.error).toContain("iniciar sesión");
  });

  it("sin ficha vinculada no hay nada que editar", async () => {
    estado.miembroEmpresa = [];
    estado.miembroProveedor = [];
    const r = await exigirSuscripcion();
    expect(r?.error).toContain("no está vinculada");
  });
});
