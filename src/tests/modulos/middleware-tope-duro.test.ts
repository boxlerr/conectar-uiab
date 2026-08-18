import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

/**
 * El tope duro del middleware.
 *
 * Esto es lo que impide el `MIDDLEWARE_INVOCATION_TIMEOUT` del 2026-08-15: si
 * `updateSession` se cuelga —por Supabase caída, o por los reintentos con
 * backoff que `auth-js` hace por su cuenta y que ningún timeout de fetch toca—,
 * el middleware tiene que contestar IGUAL, con el degradado escrito en el catch:
 * cerrado en lo privado, abierto en lo público.
 *
 * Sin esto, quien tuviera sesión veía una pantalla de error de la plataforma y
 * quien no la tuviera navegaba normal: el sitio parecía sano desde afuera
 * mientras las socias no podían entrar.
 */

const updateSession = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (req: NextRequest) => updateSession(req),
}));

/** Nunca resuelve: simula Supabase sin contestar. */
const nuncaContesta = () => new Promise<never>(() => {});

beforeEach(() => {
  vi.useFakeTimers();
  updateSession.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Corre el middleware dejando que venza el tope duro. */
async function correrConCuelgue(url: string) {
  const { middleware } = await import("@/middleware");
  updateSession.mockImplementation(nuncaContesta);

  const promesa = middleware(new NextRequest(url));
  await vi.advanceTimersByTimeAsync(13_000);
  return promesa;
}

describe("middleware: tope duro", () => {
  it("manda al login en una ruta privada en vez de colgarse", async () => {
    const res = await correrConCuelgue("https://uiabconecta.com/panel-de-control");

    expect(res.status).toBe(307);
    const destino = new URL(res.headers.get("location")!);
    expect(destino.pathname).toBe("/login");
    // Con el redirect puesto, así vuelve a donde iba cuando la base se recupere.
    expect(destino.searchParams.get("redirect")).toBe("/panel-de-control");
  });

  it("corta /admin igual que el resto de lo privado", async () => {
    const res = await correrConCuelgue("https://uiabconecta.com/admin/usuarios");
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("sirve lo público igual: el directorio no depende de validar sesión", async () => {
    const res = await correrConCuelgue("https://uiabconecta.com/directorio");
    // Ni redirect ni error: sigue de largo y la página se renderiza.
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("la portada tampoco se cae", async () => {
    const res = await correrConCuelgue("https://uiabconecta.com/");
    expect(res.status).toBe(200);
  });

  it("no espera el tope entero si updateSession contesta bien", async () => {
    const { middleware } = await import("@/middleware");
    const esperada = NextResponse.next();
    updateSession.mockResolvedValue(esperada);

    // Sin avanzar el reloj: si el tope duro bloqueara el camino feliz, esto
    // quedaría pendiente para siempre y el test se colgaría.
    const res = await middleware(new NextRequest("https://uiabconecta.com/perfil"));

    expect(res).toBe(esperada);
  });

  it("deja de esperar el temporizador cuando ya contestó", async () => {
    const { middleware } = await import("@/middleware");
    updateSession.mockResolvedValue(NextResponse.next());

    await middleware(new NextRequest("https://uiabconecta.com/"));

    // Un timer pendiente mantiene vivo el event loop y demoraría el retorno de
    // CADA request que sí anduvo bien.
    expect(vi.getTimerCount()).toBe(0);
  });
});
