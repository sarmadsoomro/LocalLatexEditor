# User guide

How to write, compile and manage LaTeX documents in TexCraft. To install it first, see [installation](installation.md).

- [The two screens](#the-two-screens)
- [Projects](#projects)
- [Editing](#editing)
- [Compiling](#compiling)
- [The PDF preview](#the-pdf-preview)
- [Jumping between source and PDF](#jumping-between-source-and-pdf)
- [Fixing errors](#fixing-errors)
- [Getting your files out](#getting-your-files-out)
- [Settings](#settings)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Where your files are](#where-your-files-are)
- [Privacy](#privacy)

## The two screens

**Projects** is the start screen. It lists your projects with search, status filters, recently opened projects and the trash.

**The editor** opens when you open a project. From left to right:

- **Files**: the project's files and folders.
- **Editor**: one tab per open file.
- **PDF** and **Log**: two tabs. **PDF** shows the compiled document; **Log** shows the errors, warnings and full LaTeX output. The **Log** tab shows a red count for errors and an orange count for warnings.

Drag the dividers to resize the panes.

## Projects

A project is one folder holding a main `.tex` file and everything it uses: chapters, images, `.bib` files, class and style files.

### Create a project

**New Project**, type a name, and pick a template:

| Template | For |
| --- | --- |
| Article | Papers, assignments, short reports |
| Report | Longer reports and theses with chapters |
| Book | Books |
| Beamer | Slides |
| Letter | Letters |
| Empty | An empty `main.tex` |

The project starts with `main.tex`. Compile it right away to check that LaTeX works.

### Import a project

**Import** offers two ways in. Both **copy** your files into TexCraft; the originals are never changed.

- **From ZIP file**: pick or drop a `.zip`. This is the way to bring in a project downloaded from Overleaf (Menu → Download → Source) or sent by a supervisor.
- **From directory**: type the full path of a folder on your computer, for example `/Users/you/Documents/thesis` or `C:\Users\you\Documents\thesis`.

TexCraft picks the main file automatically: `main.tex`, `document.tex`, `thesis.tex` or `paper.tex` if there is one, otherwise the `.tex` file closest to the top of the project. If the zip holds a single folder, its contents become the project. The project card shows which file it chose ("Main: …"), and the file tree marks it **MAIN**. Templates often ship several documents (Elsevier's bundle has `cas-dc-sample.tex`, `cas-sc-sample.tex` and two blank templates), so check it after importing and [change it](#the-main-file) if needed.

Zip limits: at most 5,000 files and 500 MB unpacked. Zips containing links or paths that point outside the zip are refused.

### Organise projects

- **Rename**: click the project name at the top of the editor.
- **Status**: mark a project **Draft**, **In Progress** or **Published** from its card, then filter the list by status.
- **Search**: the search box filters by name.
- **Delete**: the trash icon on a card moves the project to the **Trash**. Its files stay on disk. Open the Trash to **Restore** it, or **Delete Forever**, which asks first and then deletes the project's folder and every file in it.
- **A project whose folder is missing** (moved or deleted outside TexCraft) shows "This project's folder is missing" when you open it. Put the folder back, or click **Remove from list**; that deletes nothing, because the folder is already gone.

## Editing

The editor is Monaco, the editor inside VS Code, with LaTeX and BibTeX highlighting.

- **Open a file**: click it in the file tree.
- **Save**: Ctrl+S (Cmd+S on a Mac). A dot next to a tab name means unsaved changes. TexCraft asks before closing a tab or leaving with unsaved changes.
- **New file or folder, upload**: buttons at the top of the file tree. Upload adds images, `.bib` files and anything else from your computer.
- **Rename or delete a file**: right-click it in the file tree.
- **Change the main file**: right-click a `.tex` file → **Set as main file**. See [the main file](#the-main-file).
- **Search and replace in a file**: Ctrl+F and Ctrl+H (Cmd+F, Cmd+Option+F on a Mac).

Monaco's usual editing keys work: Ctrl+/ toggles a `%` comment, Alt+↑/↓ moves lines, Ctrl+D selects the next match.

Files you edit in TexCraft live in its own storage, not in the folder you imported from. See [where your files are](#where-your-files-are).

## Compiling

Click **Compile** or press **Ctrl+B** (Cmd+B). The PDF appears on the right when it is done.

### The main file

TexCraft always compiles the project's **main file**, the one with `\documentclass` that pulls in everything else. It does not matter which file is open in the editor. The file tree marks the main file **MAIN**.

To compile a different document, right-click it in the file tree and choose **Set as main file**, then compile. The choice is saved with the project. Use this when a template has several documents, or for a thesis whose main file is not `main.tex`.

### Options

**Engine.** The arrow next to Compile chooses the engine:

| Engine | Use it when |
| --- | --- |
| `pdflatex` | The default. Most templates and university classes |
| `xelatex` | You use `fontspec`, system fonts, or non-Latin scripts (Arabic, Urdu, Chinese, …) |
| `lualatex` | The template asks for it, or you need `fontspec` with Lua features |

The choice is remembered (Settings → Compiler → Default engine).

**Bibliographies.** TexCraft runs BibTeX or Biber when the document needs it. Nothing to configure.

**Auto-compile.** With the **Auto** toggle on, saving a file compiles about 2 seconds later. It waits at least 8 seconds between compiles so typing and saving does not compile constantly.

**Fast recompiles.** With `latexmk` installed (MacTeX, MiKTeX and full TeX Live include it), TexCraft keeps the intermediate files between compiles and only reruns what changed, so a small edit to a long thesis recompiles quickly.

**Clean build.** Compile ▾ → **Clean build** deletes the intermediate files (`.aux`, `.toc`, `.bbl`, …) and compiles from scratch. Use it when an error stays after you fixed the source, or a reference or table of contents looks stale. TexCraft already does this once on its own when a compile fails inside a stale `.aux` file.

**Timeout.** A compile that runs longer than the timeout (default 5 minutes; Settings → Compiler) is stopped.

**Shell escape** is off. Packages such as `minted` need it: Settings → Compiler → Shell escape. Only turn it on for documents you trust, because it lets the document run programs on your computer.

## The PDF preview

- **Pages**: the arrows, or Page Up, Page Down, Home and End.
- **Zoom**: the + and − buttons, the percentage box (25–400 %), the presets menu, **Fit to width**, **Fit to page**, or Ctrl/Cmd + scroll wheel.

The preview keeps your page and zoom when it reloads after a compile.

A compile with only warnings (overfull boxes, font substitutions and the like) still shows the PDF. Open the **Log** tab to read the warnings. If a compile fails, TexCraft switches to the **Log** tab; the **PDF** tab still has the last good PDF, marked "Last compile failed".

## Jumping between source and PDF

This is SyncTeX. It works with every engine and across files included with `\input` and `\include`.

- **Source → PDF**: put the cursor on a line and press **Alt+J** (Option+J on a Mac), click **Show in PDF**, or right-click → **Show in PDF**. The PDF scrolls to that spot and highlights it.
- **PDF → source**: double-click the PDF, or Ctrl/Cmd+click. TexCraft opens the file and moves the cursor to the line that produced that spot.

Compile once before using it. If it jumps to the wrong place after big edits, compile again.

## Fixing errors

When a compile fails, TexCraft opens the **Log** tab. It lists the errors first, each with its file and line number when LaTeX reports one, then the full LaTeX log. **Click an error** (or select it and press Enter) to open its file with the cursor on that line. An error inside a file that is not part of your project, such as a package from your LaTeX installation, cannot be opened; look at the line in your own file that uses that package instead.

### Missing packages

If the document uses a package your LaTeX does not have (``LaTeX Error: File `lipsum.sty' not found``), the log shows a notice above the errors naming the package, for example "The LaTeX package **lipsum** is not installed".

- **Install** button: click it and TexCraft installs the package, then rebuilds the document. On a Mac with MacTeX or BasicTeX, macOS first asks for your password, because LaTeX is installed for all users; TexCraft never sees the password. With TinyTeX, or a TeX Live in your own folders, no password is needed. Installing needs an internet connection and can take a minute.
- **A command to copy** instead of the button: shown when TexCraft cannot install it for you, for example with Ubuntu's or Debian's TeX Live (`sudo apt install texlive-latex-extra`). Run it in a terminal, then compile again.

TexCraft looks up which package holds the file, since the names differ sometimes (`algorithmic.sty` is in `algorithms`). Nothing is installed until you click **Install**.

Common errors:

| Message | Usual cause |
| --- | --- |
| `Undefined control sequence` | A typo in a command, or a missing `\usepackage` |
| `Missing $ inserted` | Math (`^`, `_`, `\alpha`) outside `$...$`, or an unescaped `_` or `&` in text |
| `File 'xyz.sty' not found` | The package is not installed: use the notice above the errors ([Missing packages](#missing-packages)) |
| `Missing \begin{document}` | Text or a stray character before `\begin{document}`, or the wrong file is the main file |
| `Citation ... undefined` (warning) | The key is not in your `.bib`, or the bibliography has not run yet: compile again |
| `??` in the PDF | References not resolved yet: compile again. If they stay, Clean build |

## Getting your files out

- **The whole project**: **Export** in the editor toolbar, or the download icon on a project card, saves a `.zip` of your sources. It leaves out the PDF and intermediate files. The zip imports into Overleaf (New Project → Upload Project) or back into TexCraft.
- **The PDF**: **Save PDF** in the PDF toolbar saves the last compiled PDF, named after the main file (`main.pdf`). It is also in the project's folder under `output/`; see [where your files are](#where-your-files-are).

## Settings

The gear icon in the editor toolbar has the light/dark theme switch and **Editor Settings**:

| Tab | What you can set |
| --- | --- |
| Editor | Font and size, tab size, word wrap, line numbers, minimap, current-line highlight, bracket colours, syntax theme, auto-save, auto-compile and their delays |
| Compiler | Default engine, compile timeout, shell escape |
| Appearance | Theme (light, dark or follow the system), show hidden files, show compiled files (`.aux`, `.log`, …) in the file tree, delete and close confirmations |

Settings are stored on this computer, per app. The desktop app and the browser version keep separate settings.

## Keyboard shortcuts

Ctrl on Windows and Linux, Cmd on a Mac.

| Keys | Action |
| --- | --- |
| Ctrl+S | Save the current file |
| Ctrl+B | Compile |
| Alt+J | Show the cursor's line in the PDF |
| Double-click the PDF | Go to the source line |
| Click an error in the log | Go to its file and line |
| Ctrl+W | Close the current tab |
| Ctrl+Tab / Ctrl+Shift+Tab | Next / previous tab |
| Ctrl+F / Ctrl+H | Find / replace in the file |
| Ctrl+G | Go to line |
| Ctrl+/ | Toggle comment |
| Page Up / Page Down, Home / End | PDF pages (when the PDF has focus) |
| Ctrl + scroll wheel | Zoom the PDF |

The desktop app's **View** menu also has zoom for the whole window (Ctrl+= and Ctrl+−, Ctrl+0 resets) and full screen.

## Where your files are

All projects, from the desktop app and the browser version alike, are in one folder:

| OS | Folder |
| --- | --- |
| macOS | `/Users/<you>/.latex-editor/projects` |
| Windows | `C:\Users\<you>\.latex-editor\projects` |
| Linux | `/home/<you>/.latex-editor/projects` |

The folder starts with a dot, so it is hidden. On a Mac, press Cmd+Shift+. in Finder to show hidden files. On Windows, File Explorer → View → Show → Hidden items.

Each project is a folder named `proj_` and 12 letters and digits. The project card does not show this name yet; sort the folders by date modified to find the one you just worked on. The PDF and intermediate files are in its `output/` folder. A project in the Trash keeps its folder where it is; **Delete Forever** deletes the folder.

**Back up** that folder, or export projects as zips, the same way you back up anything else. TexCraft has no cloud copy.

## Privacy

TexCraft runs entirely on your computer. It has no account and sends your documents nowhere. The editor, fonts and PDF viewer are part of the app, so it works offline.

Two things can still use the internet: installing a missing LaTeX package (MiKTeX on its own, or TexCraft's **Install** button through `tlmgr`), and links you click, which open in your browser.

Something not working? See [troubleshooting](troubleshooting.md).
