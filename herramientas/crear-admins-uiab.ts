/**
 * Crea las cuentas de administración de la UIAB y deja su ficha institucional
 * sin rastros de demo.
 *
 *   npx tsx herramientas/crear-admins-uiab.ts            # muestra qué haría
 *   npx tsx herramientas/crear-admins-uiab.ts --aplicar  # lo hace
 *
 * Qué hace, en orden:
 *  1. Crea (o reutiliza) el usuario de Auth de cada dirección @uiab.org, con el
 *     correo ya confirmado y una contraseña aleatoria que nadie conoce: la real
 *     la elige la persona con el link de invitación.
 *  2. Crea su perfil con `rol_sistema = 'admin'` y activo.
 *  3. Los vincula a la ficha de la UIAB (`miembros_empresa`). Exactamente UNO
 *     queda como `es_principal` — dos titulares rompen los gates que buscan al
 *     titular con `.maybeSingle()`.
 *  4. Genera el token de invitación de 30 días e IMPRIME el link. **No manda
 *     ningún correo**: son casillas reales y el envío lo decide un humano.
 *  5. Limpia la ficha: saca al usuario demo, borra el ítem de prueba que quedó
 *     publicado y corrige el correo, que apuntaba a un dominio sin MX.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

for (const archivo of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), archivo);
  if (!fs.existsSync(p)) continue;
  for (const linea of fs.readFileSync(p, "utf8").split("\n")) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const APLICAR = process.argv.includes("--aplicar");
const EMPRESA_UIAB = "7221a1d7-006d-4587-b9e4-753c0c9a229d";
const PERFIL_DEMO = "f9cf4922-71f5-4f72-8586-8e214d774e31";
const ITEM_DEMO = "afc3221a-e122-45dd-9ebe-eb483a9e4791";

const ADMINS = [
  { email: "gerencia.ejecutiva@uiab.org", esPrincipal: true, rol: "dueno" },
  { email: "comunicacion@uiab.org", esPrincipal: false, rol: "gestor" },
];

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://www.uiabconecta.com";
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

function log(paso: string, detalle: string) {
  console.log(`${APLICAR ? "✓" : "·"} ${paso.padEnd(26)} ${detalle}`);
}

async function buscarUsuarioPorEmail(email: string) {
  // listUsers pagina; el padrón de la UIAB es chico, con 2 páginas alcanza.
  for (let page = 1; page <= 5; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    const u = data?.users?.find((x) => x.email?.toLowerCase() === email);
    if (u) return u;
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return null;
}

async function crearAdmin(spec: (typeof ADMINS)[number]) {
  const email = spec.email.toLowerCase();
  console.log(`\n── ${email} ─────────────────────────────`);

  let userId: string;
  const existente = await buscarUsuarioPorEmail(email);

  if (existente) {
    userId = existente.id;
    log("usuario de Auth", `ya existía (${userId})`);
  } else if (!APLICAR) {
    log("usuario de Auth", "se crearía, con el correo confirmado");
    return;
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email,
      // Nadie la usa: la real la define la persona con el link. Sin contraseña
      // Supabase igual crea el usuario, pero así no queda una cuenta sin credencial.
      password: randomBytes(24).toString("base64url"),
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`No se pudo crear ${email}: ${error?.message}`);
    userId = data.user.id;
    log("usuario de Auth", `creado (${userId})`);
  }

  if (!APLICAR) {
    log("perfil admin", "se crearía activo");
    log("vínculo con la ficha", `${spec.rol}${spec.esPrincipal ? " · titular" : ""}`);
    log("invitación", "se generaría el link de 30 días (sin enviar correo)");
    return;
  }

  // 2. Perfil admin. `nombre_completo` queda vacío a propósito: lo escribe la
  //    persona en /definir-password, que es el pedido.
  const { error: errPerfil } = await db.from("perfiles").upsert(
    {
      id: userId,
      email,
      nombre_completo: null,
      rol_sistema: "admin",
      activo: true,
    },
    { onConflict: "id" }
  );
  if (errPerfil) throw new Error(`Perfil de ${email}: ${errPerfil.message}`);
  log("perfil admin", "activo, sin nombre (lo pone en el primer ingreso)");

  // 3. Vínculo con la ficha institucional.
  const { data: yaMiembro } = await db
    .from("miembros_empresa")
    .select("id")
    .eq("empresa_id", EMPRESA_UIAB)
    .eq("perfil_id", userId)
    .maybeSingle();

  if (!yaMiembro) {
    const { error } = await db.from("miembros_empresa").insert({
      empresa_id: EMPRESA_UIAB,
      perfil_id: userId,
      rol: spec.rol,
      es_principal: spec.esPrincipal,
    });
    if (error) throw new Error(`Vínculo de ${email}: ${error.message}`);
  }
  log("vínculo con la ficha", `${spec.rol}${spec.esPrincipal ? " · titular" : ""}`);

  // 4. Invitación: token nuevo, sin mail.
  await db
    .from("invitaciones_acceso")
    .update({ usado_en: new Date().toISOString() })
    .eq("perfil_id", userId)
    .is("usado_en", null);

  const token = randomBytes(32).toString("base64url");
  const { error: errInv } = await db.from("invitaciones_acceso").insert({
    perfil_id: userId,
    email,
    token_hash: hashToken(token),
  });
  if (errInv) throw new Error(`Invitación de ${email}: ${errInv.message}`);

  console.log(`\n  LINK (válido 30 días, un solo uso):\n  ${APP}/definir-password?token=${token}\n`);
}

async function limpiarFicha() {
  console.log("\n── Ficha de la UIAB ─────────────────────────────");

  if (!APLICAR) {
    log("usuario demo", "se desvincularía y desactivaría (UIAB Demo)");
    log("ítem de prueba", "se borraría «ventanas de PVC»");
    log("correo de la ficha", "info@uiabconecta.com → comunicacion@uiab.org");
    log("sitio web", "https://uiabconecta.com → https://uiab.org");
    return;
  }

  // El demo pierde la ficha y el acceso, pero no se borra: es una decisión que
  // le toca a Julián y borrar un usuario de Auth no se deshace.
  await db.from("miembros_empresa").delete().eq("perfil_id", PERFIL_DEMO).eq("empresa_id", EMPRESA_UIAB);
  await db.from("perfiles").update({ activo: false }).eq("id", PERFIL_DEMO);
  try {
    await db.auth.admin.updateUserById(PERFIL_DEMO, { ban_duration: "876000h" });
  } catch (err) {
    console.error("  (no se pudo banear al demo en Auth)", err);
  }
  log("usuario demo", "desvinculado y desactivado — no borrado");

  const { error: errItem } = await db.from("items").delete().eq("id", ITEM_DEMO);
  if (errItem) console.error("  (no se pudo borrar el ítem)", errItem.message);
  else log("ítem de prueba", "«ventanas de PVC» borrado de la ficha pública");

  // uiabconecta.com no tiene registros MX: cualquier correo a esa casilla se
  // pierde. El dominio con correo es uiab.org (Google Workspace).
  const { error: errFicha } = await db
    .from("empresas")
    .update({
      email: "comunicacion@uiab.org",
      sitio_web: "https://uiab.org",
    })
    .eq("id", EMPRESA_UIAB);
  if (errFicha) console.error("  (no se pudo actualizar la ficha)", errFicha.message);
  else {
    log("correo de la ficha", "comunicacion@uiab.org (uiabconecta.com no recibe correo)");
    log("sitio web", "https://uiab.org");
  }
}

async function main() {
  console.log(
    APLICAR
      ? "APLICANDO cambios en la base\n"
      : "SIMULACIÓN — no se toca nada. Corré con --aplicar para hacerlo.\n"
  );
  for (const spec of ADMINS) await crearAdmin(spec);
  await limpiarFicha();
  console.log(
    APLICAR
      ? "\nListo. Los links de arriba NO se enviaron por correo: pasáselos vos.\n"
      : "\nNada se modificó.\n"
  );
}

main().catch((err) => {
  console.error("\nFALLÓ:", err.message);
  process.exit(1);
});
