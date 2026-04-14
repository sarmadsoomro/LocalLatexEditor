# Contributing to Local LaTeX Editor

Thank you for your interest in contributing to Local LaTeX Editor! This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Conventions](#coding-conventions)
- [Making Changes](#making-changes)
- [Submitting Contributions](#submitting-contributions)
- [Code Review Process](#code-review-process)
- [Security Guidelines](#security-guidelines)

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- pnpm 8+ installed (`npm install -g pnpm`)
- Git configured with your user name and email
- LaTeX distribution (TeX Live, MiKTeX, or MacTeX) for full functionality

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_FORK/LocalLatexEditor.git
   cd LocalLatexEditor
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/sarmadsoomro/LocalLatexEditor.git
   ```

## Development Setup

### Install Dependencies

```bash
pnpm install
```

### Start Development

```bash
pnpm dev
```

This starts:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

### Verify Setup

Run the full check to ensure everything is working:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Project Structure

```
LatexEditor/
├── apps/
│   ├── frontend/            # React + Vite frontend (port 3000)
│   └── backend/             # Express API (port 3001)
├── packages/
│   └── shared-types/        # Shared TypeScript types
├── tooling/
│   ├── eslint-config/       # Shared ESLint configs
│   └── typescript-config/   # Shared TS configs
├── docs/                    # Documentation
├── package.json             # Root monorepo config
└── turbo.json               # Turborepo pipeline
```

### Module Boundaries

Follow these import rules to maintain code organization:

| Import From | Can Import |
|-------------|-----------|
| Features | Utils, Types, Components (not other Features, Pages, Services) |
| Components | Utils, Types (not Features, Pages, Services) |
| Services | Utils, Types (not Components, Features, Pages) |
| Utils | Types (not Components, Services, Features) |
| Types | Nothing (no dependencies) |

## Coding Conventions

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Folders | kebab-case | `project-management/` |
| React components | PascalCase | `ProjectList.tsx` |
| Files | camelCase | `useProjects.ts` |
| Tests | `.test.ts` suffix | `Button.test.tsx` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

### TypeScript Guidelines

- Use strict TypeScript configuration
- Explicit return types on exported functions
- No `any` types without justification
- Prefer interfaces over type aliases for object shapes
- Use discriminated unions for complex state

### Code Style

- Use single quotes for strings
- 2-space indentation
- Max line length: 100 characters
- Trailing commas in multi-line objects/arrays
- Semicolons required

### Error Handling

- Always use `next(error)` in Express catch blocks
- Throw custom errors: `ValidationError`, `NotFoundError`, `ConflictError`
- Don't swallow errors silently
- Log errors with context using Pino logger

## Making Changes

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/file-tree-component`)
- `fix/` - Bug fixes (e.g., `fix/compilation-timeout`)
- `docs/` - Documentation updates (e.g., `docs/api-examples`)
- `refactor/` - Code refactoring (e.g., `refactor/project-store`)

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes

**Examples:**
```
feat(frontend): add keyboard navigation to FileTree

fix(backend): resolve race condition in compilation queue

docs: update API endpoint documentation
```

### Writing Tests

- Place tests in `__tests__` directories alongside source
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Aim for high coverage on business logic
- Mock external dependencies appropriately

Example test structure:
```typescript
describe('projectService', () => {
  describe('createProject', () => {
    it('should create project with valid name', async () => {
      // Test implementation
    });

    it('should throw ValidationError for invalid name', async () => {
      // Test implementation
    });
  });
});
```

## Submitting Contributions

### Before Submitting

1. Sync with upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Run quality checks:
   ```bash
   pnpm lint
   pnpm format
   pnpm typecheck
   pnpm test:unit
   ```

3. Ensure your branch is up to date and conflicts are resolved

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a pull request against `main`

3. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (for UI changes)

### PR Title Format

```
<type>: Brief description
```

Examples:
- `feat: Add drag-and-drop file upload`
- `fix: Resolve PDF preview caching issue`
- `docs: Update contributing guidelines`

## Code Review Process

### For Contributors

- Respond to review comments promptly
- Make requested changes in new commits
- Request re-review when ready
- Resolve conversations only after addressing feedback

### For Reviewers

- Focus on correctness, clarity, and maintainability
- Be constructive and specific in feedback
- Approve when changes meet project standards
- Check security implications for backend changes

### Merge Requirements

- All CI checks must pass
- At least one approving review
- No unresolved conversations
- Branch is up to date with main

## Security Guidelines

### Backend Security

- **Never** use `shell: true` in `child_process.spawn()`
- **Never** enable `write18` in LaTeX compilation
- Validate all inputs with Zod schemas
- Use path traversal protection (always use `path.join()`)
- Bind services to localhost only (127.0.0.1)
- Run LaTeX compilation with user-level privileges only

### Data Privacy

- User documents never leave the local machine
- Don't log sensitive file paths or content
- No cloud dependencies for document processing

### Dependencies

- Pin dependency versions in package.json
- Review security advisories before adding packages
- Prefer well-maintained packages with active communities

## Questions?

- Check existing documentation in `docs/` directory
- Search closed issues and PRs for similar questions
- Open a new issue for discussion

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Local LaTeX Editor better!
