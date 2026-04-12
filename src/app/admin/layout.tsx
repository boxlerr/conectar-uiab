"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { ShieldAlert, LayoutDashboard, Building, Wrench, MessageSquare, Users, Settings, DollarSign, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Empresas", href: "/admin/empresas", icon: Building },
  { name: "Proveedores", href: "/admin/proveedores", icon: Wrench },
  { name: "Reseñas", href: "/admin/resenas", icon: MessageSquare },
  { name: "Oportunidades", href: "/admin/oportunidades", icon: Briefcase },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Suscripciones", href: "/admin/suscripciones", icon: DollarSign },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();

  // Protect route
  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-500 text-center max-w-md">
          Esta página es exclusiva para administradores de la red UIAB Conecta. Por favor, ingresa con las credenciales adecuadas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:block flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="h-full py-6 px-4 space-y-2">
          <div className="mb-8 px-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Panel de Administración
            </h2>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50/50">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
