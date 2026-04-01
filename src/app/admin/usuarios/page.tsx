"use client";

import { useState } from "react";
import { Users, Search, Shield, Building, Wrench, MoreVertical, Mail, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock Data for Users
const mockUsers = [
  { id: "1", name: "Admin Principal", email: "admin@uiab.org", role: "admin", status: "activo", lastLogin: "Hoy, 09:30" },
  { id: "2", name: "Carlos López", email: "clopez@alimentosbrown.com", role: "company", status: "activo", lastLogin: "Ayer, 15:45" },
  { id: "3", name: "María Gómez", email: "mgomez@mecatronicasrl.com", role: "provider", status: "activo", lastLogin: "Hoy, 11:20" },
  { id: "4", name: "Juan Pérez", email: "jperez@logisticasur.com.ar", role: "company", status: "inactivo", lastLogin: "Hace 1 semana" },
  { id: "5", name: "Ana Martínez", email: "amartinez@serviciosindustriales.net", role: "provider", status: "pendiente", lastLogin: "Nunca" },
];

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState(mockUsers);
  const [filter, setFilter] = useState<"all" | "admin" | "company" | "provider">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === "all" || u.role === filter;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case "admin": return <Shield className="w-5 h-5 text-slate-700" />;
      case "company": return <Building className="w-5 h-5 text-blue-600" />;
      case "provider": return <Wrench className="w-5 h-5 text-emerald-600" />;
      default: return <Users className="w-5 h-5 text-slate-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "admin": return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">Administrador</Badge>;
      case "company": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Empresa</Badge>;
      case "provider": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Proveedor</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "activo": return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Activo</Badge>;
      case "inactivo": return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Inactivo</Badge>;
      case "pendiente": return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pendiente</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-slate-500 mt-1">Administra los accesos y roles de toda la plataforma.</p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-600/20">
          Invitar Usuario
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter("admin")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "admin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Administradores
          </button>
          <button 
            onClick={() => setFilter("company")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "company" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Empresas
          </button>
          <button 
            onClick={() => setFilter("provider")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "provider" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Proveedores
          </button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Último Acceso</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios con estos filtros.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          user.role === 'admin' ? 'bg-slate-100' :
                          user.role === 'company' ? 'bg-blue-50' :
                          'bg-emerald-50'
                        }`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
