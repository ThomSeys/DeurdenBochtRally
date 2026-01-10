#!/bin/bash

# Deur Den Bocht - Database Setup Script
# This script creates all necessary tables in Supabase

set -e  # Exit on error

echo "🚀 Setting up Supabase database..."
echo ""

# Load environment variables
if [ -f apps/web/.env.local ]; then
    export $(cat apps/web/.env.local | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from apps/web/.env.local"
else
    echo "❌ Error: apps/web/.env.local not found"
    exit 1
fi

# Check if required variables are set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL not found in .env.local"
    exit 1
fi

# Extract project ref and connection details
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo ""
echo "📊 Database connection details:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql (PostgreSQL client) is not installed"
    echo ""
    echo "Install it with:"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

echo "⚠️  You will need your Supabase database password"
echo "   Find it in: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
read -sp "Enter database password: " DB_PASSWORD
echo ""
echo ""

# Execute the schema
echo "📝 Executing schema SQL..."
PGPASSWORD=$DB_PASSWORD psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f supabase-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✨ Database setup complete!"
    echo ""
    echo "📊 Created tables:"
    echo "   - participants"
    echo "   - rally_submissions"
    echo "   - documents"
    echo ""
    echo "🔒 Row Level Security enabled"
    echo "📈 Indexes created"
    echo "🎯 Leaderboard function created"
    echo ""
else
    echo ""
    echo "❌ Error executing schema"
    echo ""
    echo "Alternative: Run SQL manually in Supabase Studio"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/editor"
    echo ""
    exit 1
fi
