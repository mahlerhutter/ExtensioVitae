#!/bin/bash

# ExtensioVitae - GitHub Push Script
# Run this script in a normal terminal (not in the AI tool)

echo "🚀 ExtensioVitae - GitHub Push"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository!"
    echo "Please run this script from: /Users/mahlerhutter/dev/playground/MVPExtensio"
    exit 1
fi

# Check if remote is configured
if ! git remote get-url origin &> /dev/null; then
    echo "📝 Configuring GitHub remote..."
    git remote add origin https://github.com/mahlerhutter/ExtensioVitae.git
    echo "✅ Remote configured"
else
    echo "✅ Remote already configured"
fi

# Ensure we're on main branch
echo "📝 Ensuring main branch..."
git branch -M main
echo "✅ On main branch"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
echo "You will be asked for your GitHub credentials:"
echo "  Username: mahlerhutter"
echo "  Password: [Your GitHub password or Personal Access Token]"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "📊 View your repository:"
    echo "   https://github.com/mahlerhutter/ExtensioVitae"
    echo ""
    echo "🤖 GitHub Actions will run automatically!"
    echo "   Check: https://github.com/mahlerhutter/ExtensioVitae/actions"
    echo ""
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "💡 If you need a Personal Access Token:"
    echo "   1. Go to: https://github.com/settings/tokens/new"
    echo "   2. Create token with 'repo' scope"
    echo "   3. Use token as password when pushing"
    echo ""
fi
