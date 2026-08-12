# Rediseño de la pieza — pendiente

Estado: **el video actual fue rechazado**. Este documento es el encargo, para
que no se pierda al cambiar de sesión.

## Qué dijo el cliente, textual

> el video es horrible, no se ve el logo en la primera animacion, se ve todo
> tosco recorriendo lento, falta hacer zoom a las cosas y el texto sincronizado
> con los zooms, ademas me gustaria que tenga un borde sovervio lindo profesional
> la pantalla y el logo de la uiab y de vaxler en cada esquina. se queda mostrando
> la pantalla sin pasar nada se va rapidisimo hace una marca en las cosas horrible
> sin sentido, entra a un perfil super vacio tiene que entrar al de vaxler que
> tiene datos por lo menos. mas dinamico, mas transicciones mas zooms, mas
> animaciones, no tien que ser tan real recorriendo la web, tiene que ser cool
> como si fuese un productor director profesional (…) hay que darle una vuelta de
> rosca enorme

## El diagnóstico

El problema no son los detalles: es la arquitectura. Hoy **la cámara es el
navegador**. Todo pasa a velocidad real, el encuadre es el viewport completo y
los carteles los dibuja una capa inyectada en la página. Eso da un screencast,
y lo que se pide es una pieza dirigida.

La vuelta de rosca es mover la dirección al montaje: que Playwright entregue
**material crudo y limpio**, y que el encuadre, el zoom, el ritmo y el texto los
ponga ffmpeg en post.

## Lo que ya está resuelto

- **La ficha vacía.** El guion entraba a la primera tarjeta que apareciera y
  caía en `korund-sa`, que no tiene nada cargado. Ahora busca la de **Vaxler**,
  que es objetivamente la más completa de la base: 6 servicios **con 6 fotos**
  (la única con fotos), 10 etiquetas, 686 caracteres de descripción, logo y web.
  Si no la encuentra, cae en la primera.

## Lo que hay que hacer

| Pedido | Cómo se resuelve |
| --- | --- |
| Zooms sobre los elementos | Punch-in en post con ffmpeg (`scale`+`crop` con expresiones de tiempo), no scroll en vivo. |
| Texto sincronizado con el zoom | Los textos dejan de dibujarse en la página: se pre-renderizan como PNG con Chromium y se componen con `overlay` en el milisegundo exacto. |
| Sacar la "marca horrible" | Fuera el recuadro naranja de foco. El elemento se destaca **con el encuadre**, no con un borde. |
| Marco profesional de la pantalla | Mockup con esquinas redondeadas y sombra sobre fondo de marca, pre-renderizado como PNG y compuesto. |
| Logos de UIAB y Vaxler en las esquinas | Overlay de PNG (`logo.mjs` ya rasteriza el de UIAB; el de Vaxler está en `public/logo-vaxler.png`). |
| Logo en la animación de apertura | `--logo ambos` deja de ser opcional: va también en el plano aéreo inicial. |
| "Se queda sin pasar nada" / "se va rapidísimo" | Ritmo dirigido: cada plano dura lo que tiene que durar, con speed ramp sobre lo aburrido (scroll, tipeo). |
| Música | Bajarla (Pixabay, uso comercial sin atribución) y dejarla en `assets/musica.mp3`. El montaje ya la normaliza a −16 LUFS. |

## La investigación

En `direccion/` están los tres documentos que salieron de investigar referencias
(Linear, Stripe, Vercel, Apple; técnicas de punch-in sobre grabaciones de
pantalla; tipografía cinética; recetas de ffmpeg):

| Archivo | Qué es |
| --- | --- |
| `01-tratamiento.md` | Escaleta plano por plano de 58 s, con encuadres, zooms y tiempos de texto al milisegundo. |
| `02-viabilidad-tecnica.md` | Auditoría contra el binario real de ffmpeg. Qué se puede, qué no, y las cadenas de filtros exactas. |
| `03-critica-creativa.md` | Crítica dura del tratamiento. Léela antes de implementar nada. |

### Los tres hallazgos que cambian el plan

**1. No hay que grabar video del sitio.** Se capturan PNG a 3200×1800
(viewport 1600×900 con `deviceScaleFactor: 2`) y **todo el movimiento lo genera
ffmpeg**. Eso hace desaparecer de raíz las cuatro críticas —lo tosco, lo lento,
lo rapidísimo y la marca horrible— porque desaparece la causa común: el tiempo
real. Regalo técnico: mostrando la pantalla a 1600×900, cualquier zoom hasta 2×
es 1:1 de píxel. Nunca se escala hacia arriba.

**2. `drawtext` no existe en este binario de ffmpeg.** FFmpeg 7.0 hizo de
harfbuzz una dependencia dura del filtro y este build no lo trae; el filtro se
cayó silenciosamente. **Todo el texto sale de Chromium como PNG, sin plan B.**
Corolario: el rotulado y la captura tienen que vivir en el mismo proceso de
Playwright, porque los números que se muestran se leen del DOM.

**3. Los `cubic-bezier` hay que traducirlos** a expresiones cerradas
(`easeOutExpo` = `1-pow(2,-10*p)`, etc.). No hace falta ninguna tabla.

### Lo que la crítica marca y hay que decidir

- El tratamiento derivó en **demo reel de lanzamiento SaaS**: planos de 1 a 1.5 s,
  21 cortes por minuto, 8 carteles de menos de 42 caracteres. Para un dueño de
  metalúrgica de 55 años eso no es dinámico, es hostil. Y son ~300 caracteres de
  texto para explicar un marketplace.
- **La paleta es el preset**: navy en gradiente, acento naranja, glow radial,
  mockup de dispositivo flotando. Es el default de landing generada por IA.
- **"Match" no existe en el producto**: la UI dice "Recomendados" y "Oportunidades
  para vos". El video enseñaría una palabra que después no se encuentra.
- **"El parque" está mal**: Almirante Brown es un *partido*. La propia landing
  del sitio dice "empresas radicadas del partido".
- **Falta locución**, y es la palanca que más mueve la aguja. El guion ya está
  escrito en el onboarding del producto (`src/modulos/onboarding/pasos/*`).
- **Falta versión vertical**: este público mira desde el celular en la planta y
  el video va a circular por WhatsApp.
- Varios planos apuntan a selectores que no existen o están en otra página.

## Restricciones técnicas

- La post-producción es **sólo ffmpeg 7.x** desde Node. No hay After Effects.
- Sí se pueden pre-renderizar PNGs con Chromium/Playwright, que ya es
  dependencia (`logo.mjs` lo hace).
- Grabar exige llegar a la base de producción: **desde un entorno de nube con
  egress restringido no se puede**. Este trabajo se termina en local.

## Cómo se filma

`npm run video` levanta la app solo, graba y monta. Necesita en el `.env` de la
raíz `UIAB_EMAIL` y `UIAB_PASSWORD` de una cuenta de empresa socia que no sea la
de la UIAB. Ver el README.
