#!/usr/bin/env bash
set -euo pipefail

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
