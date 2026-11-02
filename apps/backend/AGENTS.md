# BACKEND KNOWLEDGE BASE

**Scope:** Express API Server
**Port:** 3001
**Entry:** `src/index.ts`

---

## OVERVIEW

Express + TypeScript API handling project management, file operations, and LaTeX compilation. Uses Zod for validation, Pino for logging.

---

## STRUCTURE

```
apps/backend/
├── src/
│   ├── routes/
│   │   ├── projects.ts     # /api/projects, trash, status, rename, main-file, export
│   │   ├── files.ts        # /api/projects/:id/files/* (read, write, create, upload, rename, move, delete)
│   │   ├── compilation.ts  # compile, job status, PDF, LaTeX check
│   │   ├── synctex.ts      # /api/projects/:id/synctex/{forward,inverse}
│   │   └── import.ts       # /api/import-zip
│   ├── services/           # compilationService, compileQueue, jobStore, logParser,
│   │                       # projectService, fileSystemService, synctexService,
│   │                       # exportService, trashService, cleanupService, templates
│   ├── middleware/         # requireApiToken, requireLoopbackHost, validate, errorHandler
│   ├── validators/         # Zod schemas
│   ├── config/             # storage paths, session token
│   ├── types/              # AppError and friends, response helpers
│   └── index.ts            # createApp(token, port), startServer()
└── package.json
```

---

## WHERE TO LOOK

| Task               | Location                | Notes                      |
| ------------------ | ----------------------- | -------------------------- |
| Add endpoint       | `src/routes/*.ts`       | Mount in `index.ts`        |
| Add business logic | `src/services/`         | Pure functions, no req/res |
| Add middleware     | `src/middleware/`       | Error handling, validation |
| Add validation     | `src/validators/`       | Zod schemas                |
| Storage config     | `src/config/storage.ts` | Project paths              |

---

## CONVENTIONS

### Route Pattern

```typescript
// routes/projects.ts
const router = Router();
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await listProjects();
    res.json(createSuccessResponse({ projects }));
  }),
);
```

### Error Handling

- Always use `next(error)` in catch blocks
- Custom errors: `ValidationError`, `NotFoundError`, `ConflictError`
- Global error handler in `src/middleware/errorHandler.ts`

### Security

- **NEVER** use `shell: true` in spawn
- Validate all inputs with Zod
- Path traversal protection via path validation

---

## ANTI-PATTERNS

1. **No req/res in services** — Keep business logic pure
2. **No string path concat** — Always use `path.join()`
3. **No shell execution** — `shell: false` always
4. **No write18** — Shell escape disabled

---

## API ROUTES

See [docs/api-and-internal-contracts.md](../../docs/api-and-internal-contracts.md). `POST /api/import` is not a route. Zip import is `POST /api/import-zip`. Folder import is `POST /api/projects/import`.

---

## COMMANDS

```bash
cd apps/backend
pnpm dev           # tsx watch (port 3001)
pnpm build         # tsc compile
pnpm start         # node dist/index.js
pnpm test:unit     # Vitest tests
```

---

## NOTES

- Projects stored in `~/.latex-editor/projects/` (`LATEX_EDITOR_PROJECTS_DIR` overrides this)
- `app.listen` binds to `127.0.0.1` unless `HOST` is set. A non-loopback `HOST` logs an error
- `shell: false` on compile spawn. `-shell-escape` is passed only when the request sets `shellEscape: true` (settings toggle, default off)
- Compiles use latexmk when installed, else manual passes. Real-TeX tests: `src/__tests__/compile.test.ts` (skipped without TeX; CI's `compile` job sets `TEXCRAFT_REQUIRE_TEX=1`)
- Route list: [docs/api-and-internal-contracts.md](../../docs/api-and-internal-contracts.md)
