# TexCraft

**Updated:** 2 November 2026
**Repo:** TexCraft (renamed from LocalLatexEditor)
**Package:** `local-latex-editor`

Local LaTeX editor: a browser UI (React + Vite on port 3000, Express on port 3001) and an Electron desktop app around the same backend. Monaco, PDF.js, Zustand, Turborepo, pnpm.

Current behavior is the code, [README.md](README.md), [docs/api-and-internal-contracts.md](docs/api-and-internal-contracts.md) and the user docs in `docs/` ([index](docs/README.md)). `docs/archive/` holds the April 2026 plans, SRS and architecture draft. Do not implement from them without checking the code.

When behavior changes, update [docs/user-guide.md](docs/user-guide.md), the API contracts, and `CHANGELOG.md` (Unreleased) in the same change. Contributor workflow: [CONTRIBUTING.md](CONTRIBUTING.md).

## Where to look

| Task | Location |
| --- | --- |
| Frontend | `apps/frontend/` |
| Backend routes | `apps/backend/src/routes/` |
| Compile spawn | `apps/backend/src/services/compilationService.ts` |
| Project storage | `apps/backend/src/config/storage.ts` (`~/.latex-editor/projects`) |
| Shared types | `packages/shared-types/` (ESM: relative imports need `.js`) |
| Desktop app (Electron) | `apps/desktop/`, `docs/desktop-app.md` |
| API that exists | `docs/api-and-internal-contracts.md` |

## Conventions

| Element | Convention | Example |
| --- | --- | --- |
| Folders | kebab-case | `project-management/` |
| React components | PascalCase | `ProjectList.tsx` |
| Files | camelCase | `useProjects.ts` |
| Tests | `.test.ts` | `Button.test.tsx` |

- Do not concatenate paths. Use `path.join()`.
- Do not pass `shell: true` to `spawn`.
- Do not pass `-shell-escape` unless the task is explicitly to wire the existing settings toggle, and then keep the default off.
- Listeners bind to `127.0.0.1`. Do not call `listen` without that host.

## Commands

```bash
pnpm install
pnpm dev          # localhost:3000 and :3001
pnpm build
pnpm lint
pnpm typecheck
pnpm test:unit    # Vitest
```

`pnpm test:e2e` runs Playwright. No specs are in the repo.

## Do not assume

- WebSockets exist. They do not.
- Import writes back to the user's original folder. It copies.
- The compiler always uses latexmk. It falls back to manual passes when latexmk is missing (`TEXCRAFT_DISABLE_LATEXMK=1` forces this in tests).
- `AGENTS.md` status from April 2026. Project management, trash, compile, preview, rename, and zip export are already in the tree.
