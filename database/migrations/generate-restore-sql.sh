#!/usr/bin/env bash
# Generate plain SQL from the binary pg_dump backup (Method 1).
# Creates tastyplates-restore.sql in this directory.
# Requires: pg_restore (PostgreSQL client) or Docker.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
BACKUP="tastyplates-backup.sql"
OUTPUT="tastyplates-restore.sql"

if [[ ! -f "$BACKUP" ]]; then
  echo "Error: $BACKUP not found in $SCRIPT_DIR" >&2
  exit 1
fi

if command -v pg_restore &>/dev/null; then
  echo "Using pg_restore..."
  pg_restore -f "$OUTPUT" "$BACKUP"
  echo "Created $OUTPUT"
  exit 0
fi

if command -v docker &>/dev/null; then
  echo "pg_restore not found; using Docker..."
  docker run --rm \
    -v "$SCRIPT_DIR:/migrations" \
    postgres:17 \
    pg_restore -f /migrations/tastyplates-restore.sql /migrations/tastyplates-backup.sql
  echo "Created $OUTPUT"
  exit 0
fi

echo "Error: pg_restore and Docker not found. Install PostgreSQL client tools or Docker." >&2
echo "  macOS: brew install postgresql@17" >&2
exit 1
