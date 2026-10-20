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
│   ├── routes/             # Express route handlers
│   │   ├── projects.ts    # /api/projects/*
│   │   ├── files.ts       # /api/projects/:id/files/*
│   │   ├── compilation.ts # /api/projects/:id/compile
│   │   └── import.ts      # /api/import/*
│   ├── services/          # Business logic
│   │   ├── projectService.ts
│   │   ├── compilationService.ts
│   │   └── fileSystemService.ts
│   ├── middleware/        # Express middleware
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── validators/        # Zod schemas
│   ├── types/            # TypeScript types
│   ├── config/           # Configuration
│   └── index.ts          # Server entry
├── package.json
└── tsconfig.json
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
- `app.listen(PORT)` does not bind to `127.0.0.1`
- `shell: false` on compile spawn. `-shell-escape` is not passed. The settings toggle is ignored
- Route list: [docs/api-and-internal-contracts.md](../../docs/api-and-internal-contracts.md)
