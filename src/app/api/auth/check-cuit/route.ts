import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buscarEmpresaEnPadron, esSocia } from '@/modulos/altas/buscar-en-padron'

/**
 * ¿Este CUIT ya está en el padrón de la UIAB?
 *
 * Se consulta en el paso 3 del registro, apenas cargan el CUIT, para avisarles
 * antes de que completen seis pantallas y creen una cuenta que después hay que
 * borrar. El control que manda igual es el de register-sync: esto es sólo el
 * aviso temprano, como ya hace check-email.
 *
 * Item 1.3 del reporte de Lucas. A una socia no le corresponde registrarse y
 * pagar: su acceso es bonificado y sale por /sumate → /admin/altas.
 */
export async function POST(request: Request) {
  try {
    const { cuit } = await request.json()

    if (!cuit || typeof cuit !== 'string') {
      return NextResponse.json({ enPadron: false })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const empresa = await buscarEmpresaEnPadron(supabaseAdmin, cuit)

    if (!empresa) return NextResponse.json({ enPadron: false })

    return NextResponse.json({
      enPadron: true,
      esSocia: esSocia(empresa),
      razonSocial: empresa.razon_social,
    })
  } catch {
    // Ante cualquier error no trabamos el registro: register-sync valida igual.
    return NextResponse.json({ enPadron: false })
  }
}
