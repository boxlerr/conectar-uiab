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
    .select(
      "id, razon_social, nombre_comercial, cuit, n_socio, estado, email, telefono, whatsapp, " +
      "sitio_web, direccion, localidad, provincia, descripcion, actividad, ruta_logo, " +
      "ruta_portada, referente, email_compras, email_mantenimiento, cantidad_empleados, codigo_postal"
    )
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

/**
 * El padrón de la UIAB con el estado de cada socia.
 *
 * Esta pantalla mostraba sólo las filas de `altas_socios`: las que completaron
 * el formulario. Pero las socias que TODAVÍA NO HICIERON NADA —hoy 40 de 59— no
 * están en esa tabla, así que no aparecían en ninguna pantalla de trabajo del
 * panel. Se veía "0 pendientes / todo al día" mientras dos tercios del padrón
 * estaba afuera.
 *
 * Acá se arma la lista completa: una fila por cada ficha del directorio, con su
 * solicitud enganchada si la hay, más las solicitudes que no matchean ninguna
 * ficha (una empresa que se anotó por /sumate y todavía no tiene ficha propia).
 */
export type SituacionSocia = "adentro" | "esperando" | "sin_novedades";

export type FilaPadron = {
  clave: string;
  empresaId: string | null;
  altaId: string | null;
  nombre: string;
  cuit: string | null;
  localidad: string | null;
  email: string | null;
  telefono: string | null;
  esSocia: boolean;
  usuarios: number;
  situacion: SituacionSocia;
  /** Cómo llegó: por /sumate, por /register, o todavía por ningún lado. */
  origen: string | null;
};

async function getPadron(
  altas: Record<string, unknown>[]
): Promise<FilaPadron[]> {
  const db = adminClient();
  const [fichasRes, miembrosRes] = await Promise.all([
    db
      .from("empresas")
      .select("id, razon_social, nombre_comercial, cuit, email, telefono, localidad, estado, es_socia_uiab")
      .neq("estado", "rechazada")
      .order("razon_social"),
    db.from("miembros_empresa").select("empresa_id"),
  ]);

  const usuariosPor = new Map<string, number>();
  for (const m of (miembrosRes.data ?? []) as { empresa_id: string }[]) {
    usuariosPor.set(m.empresa_id, (usuariosPor.get(m.empresa_id) ?? 0) + 1);
  }

  // La solicitud más reciente de cada ficha, para colgarla de su fila.
  const altaPorEmpresa = new Map<string, Record<string, unknown>>();
  for (const a of altas) {
    const eid = a.empresa_id as string | null;
    if (eid && !altaPorEmpresa.has(eid)) altaPorEmpresa.set(eid, a);
  }

  type Ficha = {
    id: string; razon_social: string; nombre_comercial: string | null;
    cuit: string | null; email: string | null; telefono: string | null;
    localidad: string | null; estado: string; es_socia_uiab: boolean | null;
  };

  const filas: FilaPadron[] = ((fichasRes.data ?? []) as unknown as Ficha[]).map((f) => {
    const usuarios = usuariosPor.get(f.id) ?? 0;
    const alta = altaPorEmpresa.get(f.id);
    const abierta = alta && ["pendiente", "contactado"].includes(alta.estado as string);
    return {
      clave: `emp-${f.id}`,
      empresaId: f.id,
      altaId: (alta?.id as string) ?? null,
      nombre: f.nombre_comercial || f.razon_social,
      cuit: f.cuit,
      localidad: f.localidad,
      // El correo de la solicitud es más fresco que el del padrón importado.
      email: (alta?.email as string) ?? f.email,
      telefono: (alta?.telefono as string) ?? f.telefono,
      esSocia: Boolean(f.es_socia_uiab),
      usuarios,
      situacion: usuarios > 0 ? "adentro" : abierta ? "esperando" : "sin_novedades",
      origen: (alta?.origen as string) ?? null,
    };
  });

  // Solicitudes sueltas: se anotaron pero todavía no hay ficha a la cual colgarlas.
  const vinculadas = new Set(filas.map((f) => f.altaId).filter(Boolean));
  for (const a of altas) {
    if (a.empresa_id || vinculadas.has(a.id as string)) continue;
    if (!["pendiente", "contactado"].includes(a.estado as string)) continue;
    filas.push({
      clave: `alta-${a.id}`,
      empresaId: null,
      altaId: a.id as string,
      nombre: (a.nombre_comercial as string) || (a.razon_social as string),
      cuit: (a.cuit as string) ?? null,
      localidad: (a.localidad as string) ?? null,
      email: (a.email as string) ?? null,
      telefono: (a.telefono as string) ?? null,
      esSocia: Boolean(a.ya_es_socio),
      usuarios: 0,
      situacion: "esperando",
      origen: (a.origen as string) ?? null,
    });
  }

  return filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export default async function AdminAltasPage() {
  const [altas, empresas] = await Promise.all([getAltas(), getEmpresas()]);
  const padron = await getPadron(altas as unknown as Record<string, unknown>[]);

  const emailsConCuenta = (altas as { estado: string; email: string | null }[])
    .filter((a) => a.estado === "cuenta_creada" && a.email)
    .map((a) => a.email as string);

  const estados = await getEstadosCuenta(emailsConCuenta);

  return (
    <PanelAltas
      altas={altas as never}
      empresas={empresas as never}
      estados={estados}
      padron={padron}
    />
  );
}
