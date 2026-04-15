"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, User, Building, MapPin, Phone, Mail, Globe, MessageCircle, FileText, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/cliente";
import { updateCompanyOrProvider } from "../acciones";
import { toast } from "sonner";
import Image from "next/image";

export default function MiPerfilDatosPage() {
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    razon_social: "",
    nombre_fantasia: "",
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
  });
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");

  useEffect(() => {
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
          nombre_fantasia: data.nombre_fantasia || "",
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
        });
        if (data.bucket_logo && data.ruta_logo) {
          const { data: urlData } = supabase.storage.from(data.bucket_logo).getPublicUrl(data.ruta_logo);
          setLogoPreviewUrl(urlData.publicUrl);
        }
      }
      setFetching(false);
    }
    loadData();
  }, [currentUser, supabase]);

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
      const result = await updateCompanyOrProvider(currentUser.role as any, currentUser.entityId, currentUser.id, formData);
      
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

      <Card className="p-6 border-slate-100 shadow-sm">
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

            {currentUser.role === 'company' && (
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">Nombre de Fantasía</label>
                 <input 
                   type="text" 
                   value={formData.nombre_fantasia}
                   onChange={e => setFormData({ ...formData, nombre_fantasia: e.target.value })}
                   className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                   placeholder="Marca comercial"
                 />
               </div>
            )}

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
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> Correo Público</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> Teléfono Fijo</label>
              <input 
                type="text" 
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-slate-400" /> Whatsapp Profesional</label>
              <input 
                type="text" 
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                placeholder="+54 9 11 ..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Globe className="w-4 h-4 text-slate-400" /> Sitio Web</label>
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
             <Button type="submit" disabled={loading} className="gap-2 bg-primary-600 hover:bg-primary-700 w-full sm:w-auto h-11 px-8 rounded-xl shadow-sm text-sm font-medium">
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
