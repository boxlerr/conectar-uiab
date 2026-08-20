/**
 * Corre el cruce REAL del producto sobre las oportunidades que se le pasen.
 *
 *   node --experimental-strip-types recalcular-matches.mjs <id> [<id>...]
 *
 * Por qué existe este archivo y no una copia del criterio acá adentro: el
 * capítulo del video muestra en pantalla el motivo del match y los tres
 * puntajes (categoría, etiquetas, ubicación). Si los calculara el sembrador,
 * serían números escritos por mí y el video estaría mostrando algo que el
 * producto no hace. Importando `calcular-matches.ts` se filma lo que la
 * plataforma calcula de verdad, y si mañana cambia el criterio, el video
 * cambia solo.
 *
 * El sembrador inserta por REST, así que nunca pasa por el Server Action que
 * dispara este cálculo al publicar desde el formulario. Sin este paso,
 * `oportunidades_matches` queda vacía y la sección "Por qué te recomendamos"
 * directamente no se renderiza.
 *
 * Va en su propio proceso porque necesita `--experimental-strip-types` para
 * importar el .ts, y video.mjs lanza los scripts sin flags.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "../..");

const leerEnv = () => {
  for (const nombre of [".env.local", ".env"]) {
    const ruta = resolve(RAIZ, nombre);
    if (!existsSync(ruta)) continue;
    return Object.fromEntries(
      readFileSync(ruta, "utf8")
        .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
        .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  }
  return {};
};

const env = leerEnv();
const U = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !K) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");

const ids = process.argv.slice(2);
if (!ids.length) { console.log("uso: recalcular-matches.mjs <id> [<id>...]"); process.exit(1); }

const { recalcularMatchesDeOportunidad } = await import(
  resolve(RAIZ, "src/modulos/oportunidades/calcular-matches.ts"));

const admin = createClient(U, K, { auth: { persistSession: false } });

for (const id of ids) {
  const n = await recalcularMatchesDeOportunidad(admin, id);
  console.log(`   ${n} candidato(s) para ${id}`);
}
