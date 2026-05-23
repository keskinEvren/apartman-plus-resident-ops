#!/bin/bash
# ASANMOD v1.1.1: SURGICAL FORMAT
# Formats ONLY the files that are currently staged in git.
# Prevents full-codebase scanning and resolves "Format Wars".

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx|json|md|yml|yaml)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✨ No staged files to format."
  exit 0
fi

echo "🩹 Performing Surgical Format on staged files..."
echo "$STAGED_FILES"

# Format only staged files
echo "$STAGED_FILES" | xargs npx prettier --write --ignore-unknown

# Re-add them to git (because formatting changes file content)
echo "$STAGED_FILES" | xargs git add

echo "✅ Surgical Format Complete."
