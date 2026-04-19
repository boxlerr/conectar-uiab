import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarEmail, emailAdmin, appUrl } from '@/lib/email/cliente'
import { plantillaNotificacionAdmin } from '@/lib/email/plantillas'

export async function POST(request: Request) {
  try {
    const { instanceId, payload, fullName } = await request.json()

    if (!instanceId || !payload) {
      return NextResponse.json({ error: 'Faltan parámetros de inicialización del registro' }, { status: 400 })
    }

    const {
      role, email,
      razonSocial, nombre, apellido, nombreComercial, cuit,
      telefono, sitioWeb,
      pais, provincia, localidad, direccion, descripcion,
      sectorId, subSector, size, experience
    } = payload

    // Parsear cantidad de empleados desde el string "size" del formulario.
    // Ejemplos aceptados: "50", "50 empleados", "~ 120".
    const parsedEmpleados = (() => {
      if (typeof size !== 'string' && typeof size !== 'number') return null
      const m = String(size).match(/\d+/)
      if (!m) return null
      const n = parseInt(m[0], 10)
      return Number.isFinite(n) && n >= 0 ? n : null
    })()

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
        nombre_completo: fullName,
        rol_sistema: role,
        telefono: telefono || null,
        activo: true // El usuario (persona vinculada) está activa, pero su empresa queda en pending.
      })

    if (profileError) {
      console.error('Registration API: Profile Error -', profileError)
      return NextResponse.json({ error: 'Hubo un error al establecer tu perfil organizacional.' }, { status: 500 })
    }

    // 2. Automatically instantiate "Empresa" or "Proveedor" with 'pending' status for admin review.
    let entityId = null;

    if (role === 'company') {
      const { data: emp, error: empError } = await supabaseAdmin
        .from('empresas')
        .insert({
          razon_social: razonSocial,
          nombre_comercial: nombreComercial || null,
          cuit: cuit,
          estado: 'pendiente_revision', // Requerirá aprobación desde panel de administración
          email: email,
          telefono: telefono,
          sitio_web: sitioWeb || null,
          pais: pais || 'Argentina',
          provincia: provincia,
          localidad: localidad,
          direccion: direccion,
          descripcion: descripcion,
          cantidad_empleados: parsedEmpleados,
          // La tarifa se calcula automáticamente vía trigger DB
          // a partir de cantidad_empleados.
        })
        .select()
        .single()

        if (!empError && emp?.id) {
          entityId = emp.id;
          await supabaseAdmin.from('miembros_empresa').insert({
            empresa_id: emp.id,
            perfil_id: instanceId,
            rol: 'gestor',
            es_principal: true
          })
  
          // Save categories optionally via mapping table
          if (sectorId) {
            await supabaseAdmin.from('empresas_categorias').insert({
              empresa_id: emp.id,
              categoria_id: sectorId // Assuming sectorId maps roughly if they exist, or they handles it later
            })
          }
        } else {
          console.error("Error creating company:", empError)
          return NextResponse.json({ error: 'Error al registrar la entidad.' }, { status: 500 })
        }
  
      } else if (role === 'provider') {
        const { data: prov, error: provError } = await supabaseAdmin
          .from('proveedores')
          .insert({
            nombre: nombre,
            apellido: apellido,
            razon_social: razonSocial || null, // Optional for independent pros
            nombre_comercial: nombreComercial || null,
            cuit: cuit,
            estado: 'pendiente_revision', // Requerirá aprobación
            email: email,
            telefono: telefono,
            sitio_web: sitioWeb || null,
            pais: pais || 'Argentina',
            provincia: provincia,
            localidad: localidad,
            direccion: direccion,
            descripcion: descripcion,
          })
          .select()
          .single()
          
        if (!provError && prov?.id) {
          entityId = prov.id;
          await supabaseAdmin.from('miembros_proveedor').insert({
            proveedor_id: prov.id,
            perfil_id: instanceId,
            rol: 'gestor',
            es_principal: true
          })

        if (sectorId) {
          await supabaseAdmin.from('proveedores_categorias').insert({
            proveedor_id: prov.id,
            categoria_id: sectorId
          })
        }
      } else {
        console.error("Error creating provider:", provError)
        return NextResponse.json({ error: 'Error al registrar al proveedor.' }, { status: 500 })
      }
    }

    // 3. Notificación al administrador — nueva entidad pendiente de revisión.
    //    Nunca bloqueamos el registro por un fallo de email: `enviarEmail`
    //    captura y loguea internamente.
    try {
      const urlPanelAdmin =
        role === 'company'
          ? `${appUrl()}/admin/empresas`
          : `${appUrl()}/admin/proveedores`

      // Intentamos resolver el nombre del rubro desde la tabla categorías
      // (si el sectorId corresponde a un UUID real). Si no, dejamos el
      // subSector como rótulo.
      let rubroLabel: string | null = subSector || null
      if (sectorId && typeof sectorId === 'string' && sectorId.length > 20) {
        const { data: cat } = await supabaseAdmin
          .from('categorias')
          .select('nombre')
          .eq('id', sectorId)
          .maybeSingle()
        if (cat?.nombre) {
          rubroLabel = subSector ? `${cat.nombre} — ${subSector}` : cat.nombre
        }
      }

      const plantilla = plantillaNotificacionAdmin({
        tipo: role === 'company' ? 'empresa' : 'particular',
        nombre: fullName,
        email,
        cuit: cuit || null,
        telefono: telefono || null,
        localidad: localidad || null,
        provincia: provincia || null,
        rubro: rubroLabel,
        urlPanelAdmin,
      })

      await enviarEmail({
        para: emailAdmin(),
        asunto: plantilla.asunto,
        html: plantilla.html,
        texto: plantilla.texto,
        responderA: email,
      })
    } catch (emailErr) {
      // Log y seguimos: el registro ya se persistió.
      console.error('[register-sync] Error enviando notificación al admin:', emailErr)
    }

    console.log(`[register-sync] Registro completado: ${role} (${fullName}) → pendiente de revisión`)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Registration API Error:', err)
    return NextResponse.json({ error: 'Error interno de backend al procesar la integración profunda.' }, { status: 500 })
  }
}
