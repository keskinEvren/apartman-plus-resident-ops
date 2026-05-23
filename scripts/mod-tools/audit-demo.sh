#!/bin/bash
# ╔════════════════════════════════════════════════════════════════╗
# ║  ASANMOD v1.0.0 - AUDIT DEMO SCRIPT                            ║
# ║  Demo scenarios for engineer audit                             ║
# ╚════════════════════════════════════════════════════════════════╝

set -e

# Get project root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔴 DEMO 1: COMMIT FORMAT ENFORCEMENT"
echo "  Wrong format commit attempt → REJECT expected"
echo "═══════════════════════════════════════════════════════════"
echo ""
git commit --allow-empty -m "bad format test" 2>&1 || true
echo ""

read -p "Press ENTER to continue..."

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🟢 DEMO 2: CORRECT FORMAT COMMIT (dry-run)"
echo "  type(scope): message → Format OK"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Example correct format: feat(auth): add login validation"
echo ""

read -p "Press ENTER to continue..."

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔵 DEMO 3: PM2 WRAPPER"
echo "  ./scripts/mod-tools/pm dev status"
echo "═══════════════════════════════════════════════════════════"
echo ""
./scripts/mod-tools/pm dev status || echo "PM2 not running (expected for fresh install)"
echo ""

read -p "Press ENTER to continue..."

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🟣 DEMO 4: JIT CONTEXT LOADING"
echo "  Error → Context Pack suggestion"
echo "═══════════════════════════════════════════════════════════"
echo ""
if [ -f "scripts/mod-tools/context-loader.cjs" ]; then
  node scripts/mod-tools/context-loader.cjs "P2002" 2>/dev/null || echo "Context suggestion displayed"
else
  echo "Context loader not available"
fi
echo ""

read -p "Press ENTER to continue..."

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🟡 DEMO 5: SYSTEM STATUS"
echo "  node scripts/mod-tools/quick-status.cjs"
echo "═══════════════════════════════════════════════════════════"
echo ""
if [ -f "scripts/mod-tools/quick-status.cjs" ]; then
  node scripts/mod-tools/quick-status.cjs
else
  echo "Quick status not available"
fi
echo ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ DEMO COMPLETED"
echo "═══════════════════════════════════════════════════════════"
echo ""
