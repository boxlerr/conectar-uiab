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

  // ¿Quién tiene gente adentro y quién es sólo una ficha del padrón?
  //
  // Las 58 empresas "aprobadas" no son 58 altas: 50 se importaron del padrón el
  // 12-abr y están publicadas para que el directorio no naciera vacío, pero
  // NADIE de esas empresas tiene todavía una cuenta. Mirando el panel no había
  // forma de distinguirlas, y "Aprobadas (58)" se leía como si fueran 58
  // empresas dadas de alta. Con esto cada fila dice si tiene acceso o no.
  const [miembrosRes, altasRes] = await Promise.all([
    supabase.from("miembros_empresa").select("empresa_id, perfil_id"),
    supabase.from("altas_socios").select("empresa_id").not("empresa_id", "is", null),
  ]);

  const usuariosPorEmpresa = new Map<string, number>();
  (miembrosRes.data ?? []).forEach((m: any) => {
    usuariosPorEmpresa.set(m.empresa_id, (usuariosPorEmpresa.get(m.empresa_id) ?? 0) + 1);
  });
  const conAlta = new Set((altasRes.data ?? []).map((a: any) => a.empresa_id as string));

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
      estado_suscripcion: estadoSuscripcion,
      usuarios: usuariosPorEmpresa.get(emp.id) ?? 0,
      vino_por_alta: conAlta.has(emp.id),
    };
  });

  return { empresas };
}

export default async function AdminEmpresasPage() {
  const { empresas } = await getEmpresasData();
  return <PanelEmpresas empresas={empresas} />;
}
