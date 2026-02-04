#!/bin/bash
# Docs Cleanup Script
# Run this to organize docs folder

cd "$(dirname "$0")/../docs" || exit 1

echo "🧹 Cleaning up docs folder..."

# Create directories if they don't exist
mkdir -p audits guides sessions archive

# Move audits (if not already moved)
echo "📊 Moving audits..."
for file in audit_*.json AUDIT.md BETA_READINESS_ASSESSMENT.md; do
    [ -f "$file" ] && mv "$file" audits/ 2>/dev/null && echo "  ✓ $file"
done

# Move session summaries
echo "📝 Moving session summaries..."
for file in DAILY_WORKFLOW_SUMMARY_*.md DEPLOYMENT_SUCCESS_*.md WEEK2_SESSION_*.md; do
    [ -f "$file" ] && mv "$file" sessions/ 2>/dev/null && echo "  ✓ $file"
done

# Move guides
echo "📚 Moving guides..."
for file in SECURITY_HEADERS.md SENTRY_SETUP.md BACKUP_CONFIGURATION.md \
            EDGE_FUNCTION_DEPLOYMENT.md EDGE_FUNCTION_VERIFICATION.md \
            EMAIL_SETUP_GUIDE.md EMAIL_STRATEGY.md REMINDER_BACKUPS_AFTER_PRO.md; do
    [ -f "$file" ] && mv "$file" guides/ 2>/dev/null && echo "  ✓ $file"
done

# Move to archive
echo "🗄️  Moving to archive..."
for file in 01-PRODUCT-OVERVIEW.md 02-USER-FLOW.md 03-LANDING-PAGE.md \
            04-INTAKE-FORM.md 05-AI-PLAN-GENERATION.md 07-DASHBOARD.md \
            MVP_ROADMAP.md PRODUCT_VISION_SYNTHESIS.md WHATS_NEXT.md; do
    [ -f "$file" ] && mv "$file" archive/ 2>/dev/null && echo "  ✓ $file"
done

# Remove .DS_Store
rm -f .DS_Store

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Docs structure:"
echo "  Core docs: $(ls -1 *.md 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Audits: $(ls -1 audits/ 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Guides: $(ls -1 guides/ 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Sessions: $(ls -1 sessions/ 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Archive: $(ls -1 archive/ 2>/dev/null | wc -l | tr -d ' ') files"
