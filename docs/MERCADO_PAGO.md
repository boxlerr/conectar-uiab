# Integración Mercado Pago — Suscripciones UIAB Conecta

> Documentación técnica y operativa completa de la integración con Mercado Pago usando **Suscripciones con integración (Preapproval API)**.

---

## 1. Resumen

UIAB Conecta cobra a **empresas** y **proveedores particulares** una suscripción mensual recurrente. El monto de empresa depende de la cantidad de empleados (tarifa 1/2/3 calculada en DB). Para particulares el precio es fijo.

Se soportan **tres métodos de pago**:

| Método | Flujo | Estado inicial |
|---|---|---|
| `mercadopago` | Preapproval recurrente. Webhook actualiza estado. | `pendiente` hasta primer cobro |
| `efectivo` | Admin marca pago en persona con fecha real. | `activa` al marcarla |
| `cheque` | Igual que efectivo, con nota/referencia. | `activa` al marcarla |

La **base de datos es la fuente de verdad**. El webhook de Mercado Pago nunca muta estado sin persistir un `pagos_suscripciones` con el `payload` completo de auditoría.

---

## 2. Arquitectura

```
┌─────────────────┐     1. signUp           ┌────────────────────┐
│ /register       │────────────────────────▶│ /api/auth/         │
│ (form)          │                         │ register-sync      │
└─────────────────┘                         └────────┬───────────┘
        │                                            │ crea empresa/proveedor
        │ 2. redirect con entityId                   ▼
        ▼                                    suscripciones (estado='pendiente_pago')
┌─────────────────────┐   3. POST preapproval  ┌────────────────────┐
│ /suscripcion/       │────────────────────────▶│ /api/mercadopago/  │
│ checkout            │                         │ crear-preapproval  │
└─────────────────────┘◀────────────────────────└────────┬───────────┘
        │   init_point URL                              │
        ▼                                               ▼
┌─────────────────┐   4. paga en MP            ┌────────────────┐
│ Mercado Pago    │────────────────────────────│ Mercado Pago   │
│ checkout        │                             │ Preapproval API│
└─────────────────┘                             └────────┬───────┘
                                                         │ 5. webhook
                                                         ▼
                                                ┌─────────────────────┐
                                                │ /api/mercadopago/   │
                                                │ webhook             │
                                                └─────────┬───────────┘
                                                          │ upsert pago + actualiza suscripción
                                                          │ envía email
                                                          ▼
                                                    DB Supabase
```

---

## 3. Variables de entorno

Agregar a `.env.local` (dev) y al host de producción:

```bash
# Mercado Pago (TEST)
MP_ACCESS_TOKEN=TEST-7739484298405782-042009-531ee0c550b25ed35ed53410acebb0e6-202435889
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-a7750035-c5f2-4ae0-8087-a610e624e2c8
MP_WEBHOOK_SECRET=         # Obtener al configurar webhook en panel MP
MP_ENTORNO=test            # 'test' | 'prod'

# Ya existentes — verificar
NEXT_PUBLIC_APP_URL=https://conectar-uiab.vercel.app
SUPABASE_SERVICE_ROLE_KEY=...
```

Al pasar a **producción** simplemente reemplazar `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY` por los de la cuenta de UIAB, y `MP_ENTORNO=prod`. **No hay otros cambios de código.**

---

## 4. Tablas (esquema)

### `suscripciones` (extendida)

Columnas ya existentes (no tocar):
`id, empresa_id, proveedor_id, monto, moneda, estado, nombre_plan, mercado_pago_customer_id, mercado_pago_preapproval_id, inicia_en, finaliza_en, cancelada_en, creado_en, actualizado_en`

**Columnas agregadas por `20260420_mercadopago_integracion.sql`:**

| Columna | Tipo | Notas |
|---|---|---|
| `metodo_pago` | text | `mercadopago` / `efectivo` / `cheque` |
| `proximo_cobro_en` | timestamptz | Fecha del próximo intento de cobro |
| `ultima_notificacion_en` | timestamptz | Última vez que mandamos mail recordatorio |
| `gracia_hasta` | timestamptz | Hasta cuándo permite acceso aun sin pago |
| `notas_admin` | text | Anotaciones internas (p.ej. nro cheque) |

**Valores de `estado`:**
- `pendiente_pago`: creada, sin primer cobro confirmado
- `activa`: pago al día
- `en_mora`: pago vencido, aún en período de gracia
- `suspendida`: gracia vencida, acceso bloqueado
- `cancelada`: canceladas por usuario o admin

### `pagos_suscripciones` (extendida)

Columnas agregadas:

| Columna | Tipo | Notas |
|---|---|---|
| `metodo_pago` | text | `mercadopago` / `efectivo` / `cheque` |
| `tipo_pago` | text | `automatico` / `manual` |
| `registrado_por` | uuid | Admin que cargó el pago manual |
| `nota` | text | p.ej. "Cheque 0001 Banco Galicia" |

---

## 5. Flujo de registro + primer pago

1. Usuario completa `/register`, elige `empresa` o `particular`.
2. `/api/auth/register-sync` crea `perfiles`, `empresas`/`proveedores` y una fila en `suscripciones` con `estado='pendiente_pago'`.
3. Redirige a **`/suscripcion/checkout`** en vez de `/confirmar-email` cuando es un rol pagante.
4. La página checkout llama a **`POST /api/mercadopago/crear-preapproval`** y redirige al `init_point` de MP.
5. El usuario paga en MP. MP dispara webhook.
6. `/api/mercadopago/webhook` valida firma, guarda pago e cambia `suscripciones.estado='activa'`.
7. Email "¡Pago confirmado!" al usuario + admin.

**Particulares sin onboarding de pago forzado**: si UIAB decide dejarlos gratis, marcar `metodo_pago='efectivo'` y `estado='activa'` al crear (flag `SUSCRIPCION_PARTICULAR_GRATIS`).

---

## 6. Webhook de Mercado Pago

Endpoint: `POST /api/mercadopago/webhook`

**Configurarlo en**: https://www.mercadopago.com.ar/developers/panel/app/7739484298405782/webhooks

- URL: `https://conectar-uiab.vercel.app/api/mercadopago/webhook`
- Eventos: `subscription_preapproval`, `subscription_authorized_payment`, `payment`
- Tipo de firma: HMAC (guardar el secret en `MP_WEBHOOK_SECRET`)

**Qué hace el handler:**

1. Valida header `x-signature` con `MP_WEBHOOK_SECRET`.
2. Según `type`:
   - `payment`: consulta MP, crea/actualiza `pagos_suscripciones`, si `status='approved'` marca suscripción como `activa` y extiende `proximo_cobro_en` +1 mes.
   - `subscription_preapproval`: sincroniza el estado del preapproval.
   - `subscription_authorized_payment`: igual que payment pero con link directo a preapproval.
3. Responde 200 SIEMPRE (MP reintentaria si no).
4. Logs de fallos a `pagos_suscripciones.payload`.

---

## 7. Cancelación

Endpoint: `POST /api/mercadopago/cancelar` (requiere auth).

- Llama a `PUT /preapproval/{id}` en MP con `status='cancelled'`.
- Marca `suscripciones.cancelada_en = now()`, `estado='cancelada'`.
- Permite acceso hasta `finaliza_en` (= fin del período ya pagado).
- Envía email de confirmación.

Desde admin: `/admin/suscripciones` tiene botón "Cancelar suscripción" que llama al mismo endpoint con `as_admin=true`.

---

## 8. Acceso bloqueado (gate)

- `src/middleware.ts` consulta si la ruta es "pagante" (`/dashboard`, `/perfil` excepto `/perfil/suscripcion`).
- Si `suscripciones.estado` no está en `['activa', 'pendiente_pago', 'en_mora']` y ya pasó la fecha de `gracia_hasta`, redirige a **`/suscripcion/bloqueado`**.
- La página `/suscripcion/bloqueado` muestra el estado + botón "Pagar ahora" que lleva al checkout.

---

## 9. Emails

Plantillas en `src/lib/email/plantillas.ts`:

| Plantilla | Asunto | Cuándo |
|---|---|---|
| `plantillaSuscripcionPendiente` | "Completá tu suscripción a UIAB Conecta" | Tras registro si no pagó |
| `plantillaPagoConfirmado` | "¡Pago confirmado! Tu suscripción está activa" | Webhook `approved` |
| `plantillaPagoFallido` | "No pudimos procesar tu pago" | Webhook `rejected` |
| `plantillaSuscripcionCancelada` | "Tu suscripción fue cancelada" | Cancelación manual |
| `plantillaRecordatorioVencimiento` | "Tu suscripción vence pronto" | Cron 3 días antes |
| `plantillaSuscripcionSuspendida` | "Acceso suspendido por falta de pago" | Tras `gracia_hasta` |
| `plantillaPagoManualRegistrado` | "Registramos tu pago en efectivo/cheque" | Admin carga pago manual |

---

## 10. Admin: pagos manuales

En `/admin/suscripciones/PanelSuscripciones.tsx`, por cada empresa/proveedor:

- Botón **"Registrar pago manual"** → modal:
  - Fecha del pago
  - Método (efectivo / cheque)
  - Monto (pre-cargado según tarifa)
  - Nota (número cheque, banco, etc.)
- Al confirmar, llama a `POST /api/admin/suscripciones/pago-manual`:
  - Crea `pagos_suscripciones` con `tipo_pago='manual'` y `registrado_por=admin.id`.
  - Actualiza `suscripciones.estado='activa'`, `proximo_cobro_en = fecha + 1 mes`.
  - Envía `plantillaPagoManualRegistrado`.

---

## 11. Cron de recordatorios y suspensiones

Vercel Cron (`vercel.json`) ejecuta **`GET /api/cron/suscripciones`** diariamente a las 08:00 ART:

- Empresas con `proximo_cobro_en - 3 días` ⇒ enviar `plantillaRecordatorioVencimiento`.
- Empresas con `estado='activa'` y `proximo_cobro_en < now()` ⇒ pasar a `en_mora`, setear `gracia_hasta = now() + 7 días`.
- Empresas con `estado='en_mora'` y `gracia_hasta < now()` ⇒ pasar a `suspendida`, enviar mail.

**Seguridad**: el endpoint valida `CRON_SECRET` en header.

---

## 12. Testing

### 12.1 Local

```bash
# .env.local con TEST keys
npm run dev

# En otra terminal:
npm run test:mp  # (agregado al package.json)
```

### 12.2 Tarjetas de prueba (Argentina, MP test)

| Red | Número | CVV | Vto | Nombre / resultado |
|---|---|---|---|---|
| Visa (aprobada) | 4509 9535 6623 3704 | 123 | 11/30 | APRO (aprobado) |
| Visa (pend.) | 4509 9535 6623 3704 | 123 | 11/30 | CONT (pendiente) |
| Master (rech.) | 5031 7557 3453 0604 | 123 | 11/30 | OTHE (rechazo genérico) |

Usuarios de prueba: https://www.mercadopago.com.ar/developers/panel/app/7739484298405782/test-accounts — hay que crear una cuenta **comprador** y otra **vendedor** (esto ya lo pide el panel en "Etapa 1 de 5").

### 12.3 Test local del webhook

Mercado Pago no llega a `localhost`. Usar `ngrok`:

```bash
ngrok http 3000
# Copiar URL pública https://xxxx.ngrok.app
# Configurarla en panel MP > Webhooks > URL
```

O simular el webhook manualmente:

```bash
curl -X POST http://localhost:3000/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=..." \
  -H "x-request-id: test-123" \
  -d '{"type":"payment","data":{"id":"1234567890"},"action":"payment.created"}'
```

El endpoint detecta `MP_ENTORNO=test` y relaja validación de firma para `x-signature=skip`.

### 12.4 Tests automatizados (vitest)

```bash
npm test
```

Cubren:
- `suscripciones.calcularMontoPorEmpleados` (1/2/3)
- `mercadopago.cliente.crearPreapproval` (con mock fetch)
- `mercadopago.webhook.validarFirma`
- Flujo de pago manual (marca estado activa)
- Gate de acceso bloquea `/perfil` si suspendida

---

## 13. Pasar a producción — checklist

- [ ] Cambiar `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY` a las de la cuenta productiva de UIAB.
- [ ] `MP_ENTORNO=prod`.
- [ ] Reconfigurar Webhook en panel MP con la URL de prod.
- [ ] Guardar `MP_WEBHOOK_SECRET` nuevo.
- [ ] Correr migración `20260420_mercadopago_integracion.sql` en la DB prod.
- [ ] Verificar que `ADMIN_NOTIFICATION_EMAIL` apunte al mail real.
- [ ] Crear Vercel Cron para `/api/cron/suscripciones`.
- [ ] Seed de `tarifas_precios` con los montos vigentes aprobados.
- [ ] Hacer un pago real de prueba con monto bajo y reembolsar.

---

## 14. Archivos clave creados / modificados

```
docs/MERCADO_PAGO.md                                   ← ESTE DOC
supabase/migrations/20260420_mercadopago_integracion.sql
src/lib/mercadopago/cliente.ts
src/lib/mercadopago/suscripciones.ts
src/lib/mercadopago/firma.ts
src/app/api/mercadopago/crear-preapproval/route.ts
src/app/api/mercadopago/webhook/route.ts
src/app/api/mercadopago/cancelar/route.ts
src/app/api/admin/suscripciones/pago-manual/route.ts
src/app/api/cron/suscripciones/route.ts
src/app/suscripcion/checkout/page.tsx
src/app/suscripcion/bloqueado/page.tsx
src/app/perfil/suscripcion/page.tsx                    ← actualizada
src/app/admin/suscripciones/PanelSuscripciones.tsx     ← + botón pago manual
src/app/(auth)/register/page.tsx                       ← redirect post-signup
src/lib/email/plantillas.ts                            ← + 7 plantillas
src/middleware.ts                                      ← + gate acceso
src/tests/mercadopago.test.ts
src/tests/suscripciones.test.ts
vercel.json                                            ← cron
```
