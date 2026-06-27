"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/cliente";

const KEY_RECORDAR = "uiab_recordar";
const KEY_LAST_SEEN = "uiab_last_seen";
// Si el usuario eligió NO recordar la sesión, la cerramos cuando el navegador
// estuvo cerrado/inactivo más de este tiempo. Compartimos el "latido" entre
// pestañas vía localStorage, así abrir una pestaña nueva no cierra la sesión.
const MAX_INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Implementa "Recordar sesión":
 *  - Recordar ON (default): Supabase mantiene la sesión en cookies (persistente).
 *  - Recordar OFF: si pasaron >30 min sin actividad (navegador cerrado), al
 *    volver se cierra la sesión y se redirige al login.
 * Se monta una vez en el AppShell.
 */
export function RecordarSesionGuard() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const noRecordar = () => localStorage.getItem(KEY_RECORDAR) === "0";
    const tocar = () => localStorage.setItem(KEY_LAST_SEEN, String(Date.now()));

    async function chequear() {
      if (!noRecordar()) {
        tocar();
        return;
      }
      const last = Number(localStorage.getItem(KEY_LAST_SEEN) || 0);
      const vencido = last > 0 && Date.now() - last > MAX_INACTIVIDAD_MS;
      if (vencido) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.signOut();
          localStorage.removeItem(KEY_LAST_SEEN);
          router.push("/login?expirado=1");
          router.refresh();
          return;
        }
      }
      tocar();
    }

    chequear();
    const interval = setInterval(tocar, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") chequear();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tocar);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tocar);
    };
  }, [router]);

  return null;
}
