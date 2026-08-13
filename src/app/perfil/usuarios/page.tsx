"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { esFichaDeEmpresa, tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectUIAB } from "@/components/ui/select-uiab";
import {
  Users,
  Plus,
  Loader2,
  X,
  Copy,
  Check,
  ShieldCheck,
  UserX,
  UserCheck,
  KeyRound,
  Mail,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  listarUsuariosDeLaFicha,
  crearUsuarioDeLaFicha,
  cambiarEstadoUsuarioDeLaFicha,
  cambiarPasswordUsuarioDeLaFicha,
  type UsuarioEquipo,
  type CredencialesNuevoUsuario,
} from "./acciones";
import { llamarAccion } from "@/lib/accion-segura";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition";
const labelCls = "block text-[13px] font-semibold text-slate-700 mb-1.5";

/**
 * Áreas sugeridas. Son las que pidieron las socias (mantenimiento, compras,
 * RRHH, logística) más las que aparecen siempre en una PyME industrial. NO es
 * una taxonomía cerrada: "Otra" abre un campo libre y se guarda lo que escriban,
 * porque cada empresa se organiza como quiere.
 */
const AREAS_SUGERIDAS = [
  "Compras / Abastecimiento",
  "Mantenimiento",
  "Logística",
  "Recursos Humanos",
  "Administración",
  "Comercial / Ventas",
  "Producción",
  "Calidad",
  "Ingeniería / Técnica",
  "Higiene y Seguridad",
  "Sistemas / IT",
  "Gerencia / Dirección",
] as const;

const AREA_OTRA = "__otra__";

/** Contraseña sugerida: legible por teléfono, sin caracteres que se confundan. */
function generarPassword(): string {
  const letras = "abcdefghijkmnopqrstuvwxyz";
  const mayus = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  const pick = (set: string, n: number) =>
    Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join("");
  return `${pick(mayus, 1)}${pick(letras, 5)}${pick(nums, 3)}`;
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsuariosDeLaFichaPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abrirAlta, setAbrirAlta] = useState(false);
  const [credenciales, setCredenciales] = useState<CredencialesNuevoUsuario | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  const tipo = tipoEntidadDe(currentUser);
  const esEmpresa = esFichaDeEmpresa(currentUser);
  const palabraFicha = esEmpresa ? "empresa" : "perfil";

  const aplicar = useCallback((res: Awaited<ReturnType<typeof listarUsuariosDeLaFicha>>) => {
    if ("error" in res) {
      setError(res.error);
      setUsuarios([]);
    } else {
      setError(null);
      setUsuarios(res.usuarios);
    }
    setCargando(false);
  }, []);

  // Refresco después de cada acción: no prende el spinner, la lista ya está en
  // pantalla y volver a blanquearla sólo hace parpadear todo.
  const cargar = useCallback(async () => {
    aplicar(await llamarAccion(() => listarUsuariosDeLaFicha()));
  }, [aplicar]);

  // Sin ficha no hay nada que pedir: esa pantalla se resuelve abajo, en el
  // render, sin tocar el estado de carga.
  useEffect(() => {
    if (authLoading || !tipo) return;
    let vivo = true;
    (async () => {
      const res = await llamarAccion(() => listarUsuariosDeLaFicha());
      if (vivo) aplicar(res);
    })();
    return () => {
      vivo = false;
    };
  }, [authLoading, tipo, aplicar]);

  async function alternarEstado(u: UsuarioEquipo) {
    const accion = u.activo ? "desactivar" : "activar";
    if (u.activo && !confirm(`¿Desactivar el acceso de ${u.nombre || u.email}?`)) return;

    setProcesando(u.perfilId);
    const res = await llamarAccion(() => cambiarEstadoUsuarioDeLaFicha(u.perfilId, !u.activo));
    setProcesando(null);

    if ("error" in res) {
      toast.error(`No se pudo ${accion}`, { description: res.error });
      return;
    }
    toast.success(u.activo ? "Acceso desactivado" : "Acceso activado", {
      description: u.activo
        ? `${u.nombre || u.email} ya no puede ingresar.`
        : `${u.nombre || u.email} puede volver a ingresar con su contraseña de siempre.`,
    });
    cargar();
  }

  async function nuevaPassword(u: UsuarioEquipo) {
    if (!confirm(`¿Generar una contraseña nueva para ${u.nombre || u.email}?`)) return;

    setProcesando(u.perfilId);
    const res = await llamarAccion(() => cambiarPasswordUsuarioDeLaFicha(u.perfilId, generarPassword()));
    setProcesando(null);

    if ("error" in res) {
      toast.error("No se pudo cambiar la contraseña", { description: res.error });
      return;
    }
    setCredenciales(res.credenciales);
  }

  // ─── Estados de borde ──────────────────────────────────────────────────────

  if (!authLoading && !tipo) {
    return (
      <div className="space-y-6">
        <Encabezado palabraFicha={palabraFicha} />
        <Card className="p-6 flex items-start gap-3 border-amber-200 bg-amber-50/60">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Tu usuario todavía no está vinculado a una ficha, así que no hay usuarios que
            administrar. Completá primero tus datos en <strong>Datos y Contacto</strong>.
          </p>
        </Card>
      </div>
    );
  }

  if (authLoading || cargando) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <Encabezado palabraFicha={palabraFicha} />
        <Button onClick={() => setAbrirAlta(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Agregar usuario
        </Button>
      </div>

      {error && (
        <Card className="p-4 flex items-start gap-3 border-rose-200 bg-rose-50/60">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-900">{error}</p>
        </Card>
      )}

      {usuarios.length === 0 && !error ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4 border border-primary-100">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Todavía sos el único usuario</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Sumá a las personas de tu {palabraFicha} que necesiten entrar —compras,
            mantenimiento, RRHH— cada una con su propio email y contraseña.
          </p>
          <Button onClick={() => setAbrirAlta(true)} className="mt-5">
            <Plus className="w-4 h-4 mr-2" />
            Agregar el primero
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {usuarios.map((u) => (
            <FilaUsuario
              key={u.perfilId}
              usuario={u}
              procesando={procesando === u.perfilId}
              onAlternar={() => alternarEstado(u)}
              onNuevaPassword={() => nuevaPassword(u)}
            />
          ))}
        </div>
      )}

      {abrirAlta && (
        <ModalAlta
          palabraFicha={palabraFicha}
          onCerrar={() => setAbrirAlta(false)}
          onCreado={(cred) => {
            setAbrirAlta(false);
            setCredenciales(cred);
            cargar();
          }}
        />
      )}

      {credenciales && (
        <ModalCredenciales credenciales={credenciales} onCerrar={() => setCredenciales(null)} />
      )}
    </div>
  );
}

function Encabezado({ palabraFicha }: { palabraFicha: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Users className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
      </div>
      <p className="text-slate-500 text-sm mt-1 max-w-2xl">
        Cada persona de tu {palabraFicha} entra con su propio email y contraseña, y ve exactamente
        lo mismo que vos. Vos les creás el acceso acá y se lo pasás; cuando alguien se va, lo
        desactivás y deja de entrar.
      </p>
    </div>
  );
}

function FilaUsuario({
  usuario,
  procesando,
  onAlternar,
  onNuevaPassword,
}: {
  usuario: UsuarioEquipo;
  procesando: boolean;
  onAlternar: () => void;
  onNuevaPassword: () => void;
}) {
  const inicial = (usuario.nombre || usuario.email || "?").charAt(0).toUpperCase();
  // El principal es el dueño del alta y no se toca: si se pudiera desactivar,
  // la ficha podría quedarse sin nadie que la administre.
  const bloqueado = usuario.esPrincipal || usuario.esVos;

  return (
    <Card className={`p-4 sm:p-5 ${usuario.activo ? "" : "bg-slate-50/70"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              usuario.activo
                ? "bg-primary-50 text-primary-700 border border-primary-100"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {inicial}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900 truncate">
                {usuario.nombre || "Sin nombre"}
              </p>
              {usuario.esPrincipal && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  <ShieldCheck className="w-3 h-3" />
                  Titular
                </span>
              )}
              {usuario.esVos && (
                <span className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Vos
                </span>
              )}
              {!usuario.activo && (
                <span className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  Desactivado
                </span>
              )}
            </div>
            {usuario.cargo && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {usuario.cargo}
              </p>
            )}
            <p className="text-sm text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              {usuario.email}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 sm:text-right sm:w-40 shrink-0">
          <p className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] sm:text-[10px]">
            Último ingreso
          </p>
          <p className="mt-0.5">
            {usuario.ultimoIngreso ? (
              fechaCorta(usuario.ultimoIngreso)
            ) : (
              <span className="italic text-slate-400">Nunca ingresó</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!usuario.esVos && (
            <Button
              variant="outline"
              size="sm"
              disabled={procesando}
              onClick={onNuevaPassword}
              className="text-slate-600"
              title="Generar una contraseña nueva"
            >
              <KeyRound className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Contraseña</span>
            </Button>
          )}
          {!bloqueado && (
            <Button
              variant="outline"
              size="sm"
              disabled={procesando}
              onClick={onAlternar}
              className={
                usuario.activo
                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              }
            >
              {procesando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : usuario.activo ? (
                <>
                  <UserX className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Desactivar</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Activar</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Alta ────────────────────────────────────────────────────────────────────

function ModalAlta({
  palabraFicha,
  onCerrar,
  onCreado,
}: {
  palabraFicha: string;
  onCerrar: () => void;
  onCreado: (c: CredencialesNuevoUsuario) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generarPassword());
  const [area, setArea] = useState("");
  const [areaLibre, setAreaLibre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargo = area === AREA_OTRA ? areaLibre : area;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const res = await llamarAccion(() => crearUsuarioDeLaFicha({ nombre, apellido, email, password, cargo }));
    setGuardando(false);

    if ("error" in res) {
      setError(res.error);
      return;
    }
    toast.success("Usuario creado", { description: `${email} ya puede ingresar.` });
    onCreado(res.credenciales);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Nuevo usuario</h2>
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                className={inputCls}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Evelyn"
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Apellido</label>
              <input
                className={inputCls}
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Gómez"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="compras@tuempresa.com.ar"
              autoComplete="off"
            />
            <p className="text-xs text-slate-400 mt-1">Con este email va a iniciar sesión.</p>
          </div>

          <div>
            <label className={labelCls}>Área o puesto</label>
            <SelectUIAB
              value={area}
              onValueChange={setArea}
              placeholder="Elegí un área (opcional)"
              ariaLabel="Área o puesto"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-800"
              options={[
                ...AREAS_SUGERIDAS.map((a) => ({ value: a, label: a })),
                { value: AREA_OTRA, label: "Otra — la escribo yo" },
              ]}
            />
            {area === AREA_OTRA && (
              <input
                className={`${inputCls} mt-2`}
                value={areaLibre}
                onChange={(e) => setAreaLibre(e.target.value)}
                placeholder="Escribí el área o el puesto"
                maxLength={40}
                autoFocus
              />
            )}
            <p className="text-xs text-slate-400 mt-1">
              Sólo sirve para reconocerlo en el listado: no cambia lo que puede hacer.
            </p>
          </div>

          <div>
            <label className={labelCls}>
              Contraseña <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              {/* type="text": la contraseña la tiene que poder leer y pasar quien
                  la crea; es de un solo uso y la persona puede cambiarla después. */}
              <input
                className={inputCls}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(generarPassword())}
                className="shrink-0 text-slate-600"
                title="Generar una contraseña"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              La vas a ver una sola vez para pasársela. Después sólo se puede generar una nueva.
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
            El usuario nuevo ve y edita todo lo de tu {palabraFicha}: datos, productos,
            oportunidades y la bandeja de entrada.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando…
                </>
              ) : (
                "Crear usuario"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Credenciales para pasar ─────────────────────────────────────────────────

function ModalCredenciales({
  credenciales,
  onCerrar,
}: {
  credenciales: CredencialesNuevoUsuario;
  onCerrar: () => void;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);

  const textoCompleto = useMemo(() => {
    const origen = typeof window !== "undefined" ? window.location.origin : "";
    return [
      `Tu acceso a UIAB Conecta${origen ? ` — ${origen}/login` : ""}`,
      `Email: ${credenciales.email}`,
      `Contraseña: ${credenciales.password}`,
      "Podés cambiar la contraseña cuando quieras desde «Olvidé mi contraseña».",
    ].join("\n");
  }, [credenciales]);

  function copiar(texto: string, clave: string) {
    navigator.clipboard.writeText(texto).then(
      () => {
        setCopiado(clave);
        setTimeout(() => setCopiado((c) => (c === clave ? null : c)), 1600);
      },
      () => toast.error("No se pudo copiar", { description: "Copialo a mano." })
    );
  }

  const campos = [
    { clave: "email", label: "Email", valor: credenciales.email },
    { clave: "password", label: "Contraseña", valor: credenciales.password },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Check className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Listo{credenciales.nombre ? `, ${credenciales.nombre.split(" ")[0]} ya puede entrar` : ""}
          </h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Copiá estos datos y mandáselos. La contraseña no se vuelve a mostrar: si se pierde,
          generás una nueva desde la lista.
        </p>

        <div className="space-y-2">
          {campos.map((f) => (
            <div
              key={f.clave}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {f.label}
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">{f.valor}</p>
              </div>
              <button
                type="button"
                onClick={() => copiar(f.valor, f.clave)}
                title={`Copiar ${f.label.toLowerCase()}`}
                className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-white hover:text-slate-700 transition"
              >
                {copiado === f.clave ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-5">
          <Button variant="outline" onClick={onCerrar}>
            Listo
          </Button>
          <Button onClick={() => copiar(textoCompleto, "todo")}>
            {copiado === "todo" ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar mensaje completo
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
