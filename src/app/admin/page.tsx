import { createClient } from "@supabase/supabase-js";
import { esperaHabilitacion, leerEstadoAuth } from "@/modulos/admin/estado-acceso";
import { etiquetaNorma } from "@/modulos/certificaciones/normas";
import {
  Building,
  Wrench,
  Users,
  ArrowRight,
  Briefcase,
  DollarSign,
  Activity,
  Star,
  UserPlus,
  FileText,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { ActividadReciente } from "./ActividadReciente";
import { BandejaPendientes } from "./BandejaPendientes";

type ActividadItem = {
  id: string;
  tipo: "empresa" | "proveedor" | "oportunidad" | "resena" | "pago" | "usuario" | "alta" | "ingreso" | "certificacion";
  titulo: string;
  detalle?: string;
  estado?: string | null;
  fecha: string;
  href: string;
  esNuevo: boolean; // <24h
};

const MS_DIA = 24 * 60 * 60 * 1000;
const MS_SEMANA = 7 * MS_DIA;

function esRecienteMs(fecha: string | null | undefined, ms: number): boolean {
  if (!fecha) return false;
  return Date.now() - new Date(fecha).getTime() < ms;
}

/** Filas que se leen para armar la bandeja y los números. Tipadas a mano porque
 *  el proyecto todavía no genera los tipos de la base. */
type FilaSuscripcion = { estado: string | null; monto: number | string | null };
type FilaPago = { monto: number | string | null; estado: string | null; pagado_en: string | null };
type FilaEmpresaEstado = { id: string; estado: string | null };
type FilaMembresia = { empresa_id: string };
type FilaAlta = {
  id: string; razon_social: string; nombre_comercial: string | null;
  referente_nombre: string; email: string; origen: string | null;
  estado: string; empresa_id: string | null; creado_en: string;
};
type FilaEmpresaPendiente = {
  id: string; razon_social: string; nombre_comercial: string | null;
  email: string | null; localidad: string | null; creado_en: string;
};
type FilaResena = { id: string; calificacion: number | null; comentario: string | null; creada_en: string };

async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const hace24h = new Date(Date.now() - MS_DIA).toISOString();
  const hace7d = new Date(Date.now() - MS_SEMANA).toISOString();

  const [
    { count: totalEmpresas },
    { count: totalProveedores },
    { count: totalUsuarios },
    { count: oportunidadesAbiertas },
    { count: empresasPendientes },
    { count: proveedoresPendientes },
    { count: resenasPendientes },
    { count: empresasNuevas24h },
    { count: proveedoresNuevos24h },
    { count: usuariosNuevos7d },
    { count: oportunidadesNuevas7d },
    { data: ultimasOportunidades },
    { data: ultimasEmpresas },
    { data: ultimosProveedores },
    { data: ultimasResenas },
    { data: ultimosPagos },
    { data: empresasTarifa },
    { data: tarifasPrecios },
    { count: altasPendientes },
  ] = await Promise.all([
    supabase.from("empresas").select("*", { count: "exact", head: true }),
    supabase.from("proveedores").select("*", { count: "exact", head: true }),
    supabase.from("perfiles").select("*", { count: "exact", head: true }),
    supabase.from("oportunidades").select("*", { count: "exact", head: true }).eq("estado", "abierta"),
    supabase.from("empresas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("proveedores").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("resenas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_revision"),
    supabase.from("empresas").select("*", { count: "exact", head: true }).gte("creado_en", hace24h),
    supabase.from("proveedores").select("*", { count: "exact", head: true }).gte("creado_en", hace24h),
    supabase.from("perfiles").select("*", { count: "exact", head: true }).gte("creado_en", hace7d),
    supabase.from("oportunidades").select("*", { count: "exact", head: true }).gte("creado_en", hace7d),
    supabase
      .from("oportunidades")
      .select("id, titulo, estado, creado_en, empresa:empresas(razon_social)")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("empresas")
      .select("id, razon_social, estado, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("proveedores")
      .select("id, nombre, apellido, estado, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("resenas")
      // `resenas` nombra sus columnas en femenino (creada_en/creada_por) y la
      // nota es `calificacion`, no `puntuacion`. Con los nombres viejos Postgres
      // cortaba con "column resenas.creado_en does not exist" en cada carga del
      // panel y la lista de actividad quedaba sin reseñas.
      .select("id, estado, creada_en, calificacion, comentario")
      .order("creada_en", { ascending: false })
      .limit(6),
    supabase
      .from("pagos_suscripciones")
      .select("id, monto, moneda, estado, pagado_en, creado_en")
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase.from("empresas").select("tarifa").eq("estado", "aprobada"),
    supabase.from("tarifas_precios").select("nivel, precio_mensual"),
    supabase.from("altas_socios").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
  ]);

  // Fuentes VIVAS del feed. Las cinco de arriba (empresas, proveedores,
  // oportunidades, reseñas, pagos) se dejan porque el día que haya algo tiene
  // que aparecer, pero hoy cuatro de las cinco no devuelven una sola fila en
  // toda la historia de la plataforma: el "movimientos de toda la plataforma"
  // eran literalmente las últimas 6 filas de `empresas`.
  const [{ data: ultimasAltas }, { data: ultimosIngresos }, { data: ultimasCertificaciones }] =
    await Promise.all([
      supabase
        .from("altas_socios")
        .select("id, razon_social, nombre_comercial, estado, origen, creado_en")
        .order("creado_en", { ascending: false })
        .limit(6),
      supabase
        .from("miembros_empresa")
        .select("id, creado_en, empresas:empresa_id(razon_social, nombre_comercial), perfiles:perfil_id(nombre_completo)")
        .order("creado_en", { ascending: false })
        .limit(6),
      supabase
        .from("certificaciones")
        .select("id, codigo_norma, creado_en, empresas:empresa_id(razon_social, nombre_comercial)")
        .order("creado_en", { ascending: false })
        .limit(6),
    ]);

  // Personas que hoy no pueden entrar. Las "acciones pendientes" contaban
  // empresas, proveedores, reseñas y altas — todo menos gente, que es lo único
  // que ninguna otra pantalla mostraba. Naves del Sur estuvo un día afuera sin
  // aparecer en ningún contador.
  //
  // No sale de una query sola porque dos de los tres frenos viven en auth.users
  // (el ban y la confirmación del correo) y no en `perfiles`.
  const personasEsperando = await (async () => {
    try {
      const [{ data: perfilesAcceso }, estadoAuth] = await Promise.all([
        supabase.from("perfiles").select("id, nombre_completo, email, activo, creado_en"),
        leerEstadoAuth(supabase),
      ]);
      return (perfilesAcceso ?? [])
        .filter((p) => {
          const auth = estadoAuth.get(p.id as string);
          return esperaHabilitacion({
            activo: Boolean(p.activo),
            baneado_hasta: auth?.baneadoHasta ?? null,
            email_confirmado: auth ? auth.emailConfirmado : null,
            sin_usuario_auth: estadoAuth.size > 0 && !auth,
          });
        })
        .map((p) => ({
          id: p.id as string,
          nombre: (p.nombre_completo as string | null) ?? (p.email as string),
          email: p.email as string,
          fecha: p.creado_en as string,
        }));
    } catch (e) {
      // El dashboard entero no se cae por esto: se muestra vacío y queda el log.
      console.error("[admin] no se pudo listar a las personas sin acceso:", e);
      return [] as { id: string; nombre: string; email: string; fecha: string }[];
    }
  })();

  // ── Plata ──────────────────────────────────────────────────────────────────
  //
  // Hasta el 2026-08-13 acá se calculaba un "ingreso mensual estimado" sumando
  // `empresas.tarifa × tarifas_precios` de TODAS las fichas aprobadas, y se
  // mostraba en el bloque más grande del panel como si fuera facturación. Daba
  // $2.750.000 por mes y "proyección anual $33.000.000".
  //
  // La realidad, medida el mismo día: 55 suscripciones activas, todas de
  // cortesía con monto 0; ninguna que cobre; cero pagos acreditados en toda la
  // historia de la plataforma. El ingreso real es CERO.
  //
  // Ese número no era una aproximación optimista: era de otra cosa. Ahora se
  // muestran los dos por separado y con el nombre que les corresponde — lo que
  // hoy se cobra, y aparte cuánto saldría si las socias pagaran, que es un
  // escenario y se rotula como tal.
  const precios: Record<number, number> = {};
  (tarifasPrecios ?? []).forEach((t: any) => {
    precios[t.nivel] = Number(t.precio_mensual) || 0;
  });
  const ingresoPotencial = (empresasTarifa ?? []).reduce(
    (acc: number, e: any) => acc + (e.tarifa ? precios[e.tarifa] ?? 0 : 0),
    0
  );

  const [{ data: suscripcionesVivas }, { data: pagosAcreditados }] = await Promise.all([
    supabase.from("suscripciones").select("estado, monto"),
    supabase.from("pagos_suscripciones").select("monto, estado, pagado_en"),
  ]);

  const activas = ((suscripcionesVivas ?? []) as FilaSuscripcion[]).filter((s) => s.estado === "activa");
  const ingresoReal = activas.reduce((acc, s) => acc + (Number(s.monto) || 0), 0);
  const cortesias = activas.filter((s) => (Number(s.monto) || 0) === 0).length;
  const pagando = activas.length - cortesias;
  const esperandoPago = ((suscripcionesVivas ?? []) as FilaSuscripcion[]).filter(
    (s) => s.estado === "pendiente_pago"
  ).length;
  const cobradoAlgunaVez = ((pagosAcreditados ?? []) as FilaPago[]).filter((p) =>
    ["aprobado", "approved", "acreditado", "pagado"].includes(String(p.estado))
  ).length;

  // ── El embudo que le importa a la UIAB ─────────────────────────────────────
  //
  // "¿Cuántas de nuestras socias ya están usando esto?" es la pregunta real, y
  // el panel no la contestaba en ningún lado: mostraba el total de fichas (60),
  // que incluye a las 41 que están publicadas pero sin una sola persona adentro.
  const [{ data: fichasEstado }, { data: membresias }] = await Promise.all([
    supabase.from("empresas").select("id, estado"),
    supabase.from("miembros_empresa").select("empresa_id"),
  ]);
  const conCuenta = new Set(((membresias ?? []) as FilaMembresia[]).map((m) => m.empresa_id));
  const publicadas = ((fichasEstado ?? []) as FilaEmpresaEstado[]).filter((e) => e.estado === "aprobada");
  const socias = {
    publicadas: publicadas.length,
    adentro: publicadas.filter((e) => conCuenta.has(e.id)).length,
  };

  // ── Los ítems de la bandeja, con lo justo para decidir sin salir del panel ──
  const [{ data: altasAbiertas }, { data: empresasPorRevisar }, { data: resenasPorModerar }] =
    await Promise.all([
      supabase
        .from("altas_socios")
        .select("id, razon_social, nombre_comercial, referente_nombre, email, origen, estado, empresa_id, creado_en")
        .in("estado", ["pendiente", "contactado"])
        .order("creado_en", { ascending: true })
        .limit(8),
      supabase
        .from("empresas")
        .select("id, razon_social, nombre_comercial, email, localidad, creado_en")
        .eq("estado", "pendiente_revision")
        .order("creado_en", { ascending: true })
        .limit(8),
      supabase
        .from("resenas")
        .select("id, calificacion, comentario, creada_en")
        .eq("estado", "pendiente_revision")
        .order("creada_en", { ascending: true })
        .limit(8),
    ]);

  // Armar feed unificado
  const actividad: ActividadItem[] = [];

  (ultimasEmpresas ?? []).forEach((e: any) => {
    actividad.push({
      id: `emp-${e.id}`,
      tipo: "empresa",
      titulo: e.razon_social,
      detalle: `Empresa ${e.estado === "pendiente_revision" ? "pendiente" : e.estado}`,
      estado: e.estado,
      fecha: e.creado_en,
      href: "/admin/empresas",
      esNuevo: esRecienteMs(e.creado_en, MS_DIA),
    });
  });

  (ultimosProveedores ?? []).forEach((p: any) => {
    actividad.push({
      id: `prov-${p.id}`,
      tipo: "proveedor",
      titulo: `${p.nombre} ${p.apellido ?? ""}`.trim(),
      detalle: `Particular ${p.estado === "pendiente_revision" ? "pendiente" : p.estado}`,
      estado: p.estado,
      fecha: p.creado_en,
      href: "/admin/proveedores",
      esNuevo: esRecienteMs(p.creado_en, MS_DIA),
    });
  });

  (ultimasOportunidades ?? []).forEach((op: any) => {
    actividad.push({
      id: `op-${op.id}`,
      tipo: "oportunidad",
      titulo: op.titulo,
      detalle: (op.empresa as any)?.razon_social ?? "Sin empresa",
      estado: op.estado,
      fecha: op.creado_en,
      href: "/admin/oportunidades",
      esNuevo: esRecienteMs(op.creado_en, MS_DIA),
    });
  });

  (ultimasResenas ?? []).forEach((r: any) => {
    actividad.push({
      id: `res-${r.id}`,
      tipo: "resena",
      titulo: `Reseña · ${r.calificacion ?? "?"}★`,
      detalle:
        (r.comentario ?? "").length > 60
          ? (r.comentario ?? "").slice(0, 60) + "…"
          : r.comentario ?? "Sin comentario",
      estado: r.estado,
      fecha: r.creada_en,
      href: "/admin/resenas",
      esNuevo: esRecienteMs(r.creada_en, MS_DIA),
    });
  });

  type FilaAltaFeed = { id: string; razon_social: string; nombre_comercial: string | null; estado: string; origen: string | null; creado_en: string };
  (ultimasAltas as unknown as FilaAltaFeed[] ?? []).forEach((a) => {
    const nombre = a.nombre_comercial || a.razon_social;
    actividad.push({
      id: `alta-${a.id}`,
      tipo: "alta",
      titulo: nombre,
      detalle:
        a.estado === "cuenta_creada"
          ? "Ya tiene acceso"
          : a.origen === "registro_web"
            ? "Se registró sola y la reconocimos en el padrón"
            : "Cargó sus datos en Sumate",
      estado: a.estado,
      fecha: a.creado_en,
      href: "/admin/altas",
      esNuevo: esRecienteMs(a.creado_en, MS_DIA),
    });
  });

  type FilaIngresoFeed = { id: string; creado_en: string; empresas: { razon_social: string | null; nombre_comercial: string | null } | null; perfiles: { nombre_completo: string | null } | null };
  (ultimosIngresos as unknown as FilaIngresoFeed[] ?? []).forEach((m) => {
    const empresa = m.empresas?.nombre_comercial || m.empresas?.razon_social;
    if (!empresa) return;
    actividad.push({
      id: `ingreso-${m.id}`,
      tipo: "ingreso",
      titulo: empresa,
      detalle: `${m.perfiles?.nombre_completo ?? "Alguien"} entró por primera vez`,
      fecha: m.creado_en,
      href: "/admin/usuarios",
      esNuevo: esRecienteMs(m.creado_en, MS_DIA),
    });
  });

  type FilaCertFeed = { id: string; codigo_norma: string; creado_en: string; empresas: { razon_social: string | null; nombre_comercial: string | null } | null };
  (ultimasCertificaciones as unknown as FilaCertFeed[] ?? []).forEach((c) => {
    const empresa = c.empresas?.nombre_comercial || c.empresas?.razon_social;
    if (!empresa) return;
    actividad.push({
      id: `cert-${c.id}`,
      tipo: "certificacion",
      titulo: empresa,
      detalle: `Cargó ${etiquetaNorma(c.codigo_norma, null)}`,
      fecha: c.creado_en,
      href: "/admin/certificaciones",
      esNuevo: esRecienteMs(c.creado_en, MS_DIA),
    });
  });

  (ultimosPagos ?? []).forEach((pg: any) => {
    actividad.push({
      id: `pago-${pg.id}`,
      tipo: "pago",
      titulo: `Pago · ${new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(Number(pg.monto) || 0)}`,
      detalle: pg.estado ?? "pendiente",
      estado: pg.estado,
      fecha: pg.pagado_en ?? pg.creado_en,
      href: "/admin/suscripciones",
      esNuevo: esRecienteMs(pg.pagado_en ?? pg.creado_en, MS_DIA),
    });
  });

  actividad.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return {
    totalEmpresas: totalEmpresas ?? 0,
    totalProveedores: totalProveedores ?? 0,
    totalUsuarios: totalUsuarios ?? 0,
    oportunidadesAbiertas: oportunidadesAbiertas ?? 0,
    empresasPendientes: empresasPendientes ?? 0,
    proveedoresPendientes: proveedoresPendientes ?? 0,
    resenasPendientes: resenasPendientes ?? 0,
    empresasNuevas24h: empresasNuevas24h ?? 0,
    proveedoresNuevos24h: proveedoresNuevos24h ?? 0,
    usuariosNuevos7d: usuariosNuevos7d ?? 0,
    oportunidadesNuevas7d: oportunidadesNuevas7d ?? 0,
    altasPendientes: altasPendientes ?? 0,
    socias,
    plata: { ingresoReal, ingresoPotencial, cortesias, pagando, esperandoPago, cobradoAlgunaVez },
    bandeja: {
      altas: ((altasAbiertas ?? []) as unknown as FilaAlta[]).map((a) => ({
        id: a.id as string,
        nombre: (a.nombre_comercial || a.razon_social) as string,
        referente: a.referente_nombre as string,
        email: a.email as string,
        // 'registro_web' = se registró por /register y el sistema la reconoció en
        // el padrón; 'formulario_web' = la cargó ella misma en /sumate.
        porRegistro: a.origen === "registro_web",
        yaVinculada: Boolean(a.empresa_id),
        contactada: a.estado === "contactado",
        fecha: a.creado_en as string,
      })),
      personas: personasEsperando,
      empresas: ((empresasPorRevisar ?? []) as unknown as FilaEmpresaPendiente[]).map((e) => ({
        id: e.id as string,
        nombre: (e.nombre_comercial || e.razon_social) as string,
        email: (e.email as string | null) ?? "",
        localidad: (e.localidad as string | null) ?? "",
        fecha: e.creado_en as string,
      })),
      resenas: ((resenasPorModerar ?? []) as unknown as FilaResena[]).map((r) => ({
        id: r.id as string,
        calificacion: Number(r.calificacion) || 0,
        comentario: (r.comentario as string | null) ?? "",
        fecha: r.creada_en as string,
      })),
    },
    actividad: actividad.slice(0, 30),
  };
}

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);



export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const pendientesTotal =
    data.bandeja.altas.length +
    data.bandeja.personas.length +
    data.bandeja.empresas.length +
    data.bandeja.resenas.length;

  const faltanEntrar = Math.max(data.socias.publicadas - data.socias.adentro, 0);
  const porcentajeAdentro =
    data.socias.publicadas > 0
      ? Math.round((data.socias.adentro / data.socias.publicadas) * 100)
      : 0;

  // Sólo lo que es cierto y cambia. "Proveedores de servicios" y "Oportunidades"
  // están en cero desde que existe la plataforma: como tarjeta grande ocupaban
  // media pantalla para no decir nada, así que bajan a la tira de abajo.
  const stats = [
    {
      nombre: "Socias en el directorio",
      valor: data.socias.publicadas,
      pie: `${data.socias.adentro} ya entraron`,
      icon: Building,
      accent: "bg-blue-50 text-blue-700",
      href: "/admin/empresas",
    },
    {
      nombre: "Personas con cuenta",
      valor: data.totalUsuarios,
      pie:
        data.usuariosNuevos7d > 0
          ? `${data.usuariosNuevos7d} nuevas esta semana`
          : "Sin altas esta semana",
      icon: Users,
      accent: "bg-violet-50 text-violet-700",
      href: "/admin/usuarios",
    },
    {
      nombre: "Prestadores de servicios",
      valor: data.totalProveedores,
      pie: data.totalProveedores === 0 ? "Todavía ninguno" : "En el directorio",
      icon: Wrench,
      accent: "bg-emerald-50 text-emerald-700",
      href: "/admin/proveedores",
    },
    {
      nombre: "Oportunidades abiertas",
      valor: data.oportunidadesAbiertas,
      pie: data.oportunidadesAbiertas === 0 ? "Nadie publicó todavía" : "Publicadas y vigentes",
      icon: Briefcase,
      accent: "bg-amber-50 text-amber-700",
      href: "/admin/oportunidades",
    },
  ];

  const accesosRapidos = [
    { label: "Altas de socios", href: "/admin/altas", icon: UserPlus },
    { label: "Suscripciones", href: "/admin/suscripciones", icon: DollarSign },
    { label: "Empresas", href: "/admin/empresas", icon: Building },
    { label: "Proveedores de servicios", href: "/admin/proveedores", icon: Wrench },
    { label: "Oportunidades", href: "/admin/oportunidades", icon: Briefcase },
    { label: "Reseñas", href: "/admin/resenas", icon: Star },
    { label: "Usuarios", href: "/admin/usuarios", icon: Users },
    { label: "Servicios", href: "/admin/servicios", icon: FileText },
    { label: "Configuración", href: "/admin/configuracion", icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Administración · Resumen
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Panel de control
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm">
            {pendientesTotal > 0
              ? `Tenés ${pendientesTotal} ${pendientesTotal === 1 ? "cosa" : "cosas"} para resolver. Abajo están, con el botón al lado.`
              : "No hay nada pendiente. Abajo está cómo viene la incorporación de las socias."}
          </p>
        </div>
      </div>

      {/* ── 1. LO QUE HAY QUE HACER ─────────────────────────────────────────
          Va primero y sin competencia: es el único bloque por el que un admin
          entra al panel. Las métricas quedan abajo. */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-600" />
          Para resolver
          {pendientesTotal > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-primary-600 text-white tabular-nums">
              {pendientesTotal}
            </span>
          )}
        </h2>
        <BandejaPendientes bandeja={data.bandeja} />
      </section>

      {/* ── 2. EL EMBUDO DE LAS SOCIAS ──────────────────────────────────────
          La pregunta que la UIAB hace de verdad: "¿cuántas de nuestras socias
          están usando esto?". El panel mostraba el total de fichas, que incluye
          a las que están publicadas sin una sola persona adentro. */}
      <section
        className="rounded-lg p-6 text-white"
        style={{ background: "linear-gradient(135deg, #00213f 0%, #10375c 100%)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-200 mb-2">
              Incorporación de socias
            </p>
            <p className="font-bold leading-none tabular-nums" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              {data.socias.adentro}
              <span className="text-primary-200 font-semibold" style={{ fontSize: "clamp(1rem, 1.6vw, 1.35rem)" }}>
                {" "}de {data.socias.publicadas} ya entraron
              </span>
            </p>
            <p className="text-sm text-primary-100/80 mt-3 max-w-lg">
              {faltanEntrar > 0 ? (
                <>
                  Faltan <strong className="text-white">{faltanEntrar}</strong> fichas publicadas en
                  las que todavía no hay nadie. Están en el directorio, pero nadie de esa empresa
                  puede entrar ni mantenerla al día.
                </>
              ) : (
                <>Todas las fichas publicadas tienen al menos una persona adentro.</>
              )}
            </p>
          </div>
          <div className="lg:text-right shrink-0">
            <p className="text-5xl font-bold tabular-nums leading-none">{porcentajeAdentro}%</p>
            <Link
              href="/admin/altas"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary-200 hover:text-white transition-colors"
            >
              Gestionar altas de socias <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {/* Barra de avance: sin bordes, sólo dos capas tonales. */}
        <div className="mt-6 h-1.5 w-full rounded-sm bg-white/15 overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-sm transition-all"
            style={{ width: `${porcentajeAdentro}%` }}
          />
        </div>
      </section>

      {/* ── 3. NÚMEROS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.nombre}
              href={stat.href}
              className="bg-white rounded-lg p-5 ring-1 ring-slate-100 hover:ring-slate-300 transition-all min-w-0"
            >
              <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 ${stat.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {stat.nombre}
              </p>
              <p
                className="font-bold text-slate-900 tabular-nums leading-none mt-1"
                style={{ fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)" }}
              >
                {stat.valor.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-slate-400 mt-2">{stat.pie}</p>
            </Link>
          );
        })}
      </div>

      {/* ── 4. LA PLATA, SIN INVENTAR ───────────────────────────────────────
          Acá decía "Ingreso mensual estimado $2.750.000 · proyección anual
          $33.000.000". Salía de multiplicar la tarifa de cada ficha aprobada por
          su precio, sin mirar si esa empresa paga: las 55 suscripciones activas
          son todas de cortesía y jamás se acreditó un pago. Era el número más
          grande del panel y era de otra cosa. */}
      <Link
        href="/admin/suscripciones"
        className="block bg-white rounded-lg p-6 ring-1 ring-slate-100 hover:ring-slate-300 transition-all group"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                Se está cobrando
              </p>
              <p
                className="font-bold text-slate-900 tabular-nums leading-none"
                style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
              >
                {formatARS(data.plata.ingresoReal)}
                <span className="text-base font-semibold text-slate-400"> / mes</span>
              </p>
              <p className="text-xs text-slate-500 mt-2 max-w-md">
                {data.plata.pagando === 0 ? (
                  <>
                    Ninguna suscripción cobra todavía: las {data.plata.cortesias} activas son de
                    cortesía. {data.plata.cobradoAlgunaVez === 0 && "Nunca se acreditó un pago."}
                  </>
                ) : (
                  <>
                    {data.plata.pagando} suscripci{data.plata.pagando === 1 ? "ón" : "ones"} paga
                    {data.plata.pagando === 1 ? "" : "n"} y {data.plata.cortesias} son de cortesía.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 lg:justify-end shrink-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Esperando pago
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {data.plata.esperandoPago}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Si todas pagaran
              </p>
              <p className="text-2xl font-bold text-slate-400 tabular-nums">
                {formatARS(data.plata.ingresoPotencial)}
              </p>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-primary-700 group-hover:text-primary-900 transition-colors">
              Ver suscripciones <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>

      {/* ── 5. ACTIVIDAD ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1">
        <ActividadReciente items={data.actividad} />
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {accesosRapidos.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="bg-white rounded-md p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 hover:ring-slate-300 hover:bg-slate-50 transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 shrink-0 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
