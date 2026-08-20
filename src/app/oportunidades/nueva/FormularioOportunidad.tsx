"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearOportunidad } from "./acciones";
import { editarOportunidad } from "../[id]/editar/acciones";
import { eliminarAdjuntoDeOportunidad } from "../adjuntos-acciones";
import { CampoAdjuntos, type ArchivoLocal } from "./CampoAdjuntos";
import { subirAdjuntosDeOportunidad } from "@/modulos/oportunidades/subir-adjuntos-cliente";
import type { AdjuntoOportunidad } from "@/modulos/oportunidades/adjuntos";
import { SelectorEtiquetas } from "@/components/ui/selector-etiquetas";
import { SelectUIAB } from "@/components/ui/select-uiab";
import type { TagOption } from "@/modulos/compartido/etiquetas";
import {
  Loader2,
  AlertCircle,
  Bold,
  Italic,
  List,
  ListOrdered,
  Target,
  Tag,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Package,
  Wrench,
  Users,
  Shapes,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { llamarAccion, fallo } from "@/lib/accion-segura";

/** Manrope está cargada en el layout pero no registrada como token de Tailwind:
 *  `font-manrope` no genera nada. Se aplica por style, como en la landing. */
const manrope = { fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" } as const;

const inputCls =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 " +
  // text-base fijo: con `sm:text-sm` Safari iOS vuelve a hacer zoom al enfocar
  // (el iPhone apaisado ya entra en el breakpoint sm).
  "text-base text-slate-900 placeholder:text-slate-400 " +
  "transition-colors hover:border-slate-300 " +
  "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 " +
  "disabled:bg-slate-50 disabled:text-slate-400";

const labelCls = "block mb-2 text-sm font-semibold text-slate-700";

/** Qué necesita quien publica. Los `valor` coinciden con el CHECK de
 *  `oportunidades.tipo_requerimiento` (text[]) en la base. */
const TIPOS_REQUERIMIENTO = [
  { valor: "material", label: "Material", icon: Package },
  { valor: "servicio", label: "Servicio", icon: Wrench },
  { valor: "personal", label: "Personal", icon: Users },
  { valor: "otro", label: "Otro", icon: Shapes },
] as const;

function EncabezadoSeccion({
  numero,
  titulo,
  descripcion,
  badge,
}: {
  numero: string;
  titulo: string;
  /** Bajada de la sección: explica qué se espera antes de mostrar los campos. */
  descripcion?: string;
  badge?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-[11px] font-black tabular-nums text-white">
          {numero}
        </span>
        <h2 style={manrope} className="text-lg font-black tracking-tight text-[#00213f]">
          {titulo}
        </h2>
        {badge && (
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {badge}
          </span>
        )}
      </div>
      {descripcion && (
        <p className="mt-2 max-w-prose pl-10 text-sm leading-relaxed text-slate-500">
          {descripcion}
        </p>
      )}
    </div>
  );
}

/**
 * Los tres pasos del cruce, con las ilustraciones.
 *
 * Va justo debajo del selector de etiquetas porque es ahí donde lo que el
 * usuario hace determina a quién le va a llegar el pedido: explicarlo en
 * abstracto arriba de todo no cambia lo que elige, mostrarlo acá sí.
 *
 * Los tres criterios son los que aplica de verdad `calcular-matches.ts`,
 * incluido que la cercanía suma pero no alcanza por sí sola.
 */
function ComoTeEncontramosCandidatos() {
  const PASOS = [
    {
      imagen: "/oportunidades/match-etiquetas.webp",
      titulo: "Cruzamos tus etiquetas",
      texto:
        "Cada término que elegís se compara con el perfil de las socias. Es la señal que más pesa.",
    },
    {
      imagen: "/oportunidades/match-zona.webp",
      titulo: "Sumamos rubro y cercanía",
      texto:
        "Trabajar en el mismo rubro suma, y estar en tu zona también — aunque estar cerca solo no alcanza.",
    },
    {
      imagen: "/oportunidades/match-resultado.webp",
      titulo: "Te mostramos quiénes son",
      texto:
        "Al publicar, tu oportunidad aparece con la lista de candidatos y el motivo de cada coincidencia.",
    },
  ];

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50/50">
      <div className="px-6 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">
          Qué pasa cuando publicás
        </p>
        <p
          style={manrope}
          className="mt-2 text-lg font-black tracking-tight text-[#00213f]"
        >
          Buscamos candidatos por vos, automáticamente
        </p>
      </div>

      <ol className="grid gap-4 p-6 sm:grid-cols-3">
        {PASOS.map((paso, indice) => (
          <li
            key={paso.titulo}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70"
          >
            <Image
              src={paso.imagen}
              alt=""
              aria-hidden="true"
              width={440}
              height={440}
              className="h-24 w-full select-none object-cover"
            />
            <div className="p-4">
              <p className="text-sm font-bold text-[#00213f]">
                <span className="mr-1.5 tabular-nums text-primary-600">
                  {indice + 1}.
                </span>
                {paso.titulo}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {paso.texto}
              </p>
            </div>
          </li>
        ))}
      </ol>
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
  htmlInicial,
}: {
  name: string;
  placeholder?: string;
  invalido?: boolean;
  /** Contenido con el que arranca el editor (edición). */
  htmlInicial?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(htmlInicial ?? "");

  // El contentEditable no es controlado: el HTML inicial se inyecta una vez.
  useEffect(() => {
    if (htmlInicial && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = htmlInicial;
    }
    // Sólo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    `h-11 w-11 sm:h-9 sm:w-9 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
      activo
        ? "bg-primary-600 text-white"
        : "text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
    }`;

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 ${
        invalido ? "border-red-300" : "border-slate-200"
      }`}
    >
      <div className="bg-slate-50/80 border-b border-slate-200 px-2.5 py-2 flex items-center gap-1">
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
        className="min-h-[240px] max-h-[400px] overflow-y-auto w-full px-4 py-3.5 text-base text-slate-800 focus:outline-none leading-relaxed break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none empty:before:block [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:mb-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
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

/** Valores con los que arranca el formulario en modo edición. */
export interface OportunidadInicial {
  titulo: string;
  descripcionHtml: string;
  categoria_id: string;
  localidad: string;
  cantidad: number | null;
  unidad: string | null;
  fecha_necesidad: string | null;
  tipoRequerimiento: string[];
  tagIds: string[];
}

export function FormularioOportunidad({
  categorias,
  tags,
  modo = "crear",
  oportunidadId,
  inicial,
  adjuntosIniciales = [],
}: {
  categorias: Categoria[];
  tags: TagOption[];
  /** "editar" reutiliza el mismo formulario sobre una oportunidad existente. */
  modo?: "crear" | "editar";
  /** Obligatorio en modo edición. */
  oportunidadId?: string;
  inicial?: OportunidadInicial;
  adjuntosIniciales?: AdjuntoOportunidad[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subiendoAdjuntos, setSubiendoAdjuntos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descripcionVacia, setDescripcionVacia] = useState(false);
  const [tiposReq, setTiposReq] = useState<Set<string>>(
    () => new Set(inicial?.tipoRequerimiento ?? [])
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    () => new Set(inicial?.tagIds ?? [])
  );
  /** Términos que el usuario escribió y no están en el catálogo. Se crean como
   *  etiquetas libres del lado del servidor al publicar. */
  const [nuevasEtiquetas, setNuevasEtiquetas] = useState<string[]>([]);
  /** Fotos y documentos elegidos en esta sesión (se suben tras publicar). */
  const [adjuntos, setAdjuntos] = useState<ArchivoLocal[]>([]);
  /** Los ya subidos (sólo edición); borrar uno es inmediato. */
  const [adjuntosExistentes, setAdjuntosExistentes] =
    useState<AdjuntoOportunidad[]>(adjuntosIniciales);
  const contenedorErrorRef = useRef<HTMLDivElement>(null);

  const toggleTipo = (valor: string) => {
    setTiposReq((prev) => {
      const next = new Set(prev);
      if (next.has(valor)) next.delete(valor);
      else next.add(valor);
      return next;
    });
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalEtiquetas = selectedTags.size + nuevasEtiquetas.length;

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

    for (const valor of tiposReq) formData.append("tipo_requerimiento", valor);
    for (const tagId of selectedTags) formData.append("tag_ids", tagId);
    for (const termino of nuevasEtiquetas) formData.append("nuevas_etiquetas", termino);

    const result = await llamarAccion(() =>
      modo === "editar" && oportunidadId
        ? editarOportunidad(oportunidadId, formData)
        : crearOportunidad(formData)
    );

    if (fallo(result)) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (!result.redirect) {
      // Ni error ni redirect: sin esta rama el botón se quedaba en "Publicando…"
      // para siempre si el action devolvía una forma inesperada.
      setLoading(false);
      return;
    }

    // Adjuntos: la oportunidad ya existe; los archivos van directo del browser
    // a Storage con URLs firmadas por el action (ver adjuntos.ts). Un archivo
    // que falla no frena la publicación — se avisa y se puede resubir editando.
    const idDeCreacion =
      "oportunidadId" in result && typeof result.oportunidadId === "string"
        ? result.oportunidadId
        : undefined;
    const idDestino = modo === "editar" ? oportunidadId : idDeCreacion;
    if (adjuntos.length > 0 && idDestino) {
      setSubiendoAdjuntos(true);
      const subida = await subirAdjuntosDeOportunidad(
        idDestino,
        adjuntos.map((adjunto) => adjunto.file)
      );
      setSubiendoAdjuntos(false);
      if (subida.error) {
        toast.warning("Los archivos no se pudieron subir", {
          description: subida.error,
        });
      } else if (subida.fallidos.length > 0) {
        toast.warning(
          `${subida.fallidos.length} archivo${subida.fallidos.length === 1 ? "" : "s"} no se pudo${subida.fallidos.length === 1 ? "" : "ieron"} subir`,
          { description: subida.fallidos.join(", ") }
        );
      }
    }

    if (result.avisoTags) toast.warning(result.avisoTags);
    router.push(result.redirect);
    router.refresh();
  }

  /** Borrado inmediato de un adjunto ya subido (sólo edición). */
  const manejarEliminarExistente = async (adjunto: AdjuntoOportunidad) => {
    if (!oportunidadId) return false;
    const res = await llamarAccion(() =>
      eliminarAdjuntoDeOportunidad(oportunidadId, adjunto.ruta)
    );
    if (fallo(res) || !res.success) return false;
    setAdjuntosExistentes((previos) =>
      previos.filter((existente) => existente.ruta !== adjunto.ruta)
    );
    return true;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-24 items-start">
      {/* Columna principal: formulario */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_32px_-12px_rgba(15,23,42,0.08)]">
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 lg:p-10 space-y-10">
            <input type="hidden" name="visibilidad" value="privada_parque" />

            {error && (
              <div
                ref={contenedorErrorRef}
                role="alert"
                tabIndex={-1}
                className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3"
              >
                <AlertCircle
                  className="w-5 h-5 text-red-500 shrink-0 mt-px"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* ── 01 · ¿Qué necesitás? ── */}
            <div>
              <EncabezadoSeccion
                numero="01"
                titulo="¿Qué necesitás?"
                descripcion="Podés combinar más de uno: material, servicio, producto o personal."
              />

              <fieldset className="mb-6">
                <legend className="sr-only">¿Qué necesitás?</legend>
                <div
                  role="group"
                  aria-label="¿Qué necesitás?"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  {TIPOS_REQUERIMIENTO.map(({ valor, label, icon: Icon }) => {
                    const activo = tiposReq.has(valor);
                    return (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => toggleTipo(valor)}
                        aria-pressed={activo}
                        className={`flex h-16 items-center justify-center gap-2.5 rounded-xl border-2 px-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                          activo
                            ? "border-primary-500 bg-primary-50/70 text-primary-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 ${activo ? "text-primary-600" : "text-slate-400"}`}
                          aria-hidden="true"
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="titulo" className={labelCls}>
                  Título del requerimiento
                  <Obligatorio />
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  required
                  maxLength={120}
                  defaultValue={inicial?.titulo}
                  placeholder="Ej. Reparación de torno CNC · Provisión de chapa laminada"
                  className={inputCls}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Es lo primero que se lee en la cartelera: que se entienda solo.
                </p>
              </div>
            </div>

            {/* ── 02 · Rubro y ubicación ── */}
            <div>
              <EncabezadoSeccion
                numero="02"
                titulo="Rubro y ubicación"
                descripcion="Son los dos primeros filtros del cruce con los perfiles de la red."
              />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="categoria_id" className={labelCls}>
                    Rubro principal
                    <Obligatorio />
                  </label>
                  <SelectUIAB
                    id="categoria_id"
                    name="categoria_id"
                    required
                    defaultValue={inicial?.categoria_id ?? ""}
                    placeholder="Elegí el rubro…"
                    ariaLabel="Rubro principal"
                    className={inputCls}
                    options={categorias.map((cat) => ({ value: cat.id, label: cat.nombre }))}
                  />
                </div>

                <div>
                  <label htmlFor="localidad" className={labelCls}>
                    Ubicación
                    <Obligatorio />
                  </label>
                  <div className="relative">
                    <input
                      id="localidad"
                      name="localidad"
                      required
                      defaultValue={inicial?.localidad}
                      placeholder="Ej. Burzaco, Provincia de Buenos Aires"
                      className={`${inputCls} pr-11`}
                    />
                    <MapPin
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 03 · Descripción ── */}
            <div>
              <EncabezadoSeccion
                numero="03"
                titulo="Contanos más detalles"
                descripcion="Describí el trabajo, especificaciones técnicas, cantidades, plazos y cualquier condición importante. Cuanto más concreto, mejores las respuestas."
              />

              <span id="lbl-descripcion" className="sr-only">
                Descripción del requerimiento (obligatorio)
              </span>
              <span id="ayuda-descripcion" className="sr-only">
                Describí el trabajo, especificaciones técnicas, cantidades, plazos y
                condiciones.
              </span>
              <RichTextEditor
                name="descripcion"
                invalido={descripcionVacia}
                htmlInicial={inicial?.descripcionHtml}
                placeholder="Ej. Necesitamos reparar un torno CNC Fanuc, con diagnóstico previo en planta…"
              />
            </div>

            {/* ── 04 · Detalles logísticos ── */}
            <div>
              <EncabezadoSeccion
                numero="04"
                titulo="Cantidades y plazos"
                descripcion="Se muestran como datos sueltos en la tarjeta del pedido, sin que haya que abrirlo."
                badge="Opcional"
              />

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
                    defaultValue={inicial?.cantidad ?? undefined}
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
                    defaultValue={inicial?.unidad ?? undefined}
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
                    defaultValue={inicial?.fecha_necesidad ?? undefined}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* ── 05 · Fotos y archivos ── */}
            <div>
              <EncabezadoSeccion
                numero="05"
                titulo="Fotos y archivos"
                descripcion="Fotos del estado actual, planos o especificaciones. Las imágenes se muestran en la publicación y ayudan a que los candidatos coticen mejor."
                badge="Opcional"
              />
              <CampoAdjuntos
                archivos={adjuntos}
                onChange={setAdjuntos}
                existentes={modo === "editar" ? adjuntosExistentes : []}
                onEliminarExistente={
                  modo === "editar" ? manejarEliminarExistente : undefined
                }
                deshabilitado={loading}
              />
            </div>

            {/* ── 06 · Etiquetas para el match ── */}
            <div>
              <EncabezadoSeccion numero="06" titulo="Etiquetas para el match" />

              <p className="text-sm text-slate-500 leading-relaxed mb-4 max-w-prose">
                Escribí lo que necesitás —material, servicio, producto o personal— y elegí de
                la lista. ¿No está? Sumá tu propio término. Cada etiqueta suma puntaje al
                cruce con los perfiles de la red: con{" "}
                <strong className="font-semibold text-slate-700">5 o más</strong> el ranking
                de candidatos mejora bastante.
              </p>

              <SelectorEtiquetas
                tags={tags}
                seleccionados={selectedTags}
                onToggle={toggleTag}
                onLimpiar={() => setSelectedTags(new Set())}
                nuevos={nuevasEtiquetas}
                onNuevosCambian={setNuevasEtiquetas}
              />

              <ComoTeEncontramosCandidatos />
            </div>
          </div>

          {/* Footer de acciones: sticky dentro de la tarjeta */}
          <div className="sticky bottom-0 z-20 rounded-b-2xl border-t border-slate-200/70 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.25)]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck
                className="h-5 w-5 shrink-0 text-emerald-500"
                aria-hidden="true"
              />
              <p className="text-xs leading-snug text-slate-500">
                <span className="font-semibold text-slate-700">
                  Visible sólo para empresas socias y prestadores verificados de la UIAB.
                </span>
                <br />
                Tu requerimiento no es público · {totalEtiquetas} etiqueta
                {totalEtiquetas === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="h-12 shrink-0 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-50 disabled:pointer-events-none"
              >
                Volver
              </button>

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 sm:whitespace-nowrap text-sm font-extrabold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {subiendoAdjuntos
                      ? "Subiendo archivos…"
                      : modo === "editar"
                        ? "Guardando…"
                        : "Publicando…"}
                  </>
                ) : (
                  <>
                    {modo === "editar" ? "Guardar cambios" : "Publicar requerimiento"}
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
      <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-28">
        <div
          data-tour="form-como-funciona"
          className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
        >
          {/* La ilustración trae su propio fondo celeste: va a sangre arriba. */}
          <Image
            src="/oportunidades/match-iman.webp"
            alt=""
            aria-hidden="true"
            width={440}
            height={440}
            priority
            className="h-32 w-full select-none object-cover"
          />
          <div className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              ¿Cómo funciona el match?
            </p>
            <p
              style={manrope}
              className="mt-2 mb-4 text-base font-black tracking-tight text-[#00213f]"
            >
              No tenés que buscar a nadie
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Target className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5">
                  Cruzamos{" "}
                  <strong className="font-semibold text-slate-800">
                    rubro, ubicación y etiquetas
                  </strong>{" "}
                  con los perfiles de la red.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5">
                  Cada etiqueta suma puntaje. Con{" "}
                  <strong className="font-semibold text-slate-800">5 o más</strong> aparecen
                  más candidatos.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5">
                  Sólo lo ven empresas socias y prestadores verificados. No es público.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Antes de publicar
          </p>
          <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
            {[
              "Especificá material, medidas y tolerancias si aplican.",
              "Aclará si el trabajo es en planta o en el taller del prestador.",
              "Poné una fecha de necesidad realista: ordena las respuestas.",
            ].map((consejo) => (
              <li key={consejo} className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
                <span>{consejo}</span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          El mockup traía acá un "Ver tutorial" con un monitor y un play. No hay
          video publicado —el de `herramientas/video-tutorial` todavía no salió— y
          el tour de onboarding vive en /oportunidades: dispararlo desde este
          formulario navegaría afuera y se llevaría puesto lo que la socia escribió.
          Así que la tarjeta queda, pero mandando a donde hay alguien del otro lado.
        */}
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-primary-50/60 p-6">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p
                style={manrope}
                className="text-base font-black tracking-tight text-[#00213f]"
              >
                ¿Dudas con el pedido?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Escribinos y te damos una mano para redactarlo, así le llega a las socias
                indicadas.
              </p>
            </div>
            <Image
              src="/landing/ayuda-contacto.webp"
              alt=""
              aria-hidden="true"
              width={600}
              height={355}
              className="hidden h-auto w-24 shrink-0 select-none sm:block"
            />
          </div>
          <Link
            href="/contacto"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-[#00213f] shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            <MessageCircle className="h-4 w-4 text-primary-600" aria-hidden="true" />
            Escribinos
          </Link>
        </div>
      </aside>
    </div>
  );
}
