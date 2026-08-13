/**
 * ¿Esta persona puede entrar a la plataforma?
 *
 * Hay TRES frenos independientes y hasta el 2026-08-13 el panel de usuarios
 * miraba uno solo (`perfiles.activo`), así que el chip mentía: Naves del Sur
 * figuraba "Activo" mientras el login le rebotaba y estuvo un día afuera sin
 * que nadie pudiera ver por qué.
 *
 *  1. `perfiles.activo` — lo apaga la UIAB o la propia empresa del socio.
 *  2. el ban de Auth      — es el corte real; el middleware además le corta la
 *                           sesión que ya tuviera abierta.
 *  3. `email_confirmed_at` — desde que se prendió "Confirm email" en Supabase,
 *                           toda cuenta creada por /register nace sin confirmar.
 *
 * Habilitar tiene que levantar los tres: arreglar uno solo deja a la persona
 * afuera igual y al panel diciendo que está adentro.
 *
 * Módulo puro (sin "use server" ni "server-only"): lo importan el panel de
 * usuarios, que es un client component, y el dashboard, que corre en el server.
 */

export type EstadoAcceso = "ok" | "sin_perfil" | "sin_auth" | "desactivado" | "baneado" | "sin_confirmar";

/** Lo mínimo que hace falta saber de alguien para decidir si entra. */
export interface DatosDeAcceso {
  activo: boolean;
  /** ISO hasta cuándo corre el ban, o null si no está baneado. */
  baneado_hasta: string | null;
  /** null = no se pudo leer Auth. NO es lo mismo que "sin confirmar". */
  email_confirmado: boolean | null;
  /** El perfil existe pero no hay usuario de Auth detrás. */
  sin_usuario_auth: boolean;
  /** Al revés: existe en Auth pero no tiene fila en `perfiles`. */
  sin_perfil?: boolean;
}

/** Se evalúan de más grave a menos: manda el primero que aplique. */
export function estadoDeAcceso(u: DatosDeAcceso): EstadoAcceso {
  if (u.sin_perfil) return "sin_perfil";
  if (u.sin_usuario_auth) return "sin_auth";
  if (!u.activo) return "desactivado";
  if (u.baneado_hasta) return "baneado";
  if (u.email_confirmado === false) return "sin_confirmar";
  return "ok";
}

/**
 * Los que hoy no pueden entrar.
 *
 * `sin_auth` queda afuera a propósito: ahí no hay nada que habilitar, hay que
 * volver a crear el usuario. Los otros tres los destraba el botón "Habilitar".
 */
export function esperaHabilitacion(u: DatosDeAcceso): boolean {
  const e = estadoDeAcceso(u);
  return e === "desactivado" || e === "baneado" || e === "sin_confirmar";
}

export const ESTADO_ACCESO_CONFIG: Record<
  EstadoAcceso,
  { label: string; clase: string; detalle: string }
> = {
  ok: {
    label: "Activo",
    clase: "bg-emerald-50 text-emerald-700",
    detalle: "Puede entrar sin problemas.",
  },
  desactivado: {
    label: "Desactivado",
    clase: "bg-rose-50 text-rose-700",
    // Sin afirmar la causa: pudo desactivarlo la UIAB, su propia empresa, o
    // puede ser un alta que se enganchó a una ficha del padrón por /register y
    // nace así, esperando que alguien confirme que trabaja ahí.
    detalle:
      "Tiene el perfil apagado, así que no entra. Puede haberlo desactivado la UIAB o su empresa, o ser un alta esperando que se confirme que trabaja ahí — fijate en Altas de socios.",
  },
  baneado: {
    label: "Bloqueado en Auth",
    clase: "bg-rose-50 text-rose-700",
    detalle:
      "Tiene el perfil activo pero sigue bloqueado en Auth. Suele ser un alta que se enganchó a una ficha del padrón y quedó esperando que la UIAB confirme que la persona trabaja ahí.",
  },
  sin_confirmar: {
    label: "Sin confirmar",
    clase: "bg-amber-50 text-amber-700",
    detalle:
      'Nunca abrió el mail de confirmación, así que al entrar le sale "Email not confirmed". Habilitalo desde acá para darlo por confirmado vos, o pedile que busque el correo.',
  },
  sin_perfil: {
    label: "Registro a medias",
    clase: "bg-orange-50 text-orange-700",
    detalle:
      "Existe en Auth pero nunca se le creó el perfil: el registro se cortó a mitad de camino. No puede entrar, no aparecía en ningún lado, y encima tiene el correo tomado, así que esa persona no se puede volver a registrar. Hay que borrarlo para liberarlo.",
  },
  sin_auth: {
    label: "Sin usuario",
    clase: "bg-slate-100 text-slate-600",
    detalle:
      "Hay perfil pero no hay usuario de Auth: alguien lo borró a mano. No puede entrar de ninguna forma y hay que recrearlo.",
  },
};

/**
 * Estado de Auth de todos los usuarios, en una sola pasada paginada.
 *
 * Se hace así y no de a uno porque el panel lista toda la plataforma. Devuelve
 * un mapa vacío si Auth no contesta — quien llama tiene que distinguir "no hay
 * datos" de "está sin confirmar", que no es lo mismo.
 */
export async function leerEstadoAuth(supabase: {
  auth: {
    admin: {
      listUsers(params: { page: number; perPage: number }): Promise<{
        data: {
          users: Array<{
            id: string;
            email?: string | null;
            last_sign_in_at?: string | null;
            email_confirmed_at?: string | null;
            confirmed_at?: string | null;
            banned_until?: string | null;
          }>;
        } | null;
      }>;
    };
  };
}): Promise<
  Map<string, { email: string | null; ultimoIngreso: string | null; baneadoHasta: string | null; emailConfirmado: boolean }>
> {
  const mapa = new Map<
    string,
    { email: string | null; ultimoIngreso: string | null; baneadoHasta: string | null; emailConfirmado: boolean }
  >();

  for (let page = 1; page <= 20; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    for (const u of users) {
      const banHasta = u.banned_until ?? null;
      mapa.set(u.id, {
        email: u.email ?? null,
        ultimoIngreso: u.last_sign_in_at ?? null,
        // Supabase deja el campo con una fecha PASADA cuando se levanta el ban,
        // así que "tiene valor" no alcanza: hay que ver si todavía corre.
        baneadoHasta: banHasta && new Date(banHasta) > new Date() ? banHasta : null,
        emailConfirmado: Boolean(u.email_confirmed_at ?? u.confirmed_at),
      });
    }
    if (users.length < 200) break;
  }

  return mapa;
}
