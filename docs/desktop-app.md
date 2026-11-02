# Desktop app

TexCraft ships as a desktop app built with Electron. It is the same frontend and backend as `pnpm dev`, in one window, with no Node.js, pnpm or Git to install.

## How it works

| Part | Where | What it does |
| --- | --- | --- |
| Main process | `apps/desktop/src/main.ts` | Picks a port, starts the backend, opens the window, builds the menu |
| Backend | `apps/desktop/src/server.ts` → `texcraft-backend` | The normal Express backend, run in an Electron utility process (plain Node, separate from the window) |
| Frontend | `apps/frontend/dist`, shipped as `resources/frontend` | Served by the backend, as in production mode |
| TeX lookup | `apps/desktop/src/texPath.ts` | Adds the usual TeX folders to the backend's `PATH` |
| Port | `apps/desktop/src/port.ts` | `41731`, or the next free one |

`scripts/build.mjs` bundles the main process and the backend (with Express, pino, zod and shared-types inlined) into `dist/main.cjs` and `dist/server.cjs`. The installer contains no `node_modules`.

Why a fixed port: the page's settings (theme, compiler options) are saved in browser storage, which is tied to `http://127.0.0.1:<port>`. A stable port keeps them across launches. If `41731` is busy, the app uses `41732` and so on. Settings saved under the other port are not carried over.

### Finding LaTeX

Apps started from Finder, the Dock, the Start menu or a Linux launcher do not get the `PATH` your terminal has. On macOS they get only `/usr/bin:/bin:/usr/sbin:/sbin`, so `pdflatex` looks missing even when MacTeX is installed. The app appends these folders when they exist (your own `PATH` comes first):

| OS | Folders |
| --- | --- |
| macOS | `/Library/TeX/texbin` (MacTeX, BasicTeX), `/usr/local/texlive/<year>/bin/universal-darwin`, `~/Library/TinyTeX/bin/universal-darwin`, `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin` |
| Windows | `%LOCALAPPDATA%\Programs\MiKTeX\miktex\bin\x64`, `%ProgramFiles%\MiKTeX\miktex\bin\x64`, `C:\texlive\<year>\bin\windows` (or `win64`, `win32`), `%APPDATA%\TinyTeX\bin\windows` |
| Linux | `/usr/local/texlive/<year>/bin/<arch>-linux`, `~/.TinyTeX/bin/<arch>-linux`, `/usr/local/bin`, `/usr/bin` |

The newest TeX Live year wins. If no engine is found, the app shows a notice with the right distribution for the OS (MacTeX, MiKTeX or TeX Live) and a **Check again** button. The web version shows the same notice.

### Where things are

- Projects: `~/.latex-editor/projects`, the same folder as the web version, so both see the same projects.
- Backend log, replaced on each launch: **Help → Show Log File**. macOS `~/Library/Logs/TexCraft/backend.log`, Windows `%APPDATA%\TexCraft\logs\backend.log`, Linux `~/.config/TexCraft/logs/backend.log`.

Only one copy of the app runs at a time. Opening it again focuses the existing window.

## First launch

The installers are not code-signed yet, so macOS, Windows and Linux each ask once. Steps for each OS are in the [installation guide](installation.md#2-install-the-desktop-app); fixes for launch errors are in [troubleshooting](troubleshooting.md#installing-and-opening-the-app).

## Building

```bash
pnpm install
pnpm build
pnpm --filter texcraft-desktop dist
```

Installers land in `apps/desktop/release/`. Each OS builds its own installers: a Mac builds the `.dmg` files, Windows the `.exe`, Linux the `.AppImage`.

`pnpm desktop` runs the app from source without packaging it.

`pnpm install` does not download Electron (`pnpm.neverBuiltDependencies` in the root `package.json`), so the web app's install stays small. `pnpm desktop` downloads it the first time. `electron-builder` downloads its own copy when packaging.

`TEXCRAFT_SMOKE_TEST=1` makes the app load its page, call the API once, print `SMOKE TEST OK` and exit `0` (or exit `1`). CI runs every packaged app this way.

## Releasing

`.github/workflows/desktop.yml` builds and smoke-tests the installers on macOS, Windows and Linux for every pull request that touches the apps. The installers are attached to the run as artifacts, so you can test a pull request's build before merging.

To publish a release:

1. In a pull request, set `"version"` in every `package.json` (root, `apps/*`, `packages/*`) to the new version, and move the **Unreleased** notes in `CHANGELOG.md` under a heading for it. Settings → About shows the `package.json` version.
2. Merge to `main`.
3. Tag the merge commit and push the tag:

   ```bash
   git tag v0.4.0
   git push origin v0.4.0
   ```

4. The workflow checks that the tag matches every `package.json` version (it stops if not), builds every installer, and creates a **draft** release with the installers and generated notes.
5. Review the draft on the Releases page, paste the version's `CHANGELOG.md` notes at the top, and click **Publish**.

## Code signing (optional)

Signing removes the first-launch warnings. It needs paid accounts, so it is off until the secrets exist.

**macOS** (Apple Developer Program, USD 99 per year). Add these repository secrets. The workflow then signs and notarizes the app:

| Secret | Value |
| --- | --- |
| `MAC_CERTIFICATE_P12_BASE64` | "Developer ID Application" certificate exported as `.p12`, base64-encoded |
| `MAC_CERTIFICATE_PASSWORD` | the `.p12` password |
| `APPLE_ID` | Apple ID email of the developer account |
| `APPLE_APP_SPECIFIC_PASSWORD` | app-specific password from account.apple.com |
| `APPLE_TEAM_ID` | 10-character team ID |

Without them, the macOS app gets an ad-hoc signature (`-c.mac.identity=-`), which Apple silicon requires to run at all.

**Windows.** Unsigned installers trigger SmartScreen until they build up reputation. Azure Trusted Signing or an OV/EV certificate removes that. It is not wired into the workflow yet.

## Not done yet

- No bundled LaTeX. Students install MacTeX, MiKTeX or TeX Live themselves. A Tectonic option (a small engine that downloads packages on demand) is planned.
- No automatic updates. `electron-builder` writes `latest*.yml` update metadata so `electron-updater` can be added later.
- No Windows ARM or Linux ARM builds.
