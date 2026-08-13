import { createClient as createClienteSSR } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { tieneAcceso } from "@/lib/mercadopago/suscripciones";

/**
 * Guard de suscripción para Server Actions.
 *
 * El corte por suscripción vive en el middleware, o sea que protege la NAVEGACIÓN
 * a /perfil y al panel. Pero un Server Action es un POST con su id publicado en
 * el bundle: se puede invocar desde cualquier URL, incluida una que el gate no
 * cubre. Hoy alcanza porque Next postea a la URL de la página que lo importa,
 * pero es una propiedad del framework, no una defensa nuestra — y basta con que
 * una acción se importe desde una página pública para que quede expuesta.
 *
 * Esto es lo que hace que "pagás para aparecer" sea cierto también del lado del
 * servidor: sin suscripción al día no se edita la ficha, ni el catálogo, ni las
 * etiquetas, ni se dan de alta usuarios.
 *
 * Deja pasar:
 *  - a los admin (gestionan fichas ajenas por definición);
 *  - a las socias de cortesía, que tienen la suscripción en `activa` con monto 0;
 *  - a quien está en mora dentro del período de gracia (ya pagó alguna vez).
 *
 * Devuelve el error en vez de tirar, para que el panel lo muestre con un toast.
 */
export async function exigirSuscripcion(): Promise<{ error: string } | null> {
  const ssr = await createClienteSSR();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  const db = createAdminClient();

  const { data: perfil } = await db
    .from("perfiles")
    .select("rol_sistema, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) return { error: "No encontramos tu perfil." };
  if (perfil.activo === false) return { error: "Tu acceso está desactivado." };
  if (perfil.rol_sistema === "admin") return null;

  // Qué ficha administra. Se mira la membresía real, no el rol: un admin con
  // ficha propia ya salió arriba, y acá lo que importa es de quién es la
  // suscripción que hay que chequear.
  const [{ data: me }, { data: mp }] = await Promise.all([
    db.from("miembros_empresa").select("empresa_id").eq("perfil_id", user.id).limit(1),
    db.from("miembros_proveedor").select("proveedor_id").eq("perfil_id", user.id).limit(1),
  ]);

  const empresaId = (me as { empresa_id: string }[] | null)?.[0]?.empresa_id ?? null;
  const proveedorId = (mp as { proveedor_id: string }[] | null)?.[0]?.proveedor_id ?? null;

  // Sin ficha no hay nada que editar; que lo resuelva el flujo de alta.
  if (!empresaId && !proveedorId) {
    return { error: "Tu cuenta todavía no está vinculada a ninguna ficha." };
  }

  const { data: sus } = await db
    .from("suscripciones")
    .select("estado, gracia_hasta")
    .eq(empresaId ? "empresa_id" : "proveedor_id", empresaId ?? proveedorId)
    .order("creado_en", { ascending: false })
    .limit(1);

  const fila = (sus as { estado: string; gracia_hasta: string | null }[] | null)?.[0];

  if (!tieneAcceso(fila?.estado, fila?.gracia_hasta)) {
    return {
      error:
        "Tu suscripción no está al día, así que no se pueden guardar cambios. Activala desde Mi Suscripción.",
    };
  }

  return null;
}
