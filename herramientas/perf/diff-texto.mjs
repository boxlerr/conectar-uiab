import { obtenerSesion } from "./sesion.mjs";
// Compara el texto visible de cada ruta entre dos servidores (main vs. rama),
// con la misma sesión. Sirve para probar que un refactor de performance no
// cambió lo que la página MUESTRA. Uso: A=... B=... WT=... node diff-texto.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const A = process.env.A || "http://localhost:3200";
const B = process.env.B || "http://localhost:3100";
const WT = process.env.WT;
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const RUTAS_LOG = (process.env.RUTAS_LOG || "/panel-de-control,/perfil,/admin,/admin/empresas,/oportunidades,/directorio,/empresas/vaxler").split(",");
const RUTAS_ANON = (process.env.RUTAS_ANON || "/,/empresas,/directorio,/empresas/vaxler,/nosotros,/boletin,/rubros").split(",");

function env() {
  const e = {};
  for (const l of fs.readFileSync(path.join(WT, ".env"), "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return e;
}
async function sesion(browser, base) {
  const e = env();
  const r = await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: e.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + e.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email: e.UIAB_EMAIL }),
  });
  const { hashed_token } = await r.json();
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${base}/api/auth/callback?token_hash=${hashed_token}&type=magiclink&next=/403`, { waitUntil: "load" });
  const estado = await ctx.storageState();
  await ctx.close();
  return estado;
}
async function texto(browser, base, ruta, estado) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, ...(estado ? { storageState: estado } : {}) });
  const p = await ctx.newPage();
  await p.goto(base + ruta, { waitUntil: "load", timeout: 120000 });
  await p.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(800);
  const t = await p.evaluate(() => {
    const main = document.querySelector("main") || document.body;
    return main.innerText;
  });
  await ctx.close();
  // Normaliza lo que cambia solo (horas relativas, barajado del día no cambia entre servidores).
  return t.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/hace \d+ (segundos?|minutos?)/g, "hace X"));
}
const browser = await chromium.launch({ executablePath: EXE });
const sesA = await obtenerSesion(browser, A, WT), sesB = sesA;
let distintas = 0;
for (const [modo, rutas] of [["anon", RUTAS_ANON], ["logueado", RUTAS_LOG]]) {
  for (const ruta of rutas) {
    const [ta, tb] = await Promise.all([
      texto(browser, A, ruta, modo === "anon" ? null : sesA),
      texto(browser, B, ruta, modo === "anon" ? null : sesB),
    ]);
    const sa = new Set(ta), sb = new Set(tb);
    const soloA = ta.filter((l) => !sb.has(l)), soloB = tb.filter((l) => !sa.has(l));
    const igual = !soloA.length && !soloB.length;
    if (!igual) distintas++;
    console.log(`${igual ? "IGUAL " : "DIFIERE"} ${modo.padEnd(8)} ${ruta.padEnd(24)} líneas ${ta.length}/${tb.length}`);
    for (const l of soloA.slice(0, 6)) console.log("     - main:  " + l.slice(0, 120));
    for (const l of soloB.slice(0, 6)) console.log("     + rama:  " + l.slice(0, 120));
  }
}
await browser.close();
console.log(distintas ? `\n${distintas} rutas con diferencias` : "\nTodo igual");
