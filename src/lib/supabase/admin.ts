import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con Service Role Key para operaciones de servidor
 * que necesiten saltear RLS (webhooks, cron, register-sync, etc.).
 *
 * NO importar desde Client Components — no se envía al browser.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no configurado");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurado");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
