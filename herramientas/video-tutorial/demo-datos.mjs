/**
 * Datos de demostración para poder filmar el capítulo de Oportunidades.
 *
 *   node demo-datos.mjs sembrar   → crea 3 oportunidades y anota sus ids
 *   node demo-datos.mjs limpiar   → borra EXACTAMENTE esas 3 (y sus postulaciones)
 *
 * Dos van a nombre de VAXLER —la empresa que el video recorre— y la tercera a
 * nombre de la UIAB. Esto último no es un detalle: ni "Postularse" ni el bloque
 * "Por qué te recomendamos" se le muestran a quien publicó, así que si las tres
 * fueran de Vaxler el capítulo 2 se quedaría sin sus dos mejores tramos.
 *
 * Además del alta, siembra las etiquetas y corre el cruce REAL del producto
 * (ver recalcular-matches.mjs): los puntajes que se ven en cámara los calcula
 * la plataforma, no este archivo.
 *
 * Nacen con visibilidad "privada_parque", igual que las que crea el formulario:
 * no son visibles para el público anónimo.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
const BUCKET = "oportunidades";

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
  // Los dos primeros salen a nombre de METALÚRGICA LONGCHAMPS, que es la
  // empresa con la que se filma el capítulo. Tiene que ser ella y no otra: la
  // sección "Candidatos recomendados" —donde se ven las empresas que matchean
  // con el trabajo, que es el corazón del capítulo— sólo se le muestra a quien
  // publicó el pedido. Por eso grabar.mjs entra con su cuenta.
  const socia = await empresaPorNombre("metalurgica longchamps");
  if (!socia) throw new Error("No encontré a Metalúrgica Longchamps en empresas.");
  const [miembroSocia] = await api(
    `miembros_empresa?select=perfil_id&empresa_id=eq.${socia.id}&limit=1`);
  const autor = miembroSocia?.perfil_id ?? miembro.perfil_id;
  console.log(`  · 2 pedidos a nombre de ${socia.razon_social}, 1 de la UIAB`);

  const cat = async (like) => {
    const [c] = await api(`categorias?select=id,nombre&nombre=ilike.*${encodeURIComponent(like)}*&limit=1`);
    return c;
  };
  // Exactas: con patrones flojos ("Metal", "Mantenimiento") caía en cosas como
  // "Cursos de Mantenimiento de Grúas", que en cámara no tiene nada que ver
  // con el pedido.
  const pintura = await cat("Pinturerías");
  const metal = await cat("Metalúrgica");
  const transp = await cat("Transporte");

  const hoy = new Date("2026-07-31");
  const enDias = (d) => new Date(hoy.getTime() + d * 864e5).toISOString().slice(0, 10);

  const filas = [
    {
      // El pedido al que entra el video. Va primero en el tablero y es el que
      // lleva los planos adjuntos.
      //
      // Es de terminación superficial y no de trabajo metalúrgico a propósito:
      // Longchamps corta, pliega y suelda ella misma —lo dice su propia ficha—,
      // así que un pedido de mecanizado no tendría sentido. La pintura en polvo
      // sí es algo que terceriza, y del otro lado hay pinturerías socias reales
      // que la cubren, o sea que los candidatos que salen en cámara son
      // coherentes con lo que se pide.
      empresa_solicitante_id: socia.id, creado_por: autor,
      categoria_id: pintura?.id ?? metal?.id ?? null,
      titulo: "Pintura en polvo y tratamiento superficial para 800 bastidores",
      descripcion:
        "<p>Buscamos un taller de <b>pintura en polvo termoconvertible</b> para la terminación de una " +
        "serie de 800 bastidores soldados de acero SAE 1010 de 3 mm, de 1240 × 820 × 300 mm cada uno.</p>" +
        "<p><b>Alcance del servicio:</b> desengrase, fosfatizado de zinc, imprimación epoxi de 20 a 30 " +
        "micrones y terminación en poliéster color RAL 7016 semimate de 60 a 80 micrones. El espesor " +
        "total de película seca debe quedar entre 80 y 110 micrones.</p>" +
        "<p><b>Controles exigidos:</b> adherencia grado 0 a 1 por corte enrejado (ISO 2409), niebla " +
        "salina de 480 horas sin ampollado (ASTM B117) y brillo de 30 ± 5 GU a 60° (ISO 2813). Se pide " +
        "protocolo de ensayos por lote.</p>" +
        "<p><b>Logística:</b> cuatro entregas parciales de 200 unidades, cada 15 días. El retiro y la " +
        "devolución corren por nuestra cuenta salvo que coticen el flete aparte. Las piezas van en " +
        "rack, sin apilar.</p>" +
        "<p>Adjuntamos el plano del bastidor y la especificación de terminación. Se solicita cotización " +
        "por unidad y por lote completo, con plazo de proceso en firme.</p>",
      cantidad: 800, unidad: "bastidores", localidad: "Longchamps, Provincia de Buenos Aires",
      fecha_necesidad: enDias(24), tipo_requerimiento: ["servicio"],
      etiquetas: ["Pinturas y tintas", "Pintura industrial", "Pintura en polvo"],
      planos: true,
    },
    {
      empresa_solicitante_id: socia.id, creado_por: autor,
      categoria_id: metal?.id ?? null,
      titulo: "Provisión de chapa de acero laminado en frío",
      descripcion:
        "<p>Necesitamos <b>chapa de acero laminado en frío</b> calidad SAE 1010 para abastecer la " +
        "línea de corte durante el próximo trimestre.</p><p>Espesores de 2, 3 y 4 mm en formato " +
        "1000 × 2000 mm. Se pide certificado de colada por partida y tolerancia de espesor según " +
        "IRAM-IAS U 500-42.</p><p>Entrega en planta de Longchamps, con descarga a cargo del proveedor. " +
        "Cotizar por tonelada, con precio sostenido a 30 días.</p>",
      cantidad: 12, unidad: "toneladas", localidad: "Longchamps, Provincia de Buenos Aires",
      fecha_necesidad: enDias(15), tipo_requerimiento: ["material"],
      etiquetas: ["Metalúrgica", "Hierro"],
    },
    {
      empresa_solicitante_id: EMPRESA_UIAB,
      categoria_id: transp?.id ?? null,
      titulo: "Servicio de transporte entre plantas del parque industrial",
      descripcion:
        "<p>Requerimos un <b>servicio de transporte y logística interna</b> entre plantas del parque " +
        "industrial de Almirante Brown, con frecuencia diaria de lunes a viernes.</p>" +
        "<p>Se necesita utilitario con capacidad de 1.500 kg, chofer con licencia vigente y seguro de " +
        "carga. El recorrido estimado es de 40 km diarios.</p><p>Cotizar por mes, con contrato mínimo " +
        "de 6 meses.</p>",
      cantidad: 22, unidad: "viajes/mes", localidad: "Almirante Brown, Provincia de Buenos Aires",
      fecha_necesidad: enDias(30), tipo_requerimiento: ["servicio"],
      etiquetas: ["Logística"],
    },
  ].map((f, i) => ({
    ...f, estado: "abierta", visibilidad: "privada_parque", creado_por: f.creado_por ?? miembro.perfil_id,
    // El primero del array es el más nuevo, así encabeza el tablero. Sin esto
    // los tres quedan con la misma marca de tiempo y el orden entre ellos
    // depende de un empate: "la primera tarjeta" cambiaba de una toma a otra.
    creado_en: new Date(Date.now() - i * 90_000).toISOString(),
  }));

  // `etiquetas` y `planos` no son columnas de `oportunidades`: viajan al lado
  // para poder sembrar la tabla puente y los adjuntos con los ids ya asignados.
  const extraPorTitulo = new Map(filas.map((f) => [f.titulo, { etiquetas: f.etiquetas ?? [], planos: Boolean(f.planos) }]));
  const creadas = await api("oportunidades", {
    method: "POST",
    body: JSON.stringify(filas.map(({ etiquetas, planos, ...resto }) => resto)),
  });
  writeFileSync(REGISTRO, JSON.stringify(creadas.map((o) => o.id), null, 2));
  console.log(`✓ ${creadas.length} oportunidades de demo creadas:`);
  for (const o of creadas) console.log(`   ${o.id}  ${o.titulo}`);

  // ── Etiquetas ──────────────────────────────────────────────────────────
  // Sin esto los pedidos quedan con rubro pero sin etiquetas, y el cruce se
  // apoya justo ahí: 20 puntos por etiqueta compartida contra 30 por rubro.
  // Se resuelven por nombre EXACTO; si alguna no existe en el catálogo se
  // avisa en vez de seguir en silencio, porque el efecto de una etiqueta que
  // falta es un puntaje más bajo en cámara y nadie lo relaciona con esto.
  const puente = [];
  for (const o of creadas) {
    for (const nombre of extraPorTitulo.get(o.titulo)?.etiquetas ?? []) {
      const [t] = await api(`tags?select=id,nombre&nombre=eq.${encodeURIComponent(nombre)}&limit=1`);
      if (t) puente.push({ oportunidad_id: o.id, tag_id: t.id });
      else console.warn(`  ⚠ la etiqueta "${nombre}" no está en el catálogo: el match va a puntuar más bajo`);
    }
  }
  if (puente.length) {
    await api("oportunidades_tags", { method: "POST", body: JSON.stringify(puente) });
    console.log(`✓ ${puente.length} etiquetas asignadas`);
  }

  // ── Adjuntos ───────────────────────────────────────────────────────────
  // Los planos del pedido que el video abre. Van al bucket `oportunidades`
  // con la convención del producto (`<id>/<NN>-<timestamp>-<nombre>`), que es
  // la que lee `adjuntos-servidor.ts` para armar la galería del hero.
  const conPlanos = creadas.find((o) => extraPorTitulo.get(o.titulo)?.planos);
  if (conPlanos) {
    const { dibujarPlanos } = await import("./planos-demo.mjs");
    const planos = await dibujarPlanos();
    for (const [i, { nombre, buffer }] of planos.entries()) {
      const ruta = `${conPlanos.id}/${String(i + 1).padStart(2, "0")}-${Date.now() + i}-${nombre}`;
      const r = await fetch(`${U}/storage/v1/object/${BUCKET}/${ruta}`, {
        method: "POST",
        headers: {
          apikey: K, Authorization: `Bearer ${K}`,
          "Content-Type": "image/png", "cache-control": "2678400",
        },
        body: buffer,
      });
      if (!r.ok) console.warn(`  ⚠ no pude subir ${nombre}: ${r.status} ${await r.text()}`);
    }
    console.log(`✓ ${planos.length} planos adjuntos a "${conPlanos.titulo}"`);
  }

  // ── Candidatos recomendados ────────────────────────────────────────────
  // El cálculo real del producto, en su propio proceso (necesita
  // --experimental-strip-types para importar el .ts). Si no corre, la sección
  // de candidatos queda vacía y el capítulo 2 se queda sin su remate — así
  // que si falla, se grita.
  console.log("· calculando candidatos con el cruce real del producto");
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings",
     resolve(AQUI, "recalcular-matches.mjs"), ...creadas.map((o) => o.id)],
    { stdio: "inherit", cwd: AQUI, env: process.env },
  );
  if (r.status !== 0) {
    console.error("  ⚠ el cálculo de candidatos falló: el bloque del match no se va a poder filmar.");
  }

  console.log(`\n  ids anotados en ${REGISTRO} — corré "node demo-datos.mjs limpiar" al terminar.`);
}

/**
 * Los títulos que siembra este archivo. `limpiar` barre por acá ADEMÁS de por
 * demo-ids.json, y no es redundancia: el 19-ago quedó una oportunidad de demo
 * viva en producción durante un día entero —Vaxler pidiendo públicamente un
 * cableado que no necesita— porque la sesión se cortó entre el alta y el
 * borrado, y con ella se perdió el registro de ids. El archivo es el camino
 * feliz; esto es la red.
 */
const TITULOS_DEMO = [
  "Pintura en polvo y tratamiento superficial para 800 bastidores",
  "Provisión de chapa de acero laminado en frío",
  "Servicio de transporte entre plantas del parque industrial",
  // Títulos de versiones anteriores del sembrado, para que un barrido de hoy
  // levante también lo que dejó una sesión vieja.
  "Cableado estructurado y rack para sala de servidores",
  "Tablero eléctrico y UPS para sala de servidores",
  "Sistema web para gestionar capacitaciones y certificados",
  // Títulos de versiones anteriores del sembrado, para que un barrido de hoy
  // levante también lo que dejó una sesión vieja.
  "Servicio de logística interna para el parque industrial",
];

/** Ids de todo lo que este archivo pudo haber creado alguna vez. */
async function idsDeDemo() {
  const vistos = new Set();
  if (existsSync(REGISTRO)) {
    for (const id of JSON.parse(readFileSync(REGISTRO, "utf8"))) vistos.add(id);
  }
  for (const t of TITULOS_DEMO) {
    const filas = await api(`oportunidades?select=id&titulo=eq.${encodeURIComponent(t)}`);
    for (const f of filas ?? []) vistos.add(f.id);
  }
  return [...vistos];
}

async function limpiar() {
  const ids = await idsDeDemo();
  if (!ids.length) { console.log("No quedó ninguna oportunidad de demo."); return; }
  const sueltas = existsSync(REGISTRO)
    ? ids.length - JSON.parse(readFileSync(REGISTRO, "utf8")).length : ids.length;
  if (sueltas > 0) console.log(`  · ${sueltas} de otra sesión, encontradas por título`);
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
  // Los adjuntos viven en Storage, no en una tabla: si no se borran acá,
  // quedan archivos huérfanos en el bucket para siempre.
  for (const id of ids) {
    const r = await fetch(`${U}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: id, limit: 100 }),
    });
    const objetos = r.ok ? await r.json() : [];
    if (!objetos.length) continue;
    await fetch(`${U}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: objetos.map((o) => `${id}/${o.name}`) }),
    });
    console.log(`✓ ${objetos.length} adjuntos borrados del bucket`);
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
