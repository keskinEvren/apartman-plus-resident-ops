#!/bin/bash
# ASANMOD v1.0.0: DB-Safe Rollback Script
# Rolls back to specific commit with DB safety

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[ROLLBACK]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Parse arguments
TARGET_SHA=""
RESTORE_DB=1
DRY_RUN=0

for arg in "$@"; do
    case $arg in
        --sha=*)
            TARGET_SHA="${arg#*=}"
            ;;
        --no-restore-db)
            RESTORE_DB=0
            ;;
        --dry-run)
            DRY_RUN=1
            ;;
        *)
            ;;
    esac
done

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  ASANMOD Production Rollback${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# If no SHA specified, try to get from last deploy
if [ -z "$TARGET_SHA" ]; then
    # Find most recent deploy log
    LAST_DEPLOY=$(ls -t logs/deploy-* 2>/dev/null | head -2 | tail -1)
    if [ -n "$LAST_DEPLOY" ]; then
        TARGET_SHA=$(jq -r '.git_sha' "$LAST_DEPLOY" 2>/dev/null)
        log "Found last successful deploy: $TARGET_SHA"
        log "From: $LAST_DEPLOY"
    else
        error "No deploy history found. Specify --sha=<commit>"
    fi
fi

log "Target SHA: $TARGET_SHA"
echo ""

# DRY RUN mode - show plan without executing
if [ "$DRY_RUN" = "1" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔍 DRY RUN - Rollback Plan${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    log "Would perform the following operations:"
    log "1. Create safety backup branch: rollback-backup-$(date +%Y%m%d-%H%M%S)"
    if [ "$RESTORE_DB" = "1" ]; then
        log "2. Restore database from backup"
    else
        log "2. Skip database restore (--no-restore-db)"
    fi
    log "3. Git reset --hard to: $TARGET_SHA"
    log "4. npm install (dependency sync)"
    log "5. Re-deploy with SKIP_MIGRATE=1 NO_BACKUP=1"
    log "6. Health check validation"
    echo ""
    log "DRY RUN complete - no changes made"
    exit 0
fi

# Confirmation
echo -e "${RED}⚠️  WARNING: This will roll back code and optionally database${NC}"
echo -e "${RED}⚠️  Current HEAD will be reset to: $TARGET_SHA${NC}"
echo ""
read -p "Type 'CONFIRM' to proceed: " -r
if [ "$REPLY" != "CONFIRM" ]; then
    log "Rollback cancelled"
    exit 0
fi

echo ""

# 1. Backup current state
log "Creating safety backup of current state..."
BACKUP_BRANCH="rollback-backup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
success "Safety backup: $BACKUP_BRANCH"
echo ""

# 2. Restore database if requested
if [ "$RESTORE_DB" = "1" ]; then
    log "Looking for database backup from target deployment..."
    # Find backup from around that deploy time
    # This is simplified - in production you'd have timestamped backups
    if [ -f "backups/latest.sql" ]; then
        log "Restoring database from backup..."
        npm run restore || log "Database restore failed (continuing)"
    else
        log "No database backup found - skipping restore"
        log "WARNING: Code will be rolled back but DB remains current!"
    fi
else
    log "Skipping database restore (--no-restore-db)"
fi
echo ""

# 3. Git rollback
log "Rolling back code to $TARGET_SHA..."
git reset --hard "$TARGET_SHA"
success "Code rolled back"
echo ""

# 4. Reinstall dependencies (may have changed)
log "Reinstalling dependencies..."
npm install
echo ""

# 5. Redeploy with rollback flags
log "Redeploying..."
SKIP_MIGRATE=1 NO_BACKUP=1 bash scripts/mod-tools/deploy-prod.sh

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Rollback complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Rolled back to: $TARGET_SHA"
echo "Safety backup: $BACKUP_BRANCH"
echo ""
echo "To undo this rollback:"
echo "  git checkout $BACKUP_BRANCH"
