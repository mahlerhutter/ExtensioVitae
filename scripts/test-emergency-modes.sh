#!/bin/bash
# Emergency Mode Selector - Quick Test Script
# Run this to test the feature locally

echo "🧪 Emergency Mode Selector - Testing Script"
echo "============================================"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed"
    echo ""
    echo "To test locally, you need to:"
    echo "1. Fix npm cache permissions (if needed):"
    echo "   sudo chown -R 501:20 ~/.npm"
    echo ""
    echo "2. Install dependencies:"
    echo "   npm install"
    echo ""
    echo "3. Run dev server:"
    echo "   npm run dev"
    echo ""
    echo "4. Open browser to: http://localhost:3100"
    echo ""
    exit 1
fi

# Start dev server
echo "🚀 Starting dev server..."
echo "📍 URL: http://localhost:3100"
echo ""
echo "📋 Testing Checklist:"
echo "  1. Navigate to /dashboard"
echo "  2. Find ModeSelector in sidebar"
echo "  3. Click 'Travel' mode"
echo "  4. Verify ModeIndicator appears"
echo "  5. Refresh page - mode should persist"
echo "  6. Test all 4 modes"
echo "  7. Check console for errors"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
