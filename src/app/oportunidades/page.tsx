import { createAdminClient } from "@/lib/supabase/admin";
import type { Oportunidad } from "@/modulos/oportunidades/servicio-oportunidades";
import { SELECT_OPORTUNIDAD } from "@/modulos/oportunidades/solicitante";
import { OportunidadesCliente } from "./oportunidades-cliente";

/**
 * `/oportunidades` pasó a Server Component por la misma razón que `/empresas`:
 * el contenido existía sólo después de hidratar.
 *
 * La cartelera se armaba en el browser, así que Googlebot recibía el esqueleto
 * —156 palabras, un único H2 que decía "0 oportunidades disponibles"— en una
 * URL que el sitemap publica con prioridad 0.8. Y para que ese vacío no se
 * notara, la landing pública rellenaba con tres pedidos de cotización
 * inventados, atribuidos a empresas que tampoco existen.
 *
 * Ahora las abiertas se resuelven acá y bajan por props. Cuando no hay ninguna
 * —que es el caso hoy— la landing explica cómo funciona la cartelera en vez de
 * inventar contenido: es información cierta, útil para quien llega, y le da a
 * la página texto propio.
 *
 * El listado completo con filtros y los matches siguen siendo del cliente y
 * siguen dependiendo de la sesión: acá sólo se publica lo que ya es público.
 */
export const revalidate = 300;

// El canonical NO va acá: lo declara src/app/oportunidades/layout.tsx, que es
// donde lo busca src/tests/seo/indexabilidad.test.ts. Declararlo en los dos
// lados es una fuente de verdad de más esperando divergir.

async function obtenerOportunidadesAbiertas(): Promise<Oportunidad[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("oportunidades")
      .select(SELECT_OPORTUNIDAD)
      .eq("estado", "abierta")
      .order("creado_en", { ascending: false });

    if (error || !data) return [];
    return data as unknown as Oportunidad[];
  } catch {
    // La cartelera no puede tumbar la página: el cliente vuelve a intentar.
    return [];
  }
}

/**
 * El único número que muestra el encabezado además del de la cartelera.
 *
 * Sale de la base a propósito: el mockup de esta pantalla traía "248 empresas
 * activas" y "1.532 profesionales" escritos a mano, que en esta base son 59 y
 * 0. Un contador falso en el sitio de una cámara empresaria no es un detalle de
 * estilo — `src/tests/seo/sin-datos-inventados.test.ts` existe justamente por
 * eso, y la salida que documenta es esta: buscá el número, pasalo por props.
 */
async function contarEmpresasVerificadas(): Promise<number | null> {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "aprobada");

    if (error || count == null) return null;
    return count;
  } catch {
    // Sin dato no se inventa uno: el encabezado esconde la tarjeta.
    return null;
  }
}

export default async function OportunidadesPage() {
  const [oportunidades, totalEmpresas] = await Promise.all([
    obtenerOportunidadesAbiertas(),
    contarEmpresasVerificadas(),
  ]);

  return (
    <OportunidadesCliente
      oportunidadesIniciales={oportunidades}
      totalEmpresas={totalEmpresas}
    />
  );
}
