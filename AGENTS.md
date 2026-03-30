# PROJECT KNOWLEDGE BASE: Local LaTeX Editor

**Generated:** March 30, 2026
**Updated:** March 30, 2026
**Type:** Full-Stack Application
**Status:** Phase 1 Complete (Foundation and Setup implemented)

**Quick Reference:** See `.project-memory.md` for current progress and next steps

---

## OVERVIEW

This repository contains a local LaTeX editor application with complete planning documentation and implementation. **Phase 1 is complete** — the monorepo structure is scaffolded with React + Vite frontend, Express backend, and shared packages. The project follows a 7-phase implementation roadmap defined in the documentation.

**Stack:** React + TypeScript frontend, Node.js/Express backend, Monaco Editor, PDF.js, Turborepo monorepo.

---

## STRUCTURE

```
LatexEditor/
├── apps/
│   ├── frontend/            # React + Vite (localhost:3000)
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/             # Express API (localhost:3001)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared-types/        # Shared TypeScript definitions
│       ├── src/
│       └── package.json
├── tooling/
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Shared TS configurations
├── docs/
│   ├── product-overview.md
│   ├── software-requirements-specification.md
│   ├── system-architecture.md
│   ├── project-structure.md
│   ├── tools-and-technology.md
│   ├── api-and-internal-contracts.md
│   ├── risks-and-assumptions.md
│   └── phase-*.md (1-7)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── README.md
├── AGENTS.md
└── .project-memory.md
```

---

## WHERE TO LOOK

| Task | Document | Notes |
|------|----------|-------|
| Understand requirements | `docs/software-requirements-specification.md` | 150+ numbered requirements (FR-, NFR-, SEC-, PERF-) |
| View architecture | `docs/system-architecture.md` | ASCII diagrams, compilation pipeline |
| Check tech decisions | `docs/tools-and-technology.md` | Comparison tables, rationale |
| See API design | `docs/api-and-internal-contracts.md` | 16 endpoints, JSON examples |
| Review risks | `docs/risks-and-assumptions.md` | 25 risks with mitigation |
| Plan implementation | `docs/phase-*.md` (1-7) | Phase-by-phase breakdowns |
| Check progress | `.project-memory.md` | Current status and next steps |

---

## CONVENTIONS

### Document Organization
- All documentation organized in `docs/` directory
- Phase documents numbered sequentially (1-7)
- Shared naming: kebab-case filenames

### Naming Conventions (Planned for Code)
| Element | Convention | Example |
|---------|------------|---------|
| Folders | kebab-case | `project-management/` |
| React components | PascalCase | `ProjectList.tsx` |
| Files | camelCase | `useProjects.ts` |
| Tests | `.test.ts` or `.spec.ts` | `Button.test.tsx` |

### Import Rules (Module Boundaries)
```
Features → Cannot import from Pages, other Features
Components → Cannot import from Features, Pages, Services
Services → Cannot import from Components, Features, Pages
Utils → Cannot import from Components, Services, Features
Types → Cannot import from anything
```

### Security Rules
- Bind to localhost only (127.0.0.1) — never expose to network
- LaTeX compilation runs with user-level privileges only
- User documents never leave local machine

---

## ANTI-PATTERNS (THIS PROJECT)

### For Implementation Phase
1. **Deep imports prohibited** — Never import from feature internals
2. **Feature cross-imports banned** — No importing between features
3. **Path construction** — Always use Node.js `path` module, never string concatenation
4. **No shell execution** — Never use `shell: true` in child_process
5. **No write18** — Disable LaTeX `\write18` for security

### For Documentation
1. **No Table of Contents** — Large docs lack navigation

---

## COMMANDS

```bash
# Development
pnpm install          # Install all dependencies
pnpm dev              # Start frontend (localhost:3000) and backend (localhost:3001)

# Building
pnpm build            # Build all apps and packages

# Code Quality
pnpm lint             # Run ESLint on all packages
pnpm format           # Format code with Prettier
pnpm typecheck        # Run TypeScript type checking

# Testing (when implemented)
pnpm test:unit        # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
```

---

## NOTES

### Critical Context
- **Phase 1 Complete** — Monorepo scaffolded with apps/frontend, apps/backend, packages/shared-types
- **Source code exists** — React frontend and Express backend implemented
- **Documentation organized** — All docs now in `docs/` directory per project standards
- **Ready for Phase 2** — Project Management features

### Project Structure Created
- `apps/frontend/` — React + Vite + TypeScript (port 3000)
- `apps/backend/` — Express + TypeScript (port 3001)
- `packages/shared-types/` — Shared TypeScript definitions
- `tooling/eslint-config/` — Shared ESLint configurations
- `tooling/typescript-config/` — Shared TS configurations
- `docs/` — All project documentation

### Next Steps
1. Run `pnpm install` to install dependencies
2. Run `pnpm dev` to verify both servers start
3. Begin Phase 2: Project Management features
4. See `.project-memory.md` for detailed progress tracking
