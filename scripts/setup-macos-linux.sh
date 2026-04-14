#!/bin/bash

# =============================================================================
# Local LaTeX Editor - macOS/Linux Setup Script
# =============================================================================
# This script checks prerequisites and sets up the development environment
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/sarmadsoomro/LocalLatexEditor.git"
PROJECT_NAME="LocalLatexEditor"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# =============================================================================
# Check Prerequisites
# =============================================================================

check_prerequisites() {
    print_header "Step 1: Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        print_success "Git installed: $GIT_VERSION"
    else
        print_error "Git not found"
        missing_deps+=("git")
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_success "Node.js installed: $NODE_VERSION"
        else
            print_warning "Node.js $NODE_VERSION found, but version 18+ is recommended"
            missing_deps+=("nodejs-upgrade")
        fi
    else
        print_error "Node.js not found"
        missing_deps+=("nodejs")
    fi
    
    # Check pnpm
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm installed: $PNPM_VERSION"
    else
        print_error "pnpm not found"
        missing_deps+=("pnpm")
    fi
    
    # Check LaTeX
    if command_exists pdflatex || command_exists xelatex || command_exists lualatex; then
        print_success "LaTeX appears to be installed"
        if command_exists pdflatex; then
            PDFLATEX_VERSION=$(pdflatex --version | head -1)
            print_info "  Found: $PDFLATEX_VERSION"
        fi
    else
        print_error "LaTeX not found"
        missing_deps+=("latex")
    fi
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        print_success "All prerequisites met!"
        return 0
    else
        echo ""
        print_warning "Missing dependencies detected: ${missing_deps[*]}"
        return 1
    fi
}

# =============================================================================
# Install Missing Dependencies
# =============================================================================

install_dependencies() {
    print_header "Step 2: Installing Missing Dependencies"
    
    local install_cmd=""
    
    # Detect package manager
    if command_exists brew; then
        install_cmd="brew install"
        print_info "Using Homebrew for installation"
    elif command_exists apt-get; then
        install_cmd="sudo apt-get install -y"
        print_info "Using apt-get for installation"
    elif command_exists yum; then
        install_cmd="sudo yum install -y"
        print_info "Using yum for installation"
    elif command_exists pacman; then
        install_cmd="sudo pacman -S --noconfirm"
        print_info "Using pacman for installation"
    else
        print_error "No supported package manager found"
        print_info "Please install missing dependencies manually"
        return 1
    fi
    
    # Install Git if missing
    if ! command_exists git; then
        print_info "Installing Git..."
        $install_cmd git
        print_success "Git installed!"
    fi
    
    # Install Node.js if missing
    if ! command_exists node; then
        print_info "Installing Node.js..."
        if command_exists brew; then
            $install_cmd node
        elif command_exists apt-get; then
            # Node.js 18+ from NodeSource
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            $install_cmd nodejs
        else
            print_warning "Please install Node.js 18+ manually from https://nodejs.org"
            return 1
        fi
        print_success "Node.js installed!"
    fi
    
    # Install pnpm if missing
    if ! command_exists pnpm; then
        print_info "Installing pnpm..."
        npm install -g pnpm
        print_success "pnpm installed!"
    fi
    
    # LaTeX installation guide
    if ! command_exists pdflatex; then
        echo ""
        print_warning "LaTeX installation requires manual steps due to size (~4GB)"
        echo ""
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  macOS: Install MacTeX from https://www.tug.org/mactex/"
            echo "         Or run: brew install --cask mactex"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  Linux: sudo apt-get install texlive-full"
            echo "         (This will take a while!)"
        fi
        echo ""
        read -p "Have you installed LaTeX? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Please install LaTeX and run this script again"
            exit 1
        fi
    fi
    
    return 0
}

# =============================================================================
# Clone Repository
# =============================================================================

clone_repository() {
    print_header "Step 3: Cloning Repository"
    
    if [ -d "$PROJECT_NAME" ]; then
        print_warning "Directory '$PROJECT_NAME' already exists"
        read -p "Do you want to use the existing directory? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd "$PROJECT_NAME"
            print_success "Using existing directory"
            return 0
        else
            print_error "Please remove or rename the existing directory first"
            exit 1
        fi
    fi
    
    print_info "Cloning from $REPO_URL..."
    git clone "$REPO_URL"
    cd "$PROJECT_NAME"
    print_success "Repository cloned!"
}

# =============================================================================
# Install Project Dependencies
# =============================================================================

install_project_deps() {
    print_header "Step 4: Installing Project Dependencies"
    
    print_info "Running pnpm install..."
    pnpm install
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed!"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# =============================================================================
# Setup Complete
# =============================================================================

show_completion() {
    print_header "Setup Complete!"
    
    echo -e "${GREEN}Your LaTeX Editor is ready to use!${NC}"
    echo ""
    echo "To start the editor, run:"
    echo -e "${BLUE}  cd $PROJECT_NAME${NC}"
    echo -e "${BLUE}  pnpm dev${NC}"
    echo ""
    echo "Then open your browser to: ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Run 'pnpm dev' to start the development server"
    echo "  2. Read CONTRIBUTING.md for development guidelines"
    echo ""
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    print_header "Local LaTeX Editor Setup"
    echo "This script will set up your development environment"
    echo ""
    
    # Check if we should skip cloning (already in the repo)
    if [ -f "package.json" ] && [ -d "apps" ]; then
        print_info "Already in the project directory"
        SKIP_CLONE=true
    fi
    
    # Run checks
    if ! check_prerequisites; then
        install_dependencies
        # Re-check after installation
        if ! check_prerequisites; then
            print_error "Some prerequisites are still missing"
            print_info "Please install them manually and try again"
            exit 1
        fi
    fi
    
    # Clone repo if not already in it
    if [ -z "$SKIP_CLONE" ]; then
        clone_repository
    fi
    
    # Install project dependencies
    install_project_deps
    
    # Show completion message
    show_completion
}

# Run main function
main
