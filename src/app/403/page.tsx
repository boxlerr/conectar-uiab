import Link from 'next/link';
import { ShieldAlert, ArrowLeft, RefreshCw, PlugZap } from 'lucide-react';

/**
 * Dos pantallas en una.
 *
 * Con `?motivo=sin-verificar` el middleware no está diciendo "no tenés
 * permisos": está diciendo "no pude leer tu perfil". Pasó de verdad el
 * 2026-08-14 con el admin —un timeout de 8s contra `perfiles`— y la pantalla
 * le informó que no tenía privilegios, que es exactamente lo que no había
 * ocurrido. Un problema de conexión se resuelve recargando, no llamando a
 * soporte a preguntar por qué le sacaron el rol.
 */
export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const sinVerificar = motivo === 'sin-verificar';

  const copy = sinVerificar
    ? {
        titulo: ['No pudimos', 'verificar tu sesión'],
        detalle:
          'No es un problema de permisos: no logramos leer tu perfil para confirmar tu rol. Suele ser un corte momentáneo de conexión con la base. Recargá la página.',
        icono: PlugZap,
        colores: 'bg-amber-50 text-amber-600 border-amber-100',
        puntos: [
          'La verificación del rol no respondió a tiempo y el acceso se cortó por precaución.',
          'Tus permisos no cambiaron: si eras admin, seguís siéndolo.',
          'Si vuelve a pasar después de recargar un par de veces, avisanos.',
        ],
        rotulo: 'Qué pasó',
      }
    : {
        titulo: ['Acceso', 'Restringido'],
        detalle:
          'La cuenta con la que iniciaste sesión no tiene el rol necesario para entrar a esta sección del panel.',
        icono: ShieldAlert,
        colores: 'bg-red-50 text-red-600 border-red-100',
        puntos: [
          'El acceso se corta antes de cargar la página, no después.',
          'Revisá que hayas iniciado sesión con la cuenta correcta.',
          'Si creés que es un error, escribinos y lo revisamos.',
        ],
        rotulo: 'Qué significa',
      };

  const Icono = copy.icono;

  return (
    <div className="min-h-svh bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ghost Background Anchor */}
      <div className="absolute top-10 left-10 opacity-5 pointer-events-none">
        <span className="text-[20rem] font-black tracking-tighter text-primary-900 leading-none">
          403
        </span>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-8 sm:p-12 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.05)]">

        {/* Left Content */}
        <div className="space-y-8">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center border mb-8 ${copy.colores}`}>
            <Icono className="w-8 h-8" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {copy.titulo[0]} <br /> {copy.titulo[1]}
            </h1>
            <p className="text-base text-slate-500 max-w-sm leading-relaxed">
              {copy.detalle}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            {sinVerificar && (
              // <a> y no <Link>: el punto es rehacer el request de verdad, no
              // una navegación client-side que reusa el mismo estado.
              <a
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded text-sm hover:bg-primary-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </a>
            )}
            <Link
              href="/perfil"
              className={`inline-flex items-center gap-2 px-6 py-3 font-medium rounded text-sm transition-colors ${
                sinVerificar
                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a mi portal
            </Link>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-4">
            {copy.rotulo}
          </h3>
          <ul className="space-y-4">
            {copy.puntos.map((punto, i) => (
              <li key={punto} className="flex gap-3 text-sm">
                <span className={`font-bold ${i === 0 ? (sinVerificar ? 'text-amber-500' : 'text-red-500') : 'text-slate-400'}`}>
                  •
                </span>
                <span className="text-slate-600">{punto}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
