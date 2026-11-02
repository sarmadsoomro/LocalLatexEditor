# TexCraft

A local LaTeX editor. The UI runs in the browser. Compilation uses the LaTeX install on your machine. Documents are copied into app storage under `~/.latex-editor/projects` (override with `LATEX_EDITOR_PROJECTS_DIR`). Nothing in the app uploads them.

It works without internet. The editor (Monaco) and the fonts are bundled with the app, so the page makes no requests to other sites. Your LaTeX distribution may still download missing packages on its own if you configured it to (MiKTeX does by default).

Repository: [sarmadsoomro/LocalLatexEditor](https://github.com/sarmadsoomro/LocalLatexEditor). npm package name: `local-latex-editor`.

## What it does

- Monaco editor with LaTeX and BibTeX syntax highlighting, and a light/dark theme toggle
- PDF preview after a compile (PDF.js), with zoom
- Create a project from a template, or import by copying a folder or a zip into app storage
- File tree: create, upload, rename, move, and delete files inside a project
- Compile with `pdflatex`, `xelatex`, or `lualatex`. Optional auto-compile waits 2 seconds after a change and will not start again for 8 seconds
- Incremental builds: when `latexmk` is installed (it ships with TeX Live, MacTeX and MiKTeX), auxiliary files are kept between compiles and LaTeX, BibTeX and Biber only rerun when needed, so a one-line change in a long document recompiles quickly. Without `latexmk`, TexCraft runs the engine, then BibTeX/Biber if the document uses a bibliography, then the engine again
- **Compile ▾ → Clean build** deletes the auxiliary files and rebuilds from scratch. A compile that fails inside a stale `.aux` file is rebuilt from scratch automatically, once
- Compile timeout is a setting (default 300 s, up to 30 min) and covers the whole compile. On timeout, LaTeX and everything it started are stopped
- One compile per project at a time; changes made during a compile trigger one follow-up compile
- **Jump between source and PDF (SyncTeX).** Double-click the PDF (or Ctrl/Cmd+click) to open the file and line that produced it. **Show in PDF** in the toolbar, **Alt+J**, or right-click → Show in PDF in the editor jumps the other way and highlights the spot. Works across `\input`/`\include` files and pages, with every engine, without the `synctex` command-line tool
- Project status is `draft`, `in_progress`, or `published`. Trash, restore, and permanent delete
- Zip export of a project

## What it does not do

- No autocomplete provider
- No WebSocket. Compile status is ordinary HTTP polling
- Import does not edit the original folder. It copies
- No outline view
- Shell escape is off by default. Settings → Compiler → Shell escape passes `-shell-escape` (needed by `minted`); only enable it for documents you trust
- No accounts or multi-user access. The API trusts one per-launch token, and only the page the server hands to your browser has it

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
- API: http://127.0.0.1:3001

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

The backend listens on `127.0.0.1` only, so other machines on the same Wi-Fi cannot reach it.

- **Per-launch token.** On every start the backend creates a random token. Every `/api` request needs it in the `X-TexCraft-Token` header, otherwise the answer is `401`. `/health` is open. When the backend serves the built app it puts the token into `index.html`. With `pnpm dev`, the backend writes it to `~/.latex-editor/.session-token` and the Vite dev server puts it into the page. The token is not logged, not put in URLs, and not stored in localStorage. If the backend restarts, the token changes and the page shows "Server restarted - reload the page".
- **Host check.** Requests whose `Host` header is not `localhost:<port>` or `127.0.0.1:<port>` get `403`. This blocks DNS-rebinding from web pages. CORS allows only `http://localhost:3000`.
- **Zip import.** Entries are extracted one by one. The whole import is rejected if any entry is an absolute path, escapes the extract folder, or is a symlink, or if the zip has more than 5,000 entries or more than 500 MB of data. Upload and extraction temp files live under `~/.latex-editor/temp` and are removed afterwards.
- **`HOST` override.** Setting `HOST` (for example `HOST=0.0.0.0`) makes the backend listen on that address instead of `127.0.0.1`. It logs a loud warning. The token and Host check still apply, so other machines get `401`/`403`, but the port is then open to the network and you lose the network-level protection. Do not set it on shared Wi-Fi.
- **Windows.** The token file is created with mode `0600`, which Windows does not enforce. The file is in your user profile folder, which by default only your user can read.

Compilation uses `spawn` with `shell: false` and does not pass `-shell-escape` unless you turn on the Shell escape setting. That is not a sandbox. LaTeX still runs as your user and can read files you can read.

## Docs

Current behavior: this file, and [docs/api-and-internal-contracts.md](docs/api-and-internal-contracts.md).

April 2026 plans and the requirements draft are not a description of this build. See [docs/README.md](docs/README.md).
