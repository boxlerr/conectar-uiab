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
  const software = await cat("Desarrollo de Software Industrial");

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
      etiquetas: ["Cableado industrial", "Redes industriales",
                  "Electricidad y tableros", "Electricidad industrial"],
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
      etiquetas: ["Electricidad y tableros", "Electricidad industrial"],
    },
    {
      // El pedido que el video usa para mostrar el match, y por eso es de
      // software y no de logística.
      //
      // El criterio real (calcular-matches.ts) exige compartir una etiqueta o
      // el rubro: la cercanía suma pero no habilita. Vaxler es una empresa de
      // software en CABA, así que con un pedido de fletes en Almirante Brown
      // no era candidata de ninguna manera y la sección "Por qué te
      // recomendamos" no se renderizaba. Con este pedido coincide por rubro y
      // por tres etiquetas, y la ubicación queda en cero — que es la verdad y
      // además deja ver que el puntaje se calcula, no se decora.
      //
      // Sigue siendo de la UIAB, no de Vaxler: a quien publica no se le
      // muestra "Postularse" ni el bloque del match.
      empresa_solicitante_id: EMPRESA_UIAB,
      categoria_id: software?.id ?? transp?.id ?? null,
      titulo: "Sistema web para gestionar capacitaciones y certificados",
      descripcion:
        "<p>La UIAB necesita un <b>sistema web</b> para administrar las capacitaciones que dicta a sus " +
        "socias y emitir los certificados correspondientes.</p><p>Alcance: inscripción online, control " +
        "de asistencia, emisión de certificados con código de verificación y panel de reportes por " +
        "empresa.</p><p>Se pide propuesta técnica, plazo de entrega y esquema de mantenimiento " +
        "posterior.</p>",
      cantidad: 1, unidad: "sistema", localidad: "Almirante Brown, Provincia de Buenos Aires",
      fecha_necesidad: enDias(30), tipo_requerimiento: ["servicio"],
      etiquetas: ["Desarrollo de software", "Aplicaciones web y móviles", "Sistemas de gestión (ERP)"],
    },
  ].map((f, i, todas) => ({
    ...f, estado: "abierta", visibilidad: "privada_parque", creado_por: f.creado_por ?? miembro.perfil_id,
    // El primero del array es el más nuevo, así encabeza el tablero.
    creado_en: new Date(Date.now() - i * 90_000).toISOString(),
  }));

  // `etiquetas` no es una columna de `oportunidades`: viaja acá al lado para
  // poder sembrar la tabla puente después, con los ids ya asignados.
  const etiquetasPorTitulo = new Map(filas.map((f) => [f.titulo, f.etiquetas ?? []]));
  const creadas = await api("oportunidades", {
    method: "POST",
    body: JSON.stringify(filas.map(({ etiquetas, ...resto }) => resto)),
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
    for (const nombre of etiquetasPorTitulo.get(o.titulo) ?? []) {
      const [t] = await api(`tags?select=id,nombre&nombre=eq.${encodeURIComponent(nombre)}&limit=1`);
      if (t) puente.push({ oportunidad_id: o.id, tag_id: t.id });
      else console.warn(`  ⚠ la etiqueta "${nombre}" no está en el catálogo: el match va a puntuar más bajo`);
    }
  }
  if (puente.length) {
    await api("oportunidades_tags", { method: "POST", body: JSON.stringify(puente) });
    console.log(`✓ ${puente.length} etiquetas asignadas`);
  }

  // ── Candidatos recomendados ────────────────────────────────────────────
  // El cálculo real del producto, en su propio proceso (necesita
  // --experimental-strip-types para importar el .ts). Si no corre, la sección
  // "Por qué te recomendamos" no se renderiza y el capítulo 2 se queda sin su
  // remate — así que si falla, se grita.
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
  await api(`oportunidades?id=in.${lista}`, { method: "DELETE" });
  const quedan = await api(`oportunidades?select=id&id=in.${lista}`);
  console.log(`✓ ${ids.length} oportunidades de demo borradas — quedan ${quedan.length}`);
  writeFileSync(REGISTRO, "[]");
}

const cmd = process.argv[2];
if (cmd === "sembrar") await sembrar();
else if (cmd === "limpiar") await limpiar();
else { console.log("uso: node demo-datos.mjs sembrar|limpiar"); process.exit(1); }
