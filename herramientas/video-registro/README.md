# UIAB Conecta — Cómo sumar tu empresa (video narrado)

Instructivo para empresas **no socias** que quieren sumarse a UIAB Conecta: qué
necesitan, el registro paso a paso, el mail de confirmación, el pago por débito
automático en Sipago y qué pasa después. Lo pidió la UIAB (Evelyn, 15-oct-2026)
para mandarlo por WhatsApp a las empresas que estuvieron en la presentación.

Reemplaza a la pieza `--pieza registro` de `../video-tutorial`, cuya estética
(pantalla en un marco, carteles grandes abajo) se descartó. Esta sigue el
lenguaje de los videos de Vaxler —el de Biancatex y el de la Etapa 2 de Don
Joaquín—: capturas reales flotando como tarjetas sobre navy, resaltes sobre lo
que nombra la voz, barra de pasos arriba, subtítulos que se encienden palabra
por palabra, y locución. Mismo motor que `vaxler-video-dj-etapa2`: cada cuadro
es código, Playwright lo captura y ffmpeg arma el video. **La voz manda**: cada
escena dura lo que dura su narración.

## Hacerlo

```bash
npm install
# 1. Capturas reales de uiabconecta.com (a 2×, con la posición de cada campo)
node herramientas/capturar.mjs
# 2. Voz (Chatterbox, local; venv en ~/.local/share/vaxler-tts) — cada línea
#    se verifica transcribiéndola con whisper y se regenera si sale trabada
~/.local/share/vaxler-tts/venv-cb/bin/python audio/narrar_cb.py
~/.local/share/vaxler-tts/venv-cb/bin/python audio/narrar_cb.py --solo r1,c3   # una o varias
# 3. Línea de tiempo, palabras de los subtítulos, música y mezcla
node herramientas/tiempos.mjs
node herramientas/palabras.mjs
node audio/musica.mjs
# 4. Video
node render.mjs --stills 8,30,62             # cuadros sueltos → renders/stills
node render.mjs --fps 30 --sub 1             # borrador rápido
node render.mjs --entregar                   # final → ~/Desktop/uiab-renders/
```

Para iterar las escenas sin esperar la voz: `VOZ=audio/voz-prov` en
`tiempos.mjs` y `palabras.mjs` usa duraciones estimadas.

## Dónde se toca qué

| Qué | Dónde |
| --- | --- |
| Lo que dice la voz (`voz`) y lo que se lee (`texto`) | `guion.json` |
| Pantallas, cámara, resaltes y cursor | `src/escenas/recorrido.js` |
| Logo, frase de apertura y el nodo "Tu empresa" | `src/escenas/apertura.js` |
| Barra de pasos, fichas, firma de Vaxler | `src/escenas/capas.js` |
| Tiempos | contra la narración: `'r3#1'` = el 2.º tramo de la línea r3 (`cortes` en el guion) |

## Lo que no se negocia

- **Nada se escribe en producción.** Las capturas se sacan contra
  uiabconecta.com con todo POST interceptado (alta, chequeo de CUIT, solicitud
  de pago, registro de visitas). Los datos son de ejemplo ("Tu Empresa S.A.",
  el CUIT que el sitio usa de placeholder) y el video lo dice arriba a la
  derecha.
- **Lo que dice la voz es lo que hace el código.** Después del pago la ficha la
  aprueba la UIAB; el pago no la publica sola.
- **"UIAB" se deletrea en la voz** ("U I A B"): escrita junta, Chatterbox decía
  "web conecta" / "la uiap".
- Sipago no se filma: su checkout tiene verificación anti-bots.
