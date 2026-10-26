#!/bin/sh
set -eu

case "${1:-api}" in
  web)
    exec /app/node_modules/.bin/next start /app/apps/web -p "${PORT:-3000}"
    ;;
  api)
    exec node /app/apps/api/dist/main.js
    ;;
  worker)
    exec node /app/apps/worker/dist/main.js
    ;;
  *)
    exec "$@"
    ;;
esac
