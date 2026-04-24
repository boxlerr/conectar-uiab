import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { crearSlug } from "@/lib/utilidades";

const BASE_URL = "https://www.uiabconecta.com";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = adminClient();

  const [{ data: empresas }, { data: proveedores }, { data: oportunidades }] =
    await Promise.all([
      supabase
        .from("empresas")
        .select("razon_social, actualizado_en")
        .eq("estado", "aprobada"),
      supabase
        .from("proveedores")
        .select("razon_social, actualizado_en")
        .eq("estado", "aprobado"),
      supabase
        .from("oportunidades")
        .select("id, creado_en")
        .eq("estado", "abierta"),
    ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/directorio`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/empresas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/proveedores`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/oportunidades`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/instituciones-bancarias`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/instituciones-educativas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const empresaRoutes: MetadataRoute.Sitemap = (empresas ?? []).map((e) => ({
    url: `${BASE_URL}/empresas/${crearSlug(e.razon_social)}`,
    lastModified: e.actualizado_en ? new Date(e.actualizado_en) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const proveedorRoutes: MetadataRoute.Sitemap = (proveedores ?? []).map((p) => ({
    url: `${BASE_URL}/proveedores/${crearSlug(p.razon_social)}`,
    lastModified: p.actualizado_en ? new Date(p.actualizado_en) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const oportunidadRoutes: MetadataRoute.Sitemap = (oportunidades ?? []).map((o) => ({
    url: `${BASE_URL}/oportunidades/${o.id}`,
    lastModified: o.creado_en ? new Date(o.creado_en) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...empresaRoutes, ...proveedorRoutes, ...oportunidadRoutes];
}
