"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  TIPO_TAG_LABELS,
  TIPO_TAG_ORDEN,
  normalizarTexto,
  type TagOption,
} from "@/modulos/compartido/etiquetas";

/**
 * Combobox multi-selección para el catálogo de etiquetas (~140 filas).
 *
 * Escribís y la lista se filtra; el panel agrupa por tipo de etiqueta y las
 * elegidas quedan como chips arriba del buscador. La selección vive en el
 * padre (un `Set` de uuids) porque quien publica es el formulario, no esto.
 *
 * Patrón ARIA combobox + listbox: el foco NUNCA sale del input, la opción
 * activa se comunica con `aria-activedescendant`. Sin Radix ni cmdk: no están
 * en el proyecto y el caso es chico.
 */
export function SelectorEtiquetas({
  tags,
  seleccionados,
  onToggle,
  onLimpiar,
  etiquetaCampo = "Etiquetas para el match",
  sugerido = 5,
}: {
  tags: TagOption[];
  /** uuids de `tags.id`. */
  seleccionados: Set<string>;
  onToggle: (id: string) => void;
  onLimpiar: () => void;
  etiquetaCampo?: string;
  sugerido?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(-1);
  /** Chip "en la mira" del Backspace: se borra recién en la segunda pulsación. */
  const [armada, setArmada] = useState<string | null>(null);

  const cajaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const porId = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  // Grupos visibles + índice plano para navegar con las flechas, en un solo
  // memo: nada de indexOf() dentro del render.
  const { grupos, planas } = useMemo(() => {
    const q = normalizarTexto(consulta.trim());
    const porTipo = new Map<string, TagOption[]>();

    for (const tag of tags) {
      if (q && !normalizarTexto(tag.nombre).includes(q)) continue;
      const arr = porTipo.get(tag.tipo_tag);
      if (arr) arr.push(tag);
      else porTipo.set(tag.tipo_tag, [tag]);
    }

    // Los tipos que no estén en el orden conocido no se descartan: van al
    // final con su propio slug como rótulo.
    const orden = [
      ...TIPO_TAG_ORDEN.filter((t) => porTipo.has(t)),
      ...[...porTipo.keys()].filter((k) => !TIPO_TAG_ORDEN.includes(k)),
    ];

    const planas: TagOption[] = [];
    const grupos = orden.map((tipo) => ({
      tipo,
      label: TIPO_TAG_LABELS[tipo] ?? tipo,
      items: porTipo.get(tipo)!.map((tag) => ({ ...tag, idx: planas.push(tag) - 1 })),
    }));

    return { grupos, planas };
  }, [tags, consulta]);

  const elegidas = useMemo(
    () =>
      [...seleccionados]
        .map((id) => porId.get(id))
        .filter((t): t is TagOption => Boolean(t)),
    [seleccionados, porId]
  );

  // Cerrar al clickear afuera.
  useEffect(() => {
    if (!abierto) return;
    function alClickear(ev: MouseEvent) {
      if (cajaRef.current && !cajaRef.current.contains(ev.target as Node)) {
        setAbierto(false);
        setArmada(null);
      }
    }
    document.addEventListener("mousedown", alClickear);
    return () => document.removeEventListener("mousedown", alClickear);
  }, [abierto]);

  // Mantener a la vista la opción resaltada por teclado.
  useEffect(() => {
    if (activo < 0) return;
    listaRef.current
      ?.querySelector(`[data-idx="${activo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activo]);

  function manejarTeclas(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (ev.key !== "Backspace") setArmada(null);

    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();
        setAbierto(true);
        setActivo((i) => Math.min(i + 1, planas.length - 1));
        break;

      case "ArrowUp":
        ev.preventDefault();
        setActivo((i) => Math.max(i - 1, 0));
        break;

      case "Home":
        if (!abierto) break;
        ev.preventDefault();
        setActivo(planas.length ? 0 : -1);
        break;

      case "End":
        if (!abierto) break;
        ev.preventDefault();
        setActivo(planas.length - 1);
        break;

      case "Enter":
        // SIEMPRE: es un input dentro del <form> de publicación. Sin esto,
        // Enter publica la oportunidad a medio llenar.
        ev.preventDefault();
        if (abierto && activo >= 0 && planas[activo]) onToggle(planas[activo].id);
        break;

      case "Escape":
        ev.stopPropagation();
        if (consulta) {
          setConsulta("");
          setActivo(-1);
        } else {
          setAbierto(false);
        }
        break;

      case "Backspace":
        if (consulta || elegidas.length === 0) break;
        ev.preventDefault();
        {
          const ultima = elegidas[elegidas.length - 1];
          if (armada === ultima.id) {
            onToggle(ultima.id);
            setArmada(null);
          } else {
            setArmada(ultima.id);
          }
        }
        break;

      case "Tab":
        setAbierto(false);
        break;
    }
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-slate-500">No hay etiquetas disponibles todavía.</p>
    );
  }

  return (
    <div className="relative" ref={cajaRef}>
      <div className="flex items-end justify-between gap-4 mb-2">
        <label
          id={`${uid}-lbl`}
          htmlFor={`${uid}-input`}
          className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"
        >
          {etiquetaCampo}
        </label>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs font-bold tabular-nums ${
              seleccionados.size >= sugerido
                ? "text-emerald-600"
                : seleccionados.size > 0
                  ? "text-[#00213f]"
                  : "text-slate-400"
            }`}
          >
            {seleccionados.size} seleccionada{seleccionados.size === 1 ? "" : "s"}
          </span>
          {seleccionados.size > 0 && (
            <button
              type="button"
              onClick={() => {
                onLimpiar();
                setArmada(null);
                inputRef.current?.focus();
              }}
              className="rounded-sm text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10375c]/40"
            >
              Quitar todas
            </button>
          )}
        </div>
      </div>

      {/* Caja compuesta: chips elegidos + buscador */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="rounded-sm border border-slate-200 bg-white px-3 py-2.5 shadow-sm cursor-text transition-colors hover:border-slate-300 focus-within:border-[#10375c] focus-within:ring-2 focus-within:ring-[#10375c]/20"
      >
        <div className="flex flex-wrap gap-1.5 mb-2 empty:hidden">
          {elegidas.map((tag) => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1.5 rounded-sm pl-2.5 pr-1 py-1 text-xs font-semibold transition-colors ${
                armada === tag.id
                  ? "bg-red-50 text-red-700 ring-1 ring-red-300"
                  : "bg-[#f2f4f6] text-[#10375c]"
              }`}
            >
              {tag.nombre}
              <button
                type="button"
                aria-label={`Quitar ${tag.nombre}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onToggle(tag.id);
                  setArmada(null);
                  inputRef.current?.focus();
                }}
                className="rounded-[2px] p-0.5 text-[#10375c]/60 transition-colors hover:bg-[#00213f]/10 hover:text-[#00213f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10375c]/40"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            id={`${uid}-input`}
            ref={inputRef}
            type="text"
            role="combobox"
            value={consulta}
            onChange={(ev) => {
              setConsulta(ev.target.value);
              setActivo(-1);
              setArmada(null);
              setAbierto(true);
            }}
            onFocus={() => {
              setAbierto(true);
              setActivo(-1);
            }}
            onKeyDown={manejarTeclas}
            aria-expanded={abierto}
            aria-controls={`${uid}-listbox`}
            aria-autocomplete="list"
            aria-labelledby={`${uid}-lbl`}
            aria-describedby={`${uid}-ayuda`}
            aria-activedescendant={
              abierto && activo >= 0 ? `${uid}-opt-${activo}` : undefined
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={
              seleccionados.size
                ? "Agregar otra…"
                : "Escribí para buscar: soldadura, acero, urgente…"
            }
            className="w-full bg-transparent border-0 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <p id={`${uid}-ayuda`} className="mt-2 text-xs text-slate-500">
        Buscá entre {tags.length} etiquetas. Sugerido: {sugerido} o más.
      </p>
      <p aria-live="polite" role="status" className="sr-only">
        {abierto ? `${planas.length} etiquetas coinciden. ` : ""}
        {seleccionados.size} seleccionadas.
      </p>

      {abierto && (
        <div className="absolute z-40 left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_16px_40px_-12px_rgba(0,33,63,0.22)]">
          <div
            ref={listaRef}
            id={`${uid}-listbox`}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={`${uid}-lbl`}
            className="max-h-[min(45vh,320px)] overflow-y-auto overscroll-contain py-1"
          >
            {planas.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Sin coincidencias para «{consulta}»
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Probá con un término más corto o más general.
                </p>
                <button
                  type="button"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => {
                    setConsulta("");
                    inputRef.current?.focus();
                  }}
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#10375c] hover:underline underline-offset-2"
                >
                  Ver todas las etiquetas
                </button>
              </div>
            ) : (
              grupos.map((grupo) => (
                <div key={grupo.tipo} role="group" aria-labelledby={`${uid}-grp-${grupo.tipo}`}>
                  <div
                    id={`${uid}-grp-${grupo.tipo}`}
                    role="presentation"
                    className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
                  >
                    <span>{grupo.label}</span>
                    <span className="tabular-nums text-slate-300">{grupo.items.length}</span>
                  </div>

                  {grupo.items.map((tag) => {
                    const elegida = seleccionados.has(tag.id);
                    return (
                      <div
                        key={tag.id}
                        id={`${uid}-opt-${tag.idx}`}
                        data-idx={tag.idx}
                        role="option"
                        aria-selected={elegida}
                        // Sin esto el mousedown blurea el input, el listener de
                        // click-outside cierra el panel y el onClick nunca llega.
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => onToggle(tag.id)}
                        onMouseEnter={() => setActivo(tag.idx)}
                        className={`flex cursor-pointer items-center gap-2.5 px-3 py-2.5 sm:py-2 text-sm transition-colors ${
                          tag.idx === activo ? "bg-[#f2f4f6]" : ""
                        } ${elegida ? "text-[#00213f] font-semibold" : "text-slate-700"}`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
                            elegida
                              ? "border-[#00213f] bg-[#00213f]"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {elegida && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} aria-hidden="true" />
                          )}
                        </span>
                        <span className="truncate">
                          <Resaltado texto={tag.nombre} consulta={consulta} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-[#f7f9fb] px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 tabular-nums">
              {planas.length} resultado{planas.length === 1 ? "" : "s"}
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400">
              ↑↓ navegar · Enter elegir · Esc cerrar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Resalta la subcadena que matcheó, comparando sin tildes pero cortando sobre el original. */
function Resaltado({ texto, consulta }: { texto: string; consulta: string }) {
  const q = normalizarTexto(consulta.trim());
  if (!q) return <>{texto}</>;

  const desde = normalizarTexto(texto).indexOf(q);
  if (desde < 0) return <>{texto}</>;

  return (
    <>
      {texto.slice(0, desde)}
      <mark className="bg-transparent font-bold text-[#00213f]">
        {texto.slice(desde, desde + q.length)}
      </mark>
      {texto.slice(desde + q.length)}
    </>
  );
}
