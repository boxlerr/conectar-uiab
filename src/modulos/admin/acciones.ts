"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createClienteSSR } from "@/lib/supabase/servidor";
import { revalidatePath } from "next/cache";
import { NivelTarifa } from "@/tipos";
import { crearSlug } from "@/lib/utilidades";
import { exigirAdmin } from "@/lib/autenticacion/exigir-admin";
import { limpiarNombreEtiqueta, slugEtiqueta } from "@/modulos/compartido/etiquetas";
import { appUrl, enviarEmail } from "@/lib/email/cliente";
import {
  plantillaAccesoHabilitado,
  plantillaAprobacion,
  plantillaRechazo,
  plantillaResenaAprobada,
  plantillaResenaRechazada,
  plantillaResenaRecibida,
} from "@/lib/email/plantillas";
import { crearNotificacion } from "@/modulos/notificaciones/acciones";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}


// ─── Empresas ────────────────────────────────────────────────────────────────

/**
 * Envuelve la notificación por email para que nunca rompa el flujo del
 * server action. Si Resend falla o no hay API key, se loguea y se sigue.
 */
async function notificarAprobacion(
  tipo: "empresa" | "particular",
  destinatario: string | null | undefined,
  nombre: string
) {
  if (!destinatario) return;
  const plantilla = plantillaAprobacion({
    tipo,
    nombre,
    urlBienvenida: `${appUrl()}/bienvenido`,
  });
  await enviarEmail({
    para: destinatario,
    asunto: plantilla.asunto,
    html: plantilla.html,
    texto: plantilla.texto,
  });
}

async function notificarRechazo(
  tipo: "empresa" | "particular",
  destinatario: string | null | undefined,
  nombre: string,
  motivo: string
) {
  if (!destinatario) return;
  const plantilla = plantillaRechazo({
    tipo,
    nombre,
    motivo,
    urlContacto: `${appUrl()}/contacto`,
  });
  await enviarEmail({
    para: destinatario,
    asunto: plantilla.asunto,
    html: plantilla.html,
    texto: plantilla.texto,
  });
}

export async function aprobarEmpresa(empresaId: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();
  const { data: empresa, error } = await db
    .from("empresas")
    .update({ estado: "aprobada", aprobada_en: new Date().toISOString() })
    .eq("id", empresaId)
    .select("email, razon_social, nombre_comercial")
    .single();
  if (error) return { error: error.message };

  await notificarAprobacion(
    "empresa",
    empresa?.email,
    empresa?.nombre_comercial || empresa?.razon_social || "Empresa"
  );

  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarEmpresa(empresaId: string, motivo: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();
  const { data: empresa, error } = await db
    .from("empresas")
    .update({ estado: "rechazada", motivo_rechazo: motivo })
    .eq("id", empresaId)
    .select("email, razon_social, nombre_comercial")
    .single();
  if (error) return { error: error.message };

  await notificarRechazo(
    "empresa",
    empresa?.email,
    empresa?.nombre_comercial || empresa?.razon_social || "Empresa",
    motivo
  );

  revalidatePath("/admin/empresas");
  revalidatePath("/admin");
  return { success: true };
}

export async function asignarTarifa(empresaId: string, tarifa: NivelTarifa) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("empresas")
    .update({ tarifa })
    .eq("id", empresaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/suscripciones");
  return { success: true };
}

export async function actualizarPrecioTarifa(nivel: 1 | 2 | 3, precioMensual: number, vigenteHasta?: string | null) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  if (!Number.isFinite(precioMensual) || precioMensual <= 0) {
    return { error: "Precio inválido" };
  }
  const update: Record<string, unknown> = {
    precio_mensual: precioMensual,
    actualizado_en: new Date().toISOString(),
  };
  if (vigenteHasta !== undefined) update.vigente_hasta = vigenteHasta;

  const { error } = await adminClient()
    .from("tarifas_precios")
    .update(update)
    .eq("nivel", nivel);
  if (error) return { error: error.message };
  revalidatePath("/admin/suscripciones");
  revalidatePath("/admin");
  revalidatePath("/perfil/suscripcion");
  return { success: true };
}

export async function actualizarCantidadEmpleados(empresaId: string, cantidad: number | null) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("empresas")
    .update({ cantidad_empleados: cantidad })
    .eq("id", empresaId);
  if (error) return { error: error.message };
  revalidatePath("/admin/suscripciones");
  return { success: true };
}

export async function actualizarSuscripcionParticular(
  proveedorId: string,
  datos: { estado?: string; monto?: number }
) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();

  const { data: sus } = await db
    .from("suscripciones")
    .select("id")
    .eq("proveedor_id", proveedorId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sus) {
    const { error: insertError } = await db.from("suscripciones").insert({
      proveedor_id: proveedorId,
      estado: datos.estado ?? "activa",
      monto: datos.monto ?? 0,
    });
    if (insertError) return { error: insertError.message };
  } else {
    const update: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
    if (datos.estado !== undefined) update.estado = datos.estado;
    if (datos.monto !== undefined) update.monto = datos.monto;

    const { error } = await db.from("suscripciones").update(update).eq("id", sus.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/suscripciones");
  revalidatePath("/perfil/suscripcion");
  return { success: true };
}

// ─── Proveedores ─────────────────────────────────────────────────────────────

export async function aprobarProveedor(proveedorId: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();
  const { data: prov, error } = await db
    .from("proveedores")
    .update({ estado: "aprobado", aprobado_en: new Date().toISOString() })
    .eq("id", proveedorId)
    .select("email, nombre, apellido, nombre_comercial, razon_social")
    .single();
  if (error) return { error: error.message };

  const nombre =
    prov?.nombre_comercial ||
    [prov?.nombre, prov?.apellido].filter(Boolean).join(" ") ||
    prov?.razon_social ||
    "Particular";
  await notificarAprobacion("particular", prov?.email, nombre);

  revalidatePath("/admin/proveedores");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarProveedor(proveedorId: string, motivo: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();
  const { data: prov, error } = await db
    .from("proveedores")
    .update({ estado: "rechazado", motivo_rechazo: motivo })
    .eq("id", proveedorId)
    .select("email, nombre, apellido, nombre_comercial, razon_social")
    .single();
  if (error) return { error: error.message };

  const nombre =
    prov?.nombre_comercial ||
    [prov?.nombre, prov?.apellido].filter(Boolean).join(" ") ||
    prov?.razon_social ||
    "Particular";
  await notificarRechazo("particular", prov?.email, nombre, motivo);

  revalidatePath("/admin/proveedores");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Reseñas ─────────────────────────────────────────────────────────────────

export async function aprobarResena(resenaId: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();

  const { data: resena, error: fetchError } = await db
    .from("resenas")
    .select(`
      id, calificacion, comentario, creada_por,
      empresa_autora_id, proveedor_autor_id,
      empresa_resenada_id, proveedor_resenado_id,
      empresa_autora:empresa_autora_id(email, razon_social, nombre_comercial),
      proveedor_autor:proveedor_autor_id(email, nombre, apellido, nombre_comercial),
      empresa_resenada:empresa_resenada_id(email, razon_social, nombre_comercial),
      proveedor_resenado:proveedor_resenado_id(email, nombre, apellido)
    `)
    .eq("id", resenaId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error } = await db
    .from("resenas")
    .update({ estado: "aprobada", moderada_en: new Date().toISOString() })
    .eq("id", resenaId);
  if (error) return { error: error.message };

  type EmpresaInfo = { email: string; razon_social: string; nombre_comercial?: string } | null;
  type ProveedorInfo = { email: string; nombre: string; apellido?: string; nombre_comercial?: string } | null;
  type EmpresaResenadaInfo = { email: string; razon_social: string; nombre_comercial?: string } | null;
  type ProveedorResenadoInfo = { email: string; nombre: string; apellido?: string } | null;

  // Supabase returns objects for FK joins but TS infers arrays; cast via unknown
  const empresaAutora = (resena.empresa_autora as unknown) as EmpresaInfo;
  const proveedorAutor = (resena.proveedor_autor as unknown) as ProveedorInfo;
  const empresaResenada = (resena.empresa_resenada as unknown) as EmpresaResenadaInfo;
  const proveedorResenado = (resena.proveedor_resenado as unknown) as ProveedorResenadoInfo;

  const nombreAutor = empresaAutora
    ? (empresaAutora.nombre_comercial || empresaAutora.razon_social)
    : proveedorAutor
    ? (proveedorAutor.nombre_comercial || [proveedorAutor.nombre, proveedorAutor.apellido].filter(Boolean).join(" "))
    : "Autor";

  const emailAutor = empresaAutora?.email ?? proveedorAutor?.email ?? null;

  const nombreDestinatario = empresaResenada
    ? (empresaResenada.nombre_comercial || empresaResenada.razon_social)
    : proveedorResenado
    ? [proveedorResenado.nombre, proveedorResenado.apellido].filter(Boolean).join(" ")
    : "Destinatario";

  const emailDestinatario = empresaResenada?.email ?? proveedorResenado?.email ?? null;

  // URL del perfil del destinatario (para links en los emails)
  const urlPerfilDestinatario = resena.empresa_resenada_id
    ? `${appUrl()}/empresas/${resena.empresa_resenada_id}`
    : resena.proveedor_resenado_id
    ? `${appUrl()}/empresas/${resena.proveedor_resenado_id}`
    : appUrl();

  // Email al autor: su reseña fue aprobada
  if (emailAutor) {
    const plantilla = plantillaResenaAprobada({
      nombreAutor,
      nombreDestinatario,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
      urlPerfil: urlPerfilDestinatario,
    });
    await enviarEmail({ para: emailAutor, asunto: plantilla.asunto, html: plantilla.html, texto: plantilla.texto });
  }

  // Email al destinatario: recibió una nueva reseña
  if (emailDestinatario) {
    const plantilla = plantillaResenaRecibida({
      tipoDestinatario: empresaResenada ? "empresa" : "particular",
      nombreDestinatario,
      nombreAutor,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
      urlPerfil: urlPerfilDestinatario,
    });
    await enviarEmail({ para: emailDestinatario, asunto: plantilla.asunto, html: plantilla.html, texto: plantilla.texto });
  }

  // Notificación in-web al autor (usa creada_por como perfil_id)
  if (resena.creada_por) {
    await crearNotificacion({
      perfilId: resena.creada_por,
      tipo: "resena_aprobada",
      titulo: "Tu reseña fue publicada",
      mensaje: `Tu reseña sobre ${nombreDestinatario} está ahora visible en el directorio.`,
      url: urlPerfilDestinatario,
    });
  }

  // Notificaciones in-web a los miembros del destinatario
  if (resena.empresa_resenada_id) {
    const { data: miembros } = await db
      .from("miembros_empresa")
      .select("perfil_id")
      .eq("empresa_id", resena.empresa_resenada_id);
    for (const m of miembros ?? []) {
      await crearNotificacion({
        perfilId: m.perfil_id,
        tipo: "resena_recibida",
        titulo: "Recibiste una nueva reseña",
        mensaje: `${nombreAutor} publicó una reseña sobre ${nombreDestinatario} (${resena.calificacion}/5 estrellas).`,
        url: urlPerfilDestinatario,
      });
    }
  } else if (resena.proveedor_resenado_id) {
    const { data: miembros } = await db
      .from("miembros_proveedor")
      .select("perfil_id")
      .eq("proveedor_id", resena.proveedor_resenado_id);
    for (const m of miembros ?? []) {
      await crearNotificacion({
        perfilId: m.perfil_id,
        tipo: "resena_recibida",
        titulo: "Recibiste una nueva reseña",
        mensaje: `${nombreAutor} publicó una reseña sobre ${nombreDestinatario} (${resena.calificacion}/5 estrellas).`,
        url: urlPerfilDestinatario,
      });
    }
  }

  revalidatePath("/admin/resenas");
  revalidatePath("/admin");
  return { success: true };
}

export async function rechazarResena(resenaId: string, motivo: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const db = adminClient();

  const { data: resena, error: fetchError } = await db
    .from("resenas")
    .select(`
      id, comentario, creada_por,
      empresa_autora_id, proveedor_autor_id,
      empresa_resenada_id, proveedor_resenado_id,
      empresa_autora:empresa_autora_id(email, razon_social, nombre_comercial),
      proveedor_autor:proveedor_autor_id(email, nombre, apellido, nombre_comercial),
      empresa_resenada:empresa_resenada_id(razon_social, nombre_comercial),
      proveedor_resenado:proveedor_resenado_id(nombre, apellido)
    `)
    .eq("id", resenaId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error } = await db
    .from("resenas")
    .update({ estado: "rechazada", motivo_moderacion: motivo, moderada_en: new Date().toISOString() })
    .eq("id", resenaId);
  if (error) return { error: error.message };

  const empresaAutora = (resena.empresa_autora as unknown) as { email: string; razon_social: string; nombre_comercial?: string } | null;
  const proveedorAutor = (resena.proveedor_autor as unknown) as { email: string; nombre: string; apellido?: string; nombre_comercial?: string } | null;
  const empresaResenada = (resena.empresa_resenada as unknown) as { razon_social: string; nombre_comercial?: string } | null;
  const proveedorResenado = (resena.proveedor_resenado as unknown) as { nombre: string; apellido?: string } | null;

  const nombreAutor = empresaAutora
    ? (empresaAutora.nombre_comercial || empresaAutora.razon_social)
    : proveedorAutor
    ? (proveedorAutor.nombre_comercial || [proveedorAutor.nombre, proveedorAutor.apellido].filter(Boolean).join(" "))
    : "Autor";

  const emailAutor = empresaAutora?.email ?? proveedorAutor?.email ?? null;

  const nombreDestinatario = empresaResenada
    ? (empresaResenada.nombre_comercial || empresaResenada.razon_social)
    : proveedorResenado
    ? [proveedorResenado.nombre, proveedorResenado.apellido].filter(Boolean).join(" ")
    : "Destinatario";

  // Email al autor: su reseña fue rechazada
  if (emailAutor) {
    const plantilla = plantillaResenaRechazada({ nombreAutor, nombreDestinatario, motivo });
    await enviarEmail({ para: emailAutor, asunto: plantilla.asunto, html: plantilla.html, texto: plantilla.texto });
  }

  // Notificación in-web al autor
  if (resena.creada_por) {
    await crearNotificacion({
      perfilId: resena.creada_por,
      tipo: "resena_rechazada",
      titulo: "Tu reseña no fue publicada",
      mensaje: `Tu reseña sobre ${nombreDestinatario} no pudo publicarse. Motivo: ${motivo}`,
    });
  }

  revalidatePath("/admin/resenas");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Oportunidades ────────────────────────────────────────────────────────────

export async function cerrarOportunidad(oportunidadId: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("oportunidades")
    .update({ estado: "cerrada" })
    .eq("id", oportunidadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/oportunidades");
  return { success: true };
}

export async function eliminarOportunidad(oportunidadId: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("oportunidades")
    .delete()
    .eq("id", oportunidadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/oportunidades");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Usuarios / Perfiles ──────────────────────────────────────────────────────

export async function toggleActivarUsuario(
  perfilId: string,
  activar: boolean,
  /**
   * Al habilitar, mandarle el correo avisándole que ya puede entrar. Lo decide
   * quien aprieta el botón: si la UIAB ya lo habló por teléfono no hace falta
   * duplicar el aviso, y si pasaron días desde que se registró sí.
   */
  opciones?: { avisarPorEmail?: boolean }
) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  // Antes desactivar era cosmético y auto-desactivarse no tenía consecuencias.
  // Ahora banea de verdad: sin este freno, un admin se deja afuera del panel y
  // sólo se arregla por SQL.
  if (!activar) {
    const ssr = await createClienteSSR();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (user?.id === perfilId) {
      return { error: "No podés desactivar tu propio usuario." };
    }
  }

  const db = adminClient();
  const { error } = await db.from("perfiles").update({ activo: activar }).eq("id", perfilId);
  if (error) return { error: error.message };

  // `perfiles.activo` sólo pintaba un chip: el usuario desactivado seguía
  // entrando lo más bien. El corte real es el ban de Auth (más el rebote del
  // middleware para la sesión que ya estaba abierta).
  //
  // Y al habilitar hay que levantar los DOS frenos. Desde que se prendió
  // "Confirm email" en Supabase, toda cuenta creada por /register nace con
  // `email_confirmed_at` en null: levantarle sólo el ban dejaba el panel
  // diciendo "Activo" mientras a la persona le seguía saliendo "Email not
  // confirmed" en el login. Le pasó a Naves del Sur. Confirmar acá es una
  // decisión deliberada: el admin habilita a alguien que ya verificó por otro
  // lado que trabaja en esa empresa.
  try {
    await db.auth.admin.updateUserById(
      perfilId,
      activar
        ? { ban_duration: "none", email_confirm: true }
        : { ban_duration: "876000h" }
    );
  } catch (e) {
    await db.from("perfiles").update({ activo: !activar }).eq("id", perfilId);
    return {
      error: `No se pudo ${activar ? "activar" : "desactivar"} el acceso: ${
        e instanceof Error ? e.message : "error desconocido"
      }`,
    };
  }

  let emailEnviado = false;
  let emailError: string | undefined;

  if (activar && opciones?.avisarPorEmail) {
    const aviso = await avisarAccesoHabilitado(db, perfilId);
    emailEnviado = aviso.ok;
    emailError = aviso.error;
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/perfil/usuarios");
  return { success: true, emailEnviado, emailError };
}

/**
 * Le avisa por correo a la persona que ya puede entrar.
 *
 * Nunca tira: si el correo falla, el acceso ya quedó habilitado igual y lo que
 * corresponde es contarlo, no deshacerlo. El nombre de la ficha sale de su
 * membresía real (empresa o prestador), que es lo que la persona reconoce —
 * "ya tenés acceso" a secas no le dice a qué.
 */
async function avisarAccesoHabilitado(
  db: ReturnType<typeof adminClient>,
  perfilId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: perfil } = await db
      .from("perfiles")
      .select("email, nombre_completo")
      .eq("id", perfilId)
      .maybeSingle();

    if (!perfil?.email) return { ok: false, error: "El perfil no tiene correo cargado." };

    // `limit(1)` y no `maybeSingle()`: un perfil puede figurar en más de una
    // ficha, y ahí maybeSingle tira error y nos quedamos sin nombre que poner en
    // el asunto del correo.
    const [{ data: me }, { data: mp }] = await Promise.all([
      db
        .from("miembros_empresa")
        .select("empresas:empresa_id(razon_social, nombre_comercial)")
        .eq("perfil_id", perfilId)
        .limit(1),
      db
        .from("miembros_proveedor")
        .select("proveedores:proveedor_id(nombre, razon_social)")
        .eq("perfil_id", perfilId)
        .limit(1),
    ]);

    const emp = (me as { empresas?: { razon_social?: string | null; nombre_comercial?: string | null } | null }[] | null)?.[0]?.empresas;
    const prov = (mp as { proveedores?: { nombre?: string | null; razon_social?: string | null } | null }[] | null)?.[0]?.proveedores;
    const nombreFicha =
      emp?.nombre_comercial || emp?.razon_social || prov?.razon_social || prov?.nombre || "UIAB Conecta";

    const plantilla = plantillaAccesoHabilitado({
      nombre: perfil.nombre_completo || perfil.email,
      empresa: nombreFicha,
      email: perfil.email,
      urlLogin: `${appUrl()}/login`,
      urlRestablecer: `${appUrl()}/recovery`,
    });

    const res = await enviarEmail({
      para: perfil.email,
      asunto: plantilla.asunto,
      html: plantilla.html,
      texto: plantilla.texto,
    });

    if (res.ok) return { ok: true };
    return {
      ok: false,
      error: res.skipped
        ? "No hay SMTP configurado en este entorno, así que el correo no salió."
        : res.error ?? "No se pudo enviar el correo.",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error desconocido" };
  }
}

export async function cambiarRolUsuario(perfilId: string, nuevoRol: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const rolesPermitidos = ["admin", "company", "provider"];
  if (!rolesPermitidos.includes(nuevoRol)) return { error: "Rol no válido" };

  const { error } = await adminClient()
    .from("perfiles")
    .update({ rol_sistema: nuevoRol })
    .eq("id", perfilId);
  if (error) return { error: error.message };
  revalidatePath("/admin/usuarios");
  return { success: true };
}

// ─── Servicios (Categorías) ──────────────────────────────────────────────────

export async function crearCategoria(nombre: string, descripcion: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const slug = crearSlug(nombre);
  const { error } = await adminClient()
    .from("categorias")
    .insert({ nombre, slug, descripcion, activa: true });
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  return { success: true };
}

export async function editarCategoria(id: string, nombre: string, descripcion: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const slug = crearSlug(nombre);
  const { error } = await adminClient()
    .from("categorias")
    .update({ nombre, slug, descripcion })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  return { success: true };
}

export async function toggleActivarCategoria(id: string, activa: boolean) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("categorias")
    .update({ activa })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  return { success: true };
}

/**
 * Sube una especialidad propuesta por un socio al catálogo oficial (o la baja
 * de vuelta). No toca los pivotes: quien ya la tenía elegida la conserva, sólo
 * cambia si el resto de los socios la ve en el picker de /perfil/servicios.
 */
export async function promoverCategoria(id: string, oficial: boolean) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("categorias")
    .update({ administrado_por_admin: oficial })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servicios");
  revalidatePath("/perfil/servicios");
  return { success: true };
}

export async function eliminarCategoria(id: string) {
  const noAutorizado = await exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const { error } = await adminClient()
    .from("categorias")
    .delete()
    .eq("id", id);
  if (error) {
    // FK violation → sugerir desactivar en lugar de eliminar
    if (error.code === "23503" || /foreign key/i.test(error.message)) {
      return {
        error:
          "No se puede eliminar: hay proveedores o empresas vinculados a este servicio. Desactivalo en su lugar.",
      };
    }
    return { error: error.message };
  }
  revalidatePath("/admin/servicios");
  return { success: true };
}

// ─── Etiquetas ───────────────────────────────────────────────────────────────

type ResultadoEtiqueta = { error?: string; success?: boolean };

function revalidarEtiquetas() {
  revalidatePath("/admin/etiquetas");
  revalidatePath("/perfil/etiquetas");
  revalidatePath("/directorio");
  revalidatePath("/empresas");
}

/** Sube una etiqueta propuesta por un socio al catálogo que ven todos. */
export async function promoverEtiqueta(id: string, tipoTag?: string): Promise<ResultadoEtiqueta> {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const cambios: Record<string, unknown> = {
    administrado_por_admin: true,
    activo: true,
    revisada: true,
  };
  if (tipoTag) cambios.tipo_tag = tipoTag;

  const { error } = await adminClient().from("tags").update(cambios).eq("id", id);
  if (error) return { error: error.message };
  revalidarEtiquetas();
  return { success: true };
}

/**
 * Rechaza una etiqueta propuesta: la saca de la cola de "Propuestas" SIN borrarla
 * ni sacarla del padrón general (queda administrado_por_admin=false, activo=true).
 * La socia la sigue viendo en su ficha y sigue contando para el match. Rechazar
 * ≠ eliminar: sólo significa "no la subo al catálogo oficial".
 */
export async function rechazarEtiqueta(id: string): Promise<ResultadoEtiqueta> {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const { error } = await adminClient()
    .from("tags")
    .update({ revisada: true })
    .eq("id", id)
    .eq("administrado_por_admin", false);
  if (error) return { error: error.message };
  revalidarEtiquetas();
  return { success: true };
}

/** Corrige el texto y la clasificación (típicamente antes de promover). */
export async function actualizarEtiqueta(id: string, nombre: string, tipoTag: string): Promise<ResultadoEtiqueta> {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const limpio = limpiarNombreEtiqueta(nombre);
  if (!limpio) return { error: "El nombre no puede estar vacío." };

  const { error } = await adminClient()
    .from("tags")
    .update({ nombre: limpio, slug: slugEtiqueta(limpio), tipo_tag: tipoTag })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe otra etiqueta con ese nombre. Fusionalas en vez de renombrar." };
    }
    return { error: error.message };
  }
  revalidarEtiquetas();
  return { success: true };
}

/**
 * Saca la etiqueta del catálogo sin borrarla.
 * OJO: `fn_calcular_matches_oportunidad` no filtra por `activo`, así que esto
 * la oculta de las pantallas pero NO la saca del algoritmo de match.
 */
export async function toggleActivarEtiqueta(id: string, activo: boolean): Promise<ResultadoEtiqueta> {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const { error } = await adminClient().from("tags").update({ activo }).eq("id", id);
  if (error) return { error: error.message };
  revalidarEtiquetas();
  return { success: true };
}

/**
 * Absorbe `origenId` dentro de `destinoId`: repunta los vínculos de socios,
 * oportunidades e ítems, deja el nombre viejo como alias y borra el origen.
 * Nadie pierde la etiqueta: pasa a figurar con el nombre oficial.
 */
export async function fusionarEtiqueta(origenId: string, destinoId: string): Promise<ResultadoEtiqueta> {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const { error } = await adminClient().rpc("fn_fusionar_tags", {
    p_origen: origenId,
    p_destino: destinoId,
  });
  if (error) return { error: error.message };
  revalidarEtiquetas();
  return { success: true };
}

/**
 * Borra la etiqueta. Los vínculos caen por ON DELETE CASCADE, o sea que
 * desaparece de la ficha de quien la tuviera. No hay vuelta atrás.
 */
export async function eliminarEtiqueta(id: string): Promise<ResultadoEtiqueta> {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const { error } = await adminClient().from("tags").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidarEtiquetas();
  return { success: true };
}
