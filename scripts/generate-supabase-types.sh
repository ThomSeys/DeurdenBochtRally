#!/bin/bash

# Load environment variables from .env.local
if [ -f "apps/web/.env.local" ]; then
    export $(cat apps/web/.env.local | grep -v '^#' | xargs)
fi

# Extract project ID from SUPABASE_URL
# Format: https://PROJECT_ID.supabase.co
PROJECT_ID=$(echo $SUPABASE_URL | sed -E 's/https?:\/\/([^.]+).*/\1/')

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Could not extract project ID from SUPABASE_URL"
    exit 1
fi

echo "Generating TypeScript types for project: $PROJECT_ID"

# Generate types
npx supabase gen types typescript --project-id $PROJECT_ID > apps/web/app/lib/supabase.types.ts

if [ $? -eq 0 ]; then
    echo "✅ Types generated successfully at apps/web/app/lib/supabase.types.ts"
else
    echo "❌ Failed to generate types"
    exit 1
fi
