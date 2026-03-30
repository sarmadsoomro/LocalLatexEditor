# PROJECT KNOWLEDGE BASE: Local LaTeX Editor

**Generated:** March 30, 2026
**Type:** Documentation/Planning Repository
**Status:** Pre-implementation (Phases 1-7 defined, no source code)

---

## OVERVIEW

This repository contains the complete planning documentation for a local LaTeX editor application. **No source code exists yet** — this is a specification-first project with 14 markdown documents defining architecture, requirements, and a 7-phase implementation roadmap.

**Planned Stack:** React + TypeScript frontend, Node.js/Express backend, Monaco Editor, PDF.js, Turborepo monorepo.

---

## STRUCTURE

```
LatexEditor/                 # Root (all docs here)
├── product-overview.md      # Vision, goals, MVP vs future scope
├── software-requirements-specification.md  # 150+ numbered requirements
├── system-architecture.md   # Architecture diagrams, component breakdown
├── project-structure.md     # Monorepo folder conventions
├── tools-and-technology.md  # Tech stack decisions with comparisons
├── api-and-internal-contracts.md  # REST API specs, JSON examples
├── risks-and-assumptions.md # Risk register, mitigation strategies
├── phase-1-foundation-and-setup.md      # Repo setup, scaffolding
├── phase-2-project-management.md        # Create/open/import projects
├── phase-3-browser-editing.md           # Monaco Editor integration
├── phase-4-local-compilation.md         # LaTeX compilation service
├── phase-5-pdf-preview.md               # PDF.js preview
├── phase-6-stability-hardening.md       # MVP hardening
├── phase-7-post-mvp-enhancements.md     # Autosave, Git, SyncTeX
└── .opencode/               # OpenCode tooling (not project code)
```

---

## WHERE TO LOOK

| Task | Document | Notes |
|------|----------|-------|
| Understand requirements | `software-requirements-specification.md` | 150+ numbered requirements (FR-, NFR-, SEC-, PERF-) |
| View architecture | `system-architecture.md` | ASCII diagrams, compilation pipeline |
| Check tech decisions | `tools-and-technology.md` | Comparison tables, rationale |
| See API design | `api-and-internal-contracts.md` | 16 endpoints, JSON examples |
| Review risks | `risks-and-assumptions.md` | 25 risks with mitigation |
| Plan implementation | `phase-*.md` (1-7) | Phase-by-phase breakdowns |

---

## CONVENTIONS

### Document Organization
- All docs at root level (violates own `project-structure.md` standard — should be in `docs/`)
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
1. **Docs at root** — Current docs violate own standard (should be in `docs/`)
2. **No Table of Contents** — Large docs lack navigation

---

## COMMANDS

No commands available — this is documentation only. When implemented:

```bash
# Planned commands (Phase 1+)
pnpm install          # Install dependencies
pnpm dev              # Start dev servers
pnpm build            # Build for production
pnpm test:unit        # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
```

---

## NOTES

### Critical Context
- **No source code exists** — This is planning documentation only
- **Intended structure:** Turborepo monorepo with `apps/frontend`, `apps/backend`, `packages/shared-types`
- **Phase 1** defines the foundation setup that creates the actual code structure

### When Implementing
1. Start with `phase-1-foundation-and-setup.md`
2. Create `apps/` and `packages/` directories per `project-structure.md`
3. Follow `tools-and-technology.md` for exact versions and configs
4. Enforce import rules via ESLint `import/no-restricted-paths`

### Current State
- 14 markdown files, 8,443 lines
- 7 phase documents define implementation roadmap
- Flat structure (max depth: 2)
- `.opencode/` folder contains OpenCode agent tooling (not project code)
