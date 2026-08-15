"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import type { User } from "@/tipos";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import { marcarNovedadVista } from "./acciones";
import { novedadesPendientes, type NovedadId } from "./novedades";
import type { PropsNovedad } from "./pie-novedad";
import { ModalNovedadUsuarios } from "./modal-novedad-usuarios";
import { ModalNovedadPerfil } from "./modal-novedad-perfil";
import { ModalNovedadOportunidades } from "./modal-novedad-oportunidades";

/**
 * Pila de novedades: los carteles pendientes, de a uno y en orden.
 *
 * EL PROBLEMA QUE ARREGLA
 *
 * Cada cartel se mostraba solo y `novedadPendiente` elegía UNO: al que le
 * tocaban dos veía el más nuevo y el otro le quedaba para "la próxima". Esa
 * próxima muchas veces no llegaba, y encima el segundo cartel hablaba de algo
 * que ya llevaba días publicado.
 *
 * Ahora se recorren todos en la misma sesión con Siguiente / Atrás. Se marca
 * como visto el que se está dejando —en cualquiera de las dos direcciones—, así
 * que volver atrás a releer no lo hace reaparecer mañana. Lo que quede sin
 * abrir, en cambio, sigue pendiente para el próximo ingreso: cerrar el segundo
 * de tres no da por visto el tercero.
 *
 * LA LISTA NO PUEDE MOVERSE MIENTRAS SE LA RECORRE
 *
 * Marcar la actual como vista y refrescar el perfil la sacaría de la lista en
 * el acto: el cartel se desarmaría abajo del dedo y "Atrás" se quedaría sin
 * destino. Por eso `marcar()` escribe en la base pero NO refresca el contexto
 * — el detalle está abajo, al lado de `pila`.
 */

/** Rutas donde un cartel modal sólo estorba (formularios de acceso). */
const RUTAS_SIN_CARTEL = [
  "/login",
  "/register",
  "/recovery",
  "/restablecer-password",
  "/definir-password",
  "/completar-cuenta",
  "/suscripcion/checkout",
];

/**
 * A quién le corresponde cada cartel, más allá de la fecha.
 *
 * `perfil_directorio` y `usuarios_empresa` hablan de la ficha propia, así que
 * sólo van para quien administra una. La cartelera de oportunidades le sirve
 * tanto a quien publica como a quien responde: esa va para cualquiera.
 */
const REGISTRO: Record<
  NovedadId,
  { aplica: (u: User) => boolean; Componente: React.ComponentType<PropsNovedad> }
> = {
  oportunidades_cartelera: { aplica: () => true, Componente: ModalNovedadOportunidades },
  perfil_directorio: {
    aplica: (u) => Boolean(tipoEntidadDe(u)),
    Componente: ModalNovedadPerfil,
  },
  usuarios_empresa: {
    aplica: (u) => Boolean(tipoEntidadDe(u)),
    Componente: ModalNovedadUsuarios,
  },
};

export function PilaNovedades() {
  const { currentUser } = useAuth();
  const pathname = usePathname();

  const [indice, setIndice] = useState(0);
  const [cerrado, setCerrado] = useState(false);
  const marcadas = useRef(new Set<NovedadId>());

  /**
   * La pila sale del `currentUser` que ya vino del servidor, así que no hay
   * fetch extra ni parpadeo: o está en el primer render o no está.
   *
   * Y se recalcula en cada render, que es exactamente por lo que `marcar()` NO
   * llama a `refreshUser()`: si el contexto se enterara de que la novedad quedó
   * vista, la lista se recortaría sola y el cartel se desarmaría en la mitad
   * del recorrido — "Atrás" se quedaría sin destino. El mapa de vistos del
   * contexto queda viejo sólo dentro de esta sesión, y no lo mira nadie más;
   * en la próxima carga baja al día desde el servidor.
   */
  const pila = currentUser
    ? novedadesPendientes(currentUser).filter((id) => REGISTRO[id].aplica(currentUser))
    : [];

  if (!currentUser || cerrado || pila.length === 0) return null;
  if (RUTAS_SIN_CARTEL.some((r) => pathname.startsWith(r))) return null;

  const actual = pila[indice];
  if (!actual) return null;

  /** Marca una novedad como vista. Idempotente: el usuario puede ir y volver. */
  async function marcar(id: NovedadId) {
    if (marcadas.current.has(id)) return;
    marcadas.current.add(id);
    const r = await llamarAccion(() => marcarNovedadVista(id));
    // A propósito no se refresca el perfil del contexto: ver el comentario de
    // `pila`. Si la escritura falla, el cartel vuelve en el próximo ingreso,
    // que es preferible a darlo por visto sin haberlo guardado.
    if (fallo(r)) console.warn("No se pudo marcar la novedad como vista:", id);
  }

  const { Componente } = REGISTRO[actual];

  return (
    <Componente
      paso={indice + 1}
      total={pila.length}
      onAtras={
        indice > 0
          ? () => {
              marcar(actual);
              setIndice((i) => i - 1);
            }
          : undefined
      }
      onSiguiente={
        indice < pila.length - 1
          ? () => {
              marcar(actual);
              setIndice((i) => i + 1);
            }
          : undefined
      }
      onCerrar={() => {
        marcar(actual);
        setCerrado(true);
      }}
    />
  );
}
