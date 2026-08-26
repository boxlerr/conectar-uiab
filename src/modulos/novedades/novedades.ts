/**
 * Catálogo de novedades y su clave de persistencia.
 *
 * Vive fuera de `acciones.ts` a propósito: ese archivo es `"use server"` y ahí
 * SÓLO pueden exportarse funciones async. Un helper sincrónico exportado desde
 * una server action no existe del lado del cliente y rompe el import en tiempo
 * de build (la app entera devuelve 500).
 */
export type NovedadId =
  | "usuarios_empresa"
  | "perfil_directorio"
  | "oportunidades_cartelera"
  | "panel_control";

/** Clave dentro de `perfiles.tutoriales_vistos`, que es un mapa jsonb libre. */
export function claveNovedad(id: NovedadId): string {
  return `novedad_${id}`;
}

/**
 * Cuándo salió cada novedad (hora de Argentina).
 *
 * Una novedad sólo es novedad para quien ya usaba el sistema antes. A la que
 * recién crea su cuenta el cartel la confunde: le anuncia como "nuevo" algo que
 * para ella siempre estuvo, y le lista arreglos de errores que nunca sufrió.
 * Por eso se compara contra `perfiles.creado_en`.
 */
export const NOVEDAD_PUBLICADA_EL: Record<NovedadId, string> = {
  // Deploy de "cada socia da de alta a los usuarios de su empresa" (2026-08-04).
  usuarios_empresa: "2026-08-04T00:00:00-03:00",
  // Rediseño de la ficha pública del directorio (2026-08-14).
  perfil_directorio: "2026-08-14T00:00:00-03:00",
  /**
   * Rediseño de la cartelera de oportunidades (2026-08-14, de noche).
   *
   * La hora importa: `perfil_directorio` salió a las 00:00 del mismo día, así
   * que si esta llevara la misma marca, a quien creó la cuenta hoy a la tarde
   * no le saldría ninguna de las dos. Va la hora real del deploy.
   */
  oportunidades_cartelera: "2026-08-14T23:30:00-03:00",
  // Rediseño del panel de control (2026-08-25, de noche).
  panel_control: "2026-08-25T22:00:00-03:00",
};

/**
 * Cuáles hablan de la ficha propia y por lo tanto sólo le sirven a quien
 * administra una.
 *
 * Vive acá y no en `pila-novedades.tsx` porque ahora hay dos lugares que lo
 * necesitan —el cartel y el feed del panel— y el registro de componentes de la
 * pila importa los tres modales: leerlo desde el panel arrastraría los tres al
 * bundle sólo para averiguar un booleano.
 */
export const NOVEDAD_EXIGE_FICHA: Record<NovedadId, boolean> = {
  oportunidades_cartelera: false,
  // El panel es la pantalla de entrada de todo el mundo, tenga ficha o no.
  panel_control: false,
  perfil_directorio: true,
  usuarios_empresa: true,
};

/**
 * En qué orden se anuncian cuando a alguien le corresponden varias: primero la
 * más nueva.
 *
 * Dos carteles modales ENCIMADOS no se pueden cerrar (el de arriba tapa al de
 * abajo y los dos `aria-modal` pelean por el foco), así que se ven de a uno.
 * Pero de a uno POR SESIÓN era peor: al que le tocaban dos, la segunda no la
 * veía nunca. Se recorren en una pila con Siguiente / Atrás — ver
 * `pila-novedades.tsx`.
 */
export const NOVEDADES_POR_PRIORIDAD: NovedadId[] = [
  "panel_control",
  "oportunidades_cartelera",
  "perfil_directorio",
  "usuarios_empresa",
];

/** Todas las novedades pendientes, en orden de anuncio. Vacío si no hay. */
export function novedadesPendientes(perfil: PerfilParaNovedad): NovedadId[] {
  return NOVEDADES_POR_PRIORIDAD.filter((id) => debeVerNovedad(id, perfil));
}

type PerfilParaNovedad = {
  /** ISO de `perfiles.creado_en`. Si no lo sabemos, no bloqueamos el cartel. */
  creadoEn?: string | null;
  tutorialesVistos?: Record<string, string | null> | null;
} | null | undefined;

/**
 * ¿Le mostramos esta novedad a esta persona?
 *
 * Función pura para poder decidirlo sin tocar la base: el modal ya tiene el
 * perfil que vino del servidor.
 */
export function debeVerNovedad(id: NovedadId, perfil: PerfilParaNovedad): boolean {
  if (!perfil) return false;

  // Ya la cerró alguna vez (en cualquier dispositivo: esto vive en el perfil).
  if (perfil.tutorialesVistos?.[claveNovedad(id)]) return false;

  // Cuenta creada después de que la novedad salió: para esa persona no es
  // ninguna novedad. Lo que tiene que saber (que puede sumar usuarios de su
  // empresa) se lo explica el formulario de registro / el alta de socias.
  if (perfil.creadoEn) {
    const creado = Date.parse(perfil.creadoEn);
    const publicada = Date.parse(NOVEDAD_PUBLICADA_EL[id]);
    if (Number.isFinite(creado) && Number.isFinite(publicada) && creado >= publicada) {
      return false;
    }
  }

  return true;
}
