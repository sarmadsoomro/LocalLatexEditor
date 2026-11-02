# TexCraft

A LaTeX editor that runs on your own computer. Write in a code editor, compile with the LaTeX installed on your machine, and see the PDF beside your source, without an account, an upload, or an internet connection.

Made for students writing assignments, papers and theses, including journal templates such as IEEE and Elsevier.

**[Download](https://github.com/sarmadsoomro/TexCraft/releases)** · [Installation](docs/installation.md) · [User guide](docs/user-guide.md) · [Troubleshooting](docs/troubleshooting.md) · [Contributing](CONTRIBUTING.md)

## Features

- **Editor**: Monaco (the editor in VS Code) with LaTeX and BibTeX highlighting, tabs, find and replace, light and dark themes.
- **Compile** with `pdflatex`, `xelatex` or `lualatex`. BibTeX and Biber run when needed. With `latexmk` (included in MacTeX, MiKTeX and TeX Live), recompiles only redo what changed, so long documents stay fast. Optional auto-compile on save.
- **PDF preview** beside the source, with zoom and page navigation, and **Save PDF**.
- **Jump between source and PDF** (SyncTeX): Alt+J shows the cursor's line in the PDF; double-click the PDF to go back to the source. Works across `\input` and `\include`.
- **Errors you can act on**: each error shows its file and line; click it to go there.
- **Projects**: start from a template (article, report, book, Beamer, letter), or import a folder or a `.zip` (an Overleaf download, a journal template). Choose which `.tex` file is the main file.
- **Files**: create, upload, rename and delete files and folders.
- **Organise**: search, status (draft, in progress, published), recently opened, trash with restore.
- **Export** a project as a `.zip`.
- **Private**: documents stay on your computer. The app makes no requests to other sites.

## Get started

1. Install a LaTeX distribution: [MacTeX](https://www.tug.org/mactex/) (macOS), [MiKTeX](https://miktex.org/download) (Windows) or TeX Live (Linux).
2. Download TexCraft from the [Releases page](https://github.com/sarmadsoomro/TexCraft/releases): `.dmg` for macOS, `.exe` for Windows, `.AppImage` for Linux.
3. Open it, create a project, press **Compile**.

The installers are not code-signed yet, so the first launch needs one extra step. The [installation guide](docs/installation.md) covers it for each OS, along with picking the right download and installing LaTeX.

### Run from source

Needs Node.js 20.19+, pnpm 8+, Git and a LaTeX distribution.

```bash
git clone https://github.com/sarmadsoomro/TexCraft.git
cd TexCraft
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm desktop` runs the desktop app from source instead. See [CONTRIBUTING.md](CONTRIBUTING.md) for the rest.

## Not yet

- No autocomplete or outline view
- No bundled LaTeX: install a distribution yourself
- No automatic updates for the desktop app: download new versions from the Releases page
- Moving files between folders works through the API, not yet in the file tree
- No real-time collaboration or cloud sync

## Documentation

| For | Read |
| --- | --- |
| Installing TexCraft and LaTeX | [docs/installation.md](docs/installation.md) |
| Using the app | [docs/user-guide.md](docs/user-guide.md) |
| Fixing problems | [docs/troubleshooting.md](docs/troubleshooting.md) |
| How the desktop app is built and released | [docs/desktop-app.md](docs/desktop-app.md) |
| The HTTP API | [docs/api-and-internal-contracts.md](docs/api-and-internal-contracts.md) |
| Contributing code | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Security model and reporting vulnerabilities | [SECURITY.md](SECURITY.md) |
| What changed | [CHANGELOG.md](CHANGELOG.md) |

Everything in `docs/`: [docs/README.md](docs/README.md).

## Privacy and security

TexCraft listens only on `127.0.0.1`, so other computers cannot reach it, and every API request needs a token created at launch. Imported zips are checked before extraction. LaTeX runs as your user with shell escape off unless you turn it on. Details in [SECURITY.md](SECURITY.md).

## Support TexCraft

TexCraft is free and open source, built in spare time. The installers are not code-signed yet, which is why macOS, Windows and Chrome warn when you download them. Signing costs money every year: USD 99 for an Apple Developer ID, and more for Windows.

If TexCraft helps you, [sponsor it on GitHub](https://github.com/sponsors/sarmadsoomro). The first goal is the Apple Developer ID, which removes the macOS security warning for every student. Starring the repository and telling classmates also helps.

## License

[MIT](LICENSE). The repository is [sarmadsoomro/TexCraft](https://github.com/sarmadsoomro/TexCraft); the npm workspace name is `local-latex-editor`.
