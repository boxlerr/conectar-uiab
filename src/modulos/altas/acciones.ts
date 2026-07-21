"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appUrl, emailAdmin, enviarEmail } from "@/lib/email/cliente";
import { escapeText, renderEmailBase } from "@/lib/email/plantillas";
import { CATEGORIAS_ALTA, type AltaSocioInput } from "./constantes";
import { generarYEnviarInvitacion } from "./invitaciones-core";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CATEGORIA_VALUES = CATEGORIAS_ALTA.map((c) => c.value) as [string, ...string[]];

// ─── Validación ────────────────────────────────────────────────────────────────

const AltaSchema = z.object({
  razon_social: z.string().trim().min(2, "Ingresá la razón social").max(160),
  nombre_comercial: z.string().trim().max(160).optional().or(z.literal("")),
  cuit: z.string().trim().max(20).optional().or(z.literal("")),
  actividad: z.string().trim().max(300).optional().or(z.literal("")),
  categoria: z.enum(CATEGORIA_VALUES),
  ya_es_socio: z.boolean().default(false),
  n_socio: z.string().trim().max(40).optional().or(z.literal("")),
  referente_nombre: z.string().trim().min(2, "Ingresá el nombre del referente").max(120),
  referente_cargo: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email("Email inválido").max(160),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  sitio_web: z.string().trim().max(160).optional().or(z.literal("")),
  localidad: z.string().trim().max(120).optional().or(z.literal("")),
  direccion: z.string().trim().max(200).optional().or(z.literal("")),
  mensaje: z.string().trim().max(1000).optional().or(z.literal("")),
}).refine((d) => d.ya_es_socio === true, {
  message:
    "Este formulario es exclusivo para organizaciones socias de la UIAB. Si no sos socio, podés crear tu cuenta desde el registro.",
  path: ["ya_es_socio"],
});

function limpiar(v: string | undefined | null): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

// Deja solo los dígitos del CUIT ("30-12345678-9" → "30123456789").
// Con menos de 8 dígitos devuelve null para evitar matches basura con strings cortos.
function normalizarCuit(v: string | null | undefined): string | null {
  const digitos = (v ?? "").replace(/\D/g, "");
  return digitos.length < 8 ? null : digitos;
}

// ─── Acción pública: enviar el formulario ──────────────────────────────────────

export async function enviarAltaSocio(input: AltaSocioInput) {
  const parsed = AltaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  const db = adminClient();

  // Anti-duplicado suave: si ya hay una solicitud reciente con el mismo email y
  // razón social en estado pendiente, no creamos otra.
  const { data: existente } = await db
    .from("altas_socios")
    .select("id")
    .eq("email", d.email)
    .ilike("razon_social", d.razon_social)
    .eq("estado", "pendiente")
    .maybeSingle();

  if (existente) {
    return {
      success: true,
      duplicado: true as const,
      mensaje: "Ya recibimos tu solicitud. El equipo de UIAB se va a contactar a la brevedad.",
    };
  }

  const { error } = await db.from("altas_socios").insert({
    razon_social: d.razon_social.trim(),
    nombre_comercial: limpiar(d.nombre_comercial),
    cuit: limpiar(d.cuit),
    actividad: limpiar(d.actividad),
    categoria: d.categoria,
    ya_es_socio: d.ya_es_socio,
    n_socio: limpiar(d.n_socio),
    referente_nombre: d.referente_nombre.trim(),
    referente_cargo: limpiar(d.referente_cargo),
    email: d.email,
    telefono: limpiar(d.telefono),
    sitio_web: limpiar(d.sitio_web),
    localidad: limpiar(d.localidad),
    direccion: limpiar(d.direccion),
    mensaje: limpiar(d.mensaje),
  });

  if (error) return { error: "No pudimos guardar tu solicitud. Probá de nuevo en un momento." };

  const nombre = d.nombre_comercial?.trim() || d.razon_social.trim();
  const categoriaLabel =
    CATEGORIAS_ALTA.find((c) => c.value === d.categoria)?.label ?? d.categoria;

  // Email de confirmación al referente (no bloquea el flujo si falla)
  await enviarEmail({
    para: d.email,
    asunto: "Recibimos tus datos — UIAB Conecta",
    html: renderEmailBase({
      preheader: "Tu empresa está un paso más cerca de sumarse a UIAB Conecta.",
      titulo: "¡Recibimos tus datos!",
      intro: `Hola ${d.referente_nombre.trim()}, gracias por completar el formulario de ${nombre}.`,
      cuerpo: `
        <p style="margin:0 0 16px 0;">El equipo de la Unión Industrial de Almirante Brown va a revisar la información y se va a contactar con vos para activar el acceso de tu empresa a <strong>UIAB Conecta</strong>.</p>
        <p style="margin:0;">Categoría seleccionada: <strong>${categoriaLabel}</strong>.</p>
      `,
      cta: { etiqueta: "Conocé el directorio", href: `${appUrl()}/directorio` },
      pie: "Si no completaste este formulario, podés ignorar este correo.",
    }),
    texto: `Hola ${d.referente_nombre.trim()}, recibimos los datos de ${nombre}. El equipo de UIAB se va a contactar para activar el acceso.`,
  });

  // Notificación al admin
  await enviarEmail({
    para: emailAdmin(),
    asunto: `Nueva alta de socio: ${nombre}`,
    html: renderEmailBase({
      preheader: `${nombre} completó el formulario de alta.`,
      titulo: "Nueva solicitud de alta",
      intro: `${nombre} (${categoriaLabel}) cargó sus datos en /sumate.`,
      // `cuerpo` se interpola crudo en la plantilla: todo esto viene del
      // formulario público /sumate, así que va escapado sí o sí.
      cuerpo: `
        <p style="margin:0 0 8px 0;"><strong>Referente:</strong> ${escapeText(d.referente_nombre.trim())}${d.referente_cargo ? " · " + escapeText(d.referente_cargo.trim()) : ""}</p>
        <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${escapeText(d.email)}</p>
        ${d.telefono ? `<p style="margin:0 0 8px 0;"><strong>Teléfono:</strong> ${escapeText(d.telefono.trim())}</p>` : ""}
        ${d.localidad ? `<p style="margin:0 0 8px 0;"><strong>Localidad:</strong> ${escapeText(d.localidad.trim())}</p>` : ""}
        ${d.ya_es_socio ? `<p style="margin:0 0 8px 0;"><strong>Ya es socio</strong>${d.n_socio ? " (N° " + escapeText(d.n_socio.trim()) + ")" : ""}</p>` : ""}
      `,
      cta: { etiqueta: "Revisar en el panel", href: `${appUrl()}/admin/altas` },
    }),
    texto: `Nueva alta: ${nombre} — ${d.email}. Revisar en ${appUrl()}/admin/altas`,
  });

  revalidatePath("/sumate");
  revalidatePath("/admin/altas");
  revalidatePath("/admin");

  return { success: true as const };
}

// ─── Acciones de admin ──────────────────────────────────────────────────────────

const ESTADOS_ALTA = ["pendiente", "contactado", "cuenta_creada", "descartado"] as const;

export async function actualizarEstadoAlta(id: string, estado: string) {
  if (!ESTADOS_ALTA.includes(estado as (typeof ESTADOS_ALTA)[number])) {
    return { error: "Estado no válido" };
  }
  const { error } = await adminClient()
    .from("altas_socios")
    .update({ estado })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/altas");
  revalidatePath("/admin");
  return { success: true };
}

export async function vincularEmpresaAlta(id: string, empresaId: string | null) {
  const { error } = await adminClient()
    .from("altas_socios")
    .update({ empresa_id: empresaId })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/altas");
  return { success: true };
}

export async function eliminarAlta(id: string) {
  const { error } = await adminClient().from("altas_socios").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/altas");
  revalidatePath("/admin");
  return { success: true };
}

// ─── Crear cuenta y dar acceso a partir de una solicitud de alta ────────────────
//
// Hace TODO el onboarding de un socio en un paso:
//  1. Crea (o reutiliza) el usuario de Supabase Auth.
//  2. Crea/actualiza su perfil con el rol correcto.
//  3. Vincula a la empresa/proveedor: si ya existe en el padrón (match por CUIT
//     o por empresa_id ya seteado) lo reutiliza; si no, la crea aprobada.
//  4. Le manda un email branded para que defina su contraseña.
//  5. Marca la solicitud como 'cuenta_creada'.

const CATEGORIA_SOCIO_MAP: Record<string, string | undefined> = {
  empresa_socia: undefined, // usa el default de la tabla (proveedores_servicios_productos)
  entidad_financiera: "instituciones_bancarias",
  entidad_educativa: "instituciones_educativas",
  cooperativa: "cooperativas",
};

export async function crearCuentaDesdeAlta(altaId: string) {
  const db = adminClient();

  const { data: alta, error: altaErr } = await db
    .from("altas_socios")
    .select("*")
    .eq("id", altaId)
    .single();
  if (altaErr || !alta) return { error: "No se encontró la solicitud." };
  if (alta.estado === "cuenta_creada") {
    return { error: "Esta empresa ya tiene una cuenta creada." };
  }

  const email: string = alta.email;
  const esProveedor = alta.categoria === "prestador_servicios";
  const rol = esProveedor ? "provider" : "company";

  // 1. ¿Ya existe un perfil con ese email? (= ya tiene cuenta)
  const { data: perfilExistente } = await db
    .from("perfiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  let userId: string | null = perfilExistente?.id ?? null;

  if (!userId) {
    // Usuario nuevo → lo creamos ya confirmado, sin contraseña. La contraseña la
    // define el propio socio con el link de invitación (token propio, válido 30
    // días — ver invitaciones-core), no con el link nativo de Supabase que vence.
    const { data: creado, error: crearErr } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nombre_completo: alta.referente_nombre },
    });
    if (crearErr || !creado?.user?.id) {
      const yaExiste = /already|registrad|registered|exist/i.test(crearErr?.message ?? "");
      return {
        error: yaExiste
          ? "Ya existe un usuario de Auth con ese email pero sin perfil. Resolvelo a mano antes de dar acceso."
          : `No se pudo crear el usuario: ${crearErr?.message ?? "error desconocido"}`,
      };
    }
    userId = creado.user.id;
  }

  if (!userId) return { error: "No se pudo resolver el usuario." };

  // Rol también en app_metadata (no rompe el flujo si falla).
  try {
    await db.auth.admin.updateUserById(userId, { app_metadata: { role: rol } });
  } catch {
    /* el rol real lo manda perfiles.rol_sistema */
  }

  // 2. Perfil (upsert por id).
  const { error: perfErr } = await db.from("perfiles").upsert(
    {
      id: userId,
      email,
      nombre_completo: alta.referente_nombre,
      rol_sistema: rol,
      telefono: alta.telefono ?? null,
      activo: true,
    },
    { onConflict: "id" }
  );
  if (perfErr) return { error: `Error creando el perfil: ${perfErr.message}` };

  // 3. Entidad + membresía.
  let empresaIdFinal: string | null = alta.empresa_id ?? null;

  if (esProveedor) {
    const { data: prov, error: provErr } = await db
      .from("proveedores")
      .insert({
        nombre: alta.referente_nombre,
        razon_social: alta.razon_social,
        nombre_comercial: alta.nombre_comercial ?? null,
        cuit: alta.cuit ?? null,
        tipo_proveedor: "particular",
        estado: "aprobado",
        email,
        telefono: alta.telefono ?? null,
        sitio_web: alta.sitio_web ?? null,
        localidad: alta.localidad ?? null,
        direccion: alta.direccion ?? null,
        descripcion: alta.actividad ?? null,
      })
      .select("id")
      .single();
    if (provErr) return { error: `Error creando el proveedor: ${provErr.message}` };
    await db.from("miembros_proveedor").insert({
      proveedor_id: prov.id,
      perfil_id: userId,
      rol: "gestor",
      es_principal: true,
    });
  } else {
    // Empresa: reutilizar la del padrón si ya está vinculada o si matchea por CUIT.
    // El padrón tiene CUITs con formatos mixtos (con y sin guiones), así que el
    // match se hace normalizando a solo dígitos de los dos lados.
    const cuitAlta = normalizarCuit(alta.cuit);
    if (!empresaIdFinal && cuitAlta) {
      const { data: candidatas } = await db
        .from("empresas")
        .select("id, cuit")
        .not("cuit", "is", null);
      const coincidencias = (candidatas ?? []).filter(
        (e) => normalizarCuit(e.cuit) === cuitAlta
      );
      // Si hay más de una coincidencia es un CUIT duplicado en el padrón:
      // no vinculamos ninguna y dejamos que el admin lo resuelva a mano.
      if (coincidencias.length === 1) empresaIdFinal = coincidencias[0].id;
    }

    if (!empresaIdFinal) {
      const { data: emp, error: empErr } = await db
        .from("empresas")
        .insert({
          razon_social: alta.razon_social,
          nombre_comercial: alta.nombre_comercial ?? null,
          cuit: alta.cuit ?? null,
          estado: "aprobada",
          email,
          telefono: alta.telefono ?? null,
          sitio_web: alta.sitio_web ?? null,
          localidad: alta.localidad ?? null,
          direccion: alta.direccion ?? null,
          descripcion: alta.actividad ?? null,
          n_socio: alta.n_socio ?? null,
          categoria_socio: CATEGORIA_SOCIO_MAP[alta.categoria],
        })
        .select("id")
        .single();
      if (empErr) return { error: `Error creando la empresa: ${empErr.message}` };
      empresaIdFinal = emp.id;
    } else {
      // Completar datos faltantes de la ficha existente (email/teléfono suelen ser NULL en el padrón).
      await db
        .from("empresas")
        .update({
          email: alta.email,
          telefono: alta.telefono ?? null,
          sitio_web: alta.sitio_web ?? null,
        })
        .eq("id", empresaIdFinal)
        .is("email", null);
    }

    // Membresía (evitar duplicado).
    const { data: yaMiembro } = await db
      .from("miembros_empresa")
      .select("id")
      .eq("empresa_id", empresaIdFinal)
      .eq("perfil_id", userId)
      .maybeSingle();
    if (!yaMiembro) {
      await db.from("miembros_empresa").insert({
        empresa_id: empresaIdFinal,
        perfil_id: userId,
        rol: "gestor",
        es_principal: true,
      });
    }
  }

  // 4. Invitación para definir contraseña (token propio, válido 30 días, single-use).
  const inv = await generarYEnviarInvitacion({
    perfilId: userId,
    email,
    referenteNombre: alta.referente_nombre,
    nombreEmpresa: alta.nombre_comercial || alta.razon_social,
  });

  // 5. Marcar la solicitud.
  await db
    .from("altas_socios")
    .update({ estado: "cuenta_creada", empresa_id: empresaIdFinal })
    .eq("id", altaId);

  revalidatePath("/admin/altas");
  revalidatePath("/admin");

  return {
    success: true as const,
    emailEnviado: inv.ok,
    emailError: inv.ok ? undefined : inv.error,
    reutilizada: !!alta.empresa_id || (!esProveedor && !!empresaIdFinal && empresaIdFinal !== null),
    empresaId: empresaIdFinal,
  };
}
