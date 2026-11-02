# Changelog

Notable changes to TexCraft. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

The first release with desktop installers. The package version is `0.3.0`, but no `v0.3.0` tag was published, so these changes ship in the next tagged release.

### Added

- **Desktop app** for macOS (Apple silicon and Intel), Windows and Linux, built with Electron. No Node.js or pnpm needed. Finds MacTeX, MiKTeX, TeX Live and TinyTeX even when they are not on the app's `PATH`. ([#8](https://github.com/sarmadsoomro/LocalLatexEditor/pull/8))
- A notice when no LaTeX distribution is found, naming the right one for the OS, with **Check again**. ([#8](https://github.com/sarmadsoomro/LocalLatexEditor/pull/8))
- **Jump between source and PDF** (SyncTeX): Alt+J or **Show in PDF** from the editor; double-click or Ctrl/Cmd+click the PDF to go back. Works across `\input` and `\include`, without the `synctex` command-line tool. ([#7](https://github.com/sarmadsoomro/LocalLatexEditor/pull/7))
- **Incremental compiles** with `latexmk`, a **Clean build** option, an automatic clean rebuild once when a stale `.aux` file breaks a compile, a compile timeout setting, and a Shell escape setting (off by default). One compile per project at a time. ([#5](https://github.com/sarmadsoomro/LocalLatexEditor/pull/5))
- **Set as main file** from the file tree, with a MAIN badge, so templates with several documents can compile any of them. ([#10](https://github.com/sarmadsoomro/LocalLatexEditor/pull/10))
- **Save PDF** button in the PDF toolbar. ([#10](https://github.com/sarmadsoomro/LocalLatexEditor/pull/10))
- Click an error in the log to open its file at that line. ([#10](https://github.com/sarmadsoomro/LocalLatexEditor/pull/10))
- Installation guide, user guide, troubleshooting guide, security policy and this changelog.

### Changed

- The editor and fonts are bundled, so the app works offline and makes no requests to other sites. ([#6](https://github.com/sarmadsoomro/LocalLatexEditor/pull/6))
- Node.js 20.19 or later is required to run from source.
- April 2026 planning documents moved to `docs/archive/`.
- MIT license file, and CI (lint, typecheck, tests) on Linux, macOS and Windows. ([#3](https://github.com/sarmadsoomro/LocalLatexEditor/pull/3))

### Fixed

- A project with an unreadable file (for example a broken link) failed to open with "Internal server error". Such files are now skipped, and a missing or unreadable project folder gets a clear message. ([#9](https://github.com/sarmadsoomro/LocalLatexEditor/pull/9))
- The engine menu (pdflatex, xelatex, lualatex) now changes the engine used. LaTeX errors report the right file and line. ([#5](https://github.com/sarmadsoomro/LocalLatexEditor/pull/5))
- "Open in new tab" for the PDF no longer trips the popup blocker. ([#4](https://github.com/sarmadsoomro/LocalLatexEditor/pull/4))

### Security

- The backend listens on `127.0.0.1` only and requires a per-launch token on every API request. Requests with a foreign `Host` header are refused, which blocks DNS rebinding. ([#4](https://github.com/sarmadsoomro/LocalLatexEditor/pull/4))
- Zip import rejects entries that escape the project folder, symlinks, and archives over 5,000 entries or 500 MB. ([#4](https://github.com/sarmadsoomro/LocalLatexEditor/pull/4))

## 0.2.0 (2026-04-16)

- Rebrand to TexCraft with a redesigned interface: header, tab bar, compile button with engine menu, auto-compile toggle, settings menu.
- Project status (draft, in progress, published), filters, search, and trash with restore.
- Recently opened projects.
- Settings for the editor, compiler and appearance, and an About tab.
- LaTeX and BibTeX syntax highlighting with six color themes.
- Rename projects inline.
- Export a project as a zip. ([#1](https://github.com/sarmadsoomro/LocalLatexEditor/pull/1))
- Setup and start scripts for macOS, Linux and Windows.
