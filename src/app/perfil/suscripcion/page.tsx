"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, CheckCircle2, History, Banknote, ShieldCheck, Loader2, AlertCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/cliente";
import { toast } from "sonner";

// Precios MENSUALES por tarifa (fallback si aún no cargaron los de DB).
const TARIFA_PRECIO_FALLBACK: Record<number, number> = { 1: 108_000, 2: 216_000, 3: 360_000 };
const TARIFA_RANGO: Record<number, string> = {
  1: "Hasta 30 empleados",
  2: "31 a 99 empleados",
  3: "100+ empleados",
};

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function MiPerfilSuscripcionPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [payments, setPayments] = useState<any[]>([]);
  const [empresa, setEmpresa] = useState<{
    tarifa: number | null;
    cantidad_empleados: number | null;
    tarifa_vigente_hasta: string | null;
  } | null>(null);
  const [suscripcion, setSuscripcion] = useState<{
    id: string;
    estado: string;
    metodo_pago: string;
    proximo_cobro_en: string | null;
    mercado_pago_preapproval_id: string | null;
    cancelada_en: string | null;
    finaliza_en: string | null;
    gracia_hasta: string | null;
  } | null>(null);
  const [precios, setPrecios] = useState<Record<number, number>>(TARIFA_PRECIO_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [iniciandoPago, setIniciandoPago] = useState(false);
  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      if (!currentUser?.entityId) {
        setLoading(false);
        return;
      }

      const columnFk = currentUser.role === 'company' ? 'empresa_id' : 'proveedor_id';

      const [pagosRes, empresaRes, tarifasRes, susRes] = await Promise.all([
        supabase
          .from('pagos_suscripciones')
          .select('*')
          .eq(columnFk, currentUser.entityId)
          .order('pagado_en', { ascending: false, nullsFirst: false }),
        currentUser.role === 'company'
          ? supabase
              .from('empresas')
              .select('tarifa, cantidad_empleados, tarifa_vigente_hasta')
              .eq('id', currentUser.entityId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('tarifas_precios').select('nivel, precio_mensual'),
        supabase
          .from('suscripciones')
          .select('id, estado, metodo_pago, proximo_cobro_en, mercado_pago_preapproval_id, cancelada_en, finaliza_en, gracia_hasta')
          .eq(columnFk, currentUser.entityId)
          .order('creado_en', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (pagosRes.data) setPayments(pagosRes.data);
      if (empresaRes && 'data' in empresaRes && empresaRes.data) setEmpresa(empresaRes.data as any);
      if (susRes.data) setSuscripcion(susRes.data as any);
      if (tarifasRes.data && tarifasRes.data.length > 0) {
        const map: Record<number, number> = { ...TARIFA_PRECIO_FALLBACK };
        tarifasRes.data.forEach((t: any) => {
          map[t.nivel] = Number(t.precio_mensual) || map[t.nivel];
        });
        setPrecios(map);
      }
      setLoading(false);
    }
    loadData();
  }, [authLoading, currentUser?.entityId, currentUser?.role, supabase]);

  const montoMensual = currentUser?.role === 'company'
    ? (empresa && empresa.tarifa ? precios[empresa.tarifa] ?? 0 : 0)
    : 5000;
  const montoAnual = montoMensual * 12;

  const estadoBadge = (() => {
    const e = suscripcion?.estado;
    if (e === 'activa') return { text: 'Al día', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' };
    if (e === 'pendiente_pago') return { text: 'Pendiente de pago', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' };
    if (e === 'en_mora') return { text: 'En mora', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30', dot: 'bg-orange-400' };
    if (e === 'suspendida') return { text: 'Suspendida', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' };
    if (e === 'cancelada') return { text: 'Cancelada', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30', dot: 'bg-slate-400' };
    return { text: 'Sin suscripción', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30', dot: 'bg-slate-400' };
  })();

  const nombreMetodo = (() => {
    const m = suscripcion?.metodo_pago;
    if (m === 'mercadopago') return 'Mercado Pago (tarjeta recurrente)';
    if (m === 'efectivo') return 'Efectivo (en persona)';
    if (m === 'cheque') return 'Cheque (en persona)';
    if (m === 'cortesia') return 'Cortesía UIAB';
    return 'Sin método configurado';
  })();

  async function iniciarPago() {
    setIniciandoPago(true);
    try {
      const res = await fetch('/api/mercadopago/crear-preapproval', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando suscripción');
      window.location.href = data.init_point;
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
      setIniciandoPago(false);
    }
  }

  async function cancelarSuscripcion() {
    setCancelando(true);
    try {
      const res = await fetch('/api/mercadopago/cancelar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cancelando');
      toast.success('Suscripción cancelada');
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
    } finally {
      setCancelando(false);
      setMostrarModalCancelacion(false);
    }
  }

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {mostrarModalCancelacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !cancelando && setMostrarModalCancelacion(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-5 border border-rose-100">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Cancelar suscripción?</h3>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Mantenés todos los beneficios hasta el final del período ya pagado. 
              Después de eso, tu perfil dejará de ser público y perderás visibilidad en el directorio industrial.
            </p>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button 
                variant="ghost" 
                className="w-full sm:w-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium" 
                onClick={() => setMostrarModalCancelacion(false)}
                disabled={cancelando}
              >
                Volver atrás
              </Button>
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm shadow-rose-600/20" 
                onClick={cancelarSuscripcion}
                disabled={cancelando}
              >
                {cancelando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelando...</> : 'Sí, cancelar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Plan y Suscripción</h1>
        <p className="text-slate-500 mt-1">Gestiona tus pagos y tu membresía activa en UIAB Conecta.</p>
      </div>

      {!currentUser.entityId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm mb-6">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Perfil Incompleto</h3>
            <p className="text-sm text-amber-700/80">
              No puedes manejar suscripciones aún porque te falta cargar tus Datos de Contacto básicos.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Plan Overview */}
        <Card className="p-0 border-slate-100 shadow-lg lg:col-span-2 overflow-hidden flex flex-col">
           <div className="bg-slate-900 p-6 sm:p-8 relative overflow-hidden flex-1 flex flex-col justify-center">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <ShieldCheck className="w-48 h-48 text-primary-400" />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <Badge className={`${estadoBadge.cls} hover:${estadoBadge.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estadoBadge.dot} mr-2 animate-pulse`} /> Estado: {estadoBadge.text}
                  </Badge>
                  {suscripcion?.proximo_cobro_en && suscripcion.estado !== 'cancelada' && (
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      Renueva {new Date(suscripcion.proximo_cobro_en).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </Badge>
                  )}
                  {suscripcion?.estado === 'cancelada' && suscripcion.finaliza_en && (
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      Acceso hasta {new Date(suscripcion.finaliza_en).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </Badge>
                  )}
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">
                  {currentUser.role === 'company' && empresa?.tarifa
                    ? `Tarifa ${empresa.tarifa} — Socio UIAB`
                    : currentUser.role === 'company'
                      ? 'Socio UIAB (tarifa por asignar)'
                      : 'Plan Profesional'}
                </h2>
                {currentUser.role === 'company' ? (
                  <>
                    <div className="flex items-baseline gap-2 text-white mb-2 flex-wrap min-w-0">
                      <span
                        className="font-black tabular-nums break-words"
                        style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
                      >
                        {formatARS(montoMensual)}
                      </span>
                      <span className="text-slate-400 font-medium">/mes (ARS)</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">
                      Equivalente a {formatARS(montoAnual)}/año
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <Users className="w-4 h-4 text-primary-400" />
                        <span>
                          {empresa?.cantidad_empleados
                            ? `${empresa.cantidad_empleados} empleados declarados`
                            : 'Cantidad de empleados sin declarar'}
                          {empresa?.tarifa && <span className="text-slate-500"> · {TARIFA_RANGO[empresa.tarifa]}</span>}
                        </span>
                      </div>
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
                        <span>
                          Tarifa vigente hasta {empresa?.tarifa_vigente_hasta
                            ? new Date(empresa.tarifa_vigente_hasta).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
                            : "mayo 2026"} · UIAB ajusta trimestralmente por IPC
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                        <span>Recepción de reseñas certificadas</span>
                      </div>
                    </div>
                  </>
                )}
             </div>
           </div>
           
           <div className="bg-white p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
                   <CreditCard className="w-5 h-5 text-slate-600" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-slate-900">{nombreMetodo}</p>
                   <p className="text-xs text-slate-500">
                     {suscripcion?.proximo_cobro_en
                       ? `Próximo cobro: ${new Date(suscripcion.proximo_cobro_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                       : 'Sin fecha de próximo cobro'}
                   </p>
                 </div>
              </div>
              {(!suscripcion || ['pendiente_pago','suspendida','cancelada'].includes(suscripcion.estado)) ? (
                <Button className="w-full sm:w-auto" onClick={iniciarPago} disabled={iniciandoPago}>
                  {iniciandoPago ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirigiendo...</> : 'Pagar con Mercado Pago'}
                </Button>
              ) : (
                <Button variant="outline" className="w-full sm:w-auto" onClick={iniciarPago} disabled={iniciandoPago}>
                  Cambiar Método
                </Button>
              )}
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
             <Button
               variant="ghost"
               className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold h-10 border border-transparent hover:border-rose-100"
               onClick={() => setMostrarModalCancelacion(true)}
               disabled={cancelando || !suscripcion || suscripcion.estado === 'cancelada'}
             >
               {cancelando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelando...</> : 'Cancelar Suscripción'}
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
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                      No tienes historial de pagos registrado aún.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const dateObj = new Date(p.pagado_en || p.creado_en);
                    const formattedDate = dateObj.toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' });
                    const amnt = p.monto ? parseFloat(p.monto).toLocaleString('es-AR') : '0';
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{formattedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${amnt} {p.moneda || 'ARS'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={
                            p.estado === 'aprobado' || p.estado === 'aprobada'
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                              : "text-amber-700 bg-amber-50 border-amber-200"
                          }>
                            {p.estado || 'Pendiente'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button variant="link" size="sm" className="text-primary-600 disabled:opacity-50" disabled={!p.external_reference}>
                            {p.external_reference ? "Descargar PDF" : "N/A"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
