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
 *  Restricciones de email clients (Outlook de escritorio usa el motor de Word):
 *   - **Nada de `linear-gradient`**: Word lo ignora y no pinta ningún fondo. Si
 *     encima el texto es blanco, el bloque llega en blanco. Fue exactamente lo
 *     que pasó con el encabezado y con el botón "Definir mi contraseña": el
 *     socio recibía un correo con el logo apagado y el CTA invisible.
 *     Todo fondo de color va con color sólido + atributo `bgcolor`.
 *   - Nada de `rgba()` ni `opacity` para texto: sólo hex opaco.
 *   - `border-radius` se ignora (degrada a esquina recta, aceptable). Para el
 *     botón se usa además VML (`v:roundrect`) para que Outlook lo pinte igual.
 *   - Todo el CSS es inline (Gmail/Outlook ignoran <style>).
 *   - Tablas en lugar de flex/grid; ancho máximo 600px.
 *   - Las fuentes web no cargan: el stack termina siempre en Arial/Helvetica.
 *   - Nada de SVG en <img>: ningún cliente lo soporta (ver `logo.ts`).
 *   - Dark mode forzado: usamos `color-scheme: light` en el body.
 */

import { LOGO_ALTO, LOGO_ANCHO, LOGO_CID } from "./logo";

export interface DatosBaseCorreo {
  /** Título corto que aparece en la vista previa del inbox (preheader). */
  preheader: string;
  /** Encabezado grande que se muestra arriba del cuerpo. */
  titulo: string;
  /** Texto introductorio bajo el título. Texto plano: se escapa. */
  intro: string;
  /**
   * HTML del bloque principal (párrafos, listas, datos). Es el ÚNICO campo que
   * se interpola crudo: todo dato de usuario que entre acá tiene que pasar
   * antes por `escapeText`.
   */
  cuerpo: string;
  /** CTA principal. Opcional. */
  cta?: { etiqueta: string; href: string };
  /** Nota legal / secundaria al final del cuerpo. Texto plano: se escapa. */
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

/** Stacks tipográficos: la última opción es la que realmente se usa en Outlook. */
const FONT_BODY = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_DISPLAY = "'Manrope', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Reset que Outlook necesita en cada tabla para no meter espacios fantasma. */
const TABLA_RESET =
  "border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;";

/**
 * Botón "a prueba de balas": VML para Outlook (que ignora padding en <a>) y un
 * <a> normal para el resto. Ambos con fondo sólido — nunca un gradiente.
 */
function botonCta(etiqueta: string, href: string): string {
  const url = escapeAttr(href);
  const texto = escapeText(etiqueta);
  // VML necesita un ancho fijo en px: lo estimamos según el largo de la etiqueta.
  const anchoVml = Math.min(420, Math.max(200, etiqueta.length * 9 + 64));

  return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0 0 0; ${TABLA_RESET}">
        <tr>
          <td align="center" bgcolor="${BRAND.primary}" style="background-color: ${BRAND.primary}; border-radius: 4px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px; v-text-anchor:middle; width:${anchoVml}px;" arcsize="8%" stroke="f" fillcolor="${BRAND.primary}">
              <w:anchorlock/>
              <center style="color:#ffffff; font-family: Arial, sans-serif; font-size:15px; font-weight:bold;">${texto}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${url}" style="display: inline-block; padding: 15px 32px; font-family: ${FONT_BODY}; font-size: 15px; font-weight: 700; letter-spacing: 0.01em; line-height: 18px; color: #ffffff; text-decoration: none; border-radius: 4px;">
              ${texto}
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>`;
}

/**
 * Enlace en texto plano bajo el botón. Es el seguro de vida: si el CTA no se
 * ve o no es clickeable (imágenes bloqueadas, cliente raro, correo reenviado),
 * la URL sigue estando visible y copiable.
 */
function enlaceDeRespaldo(href: string): string {
  return `
      <p style="margin: 20px 0 0 0; font-family: ${FONT_BODY}; font-size: 12px; line-height: 1.6; color: ${BRAND.onSurfaceMuted};">
        ¿No te funciona el botón? Copiá y pegá este enlace en tu navegador:<br/>
        <a href="${escapeAttr(href)}" style="color: ${BRAND.tertiary}; text-decoration: underline; word-break: break-all;">${escapeText(href)}</a>
      </p>`;
}

/**
 * Envoltorio HTML completo. Recibe el contenido del cuerpo ya renderizado.
 *
 * El encabezado es blanco con el logo a color (no un bloque oscuro con texto
 * blanco): así, aunque un cliente no pinte fondos, todo sigue siendo texto
 * oscuro sobre blanco y nada desaparece.
 */
export function renderEmailBase(datos: DatosBaseCorreo): string {
  const { preheader, titulo, intro, cuerpo, cta, pie } = datos;

  const bloqueCta = cta ? botonCta(cta.etiqueta, cta.href) + enlaceDeRespaldo(cta.href) : "";

  const bloquePie = pie
    ? `<p style="margin: 24px 0 0 0; font-family: ${FONT_BODY}; font-size: 12px; line-height: 1.6; color: ${BRAND.onSurfaceMuted};">${escapeText(pie)}</p>`
    : "";

  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeText(titulo)}</title>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; width: 100%; background-color: ${BRAND.surfaceLow}; color-scheme: light; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <!-- Preheader: se ve en la vista previa del inbox, no en el cuerpo. -->
    <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${BRAND.surfaceLow}; opacity: 0;">
      ${escapeText(preheader)}
      ${"&#847;&zwnj;&nbsp;".repeat(60)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND.surfaceLow}" style="background-color: ${BRAND.surfaceLow}; ${TABLA_RESET}">
      <tr>
        <td align="center" style="padding: 32px 16px 40px 16px;">
          <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; ${TABLA_RESET}">

            <!-- Filete de marca -->
            <tr>
              <td height="4" bgcolor="${BRAND.primary}" style="height: 4px; line-height: 4px; font-size: 4px; background-color: ${BRAND.primary};">&nbsp;</td>
            </tr>

            <!-- Encabezado: logo institucional sobre blanco -->
            <tr>
              <td bgcolor="${BRAND.surfaceLowest}" style="background-color: ${BRAND.surfaceLowest}; padding: 28px 32px 24px 32px;">
                <img src="cid:${LOGO_CID}" width="${LOGO_ANCHO}" height="${LOGO_ALTO}" alt="UIAB Conecta — Unión Industrial de Almirante Brown" style="display: block; width: ${LOGO_ANCHO}px; height: ${LOGO_ALTO}px; border: 0; outline: none; text-decoration: none; font-family: ${FONT_DISPLAY}; font-size: 16px; font-weight: 700; color: ${BRAND.primary};" border="0" />
              </td>
            </tr>
            <tr>
              <td bgcolor="${BRAND.surfaceLowest}" style="background-color: ${BRAND.surfaceLowest}; padding: 0 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${TABLA_RESET}">
                  <tr>
                    <td height="1" bgcolor="${BRAND.surfaceDim}" style="height: 1px; line-height: 1px; font-size: 1px; background-color: ${BRAND.surfaceDim};">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Cuerpo del mensaje -->
            <tr>
              <td bgcolor="${BRAND.surfaceLowest}" style="background-color: ${BRAND.surfaceLowest}; padding: 32px 32px 36px 32px;">
                <h1 style="margin: 0 0 12px 0; font-family: ${FONT_DISPLAY}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; color: ${BRAND.onSurface};">
                  ${escapeText(titulo)}
                </h1>
                <p style="margin: 0 0 24px 0; font-family: ${FONT_BODY}; font-size: 15px; line-height: 1.6; color: ${BRAND.onSurfaceMuted};">
                  ${escapeText(intro)}
                </p>
                <div style="font-family: ${FONT_BODY}; font-size: 15px; line-height: 1.65; color: ${BRAND.onSurface};">
                  ${cuerpo}
                </div>
                ${bloqueCta}
                ${bloquePie}
              </td>
            </tr>

            <!-- Pie institucional -->
            <tr>
              <td align="center" style="padding: 24px 32px 8px 32px;">
                <p style="margin: 0; font-family: ${FONT_BODY}; font-size: 11px; line-height: 1.6; letter-spacing: 0.02em; color: ${BRAND.onSurfaceMuted}; text-align: center;">
                  Este mensaje fue enviado por <strong style="color: ${BRAND.onSurface};">UIAB Conecta</strong>, la red profesional de la Unión Industrial de Almirante Brown.<br/>
                  Si recibiste este correo por error, podés ignorarlo con seguridad.
                </p>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
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
      <td style="padding: 10px 14px; font-family: ${FONT_BODY}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.onSurfaceMuted}; width: 40%; vertical-align: top;">
        ${escapeText(f.etiqueta)}
      </td>
      <td style="padding: 10px 14px; font-family: ${FONT_BODY}; font-size: 14px; color: ${BRAND.onSurface}; vertical-align: top;">
        ${escapeText(f.valor)}
      </td>
    </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND.surfaceLow}" style="background-color: ${BRAND.surfaceLow}; border-radius: 4px; margin: 8px 0 4px 0; ${TABLA_RESET}">
      ${rows}
    </table>
  `;
}

/** Chip técnico (rectangular, estilo tag industrial). */
export function chip(texto: string): string {
  return `<span style="display: inline-block; padding: 4px 10px; font-family: ${FONT_BODY}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND.tertiary}; background-color: #e6ebf2; border-radius: 2px;">${escapeText(
    texto
  )}</span>`;
}

/**
 * Bloque destacado (motivo de rechazo, aviso, dato clave). Fondo sólido con
 * `bgcolor` para que Outlook lo pinte, y una barra lateral en vez de
 * `border-left` (que el motor de Word renderiza de forma inconsistente).
 */
export function bloqueDestacado(contenido: string, opciones?: { etiqueta?: string }): string {
  const encabezado = opciones?.etiqueta
    ? `<div style="font-family: ${FONT_BODY}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.onSurfaceMuted}; padding-bottom: 6px;">${escapeText(
        opciones.etiqueta
      )}</div>`
    : "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0; ${TABLA_RESET}">
      <tr>
        <td width="3" bgcolor="${BRAND.primary}" style="width: 3px; background-color: ${BRAND.primary};">&nbsp;</td>
        <td bgcolor="${BRAND.surfaceLow}" style="background-color: ${BRAND.surfaceLow}; padding: 16px 18px; font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.6; color: ${BRAND.onSurface};">
          ${encabezado}${contenido}
        </td>
      </tr>
    </table>
  `;
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Escapa texto para interpolarlo en el HTML del correo.
 *
 * `renderEmailBase` ya escapa `titulo`, `intro`, `pie` y la etiqueta del CTA.
 * El único campo crudo es `cuerpo` (recibe HTML por diseño): todo dato que
 * venga de un formulario público y termine ahí tiene que pasar por acá, o un
 * nombre con `<` rompe la maqueta — y uno malicioso inyecta enlaces con la
 * marca de la UIAB en la casilla del admin.
 */
export function escapeText(s: string): string {
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

/** Escapa y preserva los saltos de línea con `<br/>`, para textos multilínea. */
export function escapeTextoMultilinea(s: string): string {
  return escapeText(s).replace(/\r?\n/g, "<br/>");
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
    <p style="margin: 0 0 12px 0;">Una nueva entidad completó el registro en <strong>UIAB Conecta</strong> y queda en estado <em>pendiente de revisión</em>. Ingresá al panel de administración para revisar los datos y aprobar o rechazar la solicitud.</p>
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
      pie: "Recibís esta notificación porque tu cuenta figura como administradora de la red UIAB Conecta.",
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
    )}</strong>! Tu registro fue revisado y aprobado por el equipo de la Unión Industrial de Almirante Brown. A partir de ahora formás parte oficial de <strong>UIAB Conecta</strong>.</p>

    <p style="margin: 0 0 8px 0; font-weight: 700; color: ${BRAND.onSurface};">Lo que vas a encontrar al ingresar</p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: ${BRAND.onSurface};">
      <li style="margin-bottom: 6px;"><strong>Directorio industrial</strong> con empresas y proveedores de servicios verificados.</li>
      <li style="margin-bottom: 6px;"><strong>Oportunidades comerciales</strong> publicadas por la red para ofertar o captar servicios.</li>
      <li style="margin-bottom: 6px;"><strong>Perfil institucional</strong> para mostrar tu actividad, rubros y datos de contacto.</li>
      <li style="margin-bottom: 6px;"><strong>Capacitaciones y eventos</strong> organizados por la UIAB y sus socios.</li>
    </ul>

    <p style="margin: 0;">Tocá el botón de abajo para ver la página de bienvenida y avanzar a tu panel.</p>
  `;

  return {
    asunto: `${saludo} a UIAB Conecta — Tu registro fue aprobado`,
    html: renderEmailBase({
      preheader: `Tu registro en UIAB Conecta fue aprobado.`,
      titulo: `${saludo} a la red`,
      intro: "Tu solicitud fue revisada y aprobada. Ya podés ingresar a la plataforma.",
      cuerpo,
      cta: { etiqueta: "Acceder a la plataforma", href: d.urlBienvenida },
      pie: "Si no solicitaste este registro, por favor escribinos a soporte@uiab.com.ar para que lo revisemos.",
    }),
    texto: [
      `${saludo} a UIAB Conecta`,
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
    ? bloqueDestacado(
        `<span style="font-style: italic;">“${escapeText(d.comentario)}”</span>`
      )
    : "";

  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${escapeText(d.nombreAutor)}</strong>, tu reseña sobre <strong>${escapeText(d.nombreDestinatario)}</strong> fue revisada y aprobada. Ya está publicada en el directorio de <strong>UIAB Conecta</strong>.</p>

    ${tarjetaDatos([
      { etiqueta: "Destinatario", valor: d.nombreDestinatario },
      { etiqueta: "Calificación", valor: `${estrellas} (${d.calificacion}/5)` },
    ])}

    ${bloqueCometario}

    <p style="margin: 0;">Podés ver la reseña publicada en el perfil de <strong>${escapeText(d.nombreDestinatario)}</strong>.</p>
  `;

  return {
    asunto: `Tu reseña sobre ${d.nombreDestinatario} fue publicada — UIAB Conecta`,
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

/**
 * URL pública de la app. Local a este módulo (mismo criterio que
 * `plantillas-suscripciones.ts`) para no arrastrar `nodemailer` —que importa
 * `cliente.ts`— a la cadena de dependencias de las plantillas.
 */
function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Correo al autor de la reseña: no fue aprobada. */
export function plantillaResenaRechazada(d: DatosResenaRechazada): {
  asunto: string;
  html: string;
  texto: string;
} {
  const cuerpo = `
    <p style="margin: 0 0 16px 0;">Hola <strong>${escapeText(d.nombreAutor)}</strong>, revisamos la reseña que enviaste sobre <strong>${escapeText(d.nombreDestinatario)}</strong> y, por ahora, no pudimos publicarla.</p>

    ${bloqueDestacado(escapeText(d.motivo), { etiqueta: "Motivo" })}

    <p style="margin: 0;">Si creés que hubo un error, respondé este correo para que lo revisemos.</p>
  `;

  return {
    asunto: `Tu reseña sobre ${d.nombreDestinatario} no fue publicada — UIAB Conecta`,
    html: renderEmailBase({
      preheader: `Tu reseña sobre ${d.nombreDestinatario} no pasó la revisión.`,
      titulo: "Tu reseña no fue publicada",
      intro: "Revisamos los datos que nos enviaste y queremos compartirte el resultado.",
      cuerpo,
      cta: { etiqueta: "Ir al formulario de contacto", href: `${appUrl()}/contacto` },
    }),
    texto: [
      `Tu reseña sobre ${d.nombreDestinatario} no fue publicada`,
      "",
      `Hola ${d.nombreAutor},`,
      "No pudimos publicar tu reseña por el siguiente motivo:",
      d.motivo,
      "",
      `Si creés que hubo un error, escribinos: ${appUrl()}/contacto`,
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
  const bloqueCometario = d.comentario
    ? bloqueDestacado(
        `<span style="font-style: italic;">“${escapeText(d.comentario)}”</span>`
      )
    : "";

  const cuerpo = `
    <p style="margin: 0 0 16px 0;"><strong>${escapeText(d.nombreAutor)}</strong> publicó una nueva reseña sobre <strong>${escapeText(d.nombreDestinatario)}</strong> en <strong>UIAB Conecta</strong>.</p>

    ${tarjetaDatos([
      { etiqueta: "Autor", valor: d.nombreAutor },
      { etiqueta: "Calificación", valor: `${estrellas} (${d.calificacion}/5)` },
    ])}

    ${bloqueCometario}

    <p style="margin: 0;">Podés ver la reseña en tu perfil del directorio.</p>
  `;

  return {
    asunto: `Nueva reseña recibida de ${d.nombreAutor} — UIAB Conecta`,
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
    )}</strong>, gracias por tu interés en sumarte a <strong>UIAB Conecta</strong>. Revisamos tu solicitud y, por ahora, no pudimos aprobarla.</p>

    ${bloqueDestacado(escapeText(d.motivo), { etiqueta: "Motivo" })}

    <p style="margin: 0;">Si creés que hubo un error o querés aportar más información, respondé este correo o escribinos desde el formulario de contacto.</p>
  `;

  return {
    asunto: "Revisión de tu solicitud en UIAB Conecta",
    html: renderEmailBase({
      preheader: "Tu solicitud fue revisada. Tenemos una actualización para vos.",
      titulo: "Revisión de tu solicitud",
      intro: "Revisamos los datos que nos enviaste y queremos compartirte el resultado.",
      cuerpo,
      cta: { etiqueta: "Ir al formulario de contacto", href: d.urlContacto },
    }),
    texto: [
      "Revisión de tu solicitud en UIAB Conecta",
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
