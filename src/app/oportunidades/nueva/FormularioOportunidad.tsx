"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearOportunidad } from "./acciones";
import { SelectorEtiquetas } from "@/components/ui/selector-etiquetas";
import type { TagOption } from "@/modulos/compartido/etiquetas";
import {
  Loader2,
  AlertCircle,
  Bold,
  Italic,
  List,
  ListOrdered,
  ChevronDown,
  Target,
  Tag,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/** Manrope está cargada en el layout pero no registrada como token de Tailwind:
 *  `font-manrope` no genera nada. Se aplica por style, como en la landing. */
const manrope = { fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" } as const;

const inputCls =
  "h-11 w-full rounded-sm border border-slate-200 bg-white px-3.5 " +
  "text-base sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm " +
  "transition-colors hover:border-slate-300 " +
  "focus:border-[#10375c] focus:outline-none focus:ring-2 focus:ring-[#10375c]/20 " +
  "disabled:bg-slate-50 disabled:text-slate-400";

const labelCls =
  "block mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500";

function EncabezadoSeccion({
  numero,
  titulo,
  badge,
}: {
  numero: string;
  titulo: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#00213f] text-white text-[10px] font-black tabular-nums">
        {numero}
      </span>
      <h2
        style={manrope}
        className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00213f]"
      >
        {titulo}
      </h2>
      <span className="flex-1 h-px bg-slate-200/60" />
      {badge && (
        <span className="shrink-0 rounded-sm bg-[#f2f4f6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {badge}
        </span>
      )}
    </div>
  );
}

function Obligatorio() {
  return (
    <>
      <span className="text-red-500 ml-0.5" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  );
}

function RichTextEditor({
  name,
  placeholder,
  invalido,
}: {
  name: string;
  placeholder?: string;
  invalido?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const updateContent = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const checkFormat = () => {
    if (!editorRef.current) return;
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const exec = (command: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;

    document.execCommand(command, false, undefined);

    editorRef.current.focus();
    checkFormat();
    updateContent();
  };

  const botonCls = (activo: boolean) =>
    `p-1.5 rounded-sm transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10375c]/40 ${
      activo
        ? "bg-[#00213f] text-white"
        : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
    }`;

  return (
    <div
      className={`rounded-sm border bg-white shadow-sm overflow-hidden transition-colors focus-within:border-[#10375c] focus-within:ring-2 focus-within:ring-[#10375c]/20 ${
        invalido ? "border-red-300" : "border-slate-200"
      }`}
    >
      <div className="bg-[#f7f9fb] border-b border-slate-200 px-2.5 py-2 flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => exec("bold", e)}
          aria-pressed={activeFormats.bold}
          aria-label="Negrita"
          className={botonCls(activeFormats.bold)}
          title="Negrita (Ctrl/Cmd + B)"
        >
          <Bold className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => exec("italic", e)}
          aria-pressed={activeFormats.italic}
          aria-label="Cursiva"
          className={botonCls(activeFormats.italic)}
          title="Cursiva (Ctrl/Cmd + I)"
        >
          <Italic className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1.5" />
        <button
          type="button"
          onMouseDown={(e) => exec("insertUnorderedList", e)}
          aria-pressed={activeFormats.insertUnorderedList}
          aria-label="Lista de viñetas"
          className={botonCls(activeFormats.insertUnorderedList)}
          title="Lista de viñetas"
        >
          <List className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => exec("insertOrderedList", e)}
          aria-pressed={activeFormats.insertOrderedList}
          aria-label="Lista numerada"
          className={botonCls(activeFormats.insertOrderedList)}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <input type="hidden" name={name} value={content} />

      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onBlur={updateContent}
        onKeyUp={checkFormat}
        onMouseUp={checkFormat}
        data-placeholder={placeholder}
        role="textbox"
        aria-multiline="true"
        aria-labelledby="lbl-descripcion"
        aria-describedby="ayuda-descripcion"
        aria-required="true"
        aria-invalid={invalido || undefined}
        className="min-h-[240px] max-h-[400px] overflow-y-auto w-full px-4 py-3.5 text-sm text-slate-800 focus:outline-none leading-relaxed break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none empty:before:block [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:mb-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
        style={{ cursor: "text" }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}

interface Categoria {
  id: string;
  nombre: string;
}

export function FormularioOportunidad({
  categorias,
  tags,
}: {
  categorias: Categoria[];
  tags: TagOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descripcionVacia, setDescripcionVacia] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const contenedorErrorRef = useRef<HTMLDivElement>(null);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // El error puede dispararse estando al final del form: hay que ir a verlo.
  useEffect(() => {
    if (error) contenedorErrorRef.current?.scrollIntoView({ block: "center" });
  }, [error]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // El editor guarda HTML en un hidden, y los hidden ignoran `required`.
    const html = (formData.get("descripcion") as string | null) ?? "";
    const soloTexto = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (!soloTexto) {
      setDescripcionVacia(true);
      setError("Escribí una descripción del requerimiento.");
      return;
    }

    setDescripcionVacia(false);
    setLoading(true);
    setError(null);

    for (const tagId of selectedTags) formData.append("tag_ids", tagId);

    const result = await crearOportunidad(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.redirect) {
      if (result.avisoTags) toast.warning(result.avisoTags);
      router.push(result.redirect);
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-24 items-start">
      {/* Columna principal: formulario */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_32px_-12px_rgba(15,23,42,0.08)]">
        <div className="h-1 bg-[#00213f] rounded-t-xl" />

        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 lg:p-10 space-y-12">
            <input type="hidden" name="visibilidad" value="privada_parque" />

            {error && (
              <div
                ref={contenedorErrorRef}
                role="alert"
                tabIndex={-1}
                className="rounded-sm border border-red-200 bg-red-50 p-4 flex items-start gap-3"
              >
                <AlertCircle
                  className="w-5 h-5 text-red-500 shrink-0 mt-px"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* ── 01 · Requerimiento ── */}
            <div>
              <EncabezadoSeccion numero="01" titulo="Requerimiento" />

              <p className="text-xs text-slate-400 mb-5">
                Los campos con <span className="text-red-500">*</span> son obligatorios.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="sm:col-span-2">
                  <label htmlFor="titulo" className={labelCls}>
                    Título del requerimiento
                    <Obligatorio />
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    required
                    maxLength={120}
                    placeholder="Ej. Reparación de torno CNC · Provisión de chapa laminada"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="categoria_id" className={labelCls}>
                    Rubro
                    <Obligatorio />
                  </label>
                  <div className="relative">
                    <select
                      id="categoria_id"
                      name="categoria_id"
                      required
                      defaultValue=""
                      className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                    >
                      <option value="" disabled>
                        Elegí el rubro…
                      </option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="localidad" className={labelCls}>
                    Ubicación
                    <Obligatorio />
                  </label>
                  <input
                    id="localidad"
                    name="localidad"
                    required
                    placeholder="Ej. Burzaco, Provincia de Buenos Aires"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* ── 02 · Descripción ── */}
            <div>
              <EncabezadoSeccion numero="02" titulo="Descripción" />

              <span id="lbl-descripcion" className="sr-only">
                Descripción del requerimiento (obligatorio)
              </span>
              <p
                id="ayuda-descripcion"
                className="text-sm text-slate-500 leading-relaxed mb-4 max-w-prose"
              >
                Detallá el trabajo: qué hay que hacer, especificaciones técnicas, plazos y
                condiciones. Cuanto más concreto, mejores las respuestas.
              </p>
              <RichTextEditor
                name="descripcion"
                invalido={descripcionVacia}
                placeholder="Ej. Necesitamos reparar un torno CNC Fanuc, con diagnóstico previo en planta…"
              />
            </div>

            {/* ── 03 · Detalles logísticos ── */}
            <div>
              <EncabezadoSeccion numero="03" titulo="Detalles logísticos" badge="Opcional" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="cantidad" className={labelCls}>
                    Cantidad
                  </label>
                  <input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ej. 20"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="unidad" className={labelCls}>
                    Unidad
                  </label>
                  <input
                    id="unidad"
                    name="unidad"
                    placeholder="Ej. horas, unidades, m²"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="fecha_necesidad" className={labelCls}>
                    Fecha de necesidad
                  </label>
                  <input
                    id="fecha_necesidad"
                    name="fecha_necesidad"
                    type="date"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* ── 04 · Etiquetas para el match ── */}
            <div>
              <EncabezadoSeccion numero="04" titulo="Etiquetas para el match" />

              <p className="text-sm text-slate-500 leading-relaxed mb-4 max-w-prose">
                Escribí lo que necesitás y elegí de la lista. Cada etiqueta suma puntaje al
                cruce con los perfiles de la red: con{" "}
                <strong className="font-semibold text-slate-700">5 o más</strong> el ranking
                de candidatos mejora bastante.
              </p>

              <SelectorEtiquetas
                tags={tags}
                seleccionados={selectedTags}
                onToggle={toggleTag}
                onLimpiar={() => setSelectedTags(new Set())}
              />
            </div>
          </div>

          {/* Footer de acciones: sticky dentro de la tarjeta */}
          <div className="sticky bottom-0 z-20 rounded-b-xl border-t border-slate-200/70 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.25)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Visible sólo para la red UIAB · {selectedTags.size} etiqueta
              {selectedTags.size === 1 ? "" : "s"}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="h-11 px-6 rounded-sm border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10375c]/40 disabled:opacity-50 disabled:pointer-events-none"
              >
                Volver
              </button>

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex items-center justify-center gap-2 h-11 px-8 rounded-sm bg-[#00213f] text-white text-sm font-extrabold shadow-lg shadow-[#00213f]/20 transition-all hover:bg-[#10375c] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10375c]/40 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Publicando…
                  </>
                ) : (
                  <>
                    Publicar requerimiento
                    <ArrowRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Columna lateral */}
      <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-4">
            Cómo funciona el match
          </p>
          <ul className="space-y-3.5 text-sm text-slate-600 leading-relaxed">
            <li className="flex gap-3">
              <Target className="w-4 h-4 text-[#10375c] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Cruzamos{" "}
                <strong className="font-semibold text-slate-800">
                  rubro, ubicación y etiquetas
                </strong>{" "}
                con los perfiles de la red.
              </span>
            </li>
            <li className="flex gap-3">
              <Tag className="w-4 h-4 text-[#10375c] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Cada etiqueta suma puntaje. Con{" "}
                <strong className="font-semibold text-slate-800">5 o más</strong> aparecen más
                candidatos.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>Sólo lo ven empresas socias y prestadores verificados. No es público.</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#f2f4f6] rounded-xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-4">
            Antes de publicar
          </p>
          <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
            {[
              "Especificá material, medidas y tolerancias si aplican.",
              "Aclará si el trabajo es en planta o en el taller del prestador.",
              "Poné una fecha de necesidad realista: ordena las respuestas.",
            ].map((consejo) => (
              <li key={consejo} className="flex gap-3">
                <CheckCircle2
                  className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{consejo}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
