"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, CheckCircle2, History, Banknote, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MiPerfilSuscripcionPage() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Plan y Suscripción</h1>
        <p className="text-slate-500 mt-1">Gestiona tus pagos y tu membresía activa en Conectar-UIAB.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Plan Overview */}
        <Card className="p-0 border-slate-100 shadow-lg lg:col-span-2 overflow-hidden flex flex-col">
           <div className="bg-slate-900 p-6 sm:p-8 relative overflow-hidden flex-1 flex flex-col justify-center">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <ShieldCheck className="w-48 h-48 text-primary-400" />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" /> Estado: Al día
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">Renueva 01 Abr</Badge>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">Plan {currentUser.role === 'company' ? 'Empresarial' : 'Profesional'} Pro</h2>
                <div className="flex items-baseline gap-1 text-white mb-6">
                  <span className="text-4xl font-black">$5.000</span>
                  <span className="text-slate-400 font-medium">/mes (ARS)</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary-400" />
                    <span>Visibilidad prioritaria en el buscador industrial</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary-400" />
                    <span>Acceso a panel de clientes y estadísticas</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary-400" />
                    <span>Recepción de reseñas certificadas</span>
                  </div>
                </div>
             </div>
           </div>
           
           <div className="bg-white p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
                   <CreditCard className="w-5 h-5 text-slate-600" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-slate-900">Visa terminada en •••• 4242</p>
                   <p className="text-xs text-slate-500">Próximo cobro: 1 de Abril de 2026</p>
                 </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Cambiar Método</Button>
           </div>
        </Card>

        {/* Quick Actions & Help */}
        <div className="space-y-6 flex flex-col">
          <Card className="p-6 border-slate-100 shadow-sm flex-1">
             <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 mb-4">
               <Banknote className="w-5 h-5" />
             </div>
             <h3 className="font-bold text-slate-900 mb-2">Facturación y AFIP</h3>
             <p className="text-sm text-slate-600 mb-6">Tus comprobantes (Factura C) se emiten mensualmente a nombre de tu CUIT registrado en la plataforma.</p>
             <Button className="w-full" variant="secondary">Solicitar Datos de Facturación</Button>
          </Card>

          <Card className="p-6 border-slate-100 border-dashed bg-slate-50 relative overflow-hidden group">
             <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">¿Necesitas pausar?</h3>
             <p className="text-xs text-slate-500 mb-4">Si cancelas, tu perfil dejará de ser público al finalizar el mes actual.</p>
             <Button variant="ghost" className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold h-10 border border-transparent hover:border-rose-100">
               Cancelar Suscripción
             </Button>
          </Card>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mt-12 mb-4 flex items-center gap-2">
           <History className="w-6 h-6 text-slate-400" />
           Historial de Pagos Anteriores
        </h3>
        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">01 Mar 2026</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">$5.000 ARS</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">Aprobado</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="link" size="sm" className="text-primary-600">Descargar PDF</Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">01 Feb 2026</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">$5.000 ARS</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">Aprobado</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                     <Button variant="link" size="sm" className="text-primary-600">Descargar PDF</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
