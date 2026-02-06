#!/bin/bash
# Documentation Cleanup Script
# Moves old/completed documentation to archive

echo "🧹 Cleaning up documentation..."

# Create archive directories
mkdir -p docs/archive/v0.5.x
mkdir -p docs/archive/deployment_logs
mkdir -p docs/archive/migration_logs
mkdir -p docs/archive/wearable_deployment

# Move v0.5.x completion docs (if not already moved)
for file in \
  DASHBOARD_UX_INTEGRATED.md \
  DEPLOYMENT_v0.5.1.md \
  MORNING_CHECKIN_INTEGRATION.md \
  ONBOARDING_GUARD_COMPLETE.md \
  RECOVERY_SCORES_TABLE.md \
  UX_WEEK1_COMPLETE.md \
  UX_WEEK1_IMPLEMENTATION.md \
  V0.4.0_COMPLETE.md \
  V0.5.0_AUTONOMOUS_COMPLETE.md
do
  if [ -f "docs/$file" ]; then
    mv "docs/$file" "docs/archive/v0.5.x/"
    echo "✅ Archived: $file"
  fi
done

# Move deployment logs (if not already moved)
for file in \
  EDGE_FUNCTIONS_DEPLOY_MANUAL.md
do
  if [ -f "docs/$file" ]; then
    mv "docs/$file" "docs/archive/wearable_deployment/"
    echo "✅ Archived: $file"
  fi
done

# Remove .DS_Store files
find docs -name ".DS_Store" -delete 2>/dev/null
echo "✅ Removed .DS_Store files"

echo ""
echo "📊 Remaining docs in /docs:"
ls -1 docs/*.md 2>/dev/null | wc -l | xargs echo "  Markdown files:"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Archive structure:"
tree -L 2 docs/archive 2>/dev/null || find docs/archive -type d | head -10
