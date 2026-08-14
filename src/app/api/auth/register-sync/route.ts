import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarEmail, emailAdmin, appUrl } from '@/lib/email/cliente'
import { plantillaNotificacionAdmin } from '@/lib/email/plantillas'
import { plantillaSuscripcionPendiente } from '@/lib/email/plantillas-suscripciones'
import { calcularMontoMensual, nombrePlan } from '@/lib/mercadopago/suscripciones'
import { normalizarSitioWeb } from '@/lib/utilidades'
import { buscarEnPadron, type EmpresaDelPadron } from '@/modulos/altas/buscar-en-padron'
import {
  interpretarServicioDelRegistro,
  type ServicioDelRegistro,
} from '@/modulos/registro/servicio-del-registro'
import { slugEspecialidad } from '@/modulos/compartido/especialidades'

/**
 * El cliente con service role. Se arma en una función para que el tipo del
 * parámetro de los helpers de abajo salga de la MISMA llamada: escribirlo a
 * mano contra `SupabaseClient<...>` no matchea y termina en `never`.
 */
function clienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
type ClienteAdmin = ReturnType<typeof clienteAdmin>

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
      sectorId, subSector, servicioLibre, size, experience,
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

    const supabaseAdmin = clienteAdmin()

    // 0.a El servicio que declara un particular es obligatorio, y se valida acá.
    //
    // El wizard ya lo pedía, pero esto es un endpoint público: sin el chequeo del
    // servidor, un POST sin `sectorId` creaba igual la ficha —y una ficha sin
    // rubro no aparece en ninguna búsqueda del directorio, así que se publica
    // invisible. Se corta antes de crear nada; el usuario de Auth que dejó el
    // signUp del browser se limpia igual que en el error de perfil.
    let servicioDelParticular: ServicioDelRegistro | null = null
    if (role === 'provider') {
      servicioDelParticular = interpretarServicioDelRegistro(sectorId, servicioLibre)
      if (servicioDelParticular.tipo === 'falta') {
        try {
          await supabaseAdmin.auth.admin.deleteUser(instanceId)
        } catch (err) {
          console.error('[register-sync] quedó un usuario de Auth sin ficha:', instanceId, err)
        }
        return NextResponse.json({ error: servicioDelParticular.error }, { status: 400 })
      }
    }

    // 0. Control contra el padrón UIAB (item 1.3 del reporte de Lucas).
    //
    // Si la empresa ya está en `empresas`, YA EXISTE: no se crea una segunda
    // ficha ni se le cobra nada. Antes esto cortaba con un 409 y mandaba a
    // /sumate, pero la gente volvía a registrarse igual y el directorio
    // terminaba duplicado — Metalúrgica Longchamps, Pinturería Giannoni el
    // 2026-08-04 y Transporte Gav el 2026-08-13.
    //
    // Desde el 2026-08-13 el registro de una empresa del padrón NO crea nada por
    // su cuenta: deja una solicitud en `altas_socios` — la misma tabla que llena
    // /sumate — y la cuenta queda en espera. El admin la ve en /admin/altas y con
    // "Dar acceso" se dispara `crearCuentaDesdeAlta`, que vincula la ficha, la
    // fusiona con lo que cargó la empresa y le pone la suscripción de cortesía.
    //
    // Por qué así y no vinculando acá mismo: es UN solo camino de alta de socias,
    // ya probado, con la fusión y los conflictos resueltos en un solo lugar. Y
    // sobre todo, el match por nombre puede errar (la ficha de Transporte Gav no
    // tenía CUIT, así que el nombre es lo único que había): escribir el correo y
    // el teléfono de quien se registra sobre la ficha publicada de otra empresa
    // sería mucho peor que hacerle esperar la confirmación de un humano.
    //
    // Contrapartida a tener presente: un CUIT es público y un nombre más todavía,
    // así que esto lo puede disparar cualquiera. Por eso la cuenta queda inactiva
    // y baneada hasta que un admin la habilite.
    let fichaPadron: EmpresaDelPadron | null = null
    let padronAmbiguo = false

    if (role === 'company') {
      const enPadron = await buscarEnPadron(supabaseAdmin, {
        cuit,
        razonSocial,
        nombreComercial,
      })
      fichaPadron = enPadron.empresa
      padronAmbiguo = enPadron.ambiguo
    }

    // Con empate (dos fichas del padrón compitiendo por el mismo dato) tampoco
    // seguimos de largo: crear una tercera ficha sería exactamente el bug.
    const vieneDelPadron = Boolean(fichaPadron) || padronAmbiguo

    // 1. Insert into perfiles (bypassing RLS)
    //
    // Quien matchea contra el padrón entra DESACTIVADO y espera que un admin lo
    // habilite. Un alta normal crea su propia ficha en `pendiente_revision`, así
    // que ya nace bajo control; en cambio la ficha del padrón YA está aprobada y
    // publicada, así que sin este freno el acceso se da solo. Y el CUIT es
    // público: alcanza con conocerlo.
    //
    // Pasó de verdad el 2026-08-05: dos personas se registraron con el CUIT de
    // Roll Paper con 13 minutos de diferencia y quedaron adentro de la ficha sin
    // que nadie aprobara nada, mientras el mail al admin decía "pendiente de
    // revisión". El gate de `perfiles.activo` ya existe (banea en Auth, el
    // middleware corta la sesión y el login lo explica), sólo faltaba usarlo acá.
    const quedaPendienteDeHabilitacion = vieneDelPadron

    const { error: profileError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id: instanceId, // Ties up directly to auth.users.id
        email: email,
        nombre_completo: fullName,
        rol_sistema: role,
        telefono: telefono || null,
        activo: !quedaPendienteDeHabilitacion,
      })

    if (profileError) {
      console.error('Registration API: Profile Error -', profileError)

      // El usuario de Auth ya existe (lo creó el signUp del browser, antes de
      // llegar acá). Si nos vamos sin más, queda un usuario sin perfil: no puede
      // usar la plataforma, no aparece en /admin/usuarios —que lista `perfiles`—
      // y encima ocupa el email, así que la persona no se puede volver a
      // registrar. No hay ningún trigger en la base que cree el perfil solo, así
      // que la única red es limpiar acá.
      try {
        await supabaseAdmin.auth.admin.deleteUser(instanceId)
      } catch (err) {
        console.error('[register-sync] quedó un usuario de Auth sin perfil:', instanceId, err)
      }

      return NextResponse.json(
        { error: 'Hubo un error al establecer tu perfil organizacional. Probá de nuevo.' },
        { status: 500 }
      )
    }

    // El flag solo no alcanza: hay que banear en Auth, igual que hace
    // /perfil/usuarios al desactivar. Si no, la sesión que el signUp ya dejó
    // abierta sigue viva hasta que el middleware la corte.
    if (quedaPendienteDeHabilitacion) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(instanceId, { ban_duration: '876000h' })
      } catch (err) {
        console.error('[register-sync] No se pudo dejar en espera al usuario:', err)
      }
    }

    // 2. Automatically instantiate "Empresa" or "Proveedor" with 'pending' status for admin review.
    let entityId = null;

    if (role === 'company' && vieneDelPadron) {
      // La ficha ya existe en el padrón: no se crea ninguna entidad ni membresía
      // acá. Queda una solicitud en `altas_socios` (paso 2.b) y la vinculación
      // real la hace `crearCuentaDesdeAlta` cuando el admin da el acceso, con la
      // fusión de datos y los conflictos que ya resuelve el alta de /sumate.
      //
      // Sin entidad tampoco hay suscripción (paso 4): a una empresa del padrón no
      // le corresponde el circuito arancelado. Ese era el agujero — Transporte Gav
      // recibió el mail de "activá tu suscripción $50.000" siendo socia.
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

        // El rubro declarado. Ya se validó arriba que viene alguno; acá se
        // resuelve contra la base y se engancha a la ficha.
        const categoriaId = await resolverCategoriaDelParticular(
          supabaseAdmin,
          servicioDelParticular!,
          instanceId,
          prov.id
        )

        if (!categoriaId) {
          console.error('[register-sync] no se pudo enganchar el servicio del particular:', email)
          return NextResponse.json(
            { error: 'No pudimos guardar el servicio que elegiste. Probá de nuevo.' },
            { status: 500 }
          )
        }

        const { error: pivoteError } = await supabaseAdmin
          .from('proveedores_categorias')
          .insert({ proveedor_id: prov.id, categoria_id: categoriaId })

        if (pivoteError) {
          console.error('[register-sync] falló el pivote de servicios:', pivoteError.message)
          return NextResponse.json(
            { error: 'No pudimos guardar el servicio que elegiste. Probá de nuevo.' },
            { status: 500 }
          )
        }
      } else {
        console.error("Error creating provider:", provError)
        return NextResponse.json({ error: 'Error al registrar al proveedor.' }, { status: 500 })
      }
    }

    // 2.b Empresa del padrón → solicitud de alta de socia.
    //
    // Es el pedido literal de la UIAB: que quien ya está en el padrón y se
    // registra por /register termine en el mismo lugar que si hubiera entrado por
    // /sumate, con todos sus datos, en vez de en el circuito de pago. La fila
    // aparece en /admin/altas y el botón "Dar acceso" hace el resto.
    if (role === 'company' && vieneDelPadron) {
      try {
        // Anti-duplicado: si ya hay una solicitud abierta de esta empresa (por
        // /sumate o por un intento previo), no apilamos otra.
        // `limit(1)` y no `maybeSingle()`: con dos solicitudes abiertas del mismo
        // correo, maybeSingle tira error y el catch de abajo se comería el alta
        // en silencio, que es justo lo que no queremos.
        const { data: altasAbiertas } = await supabaseAdmin
          .from('altas_socios')
          .select('id')
          .ilike('email', email)
          .in('estado', ['pendiente', 'contactado'])
          .limit(1)

        if (!altasAbiertas || altasAbiertas.length === 0) {
          const { error: altaErr } = await supabaseAdmin.from('altas_socios').insert({
            razon_social: razonSocial || fichaPadron?.razon_social || 'Sin razón social',
            nombre_comercial: nombreComercial || null,
            cuit: cuit || null,
            actividad: descripcion || null,
            categoria: 'empresa_socia',
            // Lo dice la ficha del padrón, no el formulario: en /register nadie
            // declara ser socio. Con empate no hay ficha de la que leerlo, así
            // que queda en false y lo decide el admin.
            ya_es_socio: Boolean(fichaPadron?.es_socia_uiab),
            n_socio: fichaPadron?.n_socio || null,
            referente_nombre: fullName,
            email,
            telefono: telefono || null,
            sitio_web: sitioWebNormalizado || null,
            localidad: localidad || null,
            direccion: direccion || null,
            mensaje: [
              'Se registró por /register y el sistema la reconoció en el padrón.',
              fichaPadron
                ? `Coincidencia por ${fichaPadron.coincidencia === 'cuit' ? 'CUIT' : fichaPadron.coincidencia === 'nombre' ? 'nombre' : 'nombre parcial — CONFIRMAR que es la misma empresa'}: "${fichaPadron.razon_social ?? ''}".`
                : 'Más de una ficha del padrón coincide: hay que elegir a mano cuál corresponde.',
              provincia ? `Provincia declarada: ${provincia}.` : null,
            ]
              .filter(Boolean)
              .join(' '),
            estado: 'pendiente',
            // Con match parcial o ambiguo NO se pre-vincula la ficha: que la elija
            // un humano. Con CUIT o nombre exacto viene resuelta.
            empresa_id:
              fichaPadron && fichaPadron.coincidencia !== 'nombre_parcial' ? fichaPadron.id : null,
            origen: 'registro_web',
          })
          if (altaErr) {
            console.error('[register-sync] No se pudo crear la solicitud de alta:', altaErr.message)
          }
        }
      } catch (err) {
        console.error('[register-sync] error creando la solicitud de alta:', err)
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
        // Cuando la empresa ya está en el padrón no hay ninguna ficha nueva que
        // aprobar: lo que quedó es una solicitud de alta de socia, y se resuelve
        // en /admin/altas con "Dar acceso". El mail decía "nueva empresa
        // pendiente de revisión" y mandaba a /admin/empresas, donde no aparecía
        // nada — así se perdieron dos altas de Roll Paper el 2026-08-05.
        urlPanelAdmin: quedaPendienteDeHabilitacion ? `${appUrl()}/admin/altas` : urlPanelAdmin,
        vinculacionAFichaExistente: quedaPendienteDeHabilitacion
          ? {
              empresa:
                fichaPadron?.razon_social || razonSocial || 'una ficha del padrón',
              ...(fichaPadron?.coincidencia === 'nombre_parcial'
                ? { advertencia: 'La coincidencia es por nombre parecido, no por CUIT: confirmá que sea la misma empresa antes de dar el acceso.' }
                : {}),
              ...(padronAmbiguo
                ? { advertencia: 'Más de una ficha del padrón coincide con estos datos: elegí a mano cuál corresponde.' }
                : {}),
            }
          : undefined,
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
    //
    //    Sólo corre para altas nuevas: si `vieneDelPadron`, no hay `entityId` y
    //    acá no pasa nada. A una empresa del padrón no se le cobra ni se le manda
    //    el mail de "activá tu suscripción"; la cortesía se la pone
    //    `crearCuentaDesdeAlta` cuando el admin le da el acceso.
    try {
      if (entityId && (role === 'company' || role === 'provider')) {
        const sinCargo = esPrueba
        // El monto es plano: no depende del rol, los empleados ni la tarifa.
        const monto = calcularMontoMensual()

        await supabaseAdmin.from('suscripciones').insert({
          empresa_id: role === 'company' ? entityId : null,
          proveedor_id: role === 'provider' ? entityId : null,
          monto: sinCargo ? 0 : monto,
          moneda: 'ARS',
          nombre_plan: esPrueba ? 'Cortesía (prueba)' : nombrePlan(),
          estado: sinCargo ? 'activa' : 'pendiente_pago',
          metodo_pago: sinCargo ? 'cortesia' : 'mercadopago',
          notas_admin: esPrueba ? 'Registro de prueba (Acceso gratis).' : null,
        })

        if (!sinCargo) {
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

    console.log(
      `[register-sync] Registro completado: ${role} (${fullName}) → ` +
        (quedaPendienteDeHabilitacion
          ? `reconocida en el padrón (${fichaPadron?.coincidencia ?? 'empate'}), solicitud de alta creada, ACCESO EN ESPERA`
          : 'pendiente de revisión + pendiente_pago')
    )

    // `enEspera` le dice al front que no intente entrar: la cuenta quedó baneada
    // a propósito y el auto-login fallaría con un error críptico en inglés.
    return NextResponse.json({ success: true, enEspera: quedaPendienteDeHabilitacion })
  } catch (err: unknown) {
    console.error('Registration API Error:', err)
    return NextResponse.json({ error: 'Error interno de backend al procesar la integración profunda.' }, { status: 500 })
  }
}

/**
 * Devuelve el id de la categoría que declaró el particular, creándola si hace
 * falta. `null` si no se pudo resolver.
 *
 * El texto libre se deduplica por slug contra TODO el catálogo (oficial y
 * propuestas de otros socios) antes de crear nada: si dos personas escriben
 * "reparación de compresores" con distinta puntuación, comparten la misma
 * entrada en vez de generar dos casi iguales.
 *
 * Lo que se crea acá queda como propuesta, no como catálogo oficial: el nombre
 * lo escribió alguien de afuera y todavía no lo miró nadie. El admin lo sube —y
 * lo normaliza— desde /admin/proveedores o /admin/servicios.
 */
async function resolverCategoriaDelParticular(
  supabaseAdmin: ClienteAdmin,
  servicio: ServicioDelRegistro,
  perfilId: string,
  proveedorId: string
): Promise<string | null> {
  if (servicio.tipo === 'falta') return null

  if (servicio.tipo === 'catalogo') {
    const { data } = await supabaseAdmin
      .from('categorias')
      .select('id')
      .eq('id', servicio.categoriaId)
      .maybeSingle()
    return (data?.id as string) ?? null
  }

  const { data: existentes } = await supabaseAdmin.from('categorias').select('id, nombre, slug')
  const yaEsta = ((existentes ?? []) as { id: string; nombre: string; slug: string }[]).find(
    (c) => c.slug === servicio.slug || slugEspecialidad(c.nombre) === servicio.slug
  )
  if (yaEsta) return yaEsta.id

  const { data: creada, error } = await supabaseAdmin
    .from('categorias')
    .insert({
      nombre: servicio.nombre,
      slug: servicio.slug,
      activa: true,
      administrado_por_admin: false,
      creado_por: perfilId,
      creado_por_proveedor: proveedorId,
    })
    .select('id')
    .single()

  if (error) {
    // 23505: dos personas escribieron lo mismo a la vez. Gana la que entró.
    if (error.code === '23505') {
      const { data: ganadora } = await supabaseAdmin
        .from('categorias')
        .select('id')
        .eq('slug', servicio.slug)
        .maybeSingle()
      return (ganadora?.id as string) ?? null
    }
    console.error('[register-sync] no se pudo crear la especialidad libre:', error.message)
    return null
  }

  return (creada?.id as string) ?? null
}
