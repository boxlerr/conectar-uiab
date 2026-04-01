"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, UploadCloud, AlertCircle, FileCheck2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function MiPerfilDocumentosPage() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  const [files, setFiles] = useState([
    { id: 1, name: "Constancia_AFIP_2026.pdf", size: "1.2 MB", status: "verified", date: "10 Mar 2026" },
  ]);

  const [isUploading, setIsUploading] = useState(false);

  // Simulates a file upload drop handler
  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setFiles([
        ...files,
        { id: Date.now(), name: "Matricula_Habilitante.pdf", size: "2.4 MB", status: "pending", date: "Hoy" }
      ]);
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Legajo y Matrículas</h1>
        <p className="text-slate-500 mt-1">Sube la documentación necesaria para validar y verificar tu perfil en el directorio.</p>
      </div>

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
      <Card 
        className="p-8 border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-primary-50 hover:border-primary-400 transition-all cursor-pointer group flex flex-col items-center justify-center text-center relative overflow-hidden"
        onClick={handleSimulateUpload}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
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
                
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 -ml-2 sm:ml-0" onClick={() => setFiles(files.filter(f => f.id !== file.id))}>
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
