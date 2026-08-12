/**
 * Baja los planos cinematográficos a assets/.
 *
 *   node traer-assets.mjs [--forzar]
 *
 * Los MP4 no se versionan (pesan y git los guarda para siempre): lo que se
 * versiona es assets.json, con la URL y el prompt de cada plano. Si una URL
 * caduca, se regenera el plano con ese mismo prompt en Higgsfield y se
 * actualiza el link.
 */
import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FORZAR = process.argv.includes("--forzar");

const { planos } = JSON.parse(readFileSync(join(AQUI, "assets.json"), "utf8"));

let bajados = 0;
for (const plano of planos) {
  const destino = join(AQUI, plano.destino);

  if (existsSync(destino) && !FORZAR) {
    const mb = (statSync(destino).size / 1024 / 1024).toFixed(1);
    console.log(`· ${plano.nombre}: ya está (${mb} MB) — usá --forzar para rebajarlo`);
    continue;
  }

  process.stdout.write(`· ${plano.nombre}: bajando… `);
  const r = await fetch(plano.url);
  if (!r.ok) {
    console.log(`✗ HTTP ${r.status}`);
    console.log(`  La URL caducó. Regenerá el plano en Higgsfield con este prompt`);
    console.log(`  y actualizá assets.json:\n\n  ${plano.prompt}\n`);
    continue;
  }

  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  const mb = (statSync(destino).size / 1024 / 1024).toFixed(1);
  console.log(`✓ ${mb} MB`);
  bajados++;
}

console.log(
  bajados
    ? `\n✓ ${bajados} plano(s) en assets/. Ya podés correr montar.mjs.`
    : "\n· Nada nuevo que bajar."
);
