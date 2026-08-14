import { createClient } from "@supabase/supabase-js";
import { leerPrecios } from "@/lib/suscripciones/precios";
import { PanelSuscripciones, type FilaSocio, type Pago } from "./PanelSuscripciones";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type FilaSuscripcion = {
  id: string;
  empresa_id: string | null;
  proveedor_id: string | null;
  estado: string | null;
  monto: number | string | null;
  ciclo: string | null;
  metodo_pago: string | null;
  proximo_cobro_en: string | null;
  gracia_hasta: string | null;
};

/**
 * Los socios con su suscripción REAL.
 *
 * Antes esta pantalla armaba la plata multiplicando `empresas.tarifa` por el
 * precio del nivel, sin mirar `suscripciones`. Con eso mostraba $2.750.000 de
 * ingreso mensual mientras 58 de las 59 fichas aprobadas son socias de cortesía
 * con monto 0 y no había un solo pago registrado. Se inventaba la facturación.
 *
 * Ahora todo sale de la suscripción de cada uno: el estado, el ciclo, el monto y
 * el próximo vencimiento. Si no hay fila, se dice que no la hay.
 */
async function getDatos() {
  const db = adminClient();

  const [
    { data: empresas, error: errEmpresas },
    { data: proveedores, error: errProveedores },
    { data: pagos, error: errPagos },
    { data: suscripciones },
    precios,
  ] = await Promise.all([
    db
      .from("empresas")
      .select("id, razon_social, email, estado, es_socia_uiab, creado_en, bucket_logo, ruta_logo")
      .eq("estado", "aprobada")
      .order("razon_social"),
    db
      .from("proveedores")
      .select("id, nombre, apellido, email, estado, creado_en")
      .eq("estado", "aprobado")
      .order("creado_en", { ascending: false }),
    db
      .from("pagos_suscripciones")
      .select("id, empresa_id, proveedor_id, monto, moneda, estado, metodo_pago, pagado_en, creado_en")
      .order("pagado_en", { ascending: false, nullsFirst: false })
      .limit(500),
    // Sin filtrar por proveedor_id: antes esta query traía SÓLO particulares, así
    // que la suscripción de las empresas no llegaba nunca a la pantalla.
    db
      .from("suscripciones")
      .select("id, empresa_id, proveedor_id, estado, monto, ciclo, metodo_pago, proximo_cobro_en, gracia_hasta")
      .order("creado_en", { ascending: false }),
    leerPrecios(),
  ]);

  if (errEmpresas) throw new Error(errEmpresas.message);
  if (errProveedores) throw new Error(errProveedores.message);
  if (errPagos) throw new Error(errPagos.message);

  // La más reciente de cada entidad.
  const porEmpresa = new Map<string, FilaSuscripcion>();
  const porProveedor = new Map<string, FilaSuscripcion>();
  for (const s of (suscripciones ?? []) as FilaSuscripcion[]) {
    if (s.empresa_id && !porEmpresa.has(s.empresa_id)) porEmpresa.set(s.empresa_id, s);
    if (s.proveedor_id && !porProveedor.has(s.proveedor_id)) porProveedor.set(s.proveedor_id, s);
  }

  const deSuscripcion = (s: FilaSuscripcion | undefined) => ({
    estadoSuscripcion: s?.estado ?? null,
    monto: s ? Number(s.monto) || 0 : 0,
    ciclo: s?.ciclo ?? null,
    metodoPago: s?.metodo_pago ?? null,
    proximoCobro: s?.proximo_cobro_en ?? null,
    graciaHasta: s?.gracia_hasta ?? null,
  });

  const filasEmpresas: FilaSocio[] = (empresas ?? []).map((e) => {
    let logoUrl: string | null = null;
    if (e.bucket_logo && e.ruta_logo) {
      logoUrl = db.storage.from(e.bucket_logo as string).getPublicUrl(e.ruta_logo as string).data.publicUrl;
    }
    return {
      id: e.id as string,
      tipo: "empresa" as const,
      nombre: e.razon_social as string,
      email: (e.email as string | null) ?? null,
      esSociaUiab: Boolean(e.es_socia_uiab),
      creadoEn: e.creado_en as string,
      logoUrl,
      ...deSuscripcion(porEmpresa.get(e.id as string)),
    };
  });

  const filasParticulares: FilaSocio[] = (proveedores ?? []).map((p) => ({
    id: p.id as string,
    tipo: "particular" as const,
    nombre: [p.nombre, p.apellido].filter(Boolean).join(" ") || (p.email as string),
    email: (p.email as string | null) ?? null,
    esSociaUiab: false,
    creadoEn: p.creado_en as string,
    logoUrl: null,
    ...deSuscripcion(porProveedor.get(p.id as string)),
  }));

  return {
    socios: [...filasEmpresas, ...filasParticulares],
    pagos: (pagos ?? []) as unknown as Pago[],
    precios,
  };
}

export default async function AdminSuscripcionesPage() {
  const { socios, pagos, precios } = await getDatos();
  return <PanelSuscripciones socios={socios} pagos={pagos} precios={precios} />;
}
