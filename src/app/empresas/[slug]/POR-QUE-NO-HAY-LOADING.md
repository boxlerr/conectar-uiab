# Por qué esta ruta no tiene `loading.tsx`

Tenía uno y se sacó a propósito el 11/08/2026.

## El problema

`/empresas/<slug-que-no-existe>` devolvía **HTTP 200** con la pantalla de "Perfil
no encontrado". Un soft 404.

El `notFound()` de `page.tsx` se ejecuta bien, pero llega tarde: `loading.tsx`
crea un boundary de Suspense, React manda el shell apenas lo tiene, y el status
HTTP viaja en esa primera cabecera. Cuando el `notFound()` finalmente corre, la
respuesta ya salió como 200 y no se puede cambiar. Es una limitación conocida de
App Router con streaming, no un bug del repo.

## Por qué importa acá más que en otros lados

El slug **no está en la base**: sale de `crearSlug(razon_social)` en cada render
(ver `src/lib/utilidades.ts`). O sea que renombrar una socia le cambia la URL, y
la vieja —que `sitemap.ts` ya publicó para que Google la indexara— queda
huérfana. Sin este arreglo, esa URL se vuelve un 200 permanente con contenido de
error: Google la mantiene en el índice como soft 404 y sigue gastando rastreo en
ella. Ya pasó una vez (`velargen-srl` → `tecza`, ver el redirect en
`next.config.ts`).

## Lo que se pierde

El esqueleto de carga al navegar a una ficha desde el cliente. Es un costo
chico: la mediana de render de una ficha es ~0,45 s, así que en vez de un flash
de esqueleto el usuario se queda un instante en la página anterior.

## Si alguna vez hace falta volver a poner un `loading.tsx`

Hay que resolver la existencia de la entidad **antes** del boundary de streaming
—por ejemplo persistiendo el `slug` como columna con índice único y chequeándolo
en el middleware o en un Server Component que bloquee el shell—. Poner el
`loading.tsx` de vuelta sin eso reintroduce el soft 404.

Lo fija `src/tests/seo/sin-datos-inventados.test.ts`.
