"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Shield, Building, Wrench, UserX, UserCheck, X, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toggleActivarUsuario, cambiarRolUsuario } from "@/modulos/admin/acciones";

type Usuario = {
  id: string;
  nombre_completo: string | null;
  email: string;
  rol_sistema: string | null;
  activo: boolean;
  telefono: string | null;
  creado_en: string;
  actualizado_en: string;
};

type Filtro = "all" | "admin" | "company" | "provider";

const ROL_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  admin:    { label: "Administrador", icon: Shield,   bg: "bg-slate-100",   text: "text-slate-700" },
  company:  { label: "Empresa",       icon: Building, bg: "bg-blue-50",     text: "text-blue-700"  },
  provider: { label: "Particular",    icon: Wrench,   bg: "bg-emerald-50",  text: "text-emerald-700" },
};

const ROLES_DISPONIBLES: { value: string; label: string }[] = [
  { value: "admin",    label: "Administrador" },
  { value: "company",  label: "Empresa" },
  { value: "provider", label: "Particular" },
];

export function PanelUsuarios({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  const filtrados = usuarios.filter((u) => {
    const matchFiltro = filtro === "all" || u.rol_sistema === filtro;
    const matchBusqueda = !busqueda ||
      (u.nombre_completo ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all:      usuarios.length,
    admin:    usuarios.filter((u) => u.rol_sistema === "admin").length,
    company:  usuarios.filter((u) => u.rol_sistema === "company").length,
    provider: usuarios.filter((u) => u.rol_sistema === "provider").length,
  };

  async function handleToggleActivo(id: string, activo: boolean, e?: React.MouseEvent) {
    e?.stopPropagation();
    await toggleActivarUsuario(id, !activo);
    refresh();
    if (seleccionado?.id === id) setSeleccionado(prev => prev ? { ...prev, activo: !activo } : null);
  }

  async function handleCambiarRol(id: string, nuevoRol: string) {
    setCambiandoRol(id);
    await cambiarRolUsuario(id, nuevoRol);
    setCambiandoRol(null);
    refresh();
    if (seleccionado?.id === id) setSeleccionado(prev => prev ? { ...prev, rol_sistema: nuevoRol } : null);
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "all",      label: `Todos (${counts.all})` },
    { key: "admin",    label: `Admin (${counts.admin})` },
    { key: "company",  label: `Empresas (${counts.company})` },
    { key: "provider", label: `Particulares (${counts.provider})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary-600" />
          Gestión de Usuarios
        </h1>
        <p className="text-slate-500 mt-1">Administrá los accesos, roles y estados de los perfiles de la plataforma.</p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto flex-wrap">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registro</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No se encontraron usuarios con estos filtros.</p>
                  </td>
                </tr>
              ) : filtrados.map((u) => {
                const rol = ROL_CONFIG[u.rol_sistema ?? ""] ?? { label: u.rol_sistema ?? "—", icon: Users, bg: "bg-slate-50", text: "text-slate-600" };
                const Icon = rol.icon;
                return (
                  <tr key={u.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSeleccionado(u)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${rol.bg}`}>
                          <Icon className={`w-4 h-4 ${rol.text}`} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{u.nombre_completo ?? <span className="text-slate-400 italic">Sin nombre</span>}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rol.bg} ${rol.text}`}>
                        {rol.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.activo ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Activo</span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(u.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm" variant="outline" disabled={isPending}
                        className={u.activo
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        }
                        onClick={(e) => handleToggleActivo(u.id, u.activo, e)}>
                        {u.activo ? <><UserX className="w-3.5 h-3.5 mr-1" /> Desactivar</> : <><UserCheck className="w-3.5 h-3.5 mr-1" /> Activar</>}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over detalle */}
      {seleccionado && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionado(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const rol = ROL_CONFIG[seleccionado.rol_sistema ?? ""] ?? { bg: "bg-slate-100", icon: Users, text: "text-slate-600" };
                  const Icon = rol.icon;
                  return (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rol.bg}`}>
                      <Icon className={`w-5 h-5 ${rol.text}`} />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">{seleccionado.nombre_completo ?? "Sin nombre"}</h2>
                  <p className="text-xs text-slate-500 truncate">{seleccionado.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSeleccionado(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Información</p>
                <dl className="space-y-3 text-sm">
                  {seleccionado.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">{seleccionado.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700">{seleccionado.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700">
                      Registrado el {new Date(seleccionado.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </dl>
              </section>

              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Cambiar Rol</p>
                <div className="flex flex-wrap gap-2">
                  {ROLES_DISPONIBLES.map((r) => {
                    const cfg = ROL_CONFIG[r.value];
                    const Icon = cfg.icon;
                    const isActive = seleccionado.rol_sistema === r.value;
                    return (
                      <button key={r.value}
                        disabled={isActive || cambiandoRol === seleccionado.id}
                        onClick={() => handleCambiarRol(seleccionado.id, r.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          isActive
                            ? `${cfg.bg} ${cfg.text} border-current opacity-100 cursor-default`
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}>
                        <Icon className="w-4 h-4" />
                        {r.label}
                        {isActive && <span className="text-xs opacity-60">(actual)</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 bg-white/95 border-t border-slate-100 p-5">
              <Button
                className={`w-full ${seleccionado.activo
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                disabled={isPending}
                onClick={() => handleToggleActivo(seleccionado.id, seleccionado.activo)}>
                {seleccionado.activo
                  ? <><UserX className="w-4 h-4 mr-2" /> Desactivar usuario</>
                  : <><UserCheck className="w-4 h-4 mr-2" /> Activar usuario</>
                }
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
