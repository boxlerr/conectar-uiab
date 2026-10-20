import { obtenerSesion } from "./sesion.mjs";
// Recorrido de humo: cada ruta tiene que cargar con 200, sin el error boundary,
// sin errores de JS y con un texto que pruebe que rindió contenido real.
// Uso: BASE=... WT=... node e2e.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3100";
const WT = process.env.WT;
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");

const ANON = [
  ["/", /UIAB Conecta/i],
  ["/directorio", /Directorio/i],
  ["/empresas", /Empresas/i],
  ["/empresas?categoria=proveedores", /./],
  ["/empresas/vaxler", /Vaxler/i],
  ["/boletin", /Bolet/i],
  ["/rubros", /Rubros/i],
  ["/nosotros", /Uni[oó]n Industrial/i],
  ["/sumate", /./],
  ["/login", /Ingres|Iniciar/i],
  ["/oportunidades", /Oportunidades/i],
  ["/privacidad", /Privacidad/i],
];
const LOGUEADO = [
  ["/panel-de-control", /Panel|Hola|Bienvenid/i],
  ["/perfil", /Perfil|Datos/i],
  ["/perfil/datos", /./],
  ["/perfil/productos-servicios", /Productos|Servicios|Cat[aá]logo/i],
  ["/oportunidades", /Oportunidades/i],
  ["/directorio", /Directorio/i],
  ["/empresas/vaxler", /Vaxler/i],
  ["/admin", /Panel|Administraci|Pendientes/i],
  ["/admin/empresas", /Empresas/i],
  ["/admin/usuarios", /Usuarios/i],
];

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

async function recorrer(browser, rutas, estado, etiqueta) {
  let fallas = 0;
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, ...(estado ? { storageState: estado } : {}) });
  for (const [ruta, esperado] of rutas) {
    const p = await ctx.newPage();
    const errores = [];
    p.on("pageerror", (e) => errores.push("pageerror: " + e.message));
    p.on("console", (m) => { if (m.type() === "error") errores.push("console: " + m.text().slice(0, 160)); });
    const res = await p.goto(BASE + ruta, { waitUntil: "load", timeout: 120000 });
    await p.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    const texto = await p.evaluate(() => document.body.innerText);
    const boundary = /Algo no cargó como esperábamos|Application error|Unhandled Runtime Error/.test(texto);
    const ok = res.status() < 400 && !boundary && esperado.test(texto);
    // Errores de consola de terceros/locales que no indican un problema nuestro.
    const relevantes = errores.filter((x) => !/_vercel\/insights|favicon|Failed to load resource: the server responded with a status of 404/.test(x));
    if (!ok || relevantes.length) fallas++;
    console.log(`${ok && !relevantes.length ? "OK  " : "FALLA"} ${etiqueta.padEnd(8)} ${ruta.padEnd(34)} → ${p.url().replace(BASE, "")} [${res.status()}]${boundary ? " BOUNDARY" : ""}${esperado.test(texto) ? "" : " SIN-TEXTO"}`);
    for (const x of relevantes) console.log("        " + x);
    await p.close();
  }
  await ctx.close();
  return fallas;
}

const browser = await chromium.launch({ executablePath: EXE });
let fallas = await recorrer(browser, ANON, null, "anon");
fallas += await recorrer(browser, LOGUEADO, await obtenerSesion(browser, BASE, WT), "logueado");
await browser.close();
console.log(fallas ? `\n${fallas} FALLAS` : "\nTodo OK");
process.exit(fallas ? 1 : 0);
