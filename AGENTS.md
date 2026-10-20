# TexCraft

**Updated:** 20 October 2026
**Repo:** LocalLatexEditor
**Package:** `local-latex-editor`

Browser UI for local LaTeX editing. React + Vite on port 3000, Express on port 3001, Monaco, PDF.js, Zustand, Turborepo, pnpm.

Current behavior is the code, [README.md](README.md), and [docs/api-and-internal-contracts.md](docs/api-and-internal-contracts.md). Phase docs, the SRS, and `docs/system-architecture.md` are April 2026 plans. Do not implement from them without checking the code.

## Where to look

| Task | Location |
| --- | --- |
| Frontend | `apps/frontend/` |
| Backend routes | `apps/backend/src/routes/` |
| Compile spawn | `apps/backend/src/services/compilationService.ts` |
| Project storage | `apps/backend/src/config/storage.ts` (`~/.latex-editor/projects`) |
| Shared types | `packages/shared-types/` |
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
- New listeners must bind to `127.0.0.1`. `app.listen(PORT)` in `apps/backend/src/index.ts` currently does not. Do not copy that.

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
- The settings `shellEscape` flag is honored. The compiler ignores it.
- `AGENTS.md` status from April 2026. Project management, trash, compile, preview, rename, and zip export are already in the tree.
