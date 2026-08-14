import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buscarEnPadron, esSocia } from '@/modulos/altas/buscar-en-padron'

/**
 * ¿Esta empresa ya está en el padrón de la UIAB?
 *
 * Se consulta en el paso 3 del registro, apenas cargan el CUIT y el nombre, para
 * avisarles antes de que completen seis pantallas y elijan un plan que no les
 * corresponde. El control que manda igual es el de register-sync: esto es sólo el
 * aviso temprano, como ya hace check-email.
 *
 * Item 1.3 del reporte de Lucas. A una socia no le corresponde registrarse y
 * pagar: su acceso es bonificado y sale por /sumate → /admin/altas.
 *
 * La ruta se sigue llamando check-cuit por compatibilidad, pero desde el
 * 2026-08-13 también busca por nombre: la ficha de Transporte Gav no tenía CUIT
 * cargado y el chequeo dejaba pasar a una socia al circuito arancelado.
 */
export async function POST(request: Request) {
  try {
    const { cuit, razonSocial, nombreComercial } = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { empresa } = await buscarEnPadron(supabaseAdmin, {
      cuit: typeof cuit === 'string' ? cuit : null,
      razonSocial: typeof razonSocial === 'string' ? razonSocial : null,
      nombreComercial: typeof nombreComercial === 'string' ? nombreComercial : null,
    })

    if (!empresa) return NextResponse.json({ enPadron: false })

    return NextResponse.json({
      enPadron: true,
      esSocia: esSocia(empresa),
      razonSocial: empresa.razon_social,
      coincidencia: empresa.coincidencia,
    })
  } catch {
    // Ante cualquier error no trabamos el registro: register-sync valida igual.
    return NextResponse.json({ enPadron: false })
  }
}
