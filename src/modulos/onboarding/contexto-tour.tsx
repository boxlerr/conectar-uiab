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
import { usePathname, useRouter } from "next/navigation";
import type { Controls, EventData, Step } from "react-joyride";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { marcarTourVisto, resetearTour } from "./acciones";
import type { TourId } from "./tipos";
import { createClient } from "@/lib/supabase/cliente";
import { crearSlug } from "@/lib/utilidades";

// react-joyride v3 expone `Joyride` como named export y toca el DOM — lo
// cargamos solo del lado cliente.
const Joyride = dynamic(
  () => import("react-joyride").then((m) => m.Joyride),
  { ssr: false }
);

const STATUS_FINISHED = "finished";
const STATUS_SKIPPED = "skipped";

/**
 * Convención: cada step guarda en `data.ruta` el pathname donde vive.
 * El provider, al avanzar o retroceder entre pasos, compara ese path con
 * el `pathname` actual y, si difieren, navega primero y después resume.
 */
export interface PasoData {
  /** Pathname exacto donde el target de este step existe. */
  ruta: string;
}

interface TourContextValue {
  tourActivo: TourId | null;
  iniciarTour: (id: TourId) => Promise<void>;
  terminarTour: () => void;
  tourVisto: (id: TourId) => boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

import { pasosPerfil } from "./pasos/pasos-perfil";
import { pasosDirectorio } from "./pasos/pasos-directorio";
import { pasosOportunidades } from "./pasos/pasos-oportunidades";

const CATALOGO_PASOS: Record<TourId, Step[]> = {
  pago_pendiente: [],
  perfil: pasosPerfil,
  directorio: pasosDirectorio,
  oportunidades: pasosOportunidades,
  dashboard: [],
};

interface TourProviderProps {
  children: ReactNode;
}

/**
 * Sentinel que usamos en pasos-directorio para referirse a la ficha de una
 * empresa de muestra. El provider lo reemplaza por el slug real al navegar.
 */
const SENTINEL_EMPRESA_MUESTRA = "__SLUG__";
const SENTINEL_OP_MUESTRA = "__OP_ID__";

export function TourProvider({ children }: TourProviderProps) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [tourActivo, setTourActivo] = useState<TourId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  // Slug de una empresa aprobada, usado para navegar a una ficha real durante
  // el tour del directorio. Se precarga la primera vez que el usuario está
  // autenticado para que /empresas/__SLUG__ se pueda resolver al vuelo.
  const [slugMuestra, setSlugMuestra] = useState<string | null>(null);
  // Id de una oportunidad abierta, usado para navegar a una ficha real durante
  // el tour de oportunidades.
  const [opMuestra, setOpMuestra] = useState<string | null>(null);
  // `corriendo` false = tour pausado (por ejemplo, esperando que termine
  // una navegación). `tourActivo` no-nulo = seguimos en un tour, aunque
  // esté pausado mid-navegación.
  const [corriendo, setCorriendo] = useState(false);

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

  // Precarga el slug de una empresa aprobada apenas el user está autenticado,
  // para que el tour del directorio pueda navegar a una ficha real.
  useEffect(() => {
    if (!currentUser || slugMuestra) return;
    const supabase = createClient();
    let cancelado = false;
    (async () => {
      const { data } = await supabase
        .from("empresas")
        .select("razon_social")
        .eq("estado", "aprobada")
        .order("razon_social", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!cancelado && data?.razon_social) {
        setSlugMuestra(crearSlug(data.razon_social));
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [currentUser, slugMuestra]);

  // Precarga el id de una oportunidad abierta para el tour de oportunidades.
  useEffect(() => {
    if (!currentUser || opMuestra) return;
    const supabase = createClient();
    let cancelado = false;
    (async () => {
      const { data } = await supabase
        .from("oportunidades")
        .select("id")
        .eq("estado", "abierta")
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelado && data?.id) {
        setOpMuestra(data.id);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [currentUser, opMuestra]);

  // Reemplaza sentinels en la ruta declarada de un paso.
  const resolverRuta = useCallback(
    (ruta: string | undefined): string | undefined => {
      if (!ruta) return ruta;
      let r = ruta;
      if (r.includes(SENTINEL_EMPRESA_MUESTRA) && slugMuestra) {
        r = r.replace(SENTINEL_EMPRESA_MUESTRA, slugMuestra);
      }
      if (r.includes(SENTINEL_OP_MUESTRA) && opMuestra) {
        r = r.replace(SENTINEL_OP_MUESTRA, opMuestra);
      }
      return r;
    },
    [slugMuestra, opMuestra]
  );

  const pasos = useMemo(
    () => (tourActivo ? CATALOGO_PASOS[tourActivo] : []),
    [tourActivo]
  );

  const iniciarTour = useCallback(
    async (id: TourId) => {
      if (vistosLocal[id]) {
        const res = await resetearTour(id);
        if (res.ok) setVistosLocal(res.tutorialesVistos);
      }
      setTourActivo(id);
      setStepIndex(0);

      // Si el primer paso vive en otra ruta, navegamos primero.
      const pasosNuevos = CATALOGO_PASOS[id];
      const rutaInicial = resolverRuta(
        (pasosNuevos[0]?.data as PasoData | undefined)?.ruta
      );
      if (rutaInicial && rutaInicial !== pathname) {
        setCorriendo(false);
        router.push(rutaInicial);
      } else {
        setCorriendo(true);
      }
    },
    [vistosLocal, pathname, router, resolverRuta]
  );

  const terminarTour = useCallback(() => {
    setCorriendo(false);
    setTimeout(() => {
      setTourActivo(null);
      setStepIndex(0);
    }, 120);
  }, []);

  /**
   * Handler principal de joyride. En v3 `onEvent` recibe `data` + `controls`
   * y se dispara en cada transición (step:before, step:after, tour:end,
   * tour:status, etc.). Nosotros reaccionamos a:
   *   - step:after + action=next/prev → avanzar/retroceder, navegando si hace falta
   *   - tour:end (finished|skipped) → persistir como visto y cerrar
   *   - error:target_not_found → pausar y esperar que aparezca el target
   */
  const handleEvent = useCallback(
    async (data: EventData, _controls: Controls) => {
      const { status, type, action, index } = data;

      // ── Fin del tour ────────────────────────────────────────────────
      const terminado = status === STATUS_FINISHED || status === STATUS_SKIPPED;
      if (terminado || type === "tour:end") {
        const idActual = tourActivo;
        // Primero apagamos `run` manteniendo los steps reales. Joyride usa
        // ese render para hacer fade-out del overlay. Si nuqueamos tourActivo
        // en el mismo tick, el overlay gris queda congelado.
        setCorriendo(false);
        if (idActual) {
          const res = await marcarTourVisto(idActual);
          if (res.ok) setVistosLocal(res.tutorialesVistos);
        }
        setTimeout(() => {
          setTourActivo(null);
          setStepIndex(0);
        }, 120);
        return;
      }

      // ── Avance / retroceso ─────────────────────────────────────────
      // 'step:after' dispara cuando el usuario hizo click en next/prev o
      // cuando el overlay/esc cerraron el paso. Joyride NO incrementa
      // el step por su cuenta en modo controlado: lo hacemos nosotros.
      if (type === "step:after") {
        if (action === "next") {
          const nextIndex = index + 1;
          const nextStep = pasos[nextIndex];
          if (!nextStep) {
            // Último paso. En modo controlado joyride no siempre dispara
            // tour:end solo — limpiamos nosotros para que el overlay se vaya.
            const idActual = tourActivo;
            setCorriendo(false);
            if (idActual) {
              const res = await marcarTourVisto(idActual);
              if (res.ok) setVistosLocal(res.tutorialesVistos);
            }
            setTimeout(() => {
              setTourActivo(null);
              setStepIndex(0);
            }, 120);
            return;
          }
          const rutaSig = resolverRuta(
            (nextStep.data as PasoData | undefined)?.ruta
          );
          setStepIndex(nextIndex);
          if (rutaSig && rutaSig !== pathname) {
            // Pausamos, navegamos, y el efecto de abajo nos va a re-activar
            // cuando el pathname cambie.
            setCorriendo(false);
            router.push(rutaSig);
          }
          return;
        }
        if (action === "prev") {
          const prevIndex = Math.max(0, index - 1);
          const prevStep = pasos[prevIndex];
          const rutaPrev = resolverRuta(
            (prevStep?.data as PasoData | undefined)?.ruta
          );
          setStepIndex(prevIndex);
          if (rutaPrev && rutaPrev !== pathname) {
            setCorriendo(false);
            router.push(rutaPrev);
          }
          return;
        }
      }
    },
    [tourActivo, pasos, pathname, router, resolverRuta]
  );

  // ── Resume post-navegación ─────────────────────────────────────────
  // Cuando el pathname cambia y coincide con la ruta del step actual,
  // re-encendemos el tour. Damos un chiquito delay para que la página
  // termine de pintar los `data-tour="..."`.
  useEffect(() => {
    if (!tourActivo || corriendo) return;
    const stepActual = pasos[stepIndex];
    if (!stepActual) return;
    const rutaEsperada = resolverRuta(
      (stepActual.data as PasoData | undefined)?.ruta
    );
    if (!rutaEsperada || rutaEsperada !== pathname) return;
    const t = setTimeout(() => setCorriendo(true), 450);
    return () => clearTimeout(t);
  }, [pathname, stepIndex, tourActivo, corriendo, pasos, resolverRuta]);

  // ── Auto-trigger por ruta ──────────────────────────────────────────
  // La primera vez que un usuario (no-admin) aterriza en /perfil le
  // disparamos el tour completo. Lo marcamos con un ref por-tour para
  // no loopear si navega entre sub-rutas del perfil.
  const autoTriggerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentUser || tourActivo) return;
    const bucket = decidirTourPorRuta(pathname, currentUser.role);
    if (!bucket) return;
    if (tourVisto(bucket)) return;
    if (autoTriggerRef.current === bucket) return;
    autoTriggerRef.current = bucket;
    const t = setTimeout(() => {
      setTourActivo(bucket);
      setStepIndex(0);
      setCorriendo(true);
    }, 600);
    return () => clearTimeout(t);
  }, [pathname, currentUser, tourActivo, tourVisto]);

  const valor = useMemo<TourContextValue>(
    () => ({ tourActivo, iniciarTour, terminarTour, tourVisto }),
    [tourActivo, iniciarTour, terminarTour, tourVisto]
  );

  // ── Pasos vacíos para cuando no hay tour activo ───────────────────
  // Mantenemos <Joyride> SIEMPRE montado para que pueda limpiar su
  // overlay antes de desmontarse. Si lo desmontamos mientras `run=true`
  // el overlay gris queda congelado en pantalla.
  const pasosMostrar = pasos.length > 0 ? pasos : [
    { target: "body", content: "", data: { ruta: "/" } } as Step,
  ];

  return (
    <TourContext.Provider value={valor}>
      {children}
      <Joyride
        steps={pasosMostrar}
        run={corriendo && (tourActivo !== null)}
        stepIndex={stepIndex}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        // floating-ui shift/flip: el tooltip se reposiciona dentro del
        // viewport en pantallas chicas (13"). Sin esto se corta.
        floatingOptions={{
          shiftOptions: { padding: 12 },
          flipOptions: { padding: 12 },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Listo",
          next: "Siguiente",
          // v3: con `showProgress` activo el botón usa esta clave, no `next`.
          nextWithProgress: "Siguiente ({current}/{total})",
          open: "Abrir diálogo",
          skip: "Saltar tutorial",
        }}
        options={{
          buttons: ["skip", "back", "primary"],
          showProgress: true,
          // FIX scroll: quitamos skipScroll global. Ahora joyride scrollea
          // al target si está fuera del viewport. Los pasos con target=body
          // tienen skipScroll:true en el nivel de Step (ver pasos-perfil.tsx).
          skipScroll: false,
          spotlightPadding: 8,
          spotlightRadius: 8,
          overlayClickAction: false,
          primaryColor: "#2563eb",
          overlayColor: "rgba(25, 28, 30, 0.55)",
          textColor: "#191c1e",
          backgroundColor: "#ffffff",
          zIndex: 10_000,
          // Esperamos hasta 2s a que aparezca un target (por si venimos
          // de una navegación donde el DOM todavía está hidratando).
          targetWaitTimeout: 2000,
        }}
        styles={{
          tooltip: {
            borderRadius: 8,
            padding: 24,
            fontFamily: "var(--font-manrope), var(--font-inter), sans-serif",
            boxShadow:
              "0 16px 32px rgba(25, 28, 30, 0.06), 0 2px 8px rgba(25, 28, 30, 0.04)",
            maxWidth: 400,
          },
          tooltipTitle: {
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.015em",
            marginBottom: 8,
            color: "#191c1e",
            fontFamily: "var(--font-manrope), sans-serif",
          },
          tooltipContent: {
            fontSize: 13,
            lineHeight: 1.6,
            color: "#475569",
            padding: 0,
            fontFamily: "var(--font-inter), sans-serif",
          },
          tooltipFooter: { marginTop: 20 },
          buttonPrimary: {
            borderRadius: 4,
            padding: "9px 16px",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.01em",
            boxShadow: "none",
          },
          buttonBack: {
            color: "#64748b",
            marginRight: 12,
            fontSize: 13,
            fontWeight: 500,
          },
          buttonSkip: {
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 500,
          },
          buttonClose: {
            color: "#94a3b8",
            width: 12,
            height: 12,
            top: 14,
            right: 14,
          },
          spotlight: {
            stroke: "rgba(37, 99, 235, 0.35)",
            strokeWidth: 1,
          },
        }}
      />
    </TourContext.Provider>
  );
}

function decidirTourPorRuta(pathname: string, role: string): TourId | null {
  if (role === "admin") return null;
  // Solo auto-disparamos los tours en las rutas raíz de cada sección, no en
  // sub-rutas — sino se relanzan cada vez que el propio tour navega adentro.
  if (pathname === "/perfil") return "perfil";
  // El directorio vive en /empresas (la ruta /directorio es legacy). Matcheamos
  // exacto para no re-disparar en sub-rutas tipo /empresas/[slug].
  if (pathname === "/empresas") return "directorio";
  if (pathname === "/oportunidades") return "oportunidades";
  return null;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour debe usarse dentro de <TourProvider>");
  return ctx;
}
