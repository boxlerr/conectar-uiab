import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ghost Background Anchor */}
      <div className="absolute top-10 left-10 opacity-5 pointer-events-none">
        <span className="text-[20rem] font-black tracking-tighter text-primary-900 leading-none">
          403
        </span>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-12 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.05)]">
        
        {/* Left Content */}
        <div className="space-y-8">
          <div className="w-16 h-16 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 mb-8">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Acceso <br/> Restringido
            </h1>
            <p className="text-base text-slate-500 max-w-sm leading-relaxed">
              El perfil que intentas utilizar no posee los privilegios administrativos o roles requeridos para acceder a este módulo del conector industrial.
            </p>
          </div>

          <div className="pt-4">
            <Link 
              href="/perfil" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded text-sm hover:bg-primary-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a mi portal
            </Link>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-4">
            Auditoría de Seguridad
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm">
              <span className="text-red-500 font-bold">•</span>
              <span className="text-slate-600">Protocolo de seguridad activado por intento de acceso a ruta protegida.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-slate-400 font-bold">•</span>
              <span className="text-slate-600">Verifique que ha iniciado sesión con la cuenta y los permisos de empresa/admin correctos.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-slate-400 font-bold">•</span>
              <span className="text-slate-600">Si considera que es un error, contacte a soporte técnico corporativo.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
