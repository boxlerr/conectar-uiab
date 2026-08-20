# Rediseño de la pieza

Estado: **la arquitectura nueva está hecha y funcionando**. Queda pendiente
grabar la pieza definitiva (hace falta una cuenta que entre) y elegir música.

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

El problema no eran los detalles: era la arquitectura. **La cámara era el
navegador.** Todo pasaba a velocidad real, el encuadre era el viewport completo
y los carteles los dibujaba una capa inyectada en la página. Eso da un
screencast, y lo que se pide es una pieza dirigida.

La vuelta de rosca fue mover la dirección al montaje: Playwright entrega
**material crudo y limpio**, y el encuadre, el zoom, el ritmo y el texto los
pone ffmpeg en post.

## Lo resuelto

| Pedido | Cómo quedó |
| --- | --- |
| Zooms sobre los elementos | El guion declara planos con su sujeto; el montaje hace punch-in de 0.34 s sobre esa caja (`zoompan`). Acercamientos reales de 1.4× a 1.75×. |
| Texto sincronizado con el zoom | Los textos se pre-renderizan como PNG con Chromium y entran con el acercamiento. Una **claqueta** verde al inicio de la grabación ata el reloj del guion al fotograma exacto del `.webm`. |
| Sacar la "marca horrible" | Fuera el recuadro naranja. El elemento se destaca con el encuadre. |
| Marco profesional | `marco.mjs`: fondo de marca, pantalla con esquinas redondeadas, filo y sombra. |
| Logos de UIAB y Vaxler | En la banda superior, alineados a los bordes de la pantalla. |
| Logo en la animación de apertura | `--logo ambos` es el default: va en el plano aéreo inicial y en el final. |
| "Se queda sin pasar nada" | Sólo entran los planos. Navegar, esperar compilaciones y scrollear quedan afuera: ~20 s crudos por capítulo → ~12 s en la pieza. |
| Entra a un perfil vacío | Entra a Vaxler, que es la ficha más completa de la base (6 servicios con foto, 10 etiquetas, descripción, logo y web). |
| Flash blanco al entrar al sitio | Los planos aéreos funden contra el navy del marco, no contra la página. |

## Lo que falta

1. **Grabar la pieza definitiva.** Necesita `UIAB_EMAIL` / `UIAB_PASSWORD` en
   el `.env` de la raíz, de una cuenta de empresa socia que **no** sea la de la
   UIAB. Sin sesión, la ficha tapa catálogo y contacto con "Contenido exclusivo
   para miembros" y el capítulo 2 (Oportunidades) no existe.
   Verificado contra Supabase: `julianboxler@vaxler.com.ar` existe y está
   confirmada, pero la contraseña que hay en el `.env` no entra.
2. **Música.** No viene ninguna; hay que bajar un MP3 y dejarlo en
   `assets/musica.mp3`. El montaje lo normaliza a −16 LUFS. Ver el README.

## Restricciones técnicas (medidas, no supuestas)

- **Playwright graba al tamaño CSS del viewport.** Pedirle a `recordVideo` un
  tamaño mayor no amplía: mete el contenido 1:1 en una esquina y rellena el
  resto. Por eso se filma con viewport de 1920x1080 y no de 1600x900 — la
  resolución para los planos cerrados se gana agrandando el viewport.
- **El ffmpeg del sistema de esta Mac no trae `drawtext`.** Todo el texto va
  pre-renderizado como PNG. (El `ffmpeg-static` de `node_modules` sí lo trae,
  pero depender de eso es frágil.)
- La post-producción es **sólo ffmpeg** desde Node. No hay After Effects.
- Grabar exige llegar a la base de producción: desde un entorno de nube con
  egress restringido **no se puede**. Este trabajo se termina en local.

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

## Cómo se filma

`npm run video` levanta la app solo, graba y monta. Necesita en el `.env` de la
raíz `UIAB_EMAIL` y `UIAB_PASSWORD` de una cuenta de empresa socia que no sea la
de la UIAB. Ver el README.
