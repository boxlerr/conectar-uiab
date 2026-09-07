import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearSlug, nombreDeFichaParticular } from "@/lib/utilidades";

/**
 * URL permanente de una ficha: `/e/{id}` → 308 a `/empresas/{slug}`.
 *
 * POR QUÉ EXISTE
 *
 * El slug NO se guarda en la base: sale de `crearSlug(razon_social)` en cada
 * render (ver `src/lib/utilidades.ts`). O sea que renombrar una empresa le
 * cambia la URL y la vieja empieza a dar 404 — ya pasó con Velargen → Tecza, y
 * por eso `next.config.ts` tiene un redirect escrito a mano por cada rename.
 *
 * Eso se banca mientras los enlaces son nuestros. Deja de bancarse en cuanto le
 * repartimos a las ~52 socias con web propia la URL de su ficha para que la
 * peguen en su sitio: cada rename posterior rompería un backlink alojado en un
 * dominio ajeno, que nadie va a poder editar y que además es justo lo que este
 * proyecto necesita acumular (ver el sello de `public/sello-uiab-conecta.svg`).
 *
 * El `id` sí es estable, así que ésta es la URL que se reparte afuera. El 308
 * transfiere el ranking al slug vigente y sobrevive a cualquier rename.
 *
 * NO va en el sitemap ni se enlaza desde el sitio: no es una página, es un
 * puntero. Y no lleva `noindex` a propósito — un `noindex` sobre un redirect es
 * una señal contradictoria; Google sigue el 308 e indexa el destino, que es
 * exactamente lo que queremos.
 *
 * La alternativa era persistir el slug en una columna con índice único. Sigue
 * siendo la solución más prolija y no la descarta: si algún día se hace, esta
 * ruta se queda igual, redirigiendo al slug guardado en vez de al calculado.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  peticion: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Sin esto, cualquier basura en la URL se convierte en una consulta a la base.
  if (!UUID.test(id)) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const aFicha = (nombre: string) =>
    NextResponse.redirect(
      new URL(`/empresas/${crearSlug(nombre)}`, peticion.nextUrl.origin),
      308
    );

  try {
    const db = createAdminClient();

    /**
     * Sólo entidades APROBADAS. Una ficha pendiente o rechazada no es pública,
     * así que su `/e/{id}` tiene que dar 404 igual que su slug —si no, sería un
     * canal para descubrir altas que todavía no se publicaron.
     */
    const { data: empresa } = await db
      .from("empresas")
      .select("razon_social")
      .eq("id", id)
      .eq("estado", "aprobada")
      .maybeSingle();

    if (empresa?.razon_social) return aFicha(empresa.razon_social);

    /**
     * Los particulares también cuelgan de `/empresas/[slug]`, y ahí el slug se
     * arma con `nombre_comercial` o con `nombre + apellido` — no con
     * `razon_social`. Replicarlo tal cual es obligatorio: si esto calculara el
     * slug distinto que la ficha, el 308 aterrizaría en un 404.
     */
    const { data: proveedor } = await db
      .from("proveedores")
      .select("nombre, apellido, nombre_comercial")
      .eq("id", id)
      .eq("estado", "aprobado")
      .maybeSingle();

    if (proveedor) {
      const nombre = nombreDeFichaParticular(proveedor);
      if (nombre) return aFicha(nombre);
    }

    return new NextResponse("No encontrado", { status: 404 });
  } catch {
    /**
     * La base caída no puede devolver 404: eso le diría a Google que la ficha
     * no existe y la sacaría del índice. 503 es "volvé más tarde".
     */
    return new NextResponse("Servicio no disponible", {
      status: 503,
      headers: { "Retry-After": "120" },
    });
  }
}
