"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

/**
 * Adónde vuelve el socio después de pagar en el checkout de Sipago.
 *
 * La página no cree en el `?ref=ok` de la URL: eso lo pone Sipago en el redirect
 * y cualquiera puede escribirlo a mano. Sólo sirve para elegir el mensaje
 * mientras se consulta. Quien decide si el pago existe es el servidor, en
 * /api/suscripcion/estado-orden, que se lo pregunta a Sipago.
 *
 * Se consulta varias veces porque la acreditación no siempre es instantánea:
 * entre que el socio vuelve y que Sipago da la orden por SUCCESS pueden pasar
 * unos segundos.
 */

const INTENTOS = 6;
const ESPERA_MS = 2500;

type Estado = "consultando" | "acreditado" | "adhesion" | "pendiente" | "rechazado" | "fallido" | "sin_pasarela";

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      }
    >
      <Resultado />
    </Suspense>
  );
}

function Resultado() {
  const router = useRouter();
  const params = useSearchParams();
  const volvioMal = params.get("ref") === "fallo";

  const [estado, setEstado] = useState<Estado>("consultando");
  const [motivo, setMotivo] = useState<string | null>(null);
  const intentos = useRef(0);

  const consultar = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/suscripcion/estado-orden", { cache: "no-store" });

      // Sin sesión no hay nada que consultar. Sin este corte, el que abre el
      // link desde otro navegador —o al que se le venció la cookie mientras
      // pagaba— se comía quince segundos de spinner para terminar en un
      // "tu pago se está acreditando" que no significaba nada.
      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/suscripcion/resultado")}`);
        return true;
      }

      const data = await res.json();
      if (!res.ok) return false;

      // La suscripción activa manda sobre el estado de la orden: puede haberla
      // acreditado el webhook antes de que el socio volviera, o puede tratarse
      // de un pago manual que el admin cargó mientras tanto.
      if (data.estadoSuscripcion === "activa") {
        setEstado("acreditado");
        return true;
      }
      if (data.orden === "acreditado") {
        setEstado("acreditado");
        return true;
      }
      // Rechazo con reintento posible: la tarjeta no pasó pero el link sigue
      // vivo. Es distinto de "fallido" —ahí ya no hay nada que hacer con esa
      // orden— y sobre todo es distinto de "pendiente", que era lo que se le
      // mostraba antes a alguien a quien le acababan de rechazar la tarjeta.
      if (data.orden === "rechazado") {
        setMotivo(data.motivo ?? null);
        setEstado("rechazado");
        return true;
      }
      if (data.orden === "fallido") {
        setMotivo(data.motivo ?? null);
        setEstado("fallido");
        return true;
      }
      if (data.orden === "adhesion") {
        setEstado("adhesion");
        return true;
      }
      if (data.orden === null) {
        setEstado("sin_pasarela");
        return true;
      }
      return false; // pendiente o indeterminado: vale reintentar
    } catch {
      return false;
    }
  }, [router]);

  useEffect(() => {
    let cancelado = false;
    let temporizador: ReturnType<typeof setTimeout>;

    async function ciclo() {
      if (cancelado) return;
      const listo = await consultar();
      if (cancelado || listo) return;

      intentos.current += 1;
      if (intentos.current >= INTENTOS) {
        // Se agotaron los reintentos sin novedad. No es un fracaso: el webhook
        // sigue vivo y el socio va a recibir el mail cuando acredite.
        setEstado(volvioMal ? "fallido" : "pendiente");
        return;
      }
      temporizador = setTimeout(ciclo, ESPERA_MS);
    }

    ciclo();
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consultar, volvioMal]);

  const contenido = {
    consultando: {
      icono: <Loader2 className="w-7 h-7 animate-spin" />,
      color: "bg-slate-100 text-slate-600",
      titulo: "Estamos confirmando tu pago",
      texto: "Un momento, se lo estamos preguntando a Sipago.",
    },
    acreditado: {
      icono: <CheckCircle2 className="w-7 h-7" />,
      color: "bg-emerald-100 text-emerald-700",
      titulo: "¡Listo! Tu suscripción está activa",
      texto: "Acreditamos el pago y te mandamos el comprobante por mail.",
    },
    adhesion: {
      icono: <Clock className="w-7 h-7" />,
      color: "bg-sky-100 text-sky-700",
      titulo: "Ya está, tu tarjeta quedó adherida",
      texto:
        "Sipago te va a cobrar automáticamente. En cuanto entre el primer débito la UIAB lo registra y tu suscripción queda activa — puede tardar un par de días hábiles.",
    },
    pendiente: {
      icono: <Clock className="w-7 h-7" />,
      color: "bg-amber-100 text-amber-700",
      titulo: "Tu pago todavía se está acreditando",
      texto:
        "Sipago aún no lo confirmó. No hace falta que pagues de nuevo: apenas acredite te llega el mail y tu suscripción queda activa.",
    },
    rechazado: {
      icono: <AlertCircle className="w-7 h-7" />,
      color: "bg-rose-100 text-rose-700",
      titulo: "Tu tarjeta fue rechazada",
      texto: `${motivo || "El emisor rechazó el pago."} No se te cobró nada. Podés probar con otra tarjeta.`,
    },
    fallido: {
      icono: <AlertCircle className="w-7 h-7" />,
      color: "bg-rose-100 text-rose-700",
      titulo: "No pudimos completar el pago",
      texto: motivo || "El pago no se completó. Podés volver a intentarlo cuando quieras.",
    },
    sin_pasarela: {
      icono: <Clock className="w-7 h-7" />,
      color: "bg-slate-100 text-slate-600",
      titulo: "No encontramos un pago en curso",
      texto: "Si ya coordinaste el pago con la UIAB, lo van a registrar desde el panel y tu suscripción se activa sola.",
    },
  }[estado];

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <Card className="p-8 shadow-lg border-slate-100 text-center">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${contenido.color}`}>
          {contenido.icono}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{contenido.titulo}</h1>
        <p className="text-slate-600 mt-3">{contenido.texto}</p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {estado === "acreditado" ? (
            <Button size="lg" onClick={() => router.push("/panel-de-control")}>
              Ir a la plataforma
            </Button>
          ) : estado === "rechazado" || estado === "fallido" ? (
            <Button size="lg" onClick={() => router.push("/suscripcion/checkout")}>
              Intentar de nuevo
            </Button>
          ) : null}

          {estado === "adhesion" && (
            <Button size="lg" onClick={() => router.push("/panel-de-control")}>
              Ir a la plataforma
            </Button>
          )}

          {estado !== "consultando" && (
            <Button size="lg" variant="outline" onClick={() => router.push("/perfil/suscripcion")}>
              Ver mi suscripción
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
