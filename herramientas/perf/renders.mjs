import { obtenerSesion } from "./sesion.mjs";
// Cuenta renders de React durante una interacción, enganchado al hook de
// DevTools (funciona en el build de producción). Un componente cuenta como
// renderizado en un commit si su fibra es nueva respecto del commit anterior y
// tiene el flag PerformedWork (1): las fibras que React saltó sin tocar son los
// mismos objetos de antes, y las clonadas por bailout pierden ese flag.
// Uso: BASE=... WT=... node renders.mjs <ruta> <interaccion> [logueado]
//   interacciones: volver-pestana | tipear:<selector>:<texto> | scroll
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3100";
const WT = process.env.WT;
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const [ruta = "/panel-de-control", interaccion = "volver-pestana", modo = "logueado"] = process.argv.slice(2);
const REPETICIONES = Number(process.env.REP || 3);

function env() {
  const e = {};
  for (const l of fs.readFileSync(path.join(WT, ".env"), "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return e;
}
async function sesion(browser) {
  const e = env();
  const r = await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: e.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + e.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email: e.UIAB_EMAIL }),
  });
  const { hashed_token } = await r.json();
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/api/auth/callback?token_hash=${hashed_token}&type=magiclink&next=/403`, { waitUntil: "load" });
  const estado = await ctx.storageState();
  await ctx.close();
  return estado;
}

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  ...(modo === "logueado" ? { storageState: await obtenerSesion(browser, BASE, WT) } : {}),
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  const TIPOS = new Set([0, 1, 11, 14, 15]);
  let previas = new WeakSet();
  window.__commits = [];
  const contar = (raiz) => {
    const vistas = new WeakSet();
    let renders = 0, montajes = 0;
    const pila = [raiz];
    while (pila.length) {
      const f = pila.pop();
      if (!f) continue;
      vistas.add(f);
      if (TIPOS.has(f.tag) && !previas.has(f)) {
        if (f.alternate === null) montajes++;
        else if (f.flags & 1) renders++;
      }
      if (f.sibling) pila.push(f.sibling);
      if (f.child) pila.push(f.child);
    }
    previas = vistas;
    return { renders, montajes };
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    isDisabled: false,
    inject(r) { const id = this.renderers.size + 1; this.renderers.set(id, r); return id; },
    onCommitFiberRoot(_id, root) { window.__commits.push({ t: performance.now(), ...contar(root.current) }); },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    checkDCE() {},
  };
});
const supa = [];
page.on("request", (r) => { try { if (new URL(r.url()).hostname.endsWith(".supabase.co")) supa.push({ t: Date.now(), u: r.method() + " " + new URL(r.url()).pathname }); } catch {} });

await page.goto(BASE + ruta, { waitUntil: "load", timeout: 120000 });
await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2500);

const resultados = [];
for (let i = 0; i < REPETICIONES; i++) {
  const desde = await page.evaluate(() => window.__commits.length);
  const t0 = Date.now();
  if (interaccion === "volver-pestana") {
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange", { bubbles: true })));
  } else if (interaccion === "scroll") {
    for (let y = 0; y < 3000; y += 150) { await page.mouse.wheel(0, 150); await page.waitForTimeout(30); }
  } else if (interaccion.startsWith("tipear:")) {
    const [, sel, texto] = interaccion.split(":");
    await page.locator(sel).first().fill("");
    await page.locator(sel).first().pressSequentially(texto, { delay: 60 });
  }
  await page.waitForTimeout(3000);
  const commits = await page.evaluate((d) => window.__commits.slice(d), desde);
  resultados.push({
    commits: commits.length,
    renders: commits.reduce((a, c) => a + c.renders, 0),
    montajes: commits.reduce((a, c) => a + c.montajes, 0),
    supabase: supa.filter((s) => s.t >= t0).map((s) => s.u),
  });
  if (interaccion === "scroll") await page.evaluate(() => window.scrollTo(0, 0));
}
for (const r of resultados) console.log(`${ruta} ${interaccion}: commits=${r.commits} renders=${r.renders} montajes=${r.montajes} supabase=${r.supabase.length} ${JSON.stringify(r.supabase)}`);
await browser.close();
