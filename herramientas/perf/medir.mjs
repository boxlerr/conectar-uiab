import { obtenerSesion } from "./sesion.mjs";
// Mide cada ruta contra un `next start` local: tiempos (TTFB, FCP, LCP, CLS,
// TBT aprox.), bytes por tipo, requests RSC/prefetch, requests del browser a
// Supabase y queries a Supabase que hizo EL SERVIDOR mientras se cargaba la
// página (leídas del log que escribe fetch-log-preload.cjs).
//
// Uso: SUPA_LOG=... BASE=http://localhost:3100 node medir.mjs salida.json
// Env opcionales: RUNS (3), MODO (anon|logueado|ambos), CPU (factor de
// throttling, 1 = sin), RUTAS (lista separada por comas para acotar).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = process.argv[2] || "medicion.json";
const SUPA_LOG = process.env.SUPA_LOG;
const RUNS = Number(process.env.RUNS || 3);
const MODO = process.env.MODO || "ambos";
const CPU = Number(process.env.CPU || 1);
const WT = process.env.WT;
const EXE = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell"
);

const PUBLICAS = [
  "/",
  "/directorio",
  "/empresas",
  "/empresas/vaxler",
  "/boletin",
  "/rubros",
  "__RUBRO__",
  "__NOTA__",
  "/nosotros",
  "/sumate",
  "/login",
  "/oportunidades",
  "/privacidad",
];
const PRIVADAS = [
  "/panel-de-control",
  "/perfil",
  "/oportunidades",
  "/directorio",
  "/empresas/vaxler",
  "/admin",
  "/admin/empresas",
  "/",
];

function leerEnv() {
  const env = {};
  for (const l of fs.readFileSync(path.join(WT, ".env"), "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function rutasDinamicas() {
  // Un rubro y una nota reales, sacados del sitemap del mismo build.
  const xml = await (await fetch(BASE + "/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  return {
    __RUBRO__: locs.find((p) => p.startsWith("/rubros/")) || "/rubros",
    __NOTA__: locs.find((p) => p.startsWith("/boletin/")) || "/boletin",
  };
}

async function estadoLogueado(browser) {
  const env = leerEnv();
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email: env.UIAB_EMAIL }),
  });
  const { hashed_token } = await r.json();
  if (!hashed_token) throw new Error("no se pudo generar el magic link");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/api/auth/callback?token_hash=${hashed_token}&type=magiclink&next=/403`, {
    waitUntil: "load",
    timeout: 120000,
  });
  const estado = await ctx.storageState();
  await ctx.close();
  if (!estado.cookies.some((c) => c.name.startsWith("sb-"))) throw new Error("sin cookie de sesión");
  return estado;
}

function marca(datos) {
  if (SUPA_LOG) fs.appendFileSync(SUPA_LOG, JSON.stringify({ marca: true, t: Date.now(), ...datos }) + "\n");
}

async function medirUna(browser, ruta, estado) {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    reducedMotion: "no-preference",
    ...(estado ? { storageState: estado } : {}),
  });
  const page = await ctx.newPage();
  if (CPU > 1) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  }
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0, lt: [] };
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__m.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__m.lt.push([e.startTime, e.duration]);
      }).observe({ type: "longtask", buffered: true });
    } catch {}
  });

  const reqs = [];
  page.on("requestfinished", async (req) => {
    try {
      const s = await req.sizes();
      const h = req.headers();
      const res = await req.response();
      reqs.push({
        url: req.url(),
        tipo: req.resourceType(),
        metodo: req.method(),
        bytes: s.responseBodySize + s.responseHeadersSize,
        cuerpo: s.responseBodySize,
        rsc: !!(h["rsc"] || req.url().includes("_rsc=")),
        prefetch: !!h["next-router-prefetch"],
        accion: !!h["next-action"],
        status: res ? res.status() : 0,
      });
    } catch {}
  });

  const t0 = Date.now();
  marca({ ruta, fase: "inicio" });
  const resp = await page.goto(BASE + ruta, { waitUntil: "load", timeout: 180000 });
  const html = resp ? await resp.text().catch(() => "") : "";
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    const fcpT = fcp ? fcp.startTime : 0;
    const tbt = window.__m.lt
      .filter(([s]) => s >= fcpT)
      .reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : null,
      dcl: nav ? nav.domContentLoadedEventEnd : null,
      load: nav ? nav.loadEventEnd : null,
      fcp: fcpT,
      lcp: window.__m.lcp,
      cls: window.__m.cls,
      tbt,
      longTasks: window.__m.lt.length,
      domNodes: document.getElementsByTagName("*").length,
    };
  });
  marca({ ruta, fase: "fin" });
  const urlFinal = page.url();
  await ctx.close();

  const de = (f) => reqs.filter(f);
  const suma = (arr) => arr.reduce((a, r) => a + (r.cuerpo || 0), 0);
  const esSupa = (r) => { try { return new URL(r.url).hostname.endsWith(".supabase.co"); } catch { return false; } };
  const js = de((r) => r.tipo === "script");
  return {
    ruta,
    urlFinal: urlFinal.replace(BASE, ""),
    ...m,
    htmlKB: +(html.length / 1024).toFixed(1),
    preloadsImagen: (html.match(/<link[^>]+rel="preload"[^>]+as="image"/g) || []).length,
    requests: reqs.length,
    jsKB: +(suma(js) / 1024).toFixed(1),
    jsArchivos: js.length,
    cssKB: +(suma(de((r) => r.tipo === "stylesheet")) / 1024).toFixed(1),
    imgKB: +(suma(de((r) => r.tipo === "image")) / 1024).toFixed(1),
    imgCant: de((r) => r.tipo === "image").length,
    fontKB: +(suma(de((r) => r.tipo === "font")) / 1024).toFixed(1),
    totalKB: +(suma(reqs) / 1024).toFixed(1),
    rscReqs: de((r) => r.rsc && !esSupa(r)).length,
    prefetchReqs: de((r) => r.prefetch).length,
    accionesReqs: de((r) => r.accion).length,
    supaBrowser: de(esSupa).length,
    supaBrowserLista: de(esSupa).map((r) => r.metodo + " " + r.url.split(".supabase.co")[1].split("?")[0]),
    ventana: [t0, Date.now()],
  };
}

function queriesServidor(ventana) {
  if (!SUPA_LOG || !fs.existsSync(SUPA_LOG)) return { total: 0, lista: {} };
  const lineas = fs
    .readFileSync(SUPA_LOG, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((l) => !l.marca && l.t >= ventana[0] && l.t <= ventana[1]);
  const lista = {};
  for (const l of lineas) {
    const k = `${l.method} ${l.ruta}`;
    lista[k] = (lista[k] || 0) + 1;
  }
  return { total: lineas.length, msTotal: lineas.reduce((a, l) => a + l.dur, 0), lista };
}

const mediana = (xs) => {
  const v = xs.filter((x) => typeof x === "number").sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

const browser = await chromium.launch({ executablePath: EXE });
const dyn = await rutasDinamicas();
const resultado = { base: BASE, fecha: new Date().toISOString(), runs: RUNS, cpu: CPU, anon: {}, logueado: {} };

const tandas = [];
if (MODO !== "logueado") tandas.push(["anon", PUBLICAS, null]);
if (MODO !== "anon") tandas.push(["logueado", PRIVADAS, await obtenerSesion(browser, BASE, WT)]);

const filtro = process.env.RUTAS ? process.env.RUTAS.split(",") : null;

for (const [nombre, rutas, estado] of tandas) {
  for (const r0 of rutas) {
    const ruta = dyn[r0] || r0;
    if (filtro && !filtro.includes(ruta)) continue;
    // Calentar: la primera visita compila/llena cachés del server.
    await medirUna(browser, ruta, estado).catch(() => {});
    const corridas = [];
    for (let i = 0; i < RUNS; i++) {
      const c = await medirUna(browser, ruta, estado);
      c.servidor = queriesServidor(c.ventana);
      corridas.push(c);
    }
    const num = (k) => mediana(corridas.map((c) => c[k]));
    const fila = {
      ruta,
      urlFinal: corridas[0].urlFinal,
      ttfb: num("ttfb"),
      fcp: num("fcp"),
      lcp: num("lcp"),
      cls: num("cls"),
      tbt: num("tbt"),
      load: num("load"),
      htmlKB: num("htmlKB"),
      preloadsImagen: num("preloadsImagen"),
      requests: num("requests"),
      jsKB: num("jsKB"),
      jsArchivos: num("jsArchivos"),
      cssKB: num("cssKB"),
      imgKB: num("imgKB"),
      imgCant: num("imgCant"),
      fontKB: num("fontKB"),
      totalKB: num("totalKB"),
      rscReqs: num("rscReqs"),
      prefetchReqs: num("prefetchReqs"),
      supaBrowser: num("supaBrowser"),
      supaServidor: mediana(corridas.map((c) => c.servidor.total)),
      supaServidorMs: mediana(corridas.map((c) => c.servidor.msTotal)),
      detalle: { supaBrowserLista: corridas[0].supaBrowserLista, servidor: corridas[0].servidor.lista },
    };
    resultado[nombre][ruta] = fila;
    console.log(
      `${nombre.padEnd(8)} ${ruta.padEnd(34)} ttfb=${Math.round(fila.ttfb)} lcp=${Math.round(fila.lcp)} tbt=${Math.round(
        fila.tbt
      )} js=${fila.jsKB}KB img=${fila.imgKB}KB req=${fila.requests} rsc=${fila.rscReqs} supaSrv=${fila.supaServidor} supaBrw=${fila.supaBrowser}`
    );
  }
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify(resultado, null, 2));
console.log("→", OUT);
