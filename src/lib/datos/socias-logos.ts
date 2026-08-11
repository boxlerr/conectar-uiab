import { createAdminClient } from "@/lib/supabase/admin";
import { crearSlug } from "@/lib/utilidades";
import { esEmpresaInstitucional } from "@/lib/datos/empresa-institucional";

/**
 * Socias con logo para el marquee de la home y de /empresas, resueltas en el
 * SERVIDOR.
 *
 * POR QUÉ SE MOVIÓ ACÁ
 *
 * `banner-logos-socias.tsx` es "use client" y traía los datos en un useEffect.
 * Sus `<Link href="/empresas/{slug}">` —unos 50— recién existían después de
 * hidratar, así que el HTML que recibía Googlebot en la home tenía CERO enlaces
 * a fichas. El comentario del propio componente decía que el marquee servía
 * "para que Google indexe y posicione las fichas": hacía exactamente lo
 * contrario de lo que declaraba.
 *
 * NO LLEVA `import "server-only"` A PROPÓSITO. Este módulo lo importan sólo
 * Server Components (src/app/page.tsx y src/app/empresas/page.tsx), pero en
 * este proyecto ya hubo un incidente en el que meter "server-only" en la cadena
 * de un client component rompió la hidratación en silencio con Turbopack. El
 * riesgo de la marca supera al beneficio: la protección real es que
 * `createAdminClient` usa la service role key, que no existe en el browser.
 */

export interface SociaConLogo {
  id: string;
  nombre: string;
  slug: string;
  logoUrl: string;
}

/**
 * Semilla del DÍA (mismo criterio que src/app/directorio/datos.ts): el orden
 * varía entre días pero es idéntico dentro de un mismo día.
 *
 * Esto importa por dos motivos. Uno, hidratación: el marquee barajaba con
 * `Math.random()` en el cliente, y si eso pasara a correr en servidor y cliente
 * daría dos órdenes distintos y un mismatch. Dos, caché: un HTML que cambia en
 * cada request sin que haya cambiado el contenido invalida la caché del CDN
 * para nada.
 */
function semillaDelDia(): number {
  const f = new Date();
  const clave = `${f.getUTCFullYear()}-${f.getUTCMonth() + 1}-${f.getUTCDate()}`;
  let h = 0;
  for (let i = 0; i < clave.length; i++) h = (Math.imul(h, 31) + clave.charCodeAt(i)) | 0;
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajarConSemilla<T>(arr: T[], seed: number): T[] {
  const copia = arr.slice();
  const rand = mulberry32(seed);
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export async function obtenerSociasConLogo(): Promise<SociaConLogo[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("empresas_publicas_logos")
      .select("id, razon_social, bucket_logo, ruta_logo");

    if (error || !data) return [];

    const socias = data
      .filter((e: any) => e.razon_social && e.bucket_logo && e.ruta_logo)
      // La UIAB queda afuera: creó la plataforma, no es una socia participante.
      .filter((e: any) => !esEmpresaInstitucional(e.id))
      .map((e: any) => ({
        id: e.id as string,
        nombre: e.razon_social as string,
        slug: crearSlug(e.razon_social),
        logoUrl: supabase.storage.from(e.bucket_logo).getPublicUrl(e.ruta_logo).data.publicUrl,
      }));

    return barajarConSemilla(socias, semillaDelDia());
  } catch {
    // El marquee es decorativo: si la consulta falla, la página se sirve igual.
    return [];
  }
}
