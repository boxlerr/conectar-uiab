// TTFB del documento y del payload RSC, anónimo y logueado, entre dos servidores
// (main en :3200 vs. la rama en :3100), INTERCALADOS request a request: los
// picos de latencia de Supabase Auth (plan Free) caen parejo en los dos lados
// en vez de ensuciar una sola corrida.
//
// Mide lo que paga el middleware: con las páginas públicas en ISR, el anónimo
// sale en milisegundos y la diferencia con el logueado es lo que tarda
// `updateSession` en decidir. Sin browser: `fetch` con la cookie de .sesion.json
// y `redirect: "manual"` (un 307 también es una respuesta, y se reporta).
//
// Uso: A=http://localhost:3200 B=http://localhost:3100 N=15 node ttfb-sesion.mjs [salida.json]
// Env opcionales: RUTAS (separadas por coma), MODOS (anon,logueado), TIPOS (doc,rsc).
// Necesita .sesion.json vigente (lo arma medir.mjs/sesion.mjs) y que el access
// token NO esté vencido: si vence a mitad de corrida, cada request refresca.
import fs from "node:fs";

const A = process.env.A || "http://localhost:3200";
const B = process.env.B || "http://localhost:3100";
const N = Number(process.env.N || 15);
const OUT = process.argv[2];
const RUTAS = (
  process.env.RUTAS ||
  "/nosotros,/rubros,/empresas/vaxler,/boletin,/sumate,/privacidad,/directorio,/empresas,/oportunidades,/panel-de-control"
).split(",");
const MODOS = (process.env.MODOS || "anon,logueado").split(",");
const TIPOS = (process.env.TIPOS || "doc,rsc").split(",");

const estado = JSON.parse(fs.readFileSync(new URL("./.sesion.json", import.meta.url), "utf8"));
const cookie = estado.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
{
  let v = estado.cookies.find((c) => c.name.startsWith("sb-"))?.value ?? "";
  if (v.startsWith("base64-")) v = Buffer.from(v.slice(7), "base64").toString();
  const vence = JSON.parse(v).expires_at * 1000;
  const minutos = Math.round((vence - Date.now()) / 60000);
  if (minutos < 5) throw new Error(`el access token vence en ${minutos} min: borrá .sesion.json y armá otra`);
  console.log(`access token vigente ${minutos} min más`);
}

async function una(base, ruta, modo, tipo) {
  const headers = {};
  if (modo === "logueado") headers.cookie = cookie;
  if (tipo === "rsc") headers.rsc = "1";
  const t0 = performance.now();
  const r = await fetch(base + ruta, { headers, redirect: "manual" });
  const ttfb = performance.now() - t0;
  await r.arrayBuffer();
  return { ttfb, status: r.status, location: r.headers.get("location") };
}

const q = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

// Calentar: primer request de cada ruta (compila/lee caché, JWKS) fuera de la cuenta.
for (const ruta of RUTAS) for (const base of [A, B]) for (const modo of MODOS) await una(base, ruta, modo, "doc");

const filas = [];
for (const modo of MODOS) {
  for (const tipo of TIPOS) {
    for (const ruta of RUTAS) {
      const t = { [A]: [], [B]: [] };
      const st = { [A]: new Set(), [B]: new Set() };
      for (let i = 0; i < N; i++) {
        // Alterna quién va primero para no regalarle el "segundo" a nadie.
        for (const base of i % 2 ? [B, A] : [A, B]) {
          const r = await una(base, ruta, modo, tipo);
          t[base].push(r.ttfb);
          st[base].add(r.status + (r.location ? "→" + new URL(r.location, base).pathname : ""));
        }
      }
      const fila = { modo, tipo, ruta };
      for (const [k, base] of [["a", A], ["b", B]]) {
        fila[k] = { p50: q(t[base], 0.5), p90: q(t[base], 0.9), max: Math.max(...t[base]), status: [...st[base]].join(",") };
      }
      filas.push(fila);
      const f = (x) => String(Math.round(x)).padStart(5);
      console.log(
        `${modo.padEnd(8)} ${tipo} ${ruta.padEnd(18)} main p50${f(fila.a.p50)} p90${f(fila.a.p90)} | rama p50${f(fila.b.p50)} p90${f(fila.b.p90)}  [${fila.a.status} | ${fila.b.status}]`
      );
    }
  }
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ A, B, N, filas }, null, 2));
