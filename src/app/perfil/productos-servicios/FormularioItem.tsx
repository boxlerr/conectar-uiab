"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PackageSearch,
  Package,
  Wrench,
  ImagePlus,
  Trash2,
  Star,
  Link as LinkIcon,
  FileText,
  Youtube,
  Globe,
  BookOpen,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Tag as TagIcon,
  Info,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import {
  createItem,
  updateItem,
  getCategorias,
  registrarImagenItem,
  eliminarImagenItem,
  reordenarImagenesItem,
  type EnlaceItem,
  type ItemPayload,
} from "./acciones";
import { toast } from "sonner";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";

interface FormularioItemProps {
  itemInit?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

type ImagenRemota = {
  id: string;
  bucket: string;
  ruta_archivo: string;
  texto_alternativo: string | null;
  orden: number;
  publicUrl: string;
};

type ImagenLocal = {
  localId: string;
  file: File;
  previewUrl: string;
  alt: string;
};

const TIPOS_ENLACE: Array<{
  value: EnlaceItem["tipo"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "web", label: "Sitio web", icon: Globe },
  { value: "video", label: "Video", icon: Youtube },
  { value: "ficha", label: "Ficha técnica", icon: FileText },
  { value: "catalogo", label: "Catálogo", icon: BookOpen },
  { value: "otro", label: "Otro", icon: LinkIcon },
];

const UNIDADES_SUGERIDAS = [
  "Unidad",
  "Hora",
  "Servicio",
  "m²",
  "m³",
  "metro lineal",
  "kg",
  "tonelada",
  "litro",
  "día",
  "mes",
  "proyecto",
];

const MAX_IMAGENES = 6;
const BUCKET = "imagenes-publicas";

export function FormularioItem({ itemInit, onSuccess, onCancel }: FormularioItemProps) {
  const { currentUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);

  const [categorias, setCategorias] = useState<
    Array<{ id: string; nombre: string; categoria_padre_id: string | null }>
  >([]);

  const [tipo_item, setTipoItem] = useState<"producto" | "servicio">(
    itemInit?.tipo_item === "servicio" ? "servicio" : "producto"
  );
  const [nombre, setNombre] = useState<string>(itemInit?.nombre || itemInit?.titulo || "");
  const [descCorta, setDescCorta] = useState<string>(itemInit?.descripcion_corta || "");
  const [descLarga, setDescLarga] = useState<string>(
    itemInit?.descripcion_larga || itemInit?.descripcion || ""
  );
  const [unidad, setUnidad] = useState<string>(itemInit?.unidad || "");
  const [sku, setSku] = useState<string>(itemInit?.sku || "");
  const [categoriaId, setCategoriaId] = useState<string>(itemInit?.categoria_id || "");

  const [precio, setPrecio] = useState<string>(
    itemInit?.precio != null ? String(itemInit.precio) : ""
  );
  const [moneda, setMoneda] = useState<string>(itemInit?.moneda || "ARS");
  const [precioAConsultar, setPrecioAConsultar] = useState<boolean>(!!itemInit?.precio_a_consultar);

  const [destacado, setDestacado] = useState<boolean>(!!itemInit?.destacado);
  const [estado, setEstado] = useState<"borrador" | "publicado">(
    itemInit?.estado === "borrador" ? "borrador" : "publicado"
  );

  const [enlaces, setEnlaces] = useState<EnlaceItem[]>(
    Array.isArray(itemInit?.enlaces) ? itemInit.enlaces : []
  );
  const [nuevoEnlaceTipo, setNuevoEnlaceTipo] = useState<EnlaceItem["tipo"]>("web");
  const [nuevoEnlaceUrl, setNuevoEnlaceUrl] = useState("");

  const [palabrasClave, setPalabrasClave] = useState<string[]>(
    Array.isArray(itemInit?.palabras_clave) ? itemInit.palabras_clave : []
  );
  const [tagInput, setTagInput] = useState("");

  const [imagenesRemotas, setImagenesRemotas] = useState<ImagenRemota[]>([]);
  const [imagenesLocales, setImagenesLocales] = useState<ImagenLocal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategorias().then((c) => setCategorias(c as any));
  }, []);

  useEffect(() => {
    if (Array.isArray(itemInit?.imagenes) && itemInit.imagenes.length > 0) {
      const conUrl: ImagenRemota[] = itemInit.imagenes
        .slice()
        .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((img: any) => {
          const { data } = supabase.storage.from(img.bucket).getPublicUrl(img.ruta_archivo);
          return {
            id: img.id,
            bucket: img.bucket,
            ruta_archivo: img.ruta_archivo,
            texto_alternativo: img.texto_alternativo,
            orden: img.orden ?? 0,
            publicUrl: data.publicUrl,
          };
        });
      setImagenesRemotas(conUrl);
    }
  }, [itemInit, supabase]);

  useEffect(() => {
    return () => {
      imagenesLocales.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalImagenes = imagenesRemotas.length + imagenesLocales.length;

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const nuevas: ImagenLocal[] = [];
    const disponible = MAX_IMAGENES - totalImagenes;
    const aprocesar = Array.from(files).slice(0, disponible);
    for (const file of aprocesar) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 6 * 1024 * 1024) {
        toast.error(`"${file.name}" supera los 6 MB.`);
        continue;
      }
      nuevas.push({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        alt: "",
      });
    }
    if (nuevas.length === 0) return;
    setImagenesLocales((prev) => [...prev, ...nuevas]);
    if (aprocesar.length < files.length) {
      toast.warning(`Máximo ${MAX_IMAGENES} imágenes.`);
    }
  }

  function eliminarLocal(localId: string) {
    setImagenesLocales((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }

  async function eliminarRemota(id: string) {
    const res = await eliminarImagenItem(id);
    if (res?.error) {
      toast.error("No se pudo eliminar la imagen", { description: res.error });
      return;
    }
    setImagenesRemotas((prev) => prev.filter((i) => i.id !== id));
    toast.success("Imagen eliminada");
  }

  function moverRemota(index: number, delta: number) {
    setImagenesRemotas((prev) => {
      const next = prev.slice();
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next.map((it, i) => ({ ...it, orden: i }));
    });
  }

  function moverLocal(index: number, delta: number) {
    setImagenesLocales((prev) => {
      const next = prev.slice();
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function agregarEnlace() {
    const raw = nuevoEnlaceUrl.trim();
    if (!raw) {
      toast.error("La URL es obligatoria.");
      return;
    }
    const normalizada = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      new URL(normalizada);
    } catch {
      toast.error("URL inválida.");
      return;
    }
    setEnlaces((prev) => [
      ...prev,
      {
        tipo: nuevoEnlaceTipo,
        etiqueta: tipoEnlaceLabel(nuevoEnlaceTipo),
        url: normalizada,
      },
    ]);
    setNuevoEnlaceTipo("web");
    setNuevoEnlaceUrl("");
  }

  function quitarEnlace(i: number) {
    setEnlaces((prev) => prev.filter((_, idx) => idx !== i));
  }

  function agregarTag() {
    const raw = tagInput.trim().replace(/,+$/, "");
    if (!raw) return;
    if (palabrasClave.includes(raw)) {
      setTagInput("");
      return;
    }
    if (palabrasClave.length >= 12) {
      toast.warning("Máximo 12 palabras clave.");
      return;
    }
    setPalabrasClave((prev) => [...prev, raw]);
    setTagInput("");
  }

  function quitarTag(t: string) {
    setPalabrasClave((prev) => prev.filter((x) => x !== t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser?.entityId) return;
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload: ItemPayload = {
        nombre: nombre.trim(),
        tipo_item,
        descripcion_corta: descCorta.trim() || undefined,
        descripcion_larga: descLarga.trim() || undefined,
        unidad: unidad.trim() || undefined,
        sku: sku.trim() || undefined,
        categoria_id: categoriaId || null,
        precio: precio ? Number(precio) : null,
        moneda,
        precio_a_consultar: precioAConsultar,
        destacado,
        estado,
        enlaces,
        palabras_clave: palabrasClave,
      };

      let itemId = itemInit?.id as string | undefined;

      if (itemId) {
        const res = await updateItem(itemId, payload);
        if (res?.error) {
          toast.error("Error al guardar", { description: res.error });
          return;
        }
      } else {
        const res = await createItem(
          currentUser.role as "company" | "provider",
          currentUser.entityId,
          payload
        );
        if (res?.error || !res?.id) {
          toast.error("Error al crear", { description: res?.error });
          return;
        }
        itemId = res.id;
      }

      if (imagenesLocales.length > 0 && itemId) {
        let orden = imagenesRemotas.length;
        for (const img of imagenesLocales) {
          const ext = (img.file.name.split(".").pop() || "bin").toLowerCase();
          const path = `items/${itemId}/${Date.now()}-${orden}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, img.file, { contentType: img.file.type, cacheControl: "3600" });
          if (upErr) {
            toast.error(`No se pudo subir "${img.file.name}"`, { description: upErr.message });
            continue;
          }
          await registrarImagenItem({
            item_id: itemId,
            bucket: BUCKET,
            ruta_archivo: path,
            nombre_archivo: img.file.name,
            mime_type: img.file.type,
            tamano_bytes: img.file.size,
            texto_alternativo: img.alt || undefined,
            orden: orden++,
          });
        }
      }

      if (imagenesRemotas.length > 0) {
        await reordenarImagenesItem(imagenesRemotas.map((im, i) => ({ id: im.id, orden: i })));
      }

      toast.success(itemInit ? "Actualizado con éxito" : "Creado con éxito");
      onSuccess();
    } catch (err: any) {
      toast.error("Error inesperado", { description: err?.message || String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Encabezado */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <PackageSearch className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900">
                {itemInit ? "Editar ítem" : "Nuevo producto o servicio"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Completá los detalles técnicos, comerciales y visuales para publicarlo en tu
                catálogo.
              </p>
            </div>
          </div>

          {/* Selector tipo */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoItem("producto")}
              className={cls(
                "group rounded-lg border p-4 text-left transition-all",
                tipo_item === "producto"
                  ? "border-primary-500 bg-primary-50/60 ring-1 ring-primary-500"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Package
                  className={cls(
                    "w-4 h-4",
                    tipo_item === "producto" ? "text-primary-600" : "text-slate-400"
                  )}
                />
                <span className="font-semibold text-slate-900 text-sm">Producto</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Bienes tangibles, materiales, insumos.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setTipoItem("servicio")}
              className={cls(
                "group rounded-lg border p-4 text-left transition-all",
                tipo_item === "servicio"
                  ? "border-primary-500 bg-primary-50/60 ring-1 ring-primary-500"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Wrench
                  className={cls(
                    "w-4 h-4",
                    tipo_item === "servicio" ? "text-primary-600" : "text-slate-400"
                  )}
                />
                <span className="font-semibold text-slate-900 text-sm">Servicio</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Trabajos, mantenimiento, consultoría.
              </p>
            </button>
          </div>
        </div>

        {/* Sección: Información básica */}
        <Seccion titulo="Información básica" icon={Info}>
          <Campo label="Nombre" required>
            <input
              type="text"
              className={inputCls}
              placeholder={
                tipo_item === "producto"
                  ? "Ej. Tornería cilíndrica de precisión CNC"
                  : "Ej. Mantenimiento preventivo de compresores"
              }
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
              required
            />
            <ContadorChars value={nombre} max={120} />
          </Campo>

          <Campo
            label="Descripción corta"
            hint="Un gancho breve para listados y búsquedas."
          >
            <input
              type="text"
              className={inputCls}
              placeholder="Ej. Piezas mecanizadas con tolerancias de hasta ±0.01 mm."
              value={descCorta}
              onChange={(e) => setDescCorta(e.target.value)}
              maxLength={180}
            />
            <ContadorChars value={descCorta} max={180} />
          </Campo>

          <Campo label="Descripción detallada">
            <textarea
              className={cls(inputCls, "min-h-[140px] resize-y")}
              placeholder="Especificaciones técnicas, capacidades, materiales aceptados, tiempos de entrega, condiciones..."
              value={descLarga}
              onChange={(e) => setDescLarga(e.target.value)}
            />
          </Campo>
        </Seccion>

        {/* Sección: Clasificación */}
        <Seccion titulo="Clasificación" icon={TagIcon}>
          <Campo label="Categoría">
            <CategoriaCombobox
              value={categoriaId}
              onChange={setCategoriaId}
              categorias={categorias}
            />
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="SKU / Código interno">
              <input
                type="text"
                className={inputCls}
                placeholder="Ej. TRN-CNC-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                maxLength={40}
              />
            </Campo>

            {tipo_item === "producto" && (
              <Campo label="Unidad de venta">
                <input
                  type="text"
                  list="unidades-sugeridas"
                  className={inputCls}
                  placeholder="Ej. kg, m², unidad..."
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                />
                <datalist id="unidades-sugeridas">
                  {UNIDADES_SUGERIDAS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </Campo>
            )}
          </div>

          <Campo label="Palabras clave" hint="Mejoran las búsquedas. Presioná Enter o coma para agregar.">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
              <div className="flex flex-wrap gap-1.5 mb-2 empty:hidden">
                {palabrasClave.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded-md shadow-sm"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => quitarTag(t)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label={`Quitar ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                placeholder={palabrasClave.length === 0 ? "Ej. aluminio, tornería, CNC..." : "Agregar más..."}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    agregarTag();
                  } else if (e.key === "Backspace" && !tagInput && palabrasClave.length) {
                    setPalabrasClave((prev) => prev.slice(0, -1));
                  }
                }}
              />
            </div>
          </Campo>
        </Seccion>

        {/* Sección: Precio */}
        <Seccion titulo="Precio de referencia" icon={TagIcon}>
          <div className="flex items-center gap-2 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={precioAConsultar}
                onChange={(e) => setPrecioAConsultar(e.target.checked)}
              />
              Precio a consultar
            </label>
          </div>

          {!precioAConsultar && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-3">
              <Campo label="Monto">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
                    {moneda === "USD" ? "US$" : "$"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className={cls(inputCls, "pl-10")}
                    placeholder="0.00"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
              </Campo>
              <Campo label="Moneda">
                <select
                  className={inputCls}
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Campo>
            </div>
          )}
        </Seccion>

        {/* Sección: Imágenes */}
        <Seccion
          titulo="Galería"
          icon={ImagePlus}
          hint={`${totalImagenes}/${MAX_IMAGENES} imágenes. La primera es la portada.`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imagenesRemotas.map((img, i) => (
              <ImagenCard
                key={img.id}
                src={img.publicUrl}
                alt={img.texto_alternativo || ""}
                isPortada={i === 0}
                onDelete={() => eliminarRemota(img.id)}
                onUp={i > 0 ? () => moverRemota(i, -1) : undefined}
                onDown={i < imagenesRemotas.length - 1 ? () => moverRemota(i, 1) : undefined}
              />
            ))}
            {imagenesLocales.map((img, i) => (
              <ImagenCard
                key={img.localId}
                src={img.previewUrl}
                alt={img.alt}
                isPortada={imagenesRemotas.length === 0 && i === 0}
                onDelete={() => eliminarLocal(img.localId)}
                onUp={i > 0 ? () => moverLocal(i, -1) : undefined}
                onDown={i < imagenesLocales.length - 1 ? () => moverLocal(i, 1) : undefined}
                pending
              />
            ))}

            {totalImagenes < MAX_IMAGENES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-primary-50/50 hover:border-primary-400 flex flex-col items-center justify-center text-slate-500 hover:text-primary-600 transition-all"
              >
                <ImagePlus className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">Agregar imagen</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG · máx 6 MB</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </Seccion>

        {/* Sección: Enlaces */}
        <Seccion
          titulo="Enlaces externos"
          icon={LinkIcon}
          hint="Sumá ficha técnica, video demo, catálogo PDF o tu landing del producto."
        >
          {enlaces.length > 0 && (
            <ul className="space-y-2 mb-4">
              {enlaces.map((en, i) => {
                const Icon =
                  TIPOS_ENLACE.find((t) => t.value === en.tipo)?.icon || LinkIcon;
                return (
                  <li
                    key={i}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-0"
                  >
                    <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {en.etiqueta}
                      </div>
                      <a
                        href={en.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary-600 hover:underline truncate block"
                      >
                        {en.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarEnlace(i)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                      aria-label="Quitar enlace"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              {TIPOS_ENLACE.map((t) => {
                const Icon = t.icon;
                const active = nuevoEnlaceTipo === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNuevoEnlaceTipo(t.value)}
                    className={cls(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                      active
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                className={cls(inputCls, "flex-1 min-w-0")}
                placeholder="https://ejemplo.com/ficha.pdf"
                value={nuevoEnlaceUrl}
                onChange={(e) => setNuevoEnlaceUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarEnlace();
                  }
                }}
              />
              <Button
                type="button"
                onClick={agregarEnlace}
                className="bg-primary-600 hover:bg-primary-700 text-white shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </Button>
            </div>
          </div>
        </Seccion>

        {/* Sección: Visibilidad */}
        <Seccion titulo="Visibilidad" icon={Eye}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEstado("publicado")}
              className={cls(
                "relative rounded-lg p-4 text-left transition-all",
                estado === "publicado"
                  ? "bg-primary-50 ring-1 ring-primary-500"
                  : "bg-slate-50 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Eye
                  className={cls(
                    "w-4 h-4",
                    estado === "publicado" ? "text-primary-600" : "text-slate-400"
                  )}
                />
                <span className="font-semibold text-slate-900 text-sm">Publicado</span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Visible en el catálogo público y búsquedas del directorio.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEstado("borrador")}
              className={cls(
                "relative rounded-lg p-4 text-left transition-all",
                estado === "borrador"
                  ? "bg-slate-200 ring-1 ring-slate-500"
                  : "bg-slate-50 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <EyeOff
                  className={cls(
                    "w-4 h-4",
                    estado === "borrador" ? "text-slate-700" : "text-slate-400"
                  )}
                />
                <span className="font-semibold text-slate-900 text-sm">Borrador</span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Solo vos lo ves. Guardalo para seguir editándolo más tarde.
              </p>
            </button>
          </div>
        </Seccion>

        {/* Sección: Destacar */}
        <Seccion titulo="Destacar" icon={Star}>
          <div>
            <button
              type="button"
              onClick={() => setDestacado(!destacado)}
              className={cls(
                "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                destacado
                  ? "border-amber-400 bg-amber-50/70"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div
                className={cls(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  destacado ? "bg-amber-400" : "bg-slate-100"
                )}
              >
                <Star
                  className={cls(
                    "w-5 h-5",
                    destacado ? "text-white fill-white" : "text-slate-400"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    Destacar en el catálogo
                  </span>
                  {destacado && (
                    <span className="text-[10px] font-bold uppercase bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aparece primero y se muestra con una insignia dorada en las tarjetas.
                </p>
              </div>
              <div
                className={cls(
                  "relative w-10 h-6 rounded-full transition-colors shrink-0",
                  destacado ? "bg-amber-500" : "bg-slate-300"
                )}
              >
                <span
                  className={cls(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    destacado ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </div>
            </button>
          </div>
        </Seccion>

        {/* Footer acciones */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px] shadow-[0_4px_12px_rgba(14,165,233,0.25)] border-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {itemInit ? "Guardar cambios" : "Crear ítem"}
          </Button>
        </div>
      </form>

      {/* Preview lateral */}
      <aside className="lg:sticky lg:top-24 h-fit self-start z-10">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Vista previa
            </span>
          </div>

          <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
            {(() => {
              const portada =
                imagenesRemotas[0]?.publicUrl || imagenesLocales[0]?.previewUrl;
              if (portada) {
                return (
                  <Image
                    key={portada}
                    src={portada}
                    alt={nombre || "Portada"}
                    fill
                    sizes="(min-width: 1024px) 340px, 100vw"
                    className="object-cover"
                    unoptimized
                  />
                );
              }
              return (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <ImagePlus className="w-10 h-10" />
                </div>
              );
            })()}

            {destacado && (
              <div className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> DESTACADO
              </div>
            )}
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
              {tipo_item}
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h3 className="font-bold text-slate-900 leading-tight line-clamp-2">
              {nombre || <span className="text-slate-400">Nombre del ítem</span>}
            </h3>
            {descCorta && (
              <p className="text-xs text-slate-500 line-clamp-2">{descCorta}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {precioAConsultar ? (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  A consultar
                </span>
              ) : precio ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                  {moneda === "USD" ? "US$" : "$"}{" "}
                  {Number(precio).toLocaleString("es-AR")}
                  {tipo_item === "producto" && unidad && (
                    <span className="font-normal"> / {unidad}</span>
                  )}
                </span>
              ) : null}
              {sku && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {sku}
                </span>
              )}
            </div>

            {palabrasClave.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {palabrasClave.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-secondary-100 text-secondary-800 px-1.5 py-0.5 rounded"
                  >
                    #{t}
                  </span>
                ))}
                {palabrasClave.length > 4 && (
                  <span className="text-[10px] text-slate-500">
                    +{palabrasClave.length - 4}
                  </span>
                )}
              </div>
            )}

            {enlaces.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {enlaces.map((en, i) => {
                  const Icon =
                    TIPOS_ENLACE.find((t) => t.value === en.tipo)?.icon || LinkIcon;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      <Icon className="w-3 h-3" />
                      {en.etiqueta}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 px-1 leading-relaxed">
          Así se verá la tarjeta de tu {tipo_item} en el catálogo. Los cambios se reflejan en
          vivo mientras editás.
        </div>
      </aside>
    </div>
  );
}

/* ---------- Primitivos de UI locales ---------- */

const inputCls =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-400";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function tipoEnlaceLabel(t: EnlaceItem["tipo"]) {
  return TIPOS_ENLACE.find((x) => x.value === t)?.label || "Enlace";
}

function Seccion({
  titulo,
  icon: Icon,
  hint,
  children,
}: {
  titulo: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-slate-900 text-sm tracking-tight">{titulo}</h3>
        </div>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Campo({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500 normal-case">*</span>}
        </label>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function ContadorChars({ value, max }: { value: string; max: number }) {
  const left = max - value.length;
  const color = left < 20 ? "text-amber-600" : "text-slate-400";
  return (
    <div className={cls("text-[10px] text-right", color)}>
      {value.length}/{max}
    </div>
  );
}

function CategoriaCombobox({
  value,
  onChange,
  categorias,
}: {
  value: string;
  onChange: (v: string) => void;
  categorias: Array<{ id: string; nombre: string; categoria_padre_id: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const seleccionada = categorias.find((c) => c.id === value);
  const padreDe = (c: { categoria_padre_id: string | null }) =>
    c.categoria_padre_id ? categorias.find((x) => x.id === c.categoria_padre_id) : null;

  const q = query.trim().toLowerCase();
  const filtradas = q
    ? categorias.filter((c) => {
        const padre = padreDe(c);
        return (
          c.nombre.toLowerCase().includes(q) ||
          (padre?.nombre.toLowerCase().includes(q) ?? false)
        );
      })
    : categorias;

  const raices = filtradas.filter((c) => !c.categoria_padre_id);
  const hijasDe = (id: string) => filtradas.filter((c) => c.categoria_padre_id === id);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cls(inputCls, "flex items-center justify-between text-left")}
      >
        <span className={cls("truncate", !seleccionada && "text-slate-400")}>
          {seleccionada ? seleccionada.nombre : "Seleccioná una categoría"}
        </span>
        <span className="ml-2 text-slate-400 shrink-0">
          {value ? (
            <X
              className="w-4 h-4 hover:text-rose-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Buscar categoría..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {raices.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                Sin coincidencias.
              </div>
            )}
            {raices.map((raiz) => {
              const hijas = hijasDe(raiz.id);
              return (
                <div key={raiz.id} className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    {raiz.nombre}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(raiz.id);
                      setOpen(false);
                    }}
                    className={cls(
                      "w-full text-left px-3 py-1.5 text-sm hover:bg-primary-50 flex items-center gap-2",
                      value === raiz.id && "bg-primary-50 text-primary-700 font-semibold"
                    )}
                  >
                    <span className="text-slate-400 text-xs">—</span>
                    General
                  </button>
                  {hijas.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        onChange(h.id);
                        setOpen(false);
                      }}
                      className={cls(
                        "w-full text-left px-3 py-1.5 text-sm hover:bg-primary-50 flex items-center gap-2",
                        value === h.id && "bg-primary-50 text-primary-700 font-semibold"
                      )}
                    >
                      <span className="text-slate-300 text-xs ml-2">↳</span>
                      {h.nombre}
                    </button>
                  ))}
                </div>
              );
            })}
            {q &&
              filtradas.length > 0 &&
              raices.length === 0 &&
              filtradas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
                >
                  {padreDe(c)?.nombre && (
                    <span className="text-[10px] text-slate-400 mr-1">
                      {padreDe(c)!.nombre} ›
                    </span>
                  )}
                  {c.nombre}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImagenCard({
  src,
  alt,
  isPortada,
  onDelete,
  onUp,
  onDown,
  pending,
}: {
  src: string;
  alt: string;
  isPortada: boolean;
  onDelete: () => void;
  onUp?: () => void;
  onDown?: () => void;
  pending?: boolean;
}) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />

      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1 pointer-events-none">
        {isPortada ? (
          <span className="bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
            Portada
          </span>
        ) : (
          <span />
        )}
        {pending && (
          <span className="bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">
            Pendiente
          </span>
        )}
      </div>

      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        {onUp && (
          <button
            type="button"
            onClick={onUp}
            className="p-1.5 bg-white rounded shadow hover:bg-slate-100"
            aria-label="Subir"
          >
            <ArrowUp className="w-3.5 h-3.5 text-slate-700" />
          </button>
        )}
        {onDown && (
          <button
            type="button"
            onClick={onDown}
            className="p-1.5 bg-white rounded shadow hover:bg-slate-100"
            aria-label="Bajar"
          >
            <ArrowDown className="w-3.5 h-3.5 text-slate-700" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 bg-white rounded shadow hover:bg-rose-50"
          aria-label="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
        </button>
      </div>
    </div>
  );
}
