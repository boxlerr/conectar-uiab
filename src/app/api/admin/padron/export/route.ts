import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigirAdmin } from "@/lib/autenticacion/exigir-admin";
import {
  armarPlanilla,
  type ColumnaPlanilla,
  type ValorCelda,
} from "@/lib/excel/planilla-profesional";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/padron/export
 *
 * Baja el padrón entero en un Excel listo para trabajar: una fila por ficha con
 * todos sus datos de contacto, y la distinción que pidió la UIAB — quién ya
 * entró a la plataforma y quién no— para poder ir llamando a los que faltan.
 *
 * Tres hojas:
 *   1. Padrón completo — todas, con la fila de las que faltan resaltada.
 *   2. Para contactar — sólo las que todavía no tienen a nadie adentro.
 *   3. Ya adentro — las que sí, con cuánta gente tienen y cuándo entraron.
 */

const AMARILLO_FALTA = "FFFFF7E6";

function fechaAR(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function siNo(v: unknown): string {
  return v ? "Sí" : "No";
}

type Ficha = {
  id: string;
  razon_social: string | null;
  nombre_comercial: string | null;
  cuit: string | null;
  n_socio: string | null;
  es_socia_uiab: boolean | null;
  estado: string | null;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  sitio_web: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  referente: string | null;
  email_compras: string | null;
  email_mantenimiento: string | null;
  cantidad_empleados: number | null;
  descripcion: string | null;
  actividad: string | null;
  creado_en: string | null;
};

export async function GET() {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) {
    return NextResponse.json({ error: "Solo para administradores" }, { status: 403 });
  }

  const db = createAdminClient();

  const [{ data: fichas, error }, { data: miembros }, { data: rubros }] = await Promise.all([
    db
      .from("empresas")
      .select(
        "id, razon_social, nombre_comercial, cuit, n_socio, es_socia_uiab, estado, email, telefono, " +
          "whatsapp, sitio_web, direccion, localidad, provincia, codigo_postal, referente, " +
          "email_compras, email_mantenimiento, cantidad_empleados, descripcion, actividad, creado_en"
      )
      .neq("estado", "rechazada")
      .order("razon_social"),
    db.from("miembros_empresa").select("empresa_id"),
    db.from("empresas_categorias").select("empresa_id, categorias(nombre)"),
  ]);

  if (error) {
    console.error("[padron/export]", error.message);
    return NextResponse.json({ error: "No se pudo leer el padrón" }, { status: 500 });
  }

  const usuariosPor = new Map<string, number>();
  for (const m of (miembros ?? []) as { empresa_id: string }[]) {
    usuariosPor.set(m.empresa_id, (usuariosPor.get(m.empresa_id) ?? 0) + 1);
  }

  const rubrosPor = new Map<string, string[]>();
  for (const r of (rubros ?? []) as unknown as {
    empresa_id: string;
    categorias: { nombre: string } | null;
  }[]) {
    if (!r.categorias?.nombre) continue;
    const lista = rubrosPor.get(r.empresa_id) ?? [];
    lista.push(r.categorias.nombre);
    rubrosPor.set(r.empresa_id, lista);
  }

  const columnas: ColumnaPlanilla[] = [
    { header: "Razón social", width: 34, align: "l" },
    { header: "Nombre comercial", width: 26, align: "l" },
    { header: "En la plataforma", width: 15, align: "c" },
    { header: "Usuarios", width: 10, align: "c", numFmt: "#,##0" },
    { header: "Socia UIAB", width: 11, align: "c" },
    { header: "N° socio", width: 10, align: "c" },
    { header: "CUIT", width: 15, align: "l" },
    { header: "Email", width: 30, align: "l" },
    { header: "Teléfono", width: 17, align: "l" },
    { header: "WhatsApp", width: 17, align: "l" },
    { header: "Referente", width: 22, align: "l" },
    { header: "Email de compras", width: 28, align: "l" },
    { header: "Email de mantenimiento", width: 28, align: "l" },
    { header: "Rubros", width: 34, align: "l" },
    { header: "Dirección", width: 30, align: "l" },
    { header: "Localidad", width: 20, align: "l" },
    { header: "Provincia", width: 18, align: "l" },
    { header: "CP", width: 8, align: "c" },
    { header: "Sitio web", width: 28, align: "l" },
    { header: "Empleados", width: 11, align: "c", numFmt: "#,##0" },
    { header: "Estado de la ficha", width: 16, align: "c" },
    { header: "Actividad", width: 50, align: "l" },
    { header: "Alta en el sistema", width: 15, align: "c" },
  ];

  const lista = (fichas ?? []) as unknown as Ficha[];

  const filaDe = (f: Ficha): ValorCelda[] => {
    const usuarios = usuariosPor.get(f.id) ?? 0;
    return [
      f.razon_social ?? "",
      f.nombre_comercial ?? "",
      siNo(usuarios > 0),
      usuarios,
      siNo(f.es_socia_uiab),
      f.n_socio ?? "",
      f.cuit ?? "",
      f.email ?? "",
      f.telefono ?? "",
      f.whatsapp ?? "",
      f.referente ?? "",
      f.email_compras ?? "",
      f.email_mantenimiento ?? "",
      (rubrosPor.get(f.id) ?? []).join(" · "),
      f.direccion ?? "",
      f.localidad ?? "",
      f.provincia ?? "",
      f.codigo_postal ?? "",
      f.sitio_web ?? "",
      f.cantidad_empleados ?? null,
      f.estado ?? "",
      f.descripcion || f.actividad || "",
      fechaAR(f.creado_en),
    ];
  };

  const adentro = lista.filter((f) => (usuariosPor.get(f.id) ?? 0) > 0);
  const afuera = lista.filter((f) => (usuariosPor.get(f.id) ?? 0) === 0);
  const sinContacto = afuera.filter((f) => !f.email && !f.telefono && !f.whatsapp);

  const generado = new Date().toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });
  const fuente = `Generado el ${generado} desde UIAB Conecta`;

  const totales: ValorCelda[] = [
    "TOTALES",
    "",
    `${adentro.length} de ${lista.length}`,
    Array.from(usuariosPor.values()).reduce((a, b) => a + b, 0),
    `${lista.filter((f) => f.es_socia_uiab).length} socias`,
    ...Array(columnas.length - 5).fill(""),
  ];

  const buffer = await armarPlanilla([
    {
      name: "Padrón completo",
      opts: {
        title: "Padrón de empresas · UIAB Conecta",
        subtitle:
          `${lista.length} fichas · ${adentro.length} ya usan la plataforma · ` +
          `${afuera.length} todavía no`,
        fuente,
        columns: columnas,
        rows: lista.map(filaDe),
        totals: totales,
        // Las que faltan quedan pintadas: es la lista de llamados.
        resaltar: (valores) => (valores[2] === "No" ? AMARILLO_FALTA : null),
      },
    },
    {
      name: "Para contactar",
      opts: {
        title: "Empresas que todavía no entraron",
        subtitle:
          `${afuera.length} fichas sin ningún usuario en la plataforma` +
          (sinContacto.length ? ` · ${sinContacto.length} sin correo ni teléfono` : ""),
        fuente,
        columns: columnas,
        rows: afuera.map(filaDe),
      },
    },
    {
      name: "Ya adentro",
      opts: {
        title: "Empresas con cuenta activa",
        subtitle: `${adentro.length} fichas con al menos un usuario`,
        fuente,
        columns: columnas,
        rows: adentro.map(filaDe),
      },
    },
  ]);

  const hoy = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="padron-uiab-${hoy}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
