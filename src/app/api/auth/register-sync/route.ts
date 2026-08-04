import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarEmail, emailAdmin, appUrl } from '@/lib/email/cliente'
import { plantillaNotificacionAdmin } from '@/lib/email/plantillas'
import { plantillaSuscripcionPendiente } from '@/lib/email/plantillas-suscripciones'
import { calcularMontoMensual, nombrePlan } from '@/lib/mercadopago/suscripciones'
import { normalizarSitioWeb } from '@/lib/utilidades'
import { buscarEmpresaEnPadron, esSocia } from '@/modulos/altas/buscar-en-padron'
import { fusionarConPadron } from '@/modulos/altas/padron'

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
    //
    // El corte por entorno es lo que cierra de verdad el item 1.2 del reporte de
    // Lucas. Esconder el botón del formulario no alcanzaba: `plan` viaja en el
    // payload que manda el browser, así que un POST armado a mano a este
    // endpoint con plan="gratis_test" seguía dando de alta una empresa aprobada
    // con suscripción de cortesía, sin pagar el canon. En producción la bandera
    // se ignora y el alta cae siempre en pendiente_revision + pendiente_pago.
    const esPrueba = plan === 'gratis_test' && process.env.NODE_ENV !== 'production'
    if (plan === 'gratis_test' && !esPrueba) {
      console.warn('[register-sync] Se ignoró plan="gratis_test" en producción:', email)
    }
    const estadoEntidadCompany = esPrueba ? 'aprobada' : 'pendiente_revision'
    const estadoEntidadProvider = esPrueba ? 'aprobado' : 'pendiente_revision'

    // El sitio web viaja como lo tipearon ("www.empresa.com"). Le agregamos el
    // esquema acá y no sólo en el cliente: es lo que se guarda y lo que después
    // se usa como href en la ficha pública, y sin https:// el link sale relativo.
    const sitioWebNormalizado = normalizarSitioWeb(sitioWeb)

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

    // 0. Control contra el padrón UIAB (item 1.3 del reporte de Lucas).
    //
    // Si el CUIT ya está en `empresas`, la empresa YA EXISTE: no se crea una
    // segunda ficha. Antes esto cortaba con un 409 y mandaba a /sumate, pero en
    // la práctica la gente volvía a registrarse igual y el directorio terminaba
    // duplicado — le pasó a Metalúrgica Longchamps y de nuevo a Pinturería
    // Giannoni el 2026-08-04.
    //
    // Ahora se REUSA la ficha: se vincula la cuenta nueva y se le aplican los
    // datos que cargó la empresa, con las mismas reglas de fusión que el alta de
    // /sumate (`fusionarConPadron`): el correo y el teléfono del formulario
    // pisan, el resto sólo completa lo que está vacío, y nunca se borra un dato.
    // Así el trabajo de corregir la ficha no se pierde.
    //
    // `estado` NO se toca a propósito: una socia ya publicada sigue publicada
    // (bajarla a pendiente_revision la sacaría del directorio), y una ficha
    // pendiente sigue pendiente.
    //
    // Contrapartida a tener presente: un CUIT es público, así que esto vincula a
    // quien lo conozca. Por eso se notifica al admin en el paso 3 y la membresía
    // entra como `gestor` sin `es_principal` si la ficha ya tiene dueño.
    let empresaExistenteId: string | null = null
    let empresaExistenteEsSocia = false

    if (role === 'company') {
      const enPadron = await buscarEmpresaEnPadron(supabaseAdmin, cuit)

      if (enPadron) {
        empresaExistenteId = enPadron.id
        empresaExistenteEsSocia = esSocia(enPadron)

        const { data: fichaPadron } = await supabaseAdmin
          .from('empresas')
          .select('*')
          .eq('id', enPadron.id)
          .single()

        if (fichaPadron) {
          // Mapeo al vocabulario que espera `fusionarConPadron` (claves de
          // `altas_socios`), para no duplicar las reglas de fusión.
          const { cambios } = fusionarConPadron(
            {
              email,
              telefono,
              nombre_comercial: nombreComercial,
              sitio_web: sitioWebNormalizado,
              direccion,
              localidad,
              actividad: descripcion,
              referente_nombre: fullName,
              cuit,
            },
            fichaPadron
          )
          if (Object.keys(cambios).length > 0) {
            const { error: fusionErr } = await supabaseAdmin
              .from('empresas')
              .update(cambios)
              .eq('id', enPadron.id)
            if (fusionErr) {
              console.error('[register-sync] No se pudo actualizar la ficha del padrón:', fusionErr.message)
            }
          }
        }
      }
    }

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

    if (role === 'company' && empresaExistenteId) {
      // La ficha ya existía en el padrón (paso 0): no se crea otra, sólo se
      // vincula esta cuenta. `es_principal` va en true únicamente si la ficha
      // todavía no tiene dueño; si ya lo tiene, esta entra como gestor más.
      entityId = empresaExistenteId

      const { data: yaHayPrincipal } = await supabaseAdmin
        .from('miembros_empresa')
        .select('id')
        .eq('empresa_id', empresaExistenteId)
        .eq('es_principal', true)
        .maybeSingle()

      const { data: yaMiembro } = await supabaseAdmin
        .from('miembros_empresa')
        .select('id')
        .eq('empresa_id', empresaExistenteId)
        .eq('perfil_id', instanceId)
        .maybeSingle()

      if (!yaMiembro) {
        await supabaseAdmin.from('miembros_empresa').insert({
          empresa_id: empresaExistenteId,
          perfil_id: instanceId,
          rol: 'gestor',
          es_principal: !yaHayPrincipal,
        })
      }
    } else if (role === 'company') {
      const { data: emp, error: empError } = await supabaseAdmin
        .from('empresas')
        .insert({
          razon_social: razonSocial,
          nombre_comercial: nombreComercial || null,
          cuit: cuit,
          estado: estadoEntidadCompany,
          email: email,
          telefono: telefono,
          sitio_web: sitioWebNormalizado,
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
        const fechaInicioExperiencia = (() => {
          if (!experience) return null;
          const m = String(experience).match(/\d+/);
          if (!m) return null;
          const años = parseInt(m[0], 10);
          if (!Number.isFinite(años) || años < 0) return null;
          const fecha = new Date();
          fecha.setFullYear(fecha.getFullYear() - años);
          return fecha.toISOString().split('T')[0];
        })();

        const { data: prov, error: provError } = await supabaseAdmin
          .from('proveedores')
          .insert({
            nombre: nombre,
            apellido: apellido,
            razon_social: razonSocial || null,
            nombre_comercial: nombreComercial || null,
            cuit: cuit,
            tipo_proveedor: 'particular',
            estado: estadoEntidadProvider,
            email: email,
            telefono: telefono,
            sitio_web: sitioWebNormalizado,
            pais: pais || 'Argentina',
            provincia: provincia,
            localidad: localidad,
            direccion: direccion,
            descripcion: descripcion,
            fecha_inicio_experiencia: fechaInicioExperiencia,
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
        // Si nos vinculamos a una ficha que ya existía, puede que ya tenga su
        // suscripción: no creamos una segunda.
        const { data: suscExistente } = empresaExistenteId
          ? await supabaseAdmin
              .from('suscripciones')
              .select('id')
              .eq('empresa_id', empresaExistenteId)
              .maybeSingle()
          : { data: null }

        // Las socias UIAB no abonan: su acceso es de cortesía. Antes esto sólo
        // se contemplaba en el alta de /sumate, así que una socia que entraba
        // por /register quedaba en `pendiente_pago` y el panel no la dejaba
        // aprobar (ver migración 20260804_es_socia_uiab).
        const sinCargo = esPrueba || empresaExistenteEsSocia
        // El monto es plano: no depende del rol, los empleados ni la tarifa.
        const monto = calcularMontoMensual()

        if (!suscExistente) {
          await supabaseAdmin.from('suscripciones').insert({
            empresa_id: role === 'company' ? entityId : null,
            proveedor_id: role === 'provider' ? entityId : null,
            monto: sinCargo ? 0 : monto,
            moneda: 'ARS',
            nombre_plan: empresaExistenteEsSocia
              ? 'Socia UIAB (sin cargo)'
              : esPrueba
                ? 'Cortesía (prueba)'
                : nombrePlan(),
            estado: sinCargo ? 'activa' : 'pendiente_pago',
            metodo_pago: sinCargo ? 'cortesia' : 'mercadopago',
            notas_admin: esPrueba ? 'Registro de prueba (Acceso gratis).' : null,
          })
        }

        if (!sinCargo && !suscExistente) {
          // Email al usuario con CTA al checkout.
          try {
            const plantillaSus = plantillaSuscripcionPendiente({
              nombre: fullName,
              email,
              plan: nombrePlan(),
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
