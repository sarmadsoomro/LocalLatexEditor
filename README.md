# Local LaTeX Editor

A lightweight, browser-based LaTeX editing environment that runs entirely on your local machine.

## Overview

Local LaTeX Editor provides a modern, responsive LaTeX editing experience similar to Overleaf, but with the privacy and speed of local execution. Edit LaTeX documents in your browser, compile locally to PDF, and preview results instantly — all without internet connectivity or cloud dependency.

## Features (Planned)

- **Browser-based Editing**: Monaco Editor with LaTeX syntax highlighting
- **Local Compilation**: Compile to PDF using your system's LaTeX distribution
- **Live Preview**: Real-time PDF preview with auto-refresh
- **Project Management**: Create, open, and import LaTeX projects
- **Multi-file Support**: Edit `.tex`, `.bib`, `.cls`, `.sty` files and more
- **Offline-First**: Works entirely on localhost without internet

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Backend**: Node.js + Express + TypeScript
- **PDF**: PDF.js (react-pdf)
- **State**: Zustand
- **Monorepo**: Turborepo + pnpm

## Prerequisites

- Node.js 18+ and pnpm 8+
- LaTeX distribution (TeX Live, MiKTeX, or MacTeX)

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Servers

```bash
pnpm dev
```

This starts:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

### 3. Build for Production

```bash
pnpm build
```

## Project Structure

```
local-latex-editor/
├── apps/
│   ├── frontend/          # React + Vite frontend
│   └── backend/           # Express backend API
├── packages/
│   └── shared-types/      # Shared TypeScript definitions
├── tooling/
│   ├── eslint-config/     # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
├── *.md                   # Documentation
└── package.json           # Root monorepo config
```

## Development

### Available Commands

```bash
# Start all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck

# Run tests
pnpm test
```

### Working with Packages

```bash
# Add dependency to frontend
cd apps/frontend
pnpm add <package>

# Add dependency to backend
cd apps/backend
pnpm add <package>

# Add shared dependency
pnpm add -w <package>
```

## Documentation

- [Product Overview](./product-overview.md)
- [Software Requirements Specification](./software-requirements-specification.md)
- [System Architecture](./system-architecture.md)
- [Project Structure](./project-structure.md)
- [Tools and Technology](./tools-and-technology.md)
- [API Contracts](./api-and-internal-contracts.md)
- [Risks and Assumptions](./risks-and-assumptions.md)

### Implementation Phases

1. [Phase 1: Foundation and Setup](./phase-1-foundation-and-setup.md) ✅
2. [Phase 2: Project Management](./phase-2-project-management.md)
3. [Phase 3: Browser Editing](./phase-3-browser-editing.md)
4. [Phase 4: Local Compilation](./phase-4-local-compilation.md)
5. [Phase 5: PDF Preview](./phase-5-pdf-preview.md)
6. [Phase 6: Stability and Hardening](./phase-6-stability-hardening.md)
7. [Phase 7: Post-MVP Enhancements](./phase-7-post-mvp-enhancements.md)

## License

MIT
