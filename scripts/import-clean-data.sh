#!/bin/bash

echo "🎨 Importing Clean Concept B Data..."
echo "══════════════════════════════════════"
echo ""
echo "This will:"
echo "  1. Delete ALL existing check-ins"
echo "  2. Delete ALL Sanity rallyZoneV2 documents"
echo "  3. Delete ALL Sanity eventSegment documents"
echo "  4. Re-import all segments with proper coordinates"
echo "  5. Re-import all rally zones"
echo "  6. Create sample check-ins for testing"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    npx tsx scripts/generate-concept-b-mock-data.ts
else
    echo "❌ Cancelled"
fi
