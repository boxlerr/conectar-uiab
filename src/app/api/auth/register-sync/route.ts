import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { instanceId, email, role, nombre } = await request.json()

    if (!instanceId || !role || !nombre) {
      return NextResponse.json({ error: 'Faltan parámetros de inicialización del registro' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Insert into perfiles (bypassing RLS)
    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: instanceId, // Ties up directly to auth.users.id
        email: email,
        nombre_completo: nombre,
        rol_sistema: role,
        activo: true
      })

    if (profileError) {
      console.error('Registration API: Profile Error -', profileError)
      return NextResponse.json({ error: 'Hubo un error al establecer tu perfil organizacional.' }, { status: 500 })
    }

    // 2. Automatically instantiate "Empresa" or "Proveedor" based on selection (B2B SaaS Best Practice)
    if (role === 'company') {
      const { data: emp, error: empError } = await supabaseAdmin
        .from('empresas')
        .insert({
          razon_social: nombre, // Provisional default name
          estado: 'active', // Assuming validation handles this properly, or 'pending' if it needs UIAB approval
          email: email,
        })
        .select()
        .single()
        
      if (!empError && emp?.id) {
        await supabaseAdmin.from('miembros_empresa').insert({
          empresa_id: emp.id,
          perfil_id: instanceId,
          rol: 'admin',
          es_principal: true
        })
      }
    } else if (role === 'provider') {
      const { data: prov, error: provError } = await supabaseAdmin
        .from('proveedores')
        .insert({
          nombre_comercial: nombre,
          estado: 'active',
          email: email,
        })
        .select()
        .single()
        
      if (!provError && prov?.id) {
        await supabaseAdmin.from('miembros_proveedor').insert({
          proveedor_id: prov.id,
          perfil_id: instanceId,
          rol: 'admin',
          es_principal: true
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Registration API Error:', err)
    return NextResponse.json({ error: 'Error interno de backend.' }, { status: 500 })
  }
}
