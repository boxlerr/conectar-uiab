/**
 * Decide en qué paso sigue un tour cuando el actual no se puede mostrar.
 *
 * Existe porque el tutorial "se cortaba a la mitad": joyride corre en modo
 * controlado (nosotros manejamos `stepIndex`), así que cuando un target no
 * aparece avisa con `error:target_not_found` y se queda esperando — overlay
 * gris puesto, sin tooltip y sin botón para seguir. Varias secciones del panel
 * sólo se renderizan para ciertos roles (dash-matches, dash-items), con lo cual
 * el paso apuntaba a un nodo que no existía.
 *
 * Va en su propio archivo y con `existe` inyectado para que sea pura: se puede
 * testear el salteo sin montar joyride ni el DOM del panel.
 */

export interface PasoUbicable {
  /** Selector CSS del target. `body` son los pasos centrados: siempre existe. */
  target: string;
  /** Pathname donde vive el paso. Sin valor = sirve en cualquiera. */
  ruta?: string;
}

/**
 * Índice del próximo paso mostrable después de `desde`, o -1 si no queda
 * ninguno (ahí el tour se cierra prolijo en vez de quedar colgado).
 *
 * Un paso sirve si vive en OTRA ruta — navegamos y se evalúa allá, con el DOM
 * de esa página — o si su target ya está presente en la actual.
 */
export function proximoPasoMostrable(
  pasos: PasoUbicable[],
  desde: number,
  pathname: string,
  existe: (selector: string) => boolean
): number {
  return pasos.findIndex((paso, i) => {
    if (i <= desde) return false;
    if (paso.ruta && paso.ruta !== pathname) return true;
    if (paso.target === "body") return true;
    return existe(paso.target);
  });
}
