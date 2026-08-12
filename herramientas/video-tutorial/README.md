# Video tutorial de UIAB Conecta

Screencast **real** del sitio, generado por script: Playwright maneja un Chromium
de verdad (cursor visible, scroll con easing, tipeo con ritmo humano) mientras
una capa inyectada dibuja los subtítulos y las placas con la identidad de la
marca. Los planos aéreos de apertura y cierre salen de Higgsfield, partiendo de
la **foto real del parque** que usa el home. Después ffmpeg encadena todo,
compone el logo, normaliza la música y arma el MP4.

Resultado: `tutorial-uiab-conecta.mp4` — 1920x1080, 30 fps, ~62 s.

---

## Hacerlo (esto es todo)

**Una vez**, para dejar la máquina lista:

```bash
cd herramientas/video-tutorial
npm install
```

Eso ya trae ffmpeg y ffprobe — no hay que instalar nada más a mano.

**Cada vez que quieras el video**, una sola terminal y un solo comando:

```bash
cd herramientas/video-tutorial
npm run video
```

Listo. Cuando termina, el archivo queda en
`herramientas/video-tutorial/tutorial-uiab-conecta.mp4`.

`npm run video` hace todo solo: **levanta la app** si no está corriendo (y la
baja al terminar), baja los planos aéreos, genera el logo, graba y monta. Si
falta algo, te dice qué en castellano.

> Si ya tenías la app corriendo en otra terminal, la usa y no la toca.

**Si tenés otra sesión del proyecto abierta** (otra ventana, otro agente, otro
worktree), lo más probable es que el 3000 ya esté tomado. Pedile un puerto
propio y listo — lo usa tanto para levantar la app como para filmar:

```bash
BASE_URL=http://localhost:3005 npm run video
```

Si el puerto que elegiste también está ocupado, te lo dice enseguida en vez de
quedarse esperando.

### Lo único que hay que configurar

El video se graba **con sesión iniciada** (sin ella la ficha de empresa muestra
"Contenido exclusivo para miembros" y las Oportunidades ni se ven), así que el
`.env` de la raíz del repo necesita con qué cuenta entrar:

```
UIAB_EMAIL=alguien@suempresa.com
UIAB_PASSWORD=la-contraseña
```

Que **no sea la cuenta de la UIAB**: las oportunidades de demo se crean a
nombre de la UIAB y el botón "Postularse" no se le muestra a quien publicó, así
que esa parte del video no se podría filmar.

Las claves de Supabase del mismo `.env` son las de siempre, no hay que tocar
nada más.

### Variantes

```bash
npm run video -- --objetivo 50    # más corto
npm run video -- --logo ambos     # logo también en la apertura
npm run video -- --con-demo       # con oportunidades de ejemplo (ver abajo)
```

Si ya grabaste y sólo querés recortar distinto o cambiar la música, **no hace
falta volver a grabar**: `npm run montar -- --objetivo 55`.

---

## Música

No viene ninguna incluida: hay que elegirla y es una decisión de marca. Bajás un
MP3, lo dejás en `assets/musica.mp3` y volvés a correr **sólo el montaje**:

```bash
npm run montar
```

De dónde sacarla, gratis y sin problemas de licencia:

| Dónde | Licencia |
| --- | --- |
| [pixabay.com/music](https://pixabay.com/music/) | Uso comercial libre, **sin atribución**. La opción más simple. |
| YouTube Studio → Biblioteca de audio | Gratis; algunas piden atribución (lo aclara cada pista). |
| [freemusicarchive.org](https://freemusicarchive.org) | Varía por pista — hay que mirar la licencia de cada una. |

Buscá algo tipo *corporate uplifting*, *inspiring technology* o *upbeat
corporate*, de 1 a 2 minutos.

No hace falta que la pista dure lo mismo que el video ni que la ajustes de
volumen: si es más corta se repite sola, y el montaje la lleva a **-16 LUFS**
(el estándar de video web) con el pico controlado. O sea que cualquier MP3 que
le tires queda al mismo nivel percibido, sin que una tape el video y la
siguiente no se escuche. Para subirla o bajarla: `--lufs -14` (más fuerte),
`--lufs -20` (más suave).

---

## Las perillas del montaje

| Flag | Para qué |
| --- | --- |
| `--objetivo 62` | Duración buscada en segundos. Calcula solo cuánto acelerar. |
| `--velocidad 1.2` | Fuerza el factor a mano; le gana a `--objetivo`. |
| `--logo cierre` | Dónde va el logo: `apertura`, `cierre`, `ambos` o `no`. |
| `--apertura 3` / `--cierre 4` | Segundos de cada plano aéreo. |
| `--lufs -16` | Volumen percibido de la música. |
| `--sin-bookends` | Sin planos aéreos: sólo el screencast. |
| `--musica ruta.mp3` | Otra pista, sin tocar `assets/`. |

`--objetivo` es lo que se toca normalmente. Topea en 1.6× — más rápido que eso
el tipeo parece adelantado, así que si pide más, el aviso te dice que hay que
**sacar pasos** en `escenas/`.

---

## Piezas

| Archivo | Qué hace |
| --- | --- |
| `video.mjs` | El de arriba: encadena todo y revisa que estén las condiciones. |
| `grabar.mjs` | Arnés: inicia sesión fuera de cámara y graba dos pasadas, una por capítulo. |
| `escenas/*.mjs` | El guion de cada capítulo — acá se edita qué se muestra y qué dice. |
| `piloto.mjs` | Conducción "humana": trayectorias con curva, tipeo irregular, encuadres. |
| `capa-visual.js` | Se inyecta en la página: cursor, subtítulos, placas, sellos, resaltados. |
| `montar.mjs` | ffmpeg: normaliza, pega los planos, compone el logo, mezcla música, exporta. |
| `traer-assets.mjs` | Baja los planos aéreos a `assets/`. |
| `logo.mjs` | Rasteriza el logo del sitio a PNG transparente (ffmpeg no lee SVG). |
| `prueba-capa.mjs` | Prueba de humo de la capa visual (`npm run prueba`). |
| `demo-datos.mjs` | Siembra y borra las oportunidades de ejemplo. |
| `sonda.mjs` | Diagnóstico: lista lo que realmente renderiza cada ruta. |

Los scripts que abren un navegador aceptan `CHROMIUM=/ruta/al/chrome` para usar
un binario ya instalado en vez del que baja Playwright.

## Los planos aéreos

`assets.json` guarda, por cada plano, la URL, **el prompt con el que se generó**
y las referencias que se le pasaron. Los MP4 no se versionan (pesan y git se los
queda para siempre): `traer-assets.mjs` los baja. Si una URL caduca, se regenera
el plano en Higgsfield con esos mismos datos y se actualiza el link.

Los dos planos arrancan del primer fotograma de
`public/landing/hero-industrial-aereo.webp` — la foto aérea real del parque de
Almirante Brown que ya usa el home— así que lo que se ve es el lugar de verdad,
no un polígono industrial genérico. Encima de esa base van dos clips de
referencia (los de `referencias` en `assets.json`): uno aporta el movimiento de
cámara y el otro el color y la atmósfera.

El recorte de cada plano se ancla a un extremo y se calcula midiendo el clip, no
con un segundo fijo: la apertura toma los últimos 3 s (el dron acelera, así que
el pico está al final) y el cierre los primeros 4 s. Si mañana se regenera un
plano de otra duración, sigue cayendo donde tiene que caer.

El logo **no** se lo pedimos al modelo: la IA deforma cualquier logotipo. Se
compone con ffmpeg desde `logo-uiab-conecta.svg`, el mismo archivo que usa la
app, así que sale idéntico.

## Datos de demostración

La tabla `oportunidades` está vacía en producción, así que el capítulo 2 no
tendría nada que mostrar. `--con-demo` crea tres pedidos de ejemplo a nombre de
la UIAB (no de una socia real) y **los borra siempre al terminar**, aunque la
grabación se caiga a la mitad:

```bash
npm run video -- --con-demo
```

Van a nombre de la UIAB a propósito: el botón "Postularse" no se le muestra al
dueño de la oportunidad, así que si las creara la misma cuenta con la que se
filma, esa parte del video no existiría.

> **Ojo:** el `.env` local apunta a la base de **producción**, así que esto
> escribe ahí. Si por lo que sea el borrado no corre, se limpia a mano con
> `node demo-datos.mjs limpiar`.

Necesita `SUPABASE_SERVICE_ROLE_KEY` en el `.env` de la raíz del repo.

## Lo que el guion nunca aprieta

Ni **"Enviar postulación"** ni **"Publicar requerimiento"**. Los dos se muestran
enfocados y se sale por Cancelar o navegando, así que grabar el tutorial no
genera registros reales.
