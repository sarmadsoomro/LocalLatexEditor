# TexCraft

A local LaTeX editor. The UI runs in the browser. Compilation uses the LaTeX install on your machine. Documents are copied into app storage under `~/.latex-editor/projects` (override with `LATEX_EDITOR_PROJECTS_DIR`). Nothing in the app uploads them.

Repository: [sarmadsoomro/LocalLatexEditor](https://github.com/sarmadsoomro/LocalLatexEditor). npm package name: `local-latex-editor`.

## What it does

- Monaco editor with LaTeX and BibTeX syntax highlighting, and a light/dark theme toggle
- PDF preview after a compile (PDF.js), with zoom
- Create a project from a template, or import by copying a folder or a zip into app storage
- File tree: create, upload, rename, move, and delete files inside a project
- Compile with `pdflatex`, `xelatex`, or `lualatex`. Optional auto-compile waits 2 seconds after a change and will not start again for 8 seconds
- Project status is `draft`, `in_progress`, or `published`. Trash, restore, and permanent delete
- Zip export of a project

## What it does not do

- No autocomplete provider
- No WebSocket. Compile status is ordinary HTTP polling
- Import does not edit the original folder. It copies
- No outline view, and no "compile only the files that changed"
- The compiler never passes `-shell-escape`. The settings toggle for shell escape does not reach the compiler
- The API is not authenticated, and it is not bound to `127.0.0.1`

## Requirements

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- Git
- A LaTeX install that provides `pdflatex`, `xelatex`, or `lualatex` (`pdflatex --version` should work)
- A current Chrome, Firefox, Safari, or Edge

## Run it

```bash
git clone https://github.com/sarmadsoomro/LocalLatexEditor.git
cd LocalLatexEditor
pnpm install
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

Stop it with Ctrl+C in that terminal.

`scripts/setup-macos-linux.sh`, `scripts/setup-windows.bat`, `scripts/start.sh`, and `scripts/start.bat` are in the repo. Read `scripts/README.md` before piping a setup script into a shell.

## Development

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test          # Vitest, where a package defines tests
pnpm test:unit
```

`pnpm test:e2e` is wired to Playwright in the frontend package. There are no Playwright specs in the repo.

```
LatexEditor/
├── apps/frontend/          # React + Vite, port 3000
├── apps/backend/           # Express, port 3001
├── packages/shared-types/
├── tooling/
├── scripts/
└── docs/                   # current docs vs old plans: docs/README.md
```

## Security

The backend calls `app.listen(PORT)` with no host, so port 3001 is reachable on every interface of the machine, not only localhost. There is no authentication. Do not expose this process to a network you do not trust.

Compilation uses `spawn` with `shell: false` and does not pass `-shell-escape`. That is not a sandbox. LaTeX still runs as your user and can read files you can read.

## Docs

Current behavior: this file, and [docs/api-and-internal-contracts.md](docs/api-and-internal-contracts.md).

April 2026 plans and the requirements draft are not a description of this build. See [docs/README.md](docs/README.md).

There is no `LICENSE` file in the repo.
