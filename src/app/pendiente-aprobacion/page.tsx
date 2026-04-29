import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  CheckCircle2, Clock, CreditCard, XCircle, Mail,
  ArrowRight, ShieldCheck, Building2, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { LogoutButton } from '@/components/autenticacion/boton-cerrar-sesion';
import { createAdminClient } from '@/lib/supabase/admin';
import { obtenerPreapproval } from '@/lib/mercadopago/cliente';
import { sumarUnMes } from '@/lib/mercadopago/suscripciones';
import { enviarEmail, emailAdmin } from '@/lib/email/cliente';
import {
  plantillaPagoConfirmado,
  plantillaPagoConfirmadoAdmin,
} from '@/lib/email/plantillas-suscripciones';

export const dynamic = 'force-dynamic';

// ─── Data fetching ────────────────────────────────────────────────────────────

async function obtenerContexto() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol_sistema, nombre_completo')
    .eq('id', user.id)
    .single();
  if (!perfil) return null;

  const rol = perfil.rol_sistema as string;
  let entityId: string | null = null;
  let estadoEntidad = 'borrador';
  let motivoRechazo: string | null = null;

  if (rol === 'company') {
    const { data: m } = await supabase
      .from('miembros_empresa')
      .select('empresa_id, empresas(estado, motivo_rechazo)')
      .eq('perfil_id', user.id)
      .eq('es_principal', true)
      .maybeSingle();
    const emp = (m as any)?.empresas;
    entityId = (m as any)?.empresa_id ?? null;
    estadoEntidad = emp?.estado ?? 'borrador';
    motivoRechazo = emp?.motivo_rechazo ?? null;
  } else if (rol === 'provider') {
    const { data: m } = await supabase
      .from('miembros_proveedor')
      .select('proveedor_id, proveedores(estado, motivo_rechazo)')
      .eq('perfil_id', user.id)
      .eq('es_principal', true)
      .maybeSingle();
    const prov = (m as any)?.proveedores;
    entityId = (m as any)?.proveedor_id ?? null;
    estadoEntidad = prov?.estado ?? 'borrador';
    motivoRechazo = prov?.motivo_rechazo ?? null;
  } else if (rol === 'admin') {
    return { rol, estadoEntidad: 'aprobado', motivoRechazo: null, nombre: perfil.nombre_completo, subscriptionEstado: null, entityId: null };
  }

  // Fetch subscription
  let subscriptionEstado: string | null = null;
  if (entityId) {
    const fk = rol === 'company' ? 'empresa_id' : 'proveedor_id';
    const { data: sub } = await supabase
      .from('suscripciones')
      .select('estado')
      .eq(fk, entityId)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle();
    subscriptionEstado = sub?.estado ?? null;
  }

  return { rol, estadoEntidad, motivoRechazo, nombre: perfil.nombre_completo, subscriptionEstado, entityId };
}

/**
 * When the user returns from Mercado Pago (?mp=ok), we proactively check
 * the preapproval status against the MP API and update the subscription
 * in our DB. This solves the webhook-can't-reach-localhost problem during
 * development, and also serves as a fallback in production.
 */
async function verificarPagoConMP(entityId: string, rol: string) {
  const adminDb = createAdminClient();
  const fk = rol === 'company' ? 'empresa_id' : 'proveedor_id';

  const { data: sus } = await adminDb
    .from('suscripciones')
    .select('id, estado, mercado_pago_preapproval_id, monto, moneda, nombre_plan, empresa_id, proveedor_id')
    .eq(fk, entityId)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sus || sus.estado === 'activa' || !sus.mercado_pago_preapproval_id) {
    return sus?.estado ?? null;
  }

  try {
    const pre = await obtenerPreapproval(sus.mercado_pago_preapproval_id);
    if (pre.status === 'authorized') {
      const ahora = new Date();
      const proximo = sumarUnMes(ahora).toISOString();

      await adminDb
        .from('suscripciones')
        .update({
          estado: 'activa',
          inicia_en: ahora.toISOString(),
          proximo_cobro_en: pre.next_payment_date || proximo,
          gracia_hasta: null,
          actualizado_en: ahora.toISOString(),
        })
        .eq('id', sus.id);

      // Send confirmation emails (best-effort)
      try {
        await enviarEmailsConfirmacionVerificacion(adminDb, sus, pre, proximo);
      } catch (e) {
        console.error('[pendiente-aprobacion] error enviando emails:', e);
      }

      return 'activa';
    }
    return sus.estado;
  } catch (err) {
    console.error('[pendiente-aprobacion] error verificando con MP:', err);
    return sus.estado;
  }
}

async function enviarEmailsConfirmacionVerificacion(
  adminDb: ReturnType<typeof createAdminClient>,
  sus: { empresa_id: string | null; proveedor_id: string | null; monto: number; nombre_plan: string | null },
  preapproval: any,
  proximo: string
) {
  let nombre = '';
  let email = '';
  let entidad: 'empresa' | 'particular' = 'empresa';

  if (sus.empresa_id) {
    const { data } = await adminDb.from('empresas').select('razon_social, email').eq('id', sus.empresa_id).maybeSingle();
    nombre = data?.razon_social || 'Empresa';
    email = data?.email || '';
    entidad = 'empresa';
  } else if (sus.proveedor_id) {
    const { data } = await adminDb.from('proveedores').select('nombre, apellido, email').eq('id', sus.proveedor_id).maybeSingle();
    nombre = [data?.nombre, data?.apellido].filter(Boolean).join(' ') || 'Particular';
    email = data?.email || '';
    entidad = 'particular';
  }

  const ahora = new Date().toISOString();

  // Email al suscriptor
  if (email) {
    const plantilla = plantillaPagoConfirmado({
      nombre, email,
      plan: sus.nombre_plan || 'UIAB Conecta',
      monto: Number(sus.monto),
      pagadoEn: ahora,
      proximoCobro: proximo,
      metodoPago: 'mercadopago',
      referenciaPago: preapproval.id,
      entidad,
    });
    await enviarEmail({ para: email, asunto: plantilla.asunto, html: plantilla.html, texto: plantilla.texto });
  }

  // Email al admin
  const plantillaAdmin = plantillaPagoConfirmadoAdmin({
    nombre, email,
    plan: sus.nombre_plan || 'UIAB Conecta',
    monto: Number(sus.monto),
    pagadoEn: ahora,
    referenciaPago: preapproval.id,
    entidad,
  });
  await enviarEmail({ para: emailAdmin(), asunto: plantillaAdmin.asunto, html: plantillaAdmin.html, texto: plantillaAdmin.texto });
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Stepper({ pasoActual }: { pasoActual: 1 | 2 | 3 }) {
  const pasos = [
    { n: 1, label: 'Registro' },
    { n: 2, label: 'Suscripción' },
    { n: 3, label: 'Revisión' },
  ];

  return (
    <div className="flex items-center gap-0 w-full max-w-sm mx-auto mb-12">
      {pasos.map((paso, idx) => {
        const hecho = paso.n < pasoActual;
        const actual = paso.n === pasoActual;
        return (
          <div key={paso.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 flex items-center justify-center text-sm font-black transition-all
                  ${hecho ? 'bg-emerald-500 text-white' : actual ? 'bg-[#00213f] text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                {hecho ? <CheckCircle2 className="w-4 h-4" /> : paso.n}
              </div>
              <span
                className={`text-[10px] font-black tracking-[0.15em] uppercase whitespace-nowrap
                  ${hecho ? 'text-emerald-600' : actual ? 'text-[#00213f]' : 'text-slate-400'}`}
              >
                {paso.label}
              </span>
            </div>
            {idx < pasos.length - 1 && (
              <div className={`flex-1 h-px mx-2 mt-[-10px] transition-colors
                ${paso.n < pasoActual ? 'bg-emerald-400' : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PendienteAprobacionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const mpOk = params.mp === 'ok';
  const ctx = await obtenerContexto();
  if (!ctx) redirect('/login');

  const esAprobado =
    ctx.estadoEntidad === 'aprobada' ||
    ctx.estadoEntidad === 'aprobado' ||
    ctx.estadoEntidad === 'activo';
  if (esAprobado) redirect('/dashboard');

  const esRechazado =
    ctx.estadoEntidad === 'rechazado' || ctx.estadoEntidad === 'rechazada';

  // When returning from Mercado Pago, proactively verify the payment status
  let subscriptionEstadoActual = ctx.subscriptionEstado;
  if (mpOk && ctx.entityId && subscriptionEstadoActual !== 'activa') {
    subscriptionEstadoActual = await verificarPagoConMP(ctx.entityId, ctx.rol) ?? subscriptionEstadoActual;
  }

  const haPagado =
    subscriptionEstadoActual === 'activa' ||
    mpOk ||
    (subscriptionEstadoActual !== null && subscriptionEstadoActual !== 'pendiente_pago');

  // Rejected state
  if (esRechazado) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Header label */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200">
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-rose-600">
                Cuenta rechazada
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,33,63,0.12)]">
            <div className="h-1 bg-rose-500" />
            <div className="p-10">
              <h1
                className="text-3xl font-black text-[#00213f] tracking-tight mb-4 leading-tight"
                style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
              >
                Tu cuenta fue rechazada
              </h1>
              <p className="text-slate-500 leading-relaxed mb-6 text-[15px]">
                Un administrador revisó tu solicitud y no pudo aprobarla. Si considerás que fue un error, contactanos para revisar tu caso.
              </p>
              {ctx.motivoRechazo && (
                <div className="bg-rose-50 border border-rose-100 p-5 mb-8">
                  <p className="text-xs font-black tracking-[0.15em] uppercase text-rose-600 mb-2">
                    Motivo del rechazo
                  </p>
                  <p className="text-sm text-rose-800 leading-relaxed">{ctx.motivoRechazo}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 h-11 px-6 bg-[#00213f] text-white text-sm font-bold hover:bg-[#10375c] transition-colors"
                >
                  Contactar soporte
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── State: Needs payment ──────────────────────────────────────────────────
  if (!haPagado) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6">
        {/* Top brand strip */}
        <div className="w-full max-w-lg mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-600">
              Registro exitoso
            </span>
          </div>
          <h1
            className="text-4xl font-black text-[#00213f] tracking-tight leading-tight mb-3"
            style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
          >
            Bienvenido{ctx.nombre ? `, ${ctx.nombre.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Un último paso para activar tu cuenta en UIAB Conecta.
          </p>
        </div>

        <div className="w-full max-w-lg">
          <Stepper pasoActual={2} />

          {/* Payment card */}
          <div className="bg-white border border-slate-200 overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,33,63,0.14)]">
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#00213f] to-[#10375c]" />

            <div className="p-8 md:p-10">
              {/* Icon + heading */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 bg-[#00213f]/[0.06] flex items-center justify-center shrink-0">
                  <CreditCard className="w-7 h-7 text-[#00213f]" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1">
                    Paso 2 de 3
                  </p>
                  <h2
                    className="text-2xl font-black text-[#00213f] tracking-tight leading-tight"
                    style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
                  >
                    Activá tu suscripción mensual
                  </h2>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                {[
                  { icon: Building2, text: 'Tu perfil aparece en el directorio comercial UIAB' },
                  { icon: Zap, text: 'Acceso completo a oportunidades de negocio' },
                  { icon: ShieldCheck, text: 'Red verificada de empresas y proveedores de servicios' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#00213f]" />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{text}</span>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="h-px bg-slate-100 mb-8" />

              {/* CTA */}
              <Link
                href="/suscripcion/checkout"
                className="flex items-center justify-center gap-2 w-full h-13 py-3.5 bg-[#00213f] hover:bg-[#10375c] text-white text-sm font-bold tracking-wide transition-colors"
              >
                Continuar al pago
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                Serás redirigido a Mercado Pago · Cobro mensual recurrente · Cancelá cuando quieras
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-6 px-1">
            <Link href="/perfil" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
              Completar más tarde
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

  // ── State: Paid, pending admin review ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-600">
            Pago confirmado
          </span>
        </div>
        <h1
          className="text-4xl font-black text-[#00213f] tracking-tight leading-tight mb-3"
          style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
        >
          Cuenta en revisión
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          Tu suscripción está activa. La administración UIAB está evaluando tu perfil.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <Stepper pasoActual={3} />

        <div className="bg-white border border-slate-200 overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,33,63,0.14)]">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-[#00213f]" />

          <div className="p-8 md:p-10">
            {/* Icon + heading */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1">
                  Paso 3 de 3
                </p>
                <h2
                  className="text-2xl font-black text-[#00213f] tracking-tight leading-tight"
                  style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)" }}
                >
                  Aguardá la aprobación del administrador
                </h2>
              </div>
            </div>

            {/* Timeline checklist */}
            <div className="space-y-0 mb-8">
              {[
                { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Registro completado', sub: 'Tus datos fueron recibidos correctamente.' },
                { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Suscripción activa', sub: 'Tu primer pago fue procesado por Mercado Pago.' },
                { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Revisión en curso', sub: 'Un administrador UIAB está evaluando tu perfil.' },
                { icon: Mail, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Habilitación de cuenta', sub: 'Recibirás un email cuando tu cuenta esté habilitada.' },
              ].map(({ icon: Icon, color, bg, label, sub }, idx) => (
                <div key={label} className="flex gap-4">
                  {/* Left: icon + connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    {idx < 3 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                  </div>
                  {/* Right: text */}
                  <div className={`pb-5 ${idx === 3 ? '' : ''}`}>
                    <p className="text-sm font-bold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info note */}
            <div className="bg-slate-50 border border-slate-100 p-4 mb-8">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                El proceso de revisión normalmente toma menos de 24 horas hábiles. Podés completar tu perfil mientras tanto para agilizar la aprobación.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/perfil"
              className="flex items-center justify-center gap-2 w-full h-12 bg-[#00213f] hover:bg-[#10375c] text-white text-sm font-bold tracking-wide transition-colors"
            >
              Completar mi perfil
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 px-1">
          <Link href="/perfil/suscripcion" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
            Ver mi suscripción
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
