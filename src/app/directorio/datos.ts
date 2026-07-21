import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { crearSlug } from "@/lib/utilidades";
import type { Entidad } from "@/lib/datos/directorio";

/** Fila de empresas_tags / proveedores_tags con la tag embebida. */
type FilaTag = { tags?: { nombre?: string; administrado_por_admin?: boolean } | null };

export interface DatosDirectorio {
  empresas: Entidad[];
  prestadores: Entidad[];
  financieras: Entidad[];
  educativas: Entidad[];
  cooperativas: Entidad[];
}

// Defaults por tipo de socia (columna empresas.categoria_socio). Las empresas
// industriales (null o 'proveedores_servicios_productos') conservan el default
// histórico.
const DESCRIPCION_DEFAULT_POR_TIPO: Record<string, string> = {
  instituciones_bancarias: "Entidad financiera de la red UIAB",
  instituciones_educativas: "Entidad educativa de la red UIAB",
  cooperativas: "Cooperativa de la red UIAB",
};

const CATEGORIA_DEFAULT_POR_TIPO: Record<string, string> = {
  instituciones_bancarias: "Entidad financiera",
  instituciones_educativas: "Entidad educativa",
  cooperativas: "Cooperativa",
};

/**
 * Trae el directorio completo (empresas socias + prestadores) para renderizar
 * de forma pública, sin requerir sesión. Usa el admin client (service role)
 * para saltear RLS igual que las fichas `/empresas/[slug]`. NO expone datos de
 * contacto sensibles: el teléfono/whatsapp real se resuelve en la ficha según
 * el estado de autenticación.
 *
 * Las empresas aprobadas se parten en cuatro listas según `categoria_socio`:
 * empresas industriales, entidades financieras, entidades educativas y
 * cooperativas. Los prestadores (tabla `proveedores`) van aparte.
 */
export async function obtenerDirectorio(): Promise<DatosDirectorio> {
  const supabase = createAdminClient();

  const [empresasRes, proveedoresRes, resenasEmpRes] =
    await Promise.all([
      supabase
        .from("empresas")
        .select(`
          id,
          razon_social,
          direccion,
          localidad,
          actividad,
          descripcion,
          sitio_web,
          email,
          telefono,
          bucket_logo,
          ruta_logo,
          n_socio,
          categoria_socio,
          empresas_categorias (
            categorias (
              nombre
            )
          ),
          empresas_tags (
            tags (
              nombre,
              administrado_por_admin
            )
          )
        `)
        .eq("estado", "aprobada"),
      supabase
        .from("proveedores")
        .select(
          "id, nombre, apellido, nombre_comercial, tipo_proveedor, email, telefono, localidad, provincia, descripcion, bucket_logo, ruta_logo, proveedores_tags ( tags ( nombre, administrado_por_admin ) )"
        )
        .eq("estado", "aprobado"),
      supabase
        .from("resenas")
        .select("empresa_resenada_id, calificacion")
        .eq("estado", "aprobada")
        .not("empresa_resenada_id", "is", null),
    ]);

  const empresasConTipo = (empresasRes.data || []).map((emp: any) => {
    const categoriaSocio: string | null = emp.categoria_socio || null;
    const cats =
      emp.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
    const tags: string[] = Array.from(
      new Set(
        // Sólo etiquetas del catálogo curado: el buscador global matchea contra
        // este array, y dejar pasar las propias convierte cualquier invención en
        // un atajo para aparecer en las búsquedas de los demás.
        (emp.empresas_tags || [])
          .filter((et: FilaTag) => et.tags?.administrado_por_admin)
          .map((et: any) => et.tags?.nombre)
          .filter((n: any): n is string => Boolean(n))
      )
    );
    const mainCat =
      cats.length > 0
        ? cats[0]
        : CATEGORIA_DEFAULT_POR_TIPO[categoriaSocio ?? ""] ||
          "Industrial General";
    const logoUrl =
      emp.bucket_logo && emp.ruta_logo
        ? supabase.storage
            .from(emp.bucket_logo)
            .getPublicUrl(emp.ruta_logo).data.publicUrl
        : null;

    const entidad: Entidad = {
      id: emp.id,
      tipo: "empresa",
      slug: crearSlug(emp.razon_social),
      nombre: emp.razon_social,
      categoria: mainCat,
      // Lo que escribió la socia manda sobre el rubro que trajo el padrón.
      descripcionCorta:
        emp.descripcion ||
        emp.actividad ||
        DESCRIPCION_DEFAULT_POR_TIPO[categoriaSocio ?? ""] ||
        "Sin descripción",
      descripcionLarga: emp.descripcion || emp.actividad || "",
      logo: emp.razon_social.charAt(0).toUpperCase(),
      logoUrl,
      ubicacion: `${emp.localidad || ""}, ${emp.direccion || ""}`.replace(
        /^, | ,|, $/g,
        ""
      ),
      servicios: cats.slice(1),
      tags,
      rating: 0,
      reviews: 0,
      esSocio: true,
      contacto: {
        email: emp.email || "",
        telefono: emp.telefono || "",
        sitioWeb: emp.sitio_web || "",
      },
    };

    return { categoriaSocio, entidad };
  });

  const prestadores: Entidad[] = (proveedoresRes.data || []).map((p: any) => {
    const displayName =
      p.nombre_comercial ||
      [p.nombre, p.apellido].filter(Boolean).join(" ") ||
      "Sin nombre";
    const categoria = p.tipo_proveedor || "Prestador de servicios";
    const tags: string[] = Array.from(
      new Set(
        (p.proveedores_tags || [])
          .filter((pt: FilaTag) => pt.tags?.administrado_por_admin)
          .map((pt: any) => pt.tags?.nombre)
          .filter((n: any): n is string => Boolean(n))
      )
    );
    const logoUrl =
      p.bucket_logo && p.ruta_logo
        ? supabase.storage
            .from(p.bucket_logo)
            .getPublicUrl(p.ruta_logo).data.publicUrl
        : null;

    return {
      id: p.id,
      tipo: "proveedor",
      slug: crearSlug(displayName),
      nombre: displayName,
      categoria,
      descripcionCorta: p.descripcion || "Prestador de servicios particular",
      descripcionLarga: p.descripcion || "",
      logo: displayName.charAt(0).toUpperCase(),
      logoUrl,
      ubicacion: [p.localidad, p.provincia].filter(Boolean).join(", "),
      servicios: [],
      tags,
      rating: 0,
      reviews: 0,
      esSocio: false,
      contacto: {
        email: p.email || "",
        telefono: p.telefono || "",
        sitioWeb: "",
      },
    };
  });

  // Agregación de reseñas aprobadas → rating promedio + cantidad.
  // Se aplica sobre TODAS las empresas (de cualquier categoría de socia)
  // antes de partir en listas; los prestadores no reciben reseñas.
  const todasLasEmpresas = empresasConTipo.map((e) => e.entidad);
  aplicarResenas(todasLasEmpresas, resenasEmpRes.data, "empresa_resenada_id");

  const empresas: Entidad[] = [];
  const financieras: Entidad[] = [];
  const educativas: Entidad[] = [];
  const cooperativas: Entidad[] = [];

  for (const { categoriaSocio, entidad } of empresasConTipo) {
    switch (categoriaSocio) {
      case "instituciones_bancarias":
        financieras.push(entidad);
        break;
      case "instituciones_educativas":
        educativas.push(entidad);
        break;
      case "cooperativas":
        cooperativas.push(entidad);
        break;
      default:
        // null o 'proveedores_servicios_productos' → empresa socia industrial
        empresas.push(entidad);
    }
  }

  return { empresas, prestadores, financieras, educativas, cooperativas };
}

function aplicarResenas(
  entidades: Entidad[],
  resenas: any[] | null,
  claveId: "empresa_resenada_id" | "proveedor_resenado_id"
) {
  if (!resenas) return;
  for (const ent of entidades) {
    const propias = resenas.filter((r: any) => r[claveId] === ent.id);
    if (propias.length > 0) {
      ent.reviews = propias.length;
      ent.rating = Number(
        (
          propias.reduce((acc: number, r: any) => acc + r.calificacion, 0) /
          propias.length
        ).toFixed(1)
      );
    }
  }
}
