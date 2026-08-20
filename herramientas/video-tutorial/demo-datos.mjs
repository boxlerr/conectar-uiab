/**
 * Datos de demostración para poder filmar el capítulo de Oportunidades.
 *
 *   node demo-datos.mjs sembrar   → crea 3 oportunidades y anota sus ids
 *   node demo-datos.mjs limpiar   → borra EXACTAMENTE esas 3 (y sus postulaciones)
 *
 * Van a nombre de la UIAB (no de la empresa de prueba) a propósito: el botón
 * "Postularse" no se renderiza para el dueño de la oportunidad, así que si las
 * creara la misma cuenta con la que filmo, no habría nada que mostrar.
 *
 * Nacen con visibilidad "privada_parque", igual que las que crea el formulario:
 * no son visibles para el público anónimo.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

/**
 * Busca el .env en la raíz del repo, relativo a este archivo. Antes era una
 * ruta absoluta a un Documents/GitHub concreto, así que esto sólo corría en
 * una máquina. Las variables de entorno, si están, le ganan al archivo.
 */
const leerEnv = () => {
  for (const nombre of [".env.local", ".env"]) {
    const ruta = resolve(AQUI, "../..", nombre);
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
if (!U || !K) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.\n"
    + "Ponelas en el .env de la raíz del repo o pasalas como variables de entorno."
  );
}
const REGISTRO = "demo-ids.json";

const api = async (ruta, opciones = {}) => {
  const r = await fetch(`${U}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: K, Authorization: `Bearer ${K}`,
      "Content-Type": "application/json",
      Prefer: opciones.method === "POST" ? "return=representation" : "return=minimal",
      ...opciones.headers,
    },
  });
  if (!r.ok) throw new Error(`${r.status} ${ruta} → ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

const EMPRESA_UIAB = "7221a1d7-006d-4587-b9e4-753c0c9a229d"; // UNIÓN INDUSTRIAL DE ALMIRANTE BROWN

/** Busca una empresa por su razón social. */
async function empresaPorNombre(patron) {
  const [e] = await api(
    `empresas?select=id,razon_social&razon_social=ilike.*${encodeURIComponent(patron)}*&limit=1`);
  return e ?? null;
}

async function sembrar() {
  const [miembro] = await api(`miembros_empresa?select=perfil_id&empresa_id=eq.${EMPRESA_UIAB}&limit=1`);
  if (!miembro) throw new Error("La empresa de la UIAB no tiene miembros — no puedo setear creado_por.");

  // Quién publica cada pedido.
  //
  // Los dos primeros salen a nombre de VAXLER, que es la empresa que el video
  // recorre: el tablero se ve como lo que es —una socia pidiendo lo que
  // necesita— y no como un aviso institucional.
  //
  // El tercero queda a nombre de la UIAB a propósito, y no es un olvido: el
  // botón "Postularse" no se le muestra a quien publicó, y el video se filma
  // con la cuenta de Vaxler. Si los tres fueran de Vaxler, el capítulo 2 se
  // quedaría sin el tramo de postularse.
  const vaxler = await empresaPorNombre("vaxler");
  if (!vaxler) throw new Error("No encontré a Vaxler en empresas — no puedo publicar a su nombre.");
  const [miembroVaxler] = await api(
    `miembros_empresa?select=perfil_id&empresa_id=eq.${vaxler.id}&limit=1`);
  const autorVaxler = miembroVaxler?.perfil_id ?? miembro.perfil_id;
  console.log(`  · 2 pedidos a nombre de ${vaxler.razon_social}, 1 de la UIAB (para poder mostrar "Postularse")`);

  const cat = async (like) => {
    const [c] = await api(`categorias?select=id,nombre&nombre=ilike.*${encodeURIComponent(like)}*&limit=1`);
    return c;
  };
  // Exactas: con patrones flojos ("Metal", "Mantenimiento") caía en cosas como
  // "Cursos de Mantenimiento de Grúas", que en cámara no tiene nada que ver
  // con el pedido.
  const redes = await cat("Telecomunicaciones y Redes");
  const electr = await cat("Electricidad");
  const transp = await cat("Transporte");

  const hoy = new Date("2026-07-31");
  const enDias = (d) => new Date(hoy.getTime() + d * 864e5).toISOString().slice(0, 10);

  const filas = [
    {
      empresa_solicitante_id: vaxler.id, creado_por: autorVaxler,
      categoria_id: redes?.id ?? null,
      titulo: "Cableado estructurado y rack para sala de servidores",
      descripcion:
        "<p>Necesitamos <b>cableado estructurado categoría 6A</b> y un rack de 42U para la sala de " +
        "servidores de nuestra oficina en Burzaco.</p><p>Alcance: tendido de 24 bocas, patchera, " +
        "bandejas, certificación de cada enlace y etiquetado. Incluye rack, PDU y organizadores.</p>" +
        "<p>Se solicita cotización con materiales y mano de obra, y plazo de ejecución en firme.</p>",
      cantidad: 24, unidad: "bocas", localidad: "Burzaco, Provincia de Buenos Aires",
      fecha_necesidad: enDias(21), tipo_requerimiento: ["material"],
    },
    {
      empresa_solicitante_id: vaxler.id, creado_por: autorVaxler,
      categoria_id: electr?.id ?? redes?.id ?? null,
      titulo: "Tablero eléctrico y UPS para sala de servidores",
      descripcion:
        "<p>Buscamos instalador matriculado para el <b>tablero eléctrico dedicado y la UPS</b> de la " +
        "sala de servidores.</p><p>Alcance: tablero con protecciones diferenciales y termomagnéticas, " +
        "puesta a tierra medida, y UPS online de 6 kVA con autonomía de 30 minutos.</p>" +
        "<p>Se pide memoria técnica, certificado de puesta a tierra y garantía por escrito.</p>",
      cantidad: 1, unidad: "servicio", localidad: "Burzaco, Provincia de Buenos Aires",
      fecha_necesidad: enDias(12), tipo_requerimiento: ["servicio"],
    },
    {
      empresa_solicitante_id: EMPRESA_UIAB,
      categoria_id: transp?.id ?? null,
      titulo: "Servicio de logística interna para el parque industrial",
      descripcion:
        "<p>Requerimos un <b>servicio de transporte y logística interna</b> entre plantas del parque " +
        "industrial de Almirante Brown, con frecuencia diaria de lunes a viernes.</p>" +
        "<p>Se necesita utilitario con capacidad de 1.500 kg, chofer con licencia vigente y seguro de " +
        "carga. El recorrido estimado es de 40 km diarios.</p><p>Cotizar por mes, con contrato mínimo " +
        "de 6 meses.</p>",
      cantidad: 22, unidad: "viajes/mes", localidad: "Almirante Brown, Provincia de Buenos Aires",
      fecha_necesidad: enDias(30), tipo_requerimiento: ["servicio"],
    },
  ].map((f) => ({
    ...f, estado: "abierta", visibilidad: "privada_parque", creado_por: f.creado_por ?? miembro.perfil_id,
  }));

  const creadas = await api("oportunidades", { method: "POST", body: JSON.stringify(filas) });
  writeFileSync(REGISTRO, JSON.stringify(creadas.map((o) => o.id), null, 2));
  console.log(`✓ ${creadas.length} oportunidades de demo creadas:`);
  for (const o of creadas) console.log(`   ${o.id}  ${o.titulo}`);
  console.log(`\n  ids anotados en ${REGISTRO} — corré "node demo-datos.mjs limpiar" al terminar.`);
}

async function limpiar() {
  if (!existsSync(REGISTRO)) { console.log("No hay demo-ids.json: nada que borrar."); return; }
  const ids = JSON.parse(readFileSync(REGISTRO, "utf8"));
  if (!ids.length) { console.log("Registro vacío."); return; }
  const lista = `(${ids.join(",")})`;
  // Primero lo que cuelga de la oportunidad por FK, después la oportunidad.
  // La tabla de postulaciones se llama `solicitudes_presupuesto`, no
  // `postulaciones` (el botón de la UI dice "Postularse", la tabla no).
  for (const hija of ["solicitudes_presupuesto", "oportunidades_matches", "oportunidades_tags"]) {
    const filas = await api(`${hija}?select=id&oportunidad_id=in.${lista}`);
    if (filas?.length) {
      await api(`${hija}?oportunidad_id=in.${lista}`, { method: "DELETE" });
      console.log(`✓ ${filas.length} filas borradas de ${hija}`);
    }
  }
  await api(`oportunidades?id=in.${lista}`, { method: "DELETE" });
  const quedan = await api(`oportunidades?select=id&id=in.${lista}`);
  console.log(`✓ ${ids.length} oportunidades de demo borradas — quedan ${quedan.length}`);
  writeFileSync(REGISTRO, "[]");
}

const cmd = process.argv[2];
if (cmd === "sembrar") await sembrar();
else if (cmd === "limpiar") await limpiar();
else { console.log("uso: node demo-datos.mjs sembrar|limpiar"); process.exit(1); }
