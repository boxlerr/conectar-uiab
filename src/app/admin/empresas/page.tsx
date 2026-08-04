import { createClient } from "@supabase/supabase-js";
import { PanelEmpresas } from "./PanelEmpresas";

async function getEmpresasData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Ya no se consulta `tarifas_precios`: desde el modelo de precio único
  // (jul-2026) los tres niveles valen lo mismo, así que el panel no asigna
  // tarifas. Lo que sí importa es `es_socia_uiab`, que decide si corresponde
  // exigir la suscripción para aprobar.
  const empresasRes = await supabase
    .from("empresas")
    .select(`
      id, razon_social, nombre_comercial, cuit, email, telefono, localidad, provincia,
      descripcion, estado, motivo_rechazo, es_socia_uiab, creado_en, aprobada_en,
      suscripciones(estado, finaliza_en)
    `)
    .order("creado_en", { ascending: false });

  if (empresasRes.error) throw new Error(empresasRes.error.message);

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

  return { empresas };
}

export default async function AdminEmpresasPage() {
  const { empresas } = await getEmpresasData();
  return <PanelEmpresas empresas={empresas} />;
}
