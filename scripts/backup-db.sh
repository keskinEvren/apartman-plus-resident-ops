#!/bin/bash
#
# Database Backup Script
# Creates a timestamped SQL dump of the database.
#
# Usage: npm run backup
#

set -e

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Extract DB info from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📦 Backing up database: $DB_NAME"
echo "   Destination: $BACKUP_FILE"

# Run pg_dump
pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully!"
  echo "   Size: $(du -h $BACKUP_FILE | cut -f1)"
else
  echo "❌ Backup failed!"
  exit 1
fi
