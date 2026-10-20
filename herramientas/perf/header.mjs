// Compara el header VISIBLE entre dos servidores (main en :3200 vs. la rama en
// :3100), anónimo y logueado, y lista los estados que pasó en la rama mientras
// cargaba. diff-texto.mjs mira sólo <main>; esto prueba que el header resuelto
// es el mismo y que la socia no ve un "Ingresar" mientras se resuelve la sesión.
// Uso: A=... B=... RUTAS=/a,/b node header.mjs (necesita .sesion.json vigente)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const estado = JSON.parse(fs.readFileSync(new URL("./.sesion.json", import.meta.url), "utf8"));
const browser = await chromium.launch({ executablePath: EXE });
const A = process.env.A || "http://localhost:3200";
const B = process.env.B || "http://localhost:3100";
const rutas = (process.env.RUTAS || "/nosotros,/empresas/vaxler,/boletin,/rubros,/sumate,/privacidad,/directorio,/panel-de-control").split(",");
const visible = () => {
  const h = document.querySelector("header");
  if (!h) return null;
  // Sólo lo que se ve: innerText ya saltea visibility:hidden.
  return h.innerText.replace(/\s+/g, " ").trim();
};
let difs = 0;
for (const modo of ["anon", "logueado"]) {
  for (const ruta of rutas) {
    if (modo === "anon" && ruta === "/panel-de-control") continue;
    const res = {};
    for (const base of [A, B]) {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, ...(modo === "logueado" ? { storageState: estado } : {}) });
      const p = await ctx.newPage();
      // Fotos del header durante la carga: lo visible en cada momento.
      await p.addInitScript(() => {
        window.__fotos = [];
        const tomar = () => { const h = document.querySelector("header"); if (h) window.__fotos.push(h.innerText.replace(/\s+/g, " ").trim()); };
        const obs = new MutationObserver(tomar);
        document.addEventListener("DOMContentLoaded", () => { tomar(); obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true }); });
      });
      await p.goto(base + ruta, { waitUntil: "load" });
      await p.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await p.waitForTimeout(800);
      const final = await p.evaluate(visible);
      const vistos = [...new Set(await p.evaluate(() => window.__fotos))];
      res[base] = { final, vistos };
      await ctx.close();
    }
    const [a, b] = Object.values(res);
    const igual = a.final === b.final;
    if (!igual) difs++;
    console.log(`${igual ? "IGUAL " : "DIFIERE"} ${modo.padEnd(8)} ${ruta.padEnd(18)} final: ${b.final}`);
    if (!igual) console.log("        main: " + a.final);
    console.log("        estados visibles en la rama: " + b.vistos.map((v) => JSON.stringify(v)).join("  →  "));
  }
}
await browser.close();
console.log(difs ? `${difs} con diferencias` : "Header igual en todas");
