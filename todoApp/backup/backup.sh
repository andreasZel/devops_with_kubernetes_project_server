#!/usr/bin/env bash
set -euo pipefail

# Construct URL if Postgres secrets are present
if [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_HOST:-}" ] && [ -n "${POSTGRES_PORT:-}" ] && [ -n "${POSTGRES_DB:-}" ]; then
    export URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
fi

if [ -n "${URL:-}" ]; then
  DUMP_FILE="/usr/src/app/backup.sql"
  echo "Creating database dump..."
  pg_dump -v "$URL" > "$DUMP_FILE"

  OBJECT_PATH="backups/$(date +%Y%m%d_%H%M).sql"
  echo "Uploading to bucket: $BUCKET_NAME"
  gsutil cp "$DUMP_FILE" "gs://$BUCKET_NAME/$OBJECT_PATH"

  echo "Backup uploaded: gs://$BUCKET_NAME/$OBJECT_PATH"
else
  echo "ERROR: URL is not set"
  exit 1
fi
