#!/bin/bash

# ExtensioVitae - Edge Function Deployment Script
# Date: 2026-02-04
# Purpose: Deploy check-admin Edge Function to Supabase

set -e  # Exit on error

echo "🚀 ExtensioVitae - Edge Function Deployment"
echo "==========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo ""
    echo "Install with:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Check if Edge Function exists
if [ ! -f "supabase/functions/check-admin/index.ts" ]; then
    echo "❌ Edge Function not found: supabase/functions/check-admin/index.ts"
    exit 1
fi

echo "✅ Edge Function found"
echo ""

# Deploy the function
echo "📦 Deploying check-admin Edge Function..."
echo ""

supabase functions deploy check-admin --project-ref YOUR_PROJECT_REF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Test the function in Supabase dashboard"
echo "  2. Verify admin authentication works in production"
echo "  3. Check Edge Function logs for any errors"
echo ""
echo "🔗 Function URL:"
echo "  https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-admin"
echo ""
