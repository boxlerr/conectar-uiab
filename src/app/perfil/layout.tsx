"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { ShieldAlert, User, Briefcase, CreditCard, LayoutDashboard, PackageSearch, Loader2, Tag, Inbox, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades";
import { BotonReiniciarTour } from "@/modulos/onboarding/componentes/boton-reiniciar-tour";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const pathname = usePathname();

  // Safety timeout: si auth queda colgado >20s (lock huérfano, fetch muerto),
  // mostramos un fallback accionable en vez de spinner infinito.
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (!authLoading) {
      setAuthTimedOut(false);
      return;
    }
    const t = setTimeout(() => setAuthTimedOut(true), 20_000);
    return () => clearTimeout(t);
  }, [authLoading]);

  // Mientras auth está resolviendo, no mostrar "Acceso Requerido" (flash incorrecto)
  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (authLoading && authTimedOut) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 gap-4">
        <ShieldAlert className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900">Tardó más de lo esperado</h2>
        <p className="text-slate-500 text-center max-w-md text-sm">
          No pudimos validar tu sesión. Recargá la página para reintentar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>
    );
  }

  // Protect route
  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Acceso Requerido</h2>
        <p className="text-slate-500 text-center max-w-md">
          Por favor inicia sesión para acceder a tu perfil profesional.
        </p>
      </div>
    );
  }

  // Admin users are directed to /admin instead of /perfil by default navigation
  if (currentUser.role === "admin") {
     return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-16 h-16 text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Panel de Administrador</h2>
        <p className="text-slate-500 text-center max-w-md mb-6">
          Tu cuenta es de administrador. Debes dirigirte al panel de administración.
        </p>
        <Link href="/admin" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          Ir al Admin
        </Link>
      </div>
    );
  }

  const profileNav = [
    { name: "Mi Resumen", href: "/perfil", icon: LayoutDashboard, tourId: "nav-resumen" },
    { name: "Datos y Contacto", href: "/perfil/datos", icon: User, tourId: "nav-datos" },
    { name: "Productos y Servicios", href: "/perfil/productos-servicios", icon: PackageSearch, tourId: "nav-productos-servicios" },
    { name: "Rubros y Especialidades", href: "/perfil/servicios", icon: Briefcase, tourId: "nav-servicios" },
    { name: "Etiquetas de Match", href: "/perfil/etiquetas", icon: Tag, tourId: "nav-etiquetas" },
    { name: "Bandeja de Entrada", href: "/perfil/solicitudes", icon: Inbox, tourId: "nav-solicitudes" },
    { name: "Mi Suscripción", href: "/perfil/suscripcion", icon: CreditCard, tourId: "nav-suscripcion" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <aside
        data-tour="perfil-nav"
        className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <div className="py-6 px-4 space-y-6">
          <div className="px-2">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <span className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-10">
              Panel {currentUser.role === 'company' ? 'Corporativo' : 'Particular'}
            </p>
          </div>

          <nav className="space-y-1">
            {profileNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={item.tourId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <BotonReiniciarTour tour="perfil" label="Ver tutorial del perfil" className="w-full justify-center" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50/50 min-w-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
