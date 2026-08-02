/**
 * Sonda: entra a cada ruta y lista lo que REALMENTE se renderiza.
 * Leer el JSX no alcanza (hay ramas por rol, por sesión y por datos).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:51400";
const EMAIL = "boxlerjulian+empresatest@hotmail.com";
const PASS = "UiabPrueba.2026!";

const RUTAS = ["/empresas", "/directorio", "/oportunidades", "/oportunidades/nueva"];

const inspeccionar = () => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const txt = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70);
  return {
    url: location.pathname + location.search,
    titulo: document.title,
    tour: [...document.querySelectorAll("[data-tour]")].map((e) => ({
      sel: `[data-tour="${e.getAttribute("data-tour")}"]`,
      tag: e.tagName.toLowerCase(), visible: vis(e), texto: txt(e),
    })),
    inputs: [...document.querySelectorAll("input,textarea,select")].filter(vis).map((e) => ({
      tag: e.tagName.toLowerCase(), tipo: e.type || "", ph: e.placeholder || "",
      name: e.name || "", id: e.id || "", rol: e.getAttribute("role") || "",
    })),
    botones: [...document.querySelectorAll('button,a[role="button"],[type="submit"]')]
      .filter(vis).map((e) => ({ texto: txt(e), tipo: e.type || "", clase: (e.className || "").toString().slice(0, 45) }))
      .filter((b) => b.texto),
    enlaces: [...document.querySelectorAll("a[href]")].filter(vis)
      .map((e) => ({ texto: txt(e), href: e.getAttribute("href") }))
      .filter((a) => a.texto && !a.href.startsWith("#")).slice(0, 26),
    h: [...document.querySelectorAll("h1,h2")].filter(vis).map((e) => `${e.tagName}: ${txt(e)}`),
    alto: document.documentElement.scrollHeight,
  };
};

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 810 }, locale: "es-AR" });
const page = await ctx.newPage();

// Login
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
await page.locator('input[type="email"]').first().fill(EMAIL);
await page.locator('input[type="password"]').first().fill(PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 }).catch(() => {});
await page.waitForLoadState("networkidle").catch(() => {});
console.log("### LOGIN → aterrizó en", page.url().replace(BASE, ""));
console.log("### HEADER LOGUEADO");
console.log(JSON.stringify(await page.evaluate(() => {
  const h = document.querySelector("header");
  if (!h) return null;
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  return {
    alto: h.getBoundingClientRect().height,
    sticky: getComputedStyle(h).position,
    texto: (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300),
    botones: [...h.querySelectorAll("button")].filter(vis).map((b) => (b.textContent || "").trim().slice(0, 40)),
  };
}), null, 1));

for (const ruta of RUTAS) {
  await page.goto(BASE + ruta, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1400);
  console.log(`\n########## ${ruta}`);
  console.log(JSON.stringify(await page.evaluate(inspeccionar), null, 1));
}

// Una oportunidad real para filmar la ficha
await page.goto(`${BASE}/oportunidades`, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(1200);
const ops = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="/oportunidades/"]')]
    .map((a) => ({ href: a.getAttribute("href"), texto: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90) }))
    .filter((a) => a.href.split("/").length === 3 && a.href !== "/oportunidades/nueva"));
console.log("\n########## OPORTUNIDADES LISTADAS\n", JSON.stringify(ops.slice(0, 8), null, 1));

if (ops[0]) {
  await page.goto(BASE + ops[0].href, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  console.log(`\n########## FICHA ${ops[0].href}`);
  console.log(JSON.stringify(await page.evaluate(inspeccionar), null, 1));
}

// Una empresa real para filmar la ficha
await page.goto(`${BASE}/empresas`, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(1600);
const emp = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="/empresas/"]')]
    .map((a) => ({ href: a.getAttribute("href"), texto: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80) }))
    .filter((a) => a.href.split("/").length === 3));
console.log("\n########## EMPRESAS LISTADAS\n", JSON.stringify(emp.slice(0, 10), null, 1));

if (emp[0]) {
  await page.goto(BASE + emp[0].href, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  console.log(`\n########## FICHA ${emp[0].href}`);
  console.log(JSON.stringify(await page.evaluate(inspeccionar), null, 1));
}

await navegador.close();
