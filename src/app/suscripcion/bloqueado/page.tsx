"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";

const MENSAJES: Record<string, { titulo: string; descripcion: string }> = {
  suspendida: {
    titulo: "Tu acceso está suspendido",
    descripcion: "No recibimos tu pago a tiempo. Regularizá tu suscripción para volver a aparecer en el directorio.",
  },
  cancelada: {
    titulo: "Tu suscripción está cancelada",
    descripcion: "Reactivá tu suscripción para recuperar el acceso a UIAB Conecta.",
  },
  pendiente_pago: {
    titulo: "Completá tu suscripción",
    descripcion: "Tu perfil se activa cuando completes el primer pago.",
  },
  default: {
    titulo: "Suscripción no activa",
    descripcion: "Para acceder a esta sección necesitás tener una suscripción al día.",
  },
};

export default function BloqueadoPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [estado, setEstado] = useState<string>("default");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser?.entityId) return;
    const fk = currentUser.role === "company" ? "empresa_id" : "proveedor_id";
    supabase
      .from("suscripciones")
      .select("estado")
      .eq(fk, currentUser.entityId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: { estado: string } | null }) => {
        setEstado(data?.estado || "default");
        setCargando(false);
      });
  }, [authLoading, currentUser, supabase]);

  const msg = MENSAJES[estado] || MENSAJES.default;

  if (authLoading || cargando) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Card className="p-10 text-center shadow-lg border-slate-100">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 text-rose-700 mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{msg.titulo}</h1>
        <p className="text-slate-600 mb-8">{msg.descripcion}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => router.push("/suscripcion/checkout")}>
            Regularizar ahora
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/perfil/suscripcion")}>
            Ver detalle
          </Button>
        </div>
      </Card>
    </div>
  );
}
