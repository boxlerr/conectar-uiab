import { createClient } from "@supabase/supabase-js";
import { PanelEmpresas } from "./PanelEmpresas";
import { TARIFA_PRECIO_MENSUAL_FALLBACK } from "@/lib/mercadopago/suscripciones";

async function getEmpresasData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const [empresasRes, tarifasRes] = await Promise.all([
    supabase
      .from("empresas")
      .select(`
        id, razon_social, nombre_comercial, cuit, email, telefono, localidad, provincia, 
        descripcion, estado, motivo_rechazo, tarifa, creado_en, aprobada_en,
        suscripciones(estado, finaliza_en)
      `)
      .order("creado_en", { ascending: false }),
    supabase.from("tarifas_precios").select("nivel, precio_mensual")
  ]);

  if (empresasRes.error) throw new Error(empresasRes.error.message);

  const preciosDb: Record<number, number> = { ...TARIFA_PRECIO_MENSUAL_FALLBACK };
  if (tarifasRes.data) {
    tarifasRes.data.forEach((t) => {
      preciosDb[t.nivel] = Number(t.precio_mensual) || preciosDb[t.nivel];
    });
  }

  // Map to flat object for PanelEmpresas
  const empresas = (empresasRes.data ?? []).map(emp => {
    // Determine subscription status. Because it's a 1-to-many potentially, we check the array.
    // If we only have 1 active, we find it.
    let estadoSuscripcion = null;
    if (emp.suscripciones && Array.isArray(emp.suscripciones) && emp.suscripciones.length > 0) {
      // Find active or pending, or just take the first one
      const activa = emp.suscripciones.find((s: any) => s.estado === 'activa' || s.estado === 'pendiente_pago');
      estadoSuscripcion = activa ? activa.estado : emp.suscripciones[0].estado;
    }

    return {
      ...emp,
      estado_suscripcion: estadoSuscripcion
    };
  });

  return { empresas, preciosDb };
}

export default async function AdminEmpresasPage() {
  const { empresas, preciosDb } = await getEmpresasData();
  return <PanelEmpresas empresas={empresas} preciosDb={preciosDb} />;
}
