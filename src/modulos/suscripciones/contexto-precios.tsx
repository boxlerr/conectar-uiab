"use client";

import { createContext, useContext, type ReactNode } from "react";
import { PRECIOS_POR_DEFECTO, type Precios } from "@/lib/suscripciones/modelo";

/**
 * El precio vigente para las pantallas que son "use client" de punta a punta
 * (/register, /suscripcion/checkout, /perfil/suscripcion).
 *
 * Lo carga `ConPreciosVigentes` desde el layout de cada una: un page.tsx de
 * cliente no puede leer la base, y un layout no le puede pasar props a la
 * página. Este archivo NO importa ./precios ni nada con "server-only": está en
 * la cadena de componentes de cliente, y en Next 16 esa marca ahí rompe la
 * hidratación sin avisar.
 *
 * Sin proveedor arriba devuelve la constante del código. Es la misma red que
 * usa `leerPrecios()` cuando la base no contesta, no un precio aparte.
 */

const ContextoPrecios = createContext<Precios>(PRECIOS_POR_DEFECTO);

export function ProveedorPrecios({ precios, children }: { precios: Precios; children: ReactNode }) {
  return <ContextoPrecios.Provider value={precios}>{children}</ContextoPrecios.Provider>;
}

export function usePrecios(): Precios {
  return useContext(ContextoPrecios);
}
