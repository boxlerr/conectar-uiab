import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { crearSlug } from "@/lib/utilidades";
import type { Entidad } from "@/lib/datos/directorio";

export interface DatosDirectorio {
  empresas: Entidad[];
  prestadores: Entidad[];
}

/**
 * Trae el directorio completo (empresas socias + prestadores) para renderizar
 * de forma pública, sin requerir sesión. Usa el admin client (service role)
 * para saltear RLS igual que las fichas `/empresas/[slug]`. NO expone datos de
 * contacto sensibles: el teléfono/whatsapp real se resuelve en la ficha según
 * el estado de autenticación.
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
          sitio_web,
          email,
          telefono,
          bucket_logo,
          ruta_logo,
          n_socio,
          empresas_categorias (
            categorias (
              nombre
            )
          )
        `)
        .eq("estado", "aprobada"),
      supabase
        .from("proveedores")
        .select(
          "id, nombre, apellido, nombre_comercial, tipo_proveedor, email, telefono, localidad, provincia, descripcion, bucket_logo, ruta_logo"
        )
        .eq("estado", "aprobado"),
      supabase
        .from("resenas")
        .select("empresa_resenada_id, calificacion")
        .eq("estado", "aprobada")
        .not("empresa_resenada_id", "is", null),
    ]);

  const empresas: Entidad[] = (empresasRes.data || []).map((emp: any) => {
    const cats =
      emp.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
    const mainCat = cats.length > 0 ? cats[0] : "Industrial General";
    const logoUrl =
      emp.bucket_logo && emp.ruta_logo
        ? supabase.storage
            .from(emp.bucket_logo)
            .getPublicUrl(emp.ruta_logo).data.publicUrl
        : null;

    return {
      id: emp.id,
      tipo: "empresa",
      slug: crearSlug(emp.razon_social),
      nombre: emp.razon_social,
      categoria: mainCat,
      descripcionCorta: emp.actividad || "Sin descripción",
      descripcionLarga: emp.actividad || "",
      logo: emp.razon_social.charAt(0).toUpperCase(),
      logoUrl,
      ubicacion: `${emp.localidad || ""}, ${emp.direccion || ""}`.replace(
        /^, | ,|, $/g,
        ""
      ),
      servicios: cats.slice(1),
      rating: 0,
      reviews: 0,
      esSocio: true,
      contacto: {
        email: emp.email || "",
        telefono: emp.telefono || "",
        sitioWeb: emp.sitio_web || "",
      },
    };
  });

  const prestadores: Entidad[] = (proveedoresRes.data || []).map((p: any) => {
    const displayName =
      p.nombre_comercial ||
      [p.nombre, p.apellido].filter(Boolean).join(" ") ||
      "Sin nombre";
    const categoria = p.tipo_proveedor || "Prestador de servicios";
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
  // Solo las empresas se califican; los prestadores no reciben reseñas.
  aplicarResenas(empresas, resenasEmpRes.data, "empresa_resenada_id");

  return { empresas, prestadores };
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
