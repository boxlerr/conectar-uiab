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
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function calcProfileCompletion(entity: Record<string, any>, type: 'empresa' | 'proveedor') {
  if (!entity) return { pct: 0, missing: [] as string[] };
  const fieldMap =
    type === 'empresa'
      ? { razon_social: 'Razón Social', cuit: 'CUIT', email: 'Email', telefono: 'Teléfono', descripcion: 'Descripción', direccion: 'Dirección', localidad: 'Localidad', provincia: 'Provincia', sitio_web: 'Sitio web', nombre_fantasia: 'Nombre Fantasía', whatsapp: 'WhatsApp' }
      : { nombre: 'Nombre', apellido: 'Apellido', cuit: 'CUIT', email: 'Email', telefono: 'Teléfono', descripcion: 'Descripción', direccion: 'Dirección', localidad: 'Localidad', provincia: 'Provincia', sitio_web: 'Sitio web', nombre_comercial: 'Nombre Comercial', whatsapp: 'WhatsApp' };
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
  cerrada: { label: 'Cerrada', style: 'bg-[#f2f4f6] text-[#10375c]/60' },
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
    // 9) Quote requests for providers
    isProvider && entityId ? supabase.from('solicitudes_presupuesto').select('id, estado, creado_en, empresa_origen:empresas!solicitudes_presupuesto_empresa_origen_id_fkey(razon_social)')
      .eq('proveedor_destino_id', entityId).order('creado_en', { ascending: false }).limit(4)
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
        { href: '/admin/empresas', icon: Building, label: 'Empresas', sub: `${pendingEmpresas} pendientes` },
        { href: '/admin/proveedores', icon: Users, label: 'Proveedores', sub: `${pendingProveedores} pendientes` },
      ]
    : isCompany
      ? [
          { href: '/oportunidades', icon: Plus, label: 'Publicar Oportunidad', sub: 'Nuevo requerimiento' },
          { href: '/proveedores', icon: Search, label: 'Buscar Proveedores', sub: 'Directorio verificado' },
          { href: '/perfil/datos', icon: Settings, label: 'Editar Perfil', sub: 'Datos institucionales' },
          { href: '/perfil/documentos', icon: FileCheck2, label: 'Documentos', sub: 'Facturas y habilitaciones' },
        ]
      : [
          { href: '/oportunidades', icon: Briefcase, label: 'Oportunidades', sub: 'Requerimientos abiertos' },
          { href: '/empresas', icon: Building, label: 'Explorar Empresas', sub: 'Directorio industrial' },
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
            HEADER
        ────────────────────────────── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex items-center gap-5">
            {/* Avatar / Logo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md bg-[#f2f4f6] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_4px_16px_-4px_rgba(0,33,63,0.06)]">
              {logoUrl ? (
                <Image src={logoUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-[#10375c]/30" />
              )}
            </div>
            <div>
              <p className="text-xs text-[#10375c]/30 font-medium capitalize">{formattedDate}</p>
              <h1 className="font-poppins text-3xl sm:text-4xl font-extrabold text-[#00213f] tracking-tight leading-none mt-0.5">
                Hola, {firstName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {(entityData?.estado === 'aprobada' || entityData?.estado === 'aprobado') && (
              <span className="flex items-center gap-1.5 bg-emerald-50/80 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-sm uppercase tracking-[0.1em]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verificado
              </span>
            )}
            <span className="bg-[#f2f4f6] text-[#10375c] text-[10px] font-bold px-2.5 py-1.5 rounded-sm uppercase tracking-[0.1em]">
              {isCompany ? 'Empresa' : isProvider ? 'Proveedor' : isAdmin ? 'Admin' : 'Invitado'}
            </span>
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
                  {pendingEmpresas} empresas · {pendingProveedores} proveedores · {pendingResenas} reseñas
                </p>
              </div>
            </div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-900 transition-colors">
              Panel Admin <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        {/* ──────────────────────────────
            ONBOARDING (if incomplete)
        ────────────────────────────── */}
        {showOnboarding && !isAdmin && (
          <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] overflow-hidden">
            <div className="bg-gradient-to-r from-[#00213f] to-[#10375c] px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="font-poppins text-base font-bold text-white">Completá tu perfil</h2>
                <p className="text-xs text-white/40 mt-0.5">{stepsCompleted} de {onboardingSteps.length} pasos completados</p>
              </div>
              <span className="font-poppins text-2xl font-extrabold text-white">{Math.round((stepsCompleted / onboardingSteps.length) * 100)}%</span>
            </div>
            <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onboardingSteps.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    step.done ? 'bg-[#f7f9fb]' : 'bg-white hover:bg-[#f7f9fb]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${
                    step.done ? 'bg-emerald-50' : 'bg-[#f2f4f6]'
                  }`}>
                    {step.done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <step.icon className="w-4 h-4 text-[#10375c]/40" />}
                  </div>
                  <span className={`text-sm font-medium ${step.done ? 'text-[#10375c]/40 line-through' : 'text-[#00213f]'}`}>
                    {step.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────────────────────
            KPIs
        ────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Building, value: empresasCount, label: 'Empresas Activas', href: '/empresas', accent: 'bg-[#00213f]/5 text-[#00213f]' },
            { icon: Users, value: proveedoresCount, label: 'Proveedores', href: '/proveedores', accent: 'bg-emerald-50 text-emerald-700' },
            { icon: Target, value: oportunidadesCount, label: 'Oportunidades', href: '/oportunidades', accent: 'bg-amber-50 text-amber-700' },
            { icon: isAdmin ? AlertCircle : Zap, value: isAdmin ? totalPending : fourthStatCount, label: isAdmin ? 'Pendientes' : isCompany ? 'Mis Oportunidades' : 'Mis Matches', href: isAdmin ? '/admin' : '/oportunidades', accent: 'bg-violet-50 text-violet-700' },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="bg-white rounded-md p-6 shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] hover:shadow-[0_24px_48px_-12px_rgba(0,33,63,0.1)] transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${stat.accent}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#d8dadc] group-hover:text-[#10375c] transition-colors" />
              </div>
              <p className="font-poppins text-3xl font-extrabold text-[#00213f]">{stat.value}</p>
              <p className="text-[10px] text-[#10375c]/30 font-bold mt-1 uppercase tracking-[0.1em]">{stat.label}</p>
            </Link>
          ))}
        </section>

        {/* ──────────────────────────────
            MAIN GRID
        ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ═══ LEFT (8 cols) ═══ */}
          <div className="lg:col-span-8 space-y-8">

            {/* ── ENTITY PROFILE CARD ── */}
            {entityData && (
              <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] overflow-hidden">
                <div className="bg-[#f7f9fb] px-8 py-5 flex items-center justify-between">
                  <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                    {isCompany ? <Building className="w-5 h-5 text-[#10375c]/50" /> : <Users className="w-5 h-5 text-emerald-600/70" />}
                    {isCompany ? 'Mi Empresa' : 'Mi Perfil Profesional'}
                  </h2>
                  <Link href="/perfil/datos" className="text-xs font-bold text-[#10375c]/40 hover:text-[#00213f] transition-colors flex items-center gap-1 uppercase tracking-wider">
                    Editar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Left col: identity */}
                    <div className="md:col-span-3 space-y-5">
                      <div className="flex items-start gap-5">
                        {/* Logo/Avatar */}
                        <div className="w-16 h-16 rounded-md bg-[#f2f4f6] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logoUrl ? (
                            <Image src={logoUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <Building className="w-7 h-7 text-[#10375c]/20" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-0.5">
                            {isCompany ? 'Razón Social' : 'Nombre'}
                          </p>
                          <p className="font-poppins text-xl font-bold text-[#00213f] leading-tight">
                            {isCompany ? entityData.razon_social || '—' : `${entityData.nombre || ''} ${entityData.apellido || ''}`.trim() || '—'}
                          </p>
                          {isCompany && entityData.nombre_fantasia && entityData.nombre_fantasia !== entityData.razon_social && (
                            <p className="text-xs text-[#10375c]/40 mt-0.5">{entityData.nombre_fantasia}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                        <div>
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-0.5">CUIT</p>
                          <p className="text-sm font-medium text-[#00213f]">{entityData.cuit || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-0.5">Localidad</p>
                          <p className="text-sm font-medium text-[#00213f] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#10375c]/20" />{entityData.localidad || '—'}
                          </p>
                        </div>
                        {entityData.email && (
                          <div>
                            <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-0.5">Email</p>
                            <p className="text-sm font-medium text-[#00213f] truncate">{entityData.email}</p>
                          </div>
                        )}
                      </div>

                      {entityCategories.length > 0 && (
                        <div>
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-2">{isCompany ? 'Sectores' : 'Especialidades'}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {entityCategories.map((c: string) => (
                              <span key={c} className="bg-[#f2f4f6] text-[#10375c] text-xs font-medium px-2.5 py-1 rounded-sm">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isCompany && entityData.actividad && (
                        <div>
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-0.5">Actividad</p>
                          <p className="text-sm text-[#10375c]/60">{entityData.actividad}</p>
                        </div>
                      )}
                    </div>

                    {/* Right col: metrics */}
                    <div className="md:col-span-2 space-y-5">
                      {/* Completion */}
                      <div className="bg-[#f7f9fb] rounded-md p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold text-[#10375c]/40 uppercase tracking-wider">Completitud</p>
                          <span className={`text-sm font-extrabold font-poppins ${profilePct >= 80 ? 'text-emerald-600' : profilePct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{profilePct}%</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-[1px] ${i < Math.round(profilePct / 10) ? (profilePct >= 80 ? 'bg-emerald-500' : profilePct >= 50 ? 'bg-amber-500' : 'bg-red-500') : 'bg-[#f2f4f6]'}`} />
                          ))}
                        </div>
                        {missingFields.length > 0 && missingFields.length <= 4 && (
                          <p className="text-[10px] text-[#10375c]/30 mt-2">
                            Falta: {missingFields.slice(0, 3).join(', ')}{missingFields.length > 3 ? ` +${missingFields.length - 3}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Tarifa */}
                      {isCompany && tarifaData && (
                        <div className="bg-[#f7f9fb] rounded-md p-5">
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-3">Membresía</p>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-sm bg-white shadow-[0_4px_12px_-4px_rgba(0,33,63,0.06)] flex items-center justify-center">
                              <Award className="w-4 h-4 text-[#10375c]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-[#00213f]">{tarifaData.nombre}</p>
                              <p className="text-[10px] text-[#10375c]/30">{ars(tarifaData.precio_anual)}/año</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider ${TARIFA_BADGE[tarifaData.nivel as number]?.style || ''}`}>
                              {TARIFA_BADGE[tarifaData.nivel as number]?.label}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Socio */}
                      {isCompany && entityData.n_socio && (
                        <div className="flex items-center gap-3 bg-[#00213f]/[0.02] rounded-md px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-[#10375c]/40 flex-shrink-0" />
                          <p className="text-xs text-[#10375c]/60">Socio UIAB N° <span className="font-bold text-[#00213f]">{entityData.n_socio}</span></p>
                        </div>
                      )}

                      {/* Suscripcion */}
                      {suscripcion && (
                        <div className="bg-[#f7f9fb] rounded-md p-5">
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-2">Suscripción</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#00213f]">{suscripcion.nombre_plan || 'Plan Activo'}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${
                              suscripcion.estado === 'activa' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f2f4f6] text-[#10375c]/50'
                            }`}>{suscripcion.estado}</span>
                          </div>
                          {suscripcion.finaliza_en && (
                            <p className="text-[10px] text-[#10375c]/30 mt-1">
                              Vence: {new Date(suscripcion.finaliza_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          )}
                          <Link href="/perfil/suscripcion" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10375c]/40 hover:text-[#00213f] mt-2 transition-colors uppercase tracking-wider">
                            Gestionar <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      {/* Provider description */}
                      {isProvider && entityData.descripcion && (
                        <div className="bg-[#f7f9fb] rounded-md p-5">
                          <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mb-2">Descripción</p>
                          <p className="text-sm text-[#10375c]/50 leading-relaxed line-clamp-3">{entityData.descripcion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── SMART MATCHES ── */}
            {(isCompany || isProvider) && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00213f] to-[#10375c] rounded-sm flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(0,33,63,0.2)]">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-poppins text-base font-bold text-[#00213f]">
                        {isCompany ? 'Proveedores Recomendados' : 'Oportunidades para Vos'}
                      </h2>
                      <p className="text-[10px] text-[#10375c]/25 font-bold uppercase tracking-[0.15em] mt-0.5">Algoritmo de matching</p>
                    </div>
                  </div>
                  <Link href="/oportunidades" className="text-xs font-bold text-[#10375c]/40 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                    Ver todo <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {dashboardMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                              <p className="text-[10px] text-[#10375c]/25 flex items-center gap-1 mb-3">
                                <MapPin className="w-3 h-3" />
                                {isProvider ? match.oportunidad?.localidad : match.proveedor?.localidad}
                              </p>
                            )}
                            <div className="mt-auto pt-4">
                              <span className="text-[10px] font-bold text-[#10375c]/15 uppercase tracking-[0.15em]">
                                {isProvider ? 'Oportunidad' : 'Proveedor'}
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
                    <p className="text-sm font-medium text-[#10375c]/40 max-w-sm mx-auto leading-relaxed">
                      {isCompany
                        ? 'Publicá una oportunidad para recibir proveedores recomendados por el algoritmo.'
                        : 'Completá tu perfil para que el algoritmo te conecte con oportunidades relevantes.'}
                    </p>
                    <Link href={isCompany ? '/oportunidades' : '/perfil/datos'} className="inline-flex items-center gap-1 text-sm font-bold text-[#10375c]/50 hover:text-[#00213f] mt-4 transition-colors">
                      {isCompany ? 'Publicar oportunidad' : 'Completar perfil'} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* ── COMPANY: MY OPPORTUNITIES ── */}
            {isCompany && myOps.length > 0 && (
              <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] overflow-hidden">
                <div className="bg-[#f7f9fb] px-8 py-5 flex items-center justify-between">
                  <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                    <Briefcase className="w-5 h-5 text-[#10375c]/50" />
                    Mis Oportunidades
                  </h2>
                  <Link href="/oportunidades" className="text-xs font-bold text-[#10375c]/40 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-[#f7f9fb]">
                  {myOps.map((op: any) => {
                    const est = ESTADO_OP[op.estado] || { label: op.estado, style: 'bg-[#f2f4f6] text-[#10375c]/50' };
                    return (
                      <Link key={op.id} href={`/oportunidades/${op.id}`} className="flex items-center gap-4 px-8 py-4 hover:bg-[#f7f9fb] transition-colors group">
                        <div className="w-9 h-9 rounded-sm bg-[#f2f4f6] flex items-center justify-center flex-shrink-0">
                          <CircleDot className="w-4 h-4 text-[#10375c]/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#00213f] truncate group-hover:text-[#10375c] transition-colors">{op.titulo}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(op.categoria as any)?.nombre && (
                              <span className="text-[10px] text-[#10375c]/30">{(op.categoria as any).nombre}</span>
                            )}
                            <span className="text-[10px] text-[#10375c]/20">·</span>
                            <span className="text-[10px] text-[#10375c]/25">{timeAgo(op.creado_en)}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex-shrink-0 ${est.style}`}>{est.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── PROVIDER: QUOTE REQUESTS ── */}
            {isProvider && solicitudes.length > 0 && (
              <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] overflow-hidden">
                <div className="bg-[#f7f9fb] px-8 py-5 flex items-center justify-between">
                  <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-[#10375c]/50" />
                    Solicitudes de Presupuesto
                  </h2>
                </div>
                <div className="divide-y divide-[#f7f9fb]">
                  {solicitudes.map((sol: any) => (
                    <div key={sol.id} className="flex items-center gap-4 px-8 py-4">
                      <div className="w-9 h-9 rounded-sm bg-amber-50/80 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-amber-600/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#00213f] truncate">
                          {(sol.empresa_origen as any)?.razon_social || 'Empresa'}
                        </p>
                        <p className="text-[10px] text-[#10375c]/25 mt-0.5">{timeAgo(sol.creado_en)}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex-shrink-0 ${
                        sol.estado === 'pendiente' ? 'bg-amber-50 text-amber-700' : sol.estado === 'respondida' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f2f4f6] text-[#10375c]/50'
                      }`}>{sol.estado}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── OPPORTUNITIES FEED ── */}
            <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] overflow-hidden">
              <div className="bg-[#f7f9fb] px-8 py-5 flex items-center justify-between">
                <h2 className="font-poppins text-base font-bold text-[#00213f] flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-amber-600/70" />
                  {isProvider ? 'Últimas Oportunidades' : 'Actividad Reciente'}
                </h2>
                <Link href="/oportunidades" className="text-xs font-bold text-[#10375c]/40 hover:text-[#00213f] flex items-center gap-1 transition-colors uppercase tracking-wider">
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
                            <span className="bg-[#f2f4f6] text-[#10375c]/50 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">{(op.categoria as any).nombre}</span>
                          )}
                          {op.localidad && (
                            <span className="text-[10px] text-[#10375c]/25 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{op.localidad}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#10375c]/20 font-semibold flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />{timeAgo(op.creado_en)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Target className="w-10 h-10 text-[#d8dadc] mx-auto mb-3" />
                  <p className="text-sm text-[#10375c]/30 font-medium">No hay oportunidades abiertas.</p>
                </div>
              )}
            </section>
          </div>

          {/* ═══ RIGHT (4 cols) ═══ */}
          <div className="lg:col-span-4 space-y-6">

            {/* ── QUICK ACTIONS ── */}
            <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] p-6">
              <h3 className="text-[10px] font-bold text-[#10375c]/25 uppercase tracking-[0.15em] mb-5">Acciones Rápidas</h3>
              <div className="space-y-1">
                {quickActions.map((a) => (
                  <Link key={a.href} href={a.href} className="flex items-center gap-3.5 p-3 rounded-md hover:bg-[#f7f9fb] transition-colors group">
                    <div className="w-10 h-10 rounded-sm bg-[#f2f4f6] group-hover:bg-[#00213f]/5 flex items-center justify-center transition-colors flex-shrink-0">
                      <a.icon className="w-5 h-5 text-[#10375c]/35 group-hover:text-[#00213f] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#00213f]">{a.label}</p>
                      <p className="text-[10px] text-[#10375c]/25">{a.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#d8dadc] group-hover:text-[#10375c]/30 flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>

            {/* ── EXPLORE CTA ── */}
            <section className="bg-gradient-to-135 from-[#00213f] to-[#10375c] rounded-md p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00213f, #10375c)' }}>
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/[0.04] rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <h3 className="font-poppins text-lg font-bold mb-2">
                  {isCompany ? 'Encontrá Proveedores' : isProvider ? 'Explorá Empresas' : 'Directorio UIAB'}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mb-5">
                  {isCompany
                    ? 'Proveedores verificados para necesidades industriales de tu empresa.'
                    : 'Empresas que buscan tus servicios en Almirante Brown y alrededores.'}
                </p>
                <Link href={isCompany ? '/proveedores' : '/empresas'} className="inline-flex items-center gap-2 bg-white text-[#00213f] hover:bg-white/90 px-5 py-2.5 rounded-sm text-sm font-bold transition-colors">
                  {isCompany ? 'Ver Proveedores' : 'Ver Empresas'} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* ── NETWORK PULSE ── */}
            <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] p-6">
              <h3 className="text-[10px] font-bold text-[#10375c]/25 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" /> Red Industrial
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Empresas socias', value: empresasCount },
                  { label: 'Proveedores verificados', value: proveedoresCount },
                  { label: 'Oportunidades abiertas', value: oportunidadesCount },
                ].map((s, i) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#10375c]/40">{s.label}</span>
                      <span className="font-poppins text-lg font-bold text-[#00213f]">{s.value}</span>
                    </div>
                    {i < 2 && <div className="h-px bg-[#f2f4f6] mt-4" />}
                  </div>
                ))}
              </div>
            </section>

            {/* ── NOTIFICATIONS ── */}
            <section className="bg-white rounded-md shadow-[0_16px_32px_-12px_rgba(0,33,63,0.06)] p-6">
              <h3 className="text-[10px] font-bold text-[#10375c]/25 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> Notificaciones
              </h3>
              <div className="flex flex-col items-center py-5 text-center">
                <div className="w-10 h-10 rounded-sm bg-[#f7f9fb] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#d8dadc]" />
                </div>
                <p className="text-xs text-[#10375c]/25 font-medium">Tu cuenta está al día</p>
              </div>
            </section>
          </div>
        </div>

      </div>
    </main>
  );
}
