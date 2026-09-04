/**
 * Deja la cuenta de filmación lista para grabar.
 *
 * El sitio muestra modales de novedades ("Rediseñamos la cartelera de
 * oportunidades") a quien todavía no los vio. El gate NO es localStorage: es
 * la columna `perfiles.tutoriales_vistos`, así que inyectar una clave en el
 * navegador no alcanza — y uno de esos modales se coló en una grabación,
 * tapando media pantalla durante el capítulo entero.
 *
 * Esto marca como vistos los tours y las novedades de la cuenta con la que se
 * filma. Es exactamente lo que pasa cuando esa cuenta aprieta "entendido": no
 * inventa estado, lo adelanta.
 *
 *   node preparar-cuenta.mjs            → marca todo como visto
 *   node preparar-cuenta.mjs --mostrar  → sólo dice cómo está
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const leerEnv = () => {
  for (const n of [".env.local", ".env"]) {
    const r = resolve(AQUI, "../..", n);
    if (!existsSync(r)) continue;
    return Object.fromEntries(readFileSync(r, "utf8").split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  }
  return {};
};
const env = leerEnv();
const U = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.UIAB_EMAIL || env.UIAB_EMAIL;
if (!U || !K || !EMAIL) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o UIAB_EMAIL.");

const api = async (ruta, opciones = {}) => {
  const r = await fetch(`${U}/rest/v1/${ruta}`, {
    ...opciones,
    headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json",
      Prefer: opciones.method ? "return=representation" : "return=minimal", ...opciones.headers },
  });
  if (!r.ok) throw new Error(`${r.status} ${ruta} → ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

/**
 * Tours + novedades, leídos del CÓDIGO y no de una lista escrita a mano.
 *
 * La lista fija se quedó vieja y costó una grabación entera: la novedad
 * "Rediseñamos tu panel de control" (`novedad_panel_control`) es posterior a
 * cuando se escribió, así que no se marcaba como vista y el modal aparecía
 * arriba del tablero de Oportunidades. Como es un `fixed inset-0`, se comía
 * TODOS los clicks: la pasada del Directorio moría en el primer click sobre el
 * buscador y la de Oportunidades no llegaba a entrar a ningún pedido. En el log
 * eso se lee como "locator.click: Timeout", que no sugiere en nada que haya un
 * cartel tapando la pantalla.
 *
 * Los ids viven en dos uniones de TypeScript. Parsearlas es frágil comparado
 * con importarlas, pero importarlas desde acá arrastra media app; y una unión
 * de literales es lo bastante estable como para leerla con una expresión
 * regular. Si algún día no encuentra nada, avisa y cae en la lista mínima.
 */
function clavesDelCodigo() {
  const union = (archivo, tipo) => {
    const ruta = resolve(AQUI, "../..", archivo);
    if (!existsSync(ruta)) return [];
    const src = readFileSync(ruta, "utf8");
    const bloque = src.match(new RegExp(`export type ${tipo}\\s*=([^;]+);`));
    return bloque ? [...bloque[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]) : [];
  };
  const tours = union("src/modulos/onboarding/tipos.ts", "TourId");
  const novedades = union("src/modulos/novedades/novedades.ts", "NovedadId")
    .map((id) => `novedad_${id}`);
  if (!tours.length || !novedades.length) {
    console.warn("  ⚠ no pude leer los ids de tours/novedades del código: uso la lista mínima");
    return ["directorio", "oportunidades", "dashboard", "perfil",
            "novedad_perfil_directorio", "novedad_oportunidades_cartelera"];
  }
  return [...tours, ...novedades];
}

const CLAVES = clavesDelCodigo();

const [perfil] = await api(`perfiles?select=id,email,tutoriales_vistos&email=eq.${encodeURIComponent(EMAIL)}`);
if (!perfil) throw new Error(`No encontré el perfil de ${EMAIL}.`);

if (process.argv.includes("--mostrar")) {
  console.log(`${perfil.email}: ${JSON.stringify(perfil.tutoriales_vistos ?? {})}`);
  process.exit(0);
}

const ahora = new Date().toISOString();
const vistos = { ...(perfil.tutoriales_vistos ?? {}) };
const nuevas = CLAVES.filter((c) => !vistos[c]);
for (const c of CLAVES) vistos[c] ??= ahora;

await api(`perfiles?id=eq.${perfil.id}`, { method: "PATCH", body: JSON.stringify({ tutoriales_vistos: vistos }) });
console.log(nuevas.length
  ? `  · novedades y tours dados por vistos para ${perfil.email}: ${nuevas.join(", ")}`
  : `  · ${perfil.email} ya tenía todo visto`);
