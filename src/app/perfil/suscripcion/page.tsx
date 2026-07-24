"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, CheckCircle2, History, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/cliente";
import { toast } from "sonner";
import { PRECIO_MENSUAL, PRECIO_ANUAL, calcularTarifaPorEmpleados, type CicloSuscripcion } from "@/lib/mercadopago/suscripciones";

// Rango de empleados por categoría (informativo: la tarifa es plana, pero
// mostramos el tamaño de la empresa porque tenemos el dato).
const RANGO_TARIFA: Record<number, string> = {
  1: "hasta 30 empleados",
  2: "31 a 99 empleados",
  3: "100 o más empleados",
};

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function MiPerfilSuscripcionPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [payments, setPayments] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<number | null>(null);
  const [suscripcion, setSuscripcion] = useState<{
    id: string;
    estado: string;
    metodo_pago: string;
    monto: number | null;
    ciclo: string | null;
    proximo_cobro_en: string | null;
    mercado_pago_preapproval_id: string | null;
    cancelada_en: string | null;
    finaliza_en: string | null;
    gracia_hasta: string | null;
  } | null>(null);
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

      // try/finally: el spinner siempre se apaga aunque una query lance.
      try {
        const columnFk = currentUser.role === 'company' ? 'empresa_id' : 'proveedor_id';

        const [pagosRes, susRes] = await Promise.all([
          supabase
            .from('pagos_suscripciones')
            .select('*')
            .eq(columnFk, currentUser.entityId)
            .order('pagado_en', { ascending: false, nullsFirst: false }),
          supabase
            .from('suscripciones')
            .select('id, estado, metodo_pago, monto, ciclo, proximo_cobro_en, mercado_pago_preapproval_id, cancelada_en, finaliza_en, gracia_hasta')
            .eq(columnFk, currentUser.entityId)
            .order('creado_en', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (pagosRes.data) setPayments(pagosRes.data);
        if (susRes.data) setSuscripcion(susRes.data as any);

        // Categoría por tamaño (sólo empresas): informativa.
        if (currentUser.role === 'company') {
          const { data: emp } = await supabase
            .from('empresas')
            .select('cantidad_empleados')
            .eq('id', currentUser.entityId)
            .maybeSingle();
          setEmpleados(emp?.cantidad_empleados ?? null);
        }
      } catch (err) {
        console.error('[perfil/suscripcion] loadData falló:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authLoading, currentUser?.entityId, currentUser?.role]);

  // Modelo único: $50.000/mes ó $500.000/año (el anual tiene descuento, no es ×12).
  const montoMensual = PRECIO_MENSUAL;
  const montoAnual = PRECIO_ANUAL;
  const ciclo: CicloSuscripcion = suscripcion?.ciclo === 'anual' ? 'anual' : 'mensual';
  const montoCiclo = ciclo === 'anual' ? montoAnual : montoMensual;
  // Las socias UIAB no pagan: acceso de cortesía (metodo_pago 'cortesia' o monto 0).
  const esCortesia = !!suscripcion && (
    suscripcion.metodo_pago === 'cortesia' ||
    (suscripcion.monto != null && Number(suscripcion.monto) === 0)
  );

  // Categoría por tamaño de la empresa (informativa; la tarifa es plana).
  const categoria = currentUser?.role === 'company' && empleados != null
    ? calcularTarifaPorEmpleados(empleados)
    : null;

  // Historial: pagos reales; si es socia de cortesía y no hay pagos, mostramos
  // un historial mensual en $0 (bonificado) para que la sección sea útil igual.
  const filas = useMemo(() => {
    if (payments.length > 0) {
      return payments.map((p) => ({
        id: p.id as string,
        fecha: new Date(p.pagado_en || p.creado_en),
        monto: p.monto != null ? Number(p.monto) : 0,
        moneda: (p.moneda as string) || 'ARS',
        estado: (p.estado as string) || 'Pendiente',
        recibo: (p.external_reference as string) || null,
        cortesia: false,
      }));
    }
    if (esCortesia) {
      const hoy = new Date();
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        return { id: `cortesia-${i}`, fecha: d, monto: 0, moneda: 'ARS', estado: 'Bonificado', recibo: null, cortesia: true };
      });
    }
    return [] as { id: string; fecha: Date; monto: number; moneda: string; estado: string; recibo: string | null; cortesia: boolean }[];
  }, [payments, esCortesia]);

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

  function iniciarPago() {
    // Mandamos al checkout, donde se elige el ciclo (mensual/anual) y se arma
    // el preapproval con el monto correcto.
    setIniciandoPago(true);
    router.push('/suscripcion/checkout');
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
                  {categoria && (
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      Categoría: Tarifa {categoria} · {RANGO_TARIFA[categoria]}
                    </Badge>
                  )}
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">
                  {esCortesia ? 'Socia UIAB' : 'UIAB Conecta'}
                </h2>

                {esCortesia ? (
                  <>
                    <div className="flex items-center gap-3 text-white mb-6">
                      <ShieldCheck className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-xl font-bold leading-tight">Acceso sin cargo</p>
                        <p className="text-sm text-slate-400">Cortesía por ser socia de la UIAB</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary-400" />
                        <span>Membresía activa sin costo de suscripción</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary-400" />
                        <span>Visibilidad prioritaria en el buscador industrial</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary-400" />
                        <span>Acceso a panel de clientes y estadísticas</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 text-white mb-2 flex-wrap min-w-0">
                      <span
                        className="font-black tabular-nums break-words"
                        style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
                      >
                        {formatARS(montoCiclo)}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {ciclo === 'anual' ? '/año (ARS)' : '/mes (ARS)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">
                      {ciclo === 'anual'
                        ? `Equivale a ${formatARS(montoMensual)}/mes`
                        : `O ${formatARS(montoAnual)}/año pagando de una (ahorrás ${formatARS(montoMensual * 12 - montoAnual)})`}
                    </p>

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
                        <span>Mismo plan para empresas y particulares</span>
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
                     {esCortesia
                       ? 'Sin cobros — acceso de cortesía'
                       : suscripcion?.proximo_cobro_en
                         ? `Próximo cobro: ${new Date(suscripcion.proximo_cobro_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                         : 'Sin fecha de próximo cobro'}
                   </p>
                 </div>
              </div>
              {esCortesia ? null : (!suscripcion || ['pendiente_pago','en_mora','suspendida','cancelada'].includes(suscripcion.estado)) ? (
                <Button className="w-full sm:w-auto" onClick={iniciarPago} disabled={iniciandoPago}>
                  {iniciandoPago ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirigiendo...</> : (suscripcion?.estado === 'en_mora' || suscripcion?.estado === 'suspendida' ? 'Regularizar pago' : 'Activar suscripción')}
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

          {esCortesia ? (
            <Card className="p-6 border-slate-100 border-dashed bg-slate-50 relative overflow-hidden">
               <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Membresía de cortesía</h3>
               <p className="text-xs text-slate-500">
                 Como socia de la UIAB tu acceso es sin cargo. No hay suscripción que gestionar ni cobros asociados.
               </p>
            </Card>
          ) : (
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
          )}
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
                {filas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                      No tenés historial de pagos registrado aún.
                    </td>
                  </tr>
                ) : (
                  filas.map((f) => {
                    const formattedDate = f.fecha.toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: f.cortesia ? undefined : 'numeric' });
                    const aprobado = f.estado === 'aprobado' || f.estado === 'aprobada' || f.cortesia;
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{formattedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${f.monto.toLocaleString('es-AR')} {f.moneda}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={
                            f.cortesia
                              ? "text-primary-700 bg-primary-50 border-primary-200"
                              : aprobado
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-amber-700 bg-amber-50 border-amber-200"
                          }>
                            {f.estado}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {f.cortesia ? (
                            <span className="text-xs text-slate-400">Sin cargo</span>
                          ) : (
                            <Button variant="link" size="sm" className="text-primary-600 disabled:opacity-50" disabled={!f.recibo}>
                              {f.recibo ? "Descargar PDF" : "N/A"}
                            </Button>
                          )}
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
