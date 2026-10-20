# API

What the backend actually serves. Base URL is `http://localhost:3001`. There is no `/api/v1` prefix and no WebSocket.

The frontend dev server is on port 3000 and proxies `/api` to port 3001.

Success responses use `{ success: true, data }`, except `PUT /api/projects/:id/files/:path`, which returns 204 with an empty body. Errors go through the shared error handler.

There is no authentication. `app.listen(PORT)` does not pass a host, so the process accepts connections on every interface.

Project ids look like `proj_` plus letters, digits, `_`, or `-`.

Project files live in `~/.latex-editor/projects/<id>`, or `LATEX_EDITOR_PROJECTS_DIR` if that is set. Import copies into that directory. It does not write back to the source folder.

## Health and system

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | `{ status, timestamp }` |
| GET | `/api/system/latex-check` | Whether a LaTeX engine is on `PATH` |

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
| DELETE | `/api/projects/:id` | Move to trash |
| POST | `/api/projects/:id/restore` | Restore from trash |
| DELETE | `/api/projects/:id/permanent` | Delete the copy on disk |
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
| POST | `/api/import-zip` | Multipart field `file` (`.zip`, `.tex`, `.bib`, `.cls`, `.sty`), body field `name`. 100 MB limit |

## Compile

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/projects/:id/compile` | Body `{ engine?, mainFile? }`. Engine is `pdflatex` (default), `xelatex`, or `lualatex`. Returns 202 `{ jobId, status }`. The job runs after the response |
| GET | `/api/compile/:jobId/status` | `pending`, `compiling`, `complete`, `failed`, or `cancelled`, plus `result` when finished |
| POST | `/api/compile/:jobId/cancel` | Marks the job cancelled. It does not kill the LaTeX process |
| GET | `/api/projects/:id/pdf` | The compiled PDF |

`spawn` is called with `shell: false`. The argument list is `-interaction=nonstopmode`, `-halt-on-error`, `-output-directory=...`, and the main file. `-shell-escape` is never passed. A `shellEscape` flag in the settings UI is not read here.

Rate limits: 1000 requests per 15 minutes on `/api`, and 10 compile requests per minute on `/api/projects/:id/compile`.

## Not implemented

These appear in older docs and are not routes:

- `/api/v1`
- WebSocket events
- `GET /api/compile/:jobId/logs` as its own route (the log is on the job status `result`)
- `GET /api/projects/:id/preview/:page`
- `POST /api/projects/:id/import`
