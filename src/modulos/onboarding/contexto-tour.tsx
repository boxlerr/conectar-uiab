"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { Controls, EventData, Step } from "react-joyride";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { marcarTourVisto, resetearTour } from "./acciones";
import type { TourId } from "./tipos";

// react-joyride usa APIs del DOM — lo cargamos solo del lado cliente.
// v3 exporta `Joyride` como named export, de ahí el `.then(m => m.Joyride)`.
const Joyride = dynamic(
  () => import("react-joyride").then((m) => m.Joyride),
  { ssr: false }
);

// Joyride emite estos status al final del tour (finished = completó, skipped = saltó).
const STATUS_FINISHED = "finished";
const STATUS_SKIPPED = "skipped";

interface TourContextValue {
  /** Tour actualmente visible. `null` = ninguno. */
  tourActivo: TourId | null;
  /** Arranca un tour manualmente. Si ya fue visto, lo resetea y lo vuelve a mostrar. */
  iniciarTour: (id: TourId) => Promise<void>;
  /** Lo termina desde fuera (por ejemplo, desde un CTA "Saltar"). */
  terminarTour: () => void;
  /** Si el usuario ya completó ese tour alguna vez. */
  tourVisto: (id: TourId) => boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

// Catálogo de pasos por tour. Agregamos nuevos tours acá a medida que
// los vayamos armando (directorio, oportunidades, dashboard).
import { pasosPerfil } from "./pasos/pasos-perfil";

const CATALOGO_PASOS: Record<TourId, Step[]> = {
  pago_pendiente: [],
  perfil: pasosPerfil,
  directorio: [],
  oportunidades: [],
  dashboard: [],
};

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [tourActivo, setTourActivo] = useState<TourId | null>(null);
  const [corriendo, setCorriendo] = useState(false);

  // Espejo local del mapa de tours vistos. Lo sincronizamos desde el
  // currentUser y lo actualizamos in-place cuando marcamos uno como
  // visto, sin esperar al refreshUser del AuthProvider (que toca red).
  const [vistosLocal, setVistosLocal] = useState<Record<string, string | null>>(
    () => currentUser?.tutorialesVistos ?? {}
  );
  useEffect(() => {
    setVistosLocal(currentUser?.tutorialesVistos ?? {});
  }, [currentUser?.tutorialesVistos]);

  const tourVisto = useCallback(
    (id: TourId) => Boolean(vistosLocal[id]),
    [vistosLocal]
  );

  const iniciarTour = useCallback(
    async (id: TourId) => {
      // Si ya lo vio, lo reseteamos primero para que sea consistente con
      // el flujo "hice click en Volver a ver tutorial → lo ve completo".
      if (vistosLocal[id]) {
        const res = await resetearTour(id);
        if (res.ok) setVistosLocal(res.tutorialesVistos);
      }
      setTourActivo(id);
      setCorriendo(true);
    },
    [vistosLocal]
  );

  const terminarTour = useCallback(() => {
    setCorriendo(false);
    setTourActivo(null);
  }, []);

  const handleEvent = useCallback(
    async (data: EventData, _controls: Controls) => {
      const { status, type } = data;
      // tour:end dispara tanto al finalizar los pasos como al saltar.
      const terminado = status === STATUS_FINISHED || status === STATUS_SKIPPED;
      if (terminado || type === "tour:end") {
        const idActual = tourActivo;
        setCorriendo(false);
        setTourActivo(null);
        if (idActual) {
          const res = await marcarTourVisto(idActual);
          if (res.ok) setVistosLocal(res.tutorialesVistos);
        }
      }
    },
    [tourActivo]
  );

  const pasos = useMemo(
    () => (tourActivo ? CATALOGO_PASOS[tourActivo] : []),
    [tourActivo]
  );

  // ── Auto-trigger: arrancamos el tour de perfil la primera vez que
  // el usuario (aprobado o no) entra a /perfil. Para directorio,
  // oportunidades y dashboard lo haremos en fase 2.
  const autoTriggerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentUser || tourActivo) return;
    const bucket = decidirTourPorRuta(pathname, currentUser.role);
    if (!bucket) return;
    if (tourVisto(bucket)) return;
    if (autoTriggerRef.current === bucket) return;
    autoTriggerRef.current = bucket;
    // Delay chico para dar tiempo al layout a pintar los targets data-tour.
    const t = setTimeout(() => {
      setTourActivo(bucket);
      setCorriendo(true);
    }, 600);
    return () => clearTimeout(t);
  }, [pathname, currentUser, tourActivo, tourVisto]);

  const valor = useMemo<TourContextValue>(
    () => ({ tourActivo, iniciarTour, terminarTour, tourVisto }),
    [tourActivo, iniciarTour, terminarTour, tourVisto]
  );

  return (
    <TourContext.Provider value={valor}>
      {children}
      {tourActivo && pasos.length > 0 && (
        <Joyride
          steps={pasos}
          run={corriendo}
          continuous
          scrollToFirstStep
          onEvent={handleEvent}
          locale={{
            back: "Atrás",
            close: "Cerrar",
            last: "Listo",
            next: "Siguiente",
            open: "Abrir diálogo",
            skip: "Saltar tutorial",
          }}
          options={{
            // 'skip' + 'back' + 'primary' muestran los 3 botones que queremos.
            buttons: ["skip", "back", "primary"],
            showProgress: true,
            spotlightPadding: 6,
            overlayClickAction: false,
            primaryColor: "#e11d48", // rose-600, alineado con la marca
            overlayColor: "rgba(15, 23, 42, 0.55)", // slate-900/55
            zIndex: 10_000,
            textColor: "#0f172a",
          }}
          styles={{
            tooltip: {
              borderRadius: 16,
              padding: 20,
              fontFamily: "var(--font-manrope)",
            },
            tooltipTitle: { fontWeight: 700, fontSize: 16 },
            tooltipContent: { fontSize: 14, lineHeight: 1.55 },
            buttonPrimary: {
              borderRadius: 10,
              padding: "8px 16px",
              fontWeight: 600,
            },
            buttonBack: { color: "#64748b", marginRight: 8 },
            buttonSkip: { color: "#94a3b8" },
          }}
        />
      )}
    </TourContext.Provider>
  );
}

/**
 * Mapea rutas a tour-id para el auto-trigger. Devolvemos `null` si en esa
 * ruta no arrancamos nada. El tour de pago_pendiente lo dispara el
 * componente de /pendiente-aprobacion directamente (no por ruta).
 */
function decidirTourPorRuta(pathname: string, role: string): TourId | null {
  if (role === "admin") return null;
  if (pathname === "/perfil" || pathname.startsWith("/perfil/")) return "perfil";
  // Placeholders para fase 2.
  // if (pathname.startsWith("/directorio")) return "directorio";
  // if (pathname.startsWith("/oportunidades")) return "oportunidades";
  // if (pathname.startsWith("/dashboard")) return "dashboard";
  return null;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour debe usarse dentro de <TourProvider>");
  return ctx;
}
