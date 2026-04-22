"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { Loader2 } from "lucide-react";
import { AccesoRequerido, type EstadoAcceso } from "@/components/ui/acceso-requerido";

function resolverEstado(
  subEstado: string | null,
  isMember: boolean,
): EstadoAcceso {
  if (!subEstado) return "sin_suscripcion";
  if (subEstado === "activa" && !isMember) return "pendiente_revision";
  if (subEstado === "pendiente_pago") return "pendiente_pago";
  if (subEstado === "en_mora") return "en_mora";
  if (subEstado === "suspendida") return "suspendida";
  if (subEstado === "cancelada") return "cancelada";
  return "sin_suscripcion";
}

export default function BloqueadoPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [subEstado, setSubEstado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser?.entityId) {
      setCargando(false);
      return;
    }
    const fk = currentUser.role === "company" ? "empresa_id" : "proveedor_id";
    supabase
      .from("suscripciones")
      .select("estado")
      .eq(fk, currentUser.entityId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: { estado: string } | null }) => {
        setSubEstado(data?.estado ?? null);
        setCargando(false);
      });
  }, [authLoading, currentUser]);

  if (authLoading || cargando) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-[#00213f]" />
      </div>
    );
  }

  const estado = resolverEstado(subEstado, currentUser?.isMember ?? false);

  return (
    <AccesoRequerido
      estado={estado}
      className="min-h-[calc(100vh-5rem)]"
    />
  );
}
