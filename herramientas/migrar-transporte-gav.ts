/**
 * Pasa EMPRESA TRANSPORTE GAV SRL al circuito de socias y la vincula al padrón.
 *
 * QUÉ PASÓ (2026-08-13)
 * Transporte Gav es socia de la UIAB y ya tenía su ficha publicada en el
 * directorio desde el 2026-08-02. Pero esa ficha NO tiene el CUIT cargado —seis
 * de las 63 están así—, así que cuando la empresa se registró por /register el
 * control contra el padrón, que sólo comparaba CUITs, no encontró nada:
 *
 *   - se creó una SEGUNDA ficha ("EMPRESA TRANSPORTE GAV SRL", pendiente_revision)
 *   - con una suscripción en `pendiente_pago` de $50.000
 *   - y le llegó por correo "Activá tu suscripción" a una empresa que no paga
 *
 * QUÉ HACE ESTE SCRIPT
 *  1. Deja una solicitud en `altas_socios` con todos los datos que cargaron —el
 *     mismo lugar donde caen las altas de /sumate— vinculada a la ficha real.
 *  2. Fusiona esos datos sobre la ficha del padrón con las reglas de siempre
 *     (`fusionarConPadron`): el correo y el teléfono pisan, el resto sólo
 *     completa lo que está vacío. Nunca borra un dato del padrón.
 *  3. Mueve el usuario (leo.carluccio@transportegav.com) a la ficha real.
 *  4. Mueve el rubro que eligieron.
 *  5. Borra la suscripción `pendiente_pago` y deja una de cortesía activa.
 *  6. Retira la ficha duplicada marcándola `rechazada`, con el mismo criterio que
 *     se usó con Pinturería Giannoni el 2026-08-04: no se borra, se retira, para
 *     que quede el rastro de que existió.
 *
 * Es IDEMPOTENTE: se puede correr de nuevo sin romper nada.
 *
 * Uso (desde la raíz del repo, con el .env al lado):
 *   node --env-file=.env herramientas/migrar-transporte-gav.ts          # simulacro
 *   node --env-file=.env herramientas/migrar-transporte-gav.ts --aplicar
 */

import { fusionarConPadron, type ConflictoPadron } from "../src/modulos/altas/padron.ts";

const FICHA_PADRON = "2ca0b917-5b20-4d05-bb48-ac2732fcd6f8"; // "Transporte Gav" — socia, publicada
const FICHA_DUPLICADA = "2389fe06-6c11-4542-9bcd-5fbae8fc6d74"; // la que creó el registro
const MOTIVO_RETIRO = "Duplicada de la ficha del padrón (Transporte Gav). Retirada 2026-08-13.";

const APLICAR = process.argv.includes("--aplicar");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Corré con --env-file=.env");
  process.exit(1);
}

type Fila = Record<string, unknown>;

async function rest(
  metodo: string,
  ruta: string,
  cuerpo?: unknown,
  extra?: Record<string, string>
): Promise<Fila[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    method: metodo,
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extra,
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`${metodo} ${ruta} → ${res.status} ${texto}`);
  return texto ? (JSON.parse(texto) as Fila[]) : [];
}

const leer = (ruta: string) => rest("GET", ruta);

/** En simulacro sólo cuenta qué haría; con --aplicar lo hace. */
async function escribir(descripcion: string, fn: () => Promise<unknown>) {
  if (!APLICAR) {
    console.log(`   [simulacro] ${descripcion}`);
    return;
  }
  await fn();
  console.log(`   ✓ ${descripcion}`);
}

async function main() {
  console.log(APLICAR ? "APLICANDO CAMBIOS\n" : "SIMULACRO (agregá --aplicar para escribir)\n");

  const [padron] = await leer(`empresas?select=*&id=eq.${FICHA_PADRON}`);
  const [dup] = await leer(`empresas?select=*&id=eq.${FICHA_DUPLICADA}`);

  if (!padron) throw new Error("No está la ficha del padrón. ¿Ya se corrió y se borró algo a mano?");
  if (!dup) {
    console.log("La ficha duplicada ya no existe: no hay nada que migrar.");
    return;
  }

  console.log(`Padrón:    ${padron.razon_social} (socia=${padron.es_socia_uiab}, estado=${padron.estado})`);
  console.log(`Duplicada: ${dup.razon_social} (estado=${dup.estado})\n`);

  // Respaldo de todo lo que se toca, por si hay que volver atrás.
  const respaldo = {
    fecha: new Date().toISOString(),
    padron,
    duplicada: dup,
    miembros: await leer(`miembros_empresa?select=*&empresa_id=eq.${FICHA_DUPLICADA}`),
    suscripciones: await leer(
      `suscripciones?select=*&empresa_id=in.(${FICHA_DUPLICADA},${FICHA_PADRON})`
    ),
    categorias: await leer(
      `empresas_categorias?select=*&empresa_id=in.(${FICHA_DUPLICADA},${FICHA_PADRON})`
    ),
  };
  const rutaRespaldo = `${import.meta.dirname}/respaldo-transporte-gav.json`;
  const { writeFileSync } = await import("node:fs");
  writeFileSync(rutaRespaldo, JSON.stringify(respaldo, null, 2));
  console.log(`Respaldo en ${rutaRespaldo}\n`);

  // ── 1. Solicitud de alta, con los datos tal como los cargaron ───────────────
  // Es lo que pidió la UIAB: que quede en el mismo lugar que si hubieran entrado
  // por /sumate, con toda su información.
  // El texto llegó pegado desde un Word: cada párrafo arranca con "o" + tabulación,
  // que es como Word exporta sus viñetas. Sin limpiarlo, la ficha pública muestra
  // "o Somos una empresa de logística..." en cada línea.
  const descripcionLimpia =
    typeof dup.descripcion === "string"
      ? dup.descripcion
          .split("\n")
          .map((l) => l.replace(/^\s*o\s*\t\s*/, "").trim())
          .filter(Boolean)
          .join("\n")
      : dup.descripcion;

  // El referente no lo cargaron en ningún campo (pusieron la razón social como
  // nombre de usuario). Sale del correo con el que se registraron, que es el que
  // la UIAB ya venía usando para hablar con ellos. Si no fuera correcto, se
  // cambia desde /perfil/datos o desde el panel de admin.
  const referenteNombre =
    (typeof dup.referente === "string" && dup.referente.trim()) || "Leo Carluccio";

  const alta = {
    razon_social: dup.razon_social,
    nombre_comercial: dup.nombre_comercial,
    cuit: dup.cuit,
    actividad: descripcionLimpia,
    categoria: "empresa_socia",
    ya_es_socio: true,
    n_socio: padron.n_socio ?? null,
    referente_nombre: referenteNombre,
    email: dup.email,
    telefono: dup.telefono,
    // El host va en minúsculas: lo tipearon todo en mayúsculas y queda como href
    // visible en la ficha pública.
    sitio_web:
      typeof dup.sitio_web === "string" ? dup.sitio_web.toLowerCase() : dup.sitio_web,
    localidad: dup.localidad,
    direccion: dup.direccion,
    email_compras: dup.email_compras ?? null,
    email_mantenimiento: dup.email_mantenimiento ?? null,
  };

  const { cambios, conflictos } = fusionarConPadron(alta, padron);

  console.log("Datos que se le suman a la ficha del padrón:");
  for (const [col, val] of Object.entries(cambios)) {
    console.log(`   ${col}: ${JSON.stringify(padron[col])} → ${JSON.stringify(val)}`);
  }
  if (conflictos.length) {
    console.log("\nDiferencias que va a tener que confirmar la socia en su panel:");
    for (const c of conflictos) {
      console.log(`   ${c.etiqueta}: padrón="${c.valor_padron}" | formulario="${c.valor_formulario}" → queda el ${c.aplicado}`);
    }
  }
  console.log();

  const yaHayAlta = await leer(
    `altas_socios?select=id&email=ilike.${encodeURIComponent(String(dup.email))}`
  );

  if (yaHayAlta.length > 0) {
    console.log(`Ya existe la solicitud de alta (${yaHayAlta[0].id}): no se crea otra.`);
  } else {
    await escribir("crear la solicitud en altas_socios", () =>
      rest("POST", "altas_socios", {
        ...alta,
        mensaje:
          "Se registró por /register el 2026-08-13 y el sistema no la reconoció en el padrón " +
          "(la ficha del padrón no tiene el CUIT cargado). Migrada a mano: los datos son los que " +
          "cargó la empresa en el registro.",
        estado: "cuenta_creada",
        empresa_id: FICHA_PADRON,
        origen: "registro_web",
        conflictos_padron: conflictos as unknown as ConflictoPadron[],
        conflictos_revisados_en: null,
      })
    );
  }

  // ── 2. Retirar la ficha duplicada ──────────────────────────────────────────
  //
  // Va ANTES de fusionar y no al final: `empresas.cuit` tiene un índice único
  // (idx_empresas_cuit), así que mientras la duplicada siga teniendo el CUIT no
  // se lo podemos escribir a la ficha del padrón — el UPDATE choca con un 23505.
  // Se lo sacamos a la duplicada al retirarla; el dato no se pierde, queda en la
  // ficha buena y en el respaldo.
  await escribir("retirar la ficha duplicada del directorio", () =>
    rest("PATCH", `empresas?id=eq.${FICHA_DUPLICADA}`, {
      estado: "rechazada",
      motivo_rechazo: MOTIVO_RETIRO,
      razon_social: `${dup.razon_social} [DUPLICADA — retirada 2026-08-13]`,
      cuit: null,
    })
  );

  // ── 3. Fusionar sobre la ficha del padrón ──────────────────────────────────
  if (Object.keys(cambios).length > 0) {
    await escribir(`completar ${Object.keys(cambios).length} campo(s) de la ficha del padrón`, () =>
      rest("PATCH", `empresas?id=eq.${FICHA_PADRON}`, cambios)
    );
  } else {
    console.log("   La ficha del padrón ya está completa: nada que fusionar.");
  }

  // ── 4. Mover el usuario a la ficha real ────────────────────────────────────
  const miembros = respaldo.miembros;
  for (const m of miembros) {
    const yaEnPadron = await leer(
      `miembros_empresa?select=id&empresa_id=eq.${FICHA_PADRON}&perfil_id=eq.${m.perfil_id}`
    );
    if (yaEnPadron.length > 0) {
      await escribir(`sacar la membresía duplicada ${m.id}`, () =>
        rest("DELETE", `miembros_empresa?id=eq.${m.id}`)
      );
    } else {
      await escribir(`mover el usuario ${m.perfil_id} a la ficha del padrón`, () =>
        rest("PATCH", `miembros_empresa?id=eq.${m.id}`, {
          empresa_id: FICHA_PADRON,
          es_principal: true,
        })
      );
    }
  }

  // ── 5. Mover el rubro que eligieron ────────────────────────────────────────
  const catsDup = respaldo.categorias.filter((c) => c.empresa_id === FICHA_DUPLICADA);
  const catsPadron = new Set(
    respaldo.categorias.filter((c) => c.empresa_id === FICHA_PADRON).map((c) => c.categoria_id)
  );
  for (const c of catsDup) {
    if (catsPadron.has(c.categoria_id)) {
      await escribir(`descartar rubro repetido ${c.categoria_id}`, () =>
        rest("DELETE", `empresas_categorias?id=eq.${c.id}`)
      );
    } else {
      await escribir(`mover el rubro ${c.categoria_id} a la ficha del padrón`, () =>
        rest("PATCH", `empresas_categorias?id=eq.${c.id}`, { empresa_id: FICHA_PADRON })
      );
    }
  }

  // ── 6. Suscripción: fuera el cobro, adentro la cortesía ────────────────────
  for (const s of respaldo.suscripciones.filter((s) => s.empresa_id === FICHA_DUPLICADA)) {
    await escribir(`borrar la suscripción ${s.estado} de la ficha duplicada`, () =>
      rest("DELETE", `suscripciones?id=eq.${s.id}`)
    );
  }
  const susPadron = respaldo.suscripciones.filter((s) => s.empresa_id === FICHA_PADRON);
  if (susPadron.length === 0) {
    await escribir("crear la suscripción de cortesía de la socia", () =>
      rest("POST", "suscripciones", {
        empresa_id: FICHA_PADRON,
        monto: 0,
        moneda: "ARS",
        nombre_plan: "Socia UIAB (sin cargo)",
        estado: "activa",
        metodo_pago: "cortesia",
        ciclo: "mensual",
        notas_admin:
          "Acceso sin cargo por ser socia de la UIAB. Reemplaza la suscripción pendiente_pago " +
          "que le creó el registro del 2026-08-13 por error.",
      })
    );
  } else {
    console.log(`   La ficha del padrón ya tiene suscripción (${susPadron[0].estado}): no se toca.`);
  }

  console.log(
    APLICAR
      ? "\nListo. Transporte Gav quedó con una sola ficha, su usuario adentro y acceso sin cargo."
      : "\nSimulacro terminado. Volvé a correrlo con --aplicar para escribir."
  );
}

main().catch((e) => {
  console.error("\nFALLÓ:", e.message);
  process.exit(1);
});
