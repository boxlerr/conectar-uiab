#!/bin/bash
# Levanta `next start` (build de producción) en el puerto $PUERTO (3100) con el
# log de queries a Supabase activado. Correr `npx next build` antes.
# Uso: herramientas/perf/servidor.sh <carpeta-de-salida>
set -e
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
SALIDA="${1:-/tmp/perf}"
mkdir -p "$SALIDA"
cd "$RAIZ"
exec env SUPA_LOG="$SALIDA/supa.log" NODE_OPTIONS="--require $RAIZ/herramientas/perf/fetch-log-preload.cjs" \
  npx next start -p "${PUERTO:-3100}" > "$SALIDA/server.log" 2>&1
