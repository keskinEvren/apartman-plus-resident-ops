#!/bin/bash
# ASANMOD v1.0.0: One-Command Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/masan3134/asanmod-enterprise/main/install.sh | bash

set -e

PROJECT_NAME="${1:-my-app}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 ASANMOD v1.0.0: Enterprise Template Installer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Prerequisite checks
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version too old: $NODE_VERSION${NC}"
    echo "Please upgrade to Node.js 20+"
    exit 1
fi
echo -e "${GREEN}✅ Node.js v$(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm v$(npm -v)${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not found${NC}"
    echo "Please install git"
    exit 1
fi
echo -e "${GREEN}✅ git v$(git --version | cut -d' ' -f3)${NC}"

echo ""

# Clone repository with tag pin
echo -e "${YELLOW}📦 Cloning template...${NC}"
git clone --depth 1 --branch main https://github.com/masan3134/asanmod-enterprise.git "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Run wizard
echo ""
echo -e "${YELLOW}🧙 Running setup wizard...${NC}"
npm run wizard

# Success
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ASANMOD Template installed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📂 Project location: $(pwd)"
echo ""
echo "📋 Next steps:"
echo "   1. cd $PROJECT_NAME"
echo "   2. Update .env with your DATABASE_URL"
echo "   3. npm run db:push"
echo "   4. npm run seed (optional)"
echo "   5. npm run dev"
echo ""
echo "📚 Documentation: README.md & docs/GETTING_STARTED.md"
echo "🤖 Agent Protocol: GEMINI.md (or CURSOR.md / CLAUDE.md)"
echo ""
echo "🎯 ASANMOD v1.0.0 - Production Ready"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
