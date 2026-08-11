/**
 * Chequea contra la base de PRODUCCIÓN que cada landing de rubro siga teniendo
 * al menos UMBRAL_SOCIAS socias aprobadas.
 *
 *   node --experimental-strip-types herramientas/verificar-rubros.ts
 *
 * Va acá y no en `src/tests/` a propósito: `npm test` no debe depender de la
 * red ni de credenciales de producción. Este script es el que se corre a mano
 * cuando se agrega o se da de baja una socia, o antes de tocar RUBROS_SEO.
 *
 * Si un rubro cae por debajo del umbral hay que sacarlo del array Y agregar un
 * redirect 308 en next.config.ts hacia /rubros — una landing publicada que pasa
 * a 404 es peor que no haberla publicado nunca.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { RUBROS_SEO, UMBRAL_SOCIAS, perteneceAlRubro } from "../src/lib/datos/rubros-seo.ts";
import { esEmpresaInstitucional } from "../src/lib/datos/empresa-institucional.ts";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const { data, error } = await db
  .from("empresas")
  .select(
    "id, razon_social, localidad, empresas_categorias(categorias(slug)), empresas_tags(tags(nombre))"
  )
  .eq("estado", "aprobada");

if (error) throw error;

const empresas = (data ?? [])
  .filter((e: any) => !esEmpresaInstitucional(e.id))
  .map((e: any) => ({
    nombre: e.razon_social as string,
    localidad: e.localidad as string | null,
    categoriaSlugs: (e.empresas_categorias ?? [])
      .map((r: any) => r.categorias?.slug)
      .filter(Boolean),
    tags: (e.empresas_tags ?? []).map((r: any) => r.tags?.nombre).filter(Boolean),
  }));

let fallo = false;
for (const rubro of RUBROS_SEO) {
  const miembros = empresas.filter((e) => perteneceAlRubro(rubro, e));
  const ok = miembros.length >= UMBRAL_SOCIAS;
  if (!ok) fallo = true;
  console.log(
    `${ok ? "ok  " : "BAJO"} ${rubro.slug.padEnd(32)} ${String(miembros.length).padStart(2)} socias  ${miembros
      .map((m) => m.nombre)
      .join(" · ")}`
  );
}

const cubiertas = new Set(
  empresas.filter((e) => RUBROS_SEO.some((r) => perteneceAlRubro(r, e))).map((e) => e.nombre)
);
console.log(
  `\ncobertura: ${cubiertas.size}/${empresas.length} socias caen en al menos un rubro`
);
const huerfanas = empresas.filter((e) => !cubiertas.has(e.nombre)).map((e) => e.nombre);
if (huerfanas.length) console.log(`sin rubro: ${huerfanas.join(" · ")}`);

process.exit(fallo ? 1 : 0);
