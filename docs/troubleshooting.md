# Troubleshooting

Find the symptom, try the fix. If nothing here helps, [report a problem](#reporting-a-problem).

- [Installing and opening the app](#installing-and-opening-the-app)
- [LaTeX not found](#latex-not-found)
- [Compile errors](#compile-errors)
- [The PDF looks wrong](#the-pdf-looks-wrong)
- [Projects](#projects)
- [Other](#other)
- [Reporting a problem](#reporting-a-problem)

## Installing and opening the app

**macOS: "Apple could not verify TexCraft is free of malware".** The app is not signed yet. Click **Done**, then System Settings → Privacy & Security → **Open Anyway**. Details in the [installation guide](installation.md#macos).

**macOS: "TexCraft is damaged and can't be opened".** The download was quarantined. Run once in Terminal:

```bash
xattr -dr com.apple.quarantine /Applications/TexCraft.app
```

**macOS: the app does nothing on an Intel Mac**, or says it cannot run on this Mac. You have the Apple silicon (`arm64`) download. Use the `x64` `.dmg`.

**Windows: "Windows protected your PC".** Click **More info → Run anyway**.

**Linux: `dlopen(): error loading libfuse.so.2`.** Install FUSE 2: `sudo apt install libfuse2` (Ubuntu 22.04) or `libfuse2t64` (24.04).

**"TexCraft could not start" or "TexCraft stopped working".** The message names the log file. Open it (**Help → Show Log File** if the window is up) and include it when you [report the problem](#reporting-a-problem).

## LaTeX not found

**A notice says no LaTeX was found, but it is installed.**

1. Open a **new** terminal and run `pdflatex --version`. If that fails too, LaTeX is not installed or not on your `PATH`: see the [installation guide](installation.md#1-install-a-latex-distribution).
2. If it works in the terminal, quit TexCraft completely (Cmd+Q on a Mac) and open it again. LaTeX installed while TexCraft was open is only found after a restart.
3. Still missing? Run `which pdflatex` (macOS, Linux) or `where pdflatex` (Windows) and include the result in a [problem report](#reporting-a-problem). The desktop app looks in the usual install folders listed in [desktop-app.md](desktop-app.md#finding-latex); an unusual install location may need adding.

**Running from source: `pdflatex` works in one terminal but not in TexCraft.** Start `pnpm dev` from a terminal where `pdflatex --version` works.

## Compile errors

Click an error in the log to jump to its line. The [user guide](user-guide.md#fixing-errors) lists the common LaTeX errors. Problems that come from the setup rather than your document:

**``LaTeX Error: File `something.sty' not found``.** A package the document uses is not installed. The log shows a notice with an **Install** button or a command to run ([user guide](user-guide.md#missing-packages)). If the install fails, or you prefer to do it yourself:

| Distribution | Fix |
| --- | --- |
| MiKTeX | Allow on-the-fly installs (MiKTeX Console → Settings → "Always install missing packages"), then compile again. Or install the package in MiKTeX Console → Packages |
| MacTeX | MacTeX includes almost everything. Update it: `sudo tlmgr update --self --all` |
| BasicTeX, TinyTeX | `sudo tlmgr install <package>` (TinyTeX: no `sudo`). The package name is usually the file name without `.sty`; `tlmgr search --global --file something.sty` finds it otherwise. Journal templates need many packages: `sudo tlmgr install collection-latexextra collection-fontsrecommended` adds most of them |
| TeX Live on Linux | Install the collection that holds it, for example `sudo apt install texlive-science` for `algorithmic.sty`, or `texlive-full` for everything |

**Install fails with "your TeX Live is older than the online package server".** `tlmgr` only installs packages for the current TeX Live year. Install the current MacTeX or TeX Live, then try again.

**The compile fails on the template's sample before you changed anything.** Usually the same missing-package problem. Journal templates (IEEE, Elsevier, Springer) need a fairly complete install. Check the first error in the log.

**"Compile timed out".** The compile ran longer than the timeout (default 5 minutes). Raise it in Settings → Compiler, or look for an endless loop: a `\input` of the file itself, or a TikZ picture that never finishes.

**An error stays after you fixed it, or `??` and old page numbers will not go away.** Compile ▾ → **Clean build**. It deletes the intermediate files (`.aux`, `.toc`, `.bbl`) and compiles from scratch.

**Bibliography empty or citations show as `[?]`.** Compile once more; the bibliography needs an extra pass. If it stays empty, check that the `.bib` file name in `\bibliography{...}` or `\addbibresource{...}` matches the file in the project, including upper and lower case. `biblatex` documents need `biber` installed.

**`minted` or `\write18` errors.** These packages run outside programs and need Settings → Compiler → **Shell escape**. Only turn it on for documents you trust.

**The wrong document compiles.** TexCraft compiles the **main file**, not the file you have open. Right-click the right `.tex` file → **Set as main file**.

## The PDF looks wrong

**The fonts differ from the journal's sample PDF.** Some classes quietly fall back to the default font when the font they want is not installed. Elsevier's `cas-dc` class, for example, uses STIX and switches to Computer Modern without an error if STIX is missing. Search the log for "not available" or "font", then install the font package (on Linux, `texlive-fonts-extra`; on MiKTeX it installs on the fly; MacTeX has it).

**The PDF does not update.** Open the **Log** tab and look for an error. After a failed compile the **PDF** tab still shows the last good PDF, marked "Last compile failed". Then try Clean build.

**Compile shows the log instead of the PDF.** The compile failed: the **Log** tab has a red error count. If the count is orange, there are only warnings; click **PDF** to see the document.

**Double-click on the PDF jumps to the wrong line, or does nothing.** Compile again. The jump uses data from the last successful compile, so it drifts after big edits.

## Projects

**A project shows "This project's folder is missing".** The folder in `~/.latex-editor/projects` was moved or deleted outside TexCraft. Put it back, or click **Remove from list** on that page.

**"TexCraft is not allowed to read …".** Your user account cannot read the project folder. On a Mac, check System Settings → Privacy & Security → Files and Folders. Elsewhere, check the folder's permissions.

**Import from directory says the folder does not exist.** Type the full path, for example `/Users/you/Documents/thesis`, not `~/Documents/thesis` and not a relative path.

**Import from ZIP is refused.** The zip has more than 5,000 files, more than 500 MB, links, or paths that point outside it. Make the zip again from the folder itself (Overleaf: Menu → Download → Source works).

**A file is missing from the file tree.** Hidden files (names starting with `.`) and LaTeX's intermediate files are hidden by default: Settings → Appearance → **Show hidden files** / **Show compiled files**. Files TexCraft cannot read, such as broken links, are left out.

**Changes you made in the original folder do not show up.** Import copies the files. TexCraft works on its copy in `~/.latex-editor/projects`. Re-import, or make the changes in TexCraft.

## Other

**"Server restarted - reload the page".** The backend restarted, so the page's access token is out of date. Reload the page (Cmd+R or Ctrl+R in the desktop app). Your saved files are fine; save again anything you changed after the message appeared.

**My settings are gone.** Settings are stored per app and per address. The desktop app normally uses `http://127.0.0.1:41731`; if that port was busy it used the next one, which has its own settings. Quit anything else using the port and restart TexCraft. The browser version and the desktop app keep separate settings.

**Save PDF or Export does not ask where to save.** Look in your Downloads folder; browsers save there without asking unless set otherwise.

## Reporting a problem

[Open an issue](https://github.com/sarmadsoomro/LocalLatexEditor/issues/new/choose) (**Help → Report a Problem** in the app) and include:

- What you did, what you expected, and what happened.
- Your OS, the TexCraft version (in the installer's file name, for example `TexCraft-0.3.0-mac-arm64.dmg`), and your LaTeX distribution (`pdflatex --version`, first line).
- The backend log: **Help → Show Log File**. On macOS it is `~/Library/Logs/TexCraft/backend.log`, on Windows `%APPDATA%\TexCraft\logs\backend.log`, on Linux `~/.config/TexCraft/logs/backend.log`.
- For a compile problem, the smallest `.tex` file that shows it, if you can share it. The log contains file paths from your computer; remove anything private before posting.
