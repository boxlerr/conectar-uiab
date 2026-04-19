# Setup de Correos — Conectar UIAB

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
2. Crear una contraseña de aplicación llamada "Conectar UIAB".
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
3. Verificar el dominio `uiab.com.ar` en **Senders & IP > Domains** (agregar
   los registros DNS que te indica Brevo: SPF, DKIM, DMARC).

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
NEXT_PUBLIC_APP_URL=https://conectar-uiab.vercel.app   # prod
# NEXT_PUBLIC_APP_URL=http://localhost:3000            # dev

# ─── SMTP (lo usa nodemailer para correos transaccionales) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=no-reply@uiab.com.ar
SMTP_PASS=xxxxxxxxxxxxxxxx
# SMTP_SECURE=true   # opcional, por defecto true si port=465

# Remitente (tiene que ser un email válido del dominio autenticado por SMTP)
EMAIL_FROM="Conectar UIAB <no-reply@uiab.com.ar>"

# Destinatario de las notificaciones de nuevas solicitudes
ADMIN_NOTIFICATION_EMAIL=admin@uiab.com.ar
```

> Si cualquier variable SMTP falta, los correos transaccionales se **saltan
> silenciosamente** (quedan log-warn). Ningún server action falla por ausencia
> de SMTP — ideal para CI y entornos sin credenciales.

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
| Sender email     | `no-reply@uiab.com.ar` (mismo que `EMAIL_FROM`)     |
| Sender name      | `Conectar UIAB`                                     |
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

#### a) Confirm signup

- **Subject**: `Confirmá tu email — Conectar UIAB`
- **Body** (HTML):

```html
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f2f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f6;">
      <tr><td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr><td style="padding:28px 32px;background:linear-gradient(135deg,#00213f,#10375c);border-radius:4px 4px 0 0;">
            <div style="font-family:Manrope,Inter,Arial,sans-serif;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.01em;">
              Conectar <span style="opacity:.75;font-weight:600;">UIAB</span>
            </div>
            <div style="margin-top:2px;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.65);">
              Unión Industrial de Almirante Brown
            </div>
          </td></tr>
          <tr><td style="padding:40px 32px;background:#ffffff;border-radius:0 0 4px 4px;">
            <h1 style="margin:0 0 12px;font-family:Manrope,Inter,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#191c1e;">
              Confirmá tu email
            </h1>
            <p style="margin:0 0 24px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#525b63;">
              Gracias por sumarte a <strong>Conectar UIAB</strong>. Para activar tu cuenta, confirmá tu dirección de correo con el botón de abajo. El enlace expira en 24 horas.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
              <tr><td style="border-radius:4px;background:linear-gradient(135deg,#00213f,#10375c);">
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:.02em;color:#fff;text-decoration:none;border-radius:4px;">
                  Confirmar mi email
                </a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;padding-top:20px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;color:#525b63;">
              Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
              <span style="color:#001b55;word-break:break-all;">{{ .ConfirmationURL }}</span>
            </p>
          </td></tr>
          <tr><td style="padding:24px 32px;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#525b63;text-align:center;">
            Si no te registraste en Conectar UIAB, podés ignorar este correo.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

#### b) Reset password

- **Subject**: `Recuperá tu acceso — Conectar UIAB`
- **Body**: igual al de signup, pero cambiar:
  - `<h1>` → `Recuperá tu contraseña`
  - párrafo intro → `Recibimos una solicitud para resetear la contraseña de tu cuenta en Conectar UIAB. Tocá el botón para elegir una nueva. Si no fuiste vos, podés ignorar este correo.`
  - botón → `Elegir nueva contraseña`

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
   - A la casilla de la empresa debe llegar "Bienvenida a Conectar UIAB".
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
