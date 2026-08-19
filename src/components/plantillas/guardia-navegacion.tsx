"use client";

import { useEffect } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GUARDIA DE NAVEGACIÓN — que un click nunca quede en la nada
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * EL SÍNTOMA
 *
 * Dejás la pestaña abierta, te vas a otra, pasa un rato, volvés — y a partir de
 * ahí los clicks no hacen nada. Ni entran a una ficha ni cambian de sección. La
 * página se ve perfecta, no hay error en consola, y la única salida es F5.
 *
 * POR QUÉ PASA
 *
 * Con el App Router, un `<Link>` NO navega por su cuenta: cancela el click del
 * browser (`preventDefault`) y le pide al router que traiga el payload RSC de
 * la ruta destino. Y como acá casi ninguna ruta tiene `loading.tsx`, la URL no
 * se mueve hasta que ese pedido vuelve: mientras tanto la pantalla se queda
 * EXACTAMENTE igual, sin spinner ni ninguna otra señal.
 *
 * O sea que cualquier cosa que deje ese pedido colgado —Chrome congela las
 * pestañas de fondo y corta los fetch en vuelo, incluidos los prefetch que el
 * router dispara solo por cada tarjeta del directorio— se ve igual que "el
 * click no funcionó". El router queda esperando una promesa que ya nunca va a
 * resolver, y los clicks siguientes se encolan detrás de ella.
 *
 * QUÉ HACE ESTE GUARD
 *
 * No intenta adivinar por qué se colgó: mide. Si un click sobre un link interno
 * pasó por JS y `MS_PARA_RESCATAR` después la URL sigue siendo la misma, se
 * asume que el router no va a contestar y se navega a mano —una navegación de
 * documento, la misma que hace el F5 pero yendo al destino correcto—.
 *
 * Es el mismo criterio que `RecargaTrasDeploy`: hacer automáticamente lo que el
 * usuario terminaría haciendo a mano, en vez de dejarlo golpeando una pantalla
 * muerta.
 */

/**
 * Cuánto se le da al router antes de considerarlo colgado.
 *
 * Medido el 2026-08-19 contra producción: una respuesta RSC tarda entre 0,3 s y
 * 0,75 s. Cuatro segundos son ~5 veces el peor caso sano, así que una navegación
 * lenta de verdad no lo activa. Y si lo activara —red mala, Supabase lento— el
 * costo es una navegación completa en vez de una parcial: se pierde el cache del
 * router, pero el usuario ve moverse el spinner del browser y llega a destino,
 * que es infinitamente mejor que una pantalla que no responde.
 */
const MS_PARA_RESCATAR = 4000;

/** Los datos de un click, sin DOM, para poder decidir (y testear) sin browser. */
export interface ClickDeNavegacion {
  /** `MouseEvent.button`: 0 es el principal. */
  boton: number;
  /** Ctrl / Cmd / Shift / Alt: el browser abre en otra pestaña o ventana. */
  conModificador: boolean;
  /** `defaultPrevented`: alguien (el router) se hizo cargo de la navegación. */
  cancelado: boolean;
  /** `href` ya resuelto a absoluto, o null si el click no fue sobre un ancla. */
  href: string | null;
  /** `target` del ancla. */
  target: string | null;
  /** El ancla tiene `download`. */
  descarga: boolean;
  /** URL completa de la página en el momento del click. */
  urlActual: string;
}

/**
 * Devuelve la URL a la que habría que ir si el router se cuelga, o null si este
 * click no es de los que hay que vigilar.
 *
 * Se descarta todo lo que el browser resuelve solo o lo que no es una
 * navegación de verdad, para no rescatar nada que no esté roto.
 */
export function destinoARescatar(click: ClickDeNavegacion): string | null {
  // Click secundario, o con modificador: lo maneja el browser (nueva pestaña,
  // ventana, descarga). Nunca pasa por el router.
  if (click.boton !== 0 || click.conModificador) return null;

  // Nadie canceló el click: el browser va a navegar por su cuenta. Si el ancla
  // sigue viva, esto funciona aunque React esté muerto — no hay nada que cubrir.
  if (!click.cancelado) return null;

  if (!click.href || click.descarga) return null;
  if (click.target && click.target !== "_self") return null;

  let destino: URL;
  let actual: URL;
  try {
    destino = new URL(click.href);
    actual = new URL(click.urlActual);
  } catch {
    return null;
  }

  // Sólo http(s): `mailto:`, `tel:` y `blob:` no son navegaciones de página.
  if (destino.protocol !== "http:" && destino.protocol !== "https:") return null;

  // Otro dominio: el browser navega solo, el router ni se entera.
  if (destino.origin !== actual.origin) return null;

  // Mismo destino: no hay URL que esperar que cambie, así que el guard no
  // tendría con qué decidir. Entra acá también el clásico `href="#"`.
  if (destino.pathname === actual.pathname && destino.search === actual.search) {
    return null;
  }

  return destino.href;
}

export function GuardiaNavegacion() {
  useEffect(() => {
    /**
     * Rescates armados y todavía sin resolver.
     *
     * Existen para poder desarmarlos TODOS ante un `popstate`. Cuando el
     * usuario toca atrás o adelante deja de ser cierto que "el click quedó sin
     * respuesta": pidió otra cosa, y ese pedido gana. Sin esto, un click
     * seguido de un "atrás" rápido lo devolvía a la ficha de la que acababa de
     * salir cuatro segundos después —medido, no teórico— y se sentía como que
     * el sitio le desobedece.
     *
     * Alcanza con `popstate` porque es lo único que mueve la URL sin pasar por
     * un click: los otros dos caminos (la navegación funcionó, o el usuario se
     * fue a mano) ya los cubre el latido comparando la URL.
     */
    const rescatesArmados = new Set<number>();

    const desarmarTodo = () => {
      rescatesArmados.forEach((id) => window.clearInterval(id));
      rescatesArmados.clear();
    };

    /**
     * En fase de burbujeo y sobre `document`: React delega sus handlers en el
     * contenedor raíz, que está por debajo. Para cuando el evento llega acá, el
     * `<Link>` ya decidió si se hacía cargo, y eso es justamente lo que se lee
     * en `defaultPrevented`.
     */
    const alClickear = (evento: MouseEvent) => {
      const ancla = (evento.target as Element | null)?.closest?.("a[href]") as
        | HTMLAnchorElement
        | null;

      const destino = destinoARescatar({
        boton: evento.button,
        conModificador:
          evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey,
        cancelado: evento.defaultPrevented,
        // `.href` de un ancla ya viene resuelto a absoluto por el DOM.
        href: ancla?.href ?? null,
        target: ancla?.target ?? null,
        descarga: ancla?.hasAttribute("download") ?? false,
        urlActual: window.location.href,
      });

      if (!destino) return;

      // La foto de dónde estábamos. Si sigue igual al vencer el plazo, la
      // navegación nunca llegó a comprometerse.
      const antes = window.location.pathname + window.location.search;
      const vence = Date.now() + MS_PARA_RESCATAR;

      /**
       * Se vigila con un latido y no con un único chequeo al final porque la
       * URL puede irse y VOLVER dentro del plazo (entrás a una ficha y salís
       * enseguida): mirando sólo al vencimiento se vería la misma URL del
       * principio y se leería como que el click nunca funcionó. El latido corta
       * apenas la URL se mueve, así ese viaje de ida y vuelta no dispara nada.
       *
       * No alcanza solo: si la ida todavía no se había comprometido, ningún
       * latido llega a ver la URL distinta. Ese hueco lo tapa el `popstate`.
       */
      const latido = window.setInterval(() => {
        if (window.location.pathname + window.location.search !== antes) {
          // El router contestó, todo bien.
          window.clearInterval(latido);
          rescatesArmados.delete(latido);
          return;
        }
        if (Date.now() < vence) return;

        window.clearInterval(latido);
        rescatesArmados.delete(latido);
        console.warn(
          `[navegacion] el router no respondió en ${MS_PARA_RESCATAR}ms — navegando a ${destino} a mano`
        );
        window.location.assign(destino);
      }, 200);

      rescatesArmados.add(latido);
    };

    document.addEventListener("click", alClickear);
    window.addEventListener("popstate", desarmarTodo);
    return () => {
      document.removeEventListener("click", alClickear);
      window.removeEventListener("popstate", desarmarTodo);
      desarmarTodo();
    };
  }, []);

  return null;
}
