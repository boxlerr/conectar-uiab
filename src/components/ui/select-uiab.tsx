"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/**
 * Select branded UIAB — reemplazo del `<select>` nativo (que muestra el menú
 * gris del sistema operativo) por un combobox hecho a mano, con el mismo estilo
 * que los inputs de la casa.
 *
 * Sigue el patrón de `selector-etiquetas.tsx`: botón trigger + panel listbox,
 * cierre por click-afuera/Escape, navegación con flechas/Home/End/Enter,
 * `aria-activedescendant`, `role=listbox/option`. Sin dependencias nuevas
 * (nada de Radix): el caso es chico y el proyecto no las tiene.
 *
 * Claves de diseño:
 *  - El panel se renderiza con un portal a `document.body` y posición `fixed`
 *    calculada desde el trigger. Así NUNCA lo recorta un contenedor con
 *    `overflow-hidden` (modales) ni `overflow-auto` (tablas), igual que haría un
 *    `<select>` nativo. Se voltea hacia arriba si no hay lugar abajo.
 *  - Para formularios: si viene `name`, se renderiza un `<input type="hidden">`
 *    para que `FormData` siga leyendo el valor igual que con `<select name>`.
 *  - Soporta uso controlado (`value` + `onValueChange`) y uso "no controlado con
 *    name" (`defaultValue` + estado interno).
 *  - Acepta opciones planas o agrupadas (`{ label, options }`), para mapear los
 *    `<optgroup>` que ya existen (p.ej. las normas de certificaciones).
 */

export type OpcionSelect = { value: string; label: string; disabled?: boolean };
export type GrupoSelect = { label: string; options: readonly OpcionSelect[] };
export type ItemsSelect = readonly OpcionSelect[] | readonly GrupoSelect[];

function cn(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

function esGrupo(item: OpcionSelect | GrupoSelect): item is GrupoSelect {
  return Array.isArray((item as GrupoSelect).options);
}

function normalizarGrupos(options: ItemsSelect): GrupoSelect[] {
  if (options.length === 0) return [];
  if (esGrupo(options[0])) return options as GrupoSelect[];
  return [{ label: "", options: options as readonly OpcionSelect[] }];
}

type Coords = { left: number; width: number; top: number; bottom: number; abajo: boolean };

const MAX_ALTO_PANEL = 288; // ~ max-h-72

export function SelectUIAB({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Seleccioná…",
  name,
  id,
  required,
  disabled,
  className,
  ariaLabel,
  ariaLabelledby,
}: {
  /** Uso controlado. Si se pasa, el padre manda el valor. */
  value?: string;
  /** Uso no controlado (con o sin `name`). Valor inicial del estado interno. */
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  options: ItemsSelect;
  placeholder?: string;
  /** Si viene, se emite un hidden input para que FormData lea el valor. */
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  /** Clases del botón trigger: mismo lugar donde iban las clases del `<select>`. */
  className?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const controlado = value !== undefined;
  const [interno, setInterno] = useState(defaultValue ?? "");
  const actual = controlado ? (value as string) : interno;

  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [montado, setMontado] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const cajaRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMontado(true), []);

  const grupos = useMemo(() => normalizarGrupos(options), [options]);

  // Grupos para render + índice plano para navegar con las flechas (cada opción
  // lleva su `idx` global; nada de indexOf() dentro del render).
  const { grupoRender, planas } = useMemo(() => {
    const planas: OpcionSelect[] = [];
    const grupoRender = grupos.map((g) => ({
      label: g.label,
      opciones: g.options.map((o) => ({ ...o, idx: planas.push(o) - 1 })),
    }));
    return { grupoRender, planas };
  }, [grupos]);

  const seleccionada = useMemo(
    () => planas.find((o) => o.value === actual) ?? null,
    [planas, actual]
  );

  const elegir = useCallback(
    (v: string) => {
      if (!controlado) setInterno(v);
      onValueChange?.(v);
      setAbierto(false);
    },
    [controlado, onValueChange]
  );

  const recalcular = useCallback(() => {
    const el = cajaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - r.bottom;
    // Abrimos hacia abajo salvo que no entre y arriba haya más lugar.
    const abajo = espacioAbajo >= Math.min(MAX_ALTO_PANEL, 240) || espacioAbajo >= r.top;
    setCoords({ left: r.left, width: r.width, top: r.top, bottom: r.bottom, abajo });
  }, []);

  // Posición del panel: recalcular al abrir y ante scroll/resize (capture=true
  // para atrapar el scroll de contenedores anidados, p.ej. una tabla).
  useEffect(() => {
    if (!abierto) return;
    recalcular();
    const onMove = () => recalcular();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [abierto, recalcular]);

  // Cerrar al clickear afuera (el trigger y el panel portaleado cuentan como "adentro").
  useEffect(() => {
    if (!abierto) return;
    function alBajar(ev: MouseEvent) {
      const t = ev.target as Node;
      if (cajaRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setAbierto(false);
    }
    document.addEventListener("mousedown", alBajar);
    return () => document.removeEventListener("mousedown", alBajar);
  }, [abierto]);

  // Mantener a la vista la opción resaltada por teclado.
  useEffect(() => {
    if (!abierto || activo < 0) return;
    listaRef.current
      ?.querySelector(`[data-idx="${activo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activo, abierto]);

  /** Próximo índice navegable en la dirección dada, salteando deshabilitadas. */
  function siguiente(desde: number, dir: 1 | -1): number {
    let i = desde;
    while (true) {
      const j = i + dir;
      if (j < 0 || j >= planas.length) {
        return i >= 0 && i < planas.length && !planas[i]?.disabled ? i : desde;
      }
      i = j;
      if (!planas[i].disabled) return i;
    }
  }

  function abrir() {
    if (disabled) return;
    const idxSel = seleccionada ? planas.findIndex((o) => o.value === seleccionada.value) : -1;
    setActivo(idxSel >= 0 && !planas[idxSel]?.disabled ? idxSel : -1);
    setAbierto(true);
  }

  function manejarTeclas(ev: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();
        if (!abierto) return abrir();
        setActivo((i) => siguiente(i, 1));
        break;
      case "ArrowUp":
        ev.preventDefault();
        if (!abierto) return abrir();
        setActivo((i) => siguiente(i < 0 ? planas.length : i, -1));
        break;
      case "Home":
        if (!abierto) break;
        ev.preventDefault();
        setActivo(siguiente(-1, 1));
        break;
      case "End":
        if (!abierto) break;
        ev.preventDefault();
        setActivo(siguiente(planas.length, -1));
        break;
      case "Enter":
      case " ":
        ev.preventDefault();
        if (!abierto) return abrir();
        if (activo >= 0 && planas[activo] && !planas[activo].disabled) {
          elegir(planas[activo].value);
        }
        break;
      case "Escape":
        if (abierto) {
          ev.stopPropagation();
          setAbierto(false);
        }
        break;
      case "Tab":
        setAbierto(false);
        break;
    }
  }

  const panel =
    abierto && montado && coords
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
              ...(coords.abajo
                ? { top: coords.bottom + 4 }
                : { bottom: window.innerHeight - coords.top + 4 }),
            }}
          >
            <div
              ref={listaRef}
              id={`${uid}-listbox`}
              role="listbox"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledby}
              className="max-h-72 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-[0_16px_40px_-12px_rgba(0,33,63,0.28)] dark:border-slate-700 dark:bg-slate-800"
            >
              {planas.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">
                  Sin opciones
                </div>
              ) : (
                grupoRender.map((g, gi) => (
                  <div
                    key={gi}
                    role="group"
                    aria-labelledby={g.label ? `${uid}-grp-${gi}` : undefined}
                  >
                    {g.label && (
                      <div
                        id={`${uid}-grp-${gi}`}
                        role="presentation"
                        className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95"
                      >
                        {g.label}
                      </div>
                    )}
                    {g.opciones.map((o) => {
                      const elegida = o.value === actual;
                      const act = o.idx === activo;
                      return (
                        <div
                          key={`${o.value}-${o.idx}`}
                          id={`${uid}-opt-${o.idx}`}
                          data-idx={o.idx}
                          role="option"
                          aria-selected={elegida}
                          aria-disabled={o.disabled || undefined}
                          // Sin esto el mousedown blurea el trigger antes del click.
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => !o.disabled && elegir(o.value)}
                          onMouseEnter={() => !o.disabled && setActivo(o.idx)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                            o.disabled
                              ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                              : "cursor-pointer",
                            act && !o.disabled && "bg-primary-50 dark:bg-slate-700/60",
                            elegida
                              ? "font-semibold text-primary-700 dark:text-white"
                              : !o.disabled && "text-slate-700 dark:text-slate-200"
                          )}
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            {elegida && (
                              <Check
                                className="h-4 w-4 text-primary-600 dark:text-blue-300"
                                strokeWidth={3}
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <span className="truncate">{o.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={cajaRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? `${uid}-listbox` : undefined}
        aria-activedescendant={abierto && activo >= 0 ? `${uid}-opt-${activo}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={manejarTeclas}
        className={cn(
          "inline-flex items-center justify-between gap-2 text-left transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        <span
          className={cn(
            "truncate",
            !seleccionada && "font-normal text-slate-400 dark:text-slate-500"
          )}
        >
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            abierto && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {name && <input type="hidden" name={name} value={actual} />}

      {panel}
    </>
  );
}
