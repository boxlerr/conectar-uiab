# Video tutorial de UIAB Conecta

Screencast **real** del sitio, generado por script: Playwright maneja un Chromium
de verdad (cursor visible, scroll con easing, tipeo con ritmo humano) mientras
una capa inyectada dibuja los subtítulos y las placas con la identidad de la
marca. Después ffmpeg encadena las partes y arma el MP4.

Resultado: `tutorial-uiab-conecta.mp4` — 1920x1080, 30 fps, ~100 s.

## Cómo volver a grabarlo

```bash
cd herramientas/video-tutorial && npm install && npx playwright install chromium
```

Con el dev server levantado (anotá el puerto que informa):

```bash
BASE_URL=http://localhost:3000 node grabar.mjs && node montar.mjs --velocidad 1.1
```

`--velocidad` acelera todo de forma pareja; es la perilla para encajar en una
duración objetivo sin volver a tocar los tiempos de cada escena.

## Música

Dejá un MP3 en `assets/musica.mp3` y volvé a correr **solo** el montaje (no hace
falta regrabar): se mezcla al 16 % de volumen con fundido de entrada y salida.

```bash
node montar.mjs --velocidad 1.1
```

## Piezas

| Archivo | Qué hace |
| --- | --- |
| `grabar.mjs` | Arnés: inicia sesión fuera de cámara y graba dos pasadas, una por capítulo. |
| `escenas/*.mjs` | El guion de cada capítulo — acá se edita qué se muestra y qué dice. |
| `piloto.mjs` | Conducción "humana": trayectorias con curva, tipeo irregular, encuadres. |
| `capa-visual.js` | Se inyecta en la página: cursor, subtítulos, placas, resaltados. |
| `montar.mjs` | ffmpeg: normaliza, encadena con disolvencia, mezcla música, exporta. |
| `demo-datos.mjs` | Siembra y borra las oportunidades de ejemplo (ver abajo). |
| `sonda.mjs` | Diagnóstico: lista lo que realmente renderiza cada ruta. |

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
