"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { ShieldAlert, LayoutDashboard, Award, Building, Wrench, MessageSquare, Users, Settings, DollarSign, Briefcase, Tag, Tags, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades";

const adminNav = [
  { name: "Panel de control", href: "/admin", icon: LayoutDashboard },
  // "Socios UIAB" acá confundía: esta pantalla es el ABM de fichas del directorio
  // (incluye no socias, rechazadas y todo lo demás). El seguimiento del padrón
  // —quién de las socias de siempre ya está adentro y quién no— vive en Altas.
  { name: "Altas de socios", href: "/admin/altas", icon: UserPlus },
  { name: "Empresas", href: "/admin/empresas", icon: Building },
  { name: "Particulares", href: "/admin/proveedores", icon: Wrench },
  { name: "Servicios", href: "/admin/servicios", icon: Tags },
  { name: "Etiquetas", href: "/admin/etiquetas", icon: Tag },
  { name: "Certificaciones", href: "/admin/certificaciones", icon: Award },
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

  // svh y no vh: en iOS el 100vh incluye la barra de Safari y deja contenido tapado
  return (
    <div className="flex min-h-[calc(100svh-5rem)] lg:min-h-[calc(100svh-6rem)]">
      {/* Sidebar Navigation — a lg: en md el aside se comía 256px de los 768 y dejaba 464px de contenido */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:block flex-shrink-0 sticky top-24 h-[calc(100svh-6rem)] overflow-y-auto">
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
      {/* min-w-0: sin esto una tabla ancha estira el flex item y genera scroll horizontal en toda la página */}
      <main className="flex-1 min-w-0 bg-slate-50/50">
        {/* Tira de navegación para cuando la sidebar está oculta: sin esto no hay NINGUNA forma de
            llegar a las secciones del admin desde un teléfono o un iPad vertical */}
        <nav className="lg:hidden sticky top-20 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex gap-2 overflow-x-auto">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 whitespace-nowrap min-h-[44px] inline-flex items-center gap-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-600" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="max-w-6xl mx-auto p-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
