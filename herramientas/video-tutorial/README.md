# Video tutorial de UIAB Conecta

Screencast **real** del sitio, generado por script: Playwright maneja un Chromium
de verdad (cursor visible, scroll con easing, tipeo con ritmo humano) mientras
una capa inyectada dibuja los subtítulos y las placas con la identidad de la
marca. Los planos aéreos de apertura y cierre salen de Higgsfield, partiendo de
la **foto real del parque** que usa el home. Después ffmpeg encadena todo,
compone el logo y arma el MP4.

Resultado: `tutorial-uiab-conecta.mp4` — 1920x1080, 30 fps, ~62 s.

## Cómo volver a grabarlo

```bash
cd herramientas/video-tutorial && npm install && npx playwright install chromium
node traer-assets.mjs   # planos aéreos
node logo.mjs           # logo del SVG del sitio a PNG
```

Con el dev server levantado (anotá el puerto que informa):

```bash
BASE_URL=http://localhost:3000 node grabar.mjs && node montar.mjs
```

## Las perillas del montaje

| Flag | Para qué |
| --- | --- |
| `--objetivo 62` | Duración buscada en segundos. Calcula solo cuánto acelerar. |
| `--velocidad 1.2` | Fuerza el factor a mano; le gana a `--objetivo`. |
| `--logo cierre` | Dónde va el logo: `apertura`, `cierre`, `ambos` o `no`. |
| `--sin-bookends` | Sin planos aéreos: sólo el screencast. |
| `--musica ruta.mp3` | Pista de música. |

`--objetivo` es lo que se toca normalmente: se le pide una duración y él saca
la cuenta. Topea en 1.6× — más rápido que eso el tipeo parece adelantado, así
que si pide más, el aviso te dice que hay que **sacar pasos** en `escenas/`.

## Música

Dejá un MP3 en `assets/musica.mp3` y volvé a correr **solo** el montaje (no hace
falta regrabar): se mezcla al 20 % con fundido de entrada y salida.

## Piezas

| Archivo | Qué hace |
| --- | --- |
| `grabar.mjs` | Arnés: inicia sesión fuera de cámara y graba dos pasadas, una por capítulo. |
| `escenas/*.mjs` | El guion de cada capítulo — acá se edita qué se muestra y qué dice. |
| `piloto.mjs` | Conducción "humana": trayectorias con curva, tipeo irregular, encuadres. |
| `capa-visual.js` | Se inyecta en la página: cursor, subtítulos, placas, sellos, resaltados. |
| `montar.mjs` | ffmpeg: normaliza, pega los planos, compone el logo, mezcla música, exporta. |
| `traer-assets.mjs` | Baja los planos aéreos a `assets/`. |
| `logo.mjs` | Rasteriza el logo del sitio a PNG transparente (ffmpeg no lee SVG). |
| `demo-datos.mjs` | Siembra y borra las oportunidades de ejemplo (ver abajo). |
| `sonda.mjs` | Diagnóstico: lista lo que realmente renderiza cada ruta. |

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

El logo **no** se lo pedimos al modelo: la IA deforma cualquier logotipo. Se
compone con ffmpeg desde `logo-uiab-conecta.svg`, el mismo archivo que usa la
app, así que sale idéntico.

## Datos de demostración

La tabla `oportunidades` está vacía en producción, así que el capítulo 2 no
tendría nada que mostrar. `demo-datos.mjs` crea tres pedidos de ejemplo a nombre
de la UIAB (no de una socia real) y los borra después:

```bash
node demo-datos.mjs sembrar   # antes de grabar
node demo-datos.mjs limpiar   # SIEMPRE al terminar
```

Van a nombre de la UIAB a propósito: el botón "Postularse" no se le muestra al
dueño de la oportunidad, así que si las creara la misma cuenta con la que se
filma, esa parte del video no existiría.

> **Ojo:** el `.env` local apunta a la base de **producción**. `sembrar` escribe
> ahí. Acordate de correr `limpiar`.

## Lo que el guion nunca aprieta

Ni **"Enviar postulación"** ni **"Publicar requerimiento"**. Los dos se muestran
enfocados y se sale por Cancelar o navegando, así que grabar el tutorial no
genera registros reales.
