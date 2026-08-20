Everything verified against the real toolchain. Final answer below.

---

# AUDITORÍA TÉCNICA — "UIAB Conecta" v2

Verificado contra el binario real: `/home/user/conectar-uiab/herramientas/video-tutorial/node_modules/ffmpeg-static/ffmpeg` → **ffmpeg 7.0.2-static (johnvansickle)**, libavfilter 10.1.100, 4 cores. No hay ffmpeg de sistema. Todo lo de abajo lo corrí.

---

## 1. Lo que NO se puede hacer con ffmpeg

### 1.1 `drawtext` NO EXISTE en este binario — bloqueante y no negociable

```
$ ffmpeg -h filter=drawtext
Unknown filter 'drawtext'.
```

La causa: FFmpeg 7.0 convirtió **libharfbuzz en dependencia dura de `drawtext`**, y este build no lo tiene (`--enable-libfreetype --enable-fontconfig --enable-libfribidi`, pero **no** harfbuzz). El filtro se cayó silenciosamente del build.

Consecuencia: **el 100 % del texto tiene que salir de Chromium como PNG.** El tratamiento ya lo hace, así que la arquitectura sobrevive — pero hay que saber que **no hay plan B**. Si en medio del desarrollo alguien piensa "esto lo resuelvo rápido con un drawtext", no puede. Lo único que queda como fallback es `subtitles`/`ass` (libass sí está), y no da ni la barra de acento, ni el tracking, ni el desenfoque: no sirve para este diseño.

**Corolario que el tratamiento no saca:** el badge del 94 % se lee del DOM (§7.2), y como el texto sólo puede ser PNG, **la captura y el render de carteles tienen que estar en el mismo proceso Playwright**. No podés capturar hoy y rotular mañana: el número viaja de la página al PNG del badge sin pasar por ffmpeg. Eso obliga a un orden que conviene fijar ya (§4).

### 1.2 Los `cubic-bezier` no existen en la sintaxis de expresiones

`zoompan` acepta expresiones, pero no hay `cubic-bezier()`. Los seis easings del documento hay que traducirlos. La buena noticia: **cinco de los seis son easings estándar con forma cerrada exacta**, no hace falta ninguna LUT:

| Documento | Nombre | Expresión ffmpeg (`p` = progreso 0→1) |
|---|---|---|
| `cubic-bezier(0.16,1,0.3,1)` | easeOutExpo | `1-pow(2,-10*p)` |
| `cubic-bezier(0.22,1,0.36,1)` | easeOutQuint | `1-pow(1-p,5)` |
| `cubic-bezier(0.34,1.56,0.64,1)` | easeOutBack | `1+2.70158*pow(p-1,3)+1.70158*pow(p-1,2)` |
| `cubic-bezier(0.05,0.7,0.1,1)` | ≈ easeOutExpo | `1-pow(2,-10*p)` (dentro de ~1 %) |
| `cubic-bezier(0.3,0,0.8,0.15)` | ≈ easeInCubic | `pow(p,2.4)` |

El de entrada de cámara (`0.05,0.7,0.1,1`) no es exactamente easeOutExpo pero la diferencia máxima es ~1 % del recorrido — sobre un punch-in de 15 frames, invisible. **No inventes una LUT de 120 `if()` anidados: no hace falta.**

### 1.3 Todo lo gráfico — correcto en el tratamiento, lo confirmo

Superelipse n=4.5, sombras dobles, gradiente 135° de 3 paradas, grano, tracking tipográfico, `:hover` real, estados de UI: nada de eso es ffmpeg. Van todos como PNG de Chromium. El documento ya lo asume.

**Una corrección concreta:** el blanqueo del logo Vaxler con `geq` funciona (lo corrí sobre `/home/user/conectar-uiab/public/logo-vaxler.png`, 1.8 s, conserva alfa) — pero es la herramienta equivocada. Ya estás en Chromium: `filter: brightness(0) invert(1)` sobre el `<img>` da el mismo resultado, exacto, sin una pasada de `geq` y sin riesgo de halo en el borde antialiaseado. Usá `geq` sólo si el logo se compone fuera de Chromium.

---

## 2. Lo que se puede pero es frágil o caro

### 2.1 El supersampleo: la conclusión es correcta, la justificación es falsa

El §6 dice que sin supersampleo el recorte "se congelaría en la mitad de los frames". **Lo medí y es falso.** Sobre la deriva de S20 (Z 1.30→1.36, 102 frames):

```
frames congelados, entrada 3200x1800 directa:  0 / 101
frames congelados, entrada 6400x3600:          0 / 101
```

Cero en los dos casos. La aritmética del documento también está mal: el ancho del recorte va de 3200/1.30 = 2461 px a 3200/1.36 = 2353 px, o sea **1.07 px/frame de ancho** (no 0.45). Nunca se congela porque siempre cambia al menos 1 px.

**Pero el judder existe igual**, y es de otra naturaleza: no son frames repetidos, es el *paso de escala* que salta. Medido como coeficiente de variación de la diferencia entre frames consecutivos (movimiento perfectamente suave → CV bajo):

| Estrategia | CV | Tiempo (plano de 4 s) |
|---|---|---|
| Directo 3200 | **34.4 %** | 6.6 s |
| **Supersample entrada ×2 (6400)** | **23.5 %** | 10.6 s |
| Supersample entrada ×4 (12800) | 16.6 % | 26–32 s |
| Supersample **salida** (zoompan s=3200 → scale 1600) | **34.5 %** | 6.6 s |

Dos conclusiones que valen plata:

1. **El supersampleo de salida no sirve para nada** (34.5 % ≈ 34.4 % del baseline). Es lo primero que uno intuye probar; no toques ese camino. El judder nace en la cuantización del rectángulo de recorte *sobre la entrada*, y sólo se arregla haciendo más fina la grilla de entrada.
2. **×2 es el punto de equilibrio.** ×4 mejora otro 30 % de CV pero cuesta **3 veces más**. No vale para esta pieza.

### 2.2 El costo real es mucho menor de lo que parece — si pre-recortás

El `scale=6400:3600` corre **por frame** (120 veces en un plano de 4 s), y ahí se va el 40 % del tiempo. Pero casi todos los planos son cerrados (Z 1.4–1.9): estás ampliando 3200×1800 entero para después tirar el 70 %.

**Pre-recortá la unión del movimiento y supersampleá sólo esa región.** Medido sobre un plano Z=1.85:

```
supersample ×2 del frame entero:            10.6 s
pre-recorte + supersample ×2 de la región:   6.0 s   ← misma calidad
```

**43 % más rápido y sin pérdida.** Presupuesto total de la pieza con esto: ~1.5–2 min por pasada completa de 22 planos. Eso no es caro — es cómodo para iterar. Sin el pre-recorte son ~3 min, también tolerable. **Ninguna de las dos cifras justifica bajar la calidad.**

(Ojo con un espejismo: pre-renderizar el PNG de 6400×3600 a disco y alimentarlo con `-loop 1` es **más lento**, no más rápido — 15.5 s vs 10.6 s. Decodificar un PNG de 3.1 MB por frame cuesta más que el lanczos. No lo hagas.)

### 2.3 El texto de UI a Z=1.0 va a quedar ilegible — el riesgo real de la pieza

Esto el tratamiento no lo ve y es lo más peligroso que encontré.

Captura 1600×900 @ dSF 2 → 3200×1800 → se muestra en el hueco de 1600×900 → se pega 1:1 en el lienzo de 1920×1080. Resultado: **1 px CSS = 1 px de salida en 1080p.** Un texto de UI de 14 px CSS sale de 14 px en el master, y después pasa por H.264 y por la recompresión de LinkedIn/WhatsApp.

Los planos a Z=1.00 son S04 (4.5 s, el plano héroe del directorio), S13 y S18. **S04 es el plano más largo de la primera mitad y va a leerse como puré.**

**Arreglo gratis:** capturá con **viewport 1280×720 y `deviceScaleFactor: 2.5`**. Da exactamente los mismos 3200×1800 px, mismo costo de captura, mismo costo de render — pero ahora **1 px CSS = 1.25 px de salida**, la UI es 25 % más grande, y a Z=1.0 seguís supersampleando 2.5:1 (más nítido que antes). Cambiá `VIEWPORT`/`ESCALA` en `/home/user/conectar-uiab/herramientas/video-tutorial/grabar.mjs:35-36`. Es una línea y salva el plano héroe.

### 2.4 Frágil: el bloque monolítico de la pasada 2

22 planos + 3 `xfade` + 8 carteles + 2 viajes de logo + badge + audio en un solo filtergraph es elegante y **es la decisión correcta** (los timestamps absolutos de §2 quedan legibles de un vistazo). El riesgo es que una coma mal puesta re-renderiza los 58 s. Mitigación en §4: cachear la pasada 1 por hash.

### 2.5 Trampas del documento: verificadas una por una

| Afirmación del §6 | Veredicto |
|---|---|
| `-loop 1` entra a 25 fps; hay que poner `-framerate 30` **antes** del `-i` | ✅ **CONFIRMADO** — sin el flag: 50 frames en 2 s. Con él: 60. |
| En `xfade`, **`P` va de 1 a 0** | ✅ **CONFIRMADO** — `expr='A*P+B*(1-P)'` arranca en A y termina en B. |
| `setpts` después de `fps` rompe `xfade` | ✅ **CONFIRMADO** — `fps,setpts` → `error code -22 (Invalid argument)`. `setpts,fps` → OK. |
| `-shortest` no acota una entrada con `-loop 1` | ⚠️ **No reproducible tal cual**, pero el consejo es correcto igual: poné `-t` explícito en cada plano y no dependas de `-shortest`. |
| No usar `tmix` con `enable` | ⚪ **Irrelevante** — no hay whips en esta pieza. Borralo del documento; es ruido. |
| Probar el alfa sobre color, nunca sobre negro | ✅ Correcto y barato. |

### 2.6 Lo que directamente falta para poder filmar

```
assets/apertura.mp4   FALTA   (S00 — los primeros 2.00 s de la pieza)
assets/cierre.mp4     FALTA   (S21 — los últimos 4.00 s)
~/.cache/ms-playwright  VACÍO  → npx playwright install chromium
```

Los dos MP4 se bajan con `traer-assets.mjs` desde CloudFront. **Esas URLs caducan** (el propio script lo contempla e imprime el prompt de Higgsfield para regenerarlos). Verificá esto **antes** de empezar, no el día de la entrega: si caducaron, regenerar dos planos de Higgsfield no es una tarea de cinco minutos y son el 10 % de la duración.

---

## 3. Las tres cadenas de filtros

### 3.1 Movimiento de cámara (punch-in con easing + pre-recorte + supersampleo)

El efecto que define la pieza. Ejemplo: **S05**, punch-in Z 1.00→1.55 en 500 ms (15 frames), luego quieto hasta los 4.00 s (120 frames).

Se resuelve en Node antes de emitir el comando:
- `Zmax` = zoom máximo del plano (1.55). El recorte más chico en px de captura es `3200/Zmax × 1800/Zmax`.
- Unión de todos los encuadres del movimiento + 2 % de margen → rectángulo `CX,CY,CW,CH` en px de captura.
- `FX,FY` = ancla normalizada (0..1) del centro del elemento **dentro del pre-recorte**. 0.5 = centrado.
- `SS = 2` (supersampleo).

```bash
ffmpeg -hide_banner -y \
  -framerate 30 -loop 1 -i captura/s05-buscador.png \
  -framerate 30 -loop 1 -i marco.png \
  -filter_complex "\
[0:v]crop=CW:CH:CX:CY,\
     scale=iw*2:ih*2:flags=lanczos,\
     zoompan=\
       z='1.00+0.55*(1-pow(2,-10*min(1,on/15)))':\
       x='(iw-iw/zoom)*FX':\
       y='(ih-ih/zoom)*FY':\
       d=1:s=1600x900:fps=30,\
     pad=1920:1080:160:66:color=0x072a44[pantalla];\
[pantalla][1:v]overlay=0:0:format=auto,format=yuv420p[v]" \
  -map "[v]" -t 4.0 -r 30 \
  -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p \
  planos/s05.mp4
```

Notas que importan:
- **`-framerate 30` va antes de cada `-i`.** Los dos. Si falta, entra a 25 y te aparecen frames duplicados periódicos.
- **`-t 4.0` explícito.** No confíes en `-shortest`.
- `min(1,on/15)` congela el easing después del frame 15; el resto del plano queda quieto sin necesidad de una segunda rama.
- Para una **deriva** en vez de punch-in, cambiá sólo `z`: `z='1.30+0.06*on/101'` (lineal — en una deriva el easing no se percibe y lineal es lo más suave).
- Para el **tilt de S11** (45 px CSS hacia abajo, Z fija en 1.70): `z='1.70'` y `y='(ih-ih/zoom)*FY + 45*2*SS*on/44'`. Cuidado con el factor: 45 px CSS × 2 (dSF) × 2 (supersampleo) = 180 px en el espacio del grafo. **Es el error más fácil de cometer en toda la pieza.**
- `crf 16` en la pasada 1 porque estos clips se vuelven a codificar en la pasada 2. No uses 23: acumulás dos generaciones de pérdida sobre texto fino.

### 3.2 Cartel con desenfoque real y entrada animada

Verificado funcionando. Va en la pasada 2, sobre la línea de tiempo ya armada, con timestamps absolutos. Ejemplo: **T2** (S05), in 10.83, out 14.00.

```
[base]split=2[b0][b1];
[b1]crop=860:120:200:820,
    gblur=sigma=16,
    format=rgba,
    fade=t=in:st=10.83:d=0.22:alpha=1,
    fade=t=out:st=14.00:d=0.18:alpha=1[bl];
[b0][bl]overlay=200:820:enable='between(t,10.83,14.20)'[bg2];
[2:v]format=rgba,
     fade=t=in:st=10.83:d=0.22:alpha=1,
     fade=t=out:st=14.00:d=0.18:alpha=1[c];
[bg2][c]overlay=x=200:
                y='820+24*pow(1-min(1\,max(0\,(t-10.83)/0.42))\,3)':
                enable='between(t,10.83,14.20)'[out]
```

- El `pow(...,3)` aproxima el easeOutExpo del `translateY` de +24 → 0 px. Fiel a §5.2.
- **La opacidad (0.22 s) termina antes que el movimiento (0.42 s)** — exactamente como pide el documento. Si los igualás, el cartel parece desvanecerse mientras se desliza.
- El `enable` del blur y el del cartel tienen que cubrir **hasta `out + 0.20`**, si no el desenfoque desaparece un frame antes que el texto y se ve un parpadeo del fondo.
- **Las comas dentro de `min()`/`max()`/`pow()` van escapadas** (`\,`) porque están dentro de un `overlay` que ya usa `:` como separador de opciones. Es el error que más tiempo te va a comer.
- `sigma=16` sobre 860×120 es barato: no lo optimices.

### 3.3 El logo que viaja, con el corte cayendo en mitad del viaje

Lo más delicado del tratamiento (§5.1) y funciona. La secuencia de 15 PNG RGBA se renderiza en Chromium con la animación CSS real y se coloca en un timestamp absoluto:

```bash
ffmpeg -hide_banner -y \
  -i master_58s.mp4 \
  -framerate 30 -i logo/ida_%02d.png \
  -framerate 30 -i logo/vuelta_%02d.png \
  -loop 1 -framerate 30 -i logo/esquina.png \
  -filter_complex "\
[1:v]format=rgba,setpts=PTS-STARTPTS+1.70/TB[ida];\
[2:v]format=rgba,setpts=PTS-STARTPTS+53.80/TB[vue];\
[3:v]format=rgba,colorchannelmixer=aa=0.92[esq];\
[0:v][ida]overlay=0:0:eof_action=pass:enable='between(t,1.70,2.20)'[v1];\
[v1][esq]overlay=64:21:enable='between(t,2.20,53.80)'[v2];\
[v2][vue]overlay=0:0:eof_action=pass:enable='between(t,53.80,54.30)'[v]" \
  -map "[v]" -t 58 -c:v libx264 -crf 16 salida.mp4
```

Verificado: base limpia antes de 1.70, secuencia visible en 1.75 y 2.00, base limpia otra vez en 2.50.

- **`setpts=PTS-STARTPTS+T/TB` es el mecanismo correcto** para anclar una secuencia corta a un tiempo absoluto. Con `-itsoffset` solo no alcanza y combinar los dos duplica el corrimiento.
- **`eof_action=pass` es obligatorio.** Sin eso, el overlay congela el último PNG de la secuencia sobre el resto de la pieza y te comés el logo gigante durante 56 s.
- Los PNG de la secuencia son de **1920×1080 completos con alfa**, no recortes: así el `overlay` va siempre a `0:0` y no tenés que animar x/y en ffmpeg. Es lo que hace que el relevo con `esquina.png` sea invisible — **el frame 15 de `ida` tiene que ser pixel-idéntico a `esquina.png` con su 0.92 de opacidad ya aplicada.** Renderizalos del mismo HTML, en la misma corrida.

---

## 4. Orden de operaciones

### Pasada 0 — Chromium/Playwright (todo lo que tiene tipografía o forma)

Una sola corrida, mismo proceso, porque el badge del 94 % viaja del DOM al PNG sin pasar por ffmpeg:

1. **Verificar el prerrequisito de `dash-matches` primero** (`sonda.mjs`, ≥3 tarjetas). S01, S20 y el badge dependen de eso: el gancho y el remate. Si falla, `--con-demo` y esperar al matching **antes** de capturar nada.
2. ~50 capturas de producto a 3200×1800 (34 encuadres + ~12 cortes de estado + hovers), `scale:'device'`, `animations:'disabled'`, `caret:'hide'`.
3. `marco.png` — 1920×1080 RGBA, superelipse, sombras, gradiente, grano.
4. 8 carteles PNG RGBA + `badge_%02d.png` (8 frames, easeOutBack) — **el texto del badge se lee del DOM en este mismo paso**.
5. `logo/ida_%02d.png`, `logo/vuelta_%02d.png` (15 c/u), `logo/esquina.png`.
6. Vaxler en blanco vía CSS `brightness(0) invert(1)`, no `geq`.

Las fuentes vienen de `next/font/google` (`src/app/layout.tsx`) — **no hay fuentes de sistema en esta máquina** (`fc-list` vacío). Renderizá los carteles contra el server de Next, no desde un HTML suelto, o Manrope/Inter caen a un fallback y todo el tracking se va al demonio.

### Pasada 1 — 22 clips independientes

Cadena §3.1 por plano: pre-recorte → supersampleo ×2 → `zoompan` → `pad` → `overlay` del marco. Sin carteles. `crf 16`.

**Cacheá por hash de (PNG de captura + rectángulo + expresión de movimiento + duración).** Es lo que convierte una iteración creativa de 3 minutos en una de 10 segundos: cuando movés un cartel, la pasada 1 no se toca.

### Pasada 2a — cuatro bloques por `concat` (copia de stream)

Los 19 cortes secos son `concat` puro. Los 3 cambios de sección son `xfade` y **necesitan material extra**: `xfade` consume solapamiento, así que cada bloque se renderiza con media disolvencia de más en cada borde. Con las disolvencias de 0.30 / 0.40 / 0.40 hay que producir **1.10 s extra de material**:

| Bloque | Planos | Desde–hasta | Duración |
|---|---|---|---|
| A | S00–S12 | 0.00 – 31.15 | 31.15 |
| B | S13–S19 | 30.85 – 47.20 | 16.35 |
| C | S20 | 46.80 – 54.20 | 7.40 |
| D | S21 | 53.80 – 58.00 | 4.20 |

Suma 59.10 − 1.10 de solapamiento = **58.00**. Si ignorás esto, la pieza sale de 56.90 y **todos los timestamps de carteles de §2 se corren**. Es el bug clásico de esta arquitectura.

### Pasada 2b — un solo filtergraph, una sola codificación

`xfade` encadenado + carteles + logo + badge + audio, todo junto. Verificado: sale **58.000000 s** exactos.

```
[0][1]xfade=transition=fade:duration=0.30:offset=30.85[x1];
[x1][2]xfade=transition=fade:duration=0.40:offset=46.80[x2];
[x2][3]xfade=transition=fade:duration=0.40:offset=53.80[base]
```

Los offsets son acumulativos sobre la salida del `xfade` anterior, no sobre la línea de tiempo original: 30.85 → 46.80 → 53.80. Encima de `[base]` van las 8 cadenas de §3.2 y las de §3.3, **con los timestamps absolutos de §2 sin traducir** — que es justamente por lo que esta arquitectura vale la pena.

Audio: el barrido del `lowpass` que abre en 2.00 funciona por comandos (`lowpass` está marcado `TSC` — soporta timeline y comandos), verificado:

```
asendcmd=f=cmds.txt,lowpass=f=800,loudnorm=I=-16:TP=-1.5:LRA=11
```
```
# cmds.txt
2.0 lowpass frequency 1500;
2.1 lowpass frequency 4000;
2.2 lowpass frequency 20000;
```

Esto es mejor que el `asplit`+`acrossfade`: te da el barrido real de 200 ms en lugar de un salto, y el drop cae exactamente donde aterriza el logo.

**Total: 3 pasadas de ffmpeg (1 por plano + 1 de concat en copia + 1 de master), ~2–4 min de render completo.** El cuello de botella no es ffmpeg: son las ~50 capturas de Playwright.

---

## Los cinco arreglos que haría antes de escribir una línea

1. **Capturar a 1280×720 @ dSF 2.5** en vez de 1600×900 @ 2. Gratis, y es lo único que salva la legibilidad de S04/S13/S18 en 1080p. `grabar.mjs:35-36`.
2. **Pre-recortar antes de supersamplear.** 43 % menos de render, misma calidad.
3. **Bajar `apertura.mp4`/`cierre.mp4` y `npx playwright install chromium` hoy**, para descubrir hoy si las URLs de CloudFront caducaron.
4. **Corregir §6:** el supersampleo es correcto pero por el motivo equivocado, ×4 no vale la pena, el supersampleo de salida no hace nada, y el párrafo de `tmix` sobra.
5. **Reemplazar los seis `cubic-bezier` por sus formas cerradas** en el documento, para que quien implemente no tenga que redescubrirlas.