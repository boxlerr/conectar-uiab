import type { CertificacionChip } from "@/modulos/certificaciones/normas";
import type { TipoEntidad } from "@/lib/datos/tipos-entidad";

export interface Entidad {
  id: string;
  tipo: "empresa" | "proveedor";
  /**
   * Tipo de organización para el directorio unificado (empresa, financiera,
   * educativa, cooperativa, prestador). Opcional: las landings por categoría
   * arman entidades sin él y ahí no hay lista mezclada que desambiguar.
   */
  tipoEntidad?: TipoEntidad;
  slug: string;
  nombre: string;
  categoria: string;
  /**
   * Slugs de TODAS las categorías de la entidad, no sólo el nombre de la
   * principal. Los necesitan las landings de rubro (src/lib/datos/rubros-seo.ts)
   * para resolver la pertenencia sin depender de comparar nombres, que en este
   * catálogo vienen fragmentados ('Informática' vs 'Informática, Sistemas y
   * Soporte IT' vs 'Desarrollo de Software Industrial' son la misma cosa).
   */
  categoriaSlugs?: string[];
  descripcionCorta: string;
  descripcionLarga: string;
  logo: string;
  logoUrl?: string | null;
  ubicacion: string;
  servicios: string[];
  tags: string[];
  certificaciones?: CertificacionChip[];
  destacado?: boolean;
  rating?: number;
  reviews?: number;
  esSocio?: boolean;
  contacto: {
    email: string;
    telefono: string;
    whatsapp?: string;
    sitioWeb: string;
  };
}

/*
  ACÁ VIVÍAN LAS EMPRESAS INVENTADAS.

  Este archivo tenía un array `entidades` con razones sociales que no existen
  ("MetalTech Industrial SA", "QuímicaPro Solutions", "MaquinariasPrecision"),
  con rating, reseñas, teléfonos y sitios web inventados, más helpers
  (`getEmpresas`, `getProveedores`, `getSectoresConRecuento`) que las servían.
  No era código muerto: `landing-empresas-publica.tsx` renderizaba las tres
  primeras en la vista previa pública de /empresas, así que el sitio de una
  cámara empresaria publicaba empresas ficticias y se las servía a Google en el
  HTML. `getSectoresConRecuento` remataba con un comentario que decía
  "Adding artificial numbers to match the impressive Figma demo numbers".

  Los datos reales salen de `obtenerDirectorio()` (src/app/directorio/datos.ts),
  que consulta Supabase. De este archivo sobrevive únicamente el tipo `Entidad`,
  que sí se usa en todo el proyecto.

  Si alguna vez hace falta una vista previa "de muestra", va con socias reales
  resueltas en el servidor — no con un array a mano, que envejece mal por
  definición y termina siendo publicado.
*/
