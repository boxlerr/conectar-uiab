"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { ShieldAlert, User, Briefcase, CreditCard, LayoutDashboard, PackageSearch, Loader2, Tag, Inbox } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const pathname = usePathname();

  // Mientras auth está resolviendo, no mostrar "Acceso Requerido" (flash incorrecto)
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
    { name: "Mi Resumen", href: "/perfil", icon: LayoutDashboard },
    { name: "Datos y Contacto", href: "/perfil/datos", icon: User },
    { name: "Productos y Servicios", href: "/perfil/productos-servicios", icon: PackageSearch },
    { name: "Rubros y Especialidades", href: "/perfil/servicios", icon: Briefcase },
    { name: "Etiquetas de Match", href: "/perfil/etiquetas", icon: Tag },
    { name: "Bandeja de Solicitudes", href: "/perfil/solicitudes", icon: Inbox },
    { name: "Mi Suscripción", href: "/perfil/suscripcion", icon: CreditCard },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0 md:sticky md:top-20 md:h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="h-full py-6 px-4 space-y-6">
          <div className="px-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <span className="truncate">{currentUser.name}</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2 ml-10">
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm border border-primary-100/50"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
