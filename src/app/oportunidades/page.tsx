import { createAdminClient } from "@/lib/supabase/admin";
import type { Oportunidad } from "@/modulos/oportunidades/servicio-oportunidades";
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
      .select(
        `
        *,
        categoria:categorias(nombre),
        empresa:empresas!oportunidades_empresa_solicitante_id_fkey(razon_social)
      `
      )
      .eq("estado", "abierta")
      .order("creado_en", { ascending: false });

    if (error || !data) return [];
    return data as Oportunidad[];
  } catch {
    // La cartelera no puede tumbar la página: el cliente vuelve a intentar.
    return [];
  }
}

export default async function OportunidadesPage() {
  const oportunidades = await obtenerOportunidadesAbiertas();
  return <OportunidadesCliente oportunidadesIniciales={oportunidades} />;
}
