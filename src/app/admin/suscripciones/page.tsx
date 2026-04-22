import { createClient } from "@supabase/supabase-js";
import { PanelSuscripciones } from "./PanelSuscripciones";

async function getSuscripciones() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: empresas, error: errEmpresas },
    { data: proveedores, error: errProveedores },
    { data: pagos, error: errPagos },
    { data: tarifas, error: errTarifas },
    { data: susParticulares },
  ] = await Promise.all([
    supabase
      .from("empresas")
      .select("id, razon_social, email, estado, tarifa, cantidad_empleados, tarifa_vigente_hasta, creado_en, bucket_logo, ruta_logo")
      .eq("estado", "aprobada")
      .order("tarifa", { ascending: true, nullsFirst: false }),
    supabase
      .from("proveedores")
      .select("id, nombre, apellido, email, estado, creado_en")
      .eq("estado", "aprobado")
      .order("creado_en", { ascending: false }),
    supabase
      .from("pagos_suscripciones")
      .select("id, empresa_id, proveedor_id, monto, moneda, estado, pagado_en, creado_en")
      .order("pagado_en", { ascending: false, nullsFirst: false })
      .limit(500),
    supabase
      .from("tarifas_precios")
      .select("nivel, precio_mensual, vigente_desde, vigente_hasta, actualizado_en")
      .order("nivel", { ascending: true }),
    supabase
      .from("suscripciones")
      .select("id, proveedor_id, estado, monto, metodo_pago, proximo_cobro_en")
      .not("proveedor_id", "is", null)
      .order("creado_en", { ascending: false }),
  ]);

  if (errEmpresas) throw new Error(errEmpresas.message);
  if (errProveedores) throw new Error(errProveedores.message);
  if (errPagos) throw new Error(errPagos.message);
  if (errTarifas) throw new Error(errTarifas.message);

  // Map: proveedor_id → most recent suscripcion
  const susPorProveedor: Record<string, any> = {};
  for (const s of susParticulares ?? []) {
    if (s.proveedor_id && !susPorProveedor[s.proveedor_id]) {
      susPorProveedor[s.proveedor_id] = s;
    }
  }

  const empresasConLogo = (empresas ?? []).map((e: any) => {
    let logo_url: string | null = null;
    if (e.bucket_logo && e.ruta_logo) {
      logo_url = supabase.storage.from(e.bucket_logo).getPublicUrl(e.ruta_logo).data.publicUrl;
    }
    return { ...e, logo_url };
  });

  const proveedoresConSus = (proveedores ?? []).map((p: any) => ({
    ...p,
    suscripcion: susPorProveedor[p.id] ?? null,
  }));

  return {
    empresas: empresasConLogo,
    proveedores: proveedoresConSus,
    pagos: pagos ?? [],
    tarifas: tarifas ?? [],
  };
}

export default async function AdminSuscripcionesPage() {
  const data = await getSuscripciones();
  return <PanelSuscripciones {...(data as any)} />;
}
