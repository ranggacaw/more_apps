#!/bin/sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -d vendor ]; then
  composer install
fi

if [ ! -d node_modules ]; then
  npm install
fi

if [ ! -f public/build/manifest.json ]; then
  npm run build
fi

php artisan key:generate --force --no-interaction || true
php artisan migrate --force --no-interaction
php artisan storage:link || true

exec "$@"
