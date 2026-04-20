import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Clock, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { LogoutButton } from '@/components/autenticacion/boton-cerrar-sesion';

export const dynamic = 'force-dynamic';

async function obtenerEstadoUsuario() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
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

  if (rol === 'admin') {
    return { rol, estado: 'aprobado', motivoRechazo: null, nombre: perfil.nombre_completo };
  }

  if (rol === 'company') {
    const { data: m } = await supabase
      .from('miembros_empresa')
      .select('empresas(estado, motivo_rechazo)')
      .eq('perfil_id', user.id)
      .eq('es_principal', true)
      .maybeSingle();
    const emp = (m as any)?.empresas;
    return {
      rol,
      estado: emp?.estado ?? 'borrador',
      motivoRechazo: emp?.motivo_rechazo ?? null,
      nombre: perfil.nombre_completo,
    };
  }

  if (rol === 'provider') {
    const { data: m } = await supabase
      .from('miembros_proveedor')
      .select('proveedores(estado, motivo_rechazo)')
      .eq('perfil_id', user.id)
      .eq('es_principal', true)
      .maybeSingle();
    const prov = (m as any)?.proveedores;
    return {
      rol,
      estado: prov?.estado ?? 'borrador',
      motivoRechazo: prov?.motivo_rechazo ?? null,
      nombre: perfil.nombre_completo,
    };
  }

  return { rol, estado: 'borrador', motivoRechazo: null, nombre: perfil.nombre_completo };
}

export default async function PendienteAprobacionPage() {
  const info = await obtenerEstadoUsuario();

  if (!info) redirect('/login');

  const esAprobado = info.estado === 'aprobada' || info.estado === 'aprobado' || info.estado === 'activo';

  if (esAprobado) redirect('/dashboard');

  const esRechazado = info.estado === 'rechazado' || info.estado === 'rechazada';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${esRechazado ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
          {esRechazado ? <XCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          {esRechazado ? 'Tu cuenta fue rechazada' : 'Cuenta en revisión'}
        </h1>

        <p className="text-slate-600 leading-relaxed mb-6">
          {esRechazado
            ? 'Un administrador revisó tu solicitud y no pudo aprobarla. Si considerás que fue un error, contactanos para revisar tu caso.'
            : `Hola ${info.nombre ?? ''}, tu registro fue recibido correctamente. Un administrador debe aprobar tu cuenta antes de que puedas acceder al directorio y las oportunidades. Te notificaremos por email en cuanto esté lista.`}
        </p>

        {esRechazado && info.motivoRechazo && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-rose-900 mb-1">Motivo del rechazo</p>
            <p className="text-sm text-rose-700">{info.motivoRechazo}</p>
          </div>
        )}

        {!esRechazado && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 space-y-3">
            <div className="flex gap-3 text-sm text-slate-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Tus datos fueron registrados correctamente.</span>
            </div>
            <div className="flex gap-3 text-sm text-slate-600">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Un administrador revisará tu perfil en las próximas horas.</span>
            </div>
            <div className="flex gap-3 text-sm text-slate-600">
              <Mail className="w-5 h-5 text-primary-500 shrink-0" />
              <span>Recibirás un email cuando tu cuenta esté habilitada.</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            Ver mi perfil
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
