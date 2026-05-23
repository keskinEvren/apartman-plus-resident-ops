#!/bin/bash

# PROD Fix Sync Status Check Script
# Rule 9: PROD Fix → DEV Sync (MANDATORY!)
# Usage: ./scripts/check-prod-fix-sync.sh [commit-hash]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEV_DB="${DEV_DB:-myapp_dev_db}"
PROD_DB="${PROD_DB:-myapp_prod_db}"
PGUSER="${DB_USER:-dbuser}"
PGPASSWORD="${DB_PASSWORD:-dbpassword}"
export PGPASSWORD

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Check last PROD fix commit
check_last_prod_fix() {
  local commit_hash=${1:-""}

  if [ -z "$commit_hash" ]; then
    # Find last commit with [PROD-FIX] tag
    # Use GIT_PAGER=cat to avoid wrapper interference
    commit_hash=$(GIT_PAGER=cat git log --all --grep="\[PROD-FIX\]" --pretty=format:"%H" -1 2>/dev/null | head -1 | tr -d '[:space:]\n\r' || echo "")
  else
    # Clean commit hash from any wrapper output - extract only 40-char hex
    commit_hash=$(echo "$commit_hash" | grep -oE '[0-9a-f]{40}' | head -1 || echo "")
  fi

  # Validate commit hash format (40 hex chars)
  if [ -z "$commit_hash" ] || [ ${#commit_hash} -ne 40 ]; then
    log_info "No PROD Fix commits found"
    return 1
  fi

  local commit_msg=$(git log -1 --pretty=%B "$commit_hash" 2>/dev/null || echo "")
  local commit_date=$(git log -1 --pretty=%ci "$commit_hash" 2>/dev/null || echo "")

  log_info "Last PROD Fix commit:"
  echo "  Hash: $commit_hash"
  echo "  Date: $commit_date"
  echo "  Message: $(echo "$commit_msg" | head -1)"
  echo ""

  echo "$commit_hash"
  return 0
}

# Check DEV sync status
check_dev_sync() {
  local commit_hash=$1

  log_info "Checking DEV sync status for commit: $commit_hash"

  # Check if commit exists in DEV branch (assuming main/master is DEV)
  if git branch --contains "$commit_hash" | grep -qE "(main|master|dev)"; then
    log_success "Commit exists in DEV branch"
    return 0
  else
    log_warning "Commit not found in DEV branch"
    return 1
  fi
}

# Compare schemas
compare_schemas() {
  log_info "Comparing DEV and PROD schemas..."

  # Use existing schema check script if available
  if [ -f "$SCRIPT_DIR/deep-schema-check.sh" ]; then
    log_info "Running deep schema check..."
    local schema_diff=$(bash "$SCRIPT_DIR/deep-schema-check.sh" 2>&1)

    # Check for differences
    if echo "$schema_diff" | grep -q "❌ MISSING"; then
      log_warning "Schema differences found:"
      echo "$schema_diff" | grep -A 5 "❌ MISSING" | head -20
      return 1
    else
      log_success "Schemas are in sync"
      return 0
    fi
  else
    log_warning "Schema check script not found, skipping comparison"
    return 0
  fi
}

# Report status
report_status() {
  local commit_hash=$1
  local dev_sync_status=$2
  local schema_sync_status=$3

  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║     PROD Fix Sync Status Report                                 ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  echo "Commit: $commit_hash"
  echo ""

  echo "Sync Status:"
  if [ "$dev_sync_status" = "synced" ]; then
    echo "  ✅ DEV Sync: Synced"
  elif [ "$dev_sync_status" = "pending" ]; then
    echo "  ⚠️  DEV Sync: Pending"
  else
    echo "  ❌ DEV Sync: Unknown"
  fi

  if [ "$schema_sync_status" = "synced" ]; then
    echo "  ✅ Schema Sync: Synced"
  elif [ "$schema_sync_status" = "pending" ]; then
    echo "  ⚠️  Schema Sync: Pending"
  else
    echo "  ❌ Schema Sync: Unknown"
  fi

  echo ""

  if [ "$dev_sync_status" = "synced" ] && [ "$schema_sync_status" = "synced" ]; then
    log_success "All sync checks passed!"
    return 0
  else
    log_warning "Sync issues detected - manual sync may be required"
    echo ""
    echo "To sync manually, run:"
    echo "  ./scripts/sync-prod-fix-to-dev.sh $commit_hash"
    echo ""
    return 1
  fi
}

# Main function
main() {
  local commit_hash=${1:-""}

  # Check last PROD fix
  local prod_fix_commit=$(check_last_prod_fix "$commit_hash" 2>&1)

  # Check if result is actually a commit hash (40 chars hex)
  if [ -z "$prod_fix_commit" ] || [ ${#prod_fix_commit} -ne 40 ]; then
    log_info "No PROD Fix commits to check"
    exit 0
  fi

  commit_hash=$prod_fix_commit

  # Check DEV sync
  local dev_sync_status="unknown"
  if check_dev_sync "$commit_hash"; then
    dev_sync_status="synced"
  else
    dev_sync_status="pending"
  fi

  # Compare schemas
  local schema_sync_status="unknown"
  if compare_schemas; then
    schema_sync_status="synced"
  else
    schema_sync_status="pending"
  fi

  # Report status
  if report_status "$commit_hash" "$dev_sync_status" "$schema_sync_status"; then
    exit 0
  else
    exit 1
  fi
}

# Run main function
main "$@"

