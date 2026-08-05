import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Sirve el certificado de una norma para la ficha pública.
 *
 * El archivo vive en `documentos-privados`, así que un visitante anónimo no
 * puede leerlo directo del bucket: acá se firma una URL corta con el
 * service_role y se redirige. Firmar en cada pedido —en vez de meter la URL
 * firmada en el HTML— evita que el enlace se venza cuando la página queda
 * cacheada.
 *
 * Por qué es público: la UIAB no verifica ni audita certificaciones (así lo
 * dice el pie de la sección). El PDF está para que quien mire la ficha pueda
 * ver el respaldo de lo que la empresa declara; la responsabilidad por lo que
 * publica es de la empresa. Antes el adjunto no se mostraba en ningún lado y
 * tampoco había pantalla para verificarlo, así que no servía para nada.
 *
 * Sí se filtra por estado: sólo se entrega el archivo si la ficha dueña está
 * publicada. Una empresa pendiente o rechazada no expone sus documentos.
 */

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Certificación no válida" }, { status: 400 });
  }

  const db = adminClient();

  const { data: cert } = await db
    .from("certificaciones")
    .select("bucket, ruta_archivo, empresa_id, proveedor_id")
    .eq("id", id)
    .maybeSingle();

  if (!cert?.ruta_archivo || !cert?.bucket) {
    return NextResponse.json({ error: "Esta certificación no tiene archivo" }, { status: 404 });
  }

  // La ficha dueña tiene que estar publicada.
  const publicada = await (async () => {
    if (cert.empresa_id) {
      const { data } = await db
        .from("empresas")
        .select("estado")
        .eq("id", cert.empresa_id)
        .maybeSingle();
      return data?.estado === "aprobada";
    }
    if (cert.proveedor_id) {
      const { data } = await db
        .from("proveedores")
        .select("estado")
        .eq("id", cert.proveedor_id)
        .maybeSingle();
      return data?.estado === "aprobado";
    }
    return false;
  })();

  if (!publicada) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const { data: firmada, error } = await db.storage
    .from(cert.bucket)
    .createSignedUrl(cert.ruta_archivo, 300);

  if (error || !firmada?.signedUrl) {
    console.error("[certificaciones/archivo] no se pudo firmar:", error?.message);
    return NextResponse.json({ error: "No pudimos abrir el certificado" }, { status: 502 });
  }

  return NextResponse.redirect(firmada.signedUrl);
}
