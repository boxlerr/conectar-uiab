import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { crearFetchConTimeout, TIMEOUT_SERVIDOR_MS } from "./fetch-con-timeout";

/**
 * Cliente de Supabase con Service Role Key para operaciones de servidor
 * que necesiten saltear RLS (webhooks, cron, register-sync, etc.).
 *
 * NO importar desde Client Components — no se envía al browser.
 *
 * LLEVA TIMEOUT, igual que `cliente.ts`, `servidor.ts` y el del middleware.
 * Era el único de los cuatro que no lo tenía, y no es un cliente de rincón: lo
 * usan la portada, el directorio, las fichas públicas y /panel-de-control. El
 * 2026-08-15, con el Postgres de producción caído, la home tardaba 20 segundos
 * en responder porque esperaba sin tope por el marquee de logos — una consulta
 * decorativa que ya tenía su `catch` devolviendo `[]` y que, con timeout,
 * hubiera degradado sola en 8s sin que el visitante notara nada.
 */
export function createAdminClient(opciones?: {
  /**
   * Tope por llamada. Sólo para operaciones deliberadamente pesadas (importar
   * el padrón, exportar planillas) donde 8s puede quedar corto y el que espera
   * es un admin mirando un spinner, no un visitante.
   */
  timeoutMs?: number;
}): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no configurado");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurado");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: crearFetchConTimeout({ timeoutMs: opciones?.timeoutMs ?? TIMEOUT_SERVIDOR_MS }),
    },
  });
}
