# PROJECT KNOWLEDGE BASE: Local LaTeX Editor

**Generated:** April 8, 2026
**Updated:** April 8, 2026
**Type:** Full-Stack Application
**Status:** Phase 2 In Progress (Project Management features)

**Quick Reference:** See `.project-memory.md` for current progress

---

## OVERVIEW

Local LaTeX Editor — browser-based LaTeX editing with local PDF compilation. Runs entirely on localhost without cloud dependency.

**Stack:** React 18 + Vite (frontend), Express + TypeScript (backend), Monaco Editor, PDF.js, Zustand, Turborepo + pnpm.

---

## STRUCTURE

```
LatexEditor/
├── apps/
│   ├── frontend/            # React + Vite (port 3000)
│   └── backend/             # Express API (port 3001)
├── packages/
│   └── shared-types/        # Shared TypeScript types
├── tooling/
│   ├── eslint-config/       # Shared ESLint configs
│   └── typescript-config/   # Shared TS configs
├── docs/                    # 14 documentation files
├── package.json             # Root monorepo config
├── turbo.json               # Turborepo pipeline
└── AGENTS.md                # This file
```

---

## WHERE TO LOOK

| Task              | Location                                      | Notes                                |
| ----------------- | --------------------------------------------- | ------------------------------------ |
| Frontend code     | `apps/frontend/`                              | React + Vite + Zustand stores        |
| Backend API       | `apps/backend/`                               | Express routes, services, middleware |
| Shared types      | `packages/shared-types/`                      | Project, File, Compilation types     |
| Requirements      | `docs/software-requirements-specification.md` | 150+ FR/NFR/SEC requirements         |
| Architecture      | `docs/system-architecture.md`                 | Compilation pipeline diagrams        |
| API contracts     | `docs/api-and-internal-contracts.md`          | 16 endpoints                         |
| Progress tracking | `.project-memory.md`                          | Current phase status                 |

---

## CONVENTIONS

### Naming

| Element          | Convention | Example               |
| ---------------- | ---------- | --------------------- |
| Folders          | kebab-case | `project-management/` |
| React components | PascalCase | `ProjectList.tsx`     |
| Files            | camelCase  | `useProjects.ts`      |
| Tests            | `.test.ts` | `Button.test.tsx`     |

### Module Boundaries

```
Features → Cannot import from Pages, other Features
Components → Cannot import from Features, Pages, Services
Services → Cannot import from Components, Features, Pages
Utils → Cannot import from Components, Services, Features
Types → Cannot import from anything
```

### Security

- Bind to localhost only (127.0.0.1)
- LaTeX compilation: user-level privileges only
- User documents never leave local machine

---

## ANTI-PATTERNS

1. **No deep imports** — Import from feature root, not internals
2. **No cross-feature imports** — Features are isolated
3. **No string path concat** — Use `path.join()` always
4. **No shell: true** — In child_process spawn calls
5. **No write18** — LaTeX shell escape disabled
6. **No Table of Contents** — In documentation files

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
