/**
 * Chequeo estático de las escenas, para correr ANTES de grabar.
 *
 * Existe porque el mismo error se comió dos pasadas enteras: una escena usa un
 * ayudante de piloto.mjs que no importó, y como el fallo ocurre a mitad de la
 * grabación —después de varios planos ya filmados—, la pasada termina "bien"
 * con la mitad del capítulo y el video sale sin decir nada evidente.
 * `node --check` no lo ve: es sintaxis válida.
 *
 *   node verificar-escenas.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const piloto = readFileSync(join(AQUI, "piloto.mjs"), "utf8");
const exportados = new Set(
  [...piloto.matchAll(/export (?:async )?function (\w+)|export const (\w+)/g)]
    .map((m) => m[1] || m[2])
);

let problemas = 0;
for (const archivo of readdirSync(join(AQUI, "escenas")).filter((f) => f.endsWith(".mjs"))) {
  const src = readFileSync(join(AQUI, "escenas", archivo), "utf8");
  const bloque = src.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\.\/piloto\.mjs["']/);
  const importados = new Set(
    (bloque?.[1] ?? "").split(",").map((n) => n.trim()).filter(Boolean)
  );
  // Sólo nos importan los nombres que piloto.mjs exporta: si la escena usa
  // `dormir` sin importarlo, revienta; si usa `Math`, no.
  const usados = new Set(
    [...src.matchAll(/\b(\w+)\s*\(/g)].map((m) => m[1]).filter((n) => exportados.has(n))
  );
  const faltan = [...usados].filter((n) => !importados.has(n));
  if (faltan.length) {
    problemas++;
    console.error(`✗ escenas/${archivo}: usa sin importar → ${faltan.join(", ")}`);
  } else {
    console.log(`✓ escenas/${archivo}`);
  }
}
if (problemas) {
  console.error("\nLa grabación se cortaría a mitad de camino. Arreglá los imports.");
  process.exit(1);
}
