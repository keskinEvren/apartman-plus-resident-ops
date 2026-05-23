#!/bin/bash

# ASANMOD v1.1.1 "Auto-Fixer" Script
# Usage: npm run fix:all

echo "🛠️  Running Auto-Fixer..."

echo "1. ESLint Fix..."
npx eslint . --fix || echo "⚠️  ESLint found some unfixable issues."

echo "2. Prettier Write..."
npx prettier --write . || echo "⚠️  Prettier issue."

echo "3. TSC Check (Report only)..."
npx tsc --noEmit || echo "❌ TSC Errors remain. Please fix manually."

echo "✅ Auto-Fix Complete. Run 'npm run status' to verify."
