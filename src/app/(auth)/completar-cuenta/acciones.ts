"use server";

import { createClient as createClienteSSR } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordSchema } from "@/modulos/altas/invitaciones-core";

/**
 * Cierra el primer ingreso: la persona escribe su nombre y elige su propia
 * contraseña, y la provisoria deja de servir.
 *
 * Toma la identidad de la SESIÓN, no de un parámetro: así nadie puede completar
 * la cuenta de otro mandando un id ajeno — que es lo que pasaría si esto
 * recibiera el perfilId, siendo un POST público como todo server action.
 */
export async function completarCuenta(
  nombre: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClienteSSR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Se cerró tu sesión. Volvé a ingresar." };

  const nombreLimpio = nombre.replace(/\s+/g, " ").trim();
  if (nombreLimpio.length < 3) return { ok: false, error: "Escribí tu nombre y apellido." };
  if (nombreLimpio.length > 80) return { ok: false, error: "El nombre es demasiado largo." };

  const pass = passwordSchema.safeParse(password);
  if (!pass.success) {
    return { ok: false, error: pass.error.issues[0]?.message ?? "La contraseña no cumple los requisitos." };
  }

  const db = createAdminClient();

  const { error: errPass } = await db.auth.admin.updateUserById(user.id, { password });
  if (errPass) {
    // Supabase rechaza reusar la misma contraseña si está configurado así, y ese
    // mensaje en inglés no le dice nada a nadie.
    if (/different from the old|same.*password/i.test(errPass.message)) {
      return { ok: false, error: "Elegí una contraseña distinta de la provisoria." };
    }
    return { ok: false, error: `No pudimos guardar la contraseña: ${errPass.message}` };
  }

  const { error: errPerfil } = await db
    .from("perfiles")
    .update({ nombre_completo: nombreLimpio, debe_completar_cuenta: false })
    .eq("id", user.id);

  if (errPerfil) {
    // La contraseña ya cambió; dejar el flag prendido sería encerrarla en un
    // bucle. Se avisa y se corta acá para que reintente.
    console.error("[completar-cuenta] no se pudo guardar el perfil:", errPerfil.message);
    return { ok: false, error: "Guardamos tu contraseña pero no tu nombre. Probá de nuevo." };
  }

  return { ok: true };
}
