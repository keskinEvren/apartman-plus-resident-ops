#!/bin/bash
#
# Database Restore Script
# Restores database from a backup file.
#
# Usage: npm run restore -- backups/backup_20260115.sql
#

set -e

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Usage: npm run restore -- <backup_file>"
  echo "   Example: npm run restore -- backups/backup_20260115_120000.sql"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🔄 Restoring database: $DB_NAME"
echo "   From: $BACKUP_FILE"
echo ""
echo "⚠️  WARNING: This will overwrite existing data!"
read -p "   Continue? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  psql $DATABASE_URL < $BACKUP_FILE

  if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully!"
  else
    echo "❌ Restore failed!"
    exit 1
  fi
else
  echo "❌ Restore cancelled"
  exit 0
fi
