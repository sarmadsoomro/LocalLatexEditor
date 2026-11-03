# Changelog

Notable changes to TexCraft. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

Nothing yet.

## 0.3.1 (2026-11-03)

A security fix for the desktop app. Everyone on 0.3.0 should update.

### Security

- **Desktop app: the API token is no longer in the page.** Before, anything that could connect to `127.0.0.1` (another program, or another user account on a shared computer) could load the page, read the token, and use the API, including compiling with shell escape, which runs programs. Now the token stays in the app's main process and the backend, and Electron adds it to the app's own requests. A request from outside the app gets `401`. Reported on r/LaTeX. ([#19](https://github.com/sarmadsoomro/TexCraft/pull/19))

### Added

- A **Sponsor** link in Settings → About and on the repository page, for anyone who wants to help pay for code signing. ([#17](https://github.com/sarmadsoomro/TexCraft/pull/17))
- Screenshots in the README. ([#18](https://github.com/sarmadsoomro/TexCraft/pull/18))

### Fixed

- In dark mode the editor stayed white. The syntax theme now has a **Match app** option, the new default, which uses LaTeX Light or LaTeX Dark to match the app. Anyone still on the old default is moved to it; a theme you picked yourself is kept. ([#18](https://github.com/sarmadsoomro/TexCraft/pull/18))

## 0.3.0 (2026-11-02)

The first release with desktop installers for macOS, Windows and Linux.

### Added

- **Desktop app** for macOS (Apple silicon and Intel), Windows and Linux, built with Electron. No Node.js or pnpm needed. Finds MacTeX, MiKTeX, TeX Live and TinyTeX even when they are not on the app's `PATH`. ([#8](https://github.com/sarmadsoomro/TexCraft/pull/8))
- A notice when no LaTeX distribution is found, naming the right one for the OS, with **Check again**. ([#8](https://github.com/sarmadsoomro/TexCraft/pull/8))
- **Jump between source and PDF** (SyncTeX): Alt+J or **Show in PDF** from the editor; double-click or Ctrl/Cmd+click the PDF to go back. Works across `\input` and `\include`, without the `synctex` command-line tool. ([#7](https://github.com/sarmadsoomro/TexCraft/pull/7))
- **Incremental compiles** with `latexmk`, a **Clean build** option, an automatic clean rebuild once when a stale `.aux` file breaks a compile, a compile timeout setting, and a Shell escape setting (off by default). One compile per project at a time. ([#5](https://github.com/sarmadsoomro/TexCraft/pull/5))
- **Set as main file** from the file tree, with a MAIN badge, so templates with several documents can compile any of them. ([#10](https://github.com/sarmadsoomro/TexCraft/pull/10))
- **Save PDF** button in the PDF toolbar. ([#10](https://github.com/sarmadsoomro/TexCraft/pull/10))
- Click an error in the log to open its file at that line. ([#10](https://github.com/sarmadsoomro/TexCraft/pull/10))
- **Install missing LaTeX packages** from the log. When a compile reports ``File `x.sty' not found``, the log names the package and offers **Install** (TeX Live via `tlmgr`, with the macOS password prompt for MacTeX and BasicTeX; MiKTeX), or the command to run on Debian and Ubuntu. After an install the document is rebuilt. ([#14](https://github.com/sarmadsoomro/TexCraft/pull/14))
- Installation guide, user guide, troubleshooting guide, security policy and this changelog.

### Changed

- The editor and fonts are bundled, so the app works offline and makes no requests to other sites. ([#6](https://github.com/sarmadsoomro/TexCraft/pull/6))
- Node.js 20.19 or later is required to run from source.
- April 2026 planning documents moved to `docs/archive/`.
- The repository is now `sarmadsoomro/TexCraft` (it was `LocalLatexEditor`). Links in the app, docs and scripts use the new name; the old URLs redirect.
- MIT license file, and CI (lint, typecheck, tests) on Linux, macOS and Windows. ([#3](https://github.com/sarmadsoomro/TexCraft/pull/3))

### Fixed

- **Settings → About** showed version 1.0.0 instead of the app's version, and its **Documentation** link went nowhere. It now opens the user guide.
- **Delete Forever** in the Trash now asks first and deletes the project's folder. Before, it ran without asking, and the files stayed on disk. A project whose folder is missing can be removed with **Remove from list** on its error page. ([#14](https://github.com/sarmadsoomro/TexCraft/pull/14))
- A compile that produced warnings (common with journal templates such as Elsevier's `cas-dc`) showed the log instead of the PDF. The right pane now has **PDF** and **Log** tabs with error and warning counts; after a failed compile the last good PDF stays available. Errors without a line number no longer show "Line ?". ([#14](https://github.com/sarmadsoomro/TexCraft/pull/14))
- A project with an unreadable file (for example a broken link) failed to open with "Internal server error". Such files are now skipped, and a missing or unreadable project folder gets a clear message. ([#9](https://github.com/sarmadsoomro/TexCraft/pull/9))
- The engine menu (pdflatex, xelatex, lualatex) now changes the engine used. LaTeX errors report the right file and line. ([#5](https://github.com/sarmadsoomro/TexCraft/pull/5))
- "Open in new tab" for the PDF no longer trips the popup blocker. ([#4](https://github.com/sarmadsoomro/TexCraft/pull/4))

### Security

- The backend listens on `127.0.0.1` only and requires a per-launch token on every API request. Requests with a foreign `Host` header are refused, which blocks DNS rebinding. ([#4](https://github.com/sarmadsoomro/TexCraft/pull/4))
- Zip import rejects entries that escape the project folder, symlinks, and archives over 5,000 entries or 500 MB. ([#4](https://github.com/sarmadsoomro/TexCraft/pull/4))

## 0.2.0 (2026-04-16)

- Rebrand to TexCraft with a redesigned interface: header, tab bar, compile button with engine menu, auto-compile toggle, settings menu.
- Project status (draft, in progress, published), filters, search, and trash with restore.
- Recently opened projects.
- Settings for the editor, compiler and appearance, and an About tab.
- LaTeX and BibTeX syntax highlighting with six color themes.
- Rename projects inline.
- Export a project as a zip. ([#1](https://github.com/sarmadsoomro/TexCraft/pull/1))
- Setup and start scripts for macOS, Linux and Windows.
