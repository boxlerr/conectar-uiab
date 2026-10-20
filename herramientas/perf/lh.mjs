// Lighthouse (perfil móvil por defecto, throttling simulado) sobre las rutas
// públicas, N corridas por ruta, se queda con la mediana del score.
// Uso: BASE=http://localhost:3100 node lh.mjs salida.json [desktop]
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = process.argv[2] || "lh.json";
const DESKTOP = process.argv[3] === "desktop";
const RUNS = Number(process.env.RUNS || 3);
const CHROME = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
);

const xml = await (await fetch(BASE + "/sitemap.xml")).text();
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const RUTAS = (process.env.RUTAS ? process.env.RUTAS.split(",") : [
  "/",
  "/directorio",
  "/empresas",
  "/empresas/vaxler",
  "/boletin",
  locs.find((p) => p.startsWith("/boletin/")),
  locs.find((p) => p.startsWith("/rubros/")),
  "/sumate",
  "/login",
]).filter(Boolean);

const chrome = await chromeLauncher.launch({
  chromePath: CHROME,
  chromeFlags: ["--headless=new", "--no-first-run", "--disable-extensions"],
});

const config = DESKTOP
  ? (await import("lighthouse/core/config/desktop-config.js")).default
  : undefined;

const mediana = (xs) => {
  const v = xs.filter((x) => typeof x === "number").sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

const salida = { base: BASE, perfil: DESKTOP ? "desktop" : "mobile", fecha: new Date().toISOString(), rutas: {} };
for (const ruta of RUTAS) {
  const corridas = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await lighthouse(
      BASE + ruta,
      { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance"] },
      config
    );
    const a = r.lhr.audits;
    corridas.push({
      score: Math.round(r.lhr.categories.performance.score * 100),
      fcp: a["first-contentful-paint"].numericValue,
      lcp: a["largest-contentful-paint"].numericValue,
      tbt: a["total-blocking-time"].numericValue,
      cls: a["cumulative-layout-shift"].numericValue,
      si: a["speed-index"].numericValue,
      bytes: a["total-byte-weight"].numericValue,
      jsSinUsarKB: Math.round((a["unused-javascript"].details?.overallSavingsBytes || 0) / 1024),
      bootupMs: a["bootup-time"].numericValue,
      mainThreadMs: a["mainthread-work-breakdown"].numericValue,
      lcpElemento: a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 160),
    });
  }
  const fila = { ruta };
  for (const k of Object.keys(corridas[0])) {
    fila[k] = typeof corridas[0][k] === "number" ? mediana(corridas.map((c) => c[k])) : corridas[0][k];
  }
  salida.rutas[ruta] = fila;
  console.log(
    `${ruta.padEnd(40)} score=${fila.score} fcp=${Math.round(fila.fcp)} lcp=${Math.round(fila.lcp)} tbt=${Math.round(
      fila.tbt
    )} cls=${fila.cls.toFixed(3)} peso=${Math.round(fila.bytes / 1024)}KB jsSinUsar=${fila.jsSinUsarKB}KB boot=${Math.round(fila.bootupMs)}`
  );
}
await chrome.kill();
fs.writeFileSync(OUT, JSON.stringify(salida, null, 2));
console.log("→", OUT);
