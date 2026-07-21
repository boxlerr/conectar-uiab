"use client";

// Variante del aviso que se trae sus propios datos. Para páginas que ya son
// client components y no pueden leer `altas_socios` desde el browser (RLS
// deny-by-default). En el dashboard, que es server component, se usa
// <AvisoConflictosPadron> directo con props.

import { useEffect, useState } from "react";
import type { ConflictoPadron } from "../padron";
import { obtenerConflictosPendientes } from "../conflictos";
import { AvisoConflictosPadron } from "./aviso-conflictos-padron";

export function AvisoConflictosPadronAuto({ onResuelto }: { onResuelto?: () => void }) {
  const [conflictos, setConflictos] = useState<ConflictoPadron[]>([]);

  useEffect(() => {
    let cancelado = false;
    obtenerConflictosPendientes()
      .then((c) => {
        if (!cancelado) setConflictos(c);
      })
      .catch(() => {
        /* sin aviso es mejor que romper la página de datos */
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (conflictos.length === 0) return null;
  return <AvisoConflictosPadron conflictos={conflictos} onResuelto={onResuelto} />;
}
