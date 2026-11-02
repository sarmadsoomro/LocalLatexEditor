# API

What the backend actually serves. Base URL is `http://127.0.0.1:3001`. There is no `/api/v1` prefix and no WebSocket.

The frontend dev server is on port 3000 and proxies `/api` to port 3001.

Success responses use `{ success: true, data }`, except `PUT /api/projects/:id/files/:path`, which returns 204 with an empty body. Errors go through the shared error handler.

`app.listen` binds to `127.0.0.1` unless `HOST` is set. A non-loopback `HOST` is logged as an error. `localhost` may resolve to IPv6 and miss the IPv4 socket; use `127.0.0.1`.

`startServer(port, host)` in `apps/backend/src/index.ts` is exported for the desktop app and rejects if the port is taken. When `dist/index.html` of the frontend exists, the backend serves it with the token injected; `TEXCRAFT_FRONTEND_DIST` overrides where it looks. `TEXCRAFT_PLAIN_LOGS=1` writes JSON logs instead of starting the `pino-pretty` worker (the bundled desktop backend cannot load it). See [desktop-app.md](desktop-app.md).

Every `/api` route requires `X-TexCraft-Token`. The token is 32 random bytes, hex, generated at process start and written to `~/.latex-editor/.session-token` (mode `0600`). It is not logged. A missing or wrong token is `401` with code `UNAUTHORIZED`. `GET /health` does not require it. The `Host` header must be `127.0.0.1:<port>` or `localhost:<port>`; anything else is `403`. CORS still allows only `http://localhost:3000`, and allows the `X-TexCraft-Token` header.

Project ids look like `proj_` plus letters, digits, `_`, or `-`.

Project files live in `~/.latex-editor/projects/<id>`, or `LATEX_EDITOR_PROJECTS_DIR` if that is set. Import copies into that directory. It does not write back to the source folder.

## Health and system

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | `{ status, timestamp }` |
| GET | `/api/system/latex-check` | Whether a LaTeX engine is on `PATH` |
| POST | `/api/system/packages/lookup` | Body `{ file }`, a package file such as `lipsum.sty` (`.sty .cls .bst .def .clo .fd .cfg .ldf .cbx .bbx .lbx`). Returns `{ lookup: { file, package, manager, method, command, note? } }` |
| POST | `/api/system/packages/install` | Body `{ file, package }`. Installs with `tlmgr` or MiKTeX. 409 when the method is `manual` or another install is running, 400 `INSTALL_CANCELLED` when the macOS password prompt was cancelled, 502 `INSTALL_FAILED` with `details.output` |

## Projects

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/projects` | Query `filter`: `all`, `your_projects`, `published`, `in_progress`, `draft`. Trash is excluded |
| POST | `/api/projects` | Create from a template. 201 |
| GET | `/api/projects/trash` | Trashed projects |
| GET | `/api/projects/:id` | Also updates last opened |
| PUT | `/api/projects/:id` | Rename. Body `{ name }` |
| PUT | `/api/projects/:id/status` | Body `{ status }` where status is `draft`, `in_progress`, or `published` |
| PATCH | `/api/projects/:id/last-opened` | Touch last opened |
| PUT | `/api/projects/:id/main-file` | Body `{ mainFile }`, a path relative to the project. Must be an existing `.tex` file inside the project (400 otherwise, 404 if missing). Saved as `metadata.mainFile`; compiles and `GET .../pdf` use it |
| DELETE | `/api/projects/:id` | Move to trash |
| POST | `/api/projects/:id/restore` | Restore from trash |
| DELETE | `/api/projects/:id/permanent` | Only for a project in the trash (409 `NOT_IN_TRASH` otherwise). Deletes its folder, then its entry. A folder that is already gone is fine. Only a `proj_<id>` folder directly inside the projects directory is ever deleted; any other path only loses its entry. 403 `DELETE_FAILED` if the folder cannot be deleted, and the entry stays |
| POST | `/api/projects/import` | Body `{ sourcePath, name }`. Copies a directory. 201 |
| GET | `/api/projects/:id/export` | Zip download |
| GET | `/api/projects/:id/files` | File tree |

## Files

Mounted at `/api/projects/:id/files`. Paths are relative to the project directory. `..` is rejected.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/projects/:id/files` | Body `{ path, content?, isDir? }`. 201 |
| POST | `/api/projects/:id/files/upload` | Multipart field `file`, plus `path` |
| GET | `/api/projects/:id/files/:path` | File content |
| PUT | `/api/projects/:id/files/:path` | Body `{ content }`. 204 |
| POST | `/api/projects/:id/files/:path/rename` | Body `{ newPath }` |
| POST | `/api/projects/:id/files/:path/move` | Body `{ targetPath }` |
| DELETE | `/api/projects/:id/files/:path` | File or directory |

## Import a zip

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/import-zip` | Multipart field `file` (`.zip`, `.tex`, `.bib`, `.cls`, `.sty`), body field `name`. 100 MB upload limit. Extraction rejects absolute paths, `..` escapes, and symlinks. At most 5,000 entries and 500 MB uncompressed, counted from bytes written. Temp files live under the app storage dir and are deleted on success and failure |

## Compile

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/projects/:id/compile` | Body `{ engine?, mainFile?, clean?, shellEscape?, timeoutSeconds? }`. Engine is `pdflatex` (default), `xelatex`, or `lualatex`. `clean` (default false) deletes `output/` first. `shellEscape` (default false) passes `-shell-escape`. `timeoutSeconds` is 30–1800, default 300, for the whole compile. Returns 202 `{ jobId, status }`. One compile runs per project; while it runs, the first new request is queued (`status: "pending"`) and later requests get the same queued `jobId` |
| GET | `/api/compile/:jobId/status` | `pending`, `compiling`, `complete`, `failed`, or `cancelled`, plus `result` when finished |
| POST | `/api/compile/:jobId/cancel` | Marks the job cancelled. It does not kill the LaTeX process |
| GET | `/api/projects/:id/pdf` | The compiled PDF |

`spawn` is called with `shell: false`. With `latexmk` on PATH the command is `latexmk -pdf|-xelatex|-lualatex -interaction=nonstopmode -synctex=1 -outdir=<project>/output [-shell-escape] <main>`, and auxiliary files are kept between compiles. Without it, the engine runs with `-interaction=nonstopmode -synctex=1 -output-directory=...`, then `biber` or `bibtex` if the main file uses a bibliography, then the engine twice more (once if there is no bibliography). `TEXCRAFT_DISABLE_LATEXMK=1` forces the fallback. Errors are parsed from `output/<main>.log`; each error has the file TeX was reading and the line number. On timeout the whole process tree is killed.

## SyncTeX

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/projects/:id/synctex/forward?file=&line=` | `file` is project-relative. Returns `{ page, rects: [{ x, y, width, height }] }` in PDF points from the page's top-left. 400 if `file` leaves the project, 404 if there is no SyncTeX data yet or the line produced no output |
| GET | `/api/projects/:id/synctex/inverse?page=&x=&y=` | Point in PDF points (top-left origin). Returns `{ file, line }`, project-relative. Only files inside the project are returned, never package files |

Both read `output/<main>.synctex.gz` directly (`apps/backend/src/services/synctexService.ts`); the `synctex` CLI is not needed. Results are checked against the CLI in `src/__tests__/synctexRoutes.test.ts`.

`GET /api/system/latex-check` returns `engines` (pdflatex, xelatex, lualatex), `tools` (latexmk, biber, bibtex, synctex) and `incrementalBuilds` (true when latexmk is used).

Package installs (`apps/backend/src/services/texPackageService.ts`): `manager` is `tlmgr`, `miktex` or `none`. `method` is `install` (TexCraft runs `tlmgr install` or `miktex packages install`: the TeX Live folder is writable, or MiKTeX), `admin` (macOS system TeX Live: `tlmgr` runs through `osascript … with administrator privileges`, which shows the macOS password prompt) or `manual` (Debian/Ubuntu TeX Live in `/usr/share/texlive`, or any other read-only install: show `command`). The install route works the method out again on the server and never takes it from the request. File and package names are checked against strict patterns before anything runs; only the macOS admin path uses a shell, with a validated absolute `tlmgr` path.

Rate limits: 1000 requests per 15 minutes on `/api`, and 10 compile requests per minute on `/api/projects/:id/compile`.

## Not implemented

These appear in older docs and are not routes:

- `/api/v1`
- WebSocket events
- `GET /api/compile/:jobId/logs` as its own route (the log is on the job status `result`)
- `GET /api/projects/:id/preview/:page`
- `POST /api/projects/:id/import`
