import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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
  Settings,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Bell,
  Camera,
  FileText,
  CircleDot,
  MessageSquare,
  Eye,
  User,
  PackageSearch,
  Wrench,
  Globe,
  Mail,
  Link2,
  Phone,
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function calcProfileCompletion(entity: Record<string, any>, type: 'empresa' | 'proveedor') {
  if (!entity) return { pct: 0, missing: [] as string[] };
  const fieldMap =
    type === 'empresa'
      ? { razon_social: 'Razón Social', cuit: 'CUIT', email: 'Email', descripcion: 'Descripción', direccion: 'Dirección', localidad: 'Localidad', provincia: 'Provincia', nombre_comercial: 'Nombre Comercial', whatsapp: 'WhatsApp' }
      : { nombre: 'Nombre', apellido: 'Apellido', cuit: 'CUIT', email: 'Email', descripcion: 'Descripción', direccion: 'Dirección', localidad: 'Localidad', provincia: 'Provincia', nombre_comercial: 'Nombre Comercial', whatsapp: 'WhatsApp' };
  const missing: string[] = [];
  let filled = 0;
  for (const [k, label] of Object.entries(fieldMap)) {
    const v = entity[k];
    if (v !== null && v !== undefined && String(v).trim() !== '') filled++;
    else missing.push(label);
  }
  return { pct: Math.round((filled / Object.keys(fieldMap).length) * 100), missing };
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function scoreColor(s: number) {
  if (s >= 75) return 'bg-emerald-50/80 text-emerald-700';
  if (s >= 50) return 'bg-sky-50/80 text-sky-700';
  if (s >= 30) return 'bg-amber-50/80 text-amber-700';
  return 'bg-[#f2f4f6] text-[#10375c]';
}

const TARIFA_BADGE: Record<number, { label: string; style: string }> = {
  1: { label: 'Nivel 1', style: 'bg-[#f2f4f6] text-[#10375c]' },
  2: { label: 'Nivel 2', style: 'bg-sky-50 text-sky-800' },
  3: { label: 'Nivel 3', style: 'bg-amber-50 text-amber-800' },
};

const ESTADO_OP: Record<string, { label: string; style: string }> = {
  abierta: { label: 'Abierta', style: 'bg-emerald-50/80 text-emerald-700' },
  cerrada: { label: 'Cerrada', style: 'bg-[#f2f4f6] text-slate-600' },
  cancelada: { label: 'Cancelada', style: 'bg-red-50/80 text-red-600' },
};

function ars(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

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

  const { data: profile } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, rol_sistema, activo, email')
    .eq('id', user.id)
    .single();

  const role = (profile?.rol_sistema as string) || 'guest';
  const isCompany = role === 'company';
  const isProvider = role === 'provider';
  const isAdmin = role === 'admin';

  // ── Entity membership ──
  let entityId: string | null = null;
  if (isCompany) {
    const { data } = await supabase.from('miembros_empresa').select('empresa_id').eq('perfil_id', user.id).single();
    entityId = data?.empresa_id ?? null;
  } else if (isProvider) {
    const { data } = await supabase.from('miembros_proveedor').select('proveedor_id').eq('perfil_id', user.id).single();
    entityId = data?.proveedor_id ?? null;
  }

  // ── Parallel data fetch ──
  const [
    statsRes,
    recentOpsRes,
    entityRes,
    catsRes,
    adminPendingRes,
    fourthStatRes,
    myOpsRes,
    suscripcionRes,
    solicitudesRes,
  ] = await Promise.all([
    // 1) Global stats
    Promise.all([
      supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('estado', 'aprobada'),
      supabase.from('proveedores').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
      supabase.from('oportunidades').select('*', { count: 'exact', head: true }).eq('estado', 'abierta'),
    ]),
    // 2) Recent open opportunities
    supabase.from('oportunidades')
      .select('id, titulo, localidad, creado_en, categoria:categorias(nombre)')
      .eq('estado', 'abierta').order('creado_en', { ascending: false }).limit(5),
    // 3) Entity data
    isCompany && entityId ? supabase.from('empresas').select('*').eq('id', entityId).single()
      : isProvider && entityId ? supabase.from('proveedores').select('*').eq('id', entityId).single()
      : Promise.resolve({ data: null }),
    // 4) Categories
    isCompany && entityId ? supabase.from('empresas_categorias').select('categoria:categorias(nombre)').eq('empresa_id', entityId)
      : isProvider && entityId ? supabase.from('proveedores_categorias').select('categoria:categorias(nombre)').eq('proveedor_id', entityId)
      : Promise.resolve({ data: [] }),
    // 5) Admin pending
    isAdmin ? Promise.all([
      supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente_revision'),
      supabase.from('proveedores').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente_revision'),
      supabase.from('resenas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente_revision'),
    ]) : Promise.resolve(null),
    // 6) Fourth stat per role
    isCompany && entityId ? supabase.from('oportunidades').select('*', { count: 'exact', head: true }).eq('empresa_solicitante_id', entityId)
      : isProvider && entityId ? supabase.from('oportunidades_matches').select('*', { count: 'exact', head: true }).eq('proveedor_candidato_id', entityId)
      : Promise.resolve({ count: 0 }),
    // 7) Company's own opportunities
    isCompany && entityId ? supabase.from('oportunidades').select('id, titulo, estado, creado_en, categoria:categorias(nombre)')
      .eq('empresa_solicitante_id', entityId).order('creado_en', { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),
    // 8) Subscription
    entityId ? supabase.from('suscripciones').select('id, estado, nombre_plan, inicia_en, finaliza_en, monto')
      .or(isCompany ? `empresa_id.eq.${entityId}` : `proveedor_id.eq.${entityId}`)
      .order('creado_en', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    // 9) Quote requests received by me (company OR provider as destino)
    entityId && (isCompany || isProvider)
      ? supabase.from('solicitudes_presupuesto')
          .select('id, estado, creado_en, empresa_origen_id, proveedor_origen_id, empresa_origen:empresas!solicitudes_presupuesto_empresa_origen_id_fkey(razon_social, nombre_comercial), proveedor_origen:proveedores!solicitudes_presupuesto_proveedor_origen_id_fkey(nombre, nombre_comercial)')
          .eq(isCompany ? 'empresa_destino_id' : 'proveedor_destino_id', entityId)
          .order('creado_en', { ascending: false }).limit(4)
      : Promise.resolve({ data: [] }),
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
  let dashboardMatches: any[] = [];
  if (isCompany && entityId) {
    const { data: latestOp } = await supabase.from('oportunidades').select('id')
      .eq('empresa_solicitante_id', entityId).eq('estado', 'abierta')
      .order('creado_en', { ascending: false }).limit(1).single();
    if (latestOp) {
      const { data } = await supabase.from('oportunidades_matches')
        .select('*, proveedor:proveedores(nombre_comercial, nombre, localidad)')
        .eq('oportunidad_id', latestOp.id).order('puntaje', { ascending: false }).limit(3);
      dashboardMatches = data || [];
    }
  } else if (isProvider && entityId) {
    const { data } = await supabase.from('oportunidades_matches')
      .select('*, oportunidad:oportunidades(titulo, localidad)')
      .eq('proveedor_candidato_id', entityId).order('puntaje', { ascending: false }).limit(3);
    dashboardMatches = data || [];
  }

  // ── Tarifa ──
  let tarifaData: any = null;
  if (isCompany && entityData?.tarifa) {
    const { data } = await supabase.from('tarifas').select('*').eq('nivel', entityData.tarifa).single();
    tarifaData = data;
  }

  // ── Productos / Servicios ──
  const { data: myItemsData } = (isCompany || isProvider) && entityId
    ? await supabase.from('items')
        .select('id, nombre, precio, estado, tipo_item, creado_en, imagenes:imagenes_item(bucket, ruta_archivo, orden)')
        .eq(isCompany ? 'empresa_id' : 'proveedor_id', entityId)
        .order('creado_en', { ascending: false })
        .order('orden', { foreignTable: 'imagenes_item', ascending: true })
        .limit(3)
    : { data: [] };
  const myItems = myItemsData || [];

  // ── Derived ──
  const { pct: profilePct, missing: missingFields } = entityData
    ? calcProfileCompletion(entityData, isCompany ? 'empresa' : 'proveedor')
    : { pct: 0, missing: [] };
  const firstName = profile?.nombre_completo?.split(' ')[0] || 'Usuario';
  const formattedDate = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hasLogo = isCompany ? !!entityData?.ruta_logo : !!entityData?.ruta_logo;
  const logoUrl = entityData?.ruta_logo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${entityData.bucket_logo}/${entityData.ruta_logo}`
    : null;

  const displayName = isCompany 
    ? (entityData?.nombre_comercial || entityData?.razon_social || 'Empresa sin nombre')
    : isProvider
      ? (entityData?.nombre_comercial || `${entityData?.nombre} ${entityData?.apellido}`.trim() || 'Profesional sin nombre')
      : firstName;

  const publicProfileUrl = entityData?.slug ? `/empresas/${entityData.slug}` : null;

  // Onboarding steps
  const onboardingSteps = [
    { done: !!entityData, label: isCompany ? 'Crear perfil de empresa' : 'Crear perfil profesional', href: '/perfil/datos', icon: Building },
    { done: profilePct >= 60, label: 'Completar datos principales', href: '/perfil/datos', icon: FileText },
    { done: hasLogo, label: isCompany ? 'Subir logo de empresa' : 'Subir foto de perfil', href: '/perfil/datos', icon: Camera },
    { done: entityCategories.length > 0, label: isCompany ? 'Seleccionar sectores' : 'Elegir especialidades', href: '/perfil/servicios', icon: Target },
  ];
  const stepsCompleted = onboardingSteps.filter(s => s.done).length;
  const showOnboarding = stepsCompleted < onboardingSteps.length;

  // Quick actions
  const quickActions = isAdmin
    ? [
        { href: '/admin', icon: ShieldCheck, label: 'Panel Admin', sub: 'Gestión completa' },
        { href: '/admin/empresas', icon: Building, label: 'Socios UIAB', sub: `${pendingEmpresas} pendientes` },
        { href: '/admin/proveedores', icon: Users, label: 'Particulares', sub: `${pendingProveedores} pendientes` },
      ]
    : isCompany
      ? [
          { href: '/oportunidades', icon: Plus, label: 'Publicar Oportunidad', sub: 'Nuevo requerimiento' },
          { href: '/empresas?categoria=proveedores', icon: Search, label: 'Buscar Particulares', sub: 'Directorio verificado' },
          { href: '/perfil/datos', icon: Settings, label: 'Editar Perfil', sub: 'Datos institucionales' },
          { href: '/perfil/documentos', icon: FileCheck2, label: 'Documentos', sub: 'Facturas y habilitaciones' },
        ]
      : [
          { href: '/oportunidades', icon: Briefcase, label: 'Oportunidades', sub: 'Requerimientos abiertos' },
          { href: '/empresas', icon: Building, label: 'Explorar Socios UIAB', sub: 'Directorio industrial' },
          { href: '/perfil/datos', icon: Settings, label: 'Editar Perfil', sub: 'Datos profesionales' },
          { href: '/perfil/documentos', icon: FileCheck2, label: 'Certificaciones', sub: 'Habilitaciones' },
        ];

  /* eslint-enable @typescript-eslint/no-explicit-any */

  // ═════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════

  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 space-y-10">

        {/* ──────────────────────────────
            HEADER — hero editorial
        ────────────────────────────── */}
        <header className="relative overflow-hidden rounded-3xl bg-[#021326] shadow-[0_30px_70px_-30px_rgba(0,33,63,0.5)] ring-1 ring-white/5">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#001c38] via-[#052b50] to-[#0a355f]" />

          {/* Subtle grid pattern */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            }}
          />

          {/* Ambient glows */}
          <div aria-hidden className="absolute -top-40 -right-20 w-[520px] h-[520px] bg-sky-500/20 rounded-full blur-[120px]" />
          <div aria-hidden className="absolute -bottom-40 -left-20 w-[420px] h-[420px] bg-cyan-400/15 rounded-full blur-[110px]" />

          <div className="relative px-6 sm:px-10 py-8 sm:py-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="flex items-center gap-5 sm:gap-6 min-w-0 w-full">
                {/* Avatar circular con ring gradiente */}
                <Link
                  href="/perfil/datos"
                  className="group relative flex-shrink-0"
                  aria-label="Editar logo"
                >
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 opacity-60 group-hover:opacity-100 blur-sm transition-opacity" />
                  <div className="relative w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] rounded-full bg-white flex items-center justify-center overflow-hidden ring-1 ring-white/20 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)]">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="" width={120} height={120} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-manrope font-black text-[34px] sm:text-[40px] text-[#00213f] tracking-tight">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {/* Overlay cámara en hover */}
                    <div className="absolute inset-0 bg-[#001c38]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  {/* Badge verificado */}
                  {(entityData?.estado === 'aprobada' || entityData?.estado === 'aprobado') && (
                    <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-400 ring-4 ring-[#052b50] flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-[#00213f]" strokeWidth={2.5} />
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-white/10 backdrop-blur text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
                      {isCompany ? 'Empresa' : isProvider ? 'Particular' : isAdmin ? 'Admin' : 'Invitado'}
                    </span>
                    {(entityData?.estado === 'aprobada' || entityData?.estado === 'aprobado') && (
                      <span className="flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" /> Verificado
                      </span>
                    )}
                  </div>

                  <h1 className="font-poppins text-[26px] sm:text-[34px] lg:text-[38px] font-extrabold text-white tracking-tight leading-[1.1] truncate">
                    {displayName}
                  </h1>

                  <p className="text-blue-200/60 text-[13px] font-medium mt-1.5">
                    Gestionado por <span className="text-white/85 font-semibold">{profile?.nombre_completo}</span> · <span className="capitalize">{formattedDate}</span>
                  </p>

                  {/* Meta chips */}
                  {(entityData?.email || entityData?.localidad || entityData?.sitio_web || entityData?.telefono) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-4">
                      {entityData?.email && (
                        <span className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors">
                          <Mail className="w-3 h-3 text-sky-300" /> {entityData.email}
                        </span>
                      )}
                      {entityData?.localidad && (
                        <span className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors">
                          <MapPin className="w-3 h-3 text-sky-300" /> {entityData.localidad}
                        </span>
                      )}
                      {entityData?.sitio_web && (
                        <span className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors max-w-[220px] truncate">
                          <Globe className="w-3 h-3 text-sky-300 shrink-0" /> <span className="truncate">{entityData.sitio_web.replace(/^https?:\/\//, '')}</span>
                        </span>
                      )}
                      {entityData?.telefono && (
                        <span className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors">
                          <Phone className="w-3 h-3 text-sky-300" /> {entityData.telefono}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full lg:w-auto lg:self-start">
                {publicProfileUrl && (
                  <Link
                    href={publicProfileUrl}
                    target="_blank"
                    className="flex items-center justify-center gap-2 bg-white text-[#00213f] hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" /> Ver Perfil Público
                  </Link>
                )}
                <Link
                  href="/perfil/datos"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-sm font-bold border border-white/15 transition-all whitespace-nowrap"
                >
                  <Settings className="w-4 h-4" /> Editar Datos
                </Link>
              </div>
            </div>

            {/* Progreso de completitud */}
            {profilePct < 100 && (
              <div className="mt-7 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Completitud del Perfil
                  </span>
                  <span className="text-[11px] font-bold text-sky-300 tabular-nums">{profilePct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${profilePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ──────────────────────────────
            ADMIN BANNER
        ────────────────────────────── */}
        {isAdmin && totalPending > 0 && (
          <section className="bg-amber-50/70 rounded-md px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-sm bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {totalPending} solicitud{totalPending !== 1 ? 'es' : ''} pendiente{totalPending !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-amber-700/60 mt-0.5">
                  {pendingEmpresas} empresas · {pendingProveedores} particulares · {pendingResenas} reseñas
                </p>
              </div>
            </div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-900 transition-colors">
              Panel Admin <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        {/* ──────────────────────────────
            ONBOARDING (if incomplete) — con progress ring
        ────────────────────────────── */}
        {showOnboarding && !isAdmin && (() => {
          const pct = Math.round((stepsCompleted / onboardingSteps.length) * 100);
          const ringCircumference = 2 * Math.PI * 34;
          const ringOffset = ringCircumference - (pct / 100) * ringCircumference;
          return (
            <section className="bg-white rounded-2xl shadow-[0_16px_40px_-16px_rgba(0,33,63,0.08)] overflow-hidden ring-1 ring-slate-200/70">
              <div className="flex items-center gap-6 px-8 py-6 border-b border-slate-100">
                {/* Progress ring */}
                <div className="relative w-[86px] h-[86px] flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                    <circle
                      cx="40" cy="40" r="34"
                      stroke="url(#onbGrad)" strokeWidth="6" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
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
                <div className="flex-1 min-w-0">
                  <h2 className="font-poppins text-lg font-bold text-[#00213f] flex items-center gap-2">
                    Completá tu perfil
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    <span className="font-semibold text-[#00213f]">{stepsCompleted}</span> de {onboardingSteps.length} pasos listos · te faltan {onboardingSteps.length - stepsCompleted} para aparecer en el directorio
                  </p>
                </div>
              </div>
              <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {onboardingSteps.map((step) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 border ${
                      step.done
                        ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                        : 'bg-white border-slate-200 hover:border-[#00213f]/30 hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      step.done ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)]' : 'bg-slate-100 text-slate-500 group-hover:bg-[#00213f] group-hover:text-white'
                    }`}>
                      {step.done
                        ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                        : <step.icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${step.done ? 'text-emerald-800' : 'text-[#00213f]'}`}>
                        {step.label}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${step.done ? 'text-emerald-600/80' : 'text-slate-500'}`}>
                        {step.done ? 'Listo' : 'Pendiente · tocá para completar'}
                      </p>
                    </div>
                    {!step.done && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00213f] transition-colors" />}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ──────────────────────────────
            KPIs — con barra de acento
        ────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building, value: empresasCount, label: 'Socios UIAB', sub: 'en el directorio', href: '/empresas', accent: 'bg-blue-50 text-blue-700', bar: 'from-blue-500 to-blue-700' },
            { icon: Users, value: proveedoresCount, label: 'Particulares', sub: 'verificados', href: '/empresas?categoria=proveedores', accent: 'bg-emerald-50 text-emerald-700', bar: 'from-emerald-500 to-teal-600' },
            { icon: Target, value: oportunidadesCount, label: 'Oportunidades', sub: 'abiertas ahora', href: '/oportunidades', accent: 'bg-amber-50 text-amber-700', bar: 'from-amber-500 to-orange-500' },
            { icon: isAdmin ? AlertCircle : Zap, value: isAdmin ? totalPending : fourthStatCount, label: isAdmin ? 'Pendientes' : isCompany ? 'Oportunidades Publicadas' : 'Mis Matches', sub: isAdmin ? 'a revisar' : 'activas', href: isAdmin ? '/admin' : '/oportunidades', accent: 'bg-violet-50 text-violet-700', bar: 'from-violet-500 to-purple-600' },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative bg-white rounded-xl p-6 ring-1 ring-slate-200/70 shadow-[0_4px_16px_-8px_rgba(0,33,63,0.08)] hover:shadow-[0_24px_48px_-16px_rgba(0,33,63,0.18)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${stat.bar} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.accent}`}>
                  <stat.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#00213f] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="font-poppins text-[34px] font-extrabold text-[#00213f] leading-none tracking-tight">{stat.value}</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-[11px] text-[#00213f] font-bold uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-[11px] text-slate-500 font-medium">{stat.sub}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* ──────────────────────────────
            MAIN GRID
        ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ═══ LEFT (8 cols) ═══ */}
          <div className="lg:col-span-8 space-y-8">
            {/* ── SMART MATCHES ── */}
            {(isCompany || isProvider) && (
              <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
                <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#00213f]" />
                    <h2 className="font-poppins text-base font-bold text-[#00213f]">
                      {isCompany ? 'Particulares Recomendados' : 'Oportunidades para Vos'}
                    </h2>
                  </div>
                  <Link href="/oportunidades" className="text-xs font-bold text-slate-500 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                    Ver todo <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-8">
                {dashboardMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {dashboardMatches.map((match: any) => {
                      const score = Math.round(match.puntaje);
                      return (
                        <Link key={match.id} href={`/oportunidades/${match.oportunidad_id}`}>
                          <div className="bg-white rounded-md p-6 shadow-[0_8px_24px_-8px_rgba(0,33,63,0.06)] hover:shadow-[0_24px_48px_-12px_rgba(0,33,63,0.1)] transition-all duration-300 group h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold ${scoreColor(score)}`}>
                                <TrendingUp className="w-3 h-3" />{score}%
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#d8dadc] group-hover:text-[#10375c] group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <h4 className="font-poppins font-bold text-[#00213f] leading-snug mb-2 group-hover:text-[#10375c] transition-colors text-sm">
                              {isProvider ? match.oportunidad?.titulo : match.proveedor?.nombre_comercial || match.proveedor?.nombre}
                            </h4>
                            {(isProvider ? match.oportunidad?.localidad : match.proveedor?.localidad) && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-3">
                                <MapPin className="w-3 h-3" />
                                {isProvider ? match.oportunidad?.localidad : match.proveedor?.localidad}
                              </p>
                            )}
                            <div className="mt-auto pt-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                {isProvider ? 'Oportunidad' : 'Particular'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] p-12 text-center">
                    <Activity className="w-10 h-10 text-[#d8dadc] mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                      {isCompany
                        ? 'Publicá una oportunidad para recibir particulares recomendados por el algoritmo.'
                        : 'Completá tu perfil para que el algoritmo te conecte con oportunidades relevantes.'}
                    </p>
                    <Link href={isCompany ? '/oportunidades' : '/perfil/datos'} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-[#00213f] mt-4 transition-colors">
                      {isCompany ? 'Publicar oportunidad' : 'Completar perfil'} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
                </div>
              </section>
            )}

            {/* ── COMPANY: MY OPPORTUNITIES ── */}
            {isCompany && myOps.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
                <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                    <Briefcase className="w-5 h-5 text-slate-600" />
                    Tus Oportunidades Publicadas
                  </h2>
                  <Link href="/oportunidades" className="text-xs font-bold text-slate-500 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-[#f7f9fb]">
                  {myOps.map((op: any) => {
                    const est = ESTADO_OP[op.estado] || { label: op.estado, style: 'bg-[#f2f4f6] text-slate-600' };
                    return (
                      <Link key={op.id} href={`/oportunidades/${op.id}`} className="flex items-center gap-4 px-8 py-4 hover:bg-[#f7f9fb] transition-colors group">
                        <div className="w-9 h-9 rounded-sm bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                          <CircleDot className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#00213f] truncate group-hover:text-[#10375c] transition-colors">{op.titulo}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(op.categoria as any)?.nombre && (
                              <span className="text-[10px] text-slate-500">{(op.categoria as any).nombre}</span>
                            )}
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-slate-500">{timeAgo(op.creado_en)}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex-shrink-0 ${est.style}`}>{est.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── QUOTE REQUESTS (company OR provider) ── */}
            {(isCompany || isProvider) && solicitudes.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
                <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                    Solicitudes Recibidas
                  </h2>
                  <Link href="/perfil/solicitudes" className="text-xs font-bold text-slate-500 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                    Ver bandeja
                  </Link>
                </div>
                <div className="divide-y divide-[#f7f9fb]">
                  {solicitudes.map((sol: any) => {
                    const origenNombre =
                      sol.empresa_origen?.nombre_comercial || sol.empresa_origen?.razon_social ||
                      sol.proveedor_origen?.nombre_comercial || sol.proveedor_origen?.nombre ||
                      'Solicitante';
                    return (
                      <Link
                        href="/perfil/solicitudes"
                        key={sol.id}
                        className="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-sm bg-amber-50/80 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-amber-600/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#00213f] truncate">
                            {origenNombre}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(sol.creado_en)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex-shrink-0 ${
                          sol.estado === 'enviada' ? 'bg-amber-50 text-amber-700' : sol.estado === 'respondida' ? 'bg-emerald-50 text-emerald-700' : sol.estado === 'vista' ? 'bg-blue-50 text-blue-700' : 'bg-[#f2f4f6] text-slate-600'
                        }`}>{sol.estado}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── PRODUCTS / SERVICES SUMMARY ── */}
            {(isCompany || isProvider) && (
              <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
                <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                    <PackageSearch className="w-5 h-5 text-slate-600" />
                    Mis Productos y Servicios
                  </h2>
                  <Link href="/perfil/productos-servicios" className="text-xs font-bold text-slate-500 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                    Gestionar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {myItems.length > 0 ? (
                    myItems.map((item: any) => {
                      const itemImg = Array.isArray(item.imagenes) && item.imagenes.length > 0
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${item.imagenes[0].bucket}/${item.imagenes[0].ruta_archivo}`
                        : null;

                      return (
                        <Link key={item.id} href="/perfil/productos-servicios" className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-all group">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:shadow-sm transition-all border border-slate-200/50">
                              {itemImg ? (
                                <Image 
                                  src={itemImg} 
                                  alt={item.nombre} 
                                  width={40} 
                                  height={40} 
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                item.tipo_item === 'servicio' ? <Wrench className="w-4 h-4 text-slate-500" /> : <PackageSearch className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#00213f] truncate group-hover:text-primary-700 transition-colors uppercase tracking-tight">{item.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.tipo_item || 'Producto'}</span>
                                {item.precio && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                                      $ {Number(item.precio).toLocaleString('es-AR')}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-8 py-8 text-center bg-white flex flex-col items-center">
                      <PackageSearch className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">Aún no tienes productos o servicios en tu catálogo.</p>
                      <Link href="/perfil/productos-servicios" className="mt-4 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors uppercase tracking-wider flex items-center gap-1">
                        Crear tu primer ítem <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── OPPORTUNITIES FEED ── */}
            <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
              <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-amber-600/70" />
                  {isProvider ? 'Últimas Oportunidades' : 'Actividad Reciente'}
                </h2>
                <Link href="/oportunidades" className="text-xs font-bold text-slate-500 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recentOps.length > 0 ? (
                <div className="divide-y divide-[#f7f9fb]">
                  {recentOps.map((op: any) => (
                    <Link key={op.id} href={`/oportunidades/${op.id}`} className="flex items-center gap-4 px-8 py-4 hover:bg-[#f7f9fb] transition-colors group">
                      <div className="w-9 h-9 rounded-sm bg-amber-50/80 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-amber-600/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#00213f] truncate group-hover:text-[#10375c] transition-colors">{op.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {(op.categoria as any)?.nombre && (
                            <span className="bg-[#f2f4f6] text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">{(op.categoria as any).nombre}</span>
                          )}
                          {op.localidad && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{op.localidad}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />{timeAgo(op.creado_en)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Target className="w-10 h-10 text-[#d8dadc] mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">No hay oportunidades abiertas.</p>
                </div>
              )}
            </section>
          </div>

          {/* ═══ RIGHT (4 cols) ═══ */}
          <div className="lg:col-span-4 space-y-6">

            {/* ── QUICK ACTIONS ── */}
            <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
              <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-5">
                <h3 className="text-[11px] font-bold text-[#00213f] uppercase tracking-[0.15em]">Acciones Rápidas</h3>
              </div>
              <div className="p-6">
              <div className="space-y-1">
                {quickActions.map((a) => (
                  <Link key={a.href} href={a.href} className="flex items-center gap-3.5 p-3 rounded-md hover:bg-[#f7f9fb] transition-colors group">
                    <div className="w-10 h-10 rounded-sm bg-[#f2f4f6] group-hover:bg-[#00213f]/5 flex items-center justify-center transition-colors flex-shrink-0">
                      <a.icon className="w-5 h-5 text-slate-500 group-hover:text-[#00213f] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#00213f]">{a.label}</p>
                      <p className="text-[10px] text-slate-500">{a.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#d8dadc] group-hover:text-slate-500 flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
              </div>
            </section>

            {/* ── EXPLORE CTA ── */}
            <section className="bg-gradient-to-135 from-[#00213f] to-[#10375c] rounded-xl p-7 text-white relative overflow-hidden ring-1 ring-[#00213f]" style={{ background: 'linear-gradient(135deg, #00213f, #10375c)' }}>
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/[0.04] rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <h3 className="font-poppins text-lg font-bold mb-2">
                  {isCompany ? 'Encontrá Particulares' : isProvider ? 'Explorá Empresas' : 'Directorio UIAB'}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed mb-6">
                  {isCompany
                    ? 'Particulares verificados para necesidades industriales de tu empresa.'
                    : 'Empresas que buscan tus servicios en Almirante Brown y alrededores.'}
                </p>
                <Link href={isCompany ? '/empresas?categoria=proveedores' : '/empresas'} className="inline-flex items-center gap-2 bg-white text-[#00213f] hover:bg-white/95 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20">
                  {isCompany ? 'Ver Particulares' : 'Ver Empresas'} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* ── NETWORK PULSE ── */}
            <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
              <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-5">
                <h3 className="text-[11px] font-bold text-[#00213f] uppercase tracking-[0.15em] flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Red Industrial
                </h3>
              </div>
              <div className="p-6">
              <div className="space-y-4">
                {[
                  { label: 'Empresas socias', value: empresasCount },
                  { label: 'Particulares verificados', value: proveedoresCount },
                  { label: 'Oportunidades abiertas', value: oportunidadesCount },
                ].map((s, i) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{s.label}</span>
                      <span className="font-poppins text-lg font-bold text-[#00213f]">{s.value}</span>
                    </div>
                    {i < 2 && <div className="h-px bg-[#f2f4f6] mt-4" />}
                  </div>
                ))}
              </div>
              </div>
            </section>

            {/* ── NOTIFICATIONS ── */}
            <section className="bg-white rounded-xl border border-slate-200/60 shadow-[0_12px_24px_-10px_rgba(0,33,63,0.08)] overflow-hidden">
              <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-5">
                <h3 className="text-[11px] font-bold text-[#00213f] uppercase tracking-[0.15em] flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" /> Notificaciones
                </h3>
              </div>
              <div className="p-6">
              <div className="flex flex-col items-center py-5 text-center">
                <div className="w-10 h-10 rounded-sm bg-[#f7f9fb] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#d8dadc]" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Tu cuenta está al día</p>
              </div>
              </div>
            </section>
          </div>
        </div>

      </div>
    </main>
  );
}
