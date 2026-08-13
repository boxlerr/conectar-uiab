import { describe, expect, it } from "vitest";
import {
  esperaHabilitacion,
  estadoDeAcceso,
  leerEstadoAuth,
  type DatosDeAcceso,
} from "@/modulos/admin/estado-acceso";
import { traducirErrorAuth } from "@/lib/autenticacion/errores-auth";

/**
 * El caso que motivó todo esto (2026-08-13): Naves del Sur figuraba "Activo" en
 * /admin/usuarios y no podía entrar. El panel miraba sólo `perfiles.activo`, que
 * es uno de los tres frenos; los otros dos viven en auth.users.
 */

const base: DatosDeAcceso = {
  activo: true,
  baneado_hasta: null,
  email_confirmado: true,
  sin_usuario_auth: false,
};

const enElFuturo = () => new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
const enElPasado = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

describe("estadoDeAcceso", () => {
  it("sin ningún freno, entra", () => {
    expect(estadoDeAcceso(base)).toBe("ok");
    expect(esperaHabilitacion(base)).toBe(false);
  });

  it("perfil desactivado", () => {
    expect(estadoDeAcceso({ ...base, activo: false })).toBe("desactivado");
  });

  it("perfil activo pero baneado en Auth: el chip decía Activo y la persona no entraba", () => {
    const u = { ...base, baneado_hasta: enElFuturo() };
    expect(estadoDeAcceso(u)).toBe("baneado");
    expect(esperaHabilitacion(u)).toBe(true);
  });

  it("perfil activo y sin confirmar el correo tampoco entra", () => {
    // Desde que se prendió "Confirm email" en Supabase, toda cuenta de /register
    // nace así.
    const u = { ...base, email_confirmado: false };
    expect(estadoDeAcceso(u)).toBe("sin_confirmar");
    expect(esperaHabilitacion(u)).toBe(true);
  });

  it("no saber el estado de Auth NO es estar sin confirmar", () => {
    // Si Auth no contesta preferimos no inventar: sería marcar como trabada a
    // media plataforma.
    expect(estadoDeAcceso({ ...base, email_confirmado: null })).toBe("ok");
  });

  it("perfil sin usuario de Auth: no hay nada que habilitar", () => {
    const u = { ...base, sin_usuario_auth: true };
    expect(estadoDeAcceso(u)).toBe("sin_auth");
    // Queda fuera de "pendientes": el botón Habilitar no lo arreglaría.
    expect(esperaHabilitacion(u)).toBe(false);
  });

  it("manda el freno más grave cuando hay varios", () => {
    expect(
      estadoDeAcceso({
        activo: false,
        baneado_hasta: enElFuturo(),
        email_confirmado: false,
        sin_usuario_auth: false,
      })
    ).toBe("desactivado");
  });
});

describe("leerEstadoAuth", () => {
  const clienteCon = (users: unknown[]) => ({
    auth: {
      admin: {
        listUsers: async () => ({ data: { users } as never }),
      },
    },
  });

  it("un ban ya vencido no cuenta como ban", async () => {
    // Supabase NO limpia `banned_until` al levantar el ban: le deja una fecha
    // pasada. Mirar sólo si el campo tiene valor marcaría como bloqueado a todo
    // el que alguna vez lo estuvo.
    const mapa = await leerEstadoAuth(
      clienteCon([
        { id: "a", banned_until: enElPasado(), email_confirmed_at: "2026-01-01T00:00:00Z" },
        { id: "b", banned_until: enElFuturo(), email_confirmed_at: "2026-01-01T00:00:00Z" },
      ]) as never
    );
    expect(mapa.get("a")?.baneadoHasta).toBeNull();
    expect(mapa.get("b")?.baneadoHasta).not.toBeNull();
  });

  it("toma confirmed_at cuando no viene email_confirmed_at", async () => {
    const mapa = await leerEstadoAuth(
      clienteCon([
        { id: "a", confirmed_at: "2026-01-01T00:00:00Z" },
        { id: "b" },
      ]) as never
    );
    expect(mapa.get("a")?.emailConfirmado).toBe(true);
    expect(mapa.get("b")?.emailConfirmado).toBe(false);
  });
});

describe("traducirErrorAuth", () => {
  it('"Email not confirmed" deja de salir en inglés y explica qué hacer', () => {
    const t = traducirErrorAuth("Email not confirmed");
    expect(t).toContain("confirmaste tu correo");
    expect(t).not.toMatch(/email not confirmed/i);
  });

  it("traduce credenciales inválidas", () => {
    expect(traducirErrorAuth("Invalid login credentials")).toContain("incorrectos");
  });

  it("traduce el baneo hablando de reactivar, no de 'ban'", () => {
    const t = traducirErrorAuth("User is banned");
    expect(t).toContain("desactivado");
    expect(t).not.toMatch(/banned/i);
  });

  it("nunca devuelve el mensaje crudo de Supabase", () => {
    // Cualquier error que no tengamos mapeado cae en el genérico: mostrar inglés
    // crudo es justamente lo que se estaba arreglando.
    const crudo = "AuthApiError: something exploded upstream";
    expect(traducirErrorAuth(crudo)).not.toContain("exploded");
    expect(traducirErrorAuth(crudo)).toContain("No pudimos iniciar tu sesión");
  });

  it("sin mensaje tampoco rompe", () => {
    expect(traducirErrorAuth(null)).toBeTruthy();
    expect(traducirErrorAuth(undefined)).toBeTruthy();
    expect(traducirErrorAuth("")).toBeTruthy();
  });
});
