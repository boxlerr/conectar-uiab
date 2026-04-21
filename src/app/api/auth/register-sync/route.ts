import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarEmail, emailAdmin, appUrl } from '@/lib/email/cliente'
import { plantillaNotificacionAdmin } from '@/lib/email/plantillas'
import { plantillaSuscripcionPendiente } from '@/lib/email/plantillas-suscripciones'
import { calcularMontoMensual, calcularTarifaPorEmpleados, nombrePlan } from '@/lib/mercadopago/suscripciones'

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
      sectorId, subSector, size, experience,
      plan,
    } = payload

    // Bandera para accesos de prueba: salteamos Mercado Pago y dejamos la cuenta
    // activa de inmediato (entidad aprobada + suscripción cortesía).
    const esPrueba = plan === 'gratis_test'
    const estadoEntidadCompany = esPrueba ? 'aprobada' : 'pendiente_revision'
    const estadoEntidadProvider = esPrueba ? 'aprobado' : 'pendiente_revision'

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
          estado: estadoEntidadCompany,
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
        const parsedExperiencia = (() => {
          if (!experience) return null;
          const m = String(experience).match(/\d+/);
          if (!m) return null;
          const n = parseInt(m[0], 10);
          return Number.isFinite(n) && n >= 0 ? n : null;
        })();

        const { data: prov, error: provError } = await supabaseAdmin
          .from('proveedores')
          .insert({
            nombre: nombre,
            apellido: apellido,
            razon_social: razonSocial || null,
            nombre_comercial: nombreComercial || null,
            cuit: cuit,
            estado: estadoEntidadProvider,
            email: email,
            telefono: telefono,
            sitio_web: sitioWeb || null,
            pais: pais || 'Argentina',
            provincia: provincia,
            localidad: localidad,
            direccion: direccion,
            descripcion: descripcion,
            anios_experiencia: parsedExperiencia,
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

    // 4. Crear fila inicial de suscripción en estado `pendiente_pago`.
    //    Esto permite que el webhook y la UI tengan una fila sobre la que operar
    //    aun antes de que el usuario inicie el flujo de checkout.
    try {
      if (entityId && (role === 'company' || role === 'provider')) {
        const tarifaNivel = role === 'company' ? calcularTarifaPorEmpleados(parsedEmpleados) : null
        const { data: precios } = await supabaseAdmin.from('tarifas_precios').select('nivel, precio_mensual')
        const mapaPrecios: Record<number, number> = {}
        ;(precios ?? []).forEach((p: any) => { mapaPrecios[p.nivel] = Number(p.precio_mensual) })
        const monto = calcularMontoMensual({ role, tarifa: tarifaNivel, empleados: parsedEmpleados, preciosDb: mapaPrecios })

        await supabaseAdmin.from('suscripciones').insert({
          empresa_id: role === 'company' ? entityId : null,
          proveedor_id: role === 'provider' ? entityId : null,
          monto: esPrueba ? 0 : monto,
          moneda: 'ARS',
          nombre_plan: esPrueba ? 'Cortesía (prueba)' : nombrePlan(role, tarifaNivel),
          estado: esPrueba ? 'activa' : 'pendiente_pago',
          metodo_pago: esPrueba ? 'cortesia' : 'mercadopago',
          notas_admin: esPrueba ? 'Registro de prueba (Acceso gratis).' : null,
        })

        if (!esPrueba) {
          // Email al usuario con CTA al checkout.
          try {
            const plantillaSus = plantillaSuscripcionPendiente({
              nombre: fullName,
              email,
              plan: nombrePlan(role, tarifaNivel),
              monto,
              entidad: role === 'company' ? 'empresa' : 'particular',
              urlCheckout: `${appUrl()}/suscripcion/checkout`,
            })
            await enviarEmail({
              para: email,
              asunto: plantillaSus.asunto,
              html: plantillaSus.html,
              texto: plantillaSus.texto,
            })
          } catch (err) {
            console.error('[register-sync] error enviando mail suscripción pendiente:', err)
          }
        }
      }
    } catch (err) {
      console.error('[register-sync] error creando fila de suscripción inicial:', err)
    }

    console.log(`[register-sync] Registro completado: ${role} (${fullName}) → pendiente de revisión + pendiente_pago`)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Registration API Error:', err)
    return NextResponse.json({ error: 'Error interno de backend al procesar la integración profunda.' }, { status: 500 })
  }
}
