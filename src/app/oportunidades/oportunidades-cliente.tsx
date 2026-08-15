"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Briefcase,
  MapPin,
  CalendarClock,
  Package,
  Filter,
  Search,
  PlusCircle,
  ArrowRight,
  Building2,
  Sparkles,
  Tag,
  Target,
  CheckCircle2,
  RotateCcw,
  Factory,
  FlaskConical,
  HardHat,
  Layers,
  Printer,
  Zap,
  Paintbrush,
  Car,
  Cpu,
  Ruler,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { esFichaDeEmpresa, tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectUIAB } from "@/components/ui/select-uiab";
import { oportunidadesService, Oportunidad, Match } from "@/modulos/oportunidades/servicio-oportunidades";
import { solicitanteDe, type Solicitante } from "@/modulos/oportunidades/solicitante";
import { RUBROS_SEO } from "@/lib/datos/rubros-seo";

import { PublicOportunidadesLanding } from "./landing-oportunidades-publica";
import { AccesoRequerido } from "@/components/ui/acceso-requerido";
import { resolverEstadoGate } from "@/components/ui/gate-suscripcion";
import { BotonReiniciarTour } from "@/modulos/onboarding/componentes/boton-reiniciar-tour";

/**
 * Vista de oportunidades. Sigue siendo client (el gate de suscripción y los
 * matches dependen de la sesión), pero recibe las oportunidades abiertas ya
 * resueltas en el servidor.
 *
 * Antes arrancaba con `[]` y `loading: true`, así que el HTML que veía Googlebot
 * era el esqueleto: 156 palabras y un único H2 que decía "0 oportunidades
 * disponibles", en una URL que el sitemap publica con prioridad 0.8. Y para
 * disimular el vacío, la landing rellenaba con tres pedidos inventados.
 *
 * SOBRE LOS NÚMEROS DEL ENCABEZADO
 *
 * Las dos tarjetas de arriba muestran empresas verificadas y oportunidades
 * abiertas, y los dos números salen de la base (el primero por props desde el
 * Server Component, el segundo del propio listado). El mockup que originó este
 * rediseño traía "248 empresas activas +12% este mes" y "1.532 profesionales":
 * en esta base son 59 y 0. Ver src/tests/seo/sin-datos-inventados.test.ts.
 *
 * SOBRE LOS FILTROS
 *
 * Los desplegables se arman con los valores que REALMENTE aparecen en la
 * cartelera (rubro, localidad), no con un catálogo fijo: un filtro que ofrece
 * opciones sin resultados es ruido. Por eso también desaparecen cuando no hay
 * ninguna oportunidad publicada — el buscador, en cambio, queda siempre porque
 * el tour de onboarding lo apunta.
 */

const TIPOGRAFIA_TITULO = { fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" } as const;
const TIPOGRAFIA_TEXTO = { fontFamily: "var(--font-inter, 'Inter', sans-serif)" } as const;

/** Cuántos sectores entran en la tarjeta del costado antes de "Ver todos". */
const SECTORES_VISIBLES = 8;

/**
 * Iconos de los sectores del costado. Las claves son los slugs de RUBROS_SEO
 * —la lista editorial de rubros con landing propia, la misma que alimenta
 * /rubros—, así que un rubro nuevo aparece igual, con el icono genérico.
 */
const ICONO_SECTOR: Record<string, typeof Factory> = {
  quimica: FlaskConical,
  "metalurgica-y-metalmecanica": Factory,
  construccion: HardHat,
  "packaging-y-embalaje": Package,
  plasticos: Layers,
  "grafica-e-impresion": Printer,
  "automatizacion-y-electricidad": Zap,
  "pinturas-y-recubrimientos": Paintbrush,
  "autopartes-y-automotriz": Car,
  "informatica-industrial": Cpu,
  "ingenieria-y-consultoria": Ruler,
  "seguridad-e-higiene-industrial": ShieldCheck,
  "alimentos-y-bebidas": UtensilsCrossed,
};

/**
 * Los nombres de rubro son de landing ("Metalúrgica y metalmecánica"): en un
 * chip de 200px ocupan dos renglones cada uno. Recortamos por la conjunción y
 * dejamos el nombre completo en el `title`, que es donde lo busca quien duda.
 */
function nombreCortoDeRubro(nombre: string): string {
  return nombre.split(/ y | e /i)[0];
}

const OPCIONES_ANTIGUEDAD = [
  { value: "", label: "Cualquier fecha" },
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 3 meses" },
] as const;

type Orden = "recientes" | "antiguas" | "match";

/**
 * Granularidad de DÍAS a propósito. Este componente también renderiza en el
 * servidor, y un "hace 5m" calculado en el SSR contra un "hace 6m" calculado al
 * hidratar es un mismatch de React por cruzar un borde de minuto.
 */
function publicadaHace(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(dias) || dias < 0) return "Recién publicada";
  if (dias === 0) return "Publicada hoy";
  if (dias === 1) return "Hace 1 día";
  if (dias < 30) return `Hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}

function fechaCorta(iso: string): string {
  // `2026-08-20` es un DATE: partirlo a mano evita que se corra un día por la
  // zona horaria, que es lo que hace `new Date("2026-08-20")` (parsea UTC).
  const [a, m, d] = iso.slice(0, 10).split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const mes = meses[Number(m) - 1];
  if (!mes) return iso;
  return `${Number(d)} ${mes} ${a}`;
}

/**
 * Logo de quien publica. `ruta_logo` puede apuntar a un archivo que no está en
 * Storage (pasó con logos sembrados a mano), así que el fallo de carga tiene
 * que dejar la tarjeta entera, no un cuadrado roto: se cae a la inicial.
 */
function LogoSolicitante({ solicitante }: { solicitante: Solicitante }) {
  const [falla, setFalla] = useState(false);
  const { logoUrl, nombre, inicial } = solicitante;

  if (logoUrl && !falla) {
    return (
      <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-16 sm:w-16">
        <Image
          src={logoUrl}
          alt={nombre ? `Logo de ${nombre}` : "Logo de la empresa que publica"}
          fill
          sizes="64px"
          className="object-contain p-2"
          onError={() => setFalla(true)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-[#00213f] text-xl font-black text-white sm:h-16 sm:w-16"
      style={TIPOGRAFIA_TITULO}
    >
      {inicial}
    </span>
  );
}

function TarjetaDato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Building2;
  etiqueta: string;
  valor: string;
  }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/25 text-primary-100">
        <Icono className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55 sm:whitespace-nowrap" style={TIPOGRAFIA_TEXTO}>
          {etiqueta}
        </span>
        <span className="block text-2xl font-black leading-tight text-white" style={TIPOGRAFIA_TITULO}>
          {valor}
        </span>
      </span>
    </div>
  );
}

/** Chip de metadato dentro de una tarjeta de oportunidad. */
function Chip({ icono: Icono, children }: { icono: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/70">
      <Icono className="h-3.5 w-3.5 text-slate-400" />
      {children}
    </span>
  );
}

export function OportunidadesCliente({
  oportunidadesIniciales,
  totalEmpresas,
}: {
  oportunidadesIniciales: Oportunidad[];
  /** Socias aprobadas en el directorio. `null` si la consulta falló. */
  totalEmpresas: number | null;
}) {
  const { currentUser, loading: authLoading } = useAuth();
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>(oportunidadesIniciales);
  const [matches, setMatches] = useState<Match[]>([]);
  // Ya hay datos del servidor: el esqueleto sólo aplica a la revalidación en
  // cliente, que corre para traer lo que dependa de la sesión.
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rubro, setRubro] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [antiguedad, setAntiguedad] = useState("");
  const [soloRecomendadas, setSoloRecomendadas] = useState(false);
  const [orden, setOrden] = useState<Orden>("recientes");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const isEmpresa = esFichaDeEmpresa(currentUser);
  const isProveedor = tipoEntidadDe(currentUser) === "provider";

  useEffect(() => {
    // Esperar a que auth termine de resolver antes de consultar.
    // Si hacemos fetch con authLoading=true, la sesión de Supabase aún no está
    // aplicada y RLS devuelve 0 filas (el bug de "no aparece hasta apretar F5").
    if (authLoading) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ops = await oportunidadesService.getOportunidades();
        setOportunidades(ops);

        if (isProveedor && currentUser?.entityId) {
          const m = await oportunidadesService.getMatchesForUser(currentUser.entityId, 'provider');
          setMatches(m);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isProveedor, currentUser?.entityId]);

  const puntajePorOportunidad = useMemo(() => {
    const m = new Map<string, number>();
    for (const match of matches) m.set(match.oportunidad_id, match.puntaje);
    return m;
  }, [matches]);

  /** Los desplegables se arman con lo que hay publicado, no con un catálogo. */
  const rubrosDisponibles = useMemo(() => {
    const nombres = new Set<string>();
    for (const o of oportunidades) if (o.categoria?.nombre) nombres.add(o.categoria.nombre);
    return [...nombres].sort((a, b) => a.localeCompare(b, "es"));
  }, [oportunidades]);

  const localidadesDisponibles = useMemo(() => {
    const nombres = new Set<string>();
    for (const o of oportunidades) if (o.localidad) nombres.add(o.localidad);
    return [...nombres].sort((a, b) => a.localeCompare(b, "es"));
  }, [oportunidades]);

  const hayFiltros = Boolean(searchTerm || rubro || localidad || antiguedad || soloRecomendadas);

  function limpiarFiltros() {
    setSearchTerm("");
    setRubro("");
    setLocalidad("");
    setAntiguedad("");
    setSoloRecomendadas(false);
  }

  const filtrados = useMemo(() => {
    const termino = searchTerm.trim().toLowerCase();
    const limite = antiguedad ? Date.now() - Number(antiguedad) * 86_400_000 : null;

    const lista = oportunidades.filter((o) => {
      if (termino) {
        const enTexto =
          o.titulo.toLowerCase().includes(termino) ||
          o.empresa?.razon_social?.toLowerCase().includes(termino) ||
          o.categoria?.nombre?.toLowerCase().includes(termino) ||
          o.descripcion?.toLowerCase().includes(termino);
        if (!enTexto) return false;
      }
      if (rubro && o.categoria?.nombre !== rubro) return false;
      if (localidad && o.localidad !== localidad) return false;
      if (limite && new Date(o.creado_en).getTime() < limite) return false;
      if (soloRecomendadas && !puntajePorOportunidad.has(o.id)) return false;
      return true;
    });

    const porFecha = (a: Oportunidad, b: Oportunidad) =>
      new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime();

    if (orden === "antiguas") return [...lista].sort((a, b) => porFecha(b, a));
    if (orden === "match") {
      return [...lista].sort((a, b) => {
        const pa = puntajePorOportunidad.get(a.id) ?? -1;
        const pb = puntajePorOportunidad.get(b.id) ?? -1;
        return pb === pa ? porFecha(a, b) : pb - pa;
      });
    }
    return [...lista].sort(porFecha);
  }, [oportunidades, searchTerm, rubro, localidad, antiguedad, soloRecomendadas, orden, puntajePorOportunidad]);

  /**
   * Ramificamos SÓLO por `currentUser`, nunca por `authLoading`.
   *
   * Con `!currentUser && !authLoading`, en el render del servidor `authLoading`
   * es true y la condición no se cumplía nunca: el SSR se caía a la vista
   * logueada y le servía a Googlebot un listado vacío con "0 oportunidades
   * disponibles" en vez de la landing pública. Es el mismo gotcha que ya se
   * había arreglado en /cooperativas y /instituciones-bancarias — el
   * AuthProvider hidrata con el `initialUser` que resuelve el servidor, así que
   * `currentUser` vale lo mismo en el HTML del servidor y en el primer render
   * del cliente; `loading`, no.
   */
  if (!currentUser) {
    return <PublicOportunidadesLanding oportunidades={oportunidades} loading={loading} />;
  }

  if (currentUser.role !== 'admin' && currentUser.subscriptionEstado !== 'activa') {
    return (
      <AccesoRequerido
        estado={resolverEstadoGate(currentUser.subscriptionEstado ?? null, currentUser.isMember)}
        className="min-h-svh"
      />
    );
  }

  const carteleraVacia = oportunidades.length === 0;

  const opcionesOrden = [
    { value: "recientes", label: "Más recientes" },
    { value: "antiguas", label: "Más antiguas" },
    ...(matches.length > 0 ? [{ value: "match", label: "Mejor coincidencia" }] : []),
  ];

  return (
    <div className="min-h-svh bg-slate-50 pt-20 lg:pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        {/* ═══ ENCABEZADO ═══════════════════════════════════════════════ */}
        <section
          data-tour="op-hero"
          className="relative mb-8 overflow-hidden rounded-3xl bg-[#00213f] text-white shadow-[0_28px_60px_-32px_rgba(0,33,63,0.75)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0b2d4d] to-[#123a63]" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:p-12">
            <div>
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-black/25">
                <Briefcase className="h-6 w-6" />
              </span>

              <h1
                className="max-w-md text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl"
                style={TIPOGRAFIA_TITULO}
              >
                Oportunidades de Trabajo
              </h1>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/65" style={TIPOGRAFIA_TEXTO}>
                Conectamos la demanda de las empresas del partido con la oferta de servicios
                profesionales y especialistas.
              </p>

              <div className="mt-7 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                {totalEmpresas !== null && (
                  <TarjetaDato
                    icono={Building2}
                    etiqueta="Empresas verificadas"
                    valor={String(totalEmpresas)}
                  />
                )}
                <TarjetaDato
                  icono={Briefcase}
                  etiqueta="Pedidos abiertos"
                  valor={String(oportunidades.length)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-6 xl:gap-10">
              <Image
                src="/landing/oportunidades-hero.webp"
                alt=""
                aria-hidden="true"
                width={900}
                height={760}
                priority
                className="hidden h-auto w-[260px] select-none xl:block 2xl:w-[320px]"
              />

              <div className="w-full lg:w-[290px]">
                {isEmpresa ? (
                  <>
                    <Button
                      asChild
                      className="h-14 w-full rounded-2xl border-none bg-primary-600 px-5 text-[15px] font-bold shadow-xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-primary-500"
                    >
                      <Link href="/oportunidades/nueva">
                        {/* shrink-0: sin esto flex achica los iconos hasta hacerlos
                            un puntito cuando el texto no entra en la columna. */}
                        <PlusCircle className="mr-2 h-5 w-5 shrink-0" />
                        Publicar una oportunidad
                        <ArrowRight className="ml-auto h-5 w-5 shrink-0" />
                      </Link>
                    </Button>
                    {/*
                      Ojo con lo que promete este texto: publicar una
                      oportunidad NO manda correos. El trigger
                      `tr_oportunidades_match` sólo corre
                      `fn_calcular_matches_oportunidad`, que llena
                      `oportunidades_matches` — no escribe en `notificaciones`
                      ni pega a ningún endpoint de email. Lo que sí pasa es que
                      las socias afines quedan sugeridas en la ficha del pedido.
                    */}
                    <p className="mt-4 text-sm leading-relaxed text-white/55" style={TIPOGRAFIA_TEXTO}>
                      Al publicarla, la plataforma te sugiere las socias afines por rubro y etiquetas.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/25 text-primary-100">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm leading-relaxed text-white/70" style={TIPOGRAFIA_TEXTO}>
                      Los pedidos que coinciden con tus rubros y etiquetas aparecen marcados como
                      recomendados en esta lista.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BUSCADOR Y FILTROS ═══════════════════════════════════════ */}
        <div
          data-tour="op-buscador"
          className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por título, empresa o especialidad..."
                aria-label="Buscar oportunidades"
                className="h-14 md:h-14 rounded-xl border-slate-200 bg-slate-50/70 pl-12 text-base focus-visible:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {!carteleraVacia && (
              <Button
                variant="outline"
                onClick={() => setFiltrosAbiertos((v) => !v)}
                aria-expanded={filtrosAbiertos}
                className="h-14 rounded-xl border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filtros
              </Button>
            )}
          </div>

          {!carteleraVacia && (
            <div
              className={`${filtrosAbiertos ? "grid" : "hidden"} mt-4 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center`}
            >
              <SelectUIAB
                ariaLabel="Filtrar por rubro"
                value={rubro}
                onValueChange={setRubro}
                placeholder="Rubro"
                options={[
                  { value: "", label: "Todos los rubros" },
                  ...rubrosDisponibles.map((r) => ({ value: r, label: r })),
                ]}
                className="h-11 min-w-[170px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              />
              <SelectUIAB
                ariaLabel="Filtrar por localidad"
                value={localidad}
                onValueChange={setLocalidad}
                placeholder="Ubicación"
                options={[
                  { value: "", label: "Todas las ubicaciones" },
                  ...localidadesDisponibles.map((l) => ({ value: l, label: l })),
                ]}
                className="h-11 min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              />
              <SelectUIAB
                ariaLabel="Filtrar por antigüedad"
                value={antiguedad}
                onValueChange={setAntiguedad}
                placeholder="Publicadas"
                options={OPCIONES_ANTIGUEDAD.map((o) => ({ value: o.value, label: o.label }))}
                className="h-11 min-w-[170px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              />

              {matches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSoloRecomendadas((v) => !v)}
                  aria-pressed={soloRecomendadas}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                    soloRecomendadas
                      ? "border-primary-200 bg-primary-50 text-primary-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Recomendadas para mí
                </button>
              )}

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!hayFiltros}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 lg:ml-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ═══ CARTELERA + COSTADO ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-[#00213f]"
                  style={TIPOGRAFIA_TITULO}
                >
                  <Building2 className="h-6 w-6 text-primary-600" />
                  Oportunidades disponibles
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500" style={TIPOGRAFIA_TEXTO}>
                  {carteleraVacia
                    ? "Todavía no hay pedidos publicados"
                    : `Mostrando ${filtrados.length} de ${oportunidades.length} ${
                        oportunidades.length === 1 ? "oportunidad" : "oportunidades"
                      }`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!carteleraVacia && (
                  <SelectUIAB
                    ariaLabel="Ordenar oportunidades"
                    value={orden}
                    onValueChange={(v) => setOrden(v as Orden)}
                    options={opcionesOrden}
                    className="h-11 min-w-[170px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  />
                )}
                <BotonReiniciarTour tour="oportunidades" label="Ver tutorial" />
              </div>
            </div>

            {loading && carteleraVacia ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-white/60" />
                ))}
              </div>
            ) : filtrados.length > 0 ? (
              <div className="space-y-4">
                {filtrados.map((op, idx) => {
                  const puntaje = puntajePorOportunidad.get(op.id);
                  const solicitante = solicitanteDe(op);

                  return (
                    <Link
                      key={op.id}
                      href={`/oportunidades/${op.id}`}
                      data-tour={idx === 0 ? "op-tarjeta" : undefined}
                      className="group block"
                    >
                      <article
                        className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${
                          puntaje !== undefined
                            ? "border-primary-200 ring-1 ring-primary-100"
                            : "border-slate-200/80"
                        }`}
                      >
                        <div className="flex gap-4 sm:gap-5">
                          <LogoSolicitante solicitante={solicitante} />

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                              {puntaje !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-primary-700">
                                  <Sparkles className="h-3 w-3" />
                                  Recomendada · {Math.round(puntaje)}%
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                {op.estado}
                              </span>
                              <span className="ml-auto text-xs font-semibold text-slate-400" style={TIPOGRAFIA_TEXTO}>
                                {publicadaHace(op.creado_en)}
                              </span>
                            </div>

                            <h3
                              className="text-lg font-black leading-snug text-[#00213f] transition-colors group-hover:text-primary-600 sm:text-xl"
                              style={TIPOGRAFIA_TITULO}
                            >
                              {op.titulo}
                            </h3>

                            {solicitante.nombre && (
                              <p className="mt-1 text-sm font-semibold text-slate-500" style={TIPOGRAFIA_TEXTO}>
                                {solicitante.nombre}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {op.categoria?.nombre && <Chip icono={Tag}>{op.categoria.nombre}</Chip>}
                              {op.localidad && <Chip icono={MapPin}>{op.localidad}</Chip>}
                              {op.cantidad != null && (
                                <Chip icono={Package}>
                                  {op.cantidad}
                                  {op.unidad ? ` ${op.unidad}` : ""}
                                </Chip>
                              )}
                              {op.fecha_necesidad && (
                                <Chip icono={CalendarClock}>Para el {fechaCorta(op.fecha_necesidad)}</Chip>
                              )}
                            </div>

                            <p
                              className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600"
                              style={TIPOGRAFIA_TEXTO}
                            >
                              {op.descripcion}
                            </p>

                            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 transition-transform group-hover:translate-x-1">
                                Ver detalle <ArrowRight className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            ) : carteleraVacia ? (
              /*
                Estado vacío honesto: cuando no hay ni un pedido publicado, la
                respuesta correcta no es rellenar con ejemplos —esta página llegó
                a mostrar tres inventados— sino explicar para qué sirve la
                cartelera y dejar a mano las dos salidas útiles.
              */
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center sm:p-12">
                <Image
                  src="/landing/oportunidades-vacio.webp"
                  alt=""
                  aria-hidden="true"
                  width={640}
                  height={594}
                  className="mx-auto mb-6 h-auto w-40 select-none sm:w-48"
                />
                <h3 className="text-xl font-black text-[#00213f]" style={TIPOGRAFIA_TITULO}>
                  Todavía no hay pedidos publicados
                </h3>
                <p
                  className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-slate-600"
                  style={TIPOGRAFIA_TEXTO}
                >
                  Acá aparecen las necesidades que publican las socias: provisión de materiales,
                  trabajos de mantenimiento, servicios de terceros o desarrollos a medida. Cuando
                  alguien publica un pedido, la plataforma lo cruza con los rubros y las etiquetas
                  de cada socia y le sugiere a quien publicó las que coinciden.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  {isEmpresa && (
                    <Button
                      asChild
                      className="h-12 rounded-xl bg-[#00213f] px-6 font-bold hover:bg-[#10375c]"
                    >
                      <Link href="/oportunidades/nueva">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Publicar la primera
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-xl border-slate-200 px-6 font-bold text-slate-700"
                  >
                    <Link href="/directorio">Buscar en el directorio</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-12 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-600">
                  Ninguna oportunidad coincide con lo que buscás.
                </p>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:underline"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* ═══ COSTADO ════════════════════════════════════════════════ */}
          <aside className="space-y-6 lg:col-span-1">
            <section
              data-tour="op-sidebar-publicar"
              className="relative overflow-hidden rounded-2xl bg-[#00213f] p-8 text-white shadow-xl shadow-[#00213f]/20"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600">
                <Target className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-2xl font-black tracking-tight" style={TIPOGRAFIA_TITULO}>
                ¿Tenés una necesidad?
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60" style={TIPOGRAFIA_TEXTO}>
                Publicá tu requerimiento técnico y la plataforma lo cruza con los rubros y las
                etiquetas de las socias para sugerirte las que coinciden.
              </p>
              <ul className="mt-6 space-y-3 text-sm" style={TIPOGRAFIA_TEXTO}>
                {["Cruce automático por rubro y etiquetas", "Empresas verificadas por la UIAB", "Trato directo, sin comisiones"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                      <span className="text-white/80">{item}</span>
                    </li>
                  )
                )}
              </ul>
              <Button
                asChild
                className="mt-7 h-12 w-full rounded-xl border-none bg-white font-bold text-[#00213f] shadow-lg hover:bg-slate-100"
              >
                <Link href="/oportunidades/nueva">
                  Publicar ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="text-base font-black uppercase tracking-wider text-[#00213f]"
                  style={TIPOGRAFIA_TITULO}
                >
                  Sectores clave
                </h2>
                <Link href="/rubros" className="text-xs font-bold text-primary-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {RUBROS_SEO.slice(0, SECTORES_VISIBLES).map((r) => {
                  const Icono = ICONO_SECTOR[r.slug] ?? Factory;
                  return (
                    <Link
                      key={r.slug}
                      href={`/rubros/${r.slug}`}
                      title={r.nombre}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-[#10375c] ring-1 ring-slate-200/70 transition-colors hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200"
                    >
                      <Icono className="h-3.5 w-3.5 text-primary-500" />
                      {nombreCortoDeRubro(r.nombre)}
                    </Link>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
