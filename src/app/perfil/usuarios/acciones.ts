"use server";

import { revalidatePath } from "next/cache";
import { createClient as createClienteSSR } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverEntidadDePerfil } from "@/modulos/autenticacion/entidad-del-perfil";
import type { TipoEntidadPerfil } from "@/tipos";
import { exigirSuscripcion } from "@/lib/autenticacion/exigir-suscripcion";

/**
 * Usuarios de la ficha (empresa o prestador).
 *
 * La socia crea los accesos de su propia gente: email + contraseña + nombre, y
 * se los pasa por WhatsApp/mail. No hay matriz de permisos — todos los usuarios
 * de una ficha pueden hacer lo mismo; lo único que los distingue es el
 * "principal" (el que se creó con el alta), que no se puede desactivar para que
 * la ficha nunca quede sin dueño.
 *
 * Todo pasa por el service_role porque crear el acceso es `auth.admin`: por eso
 * cada action arranca resolviendo QUIÉN llama con el cliente SSR (sesión real) y
 * recién después toca la base. Nunca se recibe un `entidadId` del cliente.
 */

const TABLA_MIEMBROS = {
  company: "miembros_empresa",
  provider: "miembros_proveedor",
} as const;

const FK_ENTIDAD = {
  company: "empresa_id",
  provider: "proveedor_id",
} as const;

/** Ban "para siempre" de Supabase Auth: 100 años. `none` lo levanta. */
const BAN_INDEFINIDO = "876000h";

export interface UsuarioEquipo {
  perfilId: string;
  nombre: string | null;
  email: string;
  /** Área o puesto: "Compras", "Mantenimiento", lo que la empresa escriba. */
  cargo: string | null;
  telefono: string | null;
  activo: boolean;
  esPrincipal: boolean;
  /** true si es el propio usuario que está mirando la pantalla. */
  esVos: boolean;
  creadoEn: string;
  /** ISO del último login, o null si todavía no entró nunca. */
  ultimoIngreso: string | null;
}

export interface CredencialesNuevoUsuario {
  nombre: string;
  email: string;
  password: string;
}

/** Máximo del cargo: alcanza para "Higiene y Seguridad" sin volverse un párrafo. */
const MAX_CARGO = 40;

type Contexto = {
  perfilId: string;
  tipo: TipoEntidadPerfil;
  entidadId: string;
};

/** Resuelve quién llama y de qué ficha es, siempre desde la sesión. */
async function contextoDelSolicitante(): Promise<Contexto | { error: string }> {
  const ssr = await createClienteSSR();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión de nuevo." };

  const db = createAdminClient();
  const entidad = await resolverEntidadDePerfil(db, user.id);
  if (!entidad) {
    return {
      error:
        "Tu usuario todavía no está vinculado a una ficha. Completá tus datos en «Datos y Contacto».",
    };
  }
  return { perfilId: user.id, tipo: entidad.tipo, entidadId: entidad.id };
}

function esError(x: unknown): x is { error: string } {
  return typeof x === "object" && x !== null && "error" in x;
}

/** Membresía del perfil objetivo en la MISMA ficha del que llama. */
async function miembroDeLaFicha(
  ctx: Contexto,
  perfilObjetivo: string
): Promise<{ es_principal: boolean } | null> {
  const db = createAdminClient();
  const { data } = await db
    .from(TABLA_MIEMBROS[ctx.tipo])
    .select("es_principal")
    .eq(FK_ENTIDAD[ctx.tipo], ctx.entidadId)
    .eq("perfil_id", perfilObjetivo)
    .maybeSingle();
  return (data as { es_principal: boolean } | null) ?? null;
}

// ─── Listado ─────────────────────────────────────────────────────────────────

export async function listarUsuariosDeLaFicha(): Promise<
  { usuarios: UsuarioEquipo[] } | { error: string }
> {
  const ctx = await contextoDelSolicitante();
  if (esError(ctx)) return ctx;

  const db = createAdminClient();
  const { data: miembros, error: errMiembros } = await db
    .from(TABLA_MIEMBROS[ctx.tipo])
    .select("perfil_id, es_principal")
    .eq(FK_ENTIDAD[ctx.tipo], ctx.entidadId);

  if (errMiembros) return { error: errMiembros.message };

  const filas = (miembros ?? []) as { perfil_id: string; es_principal: boolean }[];
  if (filas.length === 0) return { usuarios: [] };

  const ids = filas.map((m) => m.perfil_id);
  const { data: perfiles, error: errPerfiles } = await db
    .from("perfiles")
    .select("id, nombre_completo, email, cargo, telefono, activo, creado_en")
    .in("id", ids);

  if (errPerfiles) return { error: errPerfiles.message };

  // El último ingreso vive en auth.users, no en `perfiles`: se pide de a uno
  // (un equipo son 2 o 3 personas, no vale la pena paginar listUsers).
  const ingresos = new Map<string, string | null>();
  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await db.auth.admin.getUserById(id);
        ingresos.set(id, data?.user?.last_sign_in_at ?? null);
      } catch {
        ingresos.set(id, null);
      }
    })
  );

  const principalDe = new Map(filas.map((m) => [m.perfil_id, m.es_principal]));

  const usuarios: UsuarioEquipo[] = (perfiles ?? []).map((p) => ({
    perfilId: p.id as string,
    nombre: (p.nombre_completo as string | null) ?? null,
    email: (p.email as string | null) ?? "",
    cargo: (p.cargo as string | null) ?? null,
    telefono: (p.telefono as string | null) ?? null,
    activo: Boolean(p.activo),
    esPrincipal: principalDe.get(p.id as string) ?? false,
    esVos: p.id === ctx.perfilId,
    creadoEn: p.creado_en as string,
    ultimoIngreso: ingresos.get(p.id as string) ?? null,
  }));

  // Principal primero, después por nombre: el orden de `in()` no es estable.
  usuarios.sort((a, b) => {
    if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1;
    return (a.nombre ?? a.email).localeCompare(b.nombre ?? b.email, "es");
  });

  return { usuarios };
}

// ─── Alta ────────────────────────────────────────────────────────────────────

export async function crearUsuarioDeLaFicha(datos: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  cargo?: string;
}): Promise<{ credenciales: CredencialesNuevoUsuario } | { error: string }> {
  const sinSuscripcion = await exigirSuscripcion();
  if (sinSuscripcion) return sinSuscripcion;

  const ctx = await contextoDelSolicitante();
  if (esError(ctx)) return ctx;

  const nombre = datos.nombre.trim();
  const apellido = datos.apellido.trim();
  const email = datos.email.trim().toLowerCase();
  const password = datos.password;
  const cargo = (datos.cargo ?? "").trim().slice(0, MAX_CARGO) || null;
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");

  if (!nombre) return { error: "Escribí el nombre de la persona." };
  if (!email) return { error: "Escribí el email con el que va a ingresar." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El email no es válido." };
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }

  const db = createAdminClient();

  // Un email = una cuenta en toda la plataforma. Si ya existe, el alta no es por
  // acá: o ya es de esta ficha, o pertenece a otra empresa y hay que resolverlo
  // a mano desde la UIAB.
  const { data: perfilExistente } = await db
    .from("perfiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (perfilExistente) {
    const yaEsDeLaFicha = await miembroDeLaFicha(ctx, perfilExistente.id as string);
    return {
      error: yaEsDeLaFicha
        ? "Esa persona ya tiene un usuario en tu empresa."
        : "Ya existe una cuenta con ese email. Escribinos a la UIAB para vincularla a tu empresa.",
    };
  }

  const { data: creado, error: errCrear } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // el acceso lo da la empresa: no hay mail de confirmación
    user_metadata: { nombre_completo: nombreCompleto },
  });

  if (errCrear || !creado?.user?.id) {
    const yaExiste = /already|registrad|registered|exist/i.test(errCrear?.message ?? "");
    return {
      error: yaExiste
        ? "Ya existe una cuenta con ese email."
        : `No se pudo crear el usuario: ${errCrear?.message ?? "error desconocido"}`,
    };
  }

  const userId = creado.user.id;
  const rolSistema = ctx.tipo === "company" ? "company" : "provider";

  const { error: errPerfil } = await db.from("perfiles").upsert(
    {
      id: userId,
      email,
      nombre_completo: nombreCompleto,
      cargo,
      rol_sistema: rolSistema,
      activo: true,
    },
    { onConflict: "id" }
  );

  if (errPerfil) {
    // Sin perfil el acceso queda huérfano (entra y no es de ninguna ficha).
    await db.auth.admin.deleteUser(userId);
    return { error: `No se pudo guardar el perfil: ${errPerfil.message}` };
  }

  const { error: errMiembro } = await db.from(TABLA_MIEMBROS[ctx.tipo]).insert({
    [FK_ENTIDAD[ctx.tipo]]: ctx.entidadId,
    perfil_id: userId,
    // Mismo rol que el titular: adentro de la ficha todos pueden todo.
    rol: "gestor",
    es_principal: false,
  });

  if (errMiembro) {
    await db.from("perfiles").delete().eq("id", userId);
    await db.auth.admin.deleteUser(userId);
    return { error: `No se pudo vincular el usuario a tu ficha: ${errMiembro.message}` };
  }

  // Espejo del rol en app_metadata; el rol que manda sigue siendo el de perfiles.
  try {
    await db.auth.admin.updateUserById(userId, { app_metadata: { role: rolSistema } });
  } catch {
    /* no rompe el alta */
  }

  revalidatePath("/perfil/usuarios");
  revalidatePath("/admin/usuarios");

  // La contraseña se devuelve UNA vez, para que la empresa se la pase a la
  // persona. Después no se puede volver a ver: sólo se genera una nueva.
  return { credenciales: { nombre: nombreCompleto, email, password } };
}

// ─── Activar / desactivar ────────────────────────────────────────────────────

export async function cambiarEstadoUsuarioDeLaFicha(
  perfilId: string,
  activar: boolean
): Promise<{ success: true } | { error: string }> {
  const sinSuscripcion = await exigirSuscripcion();
  if (sinSuscripcion) return sinSuscripcion;

  const ctx = await contextoDelSolicitante();
  if (esError(ctx)) return ctx;

  if (perfilId === ctx.perfilId) {
    return { error: "No podés desactivar tu propio usuario." };
  }

  const miembro = await miembroDeLaFicha(ctx, perfilId);
  if (!miembro) return { error: "Ese usuario no pertenece a tu empresa." };
  if (miembro.es_principal) {
    return { error: "Es el usuario principal de la ficha: no se puede desactivar." };
  }

  const db = createAdminClient();
  const { error } = await db.from("perfiles").update({ activo: activar }).eq("id", perfilId);
  if (error) return { error: error.message };

  // El flag de `perfiles` es para la UI; lo que realmente frena el login es el
  // ban de Auth (además el middleware lo saca si tenía la sesión abierta).
  try {
    await db.auth.admin.updateUserById(perfilId, {
      ban_duration: activar ? "none" : BAN_INDEFINIDO,
    });
  } catch (e) {
    await db.from("perfiles").update({ activo: !activar }).eq("id", perfilId);
    return {
      error: `No se pudo ${activar ? "activar" : "desactivar"} el acceso: ${
        e instanceof Error ? e.message : "error desconocido"
      }`,
    };
  }

  revalidatePath("/perfil/usuarios");
  revalidatePath("/admin/usuarios");
  return { success: true };
}

// ─── Contraseña nueva ────────────────────────────────────────────────────────

/**
 * Genera una contraseña nueva para un usuario de la ficha. Es la salida cuando
 * alguien la pierde: la contraseña original no queda guardada en ningún lado.
 */
export async function cambiarPasswordUsuarioDeLaFicha(
  perfilId: string,
  password: string
): Promise<{ credenciales: CredencialesNuevoUsuario } | { error: string }> {
  const sinSuscripcion = await exigirSuscripcion();
  if (sinSuscripcion) return sinSuscripcion;

  const ctx = await contextoDelSolicitante();
  if (esError(ctx)) return ctx;

  if (perfilId === ctx.perfilId) {
    return { error: "Para cambiar tu propia contraseña usá «Olvidé mi contraseña» en el login." };
  }
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }

  const miembro = await miembroDeLaFicha(ctx, perfilId);
  if (!miembro) return { error: "Ese usuario no pertenece a tu empresa." };

  const db = createAdminClient();
  const { data: perfil } = await db
    .from("perfiles")
    .select("email, nombre_completo")
    .eq("id", perfilId)
    .maybeSingle();

  const { error } = await db.auth.admin.updateUserById(perfilId, { password });
  if (error) return { error: `No se pudo cambiar la contraseña: ${error.message}` };

  revalidatePath("/perfil/usuarios");
  return {
    credenciales: {
      nombre: (perfil?.nombre_completo as string | null) ?? "",
      email: (perfil?.email as string | null) ?? "",
      password,
    },
  };
}
