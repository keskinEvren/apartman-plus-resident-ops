#!/bin/bash
#
# Reset Development Environment
# Drops and recreates the development database.
#
# Usage: npm run reset-dev
#

set -e

# Load dev environment
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "⚠️  WARNING: This will DELETE all data in: $DB_NAME"
echo ""
read -p "   Continue? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🗑️  Dropping database..."
  dropdb --if-exists $DB_NAME

  echo "📦 Creating database..."
  createdb $DB_NAME

  echo "🔄 Running migrations..."
  npm run db:migrate

  echo "🌱 Seeding data..."
  npm run seed

  echo "✅ Development environment reset complete!"
else
  echo "❌ Reset cancelled"
  exit 0
fi
