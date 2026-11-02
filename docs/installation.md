# Installation

TexCraft needs two things:

1. **TexCraft itself**: the desktop app (recommended) or the source code.
2. **A LaTeX distribution**: the program that turns `.tex` files into PDFs. TexCraft does not include one.

Install them in either order. If TexCraft cannot find LaTeX, it shows a notice telling you which distribution to install and a **Check again** button.

- [1. Install a LaTeX distribution](#1-install-a-latex-distribution)
- [2. Install the desktop app](#2-install-the-desktop-app)
- [3. Or run from source](#3-or-run-from-source)
- [Updating](#updating)
- [Uninstalling](#uninstalling)

## 1. Install a LaTeX distribution

| OS | Install | Size | Notes |
| --- | --- | --- | --- |
| macOS | [MacTeX](https://www.tug.org/mactex/) | about 6 GB | Everything included. [BasicTeX](https://www.tug.org/mactex/morepackages.html) (about 100 MB) is smaller, but you add packages yourself with `tlmgr` |
| Windows | [MiKTeX](https://miktex.org/download) | about 1 GB | Downloads missing packages the first time a document needs them. [TeX Live](https://tug.org/texlive/windows.html) also works |
| Linux | TeX Live from your package manager | 1–6 GB | Ubuntu and Debian: `sudo apt install texlive-full` (everything) or `texlive-latex-extra latexmk biber` (smaller) |

Check that it worked. Open a **new** terminal and run:

```bash
pdflatex --version
```

It should print a version line. Then restart TexCraft, or click **Check again** in its notice.

**Recommended extras.** These come with MacTeX, MiKTeX and `texlive-full`. With a smaller install, add them:

- `latexmk`: makes recompiles faster. Without it, TexCraft still works and reruns every pass each time.
- `biber`: needed for documents that use `biblatex`. `bibtex` is used for classic `\bibliography{...}`.

**MiKTeX:** in MiKTeX Console → Settings, set "Install missing packages on-the-fly" to **Always**. Then a compile that needs a new package downloads it instead of stopping to ask.

## 2. Install the desktop app

Download the file for your computer from the [Releases page](https://github.com/sarmadsoomro/TexCraft/releases) under **Assets**:

| Computer | File |
| --- | --- |
| Mac with Apple silicon (M1 and later) | `TexCraft-<version>-mac-arm64.dmg` |
| Mac with an Intel processor | `TexCraft-<version>-mac-x64.dmg` |
| Windows 10 or 11 (64-bit) | `TexCraft-<version>-win-x64.exe` |
| Linux (64-bit Intel or AMD) | `TexCraft-<version>-linux-x86_64.AppImage` |

Not sure which Mac you have? Apple menu → **About This Mac**. "Chip: Apple M…" is Apple silicon. "Processor: Intel" is Intel.

The installers are not code-signed yet, so the operating system warns you the first time. The steps below get past that once.

**Chrome says the file is dangerous or "not commonly downloaded".** Chrome warns about any installer that few people have downloaded yet and that is not signed. If you got the file from the Releases page above, it is safe to keep: click the warning in the download bar (or open `chrome://downloads`), then **Keep** or **Download dangerous file**. Safari and Firefox do not show this warning. You can also download in Terminal, which skips the browser and the macOS quarantine:

```bash
curl -LO https://github.com/sarmadsoomro/TexCraft/releases/download/v<version>/TexCraft-<version>-mac-arm64.dmg
```

### macOS

1. Open the `.dmg` and drag **TexCraft** onto **Applications**.
2. Open TexCraft from Applications. macOS says it cannot verify the app. Click **Done**.
3. Open **System Settings → Privacy & Security**, scroll down to "TexCraft was blocked", click **Open Anyway** and confirm with your password.

If macOS instead says TexCraft "is damaged and can't be opened", the download was quarantined. Run this once in Terminal, then open the app again:

```bash
xattr -dr com.apple.quarantine /Applications/TexCraft.app
```

### Windows

1. Run the `.exe`.
2. If SmartScreen says "Windows protected your PC", click **More info → Run anyway**.
3. Pick the install folder. TexCraft installs for your user only; it does not need administrator rights.

TexCraft then appears in the Start menu.

### Linux

1. Make the AppImage executable and run it:

   ```bash
   chmod +x TexCraft-*-linux-x86_64.AppImage
   ./TexCraft-*-linux-x86_64.AppImage
   ```

2. If it says `dlopen(): error loading libfuse.so.2`, install FUSE 2 (`sudo apt install libfuse2` on Ubuntu 22.04, `libfuse2t64` on 24.04) and run it again.

Optional: [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or Gear Lever add AppImages to your applications menu.

## 3. Or run from source

Use this to change TexCraft or to try unreleased work. It runs in your browser instead of its own window.

You need:

- Node.js 20.19 or later (`node --version`). Get the LTS from [nodejs.org](https://nodejs.org)
- pnpm 8 or later: `npm install -g pnpm`
- Git
- A LaTeX distribution ([step 1](#1-install-a-latex-distribution))

```bash
git clone https://github.com/sarmadsoomro/TexCraft.git
cd TexCraft
pnpm install
pnpm dev
```

Open http://localhost:3000. Stop it with Ctrl+C in the terminal.

`pnpm desktop` runs the desktop window from source instead (it downloads Electron the first time). The [contributing guide](../CONTRIBUTING.md) covers the rest.

The setup scripts in [`scripts/`](../scripts/README.md) check for Git, Node.js, pnpm and LaTeX and run the steps above for you.

## Updating

**Desktop app.** TexCraft does not update itself yet. Download the new installer from the Releases page and install it over the old one. Your projects and settings stay.

**From source.**

```bash
git pull
pnpm install
```

## Uninstalling

| OS | Remove the app |
| --- | --- |
| macOS | Drag `/Applications/TexCraft.app` to the Trash |
| Windows | Settings → Apps → Installed apps → TexCraft → Uninstall |
| Linux | Delete the AppImage |

Uninstalling leaves your projects in place. They are in `~/.latex-editor` (on Windows `C:\Users\<you>\.latex-editor`). Copy anything you want to keep, then delete that folder to remove them.

App settings and logs are in `~/Library/Application Support/TexCraft` and `~/Library/Logs/TexCraft` on macOS, `%APPDATA%\TexCraft` on Windows, and `~/.config/TexCraft` on Linux.

Something not working? See [troubleshooting](troubleshooting.md).
