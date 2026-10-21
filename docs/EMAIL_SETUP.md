# Setup de Correos — UIAB Conecta

Todo el sistema de correos corre sobre **un único servidor SMTP**. Ese mismo
servidor se comparte entre:

- **Supabase Auth** (correos de confirmación de registro y recuperación de
  contraseña → plantillas nativas del Dashboard).
- **Nuestro Next.js** (correos transaccionales de producto: notificación al
  admin, aprobación, rechazo → plantillas en `src/lib/email/plantillas.ts`,
  envío vía `nodemailer`).

De esta forma el producto queda **100% sobre Supabase + un SMTP gratuito**,
sin servicios pagos.

---

## 1. Elegí un proveedor SMTP gratuito

Cualquiera sirve. Las dos opciones más simples:

### Opción A — Gmail con App Password (más rápido para probar)

Requiere 2FA en la cuenta de Google.

1. Ir a https://myaccount.google.com/apppasswords
2. Crear una contraseña de aplicación llamada "UIAB Conecta".
3. Guardar la clave de 16 caracteres que te da Google.

Credenciales:
- Host: `smtp.gmail.com`
- Port: `465`
- User: tu email de Gmail
- Pass: la App Password generada
- Secure: `true`
- Límite: ~500 correos/día

### Opción B — Brevo / Sendinblue (recomendado para prod)

1. Crear cuenta en https://www.brevo.com (300 correos/día gratis, sin
   tarjeta).
2. Dashboard → **SMTP & API** → **SMTP** → copiar credenciales.
3. Verificar el dominio de envío en **Senders & IP > Domains** (agregar los
   registros DNS que te indica Brevo: SPF, DKIM, DMARC).

Credenciales:
- Host: `smtp-relay.brevo.com`
- Port: `587`
- User: el login que te da Brevo (ej. `91xxxx@smtp-brevo.com`)
- Pass: la SMTP key generada
- Secure: `false` (usa STARTTLS)

---

## 2. Variables de entorno

Agregar al `.env` local y al proyecto en Vercel:

```bash
# URL pública de la app — para construir links en correos
NEXT_PUBLIC_APP_URL=https://www.uiabconecta.com        # prod
# NEXT_PUBLIC_APP_URL=http://localhost:3000            # dev

# ─── SMTP (lo usa nodemailer para correos transaccionales) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-casilla@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx
# SMTP_SECURE=true   # opcional, por defecto true si port=465

# Remitente (tiene que ser un email válido del dominio autenticado por SMTP)
EMAIL_FROM="UIAB Conecta <tu-casilla@gmail.com>"

# Destinatario de las notificaciones de nuevas solicitudes
ADMIN_NOTIFICATION_EMAIL=julianboxler@vaxler.com.ar
```

> Si cualquier variable SMTP falta, los correos transaccionales se **saltan
> silenciosamente** (quedan log-warn). Ningún server action falla por ausencia
> de SMTP — ideal para CI y entornos sin credenciales.

> ⚠️ **`ADMIN_NOTIFICATION_EMAIL` tiene que apuntar a un dominio con MX real.**
> Si el dominio no existe, el SMTP igual acepta y encola el mensaje: `enviarEmail`
> devuelve `ok: true`, la app no muestra ningún error, y el rebote vuelve minutos
> después como DSN a la casilla del `SMTP_USER`. Es decir, se pierden en silencio
> todas las notificaciones al admin (altas, registros, contacto, pagos).
> Ya pasó con `admin@uiab.com.ar`: ese dominio nunca se registró (NXDOMAIN).
> El dominio institucional de la UIAB es **`uiab.org`**, no `uiab.com.ar`.
> Verificalo antes de cambiar el valor: `dig +short <dominio> MX`.

> **Estado al 2026-09-22 (verificado con `vercel env pull`):**
> Production y Preview ya tenían `julianboxler@vaxler.com.ar`, que resuelve MX.
> El `admin@uiab.com.ar` roto estaba **sólo en el `.env` local**, así que lo que
> se perdía en silencio eran las pruebas en `next dev`, no las notificaciones de
> producción. Ya quedó alineado. Antes de dar por sentado que algo se está
> perdiendo en prod, mirá el valor real de Vercel: el `.env` local no manda ahí.

---

## 3. Supabase — Configuración única

### 3.1. Custom SMTP (lo más importante)

`Dashboard > Authentication > SMTP Settings > Enable Custom SMTP`.

Cargar **las mismas credenciales** que usaste en `.env`. De esta forma
Supabase Auth manda sus correos (signup confirm, recovery, etc.) desde el
mismo dominio que nuestros correos transaccionales:

| Campo            | Valor                                               |
|------------------|-----------------------------------------------------|
| Host             | `smtp.gmail.com` / `smtp-relay.brevo.com`           |
| Port             | `465` / `587`                                       |
| Username         | `SMTP_USER`                                         |
| Password         | `SMTP_PASS`                                         |
| Sender email     | el mismo valor que `EMAIL_FROM`                     |
| Sender name      | `UIAB Conecta`                                     |
| Minimum interval | `60` seconds (protección anti-spam default)         |

> **Importante**: el default SMTP de Supabase tiene un rate limit muy bajo
> (~3 correos/hora por proyecto free). Sin custom SMTP, en prod los correos
> de registro van a fallar apenas haya un par de altas seguidas.

### 3.2. URL Configuration

`Dashboard > Authentication > URL Configuration`:

- **Site URL**: `https://conectar-uiab.vercel.app`
- **Redirect URLs** (una por línea, incluir dev):
  ```
  https://conectar-uiab.vercel.app/api/auth/callback
  https://conectar-uiab.vercel.app/api/auth/callback?**
  http://localhost:3000/api/auth/callback
  http://localhost:3000/api/auth/callback?**
  ```

### 3.3. Plantillas de correo de Auth

`Dashboard > Authentication > Email Templates`. Pegar el HTML correspondiente
en cada una. Los `{{ .ConfirmationURL }}` son tokens que Supabase reemplaza
automáticamente.

> **Estas dos plantillas son la copia manual de `renderEmailBase`**
> (`src/lib/email/plantillas.ts`). Viven en el Dashboard de Supabase, no en el
> repo, así que **no** se arreglan solas cuando se toca la plantilla base: si
> cambiás el diseño de los correos, volvé a pegarlas acá.
>
> Dos diferencias obligadas respecto de los correos de nodemailer:
>
> - El logo va por **URL absoluta** (`https://www.uiabconecta.com/email/logo-uiab-conecta.png`),
>   no por adjunto `cid:`. Supabase no puede adjuntar nada. Outlook de escritorio
>   bloquea las imágenes remotas por defecto, así que ahí el encabezado se ve
>   con el texto alternativo hasta que el socio toca «Descargar imágenes». Por
>   eso el resto del correo es texto oscuro sobre blanco: aunque la imagen no
>   cargue, no desaparece nada.
> - El archivo del logo lo sirve `public/email/logo-uiab-conecta.png`. Si se
>   renombra o se mueve, estos correos quedan sin marca.
>
> **Nunca uses `background: linear-gradient(...)` acá.** El motor de Word que usa
> Outlook clásico lo ignora, no pinta ningún fondo, y todo texto blanco encima
> queda blanco sobre blanco. Eso fue lo que dejó el encabezado apagado y el
> botón invisible en la versión anterior de estas plantillas. Color sólido,
> siempre con atributo `bgcolor`, y el botón con su bloque VML.

#### a) Confirm signup

- **Subject**: `Confirmá tu email — UIAB Conecta`
- **Body** (HTML):

```html
<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>Confirmá tu email</title>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; width: 100%; background-color: #f2f4f6; color-scheme: light; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <!-- Preheader: se ve en la vista previa del inbox, no en el cuerpo. -->
    <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f2f4f6; opacity: 0;">
      Confirmá tu dirección de correo para activar tu cuenta.
      &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f2f4f6" style="background-color: #f2f4f6; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td align="center" style="padding: 32px 16px 40px 16px;">
          <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">

            <!-- Filete de marca -->
            <tr>
              <td height="4" bgcolor="#00213f" style="height: 4px; line-height: 4px; font-size: 4px; background-color: #00213f;">&nbsp;</td>
            </tr>

            <!-- Encabezado: logo institucional sobre blanco -->
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 28px 32px 24px 32px;">
                <img src="https://www.uiabconecta.com/email/logo-uiab-conecta.png" width="260" height="40" alt="UIAB Conecta — Unión Industrial de Almirante Brown" style="display: block; width: 260px; height: 40px; border: 0; outline: none; text-decoration: none; font-family: 'Manrope', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #00213f;" border="0" />
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 0 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td height="1" bgcolor="#d8dadc" style="height: 1px; line-height: 1px; font-size: 1px; background-color: #d8dadc;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Cuerpo del mensaje -->
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 32px 32px 36px 32px;">
                <h1 style="margin: 0 0 12px 0; font-family: 'Manrope', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; color: #191c1e;">
                  Confirmá tu email
                </h1>
                <p style="margin: 0 0 24px 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #525b63;">
                  Gracias por sumarte a UIAB Conecta. Falta un paso para activar tu cuenta.
                </p>
                <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #191c1e;">
                  <p style="margin: 0;">Confirmá tu dirección de correo con el botón de abajo. El enlace expira en 24 horas.</p>
                </div>
                
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0 0 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        <tr>
          <td align="center" bgcolor="#00213f" style="background-color: #00213f; border-radius: 4px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:48px; v-text-anchor:middle; width:226px;" arcsize="8%" stroke="f" fillcolor="#00213f">
              <w:anchorlock/>
              <center style="color:#ffffff; font-family: Arial, sans-serif; font-size:15px; font-weight:bold;">Confirmar mi email</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 32px; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 0.01em; line-height: 18px; color: #ffffff; text-decoration: none; border-radius: 4px;">
              Confirmar mi email
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
      <p style="margin: 20px 0 0 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #525b63;">
        ¿No te funciona el botón? Copiá y pegá este enlace en tu navegador:<br/>
        <a href="{{ .ConfirmationURL }}" style="color: #001b55; text-decoration: underline; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
                <p style="margin: 24px 0 0 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #525b63;">Si no te registraste en UIAB Conecta, podés ignorar este correo.</p>
              </td>
            </tr>

            <!-- Pie institucional -->
            <tr>
              <td align="center" style="padding: 24px 32px 8px 32px;">
                <p style="margin: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; letter-spacing: 0.02em; color: #525b63; text-align: center;">
                  Este mensaje fue enviado por <strong style="color: #191c1e;">UIAB Conecta</strong>, la red profesional de la Unión Industrial de Almirante Brown.<br/>
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
</html>
```

#### b) Reset password

- **Subject**: `Recuperá tu acceso — UIAB Conecta`
- **Body** (HTML):

```html
<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>Recuperá tu contraseña</title>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; width: 100%; background-color: #f2f4f6; color-scheme: light; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <!-- Preheader: se ve en la vista previa del inbox, no en el cuerpo. -->
    <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f2f4f6; opacity: 0;">
      Elegí una contraseña nueva para tu cuenta de UIAB Conecta.
      &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f2f4f6" style="background-color: #f2f4f6; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td align="center" style="padding: 32px 16px 40px 16px;">
          <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">

            <!-- Filete de marca -->
            <tr>
              <td height="4" bgcolor="#00213f" style="height: 4px; line-height: 4px; font-size: 4px; background-color: #00213f;">&nbsp;</td>
            </tr>

            <!-- Encabezado: logo institucional sobre blanco -->
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 28px 32px 24px 32px;">
                <img src="https://www.uiabconecta.com/email/logo-uiab-conecta.png" width="260" height="40" alt="UIAB Conecta — Unión Industrial de Almirante Brown" style="display: block; width: 260px; height: 40px; border: 0; outline: none; text-decoration: none; font-family: 'Manrope', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #00213f;" border="0" />
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 0 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td height="1" bgcolor="#d8dadc" style="height: 1px; line-height: 1px; font-size: 1px; background-color: #d8dadc;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Cuerpo del mensaje -->
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 32px 32px 36px 32px;">
                <h1 style="margin: 0 0 12px 0; font-family: 'Manrope', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; color: #191c1e;">
                  Recuperá tu contraseña
                </h1>
                <p style="margin: 0 0 24px 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #525b63;">
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                </p>
                <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #191c1e;">
                  <p style="margin: 0;">Tocá el botón para elegir una contraseña nueva. El enlace expira en 24 horas.</p>
                </div>
                
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0 0 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        <tr>
          <td align="center" bgcolor="#00213f" style="background-color: #00213f; border-radius: 4px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ .ConfirmationURL }}" style="height:48px; v-text-anchor:middle; width:271px;" arcsize="8%" stroke="f" fillcolor="#00213f">
              <w:anchorlock/>
              <center style="color:#ffffff; font-family: Arial, sans-serif; font-size:15px; font-weight:bold;">Elegir nueva contraseña</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 15px 32px; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 0.01em; line-height: 18px; color: #ffffff; text-decoration: none; border-radius: 4px;">
              Elegir nueva contraseña
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
      <p style="margin: 20px 0 0 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #525b63;">
        ¿No te funciona el botón? Copiá y pegá este enlace en tu navegador:<br/>
        <a href="{{ .ConfirmationURL }}" style="color: #001b55; text-decoration: underline; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
                <p style="margin: 24px 0 0 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #525b63;">Si no pediste este cambio, podés ignorar este correo: tu contraseña actual sigue siendo válida.</p>
              </td>
            </tr>

            <!-- Pie institucional -->
            <tr>
              <td align="center" style="padding: 24px 32px 8px 32px;">
                <p style="margin: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; letter-spacing: 0.02em; color: #525b63; text-align: center;">
                  Este mensaje fue enviado por <strong style="color: #191c1e;">UIAB Conecta</strong>, la red profesional de la Unión Industrial de Almirante Brown.<br/>
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
</html>
```

#### c) Magic Link / Invite / Change Email

Dejar las plantillas por defecto o replicar el estilo con el HTML de arriba
cambiando el copy. Nuestro callback (`/api/auth/callback`) maneja los 5 tipos
que Supabase define.

---

## 4. Qué correo manda cada flujo

| Trigger                                                        | Quién lo manda   | Plantilla                                          | Destino                |
|----------------------------------------------------------------|------------------|----------------------------------------------------|------------------------|
| `supabase.auth.signUp()` en `/register`                        | Supabase Auth    | "Confirm signup" (dashboard)                       | Usuario que se registra|
| `supabase.auth.resetPasswordForEmail()` en `/recovery`         | Supabase Auth    | "Reset password" (dashboard)                       | Usuario que solicita   |
| Inserción en `empresas`/`proveedores` desde `/api/auth/register-sync` | nodemailer | `plantillaNotificacionAdmin`                       | `ADMIN_NOTIFICATION_EMAIL` |
| `aprobarEmpresa` / `aprobarProveedor`                          | nodemailer       | `plantillaAprobacion`                              | Email de la entidad    |
| `rechazarEmpresa` / `rechazarProveedor`                        | nodemailer       | `plantillaRechazo`                                 | Email de la entidad    |
| Una nota del Boletín pasa a `publicado`                        | nodemailer       | `plantillaBoletinNuevo`                            | Todas las socias (ver §8) |

Ambos caminos usan el **mismo servidor SMTP** — una sola fuente de verdad.

---

## 5. Páginas creadas para el flujo

| Ruta                       | Propósito                                                                        |
|----------------------------|----------------------------------------------------------------------------------|
| `/api/auth/callback`       | Canjea tokens de Supabase (signup, recovery, invite, magiclink) y redirige.      |
| `/confirmar-email`         | Landing post-confirmación: explica que el registro queda en revisión.            |
| `/restablecer-password`    | Form de nueva contraseña (detecta sesión de recovery).                           |
| `/bienvenido`              | Landing post-aprobación: explica qué encontrará + CTA al login.                  |
| `/recovery` (existente)    | Form para pedir el correo de recuperación.                                       |

---

## 6. Testing manual (end-to-end)

1. **Registro**
   - Ir a `/register`, completar como empresa, enviar.
   - Debe llegar a la casilla un correo "Confirmá tu email" (viene de Supabase Auth vía SMTP).
   - Click al botón → se abre `/api/auth/callback?...` → redirige a `/confirmar-email`.
   - Paralelamente, a `ADMIN_NOTIFICATION_EMAIL` debe llegar "Nueva empresa pendiente de revisión — <razón social>" (viene de nodemailer).

2. **Aprobación**
   - Como admin, entrar a `/admin/empresas` y aprobar la empresa.
   - A la casilla de la empresa debe llegar "Bienvenida a UIAB Conecta".
   - Click al CTA → `/bienvenido`. Desde ahí, "Iniciar sesión" → `/login` → `/dashboard`.

3. **Rechazo**
   - Como admin, rechazar la empresa con un motivo.
   - A la casilla de la empresa debe llegar el correo de revisión con el motivo.

4. **Recuperación de contraseña**
   - Ir a `/login`, click "¿Olvidaste tu contraseña?" → `/recovery`.
   - Ingresar email → "Envíame un enlace mágico".
   - A la casilla debe llegar "Recuperá tu acceso".
   - Click al botón → `/api/auth/callback?...&next=/restablecer-password` → form para nueva clave.
   - Guardar → redirige a `/login`. Iniciar sesión con la nueva clave.

> Si las variables `SMTP_*` no están seteadas, los correos transaccionales se
> saltan con un warning en el log (esperado en dev sin credenciales).

---

## 7. Diseño de los correos — reglas que no se negocian

Todo el HTML transaccional sale de una sola función: `renderEmailBase()` en
`src/lib/email/plantillas.ts`. Un cambio ahí toca los ~19 correos del sistema,
así que las reglas de abajo valen para cualquier plantilla nueva.

### 7.1. Outlook clásico de Windows usa el motor de Word

No es un navegador. Lo que ignora, lo ignora en silencio:

| Construcción | Qué pasa en Outlook | Qué usar |
|---|---|---|
| `background: linear-gradient(...)` | **No pinta nada.** Texto blanco encima = bloque en blanco | color sólido + atributo `bgcolor` |
| `rgba(...)` / `opacity` en texto | descarta la propiedad entera | hex opaco |
| `padding` en `<a>` inline-block | se ignora: el botón pierde la forma | bloque VML `v:roundrect` (ver `botonCta`) |
| `padding`/`background` en `<div>` | inconsistente | celdas `<td>` de una tabla |
| `white-space: pre-wrap` | colapsa los saltos de línea | `escapeTextoMultilinea()` |
| `<img>` con SVG | no renderiza en ningún cliente | PNG |
| fuentes web (`Manrope`, `Inter`) | nunca cargan | el stack termina en `Arial` |

Este archivo existe porque el bug ya pasó en producción: el encabezado y el
botón «Definir mi contraseña» usaban gradientes con texto blanco. En Gmail se
veía perfecto; a un socio con Outlook le llegó el correo sin marca y con un
rectángulo vacío donde debía estar el botón.

Por eso, además, hoy el encabezado es **blanco con el logo a color** y no una
barra oscura con texto blanco: si un cliente no pinta fondos, todo sigue siendo
oscuro sobre blanco y no desaparece nada. Y todo CTA lleva debajo el enlace en
texto plano como respaldo.

### 7.2. El logo

- `src/lib/email/logo.ts` — PNG 520×81 en base64 (se muestra a 260×40; el doble
  para pantallas retina). `enviarEmail()` lo adjunta **inline por Content-ID**
  cuando el HTML referencia `cid:logo-uiab-conecta`. Se adjunta, y no se linkea
  por URL, porque Outlook bloquea las imágenes remotas por defecto.
- `public/email/logo-uiab-conecta.png` — el mismo archivo servido por HTTP, sólo
  para las plantillas de Supabase Auth (sección 3.3), que no pueden adjuntar.
- Fuente: `public/logo-uiab-conecta-completo.svg`. Para regenerarlo:

  ```bash
  node -e '
    const sharp = require("sharp");
    sharp("public/logo-uiab-conecta-completo.svg", { density: 300 })
      .trim({ threshold: 10 })
      .resize({ width: 520, fit: "inside" })
      .flatten({ background: "#ffffff" })
      .png({ compressionLevel: 9, palette: true })
      .toFile("public/email/logo-uiab-conecta.png");
  '
  ```

  Después hay que volcar ese PNG a base64 dentro de `src/lib/email/logo.ts`.

### 7.3. Escapado

`renderEmailBase` escapa `titulo`, `intro`, `pie` y la etiqueta del CTA. El
único campo que se interpola crudo es `cuerpo`, porque recibe HTML por diseño:
**todo dato que venga de un formulario público y termine ahí tiene que pasar
por `escapeText()`**. Un nombre con `&` rompe la maqueta; uno malicioso mete
enlaces con la marca de la UIAB en la casilla del admin.

---

## 8. El aviso del Boletín — el único envío masivo

Todos los correos de arriba son **transaccionales**: uno por vez, a una
persona, como consecuencia de algo que esa persona hizo. El aviso del Boletín
es distinto —un mensaje a **todo el padrón a la vez**— y por eso tiene reglas
propias.

### 8.1. Cuándo sale

Cuando una nota **pasa a `publicado`**, y sólo si su casilla
`avisar_por_email` está tildada. Una sola vez en la vida de la nota:
despublicar y volver a publicar **no** reenvía.

Hay tres puertas a `publicado` y las tres terminan en el mismo lugar
(`dispararAvisoDelBoletin`):

| Puerta                                        | Dónde se elige avisar                         |
|-----------------------------------------------|-----------------------------------------------|
| Compositor de `/admin/boletin`                | Casilla «Avisar por email a las socias»       |
| Ojito «Publicar» de la lista de `/admin/boletin` | La casilla ya guardada + un diálogo de confirmación |
| Cuadro «Compartí una novedad…» del feed       | Botón «Avisa a las socias» de la barra        |

Las tres arrancan **tildadas**. La decisión se guarda en la fila
(`comunicados.avisar_por_email`) y no viaja como parámetro: así ninguna puerta
puede olvidarse de pasarla, y la regla vive en un solo lugar.

### 8.2. A quién le llega

A las dos casillas de cada ficha **aprobada**: `empresas.email` y
`empresas.email_referente`. Hoy son **103 direcciones únicas sobre 57 socias**
(de 59 aprobadas, 2 no tienen ninguna casilla cargada).

Se deduplica por dirección en minúsculas —seis dominios del padrón tienen dos
fichas, y en varias el referente cargó la misma casilla que la empresa— y se
descarta lo que no tenga formato de email. Está en
`src/modulos/boletin/destinatarios.ts`.

> Cambiar el filtro de estado ahí cambia a quién le llega correo. `aprobada` es
> deliberado: `pausada` y `oculta` son fichas que la UIAB sacó de circulación.

### 8.3. Por qué no se manda dos veces

`comunicados.aviso_enviado_en` es un **candado**, no un dato de auditoría. Se
estampa con un UPDATE condicionado (`... WHERE aviso_enviado_en IS NULL
RETURNING`) **antes** de abrir el SMTP: quien se lleva la fila manda, y quien
llega segundo se va con cero filas. Sin eso, un doble click en «Publicar» o un
reintento de Vercel sobre el mismo POST mete la misma nota dos veces en 103
casillas, y eso no se deshace.

El candado **se suelta** si no salió ni un correo (SMTP sin configurar, cuota
de Gmail agotada), para poder reintentar. **No** se suelta en un envío parcial:
reintentar después de mandar 60 de 103 le duplicaría el correo a esos 60.

### 8.4. El techo de Gmail — la deuda que hay que mirar

Hoy el SMTP es **una cuenta de Gmail**, con un tope de **~500 destinatarios por
día para toda la cuenta**. Un aviso del boletín se come **103**. O sea:

- Entran **~4 avisos por día**, contando los transaccionales (altas,
  aprobaciones, cobros) que salen por el mismo lado.
- Pasado el tope, Gmail **no avisa**: devuelve un 550 por mensaje. Los correos
  se pierden y el único rastro es el log (`[email] tanda ...: N fallidos`).
- Una cuenta personal mandando 103 correos a dominios ajenos también es el
  patrón que dispara los límites antiabuso de Google.

**Cuando el boletín se mande seguido, esto tiene que mudarse a un SMTP de
envío** (Brevo da 300/día gratis; los planes pagos arrancan bajo). Es cambiar
las cuatro variables `SMTP_*` y nada más: el código no distingue proveedor.

### 8.5. Cómo se manda

`enviarTanda()` en `src/lib/email/cliente.ts`, con transporter **propio y
pooled** (dos conexiones reusadas, tope de 4 mensajes por segundo). Un mensaje
por destinatario, **nunca un BCC con 103 casillas**: un BCC largo es la firma
de una lista comprada y manda el correo a Spam para todos a la vez.

La tanda corre dentro de un `after()` del server action, así que el panel
responde «Publicado» enseguida y los ~103 correos salen después, con la
función todavía viva.

### 8.6. El correo

`plantillaBoletinNuevo` en `src/lib/email/plantillas-boletin.ts`. Es un
**adelanto**, no la nota entera: foto de portada, bajada, ~420 caracteres de
cuerpo y un botón a la nota. El boletín es público, así que el enlace abre sin
cuenta.

La portada va como **imagen remota** (no adjunta como el logo): una foto de
evento por 103 correos son decenas de megas. Outlook la bloquea por defecto y
está bien — a diferencia del logo, si la foto no se pinta no falta nada, y el
`alt` describe la nota.

El `Reply-To` es `UIAB_EMAIL`, y el pie dice que para darse de baja hay que
responder el correo. **No hay link de baja automático**: si alguien pide la
baja, hay que sacarle la casilla a mano de la ficha (o pausar la ficha).
