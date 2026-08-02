import type { TipoEntidadPerfil, User } from "@/tipos";

/**
 * Resuelve de qué ficha es dueño un perfil, mirando la membresía real en vez
 * del rol del sistema.
 *
 * Por qué existe: `rol_sistema` mezclaba dos cosas distintas — los permisos
 * ("soy admin") y la ficha que administro ("soy Vaxler"). Como todo el código
 * de /perfil hacía `role === 'company' ? empresas : proveedores`, un admin que
 * además es dueño de una empresa caía siempre en la rama de proveedor y
 * terminaba con `entityId = null`: el panel le quedaba vacío y /perfil lo
 * rebotaba a /admin, sin forma de configurar su propia ficha.
 *
 * Sirve igual con el cliente del browser (RLS) que con el admin client.
 */
export async function resolverEntidadDePerfil(
  supabase: {
    from: (tabla: string) => any;
  },
  perfilId: string
): Promise<{ tipo: TipoEntidadPerfil; id: string } | null> {
  const { data: empresa } = await supabase
    .from("miembros_empresa")
    .select("empresa_id")
    .eq("perfil_id", perfilId)
    .limit(1)
    .maybeSingle();

  if (empresa?.empresa_id) {
    return { tipo: "company", id: empresa.empresa_id as string };
  }

  const { data: proveedor } = await supabase
    .from("miembros_proveedor")
    .select("proveedor_id")
    .eq("perfil_id", perfilId)
    .limit(1)
    .maybeSingle();

  if (proveedor?.proveedor_id) {
    return { tipo: "provider", id: proveedor.proveedor_id as string };
  }

  return null;
}

/**
 * Tipo de ficha efectivo de un usuario ya cargado. Usalo en vez de
 * `currentUser.role === "company"` en cualquier pantalla que lea o escriba la
 * ficha: para socias devuelve lo mismo, y para un admin con ficha propia
 * devuelve la que realmente tiene en vez de asumir "proveedor".
 */
export function tipoEntidadDe(
  usuario: Pick<User, "role" | "entityRole"> | null | undefined
): TipoEntidadPerfil | null {
  if (!usuario) return null;
  if (usuario.entityRole) return usuario.entityRole;
  if (usuario.role === "company" || usuario.role === "provider") return usuario.role;
  return null;
}

/** Atajo legible para el patrón `tipoEntidadDe(u) === "company"`. */
export function esFichaDeEmpresa(
  usuario: Pick<User, "role" | "entityRole"> | null | undefined
): boolean {
  return tipoEntidadDe(usuario) === "company";
}
