#!/bin/bash

# ASANMOD v1.1.1 - ENV SYNC PROTOCOL
# ID: OPS-003
# Syncs .env.example keys to .env files safely.

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "---------------------------------------------------"
echo "🔄 ASANMOD ENVIRONMENT SYNC"
echo "---------------------------------------------------"

APP_ROOT=$(pwd)

# Function to sync env
sync_env() {
    local EXAMPLE_FILE=$1
    local TARGET_FILE=$2

    if [ ! -f "$EXAMPLE_FILE" ]; then
        echo -e "${RED}❌ Missing example file: $EXAMPLE_FILE${NC}"
        return
    fi

    if [ ! -f "$TARGET_FILE" ]; then
        echo -e "${YELLOW}⚠️ Target missing, creating: $TARGET_FILE${NC}"
        cp "$EXAMPLE_FILE" "$TARGET_FILE"
        echo -e "${GREEN}✅ Created $TARGET_FILE${NC}"
        return
    fi

    echo "⚙️ Syncing $TARGET_FILE..."

    # Read keys from example and add if missing in target
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        if [[ $line =~ ^# ]] || [[ -z $line ]]; then
            continue
        fi

        # Extract key
        KEY=$(echo "$line" | cut -d '=' -f 1)

        # Check if key exists in target
        if ! grep -q "^$KEY=" "$TARGET_FILE"; then
            echo -e "${YELLOW}➕ Adding missing key: $KEY${NC}"
            echo "$line" >> "$TARGET_FILE"
        fi
    done < "$EXAMPLE_FILE"

    echo -e "${GREEN}✅ Synced $TARGET_FILE${NC}"
}

# Sync Root Envs (if any)
# Note: Root .env is deprecated in v4, but good to check legacy support

# Sync Frontend
echo ""
echo "📂 Frontend..."
sync_env "$APP_ROOT/frontend/.env.example" "$APP_ROOT/frontend/.env.local"
sync_env "$APP_ROOT/frontend/.env.example" "$APP_ROOT/frontend/.env.production"
sync_env "$APP_ROOT/frontend/.env.example" "$APP_ROOT/frontend/.env.development"

# Sync Backend
echo ""
echo "📂 Backend..."
sync_env "$APP_ROOT/backend/.env.example" "$APP_ROOT/backend/.env"

echo ""
echo "---------------------------------------------------"
echo "✅ Environment Sync Complete."
