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
