// Lista los recursos de una página con su peso (para ver qué se baja).
import { chromium } from "playwright";
import path from "node:path";
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const BASE = process.env.BASE || "http://localhost:3100";
const [ruta = "/privacidad", tipo = "image", ancho = "1366"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: EXE });
const ctx = await b.newContext({ viewport: { width: Number(ancho), height: 900 } });
const p = await ctx.newPage();
const filas = [];
p.on("requestfinished", async (r) => {
  if (tipo !== "all" && r.resourceType() !== tipo) return;
  const s = await r.sizes();
  filas.push([s.responseBodySize, r.resourceType(), decodeURIComponent(r.url().replace(BASE, "")).slice(0, 150)]);
});
await p.goto(BASE + ruta, { waitUntil: "load" });
await p.waitForLoadState("networkidle").catch(() => {});
await p.waitForTimeout(1500);
filas.sort((a, b) => b[0] - a[0]);
let total = 0;
for (const [s, t, u] of filas) { total += s; console.log(String(Math.round(s / 1024)).padStart(6), "KB", t.padEnd(10), u); }
console.log("TOTAL", Math.round(total / 1024), "KB en", filas.length, "recursos");
await b.close();
