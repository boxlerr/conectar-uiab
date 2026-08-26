import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BannerSuscripcion, DashboardBlurGate } from '@/components/ui/BannerSuscripcion';
import { AvisoDatosFaltantes, faltantesDeLaFicha } from '@/components/ui/aviso-datos-faltantes';
import { AvisoEtiquetasPrecargadas } from '@/components/ui/aviso-etiquetas-precargadas';
import { AvisoConflictosPadron } from '@/modulos/altas/componentes/aviso-conflictos-padron';
import { conflictosPendientes, type ConflictoPadron } from '@/modulos/altas/padron';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolverEntidadDePerfil } from '@/modulos/autenticacion/entidad-del-perfil';
import { hrefFichaDeCandidato, slugDeEmpresa, slugDeProveedor } from '@/modulos/compartido/ficha-publica';
import { textoDeFicha } from '@/modulos/compartido/texto-ficha';
import { urlPublicaDeLogo } from '@/modulos/oportunidades/solicitante';
import { estadisticasDeVisitas } from '@/modulos/visitas/consultas';
import { estadisticasVacias } from '@/modulos/visitas/estadisticas';
import { serieAcumulada } from '@/modulos/panel/series';
import { construirActividad } from '@/modulos/panel/actividad';
import {
  etiquetaNorma,
  mapearCertificaciones,
  SELECT_CERTIFICACIONES_DIRECTORIO,
  type CertificacionChip,
} from '@/modulos/certificaciones/normas';
import { SELECT_NOTIFICACION, type Notificacion } from '@/modulos/notificaciones/tipos';
import { FeedNovedades } from '@/modulos/novedades/componentes/feed-novedades';
import { AccionesRapidas, type AccionRapida } from '@/components/ui/panel/acciones-rapidas';
import { HeroPanel } from '@/components/ui/panel/hero-panel';
import { CabeceraPanel, TARJETA, TituloBloque } from '@/components/ui/panel/piezas';
import { PanelNotificaciones } from '@/components/ui/panel/panel-notificaciones';
import { TarjetaActividad } from '@/components/ui/panel/tarjeta-actividad';
import { TarjetaEstadisticas } from '@/components/ui/panel/tarjeta-estadisticas';
import { TarjetaKpi } from '@/components/ui/panel/tarjeta-kpi';
import { TarjetaPlan, type EstadoSuscripcion } from '@/components/ui/panel/tarjeta-plan';
import { VistaPreviaFicha } from '@/components/ui/panel/vista-previa-ficha';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building,
  Users,
  Target,
  Zap,
  ArrowRight,
  Briefcase,
  FileCheck2,
  Sparkles,
  TrendingUp,
  MapPin,
  ChevronRight,
  AlertCircle,
  Plus,
  Search,
  ShieldCheck,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  FileText,
  CircleDot,
  MessageSquare,
  Eye,
  PackageSearch,
  Wrench,
  Building2,
  Camera,
  LayoutGrid,
  Inbox,
} from 'lucide-react';

/**
 * Los joins de supabase-js vienen sin tipar y el render los recorre con `any`.
 * El `disable` cubre el archivo entero a propósito: antes había un
 * `eslint-enable` antes del JSX y las nueve `any` del render quedaban marcadas
 * como error en cada corrida.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function calcProfileCompletion(entity: Record<string, any>, type: 'empresa' | 'proveedor') {
  if (!entity) return { pct: 0 };
  const campos =
    type === 'empresa'
      ? ['razon_social', 'cuit', 'email', 'descripcion', 'direccion', 'localidad', 'provincia', 'nombre_comercial', 'whatsapp']
      : ['nombre', 'apellido', 'cuit', 'email', 'descripcion', 'direccion', 'localidad', 'provincia', 'nombre_comercial', 'whatsapp'];
  let filled = 0;
  for (const k of campos) {
    const v = entity[k];
    if (v !== null && v !== undefined && String(v).trim() !== '') filled++;
  }
  return { pct: Math.round((filled / campos.length) * 100) };
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function scoreColor(s: number) {
  if (s >= 75) return 'bg-emerald-50 text-emerald-700';
  if (s >= 50) return 'bg-sky-50 text-sky-700';
  if (s >= 30) return 'bg-amber-50 text-amber-700';
  return 'bg-[#f2f4f6] text-[#10375c]';
}

const ESTADO_OP: Record<string, { label: string; style: string }> = {
  abierta: { label: 'Abierta', style: 'bg-emerald-50 text-emerald-700' },
  cerrada: { label: 'Cerrada', style: 'bg-[#f2f4f6] text-slate-600' },
  cancelada: { label: 'Cancelada', style: 'bg-red-50 text-red-600' },
};

// ═══════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } },
  );

  // ── Auth ──
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  // `tutoriales_vistos` lo necesita el feed de novedades para saber cuáles ya
  // cerró: se trae acá para no hacerle un fetch aparte.
  const { data: profile } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, rol_sistema, activo, email, tutoriales_vistos, creado_en')
    .eq('id', user.id)
    .single();

  const role = (profile?.rol_sistema as string) || 'guest';
  const isAdmin = role === 'admin';

  // ── Entity membership ──
  // Se resuelve por membresía real y NO por rol: un admin puede ser además
  // dueño de su propia empresa (caso Vaxler) y antes se le quedaba todo el
  // panel vacío, porque `isCompany` salía de `rol_sistema` y nunca llegaba a
  // buscar la ficha. Los bloques de admin siguen colgando de `isAdmin`, así
  // que un admin con ficha ve las dos cosas.
  const entidad = await resolverEntidadDePerfil(supabase, user.id);
  const entityId: string | null = entidad?.id ?? null;
  const isCompany = entidad?.tipo === 'company';
  const isProvider = entidad?.tipo === 'provider';
  const tieneFicha = isCompany || isProvider;

  // ── Diferencias con el padrón que la socia todavía no revisó ──
  // `altas_socios` es deny-by-default para authenticated, así que va por el
  // admin client. El filtro por empresa_id acota la lectura a su propia alta.
  let conflictosPadron: ConflictoPadron[] = [];
  if (isCompany && entityId) {
    const { data: altas } = await createAdminClient()
      .from('altas_socios')
      .select('conflictos_padron')
      .eq('empresa_id', entityId)
      .is('conflictos_revisados_en', null)
      .limit(1);
    conflictosPadron = conflictosPendientes(altas?.[0]?.conflictos_padron as ConflictoPadron[] | null);
  }

  // ── Parallel data fetch ──
  const [
    statsRes,
    altasSociasRes,
    recentOpsRes,
    entityRes,
    catsRes,
    adminPendingRes,
    fourthStatRes,
    myOpsRes,
    suscripcionRes,
    solicitudesRes,
    tagsRes,
    certsRes,
    itemsCountRes,
    resenasCountRes,
    notificacionesRes,
    sinLeerRes,
    visitas,
  ] = await Promise.all([
    // 1) Contadores globales
    Promise.all([
      supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('estado', 'aprobada'),
      supabase.from('proveedores').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
      supabase.from('oportunidades').select('*', { count: 'exact', head: true }).eq('estado', 'abierta'),
    ]),
    // 2) Fechas de aprobación de las socias — la serie del KPI del directorio.
    //    Son ~60 filas de una sola columna: sale más barato que una RPC nueva.
    supabase.from('empresas').select('aprobada_en').eq('estado', 'aprobada'),
    // 3) Últimas oportunidades abiertas de la red
    supabase.from('oportunidades')
      .select('id, titulo, localidad, creado_en, categoria:categorias(nombre)')
      .eq('estado', 'abierta').order('creado_en', { ascending: false }).limit(5),
    // 4) Ficha propia
    isCompany && entityId ? supabase.from('empresas').select('*').eq('id', entityId).single()
      : isProvider && entityId ? supabase.from('proveedores').select('*').eq('id', entityId).single()
      : Promise.resolve({ data: null }),
    // 5) Rubros
    isCompany && entityId ? supabase.from('empresas_categorias').select('categoria:categorias(nombre)').eq('empresa_id', entityId)
      : isProvider && entityId ? supabase.from('proveedores_categorias').select('categoria:categorias(nombre)').eq('proveedor_id', entityId)
      : Promise.resolve({ data: [] }),
    // 6) Pendientes de admin
    isAdmin ? Promise.all([
      supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente_revision'),
      supabase.from('proveedores').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente_revision'),
      supabase.from('resenas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente_revision'),
    ]) : Promise.resolve(null),
    // 7) Cuarta métrica según rol
    isCompany && entityId ? supabase.from('oportunidades').select('*', { count: 'exact', head: true }).eq('empresa_solicitante_id', entityId)
      : isProvider && entityId ? supabase.from('oportunidades_matches').select('*', { count: 'exact', head: true }).eq('proveedor_candidato_id', entityId)
      : Promise.resolve({ count: 0 }),
    // 8) Oportunidades propias
    isCompany && entityId ? supabase.from('oportunidades').select('id, titulo, estado, creado_en, categoria:categorias(nombre)')
      .eq('empresa_solicitante_id', entityId).order('creado_en', { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),
    // 9) Suscripción — se leen también ciclo, método y fechas: la tarjeta de
    //    plan necesita distinguir "al día", "en gracia" y "cortesía".
    entityId ? supabase.from('suscripciones')
      .select('id, estado, ciclo, metodo_pago, monto, proximo_cobro_en, gracia_hasta')
      .or(isCompany ? `empresa_id.eq.${entityId}` : `proveedor_id.eq.${entityId}`)
      .order('creado_en', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    // 10) Solicitudes de presupuesto recibidas
    entityId && tieneFicha
      ? supabase.from('solicitudes_presupuesto')
          .select('id, estado, creado_en, empresa_origen:empresas!solicitudes_presupuesto_empresa_origen_id_fkey(razon_social, nombre_comercial), proveedor_origen:proveedores!solicitudes_presupuesto_proveedor_origen_id_fkey(nombre, nombre_comercial)')
          .eq(isCompany ? 'empresa_destino_id' : 'proveedor_destino_id', entityId)
          .order('creado_en', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    // 11) Etiquetas de match: la ficha las muestra como "especialidades".
    isCompany && entityId ? supabase.from('empresas_tags').select('tags(nombre)').eq('empresa_id', entityId)
      : isProvider && entityId ? supabase.from('proveedores_tags').select('tags(nombre)').eq('proveedor_id', entityId)
      : Promise.resolve({ data: [] }),
    // 12) Certificaciones — `certificaciones_select` es `using (true)` para
    //     authenticated, así que van con el cliente de sesión.
    entityId && tieneFicha
      ? supabase.from('certificaciones')
          .select(`${SELECT_CERTIFICACIONES_DIRECTORIO}, id, creado_en`)
          .eq(isCompany ? 'empresa_id' : 'proveedor_id', entityId)
      : Promise.resolve({ data: [] }),
    // 13) Total del catálogo (los 3 de la tira se traen aparte)
    entityId && tieneFicha
      ? supabase.from('items').select('*', { count: 'exact', head: true })
          .eq(isCompany ? 'empresa_id' : 'proveedor_id', entityId)
      : Promise.resolve({ count: 0 }),
    // 14) Reseñas publicadas sobre la ficha
    entityId && tieneFicha
      ? supabase.from('resenas').select('*', { count: 'exact', head: true })
          .eq(isCompany ? 'empresa_resenada_id' : 'proveedor_resenado_id', entityId)
          .eq('estado', 'aprobada')
      : Promise.resolve({ count: 0 }),
    // 15) Notificaciones propias. La RLS ya filtra por auth.uid(); el .eq es
    //     defensa en profundidad. La columna de orden es `creada_en`.
    supabase.from('notificaciones').select(SELECT_NOTIFICACION)
      .eq('perfil_id', user.id).order('creada_en', { ascending: false }).limit(5),
    // 16) No leídas: conteo real sobre la tabla, no sobre las 5 traídas.
    supabase.from('notificaciones').select('id', { count: 'exact', head: true })
      .eq('perfil_id', user.id).eq('leida', false),
    // 17) Visitas. Van con service role sí o sí: `visitas_perfil` tiene RLS sin
    //     políticas y con la anon key devuelve [] sin avisar.
    entityId && tieneFicha
      ? estadisticasDeVisitas(isCompany ? 'company' : 'provider', entityId)
      : Promise.resolve(estadisticasVacias()),
  ]);

  const empresasCount = statsRes[0].count ?? 0;
  const proveedoresCount = statsRes[1].count ?? 0;
  const oportunidadesCount = statsRes[2].count ?? 0;
  const recentOps = (recentOpsRes.data as any[]) || [];
  const entityData = entityRes.data as Record<string, any> | null;
  const entityCategories = ((catsRes.data as any[]) || []).map((c: any) => c.categoria?.nombre).filter(Boolean);
  const myOps = (myOpsRes as any).data as any[] || [];
  const suscripcion = (suscripcionRes as any).data as any | null;
  const solicitudes = (solicitudesRes as any).data as any[] || [];
  const entityTags: string[] = ((tagsRes as any).data as any[] || [])
    .map((t: any) => t.tags?.nombre).filter(Boolean);
  const certsRaw = ((certsRes as any).data as any[]) || [];
  const certificaciones: CertificacionChip[] = entityId
    ? mapearCertificaciones(certsRaw).get(entityId) ?? []
    : [];
  const totalItems = (itemsCountRes as any)?.count ?? 0;
  const totalResenas = (resenasCountRes as any)?.count ?? 0;
  const notificaciones = ((notificacionesRes as any).data as Notificacion[] | null) ?? [];
  const sinLeer = (sinLeerRes as any)?.count ?? 0;

  // Serie real del directorio: el acumulado de socias aprobadas, día a día.
  const socias = serieAcumulada(
    (((altasSociasRes as any).data as any[]) || []).map((e: any) => e.aprobada_en),
  );

  let pendingEmpresas = 0, pendingProveedores = 0, pendingResenas = 0;
  if (isAdmin && adminPendingRes) {
    const p = adminPendingRes as any[];
    pendingEmpresas = p[0]?.count ?? 0;
    pendingProveedores = p[1]?.count ?? 0;
    pendingResenas = p[2]?.count ?? 0;
  }
  const totalPending = pendingEmpresas + pendingProveedores + pendingResenas;
  const fourthStatCount = (fourthStatRes as any)?.count ?? 0;

  // ── Matches ──
  // Un candidato puede ser una SOCIA (`empresa_candidata_id`) o un prestador
  // (`proveedor_candidato_id`) — nunca los dos. Traer sólo el join de
  // `proveedores`, como se hacía antes, dejaba las tarjetas literalmente en
  // blanco: hoy las candidatas son socias y la tabla `proveedores` está vacía.
  let dashboardMatches: any[] = [];
  let ultimaOportunidadId: string | null = null;
  if (isCompany && entityId) {
    const { data: latestOp } = await supabase.from('oportunidades').select('id')
      .eq('empresa_solicitante_id', entityId).eq('estado', 'abierta')
      .order('creado_en', { ascending: false }).limit(1).maybeSingle();
    if (latestOp) {
      ultimaOportunidadId = latestOp.id;
      const { data } = await supabase.from('oportunidades_matches')
        .select(`
          *,
          empresa:empresas!oportunidades_matches_empresa_candidata_id_fkey(razon_social, nombre_comercial, localidad, ruta_logo, bucket_logo),
          proveedor:proveedores!oportunidades_matches_proveedor_candidato_id_fkey(nombre, apellido, nombre_comercial, localidad, ruta_logo, bucket_logo)
        `)
        .eq('oportunidad_id', latestOp.id).order('puntaje', { ascending: false }).limit(3);
      dashboardMatches = data || [];
    }
  } else if (isProvider && entityId) {
    const { data } = await supabase.from('oportunidades_matches')
      .select('*, oportunidad:oportunidades(titulo, localidad)')
      .eq('proveedor_candidato_id', entityId).order('puntaje', { ascending: false }).limit(3);
    dashboardMatches = data || [];
  }

  // ── Productos / Servicios (los 3 más nuevos, para la tira del panel) ──
  const { data: myItemsData } = tieneFicha && entityId
    ? await supabase.from('items')
        .select('id, nombre, precio, estado, tipo_item, creado_en, imagenes:imagenes_item(bucket, ruta_archivo, orden)')
        .eq(isCompany ? 'empresa_id' : 'proveedor_id', entityId)
        .order('creado_en', { ascending: false })
        .order('orden', { foreignTable: 'imagenes_item', ascending: true })
        .limit(3)
    : { data: [] };
  const myItems = myItemsData || [];

  // ── Derivados ──
  const { pct: profilePct } = entityData
    ? calcProfileCompletion(entityData, isCompany ? 'empresa' : 'proveedor')
    : { pct: 0 };
  const firstName = profile?.nombre_completo?.split(' ')[0] || 'Usuario';
  const hasLogo = !!entityData?.ruta_logo;
  const logoUrl = urlPublicaDeLogo(entityData?.bucket_logo, entityData?.ruta_logo);

  const displayName = isCompany
    ? (entityData?.nombre_comercial || entityData?.razon_social || 'Empresa sin nombre')
    : isProvider
      ? (entityData?.nombre_comercial || `${entityData?.nombre} ${entityData?.apellido}`.trim() || 'Profesional sin nombre')
      : firstName;

  /**
   * El slug NO es una columna de `empresas`: se recalcula de `razon_social` en
   * cada render. Este link leía `entityData.slug`, que siempre es `undefined`,
   * así que el botón de la ficha pública no se renderizaba nunca — el panel
   * jamás ofreció una forma de llegar a la ficha propia.
   */
  const slugPublico = isCompany
    ? slugDeEmpresa(entityData?.razon_social)
    : isProvider
      ? slugDeProveedor(entityData ?? {})
      : null;
  const publicProfileUrl = slugPublico ? `/empresas/${slugPublico}` : null;

  const descripcionFicha = entityData ? textoDeFicha(entityData) : null;
  const ubicacionFicha = entityData
    ? [entityData.localidad, entityData.direccion].filter(Boolean).join(', ') || null
    : null;
  const fichaVerificada = entityData?.estado === 'aprobada' || entityData?.estado === 'aprobado';

  // ── Suscripción ──
  // Sin fila se trata como "nunca activó", igual que el gate del middleware.
  const estadoSuscripcion = (suscripcion?.estado as EstadoSuscripcion | undefined) ?? null;
  const esCortesia = Boolean(
    suscripcion && (suscripcion.metodo_pago === 'cortesia' || Number(suscripcion.monto) === 0),
  );

  // ── Actividad reciente: eventos reales, no un log inventado ──
  const actividad = construirActividad({
    entidad: entityData,
    items: myItems.map((i: any) => ({
      id: i.id, nombre: i.nombre, tipo_item: i.tipo_item, creado_en: i.creado_en,
    })),
    certificaciones: certsRaw
      .filter((c: any) => c.creado_en)
      .map((c: any) => ({
        id: c.id,
        etiqueta: etiquetaNorma(c.codigo_norma, c.nombre_libre),
        creado_en: c.creado_en,
      })),
    oportunidades: myOps.map((o: any) => ({ id: o.id, titulo: o.titulo, creado_en: o.creado_en })),
    solicitudes: solicitudes.map((s: any) => ({
      id: s.id,
      origen:
        s.empresa_origen?.nombre_comercial || s.empresa_origen?.razon_social ||
        s.proveedor_origen?.nombre_comercial || s.proveedor_origen?.nombre || 'Una socia',
      creado_en: s.creado_en,
    })),
  });

  // Pasos de onboarding
  const onboardingSteps = [
    { done: !!entityData, label: isCompany ? 'Crear perfil de empresa' : 'Crear perfil profesional', href: '/perfil/datos', icon: Building },
    { done: profilePct >= 60, label: 'Completar datos principales', href: '/perfil/datos', icon: FileText },
    { done: hasLogo, label: isCompany ? 'Subir logo de empresa' : 'Subir foto de perfil', href: '/perfil/datos', icon: Camera },
    { done: entityCategories.length > 0, label: isCompany ? 'Seleccionar sectores' : 'Elegir especialidades', href: '/perfil/servicios', icon: Target },
  ];
  const stepsCompleted = onboardingSteps.filter(s => s.done).length;
  const showOnboarding = stepsCompleted < onboardingSteps.length;

  // Accesos directos.
  // OJO: `/perfil/documentos` no está en la nav de /perfil — esta lista es el
  // único camino a esa pantalla en toda la app.
  const quickActions: AccionRapida[] = isAdmin && !tieneFicha
    ? [
        { href: '/admin', icono: ShieldCheck, label: 'Panel Admin', tono: 'bg-blue-50 text-blue-500' },
        { href: '/admin/empresas', icono: Building, label: 'Socios UIAB', tono: 'bg-emerald-50 text-emerald-500' },
        { href: '/admin/proveedores', icono: Users, label: 'Proveedores de servicios', tono: 'bg-amber-50 text-amber-500' },
        { href: '/admin/etiquetas', icono: Sparkles, label: 'Etiquetas', tono: 'bg-violet-50 text-violet-500' },
      ]
    : isCompany
      ? [
          { href: '/oportunidades/nueva', icono: Plus, label: 'Publicar oportunidad', tono: 'bg-blue-50 text-blue-500' },
          { href: '/empresas?categoria=proveedores', icono: Search, label: 'Buscar proveedores', tono: 'bg-emerald-50 text-emerald-500' },
          { href: '/perfil/productos-servicios', icono: LayoutGrid, label: 'Agregar producto o servicio', tono: 'bg-amber-50 text-amber-500' },
          { href: '/perfil/etiquetas', icono: Sparkles, label: 'Etiquetas de match', tono: 'bg-violet-50 text-violet-500' },
          { href: '/perfil/certificaciones', icono: Award, label: 'Certificaciones', tono: 'bg-teal-50 text-teal-500' },
          { href: '/perfil/documentos', icono: FileCheck2, label: 'Legajo y habilitaciones', tono: 'bg-rose-50 text-rose-500' },
        ]
      : [
          { href: '/oportunidades', icono: Briefcase, label: 'Ver oportunidades', tono: 'bg-blue-50 text-blue-500' },
          { href: '/empresas', icono: Building, label: 'Explorar socios UIAB', tono: 'bg-emerald-50 text-emerald-500' },
          { href: '/perfil/productos-servicios', icono: LayoutGrid, label: 'Agregar producto o servicio', tono: 'bg-amber-50 text-amber-500' },
          { href: '/perfil/etiquetas', icono: Sparkles, label: 'Etiquetas de match', tono: 'bg-violet-50 text-violet-500' },
          { href: '/perfil/certificaciones', icono: Award, label: 'Certificaciones', tono: 'bg-teal-50 text-teal-500' },
          { href: '/perfil/documentos', icono: FileCheck2, label: 'Legajo y habilitaciones', tono: 'bg-rose-50 text-rose-500' },
        ];

  const menuHero = [
    { href: '/perfil/datos', label: 'Datos y contacto' },
    { href: '/perfil/servicios', label: 'Rubros y especialidades' },
    { href: '/perfil/etiquetas', label: 'Etiquetas de match' },
    ...(tieneFicha ? [{ href: '/perfil/usuarios', label: 'Usuarios de mi empresa' }] : []),
    { href: '/perfil/suscripcion', label: 'Mi suscripción' },
    ...(isAdmin ? [{ href: '/admin', label: 'Panel de administración' }] : []),
  ];

  /**
   * KPIs. La línea de tendencia aparece SÓLO donde hay serie real: visitas a la
   * ficha (`visitas_perfil`, por día) y socias del directorio (acumulado de
   * `empresas.aprobada_en`). Prestadores y oportunidades están en cero en la
   * base: ahí va el guión, igual que en el mockup. Dibujarles una curva sería
   * inventar una tendencia.
   */
  const kpis = [
    ...(tieneFicha
      ? [{
          key: 'visitas',
          icono: Eye,
          valor: visitas.total,
          etiqueta: 'Visitas a tu ficha',
          sub: visitas.ultimos30 > 0 ? `${visitas.ultimos30} en los últimos 30 días` : 'Total histórico',
          href: '#estadisticas',
          tono: { fondo: 'bg-violet-50', texto: 'text-violet-500', linea: '#7c3aed' },
          serie: visitas.serie,
          variacion: visitas.variacion,
          tituloVariacion: 'Contra los 30 días anteriores',
        }]
      : []),
    {
      key: 'socias',
      icono: Building,
      valor: empresasCount,
      etiqueta: 'Socios UIAB',
      sub: 'En el directorio',
      href: '/empresas',
      tono: { fondo: 'bg-blue-50', texto: 'text-blue-500', linea: '#2563eb' },
      serie: socias.serie,
      variacion: socias.variacion,
      tituloVariacion: 'Crecimiento del directorio en 30 días',
    },
    {
      key: 'prestadores',
      icono: Users,
      valor: proveedoresCount,
      etiqueta: 'Proveedores de servicios',
      sub: 'Verificados',
      href: '/empresas?categoria=proveedores',
      tono: { fondo: 'bg-emerald-50', texto: 'text-emerald-500', linea: '#10b981' },
      serie: undefined,
      variacion: null,
      tituloVariacion: undefined,
    },
    {
      key: 'oportunidades',
      icono: Target,
      valor: oportunidadesCount,
      etiqueta: 'Oportunidades',
      sub: 'Abiertas ahora',
      href: '/oportunidades',
      tono: { fondo: 'bg-amber-50', texto: 'text-amber-500', linea: '#f59e0b' },
      serie: undefined,
      variacion: null,
      tituloVariacion: undefined,
    },
    ...(tieneFicha
      ? []
      : [{
          key: 'pendientes',
          icono: isAdmin ? AlertCircle : Zap,
          valor: isAdmin ? totalPending : fourthStatCount,
          etiqueta: isAdmin ? 'Pendientes' : 'Mis matches',
          sub: isAdmin ? 'A revisar' : 'Activos',
          href: isAdmin ? '/admin' : '/oportunidades',
          tono: { fondo: 'bg-violet-50', texto: 'text-violet-500', linea: '#7c3aed' },
          serie: undefined,
          variacion: null,
          tituloVariacion: undefined,
        }]),
  ];

  // ═════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════

  return (
    <>
    <BannerSuscripcion />
    <DashboardBlurGate>
    {/* svh (no vh ni dvh): evita que la barra de Safari en iOS recorte el alto */}
    <main className="min-h-svh bg-[#f2f5f8]">
      <div className="mx-auto max-w-[1320px] space-y-6 px-4 pb-24 pt-8 sm:px-6 lg:px-8">

        <AvisoDatosFaltantes faltantes={faltantesDeLaFicha(entityData)} />
        <AvisoConflictosPadron conflictos={conflictosPadron} />
        <AvisoEtiquetasPrecargadas />

        <HeroPanel
          displayName={displayName}
          logoUrl={logoUrl}
          tipoEtiqueta={isCompany ? 'Empresa' : isProvider ? 'Proveedor de servicios' : isAdmin ? 'Admin' : 'Invitado'}
          verificada={fichaVerificada}
          gestionadoPor={profile?.nombre_completo ?? null}
          miembroDesde={entityData?.creado_en ?? profile?.creado_en ?? null}
          contacto={{
            email: entityData?.email,
            localidad: entityData?.localidad,
            sitioWeb: entityData?.sitio_web,
            telefono: entityData?.telefono,
          }}
          hrefFicha={publicProfileUrl}
          completitud={profilePct}
          menu={menuHero}
        />

        {/* ── BANNER DE ADMIN ── */}
        {isAdmin && totalPending > 0 && (
          <section className="flex animate-in flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 duration-500 fade-in sm:px-6 [animation-fill-mode:both]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">{totalPending} solicitud{totalPending !== 1 ? 'es' : ''} pendiente{totalPending !== 1 ? 's' : ''}</p>
                <p className="mt-0.5 text-xs text-amber-600/70">{pendingEmpresas} empresas · {pendingProveedores} proveedores de servicios · {pendingResenas} reseñas</p>
              </div>
            </div>
            <Link href="/admin" className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-amber-800 transition-colors hover:text-amber-900">
              Panel Admin <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {/* ── ONBOARDING (si está incompleto) ── */}
        {showOnboarding && tieneFicha && (() => {
          const pct = Math.round((stepsCompleted / onboardingSteps.length) * 100);
          const circ = 2 * Math.PI * 34;
          return (
            <section className="animate-in overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_-8px_rgba(0,33,63,0.1)] ring-1 ring-slate-200/50 duration-700 fade-in slide-in-from-bottom-3 [animation-delay:120ms] [animation-fill-mode:both]">
              <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-6 sm:gap-6 sm:px-8">
                <div className="relative h-[86px] w-[86px] shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="34" stroke="url(#onbGrad)" strokeWidth="6" fill="none"
                      strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} />
                    <defs>
                      <linearGradient id="onbGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#00213f" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-poppins text-lg font-extrabold text-[#00213f]">{pct}%</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-poppins text-lg font-bold text-[#00213f]">Completá tu perfil</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    <span className="font-semibold text-[#00213f]">{stepsCompleted}</span> de {onboardingSteps.length} pasos listos · te faltan {onboardingSteps.length - stepsCompleted} para aparecer en el directorio
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 px-5 py-6 sm:grid-cols-2 sm:px-8">
                {onboardingSteps.map((step) => (
                  <Link key={step.label} href={step.href}
                    className={`group flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                      step.done
                        ? 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-[#00213f]/25 hover:bg-slate-50/80 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      step.done ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)]' : 'bg-slate-100 text-slate-500 group-hover:bg-[#00213f] group-hover:text-white'
                    }`}>
                      {step.done ? <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} /> : <step.icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold leading-tight ${step.done ? 'text-emerald-800' : 'text-[#00213f]'}`}>{step.label}</p>
                      <p className={`mt-0.5 text-[11px] ${step.done ? 'text-emerald-600/80' : 'text-slate-400'}`}>
                        {step.done ? 'Listo' : 'Pendiente · tocá para completar'}
                      </p>
                    </div>
                    {!step.done && <ChevronRight className="h-4 w-4 text-slate-200 transition-colors group-hover:text-[#00213f]" />}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ── RESUMEN GENERAL ── */}
        <section className="animate-in space-y-3 duration-700 fade-in slide-in-from-bottom-3 [animation-delay:160ms] [animation-fill-mode:both]">
          <TituloBloque titulo="Resumen general" icono={BarChart3} />
          <div data-tour="dash-kpis" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <TarjetaKpi
                key={k.key}
                icono={k.icono}
                valor={k.valor}
                etiqueta={k.etiqueta}
                sub={k.sub}
                href={k.href}
                tono={k.tono}
                serie={k.serie}
                variacion={k.variacion}
                tituloVariacion={k.tituloVariacion}
              />
            ))}
          </div>
        </section>

        {/* ── GRILLA PRINCIPAL ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

          {/* IZQUIERDA */}
          <div className="space-y-5 lg:col-span-8">

            {/* Actividad + Estadísticas, lado a lado como en el mockup */}
            {tieneFicha ? (
              <div id="estadisticas" className="grid scroll-mt-24 animate-in grid-cols-1 gap-5 duration-700 fade-in slide-in-from-bottom-3 lg:grid-cols-5 [animation-delay:220ms] [animation-fill-mode:both]">
                <div data-tour="dash-feed" className="lg:col-span-2">
                  <TarjetaActividad eventos={actividad} />
                </div>
                <div className="lg:col-span-3">
                  <TarjetaEstadisticas stats={visitas} hrefFicha={publicProfileUrl} />
                </div>
              </div>
            ) : (
              <div data-tour="dash-feed">
                <TarjetaActividad eventos={actividad} />
              </div>
            )}

            {/* TU FICHA EN EL DIRECTORIO */}
            {tieneFicha && entityData && (
              <div className="animate-in duration-700 fade-in slide-in-from-bottom-3 [animation-delay:280ms] [animation-fill-mode:both]">
                <VistaPreviaFicha
                  nombre={isCompany ? (entityData.razon_social || displayName) : displayName}
                  inicial={displayName.charAt(0).toUpperCase()}
                  logoUrl={logoUrl}
                  verificada={fichaVerificada}
                  ubicacion={ubicacionFicha}
                  descripcion={descripcionFicha}
                  rubros={entityCategories}
                  especialidades={entityTags}
                  certificaciones={certificaciones}
                  totalItems={totalItems}
                  totalResenas={totalResenas}
                  href={publicProfileUrl}
                />
              </div>
            )}

            {/* MIS PRODUCTOS Y SERVICIOS */}
            {tieneFicha && (
              <section data-tour="dash-items" className={TARJETA}>
                <CabeceraPanel
                  titulo={`Mis productos y servicios${totalItems > 0 ? ` (${totalItems})` : ''}`}
                  icono={PackageSearch}
                  tonoIcono="text-teal-500"
                  accion={{ href: '/perfil/productos-servicios', label: 'Ver todas' }}
                />
                {myItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-3">
                    {myItems.map((item: any) => {
                      const itemImg = Array.isArray(item.imagenes) && item.imagenes.length > 0
                        ? urlPublicaDeLogo(item.imagenes[0].bucket, item.imagenes[0].ruta_archivo)
                        : null;
                      return (
                        <Link key={item.id} href="/perfil/productos-servicios"
                          className="group flex items-center gap-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-[0_8px_20px_-10px_rgba(0,33,63,0.2)]">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/60 bg-white">
                            {itemImg ? (
                              <Image src={itemImg} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
                            ) : (
                              item.tipo_item === 'servicio' ? <Wrench className="h-5 w-5 text-slate-300" /> : <PackageSearch className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[#00213f]">{item.nombre}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[10.5px] uppercase tracking-wider text-slate-400">{item.tipo_item || 'Producto'}</span>
                              {item.precio && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-[11px] font-bold text-emerald-600">$ {Number(item.precio).toLocaleString('es-AR')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-200 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-7 py-9 text-center">
                    <Image src="/panel/ilustracion-catalogo.webp" alt="" width={220} height={220}
                      className="mx-auto h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200/70" aria-hidden />
                    <p className="mt-3.5 font-poppins text-[15px] font-bold text-[#00213f]">Tu catálogo está vacío</p>
                    <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-400">
                      Los productos y servicios son lo que ve una empresa cuando entra a tu ficha, y lo que el buscador del directorio usa para encontrarte.
                    </p>
                    <Link href="/perfil/productos-servicios" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#00213f] transition-colors hover:text-[#2563eb]">
                      Cargar el primero <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* CANDIDATOS RECOMENDADOS */}
            {tieneFicha && (
              <section data-tour="dash-matches" className={TARJETA}>
                {/* "Ver todo" tiene que llevar a donde está la lista completa
                    —el detalle de la oportunidad—, no a la cartelera general. */}
                <CabeceraPanel
                  titulo={isCompany ? 'Candidatos recomendados' : 'Oportunidades para vos'}
                  icono={Sparkles}
                  tonoIcono="text-sky-500"
                  accion={{
                    href: isCompany && ultimaOportunidadId ? `/oportunidades/${ultimaOportunidadId}` : '/oportunidades',
                    label: 'Ver todo',
                  }}
                />
                <div className="p-5">
                  {dashboardMatches.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {dashboardMatches.map((match: any) => {
                        const score = Math.round(match.puntaje);
                        // Como prestador, la tarjeta es la oportunidad que le
                        // recomendamos; como socia, es la candidata sugerida
                        // para SU pedido — y ahí el destino es la ficha de esa
                        // candidata, no el pedido propio.
                        const candidato = match.empresa ?? match.proveedor ?? null;
                        const nombre = isProvider
                          ? match.oportunidad?.titulo
                          : match.empresa?.nombre_comercial || match.empresa?.razon_social ||
                            match.proveedor?.nombre_comercial || match.proveedor?.nombre;
                        const localidad = isProvider ? match.oportunidad?.localidad : candidato?.localidad;
                        const href = isProvider ? `/oportunidades/${match.oportunidad_id}` : hrefFichaDeCandidato(match);
                        const logoCandidato = isProvider ? null : urlPublicaDeLogo(candidato?.bucket_logo, candidato?.ruta_logo);

                        const tarjeta = (
                          <div className="group flex h-full flex-col rounded-xl border border-slate-100 bg-[#f8fafc] p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-[0_8px_20px_-10px_rgba(0,33,63,0.2)]">
                            <div className="mb-3 flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-black ${scoreColor(score)}`}>
                                <TrendingUp className="h-3 w-3" />{score}%
                              </span>
                              {href && <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-[#00213f]" />}
                            </div>
                            {!isProvider && (
                              <span className="mb-2.5 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                                {logoCandidato ? (
                                  <Image src={logoCandidato} alt="" width={44} height={44} className="h-full w-full object-contain p-1.5" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-slate-300" />
                                )}
                              </span>
                            )}
                            <h4 className="line-clamp-2 flex-1 font-poppins text-[13.5px] font-bold leading-snug text-[#00213f] [overflow-wrap:anywhere]">
                              {nombre || 'Sin nombre'}
                            </h4>
                            {localidad && (
                              <p className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <MapPin className="h-3 w-3" />{localidad}
                              </p>
                            )}
                          </div>
                        );

                        // Sin destino no se pinta un link muerto: si el join no
                        // trajo la contraparte (RLS) la tarjeta queda estática.
                        return href
                          ? <Link key={match.id} href={href} className="h-full">{tarjeta}</Link>
                          : <div key={match.id} className="h-full">{tarjeta}</div>;
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-full bg-sky-50">
                        <Activity className="h-5 w-5 text-sky-400" />
                      </div>
                      {/* Tres vacíos distintos, tres salidas distintas: sin
                          pedido abierto hay que publicar; con pedido abierto y
                          sin coincidencias lo que falta son etiquetas. */}
                      <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-slate-400">
                        {!isCompany
                          ? 'Completá tu perfil para recibir oportunidades relevantes.'
                          : ultimaOportunidadId
                          ? 'Todavía no hay socias con compatibilidad suficiente para tu pedido. Sumale etiquetas para ampliar la búsqueda.'
                          : 'Publicá una oportunidad para recibir candidatos recomendados.'}
                      </p>
                      <Link
                        href={!isCompany ? '/perfil/datos' : ultimaOportunidadId ? `/oportunidades/${ultimaOportunidadId}` : '/oportunidades/nueva'}
                        className="mt-3.5 inline-flex items-center gap-1 text-[13px] font-bold text-[#00213f] transition-colors hover:text-[#2563eb]"
                      >
                        {!isCompany ? 'Completar perfil' : ultimaOportunidadId ? 'Ver mi oportunidad' : 'Publicar oportunidad'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* MIS OPORTUNIDADES + SOLICITUDES */}
            {(myOps.length > 0 || solicitudes.length > 0) && (
              <div className="grid grid-cols-1 gap-5 tab:grid-cols-2">
                {isCompany && myOps.length > 0 && (
                  <section className={TARJETA}>
                    <CabeceraPanel titulo="Tus oportunidades" icono={Target} tonoIcono="text-amber-500" accion={{ href: '/oportunidades', label: 'Ver todas' }} />
                    <div className="divide-y divide-slate-50">
                      {myOps.map((op: any) => {
                        const est = ESTADO_OP[op.estado] || { label: op.estado, style: 'bg-slate-50 text-slate-500' };
                        return (
                          <Link key={op.id} href={`/oportunidades/${op.id}`} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#f8fafc] sm:px-6">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                              <CircleDot className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-[#00213f]">{op.titulo}</p>
                              <p className="mt-0.5 truncate text-[12px] text-slate-400">
                                {(op.categoria as any)?.nombre ? `${(op.categoria as any).nombre} · ` : ''}{timeAgo(op.creado_en)}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${est.style}`}>{est.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                {tieneFicha && solicitudes.length > 0 && (
                  <section className={TARJETA}>
                    <CabeceraPanel titulo="Solicitudes recibidas" icono={Inbox} tonoIcono="text-indigo-500" accion={{ href: '/perfil/solicitudes', label: 'Ver bandeja' }} />
                    <div className="divide-y divide-slate-50">
                      {solicitudes.slice(0, 4).map((sol: any) => {
                        const origenNombre =
                          sol.empresa_origen?.nombre_comercial || sol.empresa_origen?.razon_social ||
                          sol.proveedor_origen?.nombre_comercial || sol.proveedor_origen?.nombre || 'Solicitante';
                        return (
                          <Link href="/perfil/solicitudes" key={sol.id} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#f8fafc] sm:px-6">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                              <MessageSquare className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-[#00213f]">{origenNombre}</p>
                              <p className="mt-0.5 text-[12px] text-slate-400">{timeAgo(sol.creado_en)}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                              sol.estado === 'enviada' ? 'bg-amber-50 text-amber-600' :
                              sol.estado === 'respondida' ? 'bg-emerald-50 text-emerald-600' :
                              sol.estado === 'vista' ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-500'
                            }`}>{sol.estado}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ÚLTIMAS OPORTUNIDADES DE LA RED */}
            <section className={TARJETA}>
              <CabeceraPanel titulo="Últimas oportunidades de la red" icono={Briefcase} tonoIcono="text-orange-500" accion={{ href: '/oportunidades', label: 'Ver todas' }} />
              {recentOps.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {recentOps.map((op: any) => (
                    <Link key={op.id} href={`/oportunidades/${op.id}`} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#f8fafc] sm:px-6">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50">
                        <Target className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-[#00213f]">{op.titulo}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {(op.categoria as any)?.nombre && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">{(op.categoria as any).nombre}</span>
                          )}
                          {op.localidad && (
                            <span className="flex items-center gap-0.5 text-[11.5px] text-slate-400"><MapPin className="h-3 w-3" />{op.localidad}</span>
                          )}
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-slate-400">
                        <Clock className="h-3 w-3" />{timeAgo(op.creado_en)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-7 py-9 text-center">
                  <Image src="/panel/ilustracion-ficha.webp" alt="" width={220} height={220}
                    className="mx-auto h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200/70" aria-hidden />
                  <p className="mt-3.5 font-poppins text-[15px] font-bold text-[#00213f]">No hay oportunidades abiertas</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-400">
                    {isCompany
                      ? 'Cuando una socia publique lo que necesita comprar o contratar, te aparece acá. También podés publicar la tuya.'
                      : 'Cuando una socia publique un requerimiento, te aparece acá.'}
                  </p>
                  {isCompany && (
                    <Link href="/oportunidades/nueva" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#00213f] transition-colors hover:text-[#2563eb]">
                      Publicar una oportunidad <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-5 lg:col-span-4">
            {tieneFicha && (
              <TarjetaPlan
                estado={estadoSuscripcion}
                ciclo={suscripcion?.ciclo ?? null}
                esCortesia={esCortesia}
                proximoCobro={suscripcion?.proximo_cobro_en ?? null}
                graciaHasta={suscripcion?.gracia_hasta ?? null}
              />
            )}

            <AccionesRapidas acciones={quickActions} />

            <PanelNotificaciones notificaciones={notificaciones} sinLeer={sinLeer} />

            {/* EXPLORAR LA RED */}
            <section data-tour="dash-explore" className="relative overflow-hidden rounded-2xl"
              style={{ background: 'linear-gradient(150deg, #001829 0%, #00213f 52%, #0b3268 100%)' }}>
              <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-[0.22]"
                style={{ backgroundImage: "url('/panel/textura-parque-industrial.webp')" }} />
              <div aria-hidden className="absolute inset-0" style={{
                background: 'linear-gradient(150deg, rgba(0,24,41,0.9) 0%, rgba(0,33,63,0.87) 52%, rgba(11,50,104,0.82) 100%)',
              }} />
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
              <div className="relative z-10 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  {isCompany ? <Users className="h-5 w-5 text-sky-300" /> : <Building className="h-5 w-5 text-sky-300" />}
                </div>
                <h3 className="font-poppins text-[16px] font-bold leading-snug text-white">
                  {isCompany ? 'Encontrá proveedores de servicios' : isProvider ? 'Explorá empresas' : 'Directorio UIAB'}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                  {isCompany
                    ? 'Proveedores de servicios verificados para las necesidades de tu empresa.'
                    : 'Empresas que buscan tus servicios en Almirante Brown.'}
                </p>
                <Link href={isCompany ? '/empresas?categoria=proveedores' : '/empresas'}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-[#00213f] shadow-lg shadow-black/25 transition-all hover:bg-sky-50">
                  {isCompany ? 'Ver proveedores' : 'Ver empresas'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            {/* RED INDUSTRIAL */}
            <section className={TARJETA}>
              <CabeceraPanel titulo="Red industrial" icono={BarChart3} tonoIcono="text-slate-400" />
              <div className="space-y-3.5 p-5">
                {[
                  { label: 'Empresas socias', value: empresasCount, dot: 'bg-blue-500' },
                  { label: 'Proveedores verificados', value: proveedoresCount, dot: 'bg-emerald-500' },
                  { label: 'Oportunidades abiertas', value: oportunidadesCount, dot: 'bg-amber-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                    <span className="flex-1 text-[13px] text-slate-500">{s.label}</span>
                    <span className="font-poppins text-[15px] font-black tabular-nums text-[#00213f]">{s.value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── NOVEDADES DEL SISTEMA ──
            A todo lo ancho: los carteles que hasta ahora se veían una sola vez
            y no volvían nunca. */}
        <FeedNovedades
          tieneFicha={tieneFicha}
          vistas={(profile?.tutoriales_vistos ?? {}) as Record<string, string | null>}
        />

      </div>
    </main>
    </DashboardBlurGate>
    </>
  );
}
