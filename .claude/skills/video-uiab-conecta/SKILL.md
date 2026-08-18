---
name: video-uiab-conecta
description: Sistema de producción de videos demo de UIAB Conecta (uiabconecta.com) y de plataformas web en general. Define el reparto entre captura real, motion graphics en código y video generado, la gramática de planos, el esquema de guion.json y el loop de verificación por frames. Usala SIEMPRE que la tarea toque el video tutorial de UIAB, un demo de producto, un screencast, planos, encuadres, renders o Higgsfield —aunque el pedido venga como "arreglá esta parte del video" o "mejorá el capítulo 2" y no mencione la skill. Si vas a renderizar cualquier cosa que se mire, leé esto primero.
---

# Video demo — UIAB Conecta

Sistema para producir el tutorial de UIAB Conecta y videos del mismo estilo.
Existe porque cada sesión arranca sin memoria: acá está lo que ya se decidió,
lo que ya se rechazó y cómo se verifica antes de mostrar nada.

## Regla que ordena todo lo demás

Cada plano tiene una sola fuente, y la fuente la decide **qué se ve en pantalla**:

| Lo que se ve | Fuente | Por qué |
|---|---|---|
| La plataforma, cualquier pantalla, cualquier texto de la UI | **captura real** (Playwright) | Los modelos de video generan píxeles nuevos: la UI y el texto salen deformados. No hay prompt que lo arregle. |
| Títulos, recortes animados, la ficha armándose, contadores, máscaras | **código** (Remotion) sobre la captura | Determinista, editable, se re-renderiza igual siempre. |
| Hero de apertura, ambientación industrial, transición entre capítulos | **Higgsfield** | Lo único que hace bien. Nunca más del 10% del metraje. |

Si dudás de qué fuente le toca a un plano: ¿aparece una pantalla del producto?
Entonces es captura. Sin excepciones.

## Tokens

No inventes colores ni tipografías. Levantalos del repo del sitio y pegalos acá
la primera vez, así las sesiones siguientes no vuelven a buscarlos:

```bash
rg -n "colors|--background|--primary|--accent|fontFamily" \
   ../conectar-uiab/tailwind.config.* ../conectar-uiab/app/globals.css
```

Extraídos del repo (2026-08-18), y ya en uso en `marco.mjs` y `tipografia.mjs`:

- navy `#0c3c60` · navy oscuro `#061f33` · azul `#0382bf` · azul claro `#5fb9e8`
- acento naranja `#f97316`
- tipografías: **Poppins** (600 y 800) para todo el video. El sitio además usa
  Open Sans, Manrope, Inter y Geist; las dos de Poppins están versionadas en
  `herramientas/video-tutorial/assets/fuentes/`.

Reglas de uso, independientes de los valores:

- **Un solo acento por plano**, y va sobre lo que el título nombra. Si el acento
  está en tres lugares, no está en ninguno.
- **Tipografía de la UI** para todo lo que simule interfaz; la display solo para
  títulos de capítulo. Escala 1 / 1.6 / 2.6 sobre el cuerpo base.
- **La captura ocupa el cuadro.** Los gráficos son máscara, recorte y subrayado
  sobre ella. Nunca una tarjeta flotando encima de un fondo aparte.

## Gramática de planos

De acá salen los arreglos que más se piden. Aplicalas a todo el guion, no solo
al plano que te señalaron.

1. **Dos planos seguidos no comparten encuadre.** Si cambia el título, cambia el
   encuadre. Si el título es nuevo y la imagen es la misma, el plano está mal
   aunque el contenido sea correcto.
2. **Escalas dentro de cada bloque: general → medio → detalle.** El general
   ubica, el medio muestra la operación, el detalle recorta al elemento exacto
   que nombra el título. Un bloque entero en plano general se lee como monótono
   incluso si todo funciona.
3. **El detalle es un recorte al elemento, no la pantalla entera un poco más
   cerca.** Si después del zoom seguís viendo el header y el footer, no es
   detalle.
4. **El click tiene que verse**: cursor visible, pausa antes del click, ripple en
   el impacto, y el cambio de estado en pantalla después. Un click que no cambia
   nada visible no es un plano, es tiempo muerto.
5. **Antes/después en el mismo cuadro** cuando algo se filtra, se ordena o se
   valida. El valor del producto está en la transición, no en el resultado.
6. **Duración**: 2–4 s por plano. Si un plano necesita más de 4 s es porque
   contiene dos ideas: partilo en dos encuadres.
7. **Vertical o recorte cerrado** para lo que es denso en una pantalla ancha
   (filtros, formularios, listados). No achiques el contenido: recortá el cuadro.

## Movimiento

- Springs o cubic-bezier, nunca interpolación lineal. Lo lineal es la marca
  registrada del video hecho por máquina.
- Un movimiento por plano. Zoom **o** paneo **o** revelado, no los tres.
- Entradas de 300–500 ms, salidas más rápidas que las entradas.
- Los cortes van al pulso de la música. Un demo cortado a destiempo se siente
  muerto por más animación que tenga.

## Contenido real del sitio

Datos verificados de uiabconecta.com — usalos y no los inventes:

- **Caso demo: Vaxler**, en `/empresas/vaxler`. Nunca uses otras empresas socias
  como ejemplo, ni las nombres. Ya se pidió sacarlas.
- **Campos de la ficha**, en este orden: descripción, localidad · Almirante
  Brown, Sector, Servicios, Productos, Capacidad, certificaciones (ISO 9001),
  sello Verificado, reseñas, contacto directo. El argumento del video es que la
  ficha de Vaxler es la más completa: mostrala **completa y sin cortes**, campo
  por campo. Razón social + ubicación + rubro es exactamente el plano que se
  rechazó.
- **Rutas**: `/directorio`, `/empresas`, `/rubros`, `/rubros/<rubro>`,
  `/oportunidades`, `/register`, `/sumate`.
- **Filtros**: por tipo de organización (empresas socias, prestadores,
  educativas, financieras, cooperativas) y por rubro. Grabá el filtro
  **operándose** —abrir, elegir, resultados reordenándose— no el resultado ya
  aplicado.
- **Oportunidades**: publicar una necesidad, ver la cartelera, postularse. Son
  tres acciones distintas y necesitan tres encuadres distintos.
- **Verificación UIAB**: el CUIT se contrasta contra el padrón de socias antes de
  publicar. Es el diferencial institucional y merece su propio plano.

## guion.json

Fuente de verdad del video. Vive en la raíz del proyecto. Antes de tocar código
de render, escribilo o actualizalo.

```json
{
  "planos": [
    {
      "id": "cap2-ficha-vaxler-detalle",
      "capitulo": 2,
      "duracion": 3.2,
      "fuente": "captura",
      "accion": "click en tarjeta Vaxler desde /directorio; esperar /empresas/vaxler",
      "encuadre": "detalle",
      "recorte": [420, 180, 1080, 720],
      "texto": "La ficha más completa de la red",
      "estado": "pendiente"
    }
  ]
}
```

- `estado: "aprobado"` significa **no tocar**. Ni el encuadre, ni el texto, ni la
  duración, ni el archivo renderizado. Si un cambio global obliga a tocar un
  plano aprobado, preguntá antes.
- Cuando el usuario aprueba algo en el chat, marcalo aprobado en el archivo en
  ese momento. Si no queda escrito, la próxima sesión lo pisa.

## Loop de verificación

Nunca muestres un render sin haberlo mirado. Este es el paso que separa "está
listo" de "está repetido y no me di cuenta".

1. Antes de grabar, verificá que la navegación llegó: screenshot y comprobación
   de que la URL cambió. Un click que no navega hace que todos los planos
   siguientes caigan a la pantalla anterior — es la causa de "es siempre la
   misma pantalla".
2. Renderizá **por plano** a `renders/planos/<id>.mp4`. Nunca el video entero
   para probar un cambio.
3. Sacá un frame por plano y miralos:
   ```bash
   for f in renders/planos/*.mp4; do
     ffmpeg -y -i "$f" -vf "select=eq(n\,15)" -vframes 1 \
       "renders/frames/$(basename "$f" .mp4).png"
   done
   ```
4. Contrastá contra `guion.json`: ¿algún par consecutivo repite encuadre?
   ¿algún plano marcado "detalle" muestra la pantalla entera? Corregí **antes**
   de avisar.
5. Recién ahí concatená y copiá el final a `~/Desktop/uiab-renders/` con fecha y
   versión. Informá esa ruta, no una copia temporal de `/tmp`.

## Prohibido

Cosas ya rechazadas. Si aparecen, el plano se rehace:

- Higgsfield generando cualquier pantalla del producto.
- Dos planos consecutivos con el mismo encuadre.
- Títulos nuevos sobre imagen repetida.
- La ficha cortada o resumida a tres campos.
- Nombrar otras empresas socias como ejemplo.
- Zoom que deja el header y el footer a la vista y se presenta como detalle.
- Interpolación lineal.
- Mostrar un render sin haber mirado los frames.

## Cuando el pedido llega en bloque

Si te dan seis correcciones juntas: no las apliques en orden de aparición.
Ordenalas así, porque unas invalidan a otras:

1. Bugs de navegación y captura (lo que hace que el material esté mal de origen).
2. `guion.json`: encuadres, duraciones, textos.
3. Re-render de los planos afectados.
4. Verificación por frames.
5. Concatenar.

Y decí en qué punto quedaste. "Arreglado todo" sin decir qué se re-renderizó y
qué no es lo que hace que la sesión siguiente rompa lo aprobado.
