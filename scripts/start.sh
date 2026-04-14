#!/bin/bash

# =============================================================================
# Local LaTeX Editor - Quick Start Script
# =============================================================================
# Run this after setup to quickly start the development server
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${GREEN}Starting Local LaTeX Editor...${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${YELLOW}Not in project directory. Looking for it...${NC}"
    
    # Try to find the project
    if [ -d "LocalLatexEditor" ]; then
        cd LocalLatexEditor
        echo -e "${GREEN}Found and entered LocalLatexEditor/${NC}"
    elif [ -d "../LocalLatexEditor" ]; then
        cd ../LocalLatexEditor
        echo -e "${GREEN}Found and entered LocalLatexEditor/${NC}"
    else
        echo -e "${YELLOW}Please run this script from the project directory${NC}"
        echo "Or make sure LocalLatexEditor/ exists"
        exit 1
    fi
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Dependencies not found. Installing...${NC}"
    pnpm install
fi

echo ""
echo -e "${BLUE}Starting development server...${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Start the dev server
pnpm dev
