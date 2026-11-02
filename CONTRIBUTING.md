# Contributing to TexCraft

Thanks for helping. Bug reports, fixes, templates, docs and features are all welcome.

- [Reporting bugs and ideas](#reporting-bugs-and-ideas)
- [Setting up](#setting-up)
- [How the code is organised](#how-the-code-is-organised)
- [Making a change](#making-a-change)
- [Tests](#tests)
- [Rules that keep TexCraft safe](#rules-that-keep-texcraft-safe)
- [Sending a pull request](#sending-a-pull-request)
- [Releasing](#releasing)

## Reporting bugs and ideas

[Open an issue](https://github.com/sarmadsoomro/TexCraft/issues/new/choose) and pick **Bug report** or **Feature request**. For a bug, the backend log (**Help → Show Log File** in the desktop app) and your OS and LaTeX version save a lot of back-and-forth.

Security problems: see [SECURITY.md](SECURITY.md). Please do not open a public issue.

For a large change, open an issue first so we can agree on the approach before you write it.

## Setting up

You need:

- Node.js **20.19+** (or 22.12+). The backend loads the ESM `shared-types` package with `require()`, which older Node versions cannot do.
- pnpm 8 (`npm install -g pnpm`; the repo pins `pnpm@8.15.0` in `packageManager`)
- Git
- A LaTeX distribution with `pdflatex` and `latexmk`, to compile anything and to run the compile tests

```bash
git clone https://github.com/<you>/TexCraft.git
cd TexCraft
git remote add upstream https://github.com/sarmadsoomro/TexCraft.git
pnpm install
pnpm dev
```

`pnpm dev` starts the frontend on http://localhost:3000 and the backend on http://127.0.0.1:3001, both reloading on change. Open the frontend URL.

| Command | Does |
| --- | --- |
| `pnpm dev` | Frontend and backend with hot reload |
| `pnpm desktop` | The Electron app from source (downloads Electron the first time) |
| `pnpm build` | Build every package |
| `pnpm lint` | ESLint, zero warnings allowed |
| `pnpm typecheck` | `tsc --noEmit` everywhere |
| `pnpm test` | Vitest in every package |
| `pnpm --filter texcraft-desktop dist` | Installers for your OS in `apps/desktop/release/` (run `pnpm build` first) |

`pnpm install` does not download Electron, so the web app stays light. See [docs/desktop-app.md](docs/desktop-app.md).

## How the code is organised

```
apps/
  frontend/        React 18 + Vite, Monaco, react-pdf, Zustand, Tailwind
  backend/         Express API: projects, files, compile, SyncTeX, import/export
  desktop/         Electron shell, bundled with esbuild; installers via electron-builder
packages/
  shared-types/    Types and helpers used by frontend and backend (ESM)
tooling/           Shared ESLint and TypeScript configs
scripts/           Setup and start scripts for running from source
docs/              User and developer docs (docs/archive/ holds old plans)
```

| To change | Look in |
| --- | --- |
| A screen or component | `apps/frontend/src/pages/`, `apps/frontend/src/components/` |
| State | `apps/frontend/src/stores/` (Zustand) |
| API calls from the page | `apps/frontend/src/services/` |
| An API route | `apps/backend/src/routes/`, logic in `apps/backend/src/services/`, request validation in `apps/backend/src/validators/` (Zod) |
| How LaTeX runs | `apps/backend/src/services/compilationService.ts` |
| Error parsing | `apps/backend/src/services/logParser.ts` |
| Where projects are stored | `apps/backend/src/config/storage.ts` |
| The desktop window, menu, PATH | `apps/desktop/src/` |
| Routes that exist | [docs/api-and-internal-contracts.md](docs/api-and-internal-contracts.md) |

The code is the reference. The plans in `docs/archive/` are from April 2026 and describe features that were never built or were built differently.

## Making a change

1. Branch from an up-to-date `main`:

   ```bash
   git fetch upstream
   git checkout -b fix/compile-timeout upstream/main
   ```

   Prefixes: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.

2. Make the change. Conventions:

   | Element | Convention | Example |
   | --- | --- | --- |
   | Folders | kebab-case | `project-management/` |
   | React components | PascalCase | `ProjectList.tsx` |
   | Other files | camelCase | `useProjects.ts` |
   | Tests | `*.test.ts(x)` in `__tests__/` | `__tests__/mainFile.test.ts` |

   - Match the style of the file you are in (quotes, semicolons). `pnpm lint` must pass with no warnings.
   - TypeScript is strict. Avoid `any`; give exported functions explicit return types.
   - Backend errors: throw `ValidationError`, `NotFoundError`, `ConflictError` or `AppError` and pass them to `next(error)`. The error handler turns them into JSON with the right status.
   - Frontend API calls go through `src/services/`, which adds the session token.
   - In `packages/shared-types`, relative imports end in `.js` (it is an ES module).

3. Update the docs in the same pull request when behaviour changes: the [user guide](docs/user-guide.md) for anything a student sees, [api-and-internal-contracts.md](docs/api-and-internal-contracts.md) for routes, and [CHANGELOG.md](CHANGELOG.md) under **Unreleased**.

4. Commit in [Conventional Commits](https://www.conventionalcommits.org/) style: `type(scope): what changed`, imperative, under 72 characters, with the why in the body.

   ```
   fix(backend): keep the token placeholder in production builds
   feat: jump between the PDF and the source
   docs: describe how import picks the main file
   ```

## Tests

```bash
pnpm test                                   # everything
pnpm --filter texcraft-backend test         # one package
cd apps/backend && pnpm exec vitest run src/__tests__/mainFile.test.ts
```

- Unit and route tests use Vitest. Route tests use `supertest` against `createApp(token, port)` with a temporary `LATEX_EDITOR_PROJECTS_DIR`; see `apps/backend/src/__tests__/mainFile.test.ts`.
- `compile.test.ts` and `synctexRoutes.test.ts` run real LaTeX and are **skipped** when `pdflatex` or `latexmk` is missing. CI's `compile` job sets `TEXCRAFT_REQUIRE_TEX=1` so they fail instead. `TEXCRAFT_DISABLE_LATEXMK=1` tests the fallback without latexmk.
- Tests run on Linux, macOS and Windows in CI. Use `path.join`, avoid fixed ports (let the OS pick one with `listen(0)`), and skip symlink tests on Windows.
- For UI changes, describe what you checked in the browser, with a screenshot.

## Rules that keep TexCraft safe

These are checked in review:

- Never pass `shell: true` to `spawn`, and never build a command line as one string.
- Never pass `-shell-escape` unless the user turned on the Shell escape setting.
- Listeners bind to `127.0.0.1`. Never call `listen` without that host.
- Every new `/api` route sits behind the token and Host checks (mounting under `/api` does that). Validate input with Zod.
- Build paths with `path.join` and check that they stay inside the project folder. See `resolveProjectFilePath` in `routes/files.ts`.
- No requests from the page to other sites: no CDNs, web fonts or analytics. Bundle assets instead.
- In the desktop app, keep `contextIsolation` and `sandbox` on and `nodeIntegration` off.

Background: [SECURITY.md](SECURITY.md).

## Sending a pull request

Before pushing:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Open the pull request against `main` and fill in the template. CI runs:

- **CI**: lint, typecheck and tests on Ubuntu, macOS and Windows, and a `compile` job with a real TeX Live.
- **Desktop app** (when `apps/`, `packages/` or the lockfile change): builds the installers on all three OS and launches each one once. The installers are attached to the run as artifacts, so reviewers can try your change.

Keep pull requests focused: one fix or feature each. The maintainer reviews and merges; all checks must be green.

## Releasing

Maintainers only. Update `CHANGELOG.md`, then tag:

```bash
git tag v0.4.0
git push origin v0.4.0
```

The workflow builds every installer and creates a draft GitHub Release. See [docs/desktop-app.md](docs/desktop-app.md#releasing).

## License

By contributing you agree that your work is released under the [MIT License](LICENSE).
