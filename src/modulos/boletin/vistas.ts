import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lectura y escritura de las vistas de las notas del Boletín.
 *
 * VA CON SERVICE ROLE, Y NO ES UNA PREFERENCIA: `vistas_comunicado` tiene RLS
 * sin políticas (`supabase/migrations/20261015_boletin_vistas.sql`). Con la
 * publishable key la consulta no falla: devuelve 0 filas con HTTP 200, o sea
 * "0 vistas" sin ninguna señal de que está mal. La misma trampa que
 * `visitas_perfil`.
 *
 * El número es SÓLO para admins. Quien llame a estas funciones tiene que haber
 * confirmado el rol en el servidor antes: lo que devuelvan va a parar al HTML
 * o al RSC de quien esté mirando.
 *
 * Ninguna lanza. Si la base no contesta, la lectura devuelve `null` y la
 * pantalla no muestra nada — nunca un "0" que nadie midió.
 */

export async function contarVistasDeNota(comunicadoId: string): Promise<number | null> {
  try {
    const db = createAdminClient();
    const { count, error } = await db
      .from("vistas_comunicado")
      .select("*", { count: "exact", head: true })
      .eq("comunicado_id", comunicadoId);
    if (error) {
      console.error("[boletin] no se pudieron contar las vistas:", error.message);
      return null;
    }
    return count ?? 0;
  } catch {
    return null;
  }
}

/** `{ [comunicado_id]: vistas }` de todas las notas, para el listado del panel. */
export async function vistasPorComunicado(): Promise<Record<string, number> | null> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("vistas_por_comunicado");
    if (error) {
      console.error("[boletin] no se pudieron leer las vistas:", error.message);
      return null;
    }
    const mapa: Record<string, number> = {};
    for (const fila of (data ?? []) as { comunicado_id: string; vistas: number | string }[]) {
      mapa[fila.comunicado_id] = Number(fila.vistas);
    }
    return mapa;
  } catch {
    return null;
  }
}

/**
 * Anota una vista. El dedup lo hace la clave primaria (nota, día, visitante):
 * la segunda del día choca y se ignora, sin leer antes.
 */
export async function registrarVistaDeNota(fila: {
  comunicadoId: string;
  dia: string;
  visitante: string;
  conSesion: boolean;
}): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db.from("vistas_comunicado").upsert(
      {
        comunicado_id: fila.comunicadoId,
        dia: fila.dia,
        visitante: fila.visitante,
        con_sesion: fila.conSesion,
      },
      { onConflict: "comunicado_id,dia,visitante", ignoreDuplicates: true }
    );
    // 23503 = la nota no existe (o se borró): no es un error del sistema.
    if (error && error.code !== "23503") {
      console.error("[boletin] no se pudo registrar la vista:", error.message);
    }
  } catch {
    // Best-effort: una vista que no se anota no puede romper nada.
  }
}
