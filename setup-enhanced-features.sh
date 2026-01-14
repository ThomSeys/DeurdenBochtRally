#!/bin/bash

# Enhanced Features Setup Script
# This script helps you set up the new features

echo "🎉 Deur Den Bocht - Enhanced Features Setup"
echo "============================================="
echo ""

# Check if .env file exists
if [ ! -f "apps/web/.env" ]; then
    echo "⚠️  No .env file found in apps/web/"
    echo "Creating .env from template..."
    cp apps/web/.env.example apps/web/.env 2>/dev/null || true
fi

echo "📋 Step 1: Database Migration"
echo "------------------------------"
echo "You need to run the SQL migration to create new tables."
echo ""
echo "Option 1: Using psql (if you have DATABASE_URL)"
read -p "Do you have DATABASE_URL set? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not found in environment"
        echo "Set it with: export DATABASE_URL='your-connection-string'"
    else
        echo "Running migration..."
        psql "$DATABASE_URL" < scripts/add-enhanced-features.sql
        echo "✅ Migration complete!"
    fi
else
    echo ""
    echo "Option 2: Manual (Supabase Dashboard)"
    echo "1. Go to your Supabase dashboard"
    echo "2. Click 'SQL Editor'"
    echo "3. Copy contents of scripts/add-enhanced-features.sql"
    echo "4. Paste and execute"
    echo ""
    read -p "Press enter when migration is complete..."
fi

echo ""
echo "✉️  Step 2: Email Service (Resend)"
echo "--------------------------------"
echo "Sign up at https://resend.com and get an API key"
echo ""
read -p "Enter your Resend API key (or press enter to skip): " resend_key
if [ -n "$resend_key" ]; then
    echo "RESEND_API_KEY=$resend_key" >> apps/web/.env
    echo "✅ Resend API key saved to .env"
fi

echo ""
echo "🔔 Step 3: Push Notifications (VAPID Keys)"
echo "----------------------------------------"
echo "Generating VAPID keys..."
echo ""
npx web-push generate-vapid-keys

echo ""
echo "Copy the keys above and add them to your .env file:"
echo "VAPID_PUBLIC_KEY=..."
echo "VAPID_PRIVATE_KEY=..."
echo "VAPID_EMAIL=mailto:info@deurdenbocht.be"
echo ""
read -p "Press enter when keys are added to .env..."

echo ""
echo "📸 Step 4: Photo Upload (Optional)"
echo "--------------------------------"
echo "For direct image uploads, you can integrate:"
echo "- Cloudinary (recommended)"
echo "- Supabase Storage"
echo "- Sanity Asset Management"
echo ""
echo "For now, users will need to upload images elsewhere and paste URLs."
echo ""

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. ✅ Run: npm install (in apps/web)"
echo "2. ✅ Add environment variables to Vercel dashboard"
echo "3. ✅ Deploy: git push (if auto-deploy enabled)"
echo "4. ✅ Test all features using the guide"
echo ""
echo "📚 Full documentation: ENHANCED-FEATURES-GUIDE.md"
echo ""
echo "Happy rallying! 🏍️"
