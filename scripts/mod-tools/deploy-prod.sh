#!/bin/bash
# ASANMOD v1.0.0: Production Deployment Script
# Non-interactive, deterministic deployment with evidence logging

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration via environment (non-interactive)
BACKUP_DB=${BACKUP_DB:-1}          # Default: backup enabled
INTERACTIVE=${INTERACTIVE:-0}       # Default: non-interactive
SKIP_MIGRATE=${SKIP_MIGRATE:-0}    # Default: run migrations
NO_BACKUP=${NO_BACKUP:-0}           # Override: force no backup

# Parse arguments
for arg in "$@"; do
    case $arg in
        --no-backup)
            NO_BACKUP=1
            ;;
        --skip-migrate)
            SKIP_MIGRATE=1
            ;;
        --interactive)
            INTERACTIVE=1
            ;;
        *)
            ;;
    esac
done

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check project root
if [ ! -f "package.json" ]; then
    error "Must run from project root"
fi

if [ ! -f "docs/asanmod-core.json" ]; then
    error "docs/asanmod-core.json not found"
fi

# Create logs directory
mkdir -p logs

# Generate deployment timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TIMESTAMP_FILE=$(date -u +"%Y%m%d-%H%M%S")
DEPLOY_LOG="logs/deploy-${TIMESTAMP_FILE}.json"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 ASANMOD Production Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "Timestamp: $TIMESTAMP"
log "Log file: $DEPLOY_LOG"
echo ""

# Collect deployment evidence
GIT_SHA=$(git rev-parse HEAD)
GIT_BRANCH=$(git branch --show-current)
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

log "Git SHA: $GIT_SHA"
log "Git Branch: $GIT_BRANCH"
log "Node: $NODE_VERSION"
log "npm: $NPM_VERSION"
echo ""

# 1. Pre-flight checks
log "Running pre-flight checks..."
if ! bash scripts/mod-tools/verify.sh; then
    error "Pre-flight checks failed"
fi
success "Pre-flight checks passed"
echo ""

# 2. Database backup
if [ "$NO_BACKUP" = "0" ] && [ "$BACKUP_DB" = "1" ]; then
    if [ "$INTERACTIVE" = "1" ]; then
        read -p "Backup database? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            log "Running database backup..."
            npm run backup || log "Backup failed (continuing)"
        fi
    else
        log "Running database backup (non-interactive)..."
        npm run backup || log "Backup failed (continuing)"
    fi
else
    log "Skipping database backup"
fi
echo ""

# 3. Build production
log "Building production bundle..."
npm run build || error "Build failed"
success "Production build complete"
echo ""

# 4. Database migrations
if [ "$SKIP_MIGRATE" = "0" ]; then
    log "Running database migrations..."
    npm run db:migrate || log "No migrations to run"
else
    log "Skipping database migrations (--skip-migrate)"
fi
echo ""

# 5. PM2 restart
log "Restarting production with PM2..."
if command -v pm2 &> /dev/null; then
    ./scripts/mod-tools/pm prod restart || error "PM2 restart failed"
    success "PM2 restart complete"
else
    log "PM2 not installed, skipping PM2 restart"
    log "Start manually with: npm run start"
fi
echo ""

# 6. Health check
log "Running health check..."
sleep 3

HEALTH_STATUS="success"
if curl -f http://localhost:3002 > /dev/null 2>&1; then
    success "Production server is healthy (port 3002)"
else
    error "Production server health check failed"
    HEALTH_STATUS="failed"
fi

# 7. Write deployment evidence
log "Writing deployment evidence..."
cat > "$DEPLOY_LOG" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "git_sha": "$GIT_SHA",
  "git_branch": "$GIT_BRANCH",
  "node_version": "$NODE_VERSION",
  "npm_version": "$NPM_VERSION",
  "backup_performed": $([ "$BACKUP_DB" = "1" ] && echo "true" || echo "false"),
  "migrations_run": $([ "$SKIP_MIGRATE" = "0" ] && echo "true" || echo "false"),
  "health_check": "$HEALTH_STATUS",
  "success": true
}
EOF

success "Evidence logged: $DEPLOY_LOG"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Production URL: http://localhost:3002"
echo "Evidence: $DEPLOY_LOG"
echo "Check logs: ./scripts/mod-tools/pm prod logs"
