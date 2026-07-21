import { createClient } from "@supabase/supabase-js";
import { PanelCertificaciones, type CertificacionAdmin } from "./PanelCertificaciones";

async function getCertificaciones(): Promise<CertificacionAdmin[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("certificaciones")
    .select(`
      id, codigo_norma, nombre_libre, alcance, organismo_certificador,
      numero_certificado, fecha_emision, fecha_vencimiento,
      bucket, ruta_archivo, verificada, verificada_en, creado_en,
      empresa:empresas!empresa_id(razon_social),
      proveedor:proveedores!proveedor_id(nombre, apellido, nombre_comercial)
    `)
    .order("verificada", { ascending: true })
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  const filas = (data ?? []) as any[];

  // Signed URLs en lote (una sola llamada) para las que tienen archivo adjunto.
  const rutas = filas
    .filter((f) => f.bucket === "documentos-privados" && f.ruta_archivo)
    .map((f) => f.ruta_archivo as string);

  const urlPorRuta = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: signed } = await supabase.storage
      .from("documentos-privados")
      .createSignedUrls(rutas, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlPorRuta.set(s.path, s.signedUrl);
    }
  }

  return filas.map((f) => ({
    id: f.id,
    codigo_norma: f.codigo_norma,
    nombre_libre: f.nombre_libre,
    alcance: f.alcance,
    organismo_certificador: f.organismo_certificador,
    numero_certificado: f.numero_certificado,
    fecha_vencimiento: f.fecha_vencimiento,
    verificada: f.verificada,
    creado_en: f.creado_en,
    entidad:
      f.empresa?.razon_social ??
      f.proveedor?.nombre_comercial ??
      [f.proveedor?.nombre, f.proveedor?.apellido].filter(Boolean).join(" ") ??
      "—",
    archivoUrl: f.ruta_archivo ? urlPorRuta.get(f.ruta_archivo) ?? null : null,
  }));
}

export default async function AdminCertificacionesPage() {
  const certificaciones = await getCertificaciones();
  return <PanelCertificaciones certificaciones={certificaciones} />;
}
