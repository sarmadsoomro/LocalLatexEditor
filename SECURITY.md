# Security

## Reporting a vulnerability

Please report security problems privately, not in a public issue: use **Report a vulnerability** on the repository's [Security tab](https://github.com/sarmadsoomro/LocalLatexEditor/security/advisories/new). Include the steps to reproduce, the version, and the OS.

TexCraft is maintained by one person, so replies can take a few days. Fixes go into the next release, and the advisory is published with it.

Supported versions: the latest release and `main`.

## Security model

TexCraft is a single-user app. Its backend runs on your computer and should be reachable only by you.

### Network

- The backend listens on `127.0.0.1` only (`3001` from source, `41731` or the next free port in the desktop app), so other machines on the same network cannot connect.
- **Per-launch token.** On every start the backend creates a random token. Every `/api` request needs it in the `X-TexCraft-Token` header, otherwise the answer is `401`. `/health` is open. When the backend serves the app it writes the token into `index.html`. With `pnpm dev`, the backend writes it to `~/.latex-editor/.session-token` (mode `0600`) and the Vite dev server puts it into the page. The token is not logged, not put in URLs, and not stored in browser storage. If the backend restarts, the token changes and the page shows "Server restarted - reload the page".
- **Host check.** Requests whose `Host` header is not `localhost:<port>` or `127.0.0.1:<port>` get `403`. This blocks DNS-rebinding attacks from web pages.
- **CORS** allows only `http://localhost:3000` (the dev server).
- **`HOST` override.** Setting `HOST` (for example `HOST=0.0.0.0`) makes the backend listen on that address and logs a warning. The token and Host check still apply, so other machines get `401` or `403`, but the port is open to the network. Do not set it on shared networks.
- **Windows.** Windows does not enforce mode `0600` on the token file. It lives in your user profile, which by default only your account can read.

### Files

- **Zip import.** Entries are extracted one by one. The whole import is rejected if any entry has an absolute path, escapes the extract folder, or is a symlink, or if the zip has more than 5,000 entries or more than 500 MB of data. Temporary files live under `~/.latex-editor/temp` and are removed afterwards.
- **File routes** reject paths that leave the project folder.
- **Main file** must be an existing `.tex` file inside the project.

### Compiling

- LaTeX is started with `spawn` and `shell: false`. Arguments are never passed through a shell.
- `-shell-escape` is off. It is only passed when you turn on Settings → Compiler → Shell escape, which lets a document run programs. Only enable it for documents you trust.
- **Package installs.** When a compile reports a missing package, TexCraft can install it, but only after you click **Install**. The file and package names from the log are checked against strict patterns (letters, digits, `.`, `_`, `+`, `-`) before anything runs. `tlmgr` and MiKTeX run without a shell. On macOS with a system TeX Live, the install runs through the standard macOS administrator prompt (`osascript … with administrator privileges`); TexCraft never sees your password, and the command contains only the validated package name and the absolute path of `tlmgr`.
- This is not a sandbox. LaTeX runs as your user and can read any file you can read, for example through `\input{/path/to/file}`. Treat documents from others like any other file you open.

### Desktop app

- Same backend, token and Host check.
- The window cannot navigate away from the app. Links to other sites open in your normal browser (`http`, `https` and `mailto` only).
- The page has no Node.js access (`contextIsolation`, `sandbox`, no `nodeIntegration`).
- Permission requests (camera, microphone, location, notifications) are denied.
- The installers are not code-signed yet. Download them only from the [Releases page](https://github.com/sarmadsoomro/LocalLatexEditor/releases).

### Privacy

The app makes no requests to other sites: the editor, fonts and PDF viewer are bundled. There is no telemetry. Your LaTeX distribution may download packages on its own (MiKTeX does by default).
