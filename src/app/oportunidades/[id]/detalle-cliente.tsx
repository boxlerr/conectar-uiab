"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Briefcase,
  CalendarDays,
  Clock,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  PencilLine,
  Plus,
  Share2,
  Sparkles,
  Star,
  Tag,
  Target,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { esFichaDeEmpresa, tipoEntidadDe } from "@/modulos/autenticacion/entidad-del-perfil";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { crearSlug } from "@/lib/utilidades";
import {
  oportunidadesService,
  Oportunidad,
  Match,
} from "@/modulos/oportunidades/servicio-oportunidades";
import { solicitanteDe, urlPublicaDeLogo } from "@/modulos/oportunidades/solicitante";
import { hrefFichaDeCandidato } from "@/modulos/compartido/ficha-publica";
import {
  type AdjuntoOportunidad,
  etiquetaDeTipo,
  tamanoLegible,
} from "@/modulos/oportunidades/adjuntos";
import { recortarEnPalabra, textoPlanoDeHtml } from "@/modulos/oportunidades/texto";
import { llamarAccion, fallo } from "@/lib/accion-segura";
import DialogoPostularse from "./DialogoPostularse";
import { miPostulacionEnOportunidad } from "./acciones";
import { adjuntosDeOportunidadPropia } from "../adjuntos-acciones";
import { GaleriaOportunidad } from "./GaleriaOportunidad";
import { AccionesRapidas } from "./AccionesRapidas";

/** Manrope/Inter no existen como clases de Tailwind (ver memoria): van por style. */
const manrope = { fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" } as const;
const inter = { fontFamily: "var(--font-inter, 'Inter', sans-serif)" } as const;

/** Portadas genéricas (generadas) para oportunidades sin fotos: la elección es
 *  determinística por id así el hero no cambia entre visitas. */
const PORTADAS_FALLBACK = 4;
function portadaDeFallback(id: string): string {
  let suma = 0;
  for (const caracter of id) suma = (suma + caracter.charCodeAt(0)) % 997;
  return `/oportunidades/portada-${(suma % PORTADAS_FALLBACK) + 1}.webp`;
}

const ETIQUETA_VISIBILIDAD: Record<string, string> = {
  privada_parque: "Sólo red verificada",
};

function fechaLarga(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const fecha = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Detalle de una oportunidad, rediseño 2026-08.
 *
 * Dos variantes sobre el mismo esqueleto:
 *  - DUEÑA: Editar / Ver perfil público en el hero, "Acciones rápidas"
 *    (invitar, duplicar, cerrar, eliminar) y candidatos recomendados.
 *  - TERCERO: Postularse + Compartir; nada de acciones de gestión.
 *
 * `inicial` es la oportunidad ABIERTA resuelta en el servidor por page.tsx:
 * el HTML del primer render ya trae título, descripción y ficha para
 * Googlebot. `adjuntosIniciales` viene del mismo RSC (Storage, no depende de
 * la sesión). Para cerradas o borradas llega `null` y el cliente la busca con
 * sesión, como siempre.
 */
export default function OportunidadDetalleCliente({
  id,
  inicial,
  adjuntosIniciales = [],
}: {
  id: string;
  inicial: Oportunidad | null;
  adjuntosIniciales?: AdjuntoOportunidad[];
}) {
  const { currentUser } = useAuth();

  const [op, setOp] = useState<Oportunidad | null>(inicial);
  const [candidates, setCandidates] = useState<Match[]>([]);
  const [myMatch, setMyMatch] = useState<Match | null>(null);
  const [miPostulacion, setMiPostulacion] = useState<{
    id: string;
    estado: string;
  } | null>(null);
  const [resenas, setResenas] = useState<
    Map<string, { promedio: number; total: number }>
  >(new Map());
  const [adjuntos, setAdjuntos] = useState<AdjuntoOportunidad[]>(adjuntosIniciales);
  const [verTodosCandidatos, setVerTodosCandidatos] = useState(false);
  /** "cargando" hasta que el cruce contesta; "error" si no pudo. Sin esto, un
   *  fetch lento pinta "no hay candidatos" cuando en realidad hay. */
  const [estadoCandidatos, setEstadoCandidatos] =
    useState<"cargando" | "listo" | "error">("cargando");
  const [loading, setLoading] = useState(!inicial);

  const isOwner = Boolean(
    currentUser?.entityId &&
      op &&
      (op.empresa_solicitante_id === currentUser.entityId ||
        op.proveedor_solicitante_id === currentUser.entityId)
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // El refetch va en su PROPIO try: si falla (el singleton de Supabase
        // suele venir tocado tras una navegación client-side), antes se llevaba
        // puesto todo lo de abajo y los candidatos no se pedían nunca — el
        // famoso "no aparece nada hasta que aprieto F5". El dato del servidor
        // ya está en pantalla, así que seguimos con él.
        let efectiva = inicial;
        try {
          const data = await oportunidadesService.getOportunidadById(id);
          if (data) efectiva = data;
        } catch (error) {
          console.error(
            "[OportunidadDetail] refetch falló, sigo con el del servidor:",
            error
          );
        }
        if (!isMounted) return;
        setOp(efectiva);

        const esDueno =
          currentUser?.entityId &&
          (efectiva?.empresa_solicitante_id === currentUser.entityId ||
            efectiva?.proveedor_solicitante_id === currentUser.entityId);

        const tasks: Promise<void>[] = [];

        if (esDueno) {
          // Una oportunidad cerrada no viaja con sus adjuntos desde el servidor
          // (serían legibles sin sesión): su dueña los pide acá.
          if (adjuntosIniciales.length === 0) {
            tasks.push(
              llamarAccion(() => adjuntosDeOportunidadPropia(id)).then((propios) => {
                if (isMounted && Array.isArray(propios)) setAdjuntos(propios);
              })
            );
          }

          tasks.push(
            oportunidadesService
              .getMatchesForOportunidad(id)
              .then(async (m) => {
                if (!isMounted) return;
                setCandidates(m);
                setEstadoCandidatos("listo");
                // Reseñas reales de los candidatos (sólo se pintan si existen).
                const empresaIds = m
                  .map((match) => match.empresa_candidata_id)
                  .filter((eid): eid is string => Boolean(eid));
                try {
                  const mapa = await oportunidadesService.getResenasDeEmpresas(empresaIds);
                  if (isMounted) setResenas(mapa);
                } catch {
                  /* sin reseñas: la tarjeta muestra etiquetas en común */
                }
              })
              .catch((error) => {
                console.error(
                  "[OportunidadDetail] no se pudieron traer los candidatos:",
                  error
                );
                if (isMounted) setEstadoCandidatos("error");
              })
          );
        }

        if (
          currentUser?.entityId &&
          (esFichaDeEmpresa(currentUser) || tipoEntidadDe(currentUser) === "provider")
        ) {
          tasks.push(
            oportunidadesService
              .getMatchesForUser(currentUser.entityId, tipoEntidadDe(currentUser)!)
              .then((all) => {
                const found = all.find((m) => m.oportunidad_id === id) ?? null;
                if (isMounted) setMyMatch(found);
              })
          );

          if (!esDueno) {
            // Con `llamarAccion`: si el transporte falla (deploy skew) y esto
            // rechazara, el Promise.all se cortaría y quien ya se postuló
            // volvería a ver el botón de postularse.
            tasks.push(
              llamarAccion(() => miPostulacionEnOportunidad(id)).then((p) => {
                if (isMounted && p && !fallo(p)) setMiPostulacion(p);
              })
            );
          }
        }

        await Promise.all(tasks);
      } catch (error) {
        console.error("[OportunidadDetail] Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
    // `inicial` NO va en las deps: es un objeto nuevo en cada render del RSC y
    // relanzaba el efecto entero sin que hubiera cambiado nada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    inicial?.id,
    adjuntosIniciales.length,
    currentUser?.entityId,
    currentUser?.role,
  ]);

  const imagenes = useMemo(
    () => adjuntos.filter((adjunto) => adjunto.esImagen),
    [adjuntos]
  );

  if (loading)
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7f9fb]">
        <div className="flex animate-pulse flex-col items-center">
          <Briefcase className="mb-4 h-12 w-12 text-slate-200" />
          <p style={inter} className="font-medium tracking-wide text-slate-400">
            Cargando oportunidad...
          </p>
        </div>
      </div>
    );

  if (!op)
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7f9fb] px-4">
        <Card className="w-full max-w-md rounded-2xl border-none bg-white p-8 text-center shadow-lg">
          <Info className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 style={manrope} className="mb-2 text-xl font-bold text-slate-900">
            No se encontró la oportunidad
          </h2>
          <Link href="/oportunidades">
            <Button className="mt-4 h-12 rounded-xl bg-[#00213f] px-8 hover:bg-[#10375c]">
              Volver al listado
            </Button>
          </Link>
        </Card>
      </div>
    );

  const abierta = op.estado === "abierta";
  const folio = `#${op.id.slice(0, 6).toUpperCase()}`;
  const solicitante = solicitanteDe(op);
  const subtitulo = recortarEnPalabra(textoPlanoDeHtml(op.descripcion), 160);

  const fechaNecesidad = fechaLarga(op.fecha_necesidad);
  const fechaPublicada = fechaLarga(op.creado_en);
  const visibilidad =
    ETIQUETA_VISIBILIDAD[op.visibilidad ?? ""] ?? "Red UIAB Conecta";

  // Etiquetas de la oportunidad: se cruzan con las de cada candidato para
  // mostrar "qué tienen en común" en vez de puntajes crudos.
  const opTags = (op.oportunidades_tags ?? [])
    .map((ot) => ot.tags?.nombre)
    .filter((n): n is string => Boolean(n));

  const puedePostularse =
    !isOwner &&
    currentUser?.entityId &&
    (esFichaDeEmpresa(currentUser) || tipoEntidadDe(currentUser) === "provider") &&
    abierta;

  // Perfil público del solicitante (la ficha se resuelve por slug, nunca UUID).
  const slugSolicitante = solicitante.nombre ? crearSlug(solicitante.nombre) : null;

  const candidatosOrdenados = [...candidates].sort((a, b) => b.puntaje - a.puntaje);
  const candidatosVisibles = verTodosCandidatos
    ? candidatosOrdenados
    : candidatosOrdenados.slice(0, 8);

  const compartir = async () => {
    const url = `${window.location.origin}/oportunidades/${op.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: op.titulo, url });
        return;
      }
    } catch {
      /* cancelado por el usuario: probamos el portapapeles */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el link.");
    }
  };

  // Numeración de secciones de la columna principal (los adjuntos pueden no estar).
  let numeroSeccion = 0;
  const proximoNumero = () => String(++numeroSeccion).padStart(2, "0");

  return (
    <div className="min-h-svh bg-[#f7f9fb]">
      {/* ── Franja de migas ── */}
      <div className="bg-[#00213f] text-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <nav
            style={inter}
            aria-label="Migas de pan"
            className="flex min-w-0 items-center gap-2.5 text-[11px] font-semibold text-white/50"
          >
            {isOwner ? (
              <Link href="/panel-de-control" className="shrink-0 transition-colors hover:text-white">
                Panel de Control
              </Link>
            ) : (
              <Link href="/" className="shrink-0 transition-colors hover:text-white">
                UIAB Conecta
              </Link>
            )}
            <span className="text-white/25">›</span>
            <Link href="/oportunidades" className="shrink-0 transition-colors hover:text-white">
              Oportunidades
            </Link>
            <span className="text-white/25">›</span>
            <span className="truncate text-white">Detalle</span>
          </nav>
          <Link
            href="/oportunidades"
            style={inter}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0" />
            <span className="hidden sm:inline">Volver al listado</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <header
        data-tour="op-detalle-hero"
        className="relative overflow-hidden border-t border-white/5 bg-[#00213f] text-white"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0b2d4d] to-[#123a63]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
            <div className="min-w-0">
              {/* Folio + estado */}
              <div
                style={inter}
                className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em]"
              >
                <span className="text-white/40">
                  Folio · <span className="tabular-nums text-white/70">{folio}</span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] ${
                    abierta
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {abierta ? "Abierta" : "Cerrada"}
                </span>
                {myMatch && !isOwner && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    Recomendado para tu ficha
                  </span>
                )}
              </div>

              {/* Título + bajada */}
              <h1
                style={manrope}
                className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-[-0.02em] sm:text-5xl lg:text-[3.4rem]"
              >
                {op.titulo}
              </h1>
              {subtitulo && (
                <p
                  style={inter}
                  className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/60"
                >
                  {subtitulo}
                </p>
              )}

              {/* Meta de 4 columnas */}
              <dl
                data-tour="op-detalle-meta"
                className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4"
              >
                <MetaHero
                  icono={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  etiqueta="Solicitante"
                  valor={solicitante.nombre ?? "Miembro de la red"}
                  logoUrl={solicitante.logoUrl}
                  inicial={solicitante.inicial}
                />
                <MetaHero
                  icono={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                  etiqueta="Ubicación"
                  valor={op.localidad}
                />
                <MetaHero
                  icono={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                  etiqueta="Necesidad"
                  valor={fechaNecesidad ?? "A coordinar"}
                />
                <MetaHero
                  icono={<Tag className="h-3.5 w-3.5" aria-hidden="true" />}
                  etiqueta="Categoría"
                  valor={op.categoria?.nombre ?? "General"}
                />
              </dl>

              {/* Acciones del hero */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                {isOwner ? (
                  <>
                    <Link href={`/oportunidades/${op.id}/editar`} className="sm:shrink-0">
                      <Button
                        style={inter}
                        className="h-12 w-full gap-2 rounded-xl bg-primary-600 px-6 text-sm font-bold text-white shadow-lg shadow-primary-900/30 transition-all hover:bg-primary-700 sm:w-auto"
                      >
                        <PencilLine className="h-4 w-4" aria-hidden="true" />
                        Editar oportunidad
                      </Button>
                    </Link>
                    {slugSolicitante && (
                      <Link href={`/empresas/${slugSolicitante}`} className="sm:shrink-0">
                        <Button
                          variant="outline"
                          style={inter}
                          className="h-12 w-full gap-2 rounded-xl border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
                        >
                          Ver perfil público
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {puedePostularse && (
                      <div data-tour="op-detalle-postular" className="sm:w-80">
                        <DialogoPostularse
                          oportunidadId={op.id}
                          tituloOportunidad={op.titulo}
                          sugerenciaCantidad={op.cantidad ?? null}
                          sugerenciaUnidad={op.unidad ?? null}
                          yaPostulado={miPostulacion}
                          onPostulado={() =>
                            setMiPostulacion({ id: "pending-refresh", estado: "enviada" })
                          }
                        />
                      </div>
                    )}
                    {!abierta && (
                      <span
                        style={inter}
                        className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold text-white/70"
                      >
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Esta oportunidad ya está cerrada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={compartir}
                      style={inter}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
                    >
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      Compartir
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Galería: las fotos subidas al crear; clickeables a pantalla
                completa y deslizables. Sin fotos → portada genérica del rubro. */}
            <div className="h-56 sm:h-72 lg:h-auto lg:min-h-[340px]">
              <GaleriaOportunidad
                imagenes={imagenes}
                portadaFallback={portadaDeFallback(op.id)}
                titulo={op.titulo}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── CUERPO ── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid grid-cols-12 gap-8 lg:gap-10">
          {/* Columna principal */}
          <main className="col-span-12 space-y-10 lg:col-span-8">
            {/* Descripción */}
            <section data-tour="op-detalle-descripcion">
              <EncabezadoSeccion numero={proximoNumero()} titulo="Descripción del requerimiento" />
              <div className="rounded-2xl border border-slate-200/60 bg-white p-7 shadow-sm sm:p-9">
                <div
                  style={inter}
                  className="text-[15px] leading-[1.8] text-slate-700 sm:text-base [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_strong]:text-[#00213f] [&_b]:font-bold [&_b]:text-[#00213f]"
                  dangerouslySetInnerHTML={{ __html: op.descripcion }}
                />

                {/* El presupuesto no es un campo de la publicación: se define
                    cotización mediante — por eso siempre "A confirmar". */}
                <div className="mt-8 flex items-center gap-4 rounded-xl border border-primary-100 bg-primary-50/70 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p style={inter} className="text-sm font-bold text-slate-700">
                      Presupuesto estimado
                    </p>
                    <p style={inter} className="text-sm font-bold text-primary-700">
                      A confirmar
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Archivos adjuntos */}
            {adjuntos.length > 0 && (
              <section>
                <EncabezadoSeccion numero={proximoNumero()} titulo="Archivos adjuntos" />
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                  {adjuntos.map((adjunto) => (
                    <FilaAdjunto key={adjunto.ruta} adjunto={adjunto} />
                  ))}
                </ul>
              </section>
            )}

            {/* Por qué te recomendamos (tercero con match) */}
            {myMatch && !isOwner && (
              <section data-tour="op-detalle-match">
                <EncabezadoSeccion numero={proximoNumero()} titulo="Por qué te recomendamos" />
                <div className="rounded-2xl border border-slate-200/60 bg-white p-7 shadow-sm sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    </span>
                    <p style={inter} className="flex-1 text-[15px] leading-relaxed text-slate-700">
                      {myMatch.motivo_match}
                    </p>
                  </div>
                  <dl data-tour="op-detalle-puntajes" className="mt-6 grid grid-cols-3 gap-3">
                    <PuntajeCelda etiqueta="Categoría" valor={myMatch.detalle_puntaje.categoria} />
                    <PuntajeCelda etiqueta="Etiquetas" valor={myMatch.detalle_puntaje.tags} />
                    <PuntajeCelda etiqueta="Ubicación" valor={myMatch.detalle_puntaje.ubicacion} />
                  </dl>
                </div>
              </section>
            )}

          </main>

          {/* ── Sidebar ── */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-28">
              {/* Resumen */}
              <div
                data-tour="op-detalle-ficha"
                className="rounded-2xl bg-[#00213f] p-6 text-white shadow-[0_24px_50px_-30px_rgba(0,33,63,0.8)]"
              >
                <p
                  style={inter}
                  className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50"
                >
                  Resumen de la oportunidad
                </p>
                <dl style={inter} className="divide-y divide-white/10">
                  <FilaResumen
                    icono={<Clock className="h-3.5 w-3.5" aria-hidden="true" />}
                    etiqueta="Estado"
                  >
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                        abierta
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {abierta ? "Abierta" : "Cerrada"}
                    </span>
                  </FilaResumen>
                  {fechaPublicada && (
                    <FilaResumen
                      icono={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                      etiqueta="Publicada el"
                    >
                      {fechaPublicada}
                    </FilaResumen>
                  )}
                  {fechaNecesidad && (
                    <FilaResumen
                      icono={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                      etiqueta="Necesidad"
                    >
                      {fechaNecesidad}
                    </FilaResumen>
                  )}
                  {op.cantidad != null && (
                    <FilaResumen
                      icono={<Package className="h-3.5 w-3.5" aria-hidden="true" />}
                      etiqueta="Cantidad"
                    >
                      {op.cantidad}
                      {op.unidad ? ` ${op.unidad}` : ""}
                    </FilaResumen>
                  )}
                  {op.categoria && (
                    <FilaResumen
                      icono={<Tag className="h-3.5 w-3.5" aria-hidden="true" />}
                      etiqueta="Categoría"
                    >
                      {op.categoria.nombre}
                    </FilaResumen>
                  )}
                  <FilaResumen
                    icono={<Lock className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />}
                    etiqueta="Visibilidad"
                  >
                    {visibilidad}
                  </FilaResumen>
                  <FilaResumen
                    icono={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                    etiqueta="ID de oportunidad"
                  >
                    <span className="tabular-nums">{folio}</span>
                  </FilaResumen>
                </dl>
              </div>

              {/* Acciones rápidas (sólo dueña) */}
              {isOwner && (
                <AccionesRapidas
                  oportunidadId={op.id}
                  estado={op.estado}
                  candidatos={candidatosOrdenados}
                  onCerrada={() => setOp((previa) => (previa ? { ...previa, estado: "cerrada" } : previa))}
                />
              )}

              {/* Ayuda — el fondo es el mismo color de la ilustración */}
              <div className="relative overflow-hidden rounded-2xl bg-[#d7e7fe] p-6">
                <div className="relative z-10 max-w-[65%]">
                  <p style={manrope} className="text-lg font-black tracking-tight text-[#00213f]">
                    ¿Necesitás ayuda?
                  </p>
                  <p style={inter} className="mt-2 text-sm leading-relaxed text-slate-600">
                    Nuestro equipo está para acompañarte en cada paso.
                  </p>
                  <Link
                    href="/contacto"
                    style={inter}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#00213f] shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
                  >
                    Centro de ayuda
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
                <Image
                  src="/oportunidades/ayuda-headset.webp"
                  alt=""
                  aria-hidden="true"
                  width={480}
                  height={480}
                  className="absolute -right-4 top-1/2 w-32 -translate-y-1/2 select-none sm:w-36"
                />
              </div>
            </div>
          </aside>
        </div>

          {/* Candidatos recomendados (dueña).
              Vive FUERA del grid de dos columnas: cuando el sidebar ya terminó,
              usar sólo 8 de 12 columnas dejaba media pantalla en blanco y
              apretaba las tarjetas hasta cortarles el texto. */}
          {isOwner && (
            <section className="mt-16">
              <div className="mb-5 flex items-baseline gap-4">
                <span
                  style={inter}
                  className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 tabular-nums"
                >
                  {proximoNumero()}
                </span>
                <h2
                  style={inter}
                  className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500"
                >
                  Candidatos recomendados
                </h2>
                <span className="h-px flex-1 bg-slate-200/70" />
                {candidatosOrdenados.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setVerTodosCandidatos((previo) => !previo)}
                    style={inter}
                    className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700 transition-colors hover:text-primary-800"
                  >
                    {verTodosCandidatos ? "Ver menos" : "Ver todos"}
                    <ArrowRight
                      className={`h-3 w-3 transition-transform ${verTodosCandidatos ? "rotate-90" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>

              {estadoCandidatos === "cargando" ? (
                // Silueta de la tarjeta, no un bloque liso: `bg-slate-100` sobre
                // el fondo #f7f9fb de la página no se distingue de "no hay nada",
                // que es justo lo que este estado viene a evitar.
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm"
                    >
                      <div className="h-6 w-16 rounded-full bg-slate-200" />
                      <div className="mt-5 h-4 w-3/4 rounded bg-slate-200" />
                      <div className="mt-2.5 h-3 w-1/2 rounded bg-slate-100" />
                      <div className="mt-6 flex gap-2">
                        <div className="h-5 w-20 rounded-full bg-slate-100" />
                        <div className="h-5 w-16 rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-6 h-9 rounded-xl bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : estadoCandidatos === "error" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-10 text-center">
                  <p style={inter} className="text-sm font-medium text-amber-900">
                    No pudimos cargar los candidatos en este momento.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={inter}
                    className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#00213f] px-5 text-sm font-bold text-white transition-colors hover:bg-[#10375c]"
                  >
                    Reintentar
                  </button>
                </div>
              ) : candidatosOrdenados.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/60 bg-white p-14 text-center shadow-sm">
                  <Sparkles className="mx-auto mb-4 h-10 w-10 text-slate-200" />
                  <p
                    style={inter}
                    className="mx-auto max-w-sm font-medium leading-relaxed text-slate-500"
                  >
                    Todavía no hay candidatos con compatibilidad suficiente.
                    Cuantas más etiquetas tenga tu oportunidad, más
                    coincidencias encontramos.
                  </p>
                  <Link href={`/oportunidades/${op.id}/editar`} className="mt-6 inline-block">
                    <Button
                      style={inter}
                      className="h-11 rounded-xl bg-[#00213f] px-6 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#10375c]"
                    >
                      Agregar etiquetas
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {candidatosVisibles.map((match) => (
                    <TarjetaCandidato
                      key={match.id}
                      match={match}
                      opTags={opTags}
                      resenas={resenas}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

        {/* ── CTA final ── */}
        <section className="mt-14 overflow-hidden rounded-2xl bg-[#00213f] shadow-[0_28px_60px_-32px_rgba(0,33,63,0.75)]">
          <div className="relative flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0b2d4d] to-[#123a63]"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                <Target className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 style={manrope} className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  ¿Tenés otra necesidad?
                </h2>
                <p style={inter} className="mt-1 max-w-md text-sm leading-relaxed text-white/60">
                  Publicá una nueva oportunidad y conectá con los mejores
                  proveedores de la red UIAB Conecta.
                </p>
              </div>
            </div>
            <Link href="/oportunidades/nueva" className="relative shrink-0">
              <Button
                style={inter}
                className="h-12 gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#00213f] transition-colors hover:bg-slate-100"
              >
                Publicar nueva oportunidad
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>

        <footer
          style={inter}
          className="mt-16 pb-4 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300"
        >
          © {new Date().getFullYear()} UIAB Conecta — Gestión de Oportunidades Industriales
        </footer>
      </div>
    </div>
  );
}

/* ── Piezas ─────────────────────────────────────────────────────────────── */

function EncabezadoSeccion({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-4">
      <span
        style={inter}
        className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 tabular-nums"
      >
        {numero}
      </span>
      <h2
        style={inter}
        className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500"
      >
        {titulo}
      </h2>
      <span className="h-px flex-1 bg-slate-200/70" />
    </div>
  );
}

function MetaHero({
  icono,
  etiqueta,
  valor,
  logoUrl,
  inicial,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  /** Sólo el solicitante: su marca al lado del nombre. */
  logoUrl?: string | null;
  inicial?: string;
}) {
  return (
    <div className="min-w-0">
      <dt
        style={inter}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40"
      >
        <span className="text-primary-300/80">{icono}</span>
        {etiqueta}
      </dt>
      {/* Dos líneas, no `truncate`: "Burzaco, Provincia de Buenos Aires" y los
          nombres largos de rubro no entran en una sola y quedaban cortados. */}
      <dd
        style={inter}
        className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold leading-snug text-white"
        title={valor}
      >
        {inicial !== undefined &&
          (logoUrl ? (
            // Suelto, sin círculo ni fondo: encerrarlo en 28px lo volvía
            // ilegible. `object-contain` respeta el aspecto de cualquier logo.
            <Image
              src={logoUrl}
              alt=""
              width={96}
              height={48}
              className="h-10 w-auto max-w-full shrink-0 object-contain object-left"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/70">
              {inicial}
            </span>
          ))}
        {/* `flex-1` + un mínimo: en la columna angosta del hero el nombre baja
            a su propia línea en vez de quedar cortado en "Vax". */}
        <span className="line-clamp-2 min-w-[5.5rem] flex-1">{valor}</span>
      </dd>
    </div>
  );
}

function FilaResumen({
  icono,
  etiqueta,
  children,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="flex shrink-0 items-center gap-2.5 text-[13px] text-white/60">
        <span className="text-white/35">{icono}</span>
        {etiqueta}
      </dt>
      <dd className="min-w-0 text-right text-[13px] font-semibold text-white [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

function PuntajeCelda({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl bg-[#f2f4f6] p-4">
      <dt
        style={inter}
        className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
      >
        {etiqueta}
      </dt>
      <dd style={manrope} className="mt-1 text-2xl font-bold tabular-nums text-[#00213f]">
        {valor}
      </dd>
    </div>
  );
}

const ICONO_ADJUNTO: Record<string, { clase: string; Icono: typeof FileText }> = {
  PDF: { clase: "bg-red-50 text-red-500", Icono: FileText },
  DOC: { clase: "bg-primary-50 text-primary-600", Icono: FileText },
  DOCX: { clase: "bg-primary-50 text-primary-600", Icono: FileText },
  XLS: { clase: "bg-emerald-50 text-emerald-600", Icono: FileSpreadsheet },
  XLSX: { clase: "bg-emerald-50 text-emerald-600", Icono: FileSpreadsheet },
};

function FilaAdjunto({ adjunto }: { adjunto: AdjuntoOportunidad }) {
  const tipo = etiquetaDeTipo(adjunto.mime, adjunto.nombre);
  const { clase, Icono } = adjunto.esImagen
    ? { clase: "bg-emerald-50 text-emerald-600", Icono: ImageIcon }
    : ICONO_ADJUNTO[tipo] ?? { clase: "bg-slate-100 text-slate-500", Icono: FileText };
  const peso = tamanoLegible(adjunto.tamano);

  return (
    <li className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${clase}`}>
        <Icono className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p style={inter} className="truncate text-sm font-bold text-[#00213f]">
          {adjunto.nombre}
        </p>
        <p style={inter} className="text-xs text-slate-400">
          {tipo}
          {peso ? ` · ${peso}` : ""}
        </p>
      </div>
      <a
        href={adjunto.url}
        download={adjunto.nombre}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Descargar ${adjunto.nombre}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#00213f]"
      >
        <Download className="h-[18px] w-[18px]" aria-hidden="true" />
      </a>
    </li>
  );
}

function TarjetaCandidato({
  match,
  opTags,
  resenas,
}: {
  match: Match;
  opTags: string[];
  resenas: Map<string, { promedio: number; total: number }>;
}) {
  const esEmpresa = Boolean(match.empresa_candidata_id);
  const nombre = esEmpresa
    ? match.empresa?.nombre_comercial || match.empresa?.razon_social
    : match.proveedor?.nombre_comercial || match.proveedor?.nombre;

  const logoUrl = urlPublicaDeLogo(
    esEmpresa ? match.empresa?.bucket_logo : match.proveedor?.bucket_logo,
    esEmpresa ? match.empresa?.ruta_logo : match.proveedor?.ruta_logo
  );

  // La ficha pública resuelve por slug (nunca UUID — el link viejo con UUID no
  // matcheaba ninguna ficha), pero NO por el mismo campo que se muestra acá:
  // para una socia busca por `razon_social`, y esta tarjeta rotula con
  // `nombre_comercial`. Con 23 de las 28 socias que tienen nombre comercial
  // distinto de la razón social, "Ver perfil" caía en un 404 —Simonetta,
  // Ormazabal y Genrod incluidas—. El armado del link vive en un solo lugar.
  const href = hrefFichaDeCandidato(match);

  // Reseñas REALES y aprobadas; sin reseñas no se inventa puntaje.
  const rating = match.empresa_candidata_id
    ? resenas.get(match.empresa_candidata_id)
    : undefined;

  const tagsCandidato = (
    (esEmpresa ? match.empresa?.empresas_tags : match.proveedor?.proveedores_tags) ?? []
  )
    .map((t) => t.tags?.nombre)
    .filter((n): n is string => Boolean(n));
  const opTagsLower = opTags.map((t) => t.toLowerCase());
  const compartidas = tagsCandidato.filter((n) => opTagsLower.includes(n.toLowerCase()));

  // TODAS las etiquetas en común, no sólo la primera: son la explicación del
  // puntaje, y mostrar una sola hacía que dos candidatas de 70 y 30 puntos se
  // vieran igual de justificadas.
  const chips: string[] = [...compartidas];
  if (match.detalle_puntaje.categoria > 0) chips.push("Mismo rubro");
  if (match.detalle_puntaje.ubicacion > 0) chips.push("Misma zona");

  // Contacto directo: lo que la ficha tenga cargado, sin inventar nada.
  const contacto = esEmpresa ? match.empresa : match.proveedor;
  const email = contacto?.email?.trim() || null;
  const telefono = contacto?.telefono?.trim() || null;
  const whatsapp = contacto?.whatsapp?.trim() || null;
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`
    : null;

  const puntaje = Math.round(match.puntaje);

  return (
    <Card className="group flex flex-col rounded-2xl border-slate-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Encabezado: logo y, a la derecha, la compatibilidad. El número está a
          la vista a propósito — es lo que empuja a completar el perfil para
          subir en la lista. */}
      <div className="flex items-start justify-between gap-3">
        {/* El logo flota en un círculo blanco con sombra: sobre el gris del
            fondo, un logo chico y plano se perdía entre el resto de la ficha. */}
        {logoUrl ? (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_-6px_rgba(15,23,42,0.28)] ring-1 ring-slate-100">
            <Image
              src={logoUrl}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-contain p-2.5"
            />
          </span>
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-slate-300 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.28)] ring-1 ring-slate-100">
            {esEmpresa ? (
              <Building2 className="h-8 w-8" aria-hidden="true" />
            ) : (
              <User className="h-8 w-8" aria-hidden="true" />
            )}
          </span>
        )}

        <div
          className="flex shrink-0 flex-col items-center rounded-xl bg-[#00213f] px-3 py-1.5 text-white"
          title={match.motivo_match}
        >
          <span style={manrope} className="text-xl font-black leading-none tabular-nums">
            {puntaje}
          </span>
          <span
            style={inter}
            className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50"
          >
            puntos
          </span>
        </div>
      </div>

      {/* El nombre va en dos líneas, no truncado: las razones sociales reales
          ("Simonetta Automatización S.A.") no entran en una sola columna. */}
      <p
        style={manrope}
        className="mt-3 max-w-full text-base font-bold leading-snug text-[#00213f]"
      >
        <span className="line-clamp-2 [overflow-wrap:anywhere]">
          {nombre || "Sin nombre"}
          <BadgeCheck
            className="ml-1 inline h-4 w-4 shrink-0 align-[-3px] text-emerald-500"
            aria-hidden="true"
          />
        </span>
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p style={inter} className="text-xs text-slate-400">
          {esEmpresa ? "Empresa socia UIAB" : "Prestador verificado"}
        </p>
        {/* Estrellas sólo con reseñas aprobadas reales. */}
        {rating && rating.total > 0 && (
          <p style={inter} className="inline-flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-bold text-[#00213f]">
              {rating.promedio.toFixed(1).replace(".", ",")}
            </span>
            <span className="text-slate-400">({rating.total})</span>
          </p>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              style={inter}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Sin recorte: el motivo termina nombrando las etiquetas que coinciden,
          que es justo lo que un `line-clamp-2` se comía ("…Electricidad y…").
          `flex-1` empuja las acciones al pie para que queden alineadas entre
          tarjetas de distinto largo. */}
      <p
        style={inter}
        className="mt-3 flex-1 text-xs leading-relaxed text-slate-500"
      >
        {match.motivo_match}
      </p>

      {/* Dos filas: el botón manda solo y los contactos van debajo. En una
          sola fila, con tres contactos el "Ver perfil" se comprimía hasta que
          el texto se salía del botón. */}
      <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
        {href && (
          <Link href={href} className="block">
            <Button
              variant="outline"
              style={inter}
              className="h-10 w-full rounded-xl border-slate-200 text-sm font-bold text-[#00213f] transition-colors hover:bg-[#00213f] hover:text-white"
            >
              Ver perfil
            </Button>
          </Link>
        )}

        {/* Contacto directo, sin salir de la página. Cada botón aparece sólo si
            la socia cargó ese dato. */}
        {(email || telefono || whatsappUrl) && (
          <div className="flex items-center gap-2">
            {email && (
              <AccionContacto href={`mailto:${email}`} etiqueta={`Escribir a ${nombre}`}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                Mail
              </AccionContacto>
            )}
            {telefono && (
              <AccionContacto href={`tel:${telefono}`} etiqueta={`Llamar a ${nombre}`}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Llamar
              </AccionContacto>
            )}
            {whatsappUrl && (
              <AccionContacto
                href={whatsappUrl}
                etiqueta={`WhatsApp de ${nombre}`}
                externo
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </AccionContacto>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function AccionContacto({
  href,
  etiqueta,
  externo = false,
  children,
}: {
  href: string;
  etiqueta: string;
  externo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      title={etiqueta}
      aria-label={etiqueta}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={inter}
      className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f2f4f6] px-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-[#00213f] hover:text-white"
    >
      {children}
    </a>
  );
}
