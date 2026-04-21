/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PLANTILLAS HTML DE CORREO — "The Architectural Ledger"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Guía visual (ver docs/DESIGN.md):
 *   - Primary: #00213f   / Primary container: #10375c   / Tertiary: #001b55
 *   - Texto: on_surface #191c1e (nunca negro puro)
 *   - Superficies en capas tonales, sin bordes de 1px
 *   - Radios DEFAULT (4px) — nada redondeado xl/full
 *   - Tipografía: Inter como workhorse, Manrope para display (fallback system)
 *
 *  Restricciones de email clients:
 *   - Todo el CSS es inline (Gmail/Outlook ignoran <style>)
 *   - Tablas en lugar de flex/grid
 *   - Ancho máximo 600px (regla de oro)
 *   - Dark mode forzado: usamos `color-scheme: light` en el body
 */

export interface DatosBaseCorreo {
  /** Título corto que aparece en la vista previa del inbox (preheader). */
  preheader: string;
  /** Encabezado grande que se muestra arriba del cuerpo. */
  titulo: string;
  /** Texto introductorio bajo el título. */
  intro: string;
  /** HTML del bloque principal (párrafos, listas, datos). */
  cuerpo: string;
  /** CTA principal. Opcional. */
  cta?: { etiqueta: string; href: string };
  /** Nota legal / secundaria al final del cuerpo. */
  pie?: string;
}

const BRAND = {
  primary: "#00213f",
  primaryContainer: "#10375c",
  tertiary: "#001b55",
  onSurface: "#191c1e",
  onSurfaceMuted: "#525b63",
  surface: "#f7f9fb",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f2f4f6",
  surfaceDim: "#d8dadc",
  outlineVariant: "#c0c7ce",
} as const;

/**
 * Envoltorio HTML completo. Recibe el contenido del cuerpo ya renderizado.
 */
export function renderEmailBase(datos: DatosBaseCorreo): string {
  const { preheader, titulo, intro, cuerpo, cta, pie } = datos;

  const bloqueCta = cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0 8px 0;">
        <tr>
          <td align="left" style="border-radius: 4px; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryContainer} 100%);">
            <a href="${escapeAttr(cta.href)}"
               style="display: inline-block; padding: 14px 28px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.02em; color: #ffffff; text-decoration: none; border-radius: 4px;">
              ${escapeText(cta.etiqueta)}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  const bloquePie = pie
    ? `<p style="margin: 28px 0 0 0; padding-top: 20px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: ${BRAND.onSurfaceMuted};">${pie}</p>`
    : "";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeText(titulo)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${BRAND.surfaceLow}; color-scheme: light;">
    <!-- Preheader (oculto pero visible en vista previa del inbox) -->
    <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${BRAND.surfaceLow};">
      ${escapeText(preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND.surfaceLow};">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px;">

            <!-- Encabezado de marca: barra industrial gradient -->
            <tr>
              <td style="padding: 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryContainer} 100%); border-radius: 4px 4px 0 0;">
                  <tr>
                    <td style="padding: 28px 32px;">
                      <div style="font-family: 'Manrope', 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; color: #ffffff;">
                        Conectar <span style="opacity: 0.75; font-weight: 600;">UIAB</span>
                      </div>
                      <div style="margin-top: 2px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.65);">
                        Unión Industrial de Almirante Brown
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Cuerpo del mensaje -->
            <tr>
              <td style="padding: 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND.surfaceLowest}; border-radius: 0 0 4px 4px;">
                  <tr>
                    <td style="padding: 40px 32px 32px 32px;">
                      <h1 style="margin: 0 0 12px 0; font-family: 'Manrope', 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 26px; line-height: 1.25; font-weight: 800; letter-spacing: -0.02em; color: ${BRAND.onSurface};">
                        ${escapeText(titulo)}
                      </h1>
                      <p style="margin: 0 0 24px 0; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: ${BRAND.onSurfaceMuted};">
                        ${intro}
                      </p>
                      <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.65; color: ${BRAND.onSurface};">
                        ${cuerpo}
                      </div>
                      ${bloqueCta}
                      ${bloquePie}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Pie institucional -->
            <tr>
              <td style="padding: 24px 32px 8px 32px;">
                <p style="margin: 0; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.6; letter-spacing: 0.02em; color: ${BRAND.onSurfaceMuted}; text-align: center;">
                  Este mensaje fue enviado por <strong style="color: ${BRAND.onSurface};">Conectar UIAB</strong>, la red profesional de la Unión Industrial de Almirante Brown.<br/>
                  Si recibiste este correo por error, podés ignorarlo con seguridad.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ─── Bloques reutilizables ───────────────────────────────────────────────────

/** Tarjeta de datos clave (etiqueta → valor). Útil para mostrar CUIT, rubro, etc. */
export function tarjetaDatos(
  filas: Array<{ etiqueta: string; valor: string }>
): string {
  const rows = filas
    .map(
      (f) => `
    <tr>
      <td style="padding: 10px 14px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.onSurfaceMuted}; width: 40%; vertical-align: top;">
        ${escapeText(f.etiqueta)}
      </td>
      <td style="padding: 10px 14px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: ${BRAND.onSurface}; vertical-align: top;">
        ${escapeText(f.valor)}
      </td>
    </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND.surfaceLow}; border-radius: 4px; margin: 8px 0 4px 0;">
      ${rows}
    </table>
  `;
}

/** Chip técnico (rectangular, estilo tag industrial). */
export function chip(texto: string): string {
  return `<span style="display: inline-block; padding: 4px 10px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND.tertiary}; background-color: #e6ebf2; border-radius: 2px;">${escapeText(
    texto
  )}</span>`;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function escapeText(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeText(s);
}

// ─── Plantillas concretas ────────────────────────────────────────────────────

export type TipoEntidad = "empresa" | "particular";

export interface DatosNotificacionAdmin {
  tipo: TipoEntidad;
  nombre: string;
  email: string;
  cuit?: string | null;
  telefono?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  rubro?: string | null;
  urlPanelAdmin: string;
}

/** Notificación al administrador de la UIAB: hay una nueva solicitud pendiente. */
export function plantillaNotificacionAdmin(d: DatosNotificacionAdmin): {
  asunto: string;
  html: string;
  texto: string;
} {
  const etiquetaTipo = d.tipo === "empresa" ? "Nueva empresa" : "Nuevo particular";
  const filas = [
    { etiqueta: "Tipo", valor: d.tipo === "empresa" ? "Empresa" : "Particular / Proveedor" },
    { etiqueta: d.tipo === "empresa" ? "Razón social" : "Nombre", valor: d.nombre },
    { etiqueta: "Email", valor: d.email },
    ...(d.cuit ? [{ etiqueta: "CUIT", valor: d.cuit }] : []),
    ...(d.telefono ? [{ etiqueta: "Teléfono", valor: d.telefono }] : []),
    ...(d.localidad || d.provincia
      ? [
          {
            etiqueta: "Ubicación",
            valor: [d.localidad, d.provincia].filter(Boolean).join(", "),
          },
        ]
      : []),
    ...(d.rubro ? [{ etiqueta: "Rubro", valor: d.rubro }] : []),
  ];

  const cuerpo = `
    <p style="margin: 0 0 12px 0;">Una nueva entidad completó el registro en <strong>Conectar UIAB</strong> y queda en estado <em>pendiente de revisión</em>. Ingresá al panel de administración para revisar los datos y aprobar o rechazar la solicitud.</p>
    ${tarjetaDatos(filas)}
  `;

  return {
    asunto: `${etiquetaTipo} pendiente de revisión — ${d.nombre}`,
    html: renderEmailBase({
      preheader: `${etiquetaTipo}: ${d.nombre} espera tu revisión.`,
      titulo: `${etiquetaTipo} pendiente`,
      intro: "Una solicitud acaba de ingresar a la red y requiere tu aprobación.",
      cuerpo,
      cta: { etiqueta: "Revisar en el panel", href: d.urlPanelAdmin },
      pie: "Recibís esta notificación porque tu cuenta figura como administradora de la red Conectar UIAB.",
    }),
    texto: [
      `${etiquetaTipo} pendiente de revisión — ${d.nombre}`,
      "",
      `Email: ${d.email}`,
      d.cuit ? `CUIT: ${d.cuit}` : "",
      d.telefono ? `Teléfono: ${d.telefono}` : "",
      d.localidad || d.provincia
        ? `Ubicación: ${[d.localidad, d.provincia].filter(Boolean).join(", ")}`
        : "",
      d.rubro ? `Rubro: ${d.rubro}` : "",
      "",
      `Revisá la solicitud: ${d.urlPanelAdmin}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export interface DatosAprobacion {
  tipo: TipoEntidad;
  nombre: string;
  urlBienvenida: string;
}

/** Correo de aprobación: la empresa / particular fue admitido en la red. */
export function plantillaAprobacion(d: DatosAprobacion): {
  asunto: string;
  html: string;
  texto: string;
} {
  const saludo = d.tipo === "empresa" ? "Bienvenida" : "Bienvenido";
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">¡Felicitaciones, <strong>${escapeText(
      d.nombre
    )}</strong>! Tu registro fue revisado y aprobado por el equipo de la Unión Industrial de Almirante Brown. A partir de ahora formás parte oficial de <strong>Conectar UIAB</strong>.</p>

    <p style="margin: 0 0 8px 0; font-weight: 700; color: ${BRAND.onSurface};">Lo que vas a encontrar al ingresar</p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: ${BRAND.onSurface};">
      <li style="margin-bottom: 6px;"><strong>Directorio industrial</strong> con empresas, particulares y proveedores verificados.</li>
      <li style="margin-bottom: 6px;"><strong>Oportunidades comerciales</strong> publicadas por la red para ofertar o captar servicios.</li>
      <li style="margin-bottom: 6px;"><strong>Perfil institucional</strong> para mostrar tu actividad, rubros y datos de contacto.</li>
      <li style="margin-bottom: 6px;"><strong>Capacitaciones y eventos</strong> organizados por la UIAB y sus socios.</li>
    </ul>

    <p style="margin: 0;">Tocá el botón de abajo para ver la página de bienvenida y avanzar a tu panel.</p>
  `;

  return {
    asunto: `${saludo} a Conectar UIAB — Tu registro fue aprobado`,
    html: renderEmailBase({
      preheader: `Tu registro en Conectar UIAB fue aprobado.`,
      titulo: `${saludo} a la red`,
      intro: "Tu solicitud fue revisada y aprobada. Ya podés ingresar a la plataforma.",
      cuerpo,
      cta: { etiqueta: "Acceder a la plataforma", href: d.urlBienvenida },
      pie: "Si no solicitaste este registro, por favor escribinos a soporte@uiab.com.ar para que lo revisemos.",
    }),
    texto: [
      `${saludo} a Conectar UIAB`,
      "",
      `Tu registro como ${d.nombre} fue aprobado.`,
      "",
      "Al ingresar vas a encontrar:",
      "- Directorio industrial verificado",
      "- Oportunidades comerciales de la red",
      "- Perfil institucional",
      "- Capacitaciones y eventos",
      "",
      `Ingresá: ${d.urlBienvenida}`,
    ].join("\n"),
  };
}

export interface DatosResenaAprobada {
  nombreAutor: string;
  nombreDestinatario: string;
  calificacion: number;
  comentario?: string | null;
  urlPerfil: string;
}

/** Correo al autor de la reseña: fue aprobada y publicada. */
export function plantillaResenaAprobada(d: DatosResenaAprobada): {
  asunto: string;
  html: string;
  texto: string;
} {
  const estrellas = "★".repeat(d.calificacion) + "☆".repeat(5 - d.calificacion);
  const bloqueCometario = d.comentario
    ? `<div style="margin: 0 0 16px 0; padding: 16px 18px; background-color: ${BRAND.surfaceLow}; border-radius: 4px; border-left: 3px solid ${BRAND.primary};">
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.onSurface}; font-style: italic;">
          "${escapeText(d.comentario)}"
        </div>
      </div>`
    : "";

  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${escapeText(d.nombreAutor)}</strong>, tu reseña sobre <strong>${escapeText(d.nombreDestinatario)}</strong> fue revisada y aprobada. Ya está publicada en el directorio de <strong>Conectar UIAB</strong>.</p>

    ${tarjetaDatos([
      { etiqueta: "Destinatario", valor: d.nombreDestinatario },
      { etiqueta: "Calificación", valor: `${estrellas} (${d.calificacion}/5)` },
    ])}

    ${bloqueCometario}

    <p style="margin: 0;">Podés ver la reseña publicada en el perfil de <strong>${escapeText(d.nombreDestinatario)}</strong>.</p>
  `;

  return {
    asunto: `Tu reseña sobre ${d.nombreDestinatario} fue publicada — Conectar UIAB`,
    html: renderEmailBase({
      preheader: `Tu reseña sobre ${d.nombreDestinatario} ya está publicada en el directorio.`,
      titulo: "Tu reseña fue publicada",
      intro: "La reseña que enviaste pasó la revisión y ya es visible en el directorio.",
      cuerpo,
      cta: { etiqueta: "Ver perfil", href: d.urlPerfil },
    }),
    texto: [
      `Tu reseña sobre ${d.nombreDestinatario} fue publicada`,
      "",
      `Hola ${d.nombreAutor},`,
      `Tu reseña sobre ${d.nombreDestinatario} (${estrellas}) fue aprobada y ya está publicada.`,
      d.comentario ? `Comentario: "${d.comentario}"` : "",
      "",
      `Ver perfil: ${d.urlPerfil}`,
    ].filter(Boolean).join("\n"),
  };
}

export interface DatosResenaRechazada {
  nombreAutor: string;
  nombreDestinatario: string;
  motivo: string;
}

/** Correo al autor de la reseña: no fue aprobada. */
export function plantillaResenaRechazada(d: DatosResenaRechazada): {
  asunto: string;
  html: string;
  texto: string;
} {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${escapeText(d.nombreAutor)}</strong>, revisamos la reseña que enviaste sobre <strong>${escapeText(d.nombreDestinatario)}</strong> y, por ahora, no pudimos publicarla.</p>

    <div style="margin: 0 0 16px 0; padding: 16px 18px; background-color: ${BRAND.surfaceLow}; border-radius: 4px;">
      <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.onSurfaceMuted}; margin-bottom: 6px;">
        Motivo
      </div>
      <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.onSurface};">
        ${escapeText(d.motivo)}
      </div>
    </div>

    <p style="margin: 0;">Si creés que hubo un error, respondé este correo para que lo revisemos.</p>
  `;

  return {
    asunto: `Tu reseña sobre ${d.nombreDestinatario} no fue publicada — Conectar UIAB`,
    html: renderEmailBase({
      preheader: `Tu reseña sobre ${d.nombreDestinatario} no pasó la revisión.`,
      titulo: "Tu reseña no fue publicada",
      intro: "Revisamos los datos que nos enviaste y queremos compartirte el resultado.",
      cuerpo,
    }),
    texto: [
      `Tu reseña sobre ${d.nombreDestinatario} no fue publicada`,
      "",
      `Hola ${d.nombreAutor},`,
      "No pudimos publicar tu reseña por el siguiente motivo:",
      d.motivo,
    ].join("\n"),
  };
}

export interface DatosResenaRecibida {
  tipoDestinatario: TipoEntidad;
  nombreDestinatario: string;
  nombreAutor: string;
  calificacion: number;
  comentario?: string | null;
  urlPerfil: string;
}

/** Correo a la entidad que recibió una reseña: nueva reseña publicada sobre ellos. */
export function plantillaResenaRecibida(d: DatosResenaRecibida): {
  asunto: string;
  html: string;
  texto: string;
} {
  const estrellas = "★".repeat(d.calificacion) + "☆".repeat(5 - d.calificacion);
  const saludo = d.tipoDestinatario === "empresa" ? "Bienvenida" : "Bienvenida";
  const bloqueCometario = d.comentario
    ? `<div style="margin: 0 0 16px 0; padding: 16px 18px; background-color: ${BRAND.surfaceLow}; border-radius: 4px; border-left: 3px solid ${BRAND.primary};">
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${BRAND.onSurface}; font-style: italic;">
          "${escapeText(d.comentario)}"
        </div>
      </div>`
    : "";

  const cuerpo = `
    <p style="margin: 0 0 16px 0;"><strong>${escapeText(d.nombreAutor)}</strong> publicó una nueva reseña sobre <strong>${escapeText(d.nombreDestinatario)}</strong> en <strong>Conectar UIAB</strong>.</p>

    ${tarjetaDatos([
      { etiqueta: "Autor", valor: d.nombreAutor },
      { etiqueta: "Calificación", valor: `${estrellas} (${d.calificacion}/5)` },
    ])}

    ${bloqueCometario}

    <p style="margin: 0;">Podés ver la reseña en tu perfil del directorio.</p>
  `;

  return {
    asunto: `Nueva reseña recibida de ${d.nombreAutor} — Conectar UIAB`,
    html: renderEmailBase({
      preheader: `${d.nombreAutor} publicó una reseña sobre ${d.nombreDestinatario}.`,
      titulo: "Recibiste una nueva reseña",
      intro: "Una reseña sobre tu organización fue publicada en el directorio.",
      cuerpo,
      cta: { etiqueta: "Ver mi perfil", href: d.urlPerfil },
    }),
    texto: [
      `Nueva reseña recibida de ${d.nombreAutor}`,
      "",
      `${d.nombreAutor} publicó una reseña sobre ${d.nombreDestinatario}: ${estrellas}`,
      d.comentario ? `"${d.comentario}"` : "",
      "",
      `Ver perfil: ${d.urlPerfil}`,
    ].filter(Boolean).join("\n"),
  };
}

export interface DatosRechazo {
  tipo: TipoEntidad;
  nombre: string;
  motivo: string;
  urlContacto: string;
}

/** Correo de rechazo: no pasó la revisión. Incluye motivo y contacto. */
export function plantillaRechazo(d: DatosRechazo): {
  asunto: string;
  html: string;
  texto: string;
} {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${escapeText(
      d.nombre
    )}</strong>, gracias por tu interés en sumarte a <strong>Conectar UIAB</strong>. Revisamos tu solicitud y, por ahora, no pudimos aprobarla.</p>

    <div style="margin: 0 0 16px 0; padding: 16px 18px; background-color: ${BRAND.surfaceLow}; border-radius: 4px;">
      <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.onSurfaceMuted}; margin-bottom: 6px;">
        Motivo
      </div>
      <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.onSurface};">
        ${escapeText(d.motivo)}
      </div>
    </div>

    <p style="margin: 0;">Si creés que hubo un error o querés aportar más información, respondé este correo o escribinos desde el formulario de contacto.</p>
  `;

  return {
    asunto: "Revisión de tu solicitud en Conectar UIAB",
    html: renderEmailBase({
      preheader: "Tu solicitud fue revisada. Tenemos una actualización para vos.",
      titulo: "Revisión de tu solicitud",
      intro: "Revisamos los datos que nos enviaste y queremos compartirte el resultado.",
      cuerpo,
      cta: { etiqueta: "Ir al formulario de contacto", href: d.urlContacto },
    }),
    texto: [
      "Revisión de tu solicitud en Conectar UIAB",
      "",
      `Hola ${d.nombre},`,
      "",
      "No pudimos aprobar tu registro por el siguiente motivo:",
      d.motivo,
      "",
      `Escribinos: ${d.urlContacto}`,
    ].join("\n"),
  };
}
