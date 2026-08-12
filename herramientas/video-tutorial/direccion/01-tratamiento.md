No voy a publicar artifact: devuelvo el tratamiento como texto, que es lo que el script parsea.

---

# TRATAMIENTO DE DIRECCIÓN — "UIAB Conecta" v2

**Duración final: 58.00 s · 1920×1080 · 30 fps · 22 planos · 21 cortes (21.7 cortes/min)**
Rejilla musical: 120 BPM, beat 0.5 s, compás 2.0 s, anclada en **t = 2.00** (el drop cae en el corte al producto). Toda duración de plano es múltiplo de 0.5 s.

---

## 1. La idea rectora

> **Deja de ser un navegador que alguien maneja y pasa a ser una cámara que mira un producto.** No se filma la web: se fotografía en alta resolución y se dirige en post. El encuadre reemplaza al cursor, el corte reemplaza al click, y el zoom reemplaza al scroll.

Corolario operativo, y es la decisión más grande del documento: **no se graba video del sitio**. Se capturan ~34 PNG de 3200×1800 (viewport 1600×900 con `deviceScaleFactor: 2`) y todo el movimiento lo genera ffmpeg. Eso hace desaparecer de raíz las cuatro críticas del cliente —lo tosco, lo lento, lo rapidísimo y la marca horrible— porque desaparece la causa común: el tiempo real.

Beneficio técnico gratis: con la captura a 2× y la pantalla mostrada a 1600×900, **todo zoom hasta Z=2.0 es 1:1 de píxel o mejor**. Z=2.0 es exactamente nativo. Nunca se escala hacia arriba.

---

## 2. Escaleta plano por plano

**Convención de encuadre.** Los encuadres se declaran por selector, no por píxeles: el script resuelve `boundingBox()` en el viewport de 1600×900 y aplica

```
encuadre(sel, z) →  w = 1600/z ; h = 900/z
                    x = clamp(cx - w/2, 0, 1600-w)
                    y = clamp(cy - h/2, 0, 900-h)
regla de talle:     z se corrige hasta que el elemento ocupe 70% ±8% del alto del encuadre
```

**Tres tipos de movimiento, y hay que distinguirlos:**
- **Punch-in / pull-out visible** (el espectador ve moverse la cámara). Sólo **7 en toda la pieza** — 1 cada 8.3 s. Entrada 450–800 ms `cubic-bezier(0.05,0.7,0.1,1)`; salida 300–500 ms `cubic-bezier(0.3,0,0.8,0.15)`.
- **Deriva** (drift): 1.0–2.0 % de escala por segundo. Es lo que impide que un plano de 4 s se sienta muerto. Va en casi todos los planos.
- **Reencuadre en el corte**: el plano siguiente ya arranca en otra Z. Es gratis y es la mayoría de los "zooms" que el cliente va a percibir.

**Y un cuarto dispositivo, nuevo: el CORTE DE ESTADO.** Mismo encuadre exacto, sólo cambia la UI (el chip se enciende, el contador baja, el campo se llena). Mínimo 0.30 s entre estados. No cuenta como corte —se lee como animación de la interfaz— y es lo que reemplaza a filmar clicks.

| # | t inicio–fin | dur | Qué se ve | Cámara | Texto | Salida |
|---|---|---|---|---|---|---|
| **S00** | 0.00–2.00 | 2.00 | Aéreo de apertura (`assets/apertura.mp4`, **últimos 2.0 s**: el dron acelera, el pico está al final). Full bleed, sin marco. `eq=brightness=-0.05:saturation=1.06` + viñeta. | — | **Logo UIAB Conecta 820 px centrado**, fade-in `st=0.25 d=0.35`. Ver §5.1. | El logo empieza a viajar en **1.70**. El corte de imagen cae en 2.00, en mitad del viaje: el ojo sigue el logo y no registra el corte. |
| **S01** | 2.00–3.50 | 1.50 | Panel de control, tarjeta de match con su badge de % (`[data-tour="dash-matches"]`, primera tarjeta). | Z 1.90→1.86 (deriva de retroceso, 1.4 %/s) | — | Corte seco |
| **S02** | 3.50–5.00 | 1.50 | Ficha de Vaxler, bloque de contacto: mail y teléfono legibles (`[data-tour="ficha-sidebar-contacto"]`). | Z 1.80→1.77 | — | Corte seco |
| **S03** | 5.00–6.00 | 1.00 | Oportunidades, una tarjeta con el chip "Abierta" (`[data-tour="op-tarjeta"]`). | Z 1.70→1.68 | — | Corte seco |
| **S04** | 6.00–10.50 | 4.50 | **Directorio completo dentro del marco.** Z=1.00 = 1:1 exacto, la única vez que se ve la página entera. | Z 1.000→1.072 (deriva 1.6 %/s) | **T1** (L) `UIAB CONECTA` / "Todo el parque, en una pantalla". In 6.40 · legible 6.62 · out 9.92 | Corte seco |
| **S05** | 10.50–14.50 | 4.00 | Buscador (`[data-tour="directorio-buscador"]`). El campo se escribe solo: cortes de estado en **12.60 / 12.70 / 12.80 / 12.90** → `m` `me` `met` `metal`. | **Punch-in Z 1.00→1.55, 500 ms** (10.50–11.00), luego quieto | **T2** (M) `DIRECTORIO` / "Buscá por rubro o nombre". In 10.83 · legible 11.05 · out 14.00 | Corte seco |
| **S06** | 14.50–16.50 | 2.00 | Toolbar con el contador ya actualizado (`[data-tour="directorio-toolbar"]`). El corte ES la causalidad: escribiste → esto pasó. | Z 1.85→1.81 | — | Corte seco |
| **S07** | 16.50–18.50 | 2.00 | Sidebar de filtros. **Corte de estado en 17.50**: el chip se enciende y el contador baja. Mismo encuadre. | Z 1.60→1.56 | — | Corte seco |
| **S08** | 18.50–20.50 | 2.00 | Grilla de resultados, tarjeta de Vaxler **en estado `:hover`** (capturada con `hover()`, no con un cursor dibujado). | Z 1.45→1.42 | — | **Match cut** |
| **S09** | 20.50–21.50 | 1.00 | Ficha de Vaxler. El logo y la razón social caen en **la misma posición y escala** que tenían en la tarjeta de S08. | Z 1.45→1.30 (pull-out 300 ms) | — | Corte seco |
| **S10** | 21.50–25.50 | 4.00 | Ficha completa: identidad, servicios con foto, etiquetas. | **Pull-out Z 1.30→1.00, 800 ms**, luego deriva 1.00→1.03 | **T3** (M) `LA FICHA` / "Verificada por la UIAB". In 22.02 · legible 22.24 · out 24.84 | Corte seco |
| **S11** | 25.50–27.00 | 1.50 | Grilla de 6 servicios con foto (`[data-tour="perfil-servicios"]`). | Z 1.70 fija + **tilt de 45 px hacia abajo** (3.3 %/s) — la cámara recorre, no la página | — | Corte seco |
| **S12** | 27.00–31.00 | 4.00 | Bloque de contacto: mail, teléfono, web. | **Punch-in Z 1.00→1.75, 450 ms**, luego deriva →1.79 | **T4** (M) "Contacto directo. Sin intermediarios." In 27.29 · legible 27.51 · out 30.11 | **Disolvencia 0.30 s** (9 f) centrada en 31.00 — cambio de sección |
| **S13** | 31.00–32.00 | 1.00 | Tablero de Oportunidades, wide. Z=1.00. | deriva 1.00→1.015 | — | Corte seco |
| **S14** | 32.00–36.00 | 4.00 | Tarjeta de pedido: estado, empresa, rubro, fecha. | **Punch-in Z 1.00→1.60, 450 ms** | **T5** (M) `OPORTUNIDADES` / "Pedidos abiertos del parque". In 32.29 · legible 32.51 · out 35.11 | **Match cut** |
| **S15** | 36.00–37.50 | 1.50 | Detalle: ficha técnica (`[data-tour="op-detalle-ficha"]`) — cantidad, plazo, ubicación. Los datos son el texto: no lleva cartel. | Z 1.70→1.66 | — | Corte seco |
| **S16** | 37.50–39.00 | 1.50 | Botón "Postularme" en `:hover` (`[data-tour="op-detalle-postular"]`). | Z 1.55→1.52 | — | Corte seco |
| **S17** | 39.00–42.50 | 3.50 | Modal abierto con la propuesta escrita. Cortes de estado en 39.90/40.00/40.10/40.20 para el tipeo (4×). **Nunca se aprieta Enviar.** | Z 1.40→1.44 | **T6** (M) "Respondés desde acá". In 39.40 · legible 39.62 · out 41.87 | Corte seco |
| **S18** | 42.50–43.50 | 1.00 | `/oportunidades/nueva`, formulario vacío, Z=1.00. | deriva 1.00→1.015 | — | Corte seco |
| **S19** | 43.50–47.00 | 3.50 | El formulario se completa solo: cortes de estado en **44.20** (título) · **44.60** (localidad) · **45.00** (rubro elegido). | **Punch-in Z 1.00→1.45, 450 ms** | **T7** (M) `PUBLICÁ` / "Contá qué necesitás". In 43.79 · legible 44.01 · out 46.26 | **Disolvencia 0.40 s** (12 f) centrada en 47.00 — salto de contexto |
| **S20** | 47.00–54.00 | **7.00** | **EL PLANO SOSTENIDO.** Panel de control: los matches con su porcentaje. Está al **81 % del runtime** (objetivo 72–92 %). | **Punch-in Z 1.00→1.30, 700 ms** (47.00–47.70) → deriva 1.30→1.36 (1.3 %/s) → **cámara CONGELADA 51.10–53.30** → deriva 1.36→1.38 | **T8** (L) `EL MATCH` / "El sistema te lo sugiere". In 47.46 · legible 47.68 · out 50.63.  **BADGE** "94 % compatible" (el número se lee del DOM, no se inventa) in 51.20 · legible 51.44 · out 53.44 | **Disolvencia 0.40 s** centrada en 54.00 |
| **S21** | 54.00–58.00 | 4.00 | Aéreo de cierre (`assets/cierre.mp4`, primeros 4.0 s). Full bleed, sin marco. | — | El logo **vuelve** de la esquina al centro a 820 px (53.80–54.30, ver §5.1). URL `uiabconecta.com` in 54.80. Fade a negro 57.47–58.00 (16 f) | FIN |

**Verificación contra la checklist:** duración 58 s ✓ · 22 planos ✓ · 21.7 cortes/min ✓ (rango 18–26) · plano más corto 1.00 s ✓ (piso 0.6) · ningún plano estático >4 s ✓ · hold de 7 s al 81 % ✓ · primer frame de producto sin branding en 2.00 ✓ · momento "ajá" en 2.00 (el match, en el hook) ✓ · 17 de 21 cortes secos = **81 %** — los 4 restantes son disolvencias de sección, más el match cut que técnicamente es seco (86 % si se lo cuenta como tal) ✓ · 7 zooms animados ✓ (techo 18) · 0 planos con cursor ✓ · 0 frames de spinner ✓ · logo final 4 s ✓.

---

## 3. Qué se elimina, y por qué

| Sale | Dónde vive hoy | Por qué |
|---|---|---|
| **El recuadro naranja de foco** | `#uiab-foco` (`capa-visual.js:78-105`), 6 llamadas a `foco()`/`focoOff()` en `escenas/` | Es "la marca horrible sin sentido". Un stroke duro de esquinas rectas alrededor de elementos redondeados, opacidad plena, que aparece de golpe y se queda todo el plano. **El resaltado pasa a ser el encuadre**: si el elemento ocupa el 70 % del alto del cuadro, no hay nada que señalar. |
| **El cursor y la onda de click** | `#uiab-cursor`, `#uiab-onda`, y todo `moverA`/`clickEn` como acción filmada | El cursor viajando ES el "tosco recorriendo lento": 1.5–2.5 s muertos por interacción. Se van los 22 planos con cursor → **cero**. La intención se cuenta con el estado `:hover` real del botón (que el producto ya tiene) y el click se cuenta con el corte. |
| **La barra de progreso** | `#uiab-barra` + 14 llamadas a `progreso()` | Una barra que avanza le dice al espectador cuánto falta para que termine. En 58 s eso sólo puede restar. Además ocupa el borde superior, que es donde va el marco. |
| **El chip de capítulo** | `#uiab-chip` | Texto persistente compitiendo con los carteles. La estructura la da el **eyebrow** de cada cartel (`DIRECTORIO`, `OPORTUNIDADES`, `PUBLICÁ`, `EL MATCH`), que aparece y se va con su plano. |
| **Las placas a pantalla completa** | `#uiab-placa` + `placa()`/`placaOff()`, 3 usos | Cortan el producto en seco y regalan 4.7 s. La única placa que sobrevive es el lockup final. |
| **Los subtítulos inyectados** | `#uiab-sub` a **27 px** y **54 px del borde inferior** | Debajo del piso legible (28 px) y metidos en la franja de la barra de progreso de YouTube/LinkedIn. Reemplazados por PNGs pre-renderizados a 44/52 px, ver §4. |
| **Los scrolls largos** | `scrollSuave`/`scrollA` con `ms: 520–560`, 8 usos | Medio segundo de página deslizándose, ocho veces = 4.3 s de nada. El reencuadre se hace en el corte o con tilt de cámara (S11). |
| **La grabación de video del sitio** | `recordVideo` en `grabar.mjs:91` | Es la raíz de todo. Se reemplaza por `screenshot({ scale: 'device', animations: 'disabled', caret: 'hide' })`. |
| **El factor de velocidad global** | `--velocidad` / `setpts` en `montar.mjs:221`, tope 1.6× | Acelerar todo por igual es exactamente por qué "se queda sin pasar nada" y otras veces "se va rapidísimo": el mismo multiplicador sobre planos que necesitaban tiempos opuestos. Cada plano dura ahora lo que dice la escaleta. |
| **El `xfade` entre capítulos** | `montar.mjs:256` | Ya no hay dos capítulos pegados: hay 22 planos. |
| **El sello (`#uiab-sello`)** | 3 usos | Se reduce a **un solo badge** en toda la pieza (el 94 % del hold). Un golpe visual que se repite deja de ser un golpe. |

`capa-visual.js` no se borra: se reduce a **higiene de captura** (ocultar el indicador de dev de Next, ocultar scrollbars, heredar las variables de fuente, forzar `reducedMotion`). Unas 40 líneas de las 484.

---

## 4. Sistema visual

### 4.1 El marco (PNG único de 1920×1080, pre-renderizado en Chromium a `deviceScaleFactor: 2` y bajado)

```
Lienzo                1920 × 1080
Tarjeta-pantalla      x=160  y=66  w=1600  h=900
  radio              26 px, SUPERELIPSE n=4.5 (path SVG, no border-radius)
  borde              NINGUNO
  sombra contacto    0 8px 20px rgba(0,0,0,0.55)
  sombra ambiente    0 48px 96px rgba(0,0,0,0.48)
  luz interior       inset 0 1px 0 rgba(255,255,255,0.10)   ← el "tell" de hardware
Franjas               arriba 66 · laterales 160 · abajo 114   (centrado óptico alto)
```

El hueco de 1600×900 recibe la captura **a escala 1:1 en Z=1.0**. No hay chrome de navegador dibujado: el dominio va abajo a la izquierda como tipografía, que es más limpio y no roba 44 px.

**Fondo:** gradiente 135° `#061f33 → #0c3c60 → #072a44`; glow radial en (960,120) `rgba(3,130,191,0.20)` r=980; grilla de 1 px cada 96 px a `rgba(255,255,255,0.028)`; viñeta radial hasta `rgba(0,0,0,0.42)` en las esquinas; **grano al 2 %** (imprescindible: sin él, H.264 hace bandas en el gradiente).

### 4.2 Los logos

Los dos son wordmarks de aspecto casi idéntico (UIAB 2800×538 = 5.20:1; Vaxler 11099×2152 = 5.16:1). Se ponen **a la misma altura, en esquinas diagonalmente opuestas** — riman.

| | Posición | Alto | Ancho resultante | Opacidad |
|---|---|---|---|---|
| **UIAB Conecta** (blanco) | superior izquierda, `x=64`, centro vertical `y=33` | **24 px** | 125 px | **0.92** |
| **Vaxler** | inferior derecha, borde derecho en `x=1856`, centro vertical `y=1034` | **24 px** | 124 px | **0.55** |
| `uiabconecta.com` | inferior izquierda, `x=64`, baseline `y=1041` | 18 px, Inter 600, uppercase, tracking 0.14em | — | 0.42 |

Los dos quedan **fuera del hueco de la pantalla**: nunca tapan UI.

⚠ `public/logo-vaxler.png` es tinta gris oscura (~`#4a474a`) con alfa — invisible sobre navy. Hay que sacarle una versión en blanco: `format=rgba,geq=r=255:g=255:b=255:a='alpha(X,Y)'`.

Los logos **no van dentro del PNG del marco**: se componen aparte, porque el de UIAB tiene que aparecer recién en 2.20 (cuando aterriza el travelling) y volver a irse en 53.80.

### 4.3 Tipografía de los carteles

Dos familias, dos pesos, y se acabó.

| Rol | Fuente | Tamaño | Peso | Tracking |
|---|---|---|---|---|
| Línea, tamaño **L** (T1, T8) | Manrope | **52 px** | 800 | −0.015em |
| Línea, tamaño **M** (resto) | Manrope | **44 px** | 800 | −0.01em |
| Eyebrow | Inter | **18 px** uppercase | 600 | **+0.12em** |
| Badge | Manrope | 24 px | 800 | 0 |
| URL de cierre | Inter | 18 px uppercase | 600 | +0.14em |

**Caja del cartel** — posición A, tercio inferior, anclada a la grilla de la pantalla (no al centro del cuadro):

```
x = 200  (borde izq. de la pantalla + 40 de inset)
borde inferior de la caja  y = 940   (48 px por encima del borde inferior de la pantalla)
ancho máximo 860 px · padding 26/34/28/30 · radio 14
relleno rgba(7,42,68,0.62)  SOBRE UN DESENFOQUE REAL del fondo (ver §6)
barra de acento izquierda 5 px #f97316, a toda la altura
sombra 0 18px 40px rgba(0,0,0,0.35)   ·   sin borde
eyebrow #f97316, margen inferior 10 px
línea #ffffff, line-height 1.15, UNA sola línea, ≤42 caracteres
```

**Badge** (uno solo en la pieza): píldora h=52, radio 999, padding 0/28, relleno `#f97316`, texto **`#0c3c60`** (blanco sobre naranja da 3.0:1, insuficiente; navy da 4.6:1). Anclado 24 px por encima y 16 px a la derecha del bounding box del elemento que resalta.

**Fórmula de permanencia** (texto no narrado — no hay locución en esta pieza):
`hold = 1.2 s + 0.35 s × palabras`, piso 1.5 s, techo 5.0 s, **+0.5 s si contiene una cifra**. Densidad máxima 20 caracteres/segundo, siempre.

---

## 5. Sincronización

### 5.1 El logo: un solo objeto de punta a punta

Esto es lo que responde "no se ve el logo en la primera animación". El logo **no aparece dos veces: entra una vez y no se va nunca**.

```
0.25 – 0.60   fade-in, 820 px, centrado, sobre el aéreo
0.60 – 1.70   quieto (1.10 s de logo grande y legible; hoy son 0.9 s y entra tarde)
1.70 – 2.20   VIAJE: 820 px centrado  →  125 px en (64, 21)
              500 ms, cubic-bezier(0.22, 1, 0.36, 1)
              ⟵ EL CORTE DE IMAGEN CAE EN 2.00, EN MITAD DEL VIAJE
2.20 – 53.80  vive en la esquina superior izquierda, opacidad 0.92
53.80 – 54.30 VIAJE INVERSO: vuelve al centro a 820 px
              ⟵ LA DISOLVENCIA AL AÉREO CAE EN 54.00, EN MITAD DEL VIAJE
54.80         entra la URL debajo
57.47 – 58.00 fade a negro
```

Los dos viajes se pre-renderizan como **secuencias de 15 PNG RGBA de 1920×1080** en Chromium (la animación CSS real, no una aproximación con expresiones de ffmpeg) y se componen con `overlay`. El último frame de la secuencia de ida es **exactamente** la posición de reposo, así que el relevo con el overlay estático es invisible.

### 5.2 Texto contra cámara — la regla

> **La cámara llega primero. El texto aterriza después. Nunca al revés.**

Para un movimiento de cámara de duración **Z** que arranca en el corte:

```
t = 0.00 × Z    arranca el punch-in
t = 0.65 × Z    ← IN-POINT del cartel (la cámara ya recorrió ~90 % y desaceleró)
t = 1.00 × Z    cámara asentada
t = Z + 220 ms  cartel 100 % opaco y legible
```

- Si el plano **no** tiene punch-in (encuadre fijo o deriva): **in = corte + 400 ms**.
- Nunca antes del 50 % de Z. Nunca después de Z + 300 ms.
- **El tiempo de lectura se cuenta desde que el cartel está 100 % opaco**, no desde que empieza a entrar.

**Entrada del cartel (una sola, en toda la pieza):**
```
opacidad  0 → 1        220 ms  ease-out
translateY +24 → 0 px  420 ms  cubic-bezier(0.16, 1, 0.3, 1)     ← sin overshoot
```
La opacidad **termina antes** que el movimiento; si terminan juntas parece que se desvanece mientras se desliza.

**Salida (60 % de la entrada):** opacidad 180 ms `ease-in` + translateY −12 px en 260 ms. En bloque, sin stagger inverso.

**Entrada del badge (la única excepción, y sólo porque lleva una cifra):**
`scale 0.86 → 1.00 en 240 ms, cubic-bezier(0.34, 1.56, 0.64, 1)`, overshoot 6 %. Pre-renderizada como secuencia de 8 PNG.

**Distancia al corte:** el cartel tiene que estar **completamente fuera 200 ms antes** del corte duro. Restricción de diseño de cada plano:

```
duración mínima del plano con cartel  =  (0.65 × Z  ó  0.40)  +  0.22  +  hold  +  0.46
```

Por eso los planos con cartel duran 3.5–4.5 s y los que no llevan texto duran 1.0–2.0 s. Esa alternancia **es** la curva de ritmo.

**Y la regla del hold (S20):** entre 51.10 y 53.30 la cámara se detiene por completo (0 %/s) para que el badge del 94 % sea **lo único que se mueve** en esos 800 ms. Un número sólo golpea si está solo.

---

## 6. Notas de implementación (ffmpeg 7.x)

**Arquitectura en dos pasadas.** (1) Cada plano se renderiza a su propio clip 1920×1080 sin pérdida, con el marco y los logos ya compuestos, pero **sin carteles**. (2) Se ensambla con `concat` (cortes secos) + 3 `xfade` (las disolvencias), y **los carteles se componen encima de la línea de tiempo ya armada, con timestamps absolutos** — así los números de §2 son leíbles de un vistazo en un solo filtergraph.

**Supersampleo, no `scale+crop`.** Cambiar `zoompan` por `scale+crop` **no** arregla el temblor: ambos cuantizan a entero. Lo que lo arregla es el supermuestreo. Cálculo para el peor caso de esta pieza (la deriva de S20, Z 1.30→1.36 en 3.4 s): el borde del recorte se mueve **0.22 px/frame** a escala 1600 → sobre el PNG de 3200 son 0.45 px/frame → **se congelaría en la mitad de los frames**. A 6400 son 0.9 px/frame → se mueve en todos.

```
Resolución de trabajo: 6400 × 3600  (×2 desde el PNG, ×4 desde la entrega de 1600)
[still] scale=6400:3600:flags=lanczos , zoompan=…:s=1600x900:fps=30:d=1
```

**Trampas verificadas que van a morder:**
- Los PNG con `-loop 1` entran a **25 fps**: hay que poner `-framerate 30` **antes** del `-i`, o aparecen frames duplicados periódicos (congelados en 1, 7, 13, 19…).
- `-shortest` **no** acota una entrada con `-loop 1` si la salida es sólo video (produce archivos de minutos). Usar `-t` explícito en cada plano.
- En `xfade`, **`P` va de 1 a 0**, no de 0 a 1. Si el easing se escribe al revés, la transición corre invertida.
- `setpts` después de `fps` rompe `xfade` (`current rate of 1/0 is invalid`); antes funciona.
- **No usar `tmix` con `enable`**: corrompe el croma en 7.1 (los planos de croma quedan en 0; el azul se vuelve verde). No hace falta acá porque no hay whips.
- Probar el alfa **sobre color**, nunca sobre negro: un rectángulo negro opaco sobre negro no se ve y el fallo pasa desapercibido.

**El desenfoque bajo el cartel es real**, no un truco de opacidad — es lo que hace que la caja se lea nativa:

```
[bg]split=2[b0][b1];
[b1]crop=920:120:200:820,gblur=sigma=16,format=rgba,
    fade=t=in:st=T_IN:d=0.22:alpha=1,fade=t=out:st=T_OUT:d=0.18:alpha=1[bl];
[b0][bl]overlay=200:820:enable='between(t,T_IN,T_OUT+0.2)'[bg2];
[bg2][cartel]overlay=x=0:y='24*pow(1-min(1,max(0,(t-T_IN)/0.42)),3)':enable='…'
```
(`pow(…,3)` aproxima el ease-out expo del translateY.)

**Captura.** `viewport 1600×900`, `deviceScaleFactor: 2`, `reducedMotion: 'reduce'`, espera de 1200 ms tras `load`, `screenshot({ scale: 'device', animations: 'disabled', caret: 'hide' })` → PNG de 3200×1800. Scrollbars ocultas por CSS inyectado. Para cada encuadre, `scrollIntoViewIfNeeded()` y después `boundingBox()`.

**Audio.** Música a −16 LUFS. Los primeros 2.0 s pasan por `lowpass=f=800` que se abre en 2.00 (el drop cae en el corte al producto y en el aterrizaje del logo). Tres *whooshes* de 8 frames antes de 2.00, 47.00 y 54.00.

---

## 7. Dos prerrequisitos que hay que verificar antes de filmar

1. **`dash-matches` sólo renderiza si hay matches** (`panel-de-control/page.tsx:589`); si no, muestra un estado vacío. **Tres de los 22 planos —S01, S20 y el badge del 94 %, o sea el hook y el remate— dependen de eso.** Hay que confirmar con `sonda.mjs` que la cuenta con la que se filma ve ≥3 tarjetas de match; si no, sembrar con `--con-demo` y esperar a que corra el algoritmo de matching antes de capturar.
2. El texto del badge se lee del DOM de la tarjeta enmarcada en S20. Si el score real es 76 %, el badge dice 76 %. **Nunca se escribe a mano un número que la pantalla no muestra.**