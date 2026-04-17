"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { crearOportunidad } from "./acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Settings, Bold, Italic, List, ListOrdered, Tag as TagIcon } from "lucide-react";

function RichTextEditor({ name, placeholder }: { name: string; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    insertUnorderedList: false,
    insertOrderedList: false
  });

  const updateContent = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const checkFormat = () => {
    if (!editorRef.current) return;
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
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

  return (
    <div className="border border-slate-500 rounded-[4px] overflow-hidden focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 bg-white shadow-sm transition-all">
      <div className="bg-slate-50 border-b border-slate-300 px-3 py-2 flex items-center gap-1.5 text-slate-600">
        <button
          type="button"
          onMouseDown={(e) => exec('bold', e)}
          className={`p-1.5 rounded-[4px] transition-all flex items-center justify-center ${activeFormats.bold ? 'bg-slate-300/80 text-black shadow-inner' : 'hover:bg-slate-200 text-slate-700'}`}
          title="Negrita (Ctrl/Cmd + B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => exec('italic', e)}
          className={`p-1.5 rounded-[4px] transition-all flex items-center justify-center ${activeFormats.italic ? 'bg-slate-300/80 text-black shadow-inner' : 'hover:bg-slate-200 text-slate-700'}`}
          title="Cursiva (Ctrl/Cmd + I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-300/80 mx-2" />
        <button
          type="button"
          onMouseDown={(e) => exec('insertUnorderedList', e)}
          className={`p-1.5 rounded-[4px] transition-all flex items-center justify-center ${activeFormats.insertUnorderedList ? 'bg-slate-300/80 text-black shadow-inner' : 'hover:bg-slate-200 text-slate-700'}`}
          title="Lista de viñetas"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => exec('insertOrderedList', e)}
          className={`p-1.5 rounded-[4px] transition-all flex items-center justify-center ${activeFormats.insertOrderedList ? 'bg-slate-300/80 text-black shadow-inner' : 'hover:bg-slate-200 text-slate-700'}`}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <input type="hidden" name={name} value={content} />

      <style jsx global>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          display: block;
        }
      `}</style>

      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onBlur={updateContent}
        onKeyUp={checkFormat}
        onMouseUp={checkFormat}
        data-placeholder={placeholder}
        className="editor-content min-h-[260px] max-h-[400px] overflow-y-auto w-full px-5 py-4 text-[15px] text-slate-800 focus:outline-none leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:mb-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
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

export interface TagOption {
  id: string;
  nombre: string;
  tipo_tag: string;
}

const TIPO_TAG_LABELS: Record<string, string> = {
  capacidad: "Capacidades",
  material: "Materiales",
  modalidad_servicio: "Modalidad",
  industria: "Industria",
  problema: "Necesidad",
  general: "General",
  ubicacion: "Ubicación",
};

const TIPO_TAG_ORDEN = ["problema", "capacidad", "material", "industria", "modalidad_servicio", "general", "ubicacion"];

export function FormularioOportunidad({ categorias, tags }: { categorias: Categoria[]; tags: TagOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const tagsPorTipo = useMemo(() => {
    const map = new Map<string, TagOption[]>();
    for (const tag of tags) {
      if (!map.has(tag.tipo_tag)) map.set(tag.tipo_tag, []);
      map.get(tag.tipo_tag)!.push(tag);
    }
    return TIPO_TAG_ORDEN
      .filter((tipo) => map.has(tipo))
      .map((tipo) => ({ tipo, label: TIPO_TAG_LABELS[tipo] ?? tipo, items: map.get(tipo)! }));
  }, [tags]);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    for (const tagId of selectedTags) formData.append("tag_ids", tagId);

    const result = await crearOportunidad(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-24 items-start">
      {/* Columna Principal: Formulario */}
      <div className="lg:col-span-8 bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 space-y-10">

            <input type="hidden" name="visibilidad" value="privada_parque" />

            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-4 mb-1">
                Paso 1: Revisa el requerimiento
              </h2>
              <p className="text-xs text-slate-500 mb-6">* El asterisco indica que es obligatorio</p>

              <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalles del requerimiento*</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="titulo" className="text-sm font-normal text-slate-800">
                    Cargo o Título <span className="text-slate-600 font-bold">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    placeholder="Ej. Desarrollador de back-end / Reparación CNC"
                    required
                    className="h-10 rounded-[4px] border-slate-500 hover:border-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm shadow-none"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <Label htmlFor="categoria_id" className="text-sm font-normal text-slate-800">
                    Tipo de rubro <span className="text-slate-600 font-bold">*</span>
                  </Label>
                  <div className="relative">
                    <select
                      name="categoria_id"
                      id="categoria_id"
                      required
                      defaultValue=""
                      className="h-10 w-full appearance-none rounded-[4px] border border-slate-500 hover:border-slate-800 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white px-3 py-2 text-sm text-slate-900 shadow-none cursor-pointer"
                    >
                      <option value="" disabled>Selecciona el rubro...</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-600">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 16 16"><path d="M8 11L3 6h10z"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="localidad" className="text-sm font-normal text-slate-800 flex items-center gap-1">
                    Ubicación <span className="text-slate-600 font-bold">*</span>
                  </Label>
                  <Input
                    id="localidad"
                    name="localidad"
                    placeholder="Ej. Burzaco, Provincia de Buenos Aires"
                    required
                    className="h-10 rounded-[4px] border-slate-500 hover:border-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm shadow-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Descripción*</h3>
              <RichTextEditor
                name="descripcion"
                placeholder="Consejos: Haz un resumen del puesto o servicio, explica qué se necesita para triunfar en él y requerimientos técnicos..."
              />
            </div>

            <div className="pt-2">
              <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-4 mb-6">
                Paso 2: Detalles logísticos
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="cantidad" className="text-sm font-normal text-slate-800">Cantidad</Label>
                  <Input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Ej. 20"
                    className="h-10 rounded-[4px] border-slate-500 hover:border-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="unidad" className="text-sm font-normal text-slate-800">Unidad</Label>
                  <Input
                    id="unidad"
                    name="unidad"
                    placeholder="Ej. horas, unidades, m²"
                    className="h-10 rounded-[4px] border-slate-500 hover:border-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fecha_necesidad" className="text-sm font-normal text-slate-800">Fecha de necesidad</Label>
                  <Input
                    id="fecha_necesidad"
                    name="fecha_necesidad"
                    type="date"
                    className="h-10 rounded-[4px] border-slate-500 hover:border-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm shadow-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-4 mb-2">
                Paso 3: Etiquetas para el match
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Marcá lo que aplique. Cuantas más etiquetas relevantes, mejor el puntaje de los candidatos.
                Seleccionadas: <span className="font-semibold text-slate-700">{selectedTags.size}</span>
              </p>

              {tagsPorTipo.length === 0 ? (
                <p className="text-sm text-slate-500">No hay etiquetas disponibles todavía.</p>
              ) : (
                <div className="space-y-6">
                  {tagsPorTipo.map(({ tipo, label, items }) => (
                    <div key={tipo}>
                      <div className="flex items-center gap-2 mb-3">
                        <TagIcon className="w-4 h-4 text-slate-500" />
                        <h4 className="text-sm font-semibold text-slate-800">{label}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {items.map((tag) => {
                          const active = selectedTags.has(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              aria-pressed={active}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                active
                                  ? 'bg-[#0a66c2] border-[#0a66c2] text-white shadow-sm'
                                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {tag.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="bg-white px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700 cursor-pointer hover:underline">Vista previa</span>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full h-10 px-6 border-slate-600 text-slate-700 font-semibold hover:border-slate-800 hover:bg-slate-50 shadow-none"
                onClick={() => router.back()}
                disabled={loading}
              >
                Volver
              </Button>
              <Button
                type="submit"
                className="rounded-full h-10 px-8 bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold shadow-none"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Publicar"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Columna Secundaria: Tips */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-5">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-slate-900 rounded-[4px] shrink-0 flex items-center justify-center text-white font-bold text-xl">
              U
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Creación de Requerimiento</h4>
              <p className="text-sm text-slate-600 mt-0.5">Parque Industrial</p>
              <p className="text-sm text-slate-500">Provincia de Buenos Aires, Argentina (Presencial)</p>
              <p className="text-xs text-slate-500 font-semibold mt-2">Guardado como borrador</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Lleva tu requerimiento hasta los particulares adecuados</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Incluye la descripción técnica del trabajo y añade las aptitudes necesarias para segmentar a los miembros de la red que cumplan los requisitos. Esto asegura respuestas de mayor calidad.
          </p>
        </div>
      </div>
    </div>
  );
}
