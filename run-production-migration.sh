#!/bin/bash
# Script to run Prisma migrations on production database

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  echo "Please set it before running this script:"
  echo "  export DATABASE_URL='your-production-database-url'"
  echo "  ./run-production-migration.sh"
  exit 1
fi

echo "Running Prisma migrations on production database..."
echo "Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"

npx prisma migrate deploy

echo "Migration completed!"
