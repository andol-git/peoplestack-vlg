#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  PeopleStack — Auto Setup Script (Mac / Linux)
#  Run this script ONCE after extracting the ZIP
#  Usage: chmod +x setup.sh && ./setup.sh
# ═══════════════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   PeopleStack — Auto Setup Script     ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Get directory of THIS script (the extracted ZIP folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ── Step 1: Check Node ──────────────────────────────────────
echo -e "${YELLOW}▶ Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}  ✗ Node.js not found! Install from https://nodejs.org (LTS)${NC}"
    exit 1
fi
NODE_VER=$(node --version)
echo -e "${GREEN}  ✓ Node.js found: $NODE_VER${NC}"

# ── Step 2: Install global tools ───────────────────────────
echo ""
echo -e "${YELLOW}▶ Installing NX CLI and Angular CLI globally...${NC}"
npm install -g nx@latest @angular/cli@latest
echo -e "${GREEN}  ✓ Global tools installed${NC}"

# ── Step 3: Create NX workspace ────────────────────────────
echo ""
echo -e "${YELLOW}▶ Creating NX workspace 'peopleStack'...${NC}"
cd ..
npx create-nx-workspace@latest peopleStack \
  --preset=angular-monorepo \
  --appName=shell \
  --style=css \
  --nxCloud=skip \
  --routing=true \
  --bundler=esbuild \
  --ssr=false
echo -e "${GREEN}  ✓ Workspace created${NC}"

# ── Step 4: Enter workspace ─────────────────────────────────
cd peopleStack

# ── Step 5: Install dependencies ────────────────────────────
echo ""
echo -e "${YELLOW}▶ Installing project dependencies...${NC}"
npm install jwt-decode
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# ── Step 6: Copy our source files ───────────────────────────
echo ""
echo -e "${YELLOW}▶ Copying PeopleStack source files...${NC}"

SRC="$SCRIPT_DIR"

# Root config files
cp "$SRC/tailwind.config.js" .
cp "$SRC/tsconfig.base.json" .
cp "$SRC/angular.json"       .
cp "$SRC/nx.json"            .

# App source files
APP="apps/shell/src"
cp "$SRC/apps/shell/src/main.ts"    "$APP/main.ts"
cp "$SRC/apps/shell/src/index.html" "$APP/index.html"
cp "$SRC/apps/shell/src/styles.css" "$APP/styles.css"

# App folder — components, routes, config
rm -rf "$APP/app"
cp -r "$SRC/apps/shell/src/app" "$APP/app"

# Environments
rm -rf "$APP/environments"
cp -r "$SRC/apps/shell/src/environments" "$APP/environments"

# tsconfig files
cp "$SRC/apps/shell/tsconfig.json"     "apps/shell/tsconfig.json"
cp "$SRC/apps/shell/tsconfig.app.json" "apps/shell/tsconfig.app.json"

# Libs — shared models + data-access
rm -rf libs
cp -r "$SRC/libs" libs

echo -e "${GREEN}  ✓ Source files copied${NC}"

# ── Step 7: Done! ────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ PeopleStack setup complete!                    ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  Make sure your Spring Boot backend is running    ║${NC}"
echo -e "${GREEN}║  on http://localhost:8080, then run:              ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║     nx serve shell                                ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  Open browser → http://localhost:4200             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
