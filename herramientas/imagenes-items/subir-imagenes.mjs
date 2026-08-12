/**
 * Sube imágenes de portada a los ítems del catálogo (productos y servicios).
 *
 *   node herramientas/imagenes-items/subir-imagenes.mjs <carpeta> --empresa "Vaxler"
 *   node herramientas/imagenes-items/subir-imagenes.mjs ./imgs --empresa "Vaxler" --dry
 *
 * Existe porque el alta por UI es de a un ítem por vez: cuando hay que cargar
 * el catálogo entero de una empresa (o rehacer las portadas de golpe), hacerlo
 * a mano es media hora de clicks.
 *
 * Cada archivo se asocia al ítem cuyo nombre coincide, comparando slugs:
 *
 *   desarrollo-de-software-a-medida.png  →  "Desarrollo de software a medida"
 *   consultoria-it-y-transformacion-digital.webp  →  "Consultoría IT y transformación digital"
 *
 * Replica lo que hace FormularioItem.tsx: sube al bucket imagenes-publicas bajo
 * items/<item_id>/<timestamp>-<orden>.<ext> y registra la fila en imagenes_item
 * (no hay columna de URL: la pública se deriva de bucket + ruta_archivo).
 *
 * Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el .env de
 * la raíz del repo. Usa la service role key porque las policies de storage
 * piden un JWT de usuario dueño del ítem (o admin), que un script no tiene.
 *
 * Flags:
 *   --empresa <texto>  Filtra por razón social / nombre comercial (obligatorio).
 *   --dry              Muestra el plan y no escribe nada.
 *   --forzar           Sube igual a ítems que ya tienen imágenes.
 */
import { readFileSync, readdirSync } from "node:fs";
import { extname, basename, join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..", "..");
const BUCKET = "imagenes-publicas";
const CACHE_CONTROL = 2678400; // 31 días, igual que FormularioItem.tsx
const MIMES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif",
};

// ─── Env ─────────────────────────────────────────────────────────────────────
function leerEnv() {
  for (const nombre of [".env.local", ".env"]) {
    try {
      const crudo = readFileSync(join(RAIZ, nombre), "utf8");
      const env = Object.fromEntries(
        crudo.split("\n")
          .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
          .map((l) => {
            const i = l.indexOf("=");
            return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
          })
      );
      if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return env;
    } catch { /* probamos el siguiente */ }
  }
  throw new Error(
    `No encontré NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en ${RAIZ}/.env(.local)`
  );
}

const env = leerEnv();
const U = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const K = env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Clientes ────────────────────────────────────────────────────────────────
async function rest(ruta, opciones = {}) {
  const r = await fetch(`${U}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: K,
      Authorization: `Bearer ${K}`,
      "Content-Type": "application/json",
      Prefer: opciones.method === "POST" ? "return=representation" : "return=minimal",
      ...opciones.headers,
    },
  });
  if (!r.ok) throw new Error(`${r.status} ${ruta} → ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function subirBlob(ruta, bytes, mime) {
  const r = await fetch(`${U}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: "POST",
    headers: {
      apikey: K,
      Authorization: `Bearer ${K}`,
      "Content-Type": mime,
      "cache-control": `max-age=${CACHE_CONTROL}`,
    },
    body: bytes,
  });
  if (!r.ok) throw new Error(`storage ${r.status} ${ruta} → ${await r.text()}`);
}

async function borrarBlob(ruta) {
  await fetch(`${U}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: "DELETE",
    headers: { apikey: K, Authorization: `Bearer ${K}` },
  }).catch(() => {});
}

// Ojo: NO es crearSlug() de src/lib/utilidades.ts. Aquél borra todo lo que no
// sea letra, número o espacio, así que aplicado a un nombre de archivo que YA
// viene slugueado se come los guiones ("desarrollo-de-software-a-medida" ->
// "desarrollodesoftwareamedida") y no matchea nunca contra el nombre del ítem.
// Acá cualquier corrida de separadores colapsa a un guión, así el nombre del
// ítem y el del archivo aterrizan en la misma forma.
const slug = (t) =>
  t.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ─── Main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const carpeta = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry");
const forzar = args.includes("--forzar");
const iEmpresa = args.indexOf("--empresa");
const empresaBuscada = iEmpresa !== -1 ? args[iEmpresa + 1] : null;

if (!carpeta || !empresaBuscada) {
  console.error("Uso: node subir-imagenes.mjs <carpeta> --empresa \"Vaxler\" [--dry] [--forzar]");
  process.exit(1);
}

const empresas = await rest(
  `empresas?select=id,razon_social,nombre_comercial` +
  `&or=(razon_social.ilike.*${encodeURIComponent(empresaBuscada)}*,` +
  `nombre_comercial.ilike.*${encodeURIComponent(empresaBuscada)}*)`
);
if (empresas.length === 0) throw new Error(`Ninguna empresa matchea "${empresaBuscada}"`);
if (empresas.length > 1) {
  throw new Error(
    `"${empresaBuscada}" matchea varias empresas, afiná el filtro:\n` +
    empresas.map((e) => `  · ${e.razon_social}`).join("\n")
  );
}
const empresa = empresas[0];

const items = await rest(
  `items?select=id,nombre,tipo_item,imagenes_item(id)&empresa_id=eq.${empresa.id}`
);

const archivos = readdirSync(resolve(carpeta))
  .filter((f) => MIMES[extname(f).toLowerCase()]);
if (archivos.length === 0) throw new Error(`No hay imágenes usables en ${carpeta}`);

// ─── Emparejar archivo ↔ ítem ────────────────────────────────────────────────
const porSlug = new Map(items.map((i) => [slug(i.nombre), i]));
const plan = [];
const huerfanos = [];

for (const archivo of archivos) {
  const item = porSlug.get(slug(basename(archivo, extname(archivo))));
  if (!item) { huerfanos.push(archivo); continue; }
  plan.push({ archivo, item, yaTiene: (item.imagenes_item ?? []).length > 0 });
}

console.log(`\nEmpresa: ${empresa.razon_social} (${empresa.id})`);
console.log(`Ítems en el catálogo: ${items.length} · imágenes encontradas: ${archivos.length}\n`);

for (const p of plan) {
  const nota = p.yaTiene ? (forzar ? " [ya tenía, se agrega igual]" : " [SALTEADO: ya tiene imagen]") : "";
  console.log(`  ${p.archivo}  →  ${p.item.nombre}${nota}`);
}
if (huerfanos.length) {
  console.log(`\n  Sin ítem que matchee (revisá el nombre del archivo):`);
  for (const h of huerfanos) console.log(`    · ${h}`);
}
const sinImagen = items.filter((i) => !plan.some((p) => p.item.id === i.id));
if (sinImagen.length) {
  console.log(`\n  Ítems sin archivo asignado:`);
  for (const i of sinImagen) console.log(`    · ${i.nombre}  →  esperaba "${slug(i.nombre)}.png"`);
}

const aSubir = plan.filter((p) => forzar || !p.yaTiene);
if (dry) {
  console.log(`\n--dry: no se escribió nada. Se subirían ${aSubir.length} imágenes.\n`);
  process.exit(0);
}
if (aSubir.length === 0) {
  console.log(`\nNada para subir (usá --forzar para reemplazar).\n`);
  process.exit(0);
}

// ─── Subir ───────────────────────────────────────────────────────────────────
console.log(`\nSubiendo ${aSubir.length}…\n`);
let ok = 0;

for (const { archivo, item } of aSubir) {
  const ext = extname(archivo).toLowerCase();
  const bytes = readFileSync(join(resolve(carpeta), archivo));
  const orden = (item.imagenes_item ?? []).length;
  const ruta = `items/${item.id}/${Date.now()}-${orden}${ext}`;

  await subirBlob(ruta, bytes, MIMES[ext]);
  try {
    await rest("imagenes_item", {
      method: "POST",
      body: JSON.stringify({
        item_id: item.id,
        bucket: BUCKET,
        ruta_archivo: ruta,
        nombre_archivo: archivo,
        mime_type: MIMES[ext],
        tamano_bytes: bytes.length,
        texto_alternativo: item.nombre,
        orden,
      }),
    });
  } catch (e) {
    // Si falla el registro, el blob queda huérfano en el bucket: lo limpiamos
    // para no dejar basura que nadie va a poder rastrear después.
    await borrarBlob(ruta);
    throw e;
  }

  ok++;
  console.log(`  ✓ ${item.nombre}`);
  console.log(`    ${U}/storage/v1/object/public/${BUCKET}/${ruta}`);
}

console.log(`\nListo: ${ok}/${aSubir.length} imágenes cargadas.\n`);
