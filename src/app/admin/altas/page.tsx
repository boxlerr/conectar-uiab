import { createClient } from "@supabase/supabase-js";
import { PanelAltas } from "./PanelAltas";

export type EstadoCuentaRow = {
  email: string;
  ultimo_ingreso: string | null;
  invitacion_creada: string | null;
  invitacion_expira: string | null;
  invitacion_usada: string | null;
  tutoriales_vistos: Record<string, string | null> | null;
  onboarding_completado_en: string | null;
};

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAltas() {
  const { data, error } = await adminClient()
    .from("altas_socios")
    .select(
      "id, razon_social, nombre_comercial, cuit, actividad, categoria, ya_es_socio, n_socio, referente_nombre, referente_cargo, email, telefono, sitio_web, localidad, direccion, mensaje, estado, empresa_id, creado_en, actualizado_en, conflictos_padron, conflictos_revisados_en"
    )
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getEmpresas() {
  const { data, error } = await adminClient()
    .from("empresas")
    .select("id, razon_social, nombre_comercial, cuit, n_socio, estado")
    .order("razon_social");

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Estado de onboarding (último ingreso, invitación, tutorial) para las altas que
// ya tienen cuenta. Se resuelve por email vía la función estado_cuentas_por_email.
async function getEstadosCuenta(emails: string[]): Promise<Record<string, EstadoCuentaRow>> {
  if (emails.length === 0) return {};
  const { data, error } = await adminClient().rpc("estado_cuentas_por_email", {
    p_emails: emails,
  });
  if (error) {
    console.error("[admin/altas] estado_cuentas_por_email:", error.message);
    return {};
  }
  const mapa: Record<string, EstadoCuentaRow> = {};
  for (const r of (data ?? []) as EstadoCuentaRow[]) {
    if (r.email) mapa[r.email.toLowerCase()] = r;
  }
  return mapa;
}

export default async function AdminAltasPage() {
  const [altas, empresas] = await Promise.all([getAltas(), getEmpresas()]);

  const emailsConCuenta = (altas as { estado: string; email: string | null }[])
    .filter((a) => a.estado === "cuenta_creada" && a.email)
    .map((a) => a.email as string);

  const estados = await getEstadosCuenta(emailsConCuenta);

  return (
    <PanelAltas
      altas={altas as never}
      empresas={empresas as never}
      estados={estados}
    />
  );
}
