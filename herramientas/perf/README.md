# Medición de performance

Arnés para **medir antes y después** de cada cambio que pueda tocar la velocidad
(regla del proyecto desde el 2026-10-20). Corre contra un `next start` local
(build de producción) que usa la base de PRODUCCIÓN: todo es lectura, pero el
Auth es el del plan Free, así que nada de correrlo en loop.

## Preparar (una vez por máquina)

```bash
cd herramientas/perf && npm init -y >/dev/null && npm i playwright@1 lighthouse@12
```

Chromium sale del caché de Playwright (`~/Library/Caches/ms-playwright`).

## Medir

```bash
npx next build
herramientas/perf/servidor.sh /tmp/perf-antes          # deja el server en :3100
cd herramientas/perf
SUPA_LOG=/tmp/perf-antes/supa.log WT=$PWD/../.. RUNS=3 node medir.mjs /tmp/perf-antes/medir.json
node lh.mjs /tmp/perf-antes/lh.json                     # Lighthouse móvil
# ...hacer el cambio, rebuild, repetir en /tmp/perf-despues...
node comparar.mjs /tmp/perf-antes/medir.json /tmp/perf-despues/medir.json
```

| Script | Qué mide |
| --- | --- |
| `medir.mjs` | TTFB, LCP, bytes de JS/imágenes, requests RSC, preloads de imagen en el HTML y **queries a Supabase que hace el servidor** por página (anónimo + logueado) |
| `fetch-log-preload.cjs` | lo carga `servidor.sh`: anota cada query con el request entrante que la originó (documento, prefetch, Server Action). Ver waterfalls y N+1 |
| `lh.mjs`, `lh-traza.mjs`, `cls.mjs` | Lighthouse móvil; detalle de layout shifts |
| `renders.mjs` | renders de React por interacción (volver a la pestaña, tipear, scroll) vía el hook de DevTools, en el build de producción |
| `recursos.mjs` | qué baja una página, ordenado por peso |
| `e2e.mjs` | recorrido de humo de 22 rutas: 200, sin error boundary, sin errores de JS |
| `header.mjs` | el header visible, resuelto, entre los dos servidores, y por qué estados pasó en la rama mientras se resolvía la sesión (que nadie logueado vea "Ingresar") |
| `diff-texto.mjs` | compara el texto visible de cada ruta entre dos servidores (`main` en :3200 vs. la rama en :3100): prueba que un refactor no cambió lo que se ve |

La sesión logueada sale de un magic link de un solo uso (`sesion.mjs`, cacheada
45 min en `.sesion.json`). **Nunca** cerrar esa sesión con `/auth/v1/logout`
sin `?scope=local`: el default es global y desloguea a la cuenta en todos lados.

`linea-base/` tiene la medición de `main` del 2026-10-20, antes de la PR de
performance.

`isr-2026-10-20/` tiene la medición de la PR que sacó la sesión del layout raíz
(main = a4e56c8 contra la rama): `comparacion.txt` es la salida de
`comparar.mjs`, y `rutas-*.txt` el ○/●/ƒ de `next build` de cada lado. Ojo al
leer JS/RSC: con las páginas estáticas Next prefetchea entero lo que se ve en
pantalla DESPUÉS del `load`; el JS antes del `load` no cambió.

