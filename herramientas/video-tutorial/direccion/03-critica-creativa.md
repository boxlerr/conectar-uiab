# Crítica de dirección — "UIAB Conecta" v2

**Veredicto en una línea:** es un demo reel de producto, muy bien ejecutado, disfrazado de tutorial. Como sizzle está en 8/10. Contra el brief que me pasaste —"que entiendan cómo usar la plataforma"— está en 3/10. Y hay tres planos que describen pantallas que no existen en el producto.

Lo que sigue está verificado contra el código, no contra el documento.

---

## 1. ¿Se entiende el producto viéndolo?

No. Se entiende que existe. No se entiende cómo se usa ni por qué le sirve a él.

**El documento eligió en silencio uno de los dos trabajos del brief.** 58 segundos, 21.7 cortes/min, sin locución, 8 carteles de ≤42 caracteres: eso son ~300 caracteres de copy para explicar un marketplace de dos lados. Un dueño de metalúrgica de 55 años no aprende un producto con 300 caracteres y planos de un segundo. La gramática de 1.0–1.5 s es de lanzamiento SaaS (Linear, Vercel). Para este público no es dinámica, es hostil: S03 son 1.0 s de un chip que dice "Abierta". Eso no enseña, es textura.

**El hook se auto-engaña.** La checklist declara "momento ajá en 2.00". S01/S02/S03 son cuatro segundos de UI sin marco de referencia: un badge con un porcentaje antes de que el espectador sepa qué es la plataforma no es un ajá, es ruido. El ajá real de este producto es *"alguien acá cerca necesita lo que yo fabrico y no lo sabía"*. El video nunca lo dice, ni con imagen ni con texto.

**Faltan las dos preguntas que este público hace primero:**
- *¿Quién está adentro y cuántos son?* La respuesta existe y es fuerte —`landing-empresas-publica.tsx:689` dice "+60 empresas e industrias verificadas del partido", y la línea 188 nombra los rubros (metalúrgicas, químicas, alimentos, constructoras, salud, inmobiliarias). Nada de eso aparece legible en 58 segundos. Para un directorio, el número de empresas es el argumento. No está.
- *¿Cómo entro yo?* El alta y la verificación son el primer acto real del usuario, y no están. El video enseña a usar algo en lo que el espectador todavía no está adentro.

**Vocabulario roto entre video y producto.** El clímax dice `EL MATCH`. La UI dice "Proveedores de servicios Recomendados" / "Oportunidades para Vos" (`src/app/(panel)/panel-de-control/page.tsx:581`). La palabra "match" no existe en ninguna pantalla. Le estás enseñando una palabra que después no va a encontrar. Para un tutorial eso es un error de primer orden.

**"El parque" es un problema.** El producto es de Almirante Brown —un partido, no un parque industrial— y su propia landing habla de "empresas radicadas del partido". El producto está internamente inconsistente (el onboarding también dice "parque"), pero el video tiene que resolver esa inconsistencia hacia arriba, no heredarla. "Todo el parque, en una pantalla" achica el producto y suena a que el que lo escribió no conoce el territorio. Cámbialo por el partido, la red UIAB o Almirante Brown.

**"Nunca se aprieta Enviar" es la peor decisión pedagógica del documento.** Es el único momento transaccional de la pieza y le sacaste el final. El producto ya tiene ese frame: `DialogoPostularse.tsx:80` dispara `toast.success("Postulación enviada")` y la línea 22 tiene el estado `"Enviada — esperando respuesta"`. Ese es exactamente el plano que le saca el miedo a alguien que nunca mandó una propuesta por internet. Presentarlo como decisión de gusto ("nunca se aprieta Enviar") es confundir contención con elegancia. Lo mismo en S19: el formulario se llena y nunca se publica.

### Errores de hecho: planos que no existen

- **S11 está mal en tres niveles.** `[data-tour="perfil-servicios"]` vive en `src/app/perfil/page.tsx:277` — la ficha propia del usuario logueado, **no** la ficha pública de Vaxler. No es "grilla de 6 servicios con foto": son chips de texto (`services.slice(0, 6)` en spans de 12 px). Y el bloque equivalente en la ficha pública (`src/app/empresas/[slug]/page.tsx:786`) se llama "Rubros y especialidades", tampoco tiene fotos, es un flex-wrap de tags y **no tiene `data-tour`**. Resultado: S10 → S11 → S12 salta sin querer de la ficha pública al editor logueado y vuelve. Es un salto de contexto invisible para vos y desconcertante para el espectador. El "tilt de 45 px" recorre una grilla de fotos que no existe.
- **S04/S05 mezclan dos directorios.** `directorio-buscador` está en `components/ui/directorio/barra-filtros.tsx` (lo usa `/directorio`); `directorio-toolbar` existe en `/directorio` **y** en `/empresas`. Definí una ruta canónica o vas a montar dos páginas distintas como si fueran la misma.
- **El prerrequisito 1 está mal diagnosticado.** `dash-matches` sí renderiza siempre para empresa o proveedor (`{(isCompany || isProvider) && …}`, línea 574); lo que cae en estado vacío es el interior si `dashboardMatches.length === 0`. El riesgo que señalás es real, la causa no.
- **El badge del 94 % es un pico a suerte de seed.** El código hace `score = Math.round(match.puntaje)`. Si el dato sembrado da 61, el clímax de tu pieza es un 61. Además, el chip real es de 10 px `font-black`; tu overlay de 24 px no es lo que el usuario va a ver cuando entre. Estás construyendo el remate sobre una reconstrucción.

---

## 2. El pico emocional: bien puesto, mal elegido

La colocación estructural es correcta y el oficio está: 81 % del runtime, hold de 7 s, cámara congelada 2.2 s para que el número sea lo único que se mueve. Eso es dirección de verdad.

**Pero el pico es un feature, no una persona.** "El sistema te lo sugiere" + un porcentaje. Para este público específico el algoritmo es lo que *genera desconfianza*, no deseo. Un dueño de PyME industrial no compra "94 % compatible": compra "esto lo revisó la UIAB" y "el que necesita esto está a doce cuadras". El activo emocional más fuerte que tenés está enterrado como subtítulo de 2.6 segundos en T3: **"Verificada por la UIAB"**. Esa es la razón por la que este directorio no es Google. Debería ser el pico.

**Y el pico es el momento con menos vida de la pieza.** 58 segundos sin una persona, una mano, una planta, una máquina, un producto físico. Los únicos dos planos del mundo real son aéreos de dron que no dicen nada de nadie. Es un video sobre industria sin industria adentro.

Reubicación: el pico es **la conexión**, no el score. Plano sostenido sobre la ficha de la empresa recomendada, con el teléfono y el mail legibles, el sello de verificación, y un cartel escrito como lo diría un dueño en voz alta. El porcentaje, si sobrevive, es soporte.

---

## 3. Qué sobra y qué falta

**Sobra (~14 s recuperables de 58):**

| Qué | Cuánto | Por qué |
|---|---|---|
| Los dos aéreos de dron | 6.0 s = 10.3 % del runtime | Stock que no comunica nada y es lo más plantilla de la pieza. Recortá a 1.2 s + 2.0 s. |
| S01/S02/S03 | 4.0 s | UI sin contexto. Reemplazalos por un plano que diga qué es esto y cuántos hay adentro. |
| S18 | 1.0 s | Formulario vacío. No aporta. |
| S11 | 1.5 s | Describe una pantalla inexistente (ver arriba). |
| Vaxler al 0.55 durante 58 s | — | Es crédito de agencia sobre el tutorial del cliente. Si lo pidió, cumplilo, pero bajalo a 0.35 y sacalo del hold 51.10–53.30: no compitas contigo mismo en el único momento donde querés atención absoluta. |
| La superelipse n=4.5, el grano al 2 %, los 6400×3600 | — | Es craft real aplicado al riesgo equivocado. Nadie abandona por judder subpíxel; abandonan porque no entienden qué están mirando. |

**Falta:**

1. **Locución.** Es la decisión que más mueve la aguja y el documento la descarta entre paréntesis. Una voz argentina de laburante, sin impostación de locutor, sube el techo de comprensión de 300 caracteres a ~150 palabras. Y **el guion ya está escrito**: `src/modulos/onboarding/pasos/pasos-oportunidades.tsx` y sus tres hermanos (`pasos-directorio`, `pasos-dashboard`, `pasos-perfil`) tienen copy en el registro exacto — "Buscá lo que te cuadra", "Probá con 'mantenimiento' o 'logística'", "Todo lo que ves acá son pedidos auditados por la UIAB". Es incómodo pero es cierto: **el onboarding del producto escribe mejor que el video.**
2. **La escala**: el número real de empresas, en pantalla, grande, una vez.
3. **Rubros nombrados.** Un dueño se reconoce en "metalúrgica", no en "empresas".
4. **Cómo me doy de alta.** La landing ya tiene el flujo de tres pasos.
5. **Móvil.** Todo el tratamiento vive en un viewport de 1600×900 dentro de un marco de laptop. Este público mira desde el celular en la planta y el video va a circular por WhatsApp. No hay un solo frame vertical ni un solo plano del producto en teléfono. Peor: el eyebrow de 18 px es **1.7 % de la altura de cuadro** — en un celular es ilegible, y encima carga toda la estructura de la pieza (`DIRECTORIO`, `OPORTUNIDADES`, `PUBLICÁ`, `EL MATCH`). La señalización estructural es la tipografía más chica del video, justo donde está el público. La URL de cierre, igual: 18 px al 0.42 de opacidad como único CTA.
6. **Un CTA que sea una acción**, no una URL fantasma.
7. **Una segunda empresa además de Vaxler.** Con una sola ficha repetida en S02, S08, S09, S10 y S12, un directorio parece un portfolio.

---

## 4. Lo que se siente genérico / "hecho con IA"

Esto es lo más duro y va entero.

- **La paleta es el preset.** Navy en gradiente + acento naranja + glow radial + grilla de 1 px + grano al 2 % + mockup de dispositivo flotando: es el default de todo landing generado por IA desde 2023. Es cosplay de keynote de Vercel aplicado a metalúrgicas del conurbano sur. El registro está equivocado: parece caro, parece de afuera, parece que no es para ellos. Para este público la señal de confianza no es "premium tech", es "esto es de acá, esto lo conozco".
- **El aéreo de dron acelerando + logo que vuela a la esquina** es el template gratis de After Effects, y es lo primero y lo último que ve el espectador. Los dos extremos de la pieza son los dos momentos más impersonales.
- **El copy es intercambiable.** "Todo el parque, en una pantalla" / "Contacto directo. Sin intermediarios." / "El sistema te lo sugiere" / "Contá qué necesitás" sirven para un marketplace de cualquier rubro, en cualquier país, en cualquier década. Nada es industrial, nada es de Almirante Brown, nada nombra un plegado, una matricería, un torno CNC, un flete. La especificidad es lo único que no se puede templatear y el tratamiento la deja adentro de screenshots ilegibles de 1.5 segundos. Y "Sin intermediarios" es literalmente copy que ya está en `landing-empresas-publica.tsx:92`: no estás escribiendo, estás citándote.
- **El documento mismo tiene el tell.** Es 60 % especificación de ffmpeg y 40 % dirección. Y la "verificación contra la checklist" con rangos (18–26 cortes/min, hold al 72–92 %, techo de 18 zooms) es optimizar contra una rúbrica genérica derivada de otro público y otro producto. Cumplir la rúbrica es exactamente el mecanismo por el que se produce trabajo técnicamente impecable y emocionalmente inerte. Ninguna de esas cifras salió de mirar a un dueño de PyME industrial.
- **Cero fricción, cero humano, cero error.** Todo se escribe solo, todo funciona a la primera, nadie duda. Los videos hechos por máquinas no tienen manos.

---

## Lo que está bien y hay que defender

Para que la crítica sea usable, no todo se tira:

- Matar el cursor lento, la barra de progreso, el rectángulo naranja de foco, las placas y el factor de velocidad global: correcto, todo, y bien argumentado.
- Capturar PNG a 2× y dirigir en post es la decisión estructural correcta, y sí resuelve las cuatro quejas del cliente de raíz.
- La regla "la cámara llega primero, el texto aterriza después" está bien pensada y bien especificada.
- §7.2 —"nunca se escribe a mano un número que la pantalla no muestra"— es la mejor línea del documento. Sostenela contra cualquier presión.

**Un matiz sobre el cursor:** matar el cursor está bien como default y mal como dogma. Sin cursor, y con campos que se escriben solos a 10 caracteres por segundo, la interfaz parece operarse sola: lee a mockup, no a software usable. Para un público no técnico, "hay alguien manejando esto" es andamiaje de comprensión, no ruido. Propongo cursor chico y rápido —no el de 1.5–2.5 s que tenías— sólo en los tres beats reales de interacción (buscador, chip de filtro, Postularme), y sin cursor en todo lo demás. El problema nunca fue el cursor: fue su velocidad.

---

## Contrapropuesta

**Dos piezas, no una.** El brief pide dos trabajos y el documento entrega uno con el nombre del otro.

**(a) El trailer — ~40 s.** Este montaje recortado, sin pretensión de tutorial, con ocho líneas de locución, el número de empresas en pantalla, dos rubros nombrados, y el pico movido de "94 % compatible" a "verificada por la UIAB + contacto directo". Versión 9:16 obligatoria para WhatsApp.

**(b) El tutorial — 2:30 a 3:00.** Narrado, cursor visible, una sola tarea continua de punta a punta: *"necesito quien me pliegue chapa"* → búsqueda → filtro → ficha → contacto → publico mi propio pedido → **postulación enviada**, con el alta y la verificación al principio. El guion ya existe en `src/modulos/onboarding/pasos/`.

Y antes de capturar un solo PNG: resolvé S11, elegí entre `/directorio` y `/empresas`, y decidí qué palabra usa el video para lo que la UI llama "Recomendados".