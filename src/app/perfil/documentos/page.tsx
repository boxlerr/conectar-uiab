"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, UploadCloud, AlertCircle, FileCheck2, Trash2, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/cliente";
import { toast } from "sonner";

export default function MiPerfilDocumentosPage() {
  const { currentUser } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const BUCKET_DOCS = "documentos-privados";
  const carpetaEntidad = currentUser?.role === "company" ? "empresas" : "proveedores";
  const folderPath = currentUser?.entityId ? `${carpetaEntidad}/${currentUser.entityId}` : null;

  useEffect(() => {
    async function fetchFiles() {
      if (!folderPath) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.storage
        .from(BUCKET_DOCS)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (data) {
        const validFiles = data.filter((f: any) => f.name !== ".emptyFolderPlaceholder" && f.metadata);
        setFiles(
          validFiles.map((f: any) => ({
            id: f.id || f.name,
            name: f.name,
            size: f.metadata?.size ? (f.metadata.size / 1024 / 1024).toFixed(2) + " MB" : "Desconocido",
            status: "verifying",
            date: new Date(f.created_at || Date.now()).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" }),
            path: `${folderPath}/${f.name}`,
          }))
        );
      }
      setLoading(false);
    }
    fetchFiles();
  }, [folderPath, supabase]);
  
  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!folderPath) {
      toast.error("Completá tu perfil primero", { description: "Antes de subir documentación guardá tus datos corporativos." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo demasiado pesado", { description: "El tamaño máximo permitido es 10MB." });
      return;
    }

    try {
      setIsUploading(true);
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const filePath = `${folderPath}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_DOCS)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      toast.success("Documento cargado", { description: "El archivo ha sido transferido satisfactoriamente a tu expediente." });
      
      // Manually push to state to instantly show
      setFiles((prev) => [
         {
           id: Date.now().toString(),
           name: file.name,
           size: (file.size / 1024 / 1024).toFixed(2) + " MB",
           status: "verifying",
           date: new Date().toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" }),
           path: filePath
         },
         ...prev.filter(f => f.name !== file.name)
      ]);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Fallo al subir documento", { description: err.message });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (filePath: string, fileId: string) => {
    try {
       const { error } = await supabase.storage.from(BUCKET_DOCS).remove([filePath]);
       if (error) throw error;
       toast.success("Archivo eliminado");
       setFiles(files.filter(f => f.id !== fileId));
    } catch (err: any) {
       toast.error("Error al borrar", { description: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Legajo y Matrículas</h1>
        <p className="text-slate-500 mt-1">Sube la documentación necesaria para validar y verificar tu perfil en el directorio.</p>
      </div>

      {!currentUser.entityId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm mb-6">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Perfil Incompleto</h3>
            <p className="text-sm text-amber-700/80">
              No puedes cargar documentos formales porque aún no has completado los datos base de tu perfil.
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 text-sm mb-1">Documentación Requerida</h4>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            {currentUser?.role === 'company' 
              ? 'Por favor subir: 1. Constancia inscripción AFIP (CUIT). 2. Constancia de Ingresos Brutos (ARBA). 3. Estatuto Social (Para S.A o S.R.L).'
              : 'Por favor subir: 1. Frente y dorso DNI o credencial. 2. Matrícula profesional vigente.'}
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        accept="application/pdf, image/jpeg, image/png, image/webp"
      />
      <Card 
        className={`p-8 border-2 border-dashed bg-slate-50/50 transition-all text-center relative overflow-hidden flex flex-col items-center justify-center ${
          currentUser.entityId 
            ? 'border-slate-300 hover:bg-primary-50 hover:border-primary-400 cursor-pointer group' 
            : 'border-slate-200 opacity-50 cursor-not-allowed hidden'
        }`}
        onClick={() => currentUser.entityId && fileInputRef.current?.click()}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-primary-700">Subiendo documento...</p>
          </div>
        )}
        
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-primary-600 mb-4 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Da clic o arrastra tus archivos aquí</h3>
        <p className="text-sm text-slate-500">Admite PDF, JPG o PNG de hasta 10MB.</p>
      </Card>

      {/* File List */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Tus Archivos Subidos ({files.length})</h3>
        <div className="space-y-3">
          {files.map(file => (
            <div key={file.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm line-clamp-1">{file.name}</p>
                  <p className="text-xs text-slate-500">{file.size} • Subido: {file.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 justify-between sm:justify-end">
                <Badge variant="outline" className={file.status === 'verified' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                  {file.status === 'verified' ? (
                     <span className="flex items-center gap-1"><FileCheck2 className="w-3 h-3"/> Verificado</span>
                  ) : 'En revisión'}
                </Badge>
                
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 -ml-2 sm:ml-0" onClick={() => handleDelete(file.path, file.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No has subido documentos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
