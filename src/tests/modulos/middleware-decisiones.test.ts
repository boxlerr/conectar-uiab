import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Las DECISIONES del middleware de sesión (`updateSession`), con Supabase
 * simulado: a dónde manda a cada tipo de cuenta y cuántas veces le pregunta a
 * la base para decidirlo.
 *
 * Se escribió el 2026-10-20 ANTES de optimizar la cadena de queries (eran seis
 * viajes en serie para una socia en una ruta paga, dos repetidos), corriéndolo
 * primero contra el código viejo para fijar el comportamiento. Si un cambio de
 * performance mueve una sola de estas redirecciones, deja socias afuera o deja
 * pasar a quien no pagó: por eso cada caso de abajo es una puerta distinta.
 */

type Fila = Record<string, unknown> | null;

interface Escenario {
  usuario: { id: string } | null;
  perfil?: Fila;
  /** Si es true, la query a `perfiles` falla (timeout, red). */
  perfilFalla?: boolean;
  membresiaEmpresa?: Fila;
  membresiaProveedor?: Fila;
  suscripcion?: Fila;
}

let escenario: Escenario;
let consultas: string[];

/** Query builder mínimo: encadena todo y al final contesta según la tabla. */
function consulta(tabla: string) {
  consultas.push(tabla);
  const builder: Record<string, unknown> = {};
  const encadenar = () => builder;
  for (const m of ["select", "eq", "is", "order", "limit", "or", "in", "neq"]) builder[m] = encadenar;
  const responder = () => {
    if (tabla === "perfiles") {
      return escenario.perfilFalla
        ? { data: null, error: { message: "timeout" } }
        : { data: escenario.perfil ?? null, error: null };
    }
    if (tabla === "miembros_empresa") return { data: escenario.membresiaEmpresa ?? null, error: null };
    if (tabla === "miembros_proveedor") return { data: escenario.membresiaProveedor ?? null, error: null };
    if (tabla === "suscripciones") return { data: escenario.suscripcion ?? null, error: null };
    return { data: null, error: null };
  };
  builder.maybeSingle = () => builder;
  builder.single = () => builder;
  builder.then = (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) =>
    Promise.resolve(responder()).then(ok, ko);
  return builder;
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () =>
        escenario.usuario
          ? { data: { user: escenario.usuario }, error: null }
          : { data: { user: null }, error: { message: "sin sesión" } },
    },
    from: (tabla: string) => consulta(tabla),
  }),
}));

const SOCIA = { id: "perfil-socia" };
const EMPRESA_APROBADA = { empresa_id: "emp-1", empresas: { estado: "aprobada" } };
const AL_DIA = { estado: "activa", gracia_hasta: null };

async function correr(ruta: string, e: Escenario) {
  escenario = e;
  consultas = [];
  const { updateSession } = await import("@/lib/supabase/middleware");
  const res = await updateSession(new NextRequest(`https://www.uiabconecta.com${ruta}`));
  const location = res.headers.get("location");
  return { status: res.status, destino: location ? new URL(location) : null, consultas };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("middleware: a dónde va cada cuenta", () => {
  it("socia aprobada y al día entra al panel", async () => {
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true, debe_completar_cuenta: false },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: AL_DIA,
    });
    expect(r.destino).toBeNull();
    expect(r.status).toBe(200);
  });

  it("socia aprobada SIN pagar va a /suscripcion/bloqueado", async () => {
    const r = await correr("/perfil/datos", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: { estado: "pendiente_pago", gracia_hasta: null },
    });
    expect(r.destino?.pathname).toBe("/suscripcion/bloqueado");
    expect(r.destino?.searchParams.get("from")).toBe("/perfil/datos");
  });

  it("en mora con la gracia vencida también queda bloqueada", async () => {
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: { estado: "en_mora", gracia_hasta: "2020-01-01T00:00:00Z" },
    });
    expect(r.destino?.pathname).toBe("/suscripcion/bloqueado");
  });

  it("donde se paga no hay gate: /perfil/suscripcion pasa aunque no haya pagado", async () => {
    const r = await correr("/perfil/suscripcion", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: { estado: "pendiente_pago" },
    });
    expect(r.destino).toBeNull();
  });

  it("socia con la empresa pendiente de revisión va a /pendiente-aprobacion", async () => {
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: { empresa_id: "emp-1", empresas: { estado: "pendiente_revision" } },
      suscripcion: AL_DIA,
    });
    expect(r.destino?.pathname).toBe("/pendiente-aprobacion");
  });

  it("prestador aprobado y al día entra", async () => {
    const r = await correr("/panel-de-control", {
      usuario: { id: "perfil-prov" },
      perfil: { rol_sistema: "provider", activo: true },
      membresiaProveedor: { proveedor_id: "prov-1", proveedores: { estado: "aprobado" } },
      suscripcion: AL_DIA,
    });
    expect(r.destino).toBeNull();
  });

  it("prestador aprobado sin pagar queda bloqueado", async () => {
    const r = await correr("/panel-de-control", {
      usuario: { id: "perfil-prov" },
      perfil: { rol_sistema: "provider", activo: true },
      membresiaProveedor: { proveedor_id: "prov-1", proveedores: { estado: "aprobado" } },
      suscripcion: null,
    });
    expect(r.destino?.pathname).toBe("/suscripcion/bloqueado");
  });

  it("una socia común no entra a /admin", async () => {
    const r = await correr("/admin/usuarios", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: AL_DIA,
    });
    expect(r.destino?.pathname).toBe("/403");
  });

  it("el admin entra a /admin sin gate de suscripción", async () => {
    const r = await correr("/admin/usuarios", {
      usuario: { id: "perfil-admin" },
      perfil: { rol_sistema: "admin", activo: true },
    });
    expect(r.destino).toBeNull();
  });

  it("con el perfil ilegible /admin no se sirve, pero avisa que fue un timeout", async () => {
    const r = await correr("/admin", { usuario: { id: "perfil-admin" }, perfilFalla: true });
    expect(r.destino?.pathname).toBe("/403");
    expect(r.destino?.searchParams.get("motivo")).toBe("sin-verificar");
  });

  it("con el perfil ilegible una socia no queda rebotando: pasa, como antes", async () => {
    // Un timeout no puede leerse como "no pagaste" ni como "no estás aprobada":
    // el gate de aprobación la deja seguir y el de suscripción reintenta el
    // perfil; si vuelve a fallar, no decide.
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfilFalla: true,
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: { estado: "pendiente_pago" },
    });
    expect(r.destino).toBeNull();
    expect(r.consultas.filter((t) => t === "perfiles")).toHaveLength(3);
  });

  it("cuenta desactivada va al login con el aviso", async () => {
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: false },
      membresiaEmpresa: EMPRESA_APROBADA,
    });
    expect(r.destino?.pathname).toBe("/login");
    expect(r.destino?.searchParams.get("cuenta")).toBe("desactivada");
  });

  it("clave provisoria: no sale de /completar-cuenta", async () => {
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true, debe_completar_cuenta: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: AL_DIA,
    });
    expect(r.destino?.pathname).toBe("/completar-cuenta");
  });

  it("sin sesión, lo privado manda al login con el redirect", async () => {
    const r = await correr("/perfil", { usuario: null });
    expect(r.destino?.pathname).toBe("/login");
    expect(r.destino?.searchParams.get("redirect")).toBe("/perfil");
  });

  it("con sesión, la portada lleva al panel", async () => {
    const r = await correr("/", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
    });
    expect(r.destino?.pathname).toBe("/panel-de-control");
  });

  it("lo público no se bloquea aunque no haya pagado", async () => {
    const r = await correr("/directorio", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: { estado: "pendiente_pago" },
    });
    expect(r.destino).toBeNull();
  });
});

describe("middleware: cuántas veces le pregunta a la base", () => {
  it("socia en una ruta paga: perfil y membresía UNA vez cada uno", async () => {
    const r = await correr("/panel-de-control", {
      usuario: SOCIA,
      perfil: { rol_sistema: "company", activo: true },
      membresiaEmpresa: EMPRESA_APROBADA,
      suscripcion: AL_DIA,
    });
    expect(r.consultas.filter((t) => t === "perfiles")).toHaveLength(1);
    expect(r.consultas.filter((t) => t === "miembros_empresa")).toHaveLength(1);
    expect(r.consultas.filter((t) => t === "suscripciones")).toHaveLength(1);
  });

  it("sin sesión no consulta nada", async () => {
    const r = await correr("/directorio", { usuario: null });
    expect(r.consultas).toHaveLength(0);
  });
});
