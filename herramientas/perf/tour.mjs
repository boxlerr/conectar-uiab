// El tutorial tiene que seguir arrancando: logueado, en el panel, click en el
// botón del tour y esperar el tooltip de Joyride.
import { chromium } from "playwright";
import path from "node:path";
import { obtenerSesion } from "./sesion.mjs";
const BASE = process.env.BASE || "http://localhost:3100";
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const b = await chromium.launch({ executablePath: EXE });
const estado = await obtenerSesion(b, BASE, process.env.WT);
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, storageState: estado });
const p = await ctx.newPage();
const chunks = [];
p.on("response", async (r) => { if (r.url().includes("/_next/static/chunks/")) { try { const t = await r.text(); if (/joyride|floater/.test(t)) chunks.push(r.url().split("/").pop()); } catch {} } });
await p.goto(BASE + (process.argv[2] || "/panel-de-control"), { waitUntil: "load" });
await p.waitForLoadState("networkidle").catch(() => {});
console.log("chunk de joyride antes del click:", chunks.length ? chunks : "ninguno");
const boton = p.getByRole("button", { name: /tutorial/i }).first();
await boton.click();
const tooltip = await p.waitForSelector('[data-floating-ui-portal], .react-joyride__tooltip, [id^="react-joyride"], [role="alertdialog"]', { timeout: 15000 }).then(() => true).catch(() => false);
await p.waitForTimeout(1000);
console.log("chunk de joyride después del click:", chunks.length ? chunks : "ninguno", "| tooltip visible:", tooltip);
const texto = await p.evaluate(() => [...document.querySelectorAll('[role="alertdialog"], .react-joyride__tooltip')].map((e) => e.innerText.slice(0, 120)).join(" | "));
console.log("texto del tooltip:", texto || "(vacío)");
await p.screenshot({ path: process.env.OUT || "/tmp/tour.png" });
await b.close();
