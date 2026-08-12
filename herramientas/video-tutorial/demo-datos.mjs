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

async function sembrar() {
  const [miembro] = await api(`miembros_empresa?select=perfil_id&empresa_id=eq.${EMPRESA_UIAB}&limit=1`);
  if (!miembro) throw new Error("La empresa de la UIAB no tiene miembros — no puedo setear creado_por.");

  const cat = async (like) => {
    const [c] = await api(`categorias?select=id,nombre&nombre=ilike.*${encodeURIComponent(like)}*&limit=1`);
    return c;
  };
  const metal = await cat("Metal");
  const transp = await cat("Transporte");
  const mant = await cat("Mantenimiento");

  const hoy = new Date("2026-07-31");
  const enDias = (d) => new Date(hoy.getTime() + d * 864e5).toISOString().slice(0, 10);

  const filas = [
    {
      empresa_solicitante_id: EMPRESA_UIAB,
      categoria_id: metal?.id ?? null,
      titulo: "Provisión de 500 kg de chapa laminada en frío",
      descripcion:
        "<p>Necesitamos <b>500 kg de chapa laminada en frío</b> calidad SAE 1010, espesor 1,2 mm, " +
        "en formato de 1000 x 2000 mm.</p><p>Requisitos: certificado de colada por lote, superficie sin " +
        "óxido ni marcas de manipuleo, y entrega en planta de Burzaco en un plazo máximo de 15 días.</p>" +
        "<p>Se solicita cotización con precio por kilo, condiciones de pago y plazo de entrega en firme.</p>",
      cantidad: 500, unidad: "kg", localidad: "Burzaco, Provincia de Buenos Aires",
      fecha_necesidad: enDias(21), tipo_requerimiento: ["material"],
    },
    {
      empresa_solicitante_id: EMPRESA_UIAB,
      categoria_id: mant?.id ?? metal?.id ?? null,
      titulo: "Reparación y puesta a punto de torno CNC Fanuc",
      descripcion:
        "<p>Buscamos taller o técnico especializado para la <b>reparación de un torno CNC con control " +
        "Fanuc 0i-TD</b>. La máquina presenta error de eje X y pérdida de repetibilidad.</p>" +
        "<p>Alcance: diagnóstico en planta, reemplazo de guías y husillo si hiciera falta, calibración " +
        "final y protocolo de mediciones.</p><p>Valoramos experiencia comprobable en Fanuc y " +
        "disponibilidad para trabajar durante la parada de planta.</p>",
      cantidad: 1, unidad: "servicio", localidad: "Longchamps, Provincia de Buenos Aires",
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
    ...f, estado: "abierta", visibilidad: "privada_parque", creado_por: miembro.perfil_id,
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
