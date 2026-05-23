#!/bin/bash
# ASANMOD v1.1.1: ZOMBIE SLAYER
# Kills all Node processes that are NOT managed by PM2 AND NOT part of the IDE/Agent infrastructure.

echo "🧟 Scanning for Zombie Processes..."

# 1. Get List of PM2 PIDs (The "Living" - Infrastructure)
PM2_CMD="pm2"
if ! command -v pm2 &> /dev/null; then
    if [ -f "node_modules/.bin/pm2" ]; then
        PM2_CMD="./node_modules/.bin/pm2"
    else
        PM2_CMD="npx pm2"
    fi
fi

# Get PM2 PIDs nicely
PM2_PIDS=$($PM2_CMD jlist 2>/dev/null | grep -o '"pid":[^,]*' | awk -F: '{print $2}')
echo "🛡️  PM2 Protected PIDs: $PM2_PIDS"

# 2. Get IDE/Agent PIDs (The "Gods" - IDE, Agent, Extensions, LSP)
# We exclude anything running from .cursor-server, .antigravity-server, or vscode
# Also exclude the current script's PID and its parent
MY_PID=$$
MY_PPID=$PPID

echo "🛡️  Self Protection: PID=$MY_PID, PPID=$MY_PPID"

# 3. Find all Node PIDs
ALL_NODE_PIDS=$(pgrep -f "node")

KILLED_COUNT=0

for PID in $ALL_NODE_PIDS; do
    # SKIP Self and Parent
    if [[ "$PID" == "$MY_PID" ]] || [[ "$PID" == "$MY_PPID" ]]; then
        continue
    fi

    # SKIP PM2 Managed Processes
    if [[ $PM2_PIDS == *"$PID"* ]]; then
        echo "✅ Protected (PM2): $PID"
        continue
    fi

    # Get command line for inspection
    CMD=$(ps -p $PID -o args=)

    # SKIP Critical Infrastructure (Cursor, Antigravity, VSCode, Extension Host, Language Servers)
    if [[ "$CMD" == *".cursor-server"* ]] || \
       [[ "$CMD" == *".antigravity-server"* ]] || \
       [[ "$CMD" == *".vscode-server"* ]] || \
       [[ "$CMD" == *"extensionHost"* ]] || \
       [[ "$CMD" == *"geminicodeassist"* ]] || \
       [[ "$CMD" == *"typescript/lib/tsserver.js"* ]]; then
        echo "🛡️  Protected (IDE/Agent): $PID"
        continue
    fi

    # If we got here, it's a Zombie
    echo "💀 Killing Zombie: $PID"
    echo "   ↳ CMD: ${CMD:0:100}..." # Log first 100 chars of cmd
    kill -9 $PID
    ((KILLED_COUNT++))
done

echo "🎉 Total Zombies Slayed: $KILLED_COUNT"

# Only try to resurrect if we actually killed something or PM2 seems dead,
# otherwise we might restart things unnecessarily.
if [ "$KILLED_COUNT" -gt 0 ]; then
    echo "♻️  Ensuring System Integrity..."
    $PM2_CMD resurrect 2>/dev/null || $PM2_CMD start ecosystem.config.cjs
fi
