"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Shield, Building, Wrench, UserX, UserCheck, X, Phone, Mail, Calendar, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toggleActivarUsuario, cambiarRolUsuario } from "@/modulos/admin/acciones";
import { fallo, llamarAccion } from "@/lib/accion-segura";
import { toast } from "sonner";
import {
  ESTADO_ACCESO_CONFIG,
  esperaHabilitacion,
  estadoDeAcceso,
} from "@/modulos/admin/estado-acceso";

type Usuario = {
  id: string;
  nombre_completo: string | null;
  email: string;
  rol_sistema: string | null;
  activo: boolean;
  telefono: string | null;
  /** Área o puesto que le puso su empresa (Compras, Mantenimiento…). */
  cargo: string | null;
  creado_en: string;
  actualizado_en: string;
  /** Ficha a la que pertenece (empresa o prestador), si tiene. */
  ficha_nombre: string | null;
  ficha_tipo: "empresa" | "proveedor" | null;
  /** true = es el titular del alta; false = lo agregó la empresa desde su perfil. */
  es_principal: boolean;
  /** ISO del último login (auth.users), o null si nunca entró. */
  ultimo_ingreso: string | null;
  /** ISO hasta cuándo corre el ban de Auth, o null si no está baneado. */
  baneado_hasta: string | null;
  /** null = no se pudo leer Auth, no que esté sin confirmar. */
  email_confirmado: boolean | null;
  /** El perfil existe pero no hay usuario de Auth detrás. */
  sin_usuario_auth: boolean;
  /** Al revés: existe en Auth pero no tiene fila en `perfiles`. */
  sin_perfil?: boolean;
};

type Filtro = "all" | "pendientes" | "admin" | "company" | "provider";

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

export function PanelUsuarios({
  usuarios,
  filtroInicial = "all",
}: {
  usuarios: Usuario[];
  filtroInicial?: Filtro;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  const filtrados = usuarios.filter((u) => {
    const matchFiltro =
      filtro === "all" ||
      (filtro === "pendientes" ? esperaHabilitacion(u) : u.rol_sistema === filtro);
    const q = busqueda.toLowerCase();
    const matchBusqueda = !busqueda ||
      (u.nombre_completo ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      // Por empresa: es la forma de ver de un saque quiénes entran por una socia.
      (u.ficha_nombre ?? "").toLowerCase().includes(q);
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all:        usuarios.length,
    pendientes: usuarios.filter(esperaHabilitacion).length,
    admin:      usuarios.filter((u) => u.rol_sistema === "admin").length,
    company:    usuarios.filter((u) => u.rol_sistema === "company").length,
    provider:   usuarios.filter((u) => u.rol_sistema === "provider").length,
  };

  /**
   * Habilita o desactiva. Al habilitar, la acción levanta el ban y confirma el
   * correo además de poner `activo`: los tres frenos juntos, porque arreglar uno
   * solo deja a la persona afuera igual y al panel diciendo que está adentro.
   */
  async function handleToggleActivo(
    id: string,
    activo: boolean,
    e?: React.MouseEvent,
    opciones?: { avisarPorEmail?: boolean }
  ) {
    e?.stopPropagation();
    const res = await llamarAccion(() => toggleActivarUsuario(id, !activo, opciones));
    if (fallo(res)) {
      toast.error(res.error);
      return;
    }
    if (!activo) {
      if (opciones?.avisarPorEmail) {
        if (res.emailEnviado) {
          toast.success("Acceso habilitado", { description: "Le avisamos por correo que ya puede entrar." });
        } else {
          toast.warning("Acceso habilitado, pero el correo no salió", {
            description: res.emailError ?? "Avisale vos por otro medio.",
          });
        }
      } else {
        toast.success("Acceso habilitado", {
          description: "Perfil activo, bloqueo levantado y correo confirmado. Ya puede entrar.",
        });
      }
    }
    refresh();
    if (seleccionado?.id === id) {
      setSeleccionado((prev) =>
        prev
          ? {
              ...prev,
              activo: !activo,
              ...(activo
                ? {}
                : { baneado_hasta: null, email_confirmado: true }),
            }
          : null
      );
    }
  }

  /**
   * Habilitar, en dos preguntas separadas.
   *
   * La primera puede cancelarse sin efecto: meter "¿le mando el mail?" adentro
   * del mismo confirm haría que apretar Escape igual habilite, que es justo lo
   * que no querés cuando dudás.
   */
  async function handleHabilitar(u: Usuario, e?: React.MouseEvent) {
    e?.stopPropagation();
    const quien = u.nombre_completo || u.email;

    // Sin ficha, habilitar desde acá no alcanza: el middleware la manda igual a
    // /pendiente-aprobacion porque no tiene empresa aprobada de la que colgarse.
    // Es el caso de quien se registró contra una ficha del padrón — ahí la
    // vinculación la hace "Dar acceso" en /admin/altas, no este botón.
    if (!u.ficha_nombre) {
      if (
        !confirm(
          `${quien} no está vinculada a ninguna ficha.\n\n` +
            "Habilitarla desde acá la deja igual afuera: sin empresa aprobada, el sistema la manda a la pantalla de \"cuenta pendiente\".\n\n" +
            "Si se registró con los datos de una empresa del padrón, lo que corresponde es entrar a Altas de socios y usar \"Dar acceso\", que vincula la ficha y le pone la cortesía.\n\n" +
            "Aceptar = habilitarla igual de todos modos."
        )
      )
        return;
    }

    if (
      !confirm(
        `Habilitar el acceso de ${quien}?\n\n` +
          "Se activa el perfil, se levanta el bloqueo de Auth y se le da por confirmado el correo."
      )
    )
      return;

    const avisar = confirm(
      `¿Le mandamos el correo avisándole que ya puede entrar?\n\n` +
        `Va a ${u.email}.\n\n` +
        "Cancelar = lo habilitamos igual, pero sin mandar nada."
    );
    await handleToggleActivo(u.id, false, undefined, { avisarPorEmail: avisar });
  }

  async function handleCambiarRol(id: string, nuevoRol: string) {
    setCambiandoRol(id);
    await llamarAccion(() => cambiarRolUsuario(id, nuevoRol));
    setCambiandoRol(null);
    refresh();
    if (seleccionado?.id === id) setSeleccionado(prev => prev ? { ...prev, rol_sistema: nuevoRol } : null);
  }

  const TABS: { key: Filtro; label: string; alerta?: boolean }[] = [
    { key: "all",        label: `Todos (${counts.all})` },
    { key: "pendientes", label: `Pendientes de habilitar (${counts.pendientes})`, alerta: counts.pendientes > 0 },
    { key: "admin",      label: `Admin (${counts.admin})` },
    { key: "company",    label: `Empresas (${counts.company})` },
    { key: "provider",   label: `Proveedores de servicios (${counts.provider})` },
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
            placeholder="Buscar por nombre, email o empresa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto flex-wrap">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : tab.alerta
                    ? "text-amber-700 hover:text-amber-800"
                    : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.alerta && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 align-middle" />}
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {/* min-w: con w-full sola la tabla se comprime y el wrapper overflow-x-auto nunca llega a scrollear */}
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa / ficha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Último ingreso</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
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
                    <td className="px-6 py-4">
                      {u.ficha_nombre ? (
                        <div className="max-w-[220px]">
                          <div className="text-sm text-slate-700 truncate" title={u.ficha_nombre}>
                            {u.ficha_nombre}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {u.cargo
                              ? `${u.cargo} · ${u.es_principal ? "titular" : "usuario agregado"}`
                              : u.es_principal ? "Titular de la cuenta" : "Usuario agregado"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rol.bg} ${rol.text}`}>
                        {rol.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const cfg = ESTADO_ACCESO_CONFIG[estadoDeAcceso(u)];
                        return (
                          <span
                            title={cfg.detalle}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.clase}`}
                          >
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {u.ultimo_ingreso
                        ? new Date(u.ultimo_ingreso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
                        : <span className="italic text-slate-300">Nunca ingresó</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      {/* En touch no hay hover: con opacity-0 esta era la UNICA accion de la tabla
                          y quedaba invisible, o sea que no se podia activar/desactivar a nadie.
                          "Habilitar" aparece para cualquiera de los tres frenos, no sólo para
                          `activo=false`: si no, a quien estaba baneado o sin confirmar no había
                          forma de destrabarlo desde el panel. */}
                      {esperaHabilitacion(u) ? (
                        <Button
                          size="sm" variant="outline" disabled={isPending}
                          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleHabilitar(u, e)}>
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> Habilitar
                        </Button>
                      ) : (
                        <Button
                          size="sm" variant="outline" disabled={isPending || u.sin_usuario_auth}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleToggleActivo(u.id, true, e)}>
                          <UserX className="w-3.5 h-3.5 mr-1" /> Desactivar
                        </Button>
                      )}
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
              {/* Estado de acceso, explicado. El chip solo no alcanza: "Bloqueado
                  en Auth" no le dice a nadie qué hacer, y era justamente el
                  estado en el que quedaban las altas que se enganchaban a una
                  ficha del padrón. */}
              {(() => {
                const estado = estadoDeAcceso(seleccionado);
                const cfg = ESTADO_ACCESO_CONFIG[estado];
                return (
                  <section className={`rounded-lg p-4 ${estado === "ok" ? "bg-emerald-50/60" : "bg-amber-50/60"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.clase}`}>{cfg.label}</span>
                      {seleccionado.email_confirmado === null && (
                        <span className="text-[11px] text-slate-400">no pudimos leer Auth</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{cfg.detalle}</p>
                  </section>
                );
              })()}

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
                  <div className="flex items-center gap-3">
                    <LogIn className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-700">
                      {seleccionado.ultimo_ingreso
                        ? `Último ingreso el ${new Date(seleccionado.ultimo_ingreso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`
                        : "Todavía no ingresó nunca"}
                    </span>
                  </div>
                  {seleccionado.ficha_nombre && (
                    <div className="flex items-center gap-3">
                      {seleccionado.ficha_tipo === "empresa"
                        ? <Building className="w-4 h-4 text-slate-400 shrink-0" />
                        : <Wrench className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className="text-slate-700">
                        {seleccionado.ficha_nombre}
                        <span className="text-slate-400">
                          {" "}— {seleccionado.es_principal ? "titular de la cuenta" : "usuario agregado por la empresa"}
                        </span>
                      </span>
                    </div>
                  )}
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
              {esperaHabilitacion(seleccionado) ? (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isPending}
                  onClick={() => handleHabilitar(seleccionado)}>
                  <UserCheck className="w-4 h-4 mr-2" /> Habilitar acceso
                </Button>
              ) : (
                <Button
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={isPending || seleccionado.sin_usuario_auth}
                  onClick={() => handleToggleActivo(seleccionado.id, true)}>
                  <UserX className="w-4 h-4 mr-2" /> Desactivar usuario
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
