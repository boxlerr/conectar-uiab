import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormCompletarCuenta } from "./FormCompletarCuenta";

export const dynamic = "force-dynamic";

/**
 * Primer ingreso con clave provisoria.
 *
 * El middleware trae acá a todo el que tenga `debe_completar_cuenta` y no lo
 * deja salir hasta que ponga su nombre y elija una contraseña propia. Si alguien
 * llega sin necesitarlo, se lo devuelve a su panel en vez de mostrarle un
 * formulario que no le corresponde.
 */
export default async function CompletarCuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/completar-cuenta");

  const { data: perfil } = await createAdminClient()
    .from("perfiles")
    .select("email, debe_completar_cuenta, rol_sistema")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.debe_completar_cuenta) {
    redirect(perfil?.rol_sistema === "admin" ? "/admin" : "/panel-de-control");
  }

  return (
    <FormCompletarCuenta
      email={(perfil.email as string) ?? user.email ?? ""}
      esAdmin={perfil.rol_sistema === "admin"}
    />
  );
}
