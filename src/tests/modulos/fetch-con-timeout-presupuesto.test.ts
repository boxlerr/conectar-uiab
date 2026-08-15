import { describe, it, expect, vi, afterEach } from "vitest";
import { crearFetchConTimeout } from "@/lib/supabase/fetch-con-timeout";

/**
 * El presupuesto compartido del middleware.
 *
 * Lo que se prueba no es "cada query tiene timeout" —eso ya andaba— sino que una
 * CADENA de queries no multiplique el tope. Ese era el agujero por el que se
 * coló el 504 del 2026-08-15: cinco llamadas de 8s cada una son 40s, y la
 * plataforma corta el middleware a los 25s sin pasar por ningún catch nuestro.
 */

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  vi.restoreAllMocks();
});

/** Un fetch que no contesta nunca, pero que respeta el AbortSignal. */
function fetchQueSeCuelga() {
  return vi.fn((_input: unknown, init?: RequestInit) => {
    return new Promise<Response>((_resolver, rechazar) => {
      init?.signal?.addEventListener("abort", () =>
        rechazar((init.signal as AbortSignal).reason ?? new Error("abortado"))
      );
    });
  });
}

describe("crearFetchConTimeout", () => {
  it("corta una query colgada en el tope por llamada", async () => {
    globalThis.fetch = fetchQueSeCuelga() as unknown as typeof fetch;
    const f = crearFetchConTimeout({ timeoutMs: 60 });

    const arranque = Date.now();
    await expect(f("https://x.supabase.co/rest/v1/empresas")).rejects.toThrow();
    const tardo = Date.now() - arranque;

    expect(tardo).toBeGreaterThanOrEqual(50);
    expect(tardo).toBeLessThan(400);
  });

  it("no intenta siquiera la conexión si el presupuesto ya venció", async () => {
    const espia = fetchQueSeCuelga();
    globalThis.fetch = espia as unknown as typeof fetch;
    const f = crearFetchConTimeout({ deadline: Date.now() - 1 });

    await expect(f("https://x.supabase.co/rest/v1/perfiles")).rejects.toThrow();
    // Lo importante: ni se abrió el socket. Durante una caída, seguir abriendo
    // conexiones que ya sabemos que no van a llegar a tiempo sólo suma latencia.
    expect(espia).not.toHaveBeenCalled();
  });

  it("una CADENA de queries respeta el presupuesto en vez de multiplicarlo", async () => {
    globalThis.fetch = fetchQueSeCuelga() as unknown as typeof fetch;

    // El caso real del middleware, a escala: cinco queries seguidas con tope de
    // 100ms cada una. Se miden las dos variantes en la misma corrida para que el
    // test pruebe la DIFERENCIA y no un número absoluto que dependa de la
    // máquina — y para que no pueda pasar por casualidad si el `deadline` se
    // rompiera.
    const correrCadena = async (deadline?: number) => {
      const f = crearFetchConTimeout({ timeoutMs: 100, deadline });
      const arranque = Date.now();
      for (let i = 0; i < 5; i++) {
        await f(`https://x.supabase.co/rest/v1/tabla${i}`).catch(() => {});
      }
      return Date.now() - arranque;
    };

    const sinPresupuesto = await correrCadena();
    const conPresupuesto = await correrCadena(Date.now() + 150);

    // Sin presupuesto, los topes se suman: 5 × 100ms.
    expect(sinPresupuesto).toBeGreaterThanOrEqual(450);
    // Con presupuesto, la cadena entera cabe en su ventana.
    expect(conPresupuesto).toBeLessThan(300);
    expect(conPresupuesto).toBeLessThan(sinPresupuesto / 2);
  });

  it("deja pasar una respuesta normal sin tocarla", async () => {
    const respuesta = new Response('{"ok":true}', { status: 200 });
    globalThis.fetch = vi.fn(() => Promise.resolve(respuesta)) as unknown as typeof fetch;

    const f = crearFetchConTimeout({ timeoutMs: 60, deadline: Date.now() + 5_000 });
    const r = await f("https://x.supabase.co/rest/v1/empresas");

    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });

  it("no deja timers colgados cuando la query contesta a tiempo", async () => {
    // Un setTimeout pendiente mantiene vivo el event loop; en una función de
    // Vercel eso demora el retorno de CADA request que sí anduvo bien.
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response("{}", { status: 200 }))
    ) as unknown as typeof fetch;
    const limpiar = vi.spyOn(globalThis, "clearTimeout");

    const f = crearFetchConTimeout({ timeoutMs: 5_000 });
    await f("https://x.supabase.co/rest/v1/empresas");

    expect(limpiar).toHaveBeenCalled();
  });

  it("respeta un AbortSignal que ya traiga el caller", async () => {
    const espia = fetchQueSeCuelga();
    globalThis.fetch = espia as unknown as typeof fetch;
    const control = new AbortController();
    const f = crearFetchConTimeout({ timeoutMs: 5_000 });

    const promesa = f("https://x.supabase.co/rest/v1/empresas", { signal: control.signal });
    control.abort(new Error("cancelado por el caller"));

    await expect(promesa).rejects.toThrow(/cancelado por el caller/);
  });
});
