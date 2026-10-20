// Qué nodos se mueven (layout-shift) al cargar una ruta, en viewport móvil.
import { chromium, devices } from "playwright";
import path from "node:path";
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const BASE = process.env.BASE || "http://localhost:3100";
const ruta = process.argv[2] || "/empresas";
const b = await chromium.launch({ executablePath: EXE });
const ctx = await b.newContext({ viewport: { width: Number(process.env.W || 412), height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, reducedMotion: process.env.RM || "no-preference", userAgent: process.env.UA || undefined });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__shifts = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__shifts.push({
        t: Math.round(e.startTime), v: +e.value.toFixed(4),
        fuentes: (e.sources || []).map((s) => {
          const n = s.node;
          const desc = n ? (n.nodeType === 1 ? n.tagName.toLowerCase() + (n.id ? "#" + n.id : "") + "." + String(n.className || "").split(" ").slice(0, 4).join(".") : "#text:" + (n.textContent || "").slice(0, 40)) : "?";
          return `${desc} y:${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} h:${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}`;
        }),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});
await p.goto(BASE + ruta, { waitUntil: "load" });
await p.waitForTimeout(4000);
const s = await p.evaluate(() => window.__shifts);
let total = 0;
for (const x of s) { total += x.v; console.log(x.t + "ms", x.v, "\n   " + x.fuentes.join("\n   ")); }
console.log("CLS total", total.toFixed(3));
await b.close();
