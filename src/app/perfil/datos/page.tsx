"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { esFichaDeEmpresa, tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import { Button } from "@/components/ui/button";
import { SelectUIAB } from "@/components/ui/select-uiab";
import { Card } from "@/components/ui/card";
import { Save, User, Building, MapPin, Phone, Mail, Globe, FileText, Loader2, Users, Wrench } from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { updateCompanyOrProvider } from "../acciones";
import { toast } from "sonner";
import Image from "next/image";
import { PROVINCIAS_AR, LOCALIDADES_ALMIRANTE_BROWN } from "@/lib/datos/geografia-ar";
import { cn, normalizarSitioWeb, pareceEmail } from "@/lib/utilidades";
import { AvisoConflictosPadronAuto } from "@/modulos/altas/componentes/aviso-conflictos-padron-auto";
import { llamarAccion, fallo } from "@/lib/accion-segura";

// text-base en mobile: abajo de 16px Safari iOS hace zoom solo al enfocar el campo.
const selectCls =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-primary-500";

export default function MiPerfilDatosPage() {
  const { currentUser, refreshUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  // Mensajes en línea de los campos de correo. Reemplazan al cartel nativo del
  // navegador que salía con type="email" (item 2.3 del reporte de Lucas).
  const [erroresEmail, setErroresEmail] = useState<Record<string, string>>({});
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    razon_social: "",
    nombre_comercial: "",
    email: "",
    email_compras: "",
    email_mantenimiento: "",
    telefono: "",
    whatsapp: "",
    sitio_web: "",
    pais: "Argentina",
    provincia: "Buenos Aires",
    localidad: "",
    direccion: "",
    descripcion: "",
    cuit: "",
    cantidad_empleados: "" as string,
    ruta_logo: "",
    bucket_logo: "",
    nombre_logo: "",
    mime_logo: "",
    tamano_logo_bytes: 0 as number | null,
    fecha_inicio_experiencia: "" as string,
  });
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");

  // Extraída del effect para poder recargar cuando la socia resuelve una
  // diferencia con el padrón desde el aviso: si no, el formulario conserva el
  // valor viejo en su estado local y al guardar lo vuelve a pisar.
  const loadData = useCallback(async () => {
    if (!currentUser?.entityId) {
      setFetching(false);
      return;
    }

    // try/finally: el spinner siempre se apaga aunque la query lance.
    try {
      const table = esFichaDeEmpresa(currentUser) ? "empresas" : "proveedores";
      const { data } = await supabase.from(table).select("*").eq("id", currentUser.entityId).single();

      if (data) {
        setFormData({
          razon_social: data.razon_social || "",
          nombre_comercial: data.nombre_comercial || "",
          email: data.email || "",
          email_compras: data.email_compras || "",
          email_mantenimiento: data.email_mantenimiento || "",
          telefono: data.telefono || "",
          whatsapp: data.whatsapp || "",
          sitio_web: data.sitio_web || "",
          pais: data.pais || "Argentina",
          provincia: data.provincia || "Buenos Aires",
          localidad: data.localidad || "",
          direccion: data.direccion || "",
          descripcion: data.descripcion || "",
          cuit: data.cuit || "",
          cantidad_empleados: data.cantidad_empleados != null ? String(data.cantidad_empleados) : "",
          ruta_logo: data.ruta_logo || "",
          bucket_logo: data.bucket_logo || "",
          nombre_logo: data.nombre_logo || "",
          mime_logo: data.mime_logo || "",
          tamano_logo_bytes: data.tamano_logo_bytes || 0,
          fecha_inicio_experiencia: data.fecha_inicio_experiencia || "",
        });
        if (data.bucket_logo && data.ruta_logo) {
          const { data: urlData } = supabase.storage.from(data.bucket_logo).getPublicUrl(data.ruta_logo);
          setLogoPreviewUrl(urlData.publicUrl);
        }
      }
    } catch (err) {
      console.error("[perfil/datos] loadData falló:", err);
    } finally {
      setFetching(false);
    }
  }, [currentUser?.entityId, currentUser?.role, supabase]);

  useEffect(() => {
    // Esperar a que auth esté lista antes de consultar Supabase.
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser.entityId) {
      toast.error("Primero guardá tus datos", {
        description: "Antes de subir el logo completá Razón Social y CUIT y tocá Guardar para crear tu perfil.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Formato inválido", { description: "Solo se permiten imágenes PNG, JPG o WEBP." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagen muy pesada", { description: "El tamaño máximo permitido es 2 MB." });
      return;
    }

    try {
      const BUCKET = "imagenes-publicas";
      const carpeta = esFichaDeEmpresa(currentUser) ? "empresas" : "proveedores";
      const fileExt = (file.name.split(".").pop() || "bin").toLowerCase();
      const filePath = `${carpeta}/${currentUser.entityId}/logo-${Date.now()}.${fileExt}`;

      toast.loading("Subiendo imagen...", { id: "upload-toast" });

      // Borramos el logo anterior si existía (para no acumular basura)
      if (formData.bucket_logo && formData.ruta_logo && formData.ruta_logo !== filePath) {
        await supabase.storage.from(formData.bucket_logo).remove([formData.ruta_logo]);
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        // 31 días: la ruta ya es única por subida (logo-<timestamp>), así que el
        // archivo nunca cambia. Con 1 h, Vercel re-optimizaba cada logo 6 veces al día.
        .upload(filePath, file, { upsert: true, contentType: file.type, cacheControl: "2678400" });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        ruta_logo: filePath,
        bucket_logo: BUCKET,
        nombre_logo: file.name,
        mime_logo: file.type,
        tamano_logo_bytes: file.size,
      }));
      setLogoPreviewUrl(publicUrlData.publicUrl);
      // El archivo ya está en Storage, pero la ficha sigue apuntando al logo
      // viejo hasta que se guarde el formulario. Decir sólo "cargado
      // correctamente" hacía creer que ya estaba listo y la gente se iba de la
      // pantalla sin guardar: el logo quedaba subido y sin usar.
      toast.success("Logotipo cargado — falta guardar", {
        id: "upload-toast",
        description: "Tocá «Guardar Cambios» para que quede en tu ficha.",
      });
    } catch (error: any) {
      toast.error("Error al subir", { description: error.message, id: "upload-toast" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.id) return;

    // Validamos los correos nosotros porque los inputs ya no son type="email":
    // el navegador los validaba con su cartel emergente nativo, que tapaba el
    // bloque "Sede Principal" y bloqueaba el guardado de TODO el formulario
    // (item 2.3 del reporte de Lucas). El mensaje va en línea, debajo del campo.
    const errores: Record<string, string> = {};
    const camposEmail = [
      { clave: "email", etiqueta: "Correo Público", obligatorio: true },
      { clave: "email_compras", etiqueta: "Correo de Compras", obligatorio: false },
      { clave: "email_mantenimiento", etiqueta: "Correo de Mantenimiento", obligatorio: false },
    ] as const;

    for (const campo of camposEmail) {
      const valor = (formData[campo.clave] ?? "").trim();
      if (!valor) {
        if (campo.obligatorio) errores[campo.clave] = "Necesitamos un correo de contacto.";
        continue; // los opcionales vacíos están bien
      }
      if (!pareceEmail(valor)) {
        errores[campo.clave] = "Revisá el correo: le falta el @ o el dominio.";
      }
    }

    setErroresEmail(errores);
    if (Object.keys(errores).length > 0) {
      toast.error("Revisá los correos", {
        description: "Hay un correo mal escrito. Te lo marcamos debajo del campo.",
      });
      return;
    }

    setLoading(true);
    try {
      // Las dos columnas que NO son comunes a `empresas` y `proveedores` salen
      // del spread y cada rama vuelve a agregar sólo la que su tabla tiene.
      //
      // Antes esto se hacía con `delete` sobre el spread completo y sólo cubría
      // un lado: `cantidad_empleados` se quitaba para proveedores, pero
      // `fecha_inicio_experiencia` (que existe únicamente en `proveedores`)
      // viajaba igual en el payload de una empresa. PostgREST cortaba con
      // "Could not find the 'fecha_inicio_experiencia' column of 'empresas'",
      // y parseSupabaseError lo mostraba como "problema de sincronización
      // temporal": ninguna empresa podía guardar su ficha.
      const {
        cantidad_empleados: _cantidadEmpleados,
        fecha_inicio_experiencia: _fechaInicioExperiencia,
        ...comunes
      } = formData;

      const dataToSave: Record<string, unknown> = {
        ...comunes,
        // El socio puede haber mandado Enter sin pasar por el onBlur del campo.
        sitio_web: normalizarSitioWeb(formData.sitio_web),
      };

      if (esFichaDeEmpresa(currentUser)) {
        // cantidad_empleados es entero en `empresas`; recalcula la tarifa vía trigger.
        dataToSave.cantidad_empleados = formData.cantidad_empleados
          ? parseInt(formData.cantidad_empleados, 10)
          : null;
      } else {
        dataToSave.fecha_inicio_experiencia = formData.fecha_inicio_experiencia || null;
        dataToSave.tipo_proveedor = "particular";
        const [primerNombre, ...restoNombre] = (currentUser.name || "").split(" ");
        dataToSave.nombre = primerNombre || "";
        dataToSave.apellido = restoNombre.join(" ") || null;
      }

      const result = await llamarAccion(() => updateCompanyOrProvider(tipoEntidadDe(currentUser)!, currentUser.entityId, currentUser.id, dataToSave));

      if (fallo(result)) {
        toast.error("Error al guardar", { description: result.error });
      } else {
        if (result.newEntityId) {
           // It was a creation, we need AuthContext to reconsider the user
           await refreshUser();
        }
        toast.success("Perfil actualizado", { description: "Tus datos corporativos se han guardado con éxito." });
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error inesperado", { description: error.message || "No se pudo comunicar con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Datos y Contacto</h1>
        <p className="text-slate-500 mt-1">Cómo te ven las demás empresas e industrias en el directorio.</p>
      </div>

      <AvisoConflictosPadronAuto onResuelto={loadData} />

      <Card data-tour="datos-form" className="p-6 border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-slate-100">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
            <div
              data-tour="datos-logo"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all cursor-pointer overflow-hidden group"
            >
              {logoPreviewUrl ? (
                <>
                  <Image src={logoPreviewUrl} alt="Logotipo" fill className="object-contain p-2" unoptimized />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">CAMBIAR</span>
                  </div>
                </>
              ) : esFichaDeEmpresa(currentUser) ? (
                <><Building className="w-8 h-8 mb-1" /><span className="text-[11px] sm:text-[10px] font-semibold tracking-wider uppercase">Subir Logo</span></>
              ) : (
                <><User className="w-8 h-8 mb-1" /><span className="text-[11px] sm:text-[10px] font-semibold tracking-wider uppercase">Subir Logo</span></>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Logotipo del Perfil</h3>
              <p className="text-sm text-slate-500">Recomendado 500x500px, PNG o JPG menores a 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Razón Social</label>
              <input 
                type="text" 
                value={formData.razon_social}
                onChange={e => setFormData({ ...formData, razon_social: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="Nombre legal completo"
              />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> CUIT</label>
               <input
                 type="text"
                 value={formData.cuit}
                 onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                 placeholder="XX-XXXXXXXX-X"
               />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nombre Comercial</label>
              <input
                type="text"
                value={formData.nombre_comercial}
                onChange={e => setFormData({ ...formData, nombre_comercial: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="Nombre que usas comercialmente"
              />
            </div>

            {!esFichaDeEmpresa(currentUser) && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Años de Experiencia</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={
                    formData.fecha_inicio_experiencia
                      ? Math.floor((Date.now() - new Date(formData.fecha_inicio_experiencia).getTime()) / (365.25 * 24 * 3600 * 1000))
                      : ""
                  }
                  onChange={e => {
                    const años = parseInt(e.target.value, 10);
                    if (!Number.isFinite(años) || años < 0) {
                      setFormData({ ...formData, fecha_inicio_experiencia: "" });
                      return;
                    }
                    const fecha = new Date();
                    fecha.setFullYear(fecha.getFullYear() - años);
                    setFormData({ ...formData, fecha_inicio_experiencia: fecha.toISOString().split('T')[0] });
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="Ej: 15"
                />
                <p className="text-xs text-slate-400">Se actualiza automáticamente cada año.</p>
              </div>
            )}

            {esFichaDeEmpresa(currentUser) && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> Cantidad de empleados</label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={formData.cantidad_empleados}
                  onChange={e => setFormData({ ...formData, cantidad_empleados: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="Ej: 45"
                />
                <p className="text-xs text-slate-400">Define tu nivel de tarifa de socio. Se recalcula automáticamente al guardar.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> Correo Público</label>
              {/* type="text", no "email": con type="email" el navegador mostraba su
                  cartel emergente nativo, que tapaba "Sede Principal" y bloqueaba el
                  submit del formulario entero. Lo validamos en handleSave. */}
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                aria-invalid={Boolean(erroresEmail.email)}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  "w-full px-4 py-2 bg-slate-50 border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all",
                  erroresEmail.email
                    ? "border-rose-300 focus:ring-rose-500"
                    : "border-slate-200 focus:ring-primary-500"
                )}
                placeholder="contacto@empresa.com"
              />
              {erroresEmail.email && (
                <p className="text-xs font-medium text-rose-600">{erroresEmail.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> Correo de Compras
                <span className="text-sm font-normal text-slate-400 ml-1">(Opcional)</span>
              </label>
              <input
                type="text"
                inputMode="email"
                aria-invalid={Boolean(erroresEmail.email_compras)}
                value={formData.email_compras}
                onChange={e => setFormData({ ...formData, email_compras: e.target.value })}
                className={cn(
                  "w-full px-4 py-2 bg-slate-50 border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all",
                  erroresEmail.email_compras
                    ? "border-rose-300 focus:ring-rose-500"
                    : "border-slate-200 focus:ring-primary-500"
                )}
                placeholder="compras@empresa.com"
              />
              {erroresEmail.email_compras ? (
                <p className="text-xs font-medium text-rose-600">{erroresEmail.email_compras}</p>
              ) : (
                <p className="text-xs text-slate-400">Si lo cargás, se muestra en tu ficha del directorio para consultas de compras.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-slate-400" /> Correo de Mantenimiento
                <span className="text-sm font-normal text-slate-400 ml-1">(Opcional)</span>
              </label>
              <input
                type="text"
                inputMode="email"
                aria-invalid={Boolean(erroresEmail.email_mantenimiento)}
                value={formData.email_mantenimiento}
                onChange={e => setFormData({ ...formData, email_mantenimiento: e.target.value })}
                className={cn(
                  "w-full px-4 py-2 bg-slate-50 border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all",
                  erroresEmail.email_mantenimiento
                    ? "border-rose-300 focus:ring-rose-500"
                    : "border-slate-200 focus:ring-primary-500"
                )}
                placeholder="mantenimiento@empresa.com"
              />
              {erroresEmail.email_mantenimiento ? (
                <p className="text-xs font-medium text-rose-600">{erroresEmail.email_mantenimiento}</p>
              ) : (
                <p className="text-xs text-slate-400">Si lo cargás, se muestra en tu ficha del directorio para consultas técnicas y de mantenimiento.</p>
              )}
            </div>

            {/* Teléfono unificado: un solo número, con toggle WhatsApp */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" /> Teléfono de Contacto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.whatsapp || formData.telefono}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value, telefono: e.target.value })}
                  /* `min-w-0`: sin esto el `flex-1` no baja del ancho de su
                     propio contenido y en 360px el chip de WhatsApp empujaba
                     el documento entero 23px hacia la derecha. */
                  className="flex-1 min-w-0 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="+54 9 11 XXXX-XXXX"
                />
                {/* Badge visual WhatsApp — siempre activo, solo informativo */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold shrink-0 select-none">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-emerald-600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </div>
              </div>
              <p className="text-xs text-slate-400">Este número se muestra como contacto directo en tu ficha del directorio.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Globe className="w-4 h-4 text-slate-400" /> Sitio Web <span className="text-sm font-normal text-slate-400 ml-1">(Opcional)</span></label>
              {/* type="text", no "url": con type="url" el browser bloqueaba el
                  submit del formulario entero si el socio escribía
                  "www.miempresa.com". El https:// lo ponemos nosotros al salir
                  del campo (y de nuevo al guardar, por las dudas). */}
              <input
                type="text"
                inputMode="url"
                value={formData.sitio_web}
                onChange={e => setFormData({ ...formData, sitio_web: e.target.value })}
                onBlur={e => setFormData({ ...formData, sitio_web: normalizarSitioWeb(e.target.value) ?? "" })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="www.miempresa.com"
              />
              <p className="text-xs text-slate-400">Podés escribirlo sin https://, lo completamos nosotros.</p>
            </div>

            {/* Ubicación Agrupada */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100">
               <h4 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-600" /> Sede Principal <span className="text-sm font-normal text-slate-400 ml-2">(Opcional)</span></h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Localidad</label>
                    <SelectUIAB
                      ariaLabel="Localidad"
                      placeholder="Seleccioná una localidad…"
                      value={formData.localidad}
                      onValueChange={(v) => setFormData({ ...formData, localidad: v })}
                      className={selectCls}
                      options={[
                        ...(formData.localidad && !LOCALIDADES_ALMIRANTE_BROWN.includes(formData.localidad as never)
                          ? [{ value: formData.localidad, label: formData.localidad }]
                          : []),
                        ...LOCALIDADES_ALMIRANTE_BROWN.map((l) => ({ value: l, label: l })),
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Provincia</label>
                    <SelectUIAB
                      ariaLabel="Provincia"
                      placeholder="Seleccioná una provincia…"
                      value={formData.provincia}
                      onValueChange={(v) => setFormData({ ...formData, provincia: v })}
                      className={selectCls}
                      options={[
                        ...(formData.provincia && !PROVINCIAS_AR.includes(formData.provincia as never)
                          ? [{ value: formData.provincia, label: formData.provincia }]
                          : []),
                        ...PROVINCIAS_AR.map((p) => ({ value: p, label: p })),
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Dirección</label>
                    <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:border-primary-500" placeholder="Calle, Lote, Planta..." />
                  </div>
               </div>
            </div>

             <div className="space-y-2 md:col-span-2 border-t border-slate-100 pt-4">
              <label className="text-sm font-semibold text-slate-700">Acerca de nosotros (Resumen Industrial)</label>
              <textarea 
                rows={4}
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
              />
              <p className="text-xs text-slate-400 text-right">Escribe qué hacen y cuáles son sus fuertes para destacar.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
             <Button data-tour="datos-guardar" type="submit" disabled={loading} className="gap-2 bg-primary-600 hover:bg-primary-700 w-full sm:w-auto h-11 px-8 rounded-xl shadow-sm text-sm font-medium">
               {loading ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <Save className="w-4 h-4" />
               )}
               {loading ? "Guardando..." : "Guardar Cambios"}
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
