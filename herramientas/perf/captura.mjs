// Captura un selector (o la página) en desktop o móvil. Uso: node captura.mjs ruta selector salida.png [ancho]
import { chromium } from "playwright";
import path from "node:path";
const EXE = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const BASE = process.env.BASE || "http://localhost:3100";
const [ruta, sel, out, ancho = "1366"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: EXE });
const ctx = await b.newContext({ viewport: { width: Number(ancho), height: 900 }, deviceScaleFactor: 2, reducedMotion: "no-preference" });
const p = await ctx.newPage();
await p.goto(BASE + ruta, { waitUntil: "load" });
const el = sel === "page" ? null : p.locator(sel).first();
if (el) await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(2500);
if (el) await el.screenshot({ path: out }); else await p.screenshot({ path: out });
await b.close();
