#!/bin/bash

# Run the migration to fix meta_ad_accounts table
echo "Running migration to fix meta_ad_accounts table..."

# You'll need to update these with your actual database connection details
DB_URL="${DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set it with your PostgreSQL connection string"
  exit 1
fi

# Run the migration
psql "$DB_URL" < src/db/migrations/0003_fix_meta_ad_accounts.sql

if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Migration failed. Please check the error messages above."
  exit 1
fi