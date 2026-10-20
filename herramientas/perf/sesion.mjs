// Sesión de prueba compartida por los scripts: se pide UN magic link y el
// storageState se guarda en disco ~45 min, así no se golpea Supabase Auth (que
// es el de producción, plan Free) con un generate_link por corrida.
import fs from "node:fs";
import path from "node:path";
const ARCHIVO = new URL("./.sesion.json", import.meta.url).pathname;

function env(wt) {
  const e = {};
  for (const l of fs.readFileSync(path.join(wt, ".env"), "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) e[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return e;
}

export async function obtenerSesion(browser, base, wt) {
  if (fs.existsSync(ARCHIVO) && Date.now() - fs.statSync(ARCHIVO).mtimeMs < 45 * 60 * 1000) {
    return JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
  }
  const e = env(wt);
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
  fs.writeFileSync(ARCHIVO, JSON.stringify(estado));
  return estado;
}
