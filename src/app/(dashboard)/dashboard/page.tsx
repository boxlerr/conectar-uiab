import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, 
  Truck, 
  ShieldCheck, 
  Wrench, 
  ArrowRight, 
  Activity, 
  Briefcase, 
  FileCheck2,
  Bell
} from 'lucide-react';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  
  // Instance Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get User Profile with Role
  const { data: profile } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, rol_sistema, activo')
    .eq('id', user.id)
    .single();

  const isCompany = profile?.rol_sistema === 'company';
  const isProvider = profile?.rol_sistema === 'provider';
  const isAdmin = profile?.rol_sistema === 'admin';

  return (
    <main className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-primary-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12 pb-24">
        
        {/* --- WELCOME HEADER (The Architectural Ledger style) --- */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-transparent">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#d8dadc] rounded-md shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Portal Industrial Restringido
              </span>
            </div>
            {/* Display typography for extreme hierarchy */}
            <h1 className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-bold text-[#00213f] tracking-tight leading-tight">
              Bienvenido, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                {profile?.nombre_completo || 'Usuario'}
              </span>
            </h1>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-right">
             <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Rol del Sistema</p>
             <p className="text-lg font-bold text-[#10375c] bg-white px-4 py-2 rounded-lg border border-[#f2f4f6] shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
               {isCompany ? 'Empresa Asociada' : isProvider ? 'Proveedor Activo' : isAdmin ? 'Administrador' : 'Invitado'}
             </p>
          </div>
        </section>

        {/* --- BENTO GRID: DASHBOARD STATS & ACTIONS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Main Action Block - Large */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#00213f] to-[#10375c] rounded-xl p-8 sm:p-10 text-white relative overflow-hidden group shadow-xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
             <div className="relative z-10 space-y-6 max-w-xl">
                <h2 className="font-poppins text-3xl font-bold tracking-tight">Explora el Directorio UIAB</h2>
                <p className="text-primary-100 text-lg leading-relaxed">
                  Conéctate con {isCompany ? 'proveedores especializados' : 'empresas demandantes'} y descubre nuevas oportunidades de negocio para expandir tu alcance industrial.
                </p>
                <div className="pt-4 flex gap-4">
                  <Link 
                    href={isCompany ? "/proveedores" : "/empresas"}
                    className="inline-flex items-center gap-2 bg-white text-[#00213f] hover:bg-slate-50 px-6 py-3 rounded-md font-semibold transition-all shadow-md"
                  >
                    {isCompany ? 'Ver Proveedores' : 'Ver Empresas UIAB'}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
             </div>
          </div>

          {/* Account Status Block */}
          <div className="bg-white rounded-xl p-8 border border-[#f2f4f6] flex flex-col justify-between shadow-[0_16px_32px_-12px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-start mb-6">
               <div className="w-12 h-12 rounded-lg bg-[#f7f9fb] flex items-center justify-center border border-[#d8dadc]">
                 <Activity className="w-6 h-6 text-[#10375c]" />
               </div>
               <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
               </span>
            </div>
            <div className="space-y-1 pb-4">
              <h3 className="font-poppins text-xl font-bold text-[#00213f]">Estado de Cuenta</h3>
              <p className="text-sm text-slate-500">Suscripción validada y herramientas habilitadas permanentemente.</p>
            </div>
            <Link href="/perfil/suscripcion" className="mt-auto block text-sm font-semibold text-primary-600 hover:text-primary-700 w-fit custom-underline flex items-center gap-1">
              Gestionar plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Info Card 1: My Profile */}
          <Link href="/perfil/datos" className="group bg-white rounded-xl p-8 border border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#f0f4f8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <Building className="w-6 h-6 text-[#10375c]" />
            </div>
            <div>
               <h3 className="font-poppins text-lg font-bold text-[#00213f] mb-2">Mi Perfil Institucional</h3>
               <p className="text-sm text-slate-500 mb-6">Mantén actualizada la información de tu organización para mejorar tu visibilidad.</p>
               <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">Editar Perfil &rarr;</span>
            </div>
          </Link>

          {/* Info Card 2: Opportunities */}
          <Link href="/oportunidades" className="group bg-white rounded-xl p-8 border border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#f0f4f8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6 text-[#10375c]" />
            </div>
            <div>
               <h3 className="font-poppins text-lg font-bold text-[#00213f] mb-2">Monitor B2B</h3>
               <p className="text-sm text-slate-500 mb-6">Accede a requerimientos y cotizaciones activas de otras empresas del parque.</p>
               <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">Ver Oportunidades &rarr;</span>
            </div>
          </Link>

          {/* Info Card 3: Documents */}
          <Link href="/perfil/documentos" className="group bg-white rounded-xl p-8 border border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between">
            <div className="w-12 h-12 rounded-lg bg-[#f0f4f8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-6 h-6 text-[#10375c]" />
            </div>
            <div>
               <h3 className="font-poppins text-lg font-bold text-[#00213f] mb-2">Documentación</h3>
               <p className="text-sm text-slate-500 mb-6">Sube facturas, contratos o certificados habilitantes para validar tu entidad.</p>
               <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">Cargar Archivos &rarr;</span>
            </div>
          </Link>

        </section>

        {/* --- RECENT ACTIVITY OR QUICK NOTIFICATIONS --- */}
        <section className="bg-white rounded-2xl border border-[#d8dadc] overflow-hidden shadow-sm">
          <div className="border-b border-[#f2f4f6] bg-[#f7f9fb] px-8 py-5 flex items-center justify-between">
            <h3 className="font-poppins text-lg font-bold text-[#00213f] flex items-center gap-2">
              <Bell className="w-5 h-5" /> Novedades y Alertas
            </h3>
          </div>
          <div className="p-8">
            <div className="rounded-lg border border-dashed border-[#d8dadc] bg-[#f7f9fb] p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-[#00213f] font-semibold text-lg mb-1">Tu cuenta está al día</h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto">No tienes alertas pendientes de resolución. Explora el directorio o publica nuevas oportunidades desde tu panel de gestión.</p>
            </div>
          </div>
        </section>
        
      </div>
    </main>
  );
}
