/**
 * Lectura de las visitas para el panel de control.
 *
 * VA CON SERVICE ROLE, Y NO ES UNA PREFERENCIA
 *
 * `visitas_perfil` tiene RLS habilitado y CERO políticas
 * (`supabase/migrations/20260627_visitas_perfil.sql:26`). Con la publishable
 * key la consulta no falla: devuelve `[]` con HTTP 200. O sea que hacerla con
 * el cliente de sesión pinta "0 visitas" sin ninguna señal de que algo anda
 * mal — el modo de falla más caro que hay. Por eso acá va `createAdminClient`,
 * que además lleva el timeout de 8s que el módulo de acciones no tiene.
 *
 * NO importar desde un Client Component.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calcularEstadisticasVisitas,
  estadisticasVacias,
  VENTANA_DIAS,
  type EstadisticasVisitas,
  type FilaVisita,
} from "./estadisticas";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Estadísticas de visitas de una entidad ya resuelta.
 *
 * Recibe el `entidadId` en vez de volver a buscarlo: el panel ya lo resolvió
 * con `resolverEntidadDePerfil` y repetir la consulta de membresía sería un
 * viaje de ida y vuelta de más en la ruta más pesada del sitio.
 *
 * Nunca lanza: si la base se cae, el panel muestra el estado vacío en lugar de
 * un 500. Es una tarjeta de métricas, no el contenido principal.
 */
export async function estadisticasDeVisitas(
  tipo: "company" | "provider",
  entidadId: string
): Promise<EstadisticasVisitas> {
  try {
    const col = tipo === "company" ? "empresa_id" : "proveedor_id";
    const db = createAdminClient();
    // Se traen 60 días para poder comparar la ventana con la anterior.
    const desde = new Date(Date.now() - 2 * VENTANA_DIAS * MS_POR_DIA).toISOString();

    const [{ data: filas }, { count: total }] = await Promise.all([
      db
        .from("visitas_perfil")
        .select("creado_en, visitante_perfil_id")
        .eq(col, entidadId)
        .gte("creado_en", desde)
        .order("creado_en", { ascending: true }),
      // El total es histórico, así que sale de un count con `head` y no de las
      // filas traídas: la ventana de 60 días no lo contiene.
      db.from("visitas_perfil").select("*", { count: "exact", head: true }).eq(col, entidadId),
    ]);

    return calcularEstadisticasVisitas((filas as FilaVisita[] | null) ?? [], total ?? 0);
  } catch {
    return estadisticasVacias();
  }
}
