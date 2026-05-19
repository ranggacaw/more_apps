#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=${BACKUP_DIR:-/var/backups/more-clinic}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

docker compose -f docker-compose.prod.yml exec -T pgsql pg_dump -U "$DB_USERNAME" "$DB_DATABASE" > "$BACKUP_DIR/more-clinic-$TIMESTAMP.sql"
