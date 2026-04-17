"use client";

import { useState } from "react";
import { Settings, Save, Globe, Lock, Bell, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminConfiguracionPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl border-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-600" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 mt-1">Ajustes generales, notificaciones y opciones de plataforma.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary-600 hover:bg-primary-700 shadow-sm min-w-[120px]"
        >
          {isSaving ? "Guardando..." : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Options */}
        <Card className="shadow-sm border-slate-100 overflow-hidden border">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Información General</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nombre de la Plataforma</label>
                <input 
                  type="text" 
                  defaultValue="UIAB Conecta"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email de Contacto Principal</label>
                <input 
                  type="email" 
                  defaultValue="info@uiab.org"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Descripción del Sitio (SEO)</label>
                <textarea 
                  rows={3}
                  defaultValue="Directorio Comercial de la Unión Industrial de Almirante Brown"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Modo de Mantenimiento</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Muestra una pantalla de "En mantenimiento" a los usuarios estándar.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Aprobación Automática</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Aprobar usuarios automáticamente si el correo tiene dominio verificado.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications Settings */}
        <Card className="shadow-sm border-slate-100 overflow-hidden border">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Notificaciones del Sistema</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Alertas de Nuevo Registro</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Recibe un correo cuando una empresa o particular solicite unirse a la red.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Alertas de Seguridad</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Recibe un correo ante inicios de sesión sospechosos o reseteos de contraseña de administradores.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
