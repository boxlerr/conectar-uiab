// Se carga con NODE_OPTIONS="--require <este archivo>" antes que Next.
// Envuelve globalThis.fetch y anota cada llamada a Supabase (REST, Auth,
// Storage) en SUPA_LOG, una línea JSON por llamada. Next envuelve después a
// este fetch con el suyo, así que pasan por acá las queries del middleware,
// de los Server Components, de los Server Actions y de los route handlers.
//
// Con AsyncLocalStorage cada query queda atribuida al request HTTP entrante
// que la originó (documento, RSC de navegación, prefetch o Server Action).
const fs = require("fs");
const http = require("http");
const { AsyncLocalStorage } = require("async_hooks");
const LOG = process.env.SUPA_LOG;

if (LOG && typeof globalThis.fetch === "function") {
  const als = new AsyncLocalStorage();
  let n = 0;

  const emitOriginal = http.Server.prototype.emit;
  http.Server.prototype.emit = function (evento, req, res) {
    if (evento === "request" && req && req.headers) {
      const h = req.headers;
      const ctx = {
        id: ++n,
        url: (req.url || "").slice(0, 120),
        tipo: h["next-action"]
          ? "accion"
          : h["next-router-prefetch"]
          ? "prefetch"
          : h["rsc"]
          ? "rsc"
          : "doc",
      };
      return als.run(ctx, () => emitOriginal.apply(this, arguments));
    }
    return emitOriginal.apply(this, arguments);
  };

  const original = globalThis.fetch;
  globalThis.fetch = async function fetchConLog(input, init) {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes(".supabase.co")) return original(input, init);

    const t0 = Date.now();
    const req = als.getStore();
    const method = (init && init.method) || (typeof input === "object" && input.method) || "GET";
    const [ruta, qs = ""] = url.split(".supabase.co")[1].split("?");
    const linea = (extra) =>
      fs.appendFileSync(
        LOG,
        JSON.stringify({
          t: t0,
          dur: Date.now() - t0,
          method,
          ruta,
          qs: decodeURIComponent(qs).slice(0, 240),
          req,
          ...extra,
        }) + "\n"
      );
    try {
      const res = await original(input, init);
      linea({ status: res.status });
      return res;
    } catch (e) {
      linea({ error: String((e && e.name) || e) });
      throw e;
    }
  };
}
