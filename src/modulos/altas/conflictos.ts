"use server";

// Acciones para que la socia resuelva, desde su panel, las diferencias entre
// lo que cargó en /sumate y lo que ya figuraba en el padrón UIAB.
// La detección de esas diferencias ocurre al crear la cuenta (ver ./acciones).

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient as createSesionClient } from "@/lib/supabase/servidor";
import { conflictosPendientes, reglaDeCampo, type ConflictoPadron, type OrigenDato } from "./padron";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Resuelve el alta de la empresa del usuario logueado. Devuelve null si no hay
 * sesión, si el usuario no es miembro de ninguna empresa, o si esa empresa no
 * tiene un alta con diferencias anotadas.
 *
 * La autorización se apoya en `miembros_empresa`: sólo se puede tocar la ficha
 * de la empresa de la que el usuario es miembro.
 */
async function altaDelUsuario() {
  const sesion = await createSesionClient();
  const {
    data: { user },
  } = await sesion.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  const { data: membresias } = await db
    .from("miembros_empresa")
    .select("empresa_id")
    .eq("perfil_id", user.id)
    .limit(1);

  const empresaId = membresias?.[0]?.empresa_id;
  if (!empresaId) return null;

  const { data: altas } = await db
    .from("altas_socios")
    .select("id, empresa_id, conflictos_padron")
    .eq("empresa_id", empresaId)
    .not("conflictos_padron", "is", null)
    .limit(1);

  const alta = altas?.[0];
  if (!alta) return null;

  return { db, alta, empresaId };
}

function revalidarFichas() {
  revalidatePath("/dashboard");
  revalidatePath("/perfil/datos");
  revalidatePath("/directorio");
}

/**
 * Diferencias que la socia todavía no confirmó. Para superficies que son client
 * components (`/perfil/datos`) y no pueden leer `altas_socios` por RLS.
 */
export async function obtenerConflictosPendientes(): Promise<ConflictoPadron[]> {
  const ctx = await altaDelUsuario();
  if (!ctx) return [];
  return conflictosPendientes(ctx.alta.conflictos_padron as ConflictoPadron[] | null);
}

/**
 * La socia elige qué valor queda para un campo: el que cargó en el formulario
 * o el que ya tenía UIAB en el padrón.
 */
export async function resolverConflictoPadron(campo: string, eleccion: OrigenDato) {
  if (eleccion !== "formulario" && eleccion !== "padron") {
    return { error: "Opción no válida." };
  }
  if (!reglaDeCampo(campo)) {
    return { error: "Campo no válido." };
  }

  const ctx = await altaDelUsuario();
  if (!ctx) return { error: "No pudimos identificar tu empresa. Volvé a ingresar." };
  const { db, alta, empresaId } = ctx;

  const conflictos = (alta.conflictos_padron ?? []) as ConflictoPadron[];
  const objetivo = conflictos.find((c) => c.campo === campo && !c.resuelto);
  if (!objetivo) return { error: "Ese dato ya fue revisado." };

  const valor = eleccion === "formulario" ? objetivo.valor_formulario : objetivo.valor_padron;

  const { error } = await db
    .from("empresas")
    .update({ [campo]: valor })
    .eq("id", empresaId);
  if (error) return { error: `No pudimos guardar el cambio: ${error.message}` };

  const actualizados = conflictos.map((c) =>
    c.campo === campo ? { ...c, resuelto: true, aplicado: eleccion } : c
  );

  await db
    .from("altas_socios")
    .update({
      conflictos_padron: actualizados,
      conflictos_revisados_en:
        conflictosPendientes(actualizados).length > 0 ? null : new Date().toISOString(),
    })
    .eq("id", alta.id);

  revalidarFichas();
  return { success: true as const };
}

/**
 * "Está todo bien así": cierra el aviso sin tocar la ficha. Los valores que ya
 * estaban guardados quedan como están.
 */
export async function descartarConflictosPadron() {
  const ctx = await altaDelUsuario();
  if (!ctx) return { error: "No pudimos identificar tu empresa. Volvé a ingresar." };
  const { db, alta } = ctx;

  const conflictos = (alta.conflictos_padron ?? []) as ConflictoPadron[];

  await db
    .from("altas_socios")
    .update({
      conflictos_padron: conflictos.map((c) => ({ ...c, resuelto: true })),
      conflictos_revisados_en: new Date().toISOString(),
    })
    .eq("id", alta.id);

  revalidarFichas();
  return { success: true as const };
}
