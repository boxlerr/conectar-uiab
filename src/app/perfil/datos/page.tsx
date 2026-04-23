"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, User, Building, MapPin, Phone, Mail, Globe, FileText, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { updateCompanyOrProvider } from "../acciones";
import { toast } from "sonner";
import Image from "next/image";

export default function MiPerfilDatosPage() {
  const { currentUser, refreshUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    razon_social: "",
    nombre_comercial: "",
    email: "",
    telefono: "",
    whatsapp: "",
    sitio_web: "",
    pais: "Argentina",
    provincia: "Buenos Aires",
    localidad: "",
    direccion: "",
    descripcion: "",
    cuit: "",
    ruta_logo: "",
    bucket_logo: "",
    nombre_logo: "",
    mime_logo: "",
    tamano_logo_bytes: 0 as number | null,
    fecha_inicio_experiencia: "" as string,
  });
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");

  useEffect(() => {
    // Esperar a que auth esté lista antes de consultar Supabase.
    if (authLoading) return;

    async function loadData() {
      if (!currentUser?.entityId) {
        setFetching(false);
        return;
      }
      
      const table = currentUser.role === "company" ? "empresas" : "proveedores";
      const { data, error } = await supabase.from(table).select("*").eq("id", currentUser.entityId).single();
      
      if (data) {
        setFormData({
          razon_social: data.razon_social || "",
          nombre_comercial: data.nombre_comercial || "",
          email: data.email || "",
          telefono: data.telefono || "",
          whatsapp: data.whatsapp || "",
          sitio_web: data.sitio_web || "",
          pais: data.pais || "Argentina",
          provincia: data.provincia || "Buenos Aires",
          localidad: data.localidad || "",
          direccion: data.direccion || "",
          descripcion: data.descripcion || "",
          cuit: data.cuit || "",
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
      setFetching(false);
    }
    loadData();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

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
      const carpeta = currentUser.role === "company" ? "empresas" : "proveedores";
      const fileExt = (file.name.split(".").pop() || "bin").toLowerCase();
      const filePath = `${carpeta}/${currentUser.entityId}/logo-${Date.now()}.${fileExt}`;

      toast.loading("Subiendo imagen...", { id: "upload-toast" });

      // Borramos el logo anterior si existía (para no acumular basura)
      if (formData.bucket_logo && formData.ruta_logo && formData.ruta_logo !== filePath) {
        await supabase.storage.from(formData.bucket_logo).remove([formData.ruta_logo]);
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

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
      toast.success("Logotipo cargado correctamente", { id: "upload-toast" });
    } catch (error: any) {
      toast.error("Error al subir", { description: error.message, id: "upload-toast" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.id) return;

    setLoading(true);
    try {
      // Filter data based on user role to avoid sending non-existent columns
      const dataToSave = { ...formData };

      if (currentUser.role !== "company") {
        (dataToSave as any).tipo_proveedor = "particular";
        const [primerNombre, ...restoNombre] = (currentUser.name || "").split(" ");
        (dataToSave as any).nombre = primerNombre || "";
        (dataToSave as any).apellido = restoNombre.join(" ") || null;
        (dataToSave as any).fecha_inicio_experiencia = formData.fecha_inicio_experiencia || null;
      }

      const result = await updateCompanyOrProvider(currentUser.role as any, currentUser.entityId, currentUser.id, dataToSave);

      if (result.error) {
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

      <Card data-tour="datos-form" className="p-6 border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">

          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
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
                  <Image src={logoPreviewUrl} alt="Logotipo" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">CAMBIAR</span>
                  </div>
                </>
              ) : currentUser.role === 'company' ? (
                <><Building className="w-8 h-8 mb-1" /><span className="text-[10px] font-semibold tracking-wider uppercase">Subir Logo</span></>
              ) : (
                <><User className="w-8 h-8 mb-1" /><span className="text-[10px] font-semibold tracking-wider uppercase">Subir Logo</span></>
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
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="Nombre legal completo"
              />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> CUIT</label>
               <input
                 type="text"
                 value={formData.cuit}
                 onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                 placeholder="XX-XXXXXXXX-X"
               />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nombre Comercial</label>
              <input
                type="text"
                value={formData.nombre_comercial}
                onChange={e => setFormData({ ...formData, nombre_comercial: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="Nombre que usas comercialmente"
              />
            </div>

            {currentUser.role !== "company" && (
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  placeholder="Ej: 15"
                />
                <p className="text-xs text-slate-400">Se actualiza automáticamente cada año.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> Correo Público</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="contacto@empresa.com"
              />
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
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
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
              <input 
                type="url" 
                value={formData.sitio_web}
                onChange={e => setFormData({ ...formData, sitio_web: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="https://www.miempresa.com"
              />
            </div>

            {/* Ubicación Agrupada */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100">
               <h4 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-600" /> Sede Principal <span className="text-sm font-normal text-slate-400 ml-2">(Opcional)</span></h4>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Localidad</label>
                    <input type="text" value={formData.localidad} onChange={e => setFormData({...formData, localidad: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" placeholder="Ej: Burzaco..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Provincia</label>
                    <input type="text" value={formData.provincia} onChange={e => setFormData({...formData, provincia: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Dirección</label>
                    <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" placeholder="Calle, Lote, Planta..." />
                  </div>
               </div>
            </div>

             <div className="space-y-2 md:col-span-2 border-t border-slate-100 pt-4">
              <label className="text-sm font-semibold text-slate-700">Acerca de nosotros (Resumen Industrial)</label>
              <textarea 
                rows={4}
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
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
