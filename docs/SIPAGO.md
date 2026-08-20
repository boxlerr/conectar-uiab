# Sipago — la pasarela de cobro de UIAB Conecta

> Reemplaza a Mercado Pago desde el 2026-08-20. La documentación vieja quedó en
> [MERCADO_PAGO.md](./MERCADO_PAGO.md) sólo como referencia histórica: ese código
> ya no existe en el repo.

---

## 1. Lo primero que hay que entender

Sipago es la pasarela de Banco Credicoop. Su **API de Cobros** hace una cosa:
crear un *link de pago* (una "orden" o intención de pago) y avisar cuando alguien
lo paga. Documentación oficial: <https://docs.sipago.coop>.

**Sipago son DOS productos distintos y la UIAB usa los dos.**

| | **Plan recurrente** | **Checkout (API de Cobros)** |
|---|---|---|
| Qué hace | El socio adhiere la tarjeta y Sipago debita solo | Un pago, una vez |
| Renueva solo | **Sí** | No |
| La app se entera | **No** — hay que conciliar por CUIT | **Sí** — webhook + verificación |
| Dónde se configura | A mano en el portal | Por API, desde el código |
| Se usa para | El canon **mensual** | El **anual** y regularizar mora |

Cuál se ofrece lo decide `SIPAGO_PLAN_<CICLO>_URL`: si el ciclo tiene un plan
cargado va por débito automático, y si no, cae al Checkout. Hoy el mensual tiene
plan y el anual no (ver §8).

Tres consecuencias del lado del Checkout, que conviene tener a mano antes de
tocar nada:

**El Checkout no renueva.** La API cobra una vez. No existe el equivalente al
`preapproval` de Mercado Pago. Para los ciclos sin plan, la recurrencia la
sostiene el cron: avisa 3 días antes del vencimiento y el socio vuelve a pagar.

**El webhook no viene firmado.** No hay HMAC ni secreto compartido: cualquiera
que conozca la URL puede postear "pago aprobado". Y como el `GET /orders/{uuid}`
de Sipago responde **sin autenticación**, los uuid tampoco son secretos. Por eso
el webhook nunca decide nada con el cuerpo del POST: saca el uuid y vuelve a
preguntarle a Sipago cuál es el estado real.

**Los montos van en centavos.** `amount` es un entero cuyos dos últimos dígitos
son los decimales: $50.000 se manda como `5000000`. Confundirlo es cobrar 100
veces de menos.

---

## 2. Ambientes y credenciales

| | Checkout (`base_url`) | Auth server |
|---|---|---|
| **development** | `https://api-cabal.preprod.geopagos.com` | `https://auth.stg.geopagos.io` |
| **production** | `https://api.sipago.coop` | `https://auth.prd.geopagos.io` |

Las de desarrollo son públicas y están en la documentación de Sipago. Las de
**producción** se piden desde el portal: <https://portal.sipago.coop> →
**Tiendas Online** → *API & Credenciales* → **Credenciales Checkout**.

### Variables de entorno

```bash
SIPAGO_ENTORNO=test              # 'test' | 'prod'. Cualquier otro valor cae en test.
SIPAGO_CLIENT_ID=...             # clave pública de la aplicación
SIPAGO_CLIENT_SECRET=...         # clave privada — SÓLO servidor, nunca al browser
SIPAGO_WEBHOOK_TOKEN=...         # secreto propio, va en el query string del webhook
# Opcionales: sólo si Sipago entrega hosts distintos a los de la tabla.
SIPAGO_API_URL=
SIPAGO_AUTH_URL=
```

`NEXT_PUBLIC_APP_URL` tiene que ser **https** y tiene que ser el dominio que
realmente sirve la app: Sipago rechaza `redirect_urls` y `webhookUrl` que no sean
https, y le manda el aviso del pago a lo que le hayamos dicho. En local
(`http://localhost:3000`) el cliente las omite solas para que igual se pueda
crear la orden y probar el checkout.

> **El dominio productivo es `https://uiabconecta.com`.** Hasta el 2026-08-20 esta
> variable decía `https://conectar-uiab.vercel.app`, que devuelve 404
> (`DEPLOYMENT_NOT_FOUND`). Con ese valor, un socio que pagara terminaba en una
> página inexistente y el webhook de Sipago moría contra un 404: el pago existía
> en Sipago y la suscripción nunca se activaba. Los links de todos los mails
> tenían el mismo problema.

Si faltan `SIPAGO_CLIENT_ID` / `SIPAGO_CLIENT_SECRET`, la app **no se rompe**:
`sipagoConfigurado()` da `false` y el checkout cae al circuito manual (§6).

---

## 3. El flujo

```
  /suscripcion/checkout
        │  POST /api/suscripcion/solicitar { ciclo }
        ▼
  ┌───────────────────────────────┐
  │ POST {api}/api/v2/orders      │  ← crea la intención de pago
  └───────────────┬───────────────┘
                  │ uuid + link de checkout
                  ▼
        suscripciones.sipago_order_uuid = uuid
        suscripciones.estado = 'pendiente_pago'
                  │
                  ▼
        el socio paga en el checkout de Sipago
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
  webhook de Sipago     el socio vuelve al sitio
  POST /api/sipago/     GET /api/suscripcion/
       webhook?t=...         estado-orden
        └─────────┬──────────┘
                  ▼
        acreditarOrden(uuid)   ← lib/sipago/acreditacion.ts
                  │
                  │ 1. busca la suscripción por uuid (si no está, corta acá)
                  │ 2. GET {api}/api/v2/orders/{uuid}  ← la ÚNICA fuente de verdad
                  │ 3. compara el monto
                  │ 4. inserta el pago (idempotente)
                  │ 5. suscripciones.estado = 'activa' + próximo cobro
                  │ 6. mails + notificación in-web
                  ▼
             DB Supabase
```

### Por qué hay dos caminos

El webhook reintenta 4 veces con ~2 minutos entre intentos y después se rinde. Un
deploy justo en esa ventana alcanza para que alguien pague y la plataforma nunca
se entere. Por eso, cuando el socio vuelve del checkout,
`/suscripcion/resultado` consulta por su cuenta.

Que los dos corran a la vez está contemplado: `acreditarOrden()` es idempotente y
el índice único `uq_pagos_sipago_order_aprobado` corta el empate en la base, que
es donde hay que cortarlo — entre el `SELECT` de control y el `INSERT` hay una
ventana, y es justo la ventana donde caen los reintentos.

---

## 4. Archivos

```
src/lib/sipago/cliente.ts               token, crear orden, consultar orden
src/lib/sipago/acreditacion.ts          pasar de "pagó" a "suscripción activa"
src/app/api/suscripcion/solicitar/      arranca el cobro (o el circuito manual)
src/app/api/sipago/webhook/             recibe el aviso de Sipago
src/app/api/suscripcion/estado-orden/   la segunda vía, para cuando el socio vuelve
src/app/suscripcion/checkout/           elegir ciclo y pagar
src/app/suscripcion/resultado/          adónde vuelve después de pagar
supabase/migrations/20260820_sipago_integracion.sql
src/tests/lib/sipago-cliente.test.ts
src/tests/lib/sipago-acreditacion.test.ts
```

---

## 5. Base de datos

`supabase/migrations/20260820_sipago_integracion.sql`:

| Cambio | Para qué |
|---|---|
| `suscripciones.sipago_order_uuid` | El único vínculo entre una orden y un socio: la API de Sipago no deja adjuntar una referencia propia. |
| `pagos_suscripciones.sipago_order_uuid` / `sipago_payment_id` | Auditoría del pago. |
| CHECK de `metodo_pago` ampliado | Ahora admite `sipago` y `transferencia`. El CHECK original sólo tenía `mercadopago/efectivo/cheque/cortesia`, y el código escribe `transferencia` desde el 2026-08-14. |
| default de `metodo_pago` → `transferencia` | Seguía en `mercadopago`, que ya no existe. |
| `uq_pagos_sipago_order_aprobado` (índice único parcial) | Que el mismo pago no se acredite dos veces. |

---

## 6. Cuando no hay pasarela

`POST /api/suscripcion/solicitar` devuelve una de tres cosas:

| Respuesta | Cuándo | Qué hace el checkout |
|---|---|---|
| `{ cortesia: true }` | socia UIAB, no paga | la manda al panel |
| `{ init_point: "https://…" }` | Sipago disponible | redirige al checkout |
| `{ manual: true }` | sin credenciales, o Sipago falló | anota el plan, avisa al admin y le dice al socio que lo van a contactar |

El tercer caso no es un error: es cómo funcionó la plataforma entre la baja de
Mercado Pago y la llegada de las credenciales de Sipago, y sigue siendo la red
cuando Sipago no contesta. Entre dejar al socio con "Error inesperado" y anotar
la intención avisando al admin para que lo llamen, lo segundo cobra.

---

## 7. Probarlo

### Local

```bash
npm run dev
```

Con `SIPAGO_ENTORNO=test` y las credenciales de desarrollo se crean órdenes
reales contra el ambiente de staging de Sipago y se puede pagar con las tarjetas
de prueba que provee Sipago (pedirlas a consultas@sipago.coop).

### El webhook, sin pagar

```bash
curl -X POST "http://localhost:3000/api/sipago/webhook?t=$SIPAGO_WEBHOOK_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"order":{"uuid":"<uuid-de-una-orden-real>","status":"SUCCESS"},"payment":{"id":1,"status":"APPROVED"}}}'
```

Sirve para simular el aviso, **no** para simular el pago: el handler consulta la
orden en Sipago y si no está paga de verdad no acredita nada. Es a propósito.

### Automatizados

```bash
npm test
```

Cubren el `expires_in` que no significa lo que dice la documentación, los montos
en centavos, las tres formas en que viene el link de checkout, la idempotencia
(incluido el choque contra el índice único), el monto que no coincide, y que un
rechazo no tumbe una suscripción que ya estaba paga.

---

## 8. El plan recurrente y la conciliación por CUIT

### Qué hay creado

En <https://portal.sipago.coop> → **Suscripciones** está el plan
**"UIAB Conecta - Mensual"**: $50.000, mensual, monto fijo, duración ilimitada,
con redirección a `uiabconecta.com/suscripcion/resultado?ref=ok`.

Su link es el que va en `SIPAGO_PLAN_MENSUAL_URL`.

**No hay plan anual, y es a propósito.** El plan anual de Sipago cobra en un
**mes y día fijos para todos** (no en el aniversario de cada socio), lo que
obliga a decidir qué pasa con el que se suscribe en octubre. Mientras eso no se
resuelva, el anual se paga con Checkout — que además se acredita solo.

### Por qué hay que conciliar

El módulo de Suscripciones del portal **no tiene webhook ni API pública**. Está
servido por un BFF interno (`negocio.sipago.coop/tdk-bff-payment-sipago/services/
api/recurringPayments`) que se autentica con la sesión Firebase del portal: con
las credenciales de Checkout devuelve 502. No es integrable desde el servidor.

Así que el cobro sale solo, pero la plataforma se entera cuando alguien trae el
reporte.

### Cómo se concilia

1. Portal → **Suscripciones → Cobros → Generar reporte**.
2. En UIAB Conecta: **/admin/suscripciones → "Conciliar Sipago"**.
3. Pegar el reporte, apretar **"Ver qué haría"**.
4. Revisar la lista y confirmar.

El cruce es por **CUIT**: es el único dato que el socio carga en el checkout del
plan y que nosotros ya tenemos (`empresas.cuit` / `proveedores.cuit`). Por eso el
checkout de la plataforma le muestra su CUIT antes de mandarlo a Sipago.

**El parser no mira los nombres de las columnas.** Reconoce cada dato por su
forma —un CUIT son once dígitos con prefijo válido, un importe tiene coma
decimal, una fecha se parece a una fecha—, así que sobrevive a que Sipago cambie
el formato del reporte. Está en `src/lib/sipago/conciliacion.ts` con 31 tests.

### Lo que la conciliación NO hace

| | |
|---|---|
| **No toca a las socias del padrón** | Las 57 empresas con `metodo_pago='cortesia'` tienen acceso sin cargo por decisión de la UIAB. **Sólo se cobra a las altas nuevas que entran por el registro.** Si una socia de cortesía apareciera en un reporte, se marca y se saltea. |
| **No aplica sin preview** | Escribe plata contra fichas reales y matchea por contenido. El botón de confirmar recién aparece después de mostrar la lista. |
| **No carga dos veces el mismo cobro** | La clave `rec-<cuit>-<fecha>` va a `sipago_order_uuid` y el índice único de la base rechaza el duplicado. Pegar el mismo reporte dos veces no extiende la suscripción. |
| **No activa si el importe no cierra** | Se compara contra lo que la suscripción debería costar; una diferencia mayor a $0,50 se marca para revisar. |

### El precio está en dos lados

El del plan lo fija el portal; el de la plataforma sale de
`configuraciones_sistema`. Sipago no expone una API para leer el plan, así que
**no hay forma de verificar desde el código que coincidan**: si se cambia el
precio en el panel de la UIAB hay que cambiarlo también en el portal. El panel
avisa (`avisoDeDesfasaje()` en `src/lib/sipago/planes.ts`), que es todo lo que se
puede hacer.

---

## 9. Pasar a producción — checklist

- [ ] Pedir las credenciales en el portal (Tiendas Online → **Solicitar credenciales**).
- [ ] Cargar `SIPAGO_CLIENT_ID` y `SIPAGO_CLIENT_SECRET` productivas en Vercel.
- [ ] `SIPAGO_ENTORNO=prod`.
- [ ] `SIPAGO_WEBHOOK_TOKEN` generado (`openssl rand -hex 24`) y cargado en Vercel.
- [ ] `NEXT_PUBLIC_APP_URL=https://uiabconecta.com` en Vercel (hoy dice conectar-uiab.vercel.app, que da 404).
- [ ] `CRON_SECRET` definida en Vercel — sin ella el cron no corre (falla cerrado a propósito).
- [ ] Borrar de Vercel las 7 variables `MP_*` / `NEXT_PUBLIC_MP_PUBLIC_KEY`: ya no las lee nadie.
- [ ] Correr `20260820_sipago_integracion.sql` en la base de producción.
- [ ] Verificar que `ADMIN_NOTIFICATION_EMAIL` sea el mail real que se mira.
- [ ] Cargar `SIPAGO_PLAN_MENSUAL_URL` con el link del plan del portal.
- [ ] Hacer un pago real de monto bajo y confirmar que la suscripción queda activa.
      (Ojo: montos de $1 los rechaza el emisor con código 13, "importe inválido".)
- [ ] Confirmar que llegaron los dos mails (socio y admin).
