#!/bin/bash

# ASANMOD v1.0.0 "Express Lane" Commit Script
# Usage: npm run commit:fast "feat: message"

MSG="$1"

if [ -z "$MSG" ]; then
  echo "❌ Error: Commit message required."
  echo "Usage: npm run commit:fast 'feat: message'"
  exit 1
fi

set -e

# 1. CHECK FOR WIP (Draft Mode)
if [[ "$MSG" == WIP:* ]]; then
  echo "🚧 WARNING: DRAFT MODE DETECTED (WIP)"
  echo "Skipping all verification checks..."
  git commit -m "$MSG"
  echo "✅ Committed as WIP. Note: This will be blocked by pre-push hooks if on main."
  exit 0
fi

# 2. ANALYZE STAGED FILES
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  echo "❌ Error: No staged files."
  exit 1
fi

IS_ONLY_DOCS=true
IS_ONLY_CSS=true

for file in $STAGED_FILES; do
  if [[ "$file" != *.md ]]; then
    IS_ONLY_DOCS=false
  fi
  if [[ "$file" != *.css ]]; then
    IS_ONLY_CSS=false
  fi
done

# 3. EXPRESS LANE: DOCS
if [ "$IS_ONLY_DOCS" = true ]; then
  echo "📚 DOCS ONLY CHANGE DETECTED"
  echo "Skipping Build & Test..."
  # Optional: run markdown lint if available
  # npx markdownlint .
  git commit -m "$MSG"
  echo "✅ Fast Commit Complete (Docs)."
  exit 0
fi

# 4. EXPRESS LANE: CSS
if [ "$IS_ONLY_CSS" = true ]; then
  echo "🎨 CSS ONLY CHANGE DETECTED"
  echo "Running simplified verification..."
  # Only run lint, skip TSC and Backend Tests
  npm run lint
  git commit -m "$MSG"
  echo "✅ Fast Commit Complete (CSS)."
  exit 0
fi

# 5. FALLBACK: FULL RITUAL
echo "🐢 CODE CHANGE DETECTED - ENTERING FULL RITUAL"
npm run verify
if [ $? -eq 0 ]; then
  git commit -m "$MSG"
  echo "✅ Verified Commit Complete."
else
  echo "❌ Verification Failed."
  exit 1
fi
