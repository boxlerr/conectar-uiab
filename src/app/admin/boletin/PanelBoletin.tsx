"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Pin,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/cliente";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import {
  crearComunicado,
  actualizarComunicado,
  cambiarEstadoComunicado,
  eliminarComunicado,
  prepararSubidaImagen,
} from "@/modulos/boletin/acciones";
import {
  BUCKET_BOLETIN,
  EXTENSION_POR_MIME,
  type Comunicado,
  type EstadoComunicado,
} from "@/modulos/boletin/tipos";

type Filtro = "todos" | "publicado" | "borrador";

/** 4 MB: entra sobrado para una foto de nota y no castiga al que sube desde el cel. */
const MAX_IMAGEN_BYTES = 4 * 1024 * 1024;
const MIME_ACEPTADOS = Object.keys(EXTENSION_POR_MIME);

const BADGE: Record<EstadoComunicado, { label: string; className: string }> = {
  publicado: { label: "Publicado", className: "bg-emerald-100 text-emerald-700" },
  borrador: { label: "Borrador", className: "bg-amber-100 text-amber-700" },
};

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PanelBoletin({ comunicados }: { comunicados: Comunicado[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState<Comunicado | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  // Formulario (alta / edición). `editando` null = alta nueva.
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Comunicado | null>(null);
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [fijado, setFijado] = useState(false);
  const [bucket, setBucket] = useState<string | null>(null);
  const [rutaImagen, setRutaImagen] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function refresh() {
    router.refresh();
  }

  function urlPublica(b: string | null, ruta: string | null): string | null {
    if (!b || !ruta) return null;
    return supabase.storage.from(b).getPublicUrl(ruta).data.publicUrl;
  }

  function abrirNuevo() {
    setEditando(null);
    setTitulo("");
    setCuerpo("");
    setFijado(false);
    setBucket(null);
    setRutaImagen(null);
    setPreviewUrl(null);
    setFormAbierto(true);
  }

  function abrirEdicion(c: Comunicado) {
    setEditando(c);
    setTitulo(c.titulo);
    setCuerpo(c.cuerpo);
    setFijado(c.fijado);
    setBucket(c.bucket);
    setRutaImagen(c.ruta_imagen);
    setPreviewUrl(urlPublica(c.bucket, c.ruta_imagen));
    setFormAbierto(true);
  }

  function cerrarForm() {
    if (subiendo || guardando) return;
    setFormAbierto(false);
  }

  async function onElegirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-elegir el mismo archivo
    if (!file) return;

    if (!MIME_ACEPTADOS.includes(file.type)) {
      toast.error("Formato no válido. Subí una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_IMAGEN_BYTES) {
      toast.error("La imagen supera los 4 MB. Probá con una más liviana.");
      return;
    }

    setSubiendo(true);
    try {
      // El bucket no deja escribir en boletin/ desde el browser: el servidor
      // firma una subida de un solo uso y arma la ruta (ver prepararSubidaImagen).
      const firma = await llamarAccion(() => prepararSubidaImagen(file.type));
      if (fallo(firma)) {
        toast.error(firma.error);
        return;
      }
      const { error } = await supabase.storage
        .from(BUCKET_BOLETIN)
        .uploadToSignedUrl(firma.ruta, firma.token, file, {
          contentType: file.type,
          cacheControl: "2678400",
        });
      if (error) {
        toast.error("No pudimos subir la imagen. Intentá de nuevo.");
        return;
      }
      setBucket(BUCKET_BOLETIN);
      setRutaImagen(firma.ruta);
      setPreviewUrl(urlPublica(BUCKET_BOLETIN, firma.ruta));
    } finally {
      setSubiendo(false);
    }
  }

  function quitarImagen() {
    setBucket(null);
    setRutaImagen(null);
    setPreviewUrl(null);
  }

  async function guardar(estado: EstadoComunicado) {
    if (!titulo.trim()) return toast.error("Poné un título.");
    if (!cuerpo.trim()) return toast.error("Escribí el cuerpo del comunicado.");

    setGuardando(true);
    const datos = {
      titulo: titulo.trim(),
      cuerpo: cuerpo.trim(),
      estado,
      fijado,
      bucket,
      ruta_imagen: rutaImagen,
    };
    const res = await llamarAccion(() =>
      editando ? actualizarComunicado(editando.id, datos) : crearComunicado(datos)
    );
    setGuardando(false);

    if (fallo(res)) return toast.error(res.error);

    toast.success(
      editando
        ? "Comunicado actualizado."
        : estado === "publicado"
        ? "Comunicado publicado."
        : "Borrador guardado."
    );
    setFormAbierto(false);
    refresh();
  }

  async function alternarEstado(c: Comunicado) {
    const nuevo: EstadoComunicado = c.estado === "publicado" ? "borrador" : "publicado";
    setProcesando(c.id);
    const res = await llamarAccion(() => cambiarEstadoComunicado(c.id, nuevo));
    setProcesando(null);
    if (fallo(res)) return toast.error(res.error);
    toast.success(nuevo === "publicado" ? "Publicado." : "Pasado a borrador.");
    refresh();
  }

  async function handleEliminar() {
    if (!confirmarEliminar) return;
    setProcesando(confirmarEliminar.id);
    const res = await llamarAccion(() => eliminarComunicado(confirmarEliminar.id));
    setProcesando(null);
    if (fallo(res)) {
      setConfirmarEliminar(null);
      return toast.error(res.error);
    }
    toast.success("Comunicado eliminado.");
    setConfirmarEliminar(null);
    refresh();
  }

  const filtrados = comunicados.filter((c) => {
    const matchFiltro = filtro === "todos" || c.estado === filtro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q || c.titulo.toLowerCase().includes(q) || c.cuerpo.toLowerCase().includes(q);
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    todos: comunicados.length,
    publicado: comunicados.filter((c) => c.estado === "publicado").length,
    borrador: comunicados.filter((c) => c.estado === "borrador").length,
  };

  const TABS: { key: Filtro; label: string }[] = [
    { key: "todos", label: `Todos (${counts.todos})` },
    { key: "publicado", label: `Publicados (${counts.publicado})` },
    { key: "borrador", label: `Borradores (${counts.borrador})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-sky-600" />
            Boletín UIAB
          </h1>
          <p className="text-slate-500 mt-1">
            Noticias, avisos y fotos que ven las socias en su panel y en la página del boletín.
          </p>
        </div>
        <Button onClick={abrirNuevo} className="bg-sky-600 hover:bg-sky-700 text-white shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Nuevo comunicado
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o texto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {comunicados.length === 0
                ? "Todavía no cargaste ningún comunicado."
                : "No hay comunicados con este filtro."}
            </p>
          </div>
        ) : (
          filtrados.map((c) => {
            const badge = BADGE[c.estado];
            const thumb = urlPublica(c.bucket, c.ruta_imagen);
            const ocupado = procesando === c.id;
            return (
              <Card
                key={c.id}
                className="p-4 flex gap-4 items-start shadow-sm border-slate-100 hover:shadow-md hover:border-sky-200 transition-all"
              >
                {thumb ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                    <Megaphone className="h-6 w-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-900 truncate">{c.titulo}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    {c.fijado && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600">
                        <Pin className="h-3 w-3" /> Fijado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{c.cuerpo}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {c.estado === "publicado"
                      ? `Publicado: ${fecha(c.publicado_en)}`
                      : `Creado: ${fecha(c.creado_en)}`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                    onClick={() => alternarEstado(c)}
                    disabled={ocupado}
                  >
                    {c.estado === "publicado" ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 mr-1" /> Despublicar
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1" /> Publicar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-sky-600"
                    onClick={() => abrirEdicion(c)}
                    disabled={ocupado}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 h-11 w-11 sm:h-9 sm:w-9 p-0"
                    onClick={() => setConfirmarEliminar(c)}
                    disabled={ocupado}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Slide-over: formulario alta / edición */}
      {formAbierto && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={cerrarForm} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="font-bold text-slate-900 truncate">
                  {editando ? "Editar comunicado" : "Nuevo comunicado"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={cerrarForm}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Título</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Nueva ronda de negocios en octubre"
                  maxLength={140}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cuerpo</label>
                <textarea
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  placeholder="Escribí la noticia o el aviso..."
                  rows={7}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Foto <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200">
                    {/* h fija + object-cover: no depende de saber el ratio del archivo */}
                    <div className="relative h-44 w-full bg-slate-100">
                      <Image src={previewUrl} alt="" fill sizes="480px" className="object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={quitarImagen}
                      disabled={subiendo}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Quitar
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-slate-400 transition-colors hover:border-sky-300 hover:text-sky-500">
                    {subiendo ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <ImagePlus className="h-6 w-6" />
                    )}
                    <span className="text-sm font-medium">
                      {subiendo ? "Subiendo..." : "Subir imagen (JPG, PNG o WebP)"}
                    </span>
                    <input
                      type="file"
                      accept={MIME_ACEPTADOS.join(",")}
                      className="hidden"
                      onChange={onElegirImagen}
                      disabled={subiendo}
                    />
                  </label>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fijado}
                  onChange={(e) => setFijado(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-700">
                  <span className="font-semibold">Fijar arriba</span>{" "}
                  <span className="text-slate-400">— lo deja clavado sobre los demás en el feed.</span>
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white/95 border-t border-slate-100 p-5 flex flex-col sm:flex-row gap-3">
              {editando ? (
                <Button
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
                  disabled={guardando || subiendo}
                  onClick={() => guardar(editando.estado)}
                >
                  {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Guardar cambios
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 text-slate-700"
                    disabled={guardando || subiendo}
                    onClick={() => guardar("borrador")}
                  >
                    Guardar borrador
                  </Button>
                  <Button
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
                    disabled={guardando || subiendo}
                    onClick={() => guardar("publicado")}
                  >
                    {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Publicar
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            onClick={() => setConfirmarEliminar(null)}
          />
          <div className="fixed z-50 inset-0 flex items-start justify-center overflow-y-auto p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mt-24 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-1">¿Eliminar comunicado?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Se borra “{confirmarEliminar.titulo}” y su foto. Esta acción es irreversible.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmarEliminar(null)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={procesando === confirmarEliminar.id}
                  onClick={handleEliminar}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
