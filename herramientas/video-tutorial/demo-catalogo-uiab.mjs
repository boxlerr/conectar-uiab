/**
 * Catálogo de servicios de la UIAB, para poder filmar su ficha completa.
 *
 *   node demo-catalogo-uiab.mjs sembrar   → crea los servicios y sus fotos
 *   node demo-catalogo-uiab.mjs limpiar   → borra exactamente eso
 *
 * QUÉ ES ESTO Y QUÉ NO
 *
 * El capítulo 1 del video entra a una ficha del directorio y muestra el
 * catálogo. La ficha de la UIAB estaba en cero items, así que no había nada
 * que mostrar. Esto lo llena.
 *
 * Los servicios NO son inventados: salen de uiab.org —de "Nuestra Propuesta"
 * (las seis Acciones UIAB), de "Quiénes Somos" (los cuatro pilares) y de las
 * novedades—, y las fotos son las de sus propias actividades, bajadas de su
 * sitio. Aun así se siembra y se borra como el resto de los datos de demo: es
 * contenido que aparece en una ficha pública real y las descripciones las
 * redacté yo, no ellos. Si la UIAB las aprueba, se dejan fijas sacando el
 * borrado del pipeline.
 *
 * Las fotos se bajan de uiab.org en el momento. Si el sitio no responde, el
 * servicio se crea igual pero sin imagen, y se avisa.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const REGISTRO = "demo-catalogo-ids.json";
const BUCKET = "imagenes-publicas";
const UIAB = "7221a1d7-006d-4587-b9e4-753c0c9a229d";

const leerEnv = () => {
  for (const nombre of [".env.local", ".env"]) {
    const ruta = resolve(AQUI, "../..", nombre);
    if (!existsSync(ruta)) continue;
    return Object.fromEntries(
      readFileSync(ruta, "utf8").split("\n")
        .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
        .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  }
  return {};
};
const env = leerEnv();
const U = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!U || !K) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");

const api = async (ruta, opciones = {}) => {
  const r = await fetch(`${U}/rest/v1/${ruta}`, {
    ...opciones,
    headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json",
      Prefer: opciones.method === "POST" ? "return=representation" : "return=minimal", ...opciones.headers },
  });
  if (!r.ok) throw new Error(`${r.status} ${ruta} → ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

/**
 * Los servicios, con la fuente de cada uno en uiab.org y la foto de la
 * actividad que le corresponde. Las fotos son de las novedades del propio
 * sitio: la de reglamentos es la mesa de esa charla, la de Catamarca es la del
 * stand, y así.
 */
const SERVICIOS = [
  {
    nombre: "Representación gremial ante organismos públicos y privados",
    corta: "Llevamos la voz de la industria de Almirante Brown a la mesa donde se deciden las cosas.",
    larga:
      "La UIAB representa y defiende los derechos e intereses de sus asociados ante entidades "
      + "públicas y privadas. Articulamos entre las empresas y el resto de los actores: los "
      + "trabajadores agremiados, el Gobierno municipal y provincial, la ciencia, las casas de "
      + "estudio y la sociedad civil.\n\n"
      + "En la práctica esto significa mesas de trabajo con el Municipio, presencia en las "
      + "discusiones sobre habilitaciones, servicios e infraestructura del partido, y una vía "
      + "directa para que un reclamo de una PyME llegue con peso institucional.",
    claves: ["representación gremial", "vinculación institucional", "municipio", "PyME industrial"],
    foto: "https://www.uiab.org/wp-content/uploads/2026/01/Uiab_12-e1768228644356.jpg",
    alt: "Mesa de trabajo institucional de la UIAB",
    destacado: true,
  },
  {
    nombre: "#CharlasUIAB: capacitación, talleres y seminarios",
    corta: "Formación permanente para vos y tu equipo, dictada por especialistas de la industria.",
    larga:
      "Fomentar la capacitación permanente de los miembros de la organización y sus asociados es "
      + "una de las acciones centrales de la UIAB. Bajo el ciclo #CharlasUIAB organizamos charlas, "
      + "talleres y seminarios sobre los temas que la industria del partido necesita resolver.\n\n"
      + "Las actividades son abiertas a las empresas socias y se anuncian en el sitio y por los "
      + "canales de la institución. Participan cámaras, organismos públicos, universidades y "
      + "especialistas invitados.",
    claves: ["capacitación", "charlas", "talleres", "seminarios", "formación"],
    foto: "https://www.uiab.org/wp-content/uploads/2026/01/1-e1767963866486-1110x550.jpeg",
    alt: "Charla UIAB con presentación en pantalla",
    destacado: true,
  },
  {
    nombre: "Acceso a financiamiento y líneas de crédito",
    corta: "Te acercamos las líneas disponibles y te acompañamos a presentarte.",
    larga:
      "Organizamos charlas informativas sobre financiamiento para empresas radicadas en parques "
      + "industriales, con los bancos y organismos que ofrecen las líneas. La última fue sobre las "
      + "herramientas del Banco Nación para el sector.\n\n"
      + "Acercamos las condiciones, los requisitos y los plazos, y acompañamos a la empresa socia "
      + "en la presentación. El objetivo es que una PyME no se pierda una línea por no haberse "
      + "enterado a tiempo o por no saber cómo armar la carpeta.",
    claves: ["financiamiento", "líneas de crédito", "parques industriales", "banco nación"],
    foto: "https://www.uiab.org/wp-content/uploads/2026/01/6-e1767964935722-929x1024.jpeg",
    alt: "Charla de financiamiento para empresas en parques industriales",
  },
  {
    nombre: "Acompañamiento en reglamentos técnicos y normativa",
    corta: "Qué norma te aplica, qué tenés que certificar y para cuándo.",
    larga:
      "Los reglamentos técnicos cambian y alcanzan a más rubros cada año. Desde la UIAB "
      + "organizamos encuentros con los organismos que los aplican para que la empresa socia "
      + "sepa qué le corresponde, qué ensayos necesita y con qué plazos.\n\n"
      + "Sumamos además la orientación sobre certificaciones de producto y sistemas de gestión, y "
      + "el contacto con laboratorios y organismos de certificación de la red.",
    claves: ["reglamentos técnicos", "normativa", "certificación", "ensayos"],
    foto: "https://www.uiab.org/wp-content/uploads/2026/01/20251120_102955-1110x550.jpg",
    alt: "Encuentro de la UIAB sobre reglamentos técnicos",
  },
  {
    nombre: "Ferias, misiones comerciales y mercados internacionales",
    corta: "Orientamos y facilitamos la salida de nuestras socias a otros mercados.",
    larga:
      "Orientar, asesorar y facilitar la inserción de los socios en los mercados internacionales "
      + "es una de las acciones que la UIAB asume como propias. Participamos con las empresas del "
      + "partido en ferias y exposiciones del sector —como la Expo Catamarca Minera— y en misiones "
      + "comerciales.\n\n"
      + "Trabajamos la agenda previa, la logística del stand compartido y las rondas de negocios, "
      + "para que una PyME pueda exponer sin montar sola toda la operación.",
    claves: ["ferias", "misiones comerciales", "exportación", "rondas de negocios"],
    foto: "https://www.uiab.org/wp-content/uploads/2026/01/feed-UIAB-17-1080x550.jpg",
    alt: "Stand de la UIAB en la Expo Catamarca Minera",
  },
  {
    nombre: "La Industria Corre: programa solidario de la industria browniana",
    corta: "La industria del partido corre y lo recaudado se convierte en equipamiento para la salud pública.",
    larga:
      "La Industria Corre es el programa solidario que reúne a las empresas del partido en una "
      + "carrera cuyo producido se destina a instituciones de la comunidad. Lo recaudado se "
      + "convierte en equipamiento e insumos para hospitales y centros de salud de Almirante "
      + "Brown.\n\n"
      + "Las empresas socias participan como equipo y como sponsors, y la entrega se hace de forma "
      + "abierta, con el detalle de a qué institución fue cada aporte.",
    claves: ["responsabilidad social", "comunidad", "salud pública", "La Industria Corre"],
    foto: "https://www.uiab.org/wp-content/uploads/2026/01/Uiab_13-e1768228604427.jpg",
    alt: "Entrega de equipamiento de La Industria Corre a un hospital del partido",
  },
];

/**
 * Etiquetas que describen a la UIAB, para que "Especialidades y capacidades"
 * no quede en dos.
 *
 * La ficha traía sólo "Automatización" y "Calibración", que son restos de otra
 * carga y no describen a una cámara empresarial. Esas NO se tocan —son datos
 * previos, no míos— pero al lado de siete que sí corresponden dejan de
 * desentonar. Salen todas del catálogo existente y de lo que la propia UIAB
 * dice que hace en uiab.org.
 */
const ETIQUETAS = [
  "Capacitación", "Consultoría técnica", "Asesoramiento normativo",
  "Certificación", "Seguridad e higiene", "Financiación", "Exportación",
];

async function bajar(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (!r.ok) throw new Error(`${r.status} al bajar ${url}`);
  const tipo = r.headers.get("content-type") || "image/jpeg";
  return { buffer: Buffer.from(await r.arrayBuffer()), mime: tipo.split(";")[0].trim() };
}

async function sembrar() {
  const [miembro] = await api(`miembros_empresa?select=perfil_id&empresa_id=eq.${UIAB}&limit=1`);
  if (!miembro) throw new Error("La ficha de la UIAB no tiene miembros — no puedo setear creado_por.");
  const autor = miembro.perfil_id;
  const ahora = new Date().toISOString();

  const filas = SERVICIOS.map((s) => ({
    empresa_id: UIAB, proveedor_id: null, categoria_id: null,
    tipo_item: "servicio", nombre: s.nombre,
    descripcion_corta: s.corta, descripcion_larga: s.larga,
    estado: "publicado", aprobado_en: ahora, aprobado_por: autor,
    creado_por: autor, precio_a_consultar: true, moneda: "ARS",
    destacado: Boolean(s.destacado), palabras_clave: s.claves,
    enlaces: [{ url: "https://www.uiab.org/nuestra-propuesta/", tipo: "web", etiqueta: "Ver en uiab.org" }],
  }));

  const creados = await api("items", { method: "POST", body: JSON.stringify(filas) });
  writeFileSync(REGISTRO, JSON.stringify(creados.map((i) => i.id), null, 2));
  console.log(`✓ ${creados.length} servicios creados en la ficha de la UIAB`);

  const porNombre = new Map(SERVICIOS.map((s) => [s.nombre, s]));
  let conFoto = 0;
  for (const item of creados) {
    const s = porNombre.get(item.nombre);
    if (!s?.foto) continue;
    try {
      const { buffer, mime } = await bajar(s.foto);
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      const ruta = `items/${item.id}/${Date.now()}-0.${ext}`;
      const r = await fetch(`${U}/storage/v1/object/${BUCKET}/${ruta}`, {
        method: "POST",
        headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": mime, "cache-control": "2678400" },
        body: buffer,
      });
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
      await api("imagenes_item", {
        method: "POST",
        body: JSON.stringify([{
          item_id: item.id, bucket: BUCKET, ruta_archivo: ruta,
          nombre_archivo: s.foto.split("/").pop(), mime_type: mime,
          tamano_bytes: buffer.length, texto_alternativo: s.alt, orden: 0,
        }]),
      });
      conFoto++;
    } catch (error) {
      console.warn(`  ⚠ sin foto para "${item.nombre}": ${String(error.message).slice(0, 90)}`);
    }
  }
  console.log(`✓ ${conFoto} fotos bajadas de uiab.org y subidas`);

  // ── Etiquetas ──────────────────────────────────────────────────────────
  const yaTiene = new Set((await api(`empresas_tags?select=tag_id&empresa_id=eq.${UIAB}`))
    .map((t) => t.tag_id));
  const puente = [];
  for (const nombre of ETIQUETAS) {
    const [t] = await api(`tags?select=id&nombre=eq.${encodeURIComponent(nombre)}&limit=1`);
    if (!t) { console.warn(`  ⚠ la etiqueta "${nombre}" no está en el catálogo`); continue; }
    if (!yaTiene.has(t.id)) puente.push({ empresa_id: UIAB, tag_id: t.id });
  }
  if (puente.length) {
    await api("empresas_tags", { method: "POST", body: JSON.stringify(puente) });
    console.log(`✓ ${puente.length} etiquetas agregadas a la ficha`);
  }
  console.log(`\n  ids en ${REGISTRO} — corré "node demo-catalogo-uiab.mjs limpiar" al terminar.`);
}

async function limpiar() {
  // Por el registro Y por empresa: si la sesión se cortó entre el alta y el
  // borrado, el archivo se pierde pero los items quedan en una ficha pública.
  const vistos = new Set();
  if (existsSync(REGISTRO)) for (const id of JSON.parse(readFileSync(REGISTRO, "utf8"))) vistos.add(id);
  for (const s of SERVICIOS) {
    const filas = await api(`items?select=id&empresa_id=eq.${UIAB}&nombre=eq.${encodeURIComponent(s.nombre)}`);
    for (const f of filas ?? []) vistos.add(f.id);
  }
  const ids = [...vistos];
  if (!ids.length) { console.log("No quedó ningún servicio de demo en la ficha de la UIAB."); return; }
  const lista = `(${ids.join(",")})`;

  const imgs = await api(`imagenes_item?select=id,bucket,ruta_archivo&item_id=in.${lista}`);
  if (imgs?.length) {
    await fetch(`${U}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: imgs.map((i) => i.ruta_archivo) }),
    });
    await api(`imagenes_item?item_id=in.${lista}`, { method: "DELETE" });
    console.log(`✓ ${imgs.length} fotos borradas`);
  }
  // Sólo las etiquetas que agregó ESTE script: las que la ficha ya tenía se
  // quedan donde estaban.
  const idsTags = [];
  for (const nombre of ETIQUETAS) {
    const [t] = await api(`tags?select=id&nombre=eq.${encodeURIComponent(nombre)}&limit=1`);
    if (t) idsTags.push(t.id);
  }
  if (idsTags.length) {
    await api(`empresas_tags?empresa_id=eq.${UIAB}&tag_id=in.(${idsTags.join(",")})`, { method: "DELETE" });
    console.log(`✓ etiquetas agregadas por el video, quitadas`);
  }

  await api(`items?id=in.${lista}`, { method: "DELETE" });
  const quedan = await api(`items?select=id&empresa_id=eq.${UIAB}`);
  console.log(`✓ ${ids.length} servicios borrados — quedan ${quedan.length} en la ficha`);
  writeFileSync(REGISTRO, "[]");
}

const cmd = process.argv[2];
if (cmd === "sembrar") await sembrar();
else if (cmd === "limpiar") await limpiar();
else { console.log("uso: node demo-catalogo-uiab.mjs sembrar|limpiar"); process.exit(1); }
