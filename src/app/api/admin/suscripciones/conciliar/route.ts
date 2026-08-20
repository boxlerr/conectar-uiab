import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/servidor";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parsearReporteCobros,
  decidirAccion,
  type FilaCobro,
  type AccionConciliacion,
} from "@/lib/sipago/conciliacion";
import { proximoCobro, nombrePlan, type CicloSuscripcion } from "@/lib/suscripciones/modelo";
import { enviarEmail } from "@/lib/email/cliente";
import { plantillaPagoManualRegistrado } from "@/lib/email/plantillas-suscripciones";
import { notificarEntidad } from "@/modulos/notificaciones/acciones";

export const runtime = "nodejs";

/**
 * POST /api/admin/suscripciones/conciliar
 *
 * Body: { texto: string, aplicar?: boolean }
 *
 * Toma el reporte de Cobros de Sipago —pegado tal cual— y lo cruza con los
 * socios por CUIT. Con `aplicar: false` (el default) sólo devuelve el preview:
 * qué haría con cada fila, sin tocar nada. Con `aplicar: true` registra los
 * pagos y deja las suscripciones activas.
 *
 * Existe porque el plan recurrente de Sipago cobra solo pero no avisa: no hay
 * webhook ni API pública para ese módulo. Esta pantalla es el puente.
 *
 * DOS COSAS QUE NO HACE, Y SON A PROPÓSITO:
 *
 * - **No toca a las socias de cortesía.** Las 57 empresas del padrón tienen
 *   acceso sin cargo por decisión de la UIAB. Si alguna apareciera en un reporte
 *   —por un cobro de prueba, por un CUIT repetido— activarle una suscripción
 *   paga le cambiaría el estado por algo que nadie decidió.
 *
 * - **No aplica en seco.** El preview es obligatorio en el flujo de la pantalla:
 *   esto escribe plata contra fichas de socios reales y matchea por contenido,
 *   así que alguien tiene que mirar antes de confirmar.
 */

type Accion = AccionConciliacion;

interface Resultado {
  cuit: string;
  nombre: string | null;
  monto: number | null;
  fecha: string | null;
  accion: Accion;
  detalle: string;
}

interface Entidad {
  id: string;
  tipo: "empresa" | "particular";
  nombre: string;
  email: string | null;
  cuitDigitos: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: perfil } = await admin.from("perfiles").select("rol_sistema").eq("id", user.id).maybeSingle();
  if (perfil?.rol_sistema !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const texto = typeof body?.texto === "string" ? body.texto : "";
  const aplicar = body?.aplicar === true;
  if (!texto.trim()) return NextResponse.json({ error: "Pegá el reporte de cobros." }, { status: 400 });

  const { filas, ignoradas, separador } = parsearReporteCobros(texto);
  if (filas.length === 0) {
    return NextResponse.json(
      { error: "No encontramos ningún CUIT en lo que pegaste. ¿Es el reporte de Cobros?", ignoradas },
      { status: 400 }
    );
  }

  const porCuit = await indicePorCuit(admin);
  const resultados: Resultado[] = [];

  for (const fila of filas) {
    resultados.push(await procesar(admin, fila, porCuit, aplicar));
  }

  return NextResponse.json({
    ok: true,
    aplicado: aplicar,
    separador,
    ignoradas,
    resumen: contar(resultados),
    resultados,
  });
}

// ─── El cruce ───────────────────────────────────────────────────────────────

/** Todas las fichas indexadas por CUIT en dígitos, que es como viene el reporte. */
async function indicePorCuit(admin: ReturnType<typeof createAdminClient>): Promise<Map<string, Entidad>> {
  const [{ data: empresas }, { data: proveedores }] = await Promise.all([
    admin.from("empresas").select("id, razon_social, email, cuit"),
    admin.from("proveedores").select("id, nombre, apellido, razon_social, email, cuit"),
  ]);

  const mapa = new Map<string, Entidad>();

  for (const e of empresas ?? []) {
    const d = String(e.cuit ?? "").replace(/\D/g, "");
    if (d.length === 11) {
      mapa.set(d, { id: e.id, tipo: "empresa", nombre: e.razon_social ?? "", email: e.email ?? null, cuitDigitos: d });
    }
  }
  for (const p of proveedores ?? []) {
    const d = String(p.cuit ?? "").replace(/\D/g, "");
    if (d.length === 11 && !mapa.has(d)) {
      const nombre = p.razon_social || [p.nombre, p.apellido].filter(Boolean).join(" ");
      mapa.set(d, { id: p.id, tipo: "particular", nombre, email: p.email ?? null, cuitDigitos: d });
    }
  }
  return mapa;
}

async function procesar(
  admin: ReturnType<typeof createAdminClient>,
  fila: FilaCobro,
  porCuit: Map<string, Entidad>,
  aplicar: boolean
): Promise<Resultado> {
  const entidad = porCuit.get(fila.cuit) ?? null;
  const base = { cuit: fila.cuit, monto: fila.monto, fecha: fila.fecha, nombre: entidad?.nombre ?? null };

  // La clave de idempotencia. El cobro recurrente no trae un uuid de orden, así
  // que se arma uno estable con CUIT + fecha: si el admin pega el mismo reporte
  // dos veces —o dos reportes que se solapan— el índice único de la base rechaza
  // el duplicado y la suscripción no se extiende de más.
  const clave = `rec-${fila.cuit}-${fila.fecha ?? "sin-fecha"}`;

  let suscripcion: {
    id: string; estado: string | null; metodo_pago: string | null;
    monto: number | string | null; ciclo: string | null; nombre_plan: string | null;
  } | null = null;
  let yaCargado = false;

  if (entidad) {
    const columna = entidad.tipo === "empresa" ? "empresa_id" : "proveedor_id";
    const [{ data: sus }, { data: pago }] = await Promise.all([
      admin
        .from("suscripciones")
        .select("id, estado, metodo_pago, monto, ciclo, nombre_plan")
        .eq(columna, entidad.id)
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("pagos_suscripciones")
        .select("id")
        .eq("sipago_order_uuid", clave)
        .limit(1)
        .maybeSingle(),
    ]);
    suscripcion = sus;
    yaCargado = Boolean(pago);
  }

  const { accion, detalle } = decidirAccion({ fila, entidad, suscripcion, yaCargado });

  if (accion !== "activar" || !aplicar || !entidad) {
    return { ...base, accion, detalle };
  }

  const ciclo: CicloSuscripcion = suscripcion?.ciclo === "anual" ? "anual" : "mensual";
  await aplicarCobro(admin, fila, entidad, suscripcion, ciclo, clave);
  return { ...base, accion, detalle: "Pago registrado, suscripción activa." };
}

// ─── La escritura ───────────────────────────────────────────────────────────

async function aplicarCobro(
  admin: ReturnType<typeof createAdminClient>,
  fila: FilaCobro,
  entidad: Entidad,
  sus: { id: string; nombre_plan: string | null; monto: number | string | null } | null,
  ciclo: CicloSuscripcion,
  clave: string
): Promise<void> {
  const empresaId = entidad.tipo === "empresa" ? entidad.id : null;
  const proveedorId = entidad.tipo === "particular" ? entidad.id : null;
  const monto = fila.monto ?? Number(sus?.monto) ?? 0;
  const pagadoEn = fila.fecha ? new Date(`${fila.fecha}T12:00:00Z`) : new Date();

  let suscripcionId = sus?.id;
  if (!suscripcionId) {
    const { data: nueva } = await admin
      .from("suscripciones")
      .insert({
        empresa_id: empresaId,
        proveedor_id: proveedorId,
        monto,
        moneda: "ARS",
        ciclo,
        nombre_plan: nombrePlan(ciclo),
        estado: "activa",
        metodo_pago: "sipago_suscripcion",
      })
      .select("id")
      .single();
    suscripcionId = nueva?.id;
  }

  const { error } = await admin.from("pagos_suscripciones").insert({
    suscripcion_id: suscripcionId,
    empresa_id: empresaId,
    proveedor_id: proveedorId,
    monto,
    moneda: "ARS",
    estado: "aprobado",
    metodo_pago: "sipago_suscripcion",
    tipo_pago: "automatico",
    ciclo,
    sipago_order_uuid: clave,
    external_reference: fila.referencia,
    nota: "Conciliado del reporte de Cobros de Sipago",
    pagado_en: pagadoEn.toISOString(),
  });

  // 23505 = otro reporte ya lo cargó. El índice único hizo su trabajo.
  if (error && (error as { code?: string }).code === "23505") return;
  if (error) throw new Error(error.message);

  const proximo = proximoCobro(ciclo, pagadoEn).toISOString();
  await admin
    .from("suscripciones")
    .update({
      estado: "activa",
      metodo_pago: "sipago_suscripcion",
      ciclo,
      monto,
      proximo_cobro_en: proximo,
      gracia_hasta: null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", suscripcionId!);

  if (entidad.email) {
    const p = plantillaPagoManualRegistrado({
      nombre: entidad.nombre,
      email: entidad.email,
      entidad: entidad.tipo,
      plan: sus?.nombre_plan || nombrePlan(ciclo),
      monto,
      ciclo,
      metodo: "transferencia",
      pagadoEn,
      proximoCobro: proximo,
      nota: "Débito automático de Sipago",
    });
    await enviarEmail({ para: entidad.email, asunto: p.asunto, html: p.html, texto: p.texto }).catch((e) =>
      console.error("[conciliar] no se pudo avisar:", e)
    );
  }

  await notificarEntidad({
    empresaId,
    proveedorId,
    tipo: "pago_confirmado",
    titulo: "Recibimos tu pago",
    mensaje: "Registramos el débito de tu suscripción. Queda activa.",
    url: "/perfil/suscripcion",
  });
}

function contar(rs: Resultado[]): Record<Accion, number> {
  const base: Record<Accion, number> = {
    activar: 0, ya_registrado: 0, cuit_desconocido: 0, rechazado: 0, cortesia: 0, monto_no_coincide: 0,
  };
  for (const r of rs) base[r.accion]++;
  return base;
}
