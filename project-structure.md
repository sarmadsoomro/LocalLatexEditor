# Project Structure

This document defines the complete repository organization, folder structure, and architectural guidelines for the local LaTeX editor project.

---

## 1. Repository Organization

### Monorepo Architecture

This project uses a monorepo structure to maintain tight coupling between the frontend, backend, and shared code. This approach enables:

- **Atomic changes**: Frontend and backend changes in a single commit
- **Shared types**: Type definitions stay synchronized across the stack
- **Simplified CI/CD**: Single pipeline for the entire application
- **Consistent versioning**: Releases bundle compatible frontend and backend versions

```
latex-editor/
├── apps/
│   ├── frontend/              # React frontend application
│   └── backend/               # Node.js backend API
├── packages/
│   ├── shared-types/          # Shared TypeScript definitions
│   ├── ui-components/         # Reusable UI component library
│   └── latex-utils/           # LaTeX-specific utilities
├── tooling/
│   ├── eslint-config/         # Shared ESLint configurations
│   ├── typescript-config/     # Shared TS configurations
│   └── jest-config/           # Shared test configurations
├── templates/                 # Sample LaTeX projects
├── docs/                      # Project documentation
├── scripts/                   # Build and deployment scripts
├── docker/                    # Docker configurations
├── .github/                   # GitHub workflows and templates
├── package.json              # Root workspace configuration
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml       # PNPM workspace definition
└── README.md
```

### Rationale

| Aspect | Decision | Reasoning |
|--------|----------|-----------|
| Structure | Monorepo | Frontend and backend evolve together; shared compilation logic |
| Tooling | Turborepo + PNPM | Fast builds, efficient caching, workspace-native |
| Shared Code | packages/ | Types, utilities, and components used by both apps |
| Documentation | docs/ | Decoupled from code, versioned separately |

---

## 2. Frontend Folder Structure

The frontend follows a feature-based organization with clear separation of concerns.

### Root Structure

```
apps/frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── manifest.json
│   └── locales/               # i18n translation files
│       ├── en/
│       │   └── translation.json
│       └── zh/
│           └── translation.json
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component
│   ├── index.css             # Global styles
│   ├── vite-env.d.ts         # Vite type declarations
│   ├── components/           # Shared/reusable components
│   ├── features/             # Feature-specific modules
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # State management (Zustand/Redux)
│   ├── services/             # API clients and external services
│   ├── utils/                # Utility functions
│   ├── types/                # Frontend-specific types
│   ├── assets/               # Static assets (images, fonts)
│   └── styles/               # Global styles, themes
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Source Code Organization (src/)

```
src/
├── components/               # Shared, reusable UI components
│   ├── ui/                  # Primitive components (Button, Input, etc.)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── layout/              # Layout components
│   │   ├── Sidebar/
│   │   ├── Toolbar/
│   │   ├── StatusBar/
│   │   └── index.ts
│   └── editor/              # Editor-specific components
│       ├── CodeEditor/
│       ├── PreviewPanel/
│       ├── PdfViewer/
│       └── index.ts
│
├── features/                 # Feature-based modules
│   ├── project/             # Project management feature
│   │   ├── components/      # Feature-specific components
│   │   │   ├── ProjectList.tsx
│   │   │   ├── NewProjectDialog.tsx
│   │   │   └── index.ts
│   │   ├── hooks/           # Feature-specific hooks
│   │   │   ├── useProjects.ts
│   │   │   └── useCreateProject.ts
│   │   ├── services/        # Feature-specific API calls
│   │   │   └── projectApi.ts
│   │   ├── types/           # Feature-specific types
│   │   │   └── project.types.ts
│   │   └── index.ts
│   ├── compilation/         # LaTeX compilation feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── editor-settings/     # Editor preferences feature
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── templates/           # Template management feature
│       ├── components/
│       ├── hooks/
│       └── types/
│
├── hooks/                    # Global custom hooks
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useFileSystem.ts
│   └── index.ts
│
├── stores/                   # State management
│   ├── editorStore.ts       # Editor state (Zustand)
│   ├── projectStore.ts      # Project state
│   ├── settingsStore.ts     # User settings
│   └── index.ts
│
├── services/                 # External service integrations
│   ├── api/                 # API clients
│   │   ├── axiosInstance.ts
│   │   ├── projectApi.ts
│   │   ├── compilationApi.ts
│   │   └── index.ts
│   ├── latex/               # LaTeX-specific services
│   │   ├── syntaxHighlighter.ts
│   │   └── snippetProvider.ts
│   └── filesystem/          # File system operations
│       └── fileService.ts
│
├── utils/                    # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   ├── latex/               # LaTeX utilities
│   │   ├── parser.ts
│   │   ├── linter.ts
│   │   └── helpers.ts
│   └── index.ts
│
├── types/                    # Global TypeScript types
│   ├── api.types.ts
│   ├── editor.types.ts
│   └── index.ts
│
├── assets/                   # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── styles/                   # Global styles
    ├── variables.css
    ├── themes/
    │   ├── light.css
    │   └── dark.css
    └── index.css
```

### Component Structure Pattern

Each component follows a consistent structure:

```
ComponentName/
├── ComponentName.tsx        # Main component
├── ComponentName.test.tsx   # Unit tests
├── ComponentName.stories.tsx # Storybook stories (optional)
├── ComponentName.module.css # Scoped styles (optional)
├── types.ts                 # Component-specific types
└── index.ts                 # Public exports
```

### State Management Location

| State Type | Location | Example |
|------------|----------|---------|
| Global app state | `src/stores/` | `editorStore.ts` |
| Feature state | `src/features/{name}/hooks/` | `useProjects.ts` |
| Server state | `src/services/api/` | React Query/TanStack Query |
| UI state | Component local | `useState()` |
| Form state | Component or feature | React Hook Form |

---

## 3. Backend Folder Structure

The backend follows a layered architecture with clear separation between API, business logic, and data access.

### Root Structure

```
apps/backend/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root NestJS module
│   ├── modules/             # Feature modules
│   ├── common/              # Shared utilities and decorators
│   ├── config/              # Configuration files
│   ├── types/               # Backend-specific types
│   └── utils/               # Utility functions
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── uploads/                 # Temporary upload storage
├── logs/                    # Application logs
├── dist/                    # Compiled output
├── .env.example
├── .eslintrc.js
├── nest-cli.json
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Source Code Organization (src/)

```
src/
├── main.ts                  # Bootstrap and application entry
├── app.module.ts            # Root application module
│
├── modules/                 # Feature modules
│   ├── projects/            # Project management module
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   ├── projects.repository.ts
│   │   ├── dto/
│   │   │   ├── create-project.dto.ts
│   │   │   ├── update-project.dto.ts
│   │   │   └── project-response.dto.ts
│   │   ├── entities/
│   │   │   └── project.entity.ts
│   │   └── __tests__/
│   │       ├── projects.controller.spec.ts
│   │       └── projects.service.spec.ts
│   │
│   ├── compilation/         # LaTeX compilation module
│   │   ├── compilation.module.ts
│   │   ├── compilation.controller.ts
│   │   ├── compilation.service.ts
│   │   ├── compilation.worker.ts
│   │   ├── dto/
│   │   └── __tests__/
│   │
│   ├── files/               # File operations module
│   │   ├── files.module.ts
│   │   ├── files.controller.ts
│   │   ├── files.service.ts
│   │   └── dto/
│   │
│   └── templates/           # Template management module
│       ├── templates.module.ts
│       ├── templates.controller.ts
│       ├── templates.service.ts
│       └── dto/
│
├── common/                  # Shared resources
│   ├── decorators/          # Custom decorators
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/             # Exception filters
│   │   ├── http-exception.filter.ts
│   │   └── latex-error.filter.ts
│   ├── guards/              # Authentication guards
│   │   └── auth.guard.ts
│   ├── interceptors/        # Request/response interceptors
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/               # Validation pipes
│   │   └── validation.pipe.ts
│   └── utils/               # Common utilities
│       ├── file-utils.ts
│       └── latex-utils.ts
│
├── config/                  # Configuration management
│   ├── database.config.ts
│   ├── storage.config.ts
│   ├── latex.config.ts
│   └── app.config.ts
│
├── types/                   # Global TypeScript types
│   ├── express.d.ts
│   └── index.ts
│
└── utils/                   # Utility functions
    ├── logger.ts
    ├── file-helper.ts
    └── latex-helper.ts
```

### Module Organization Pattern

Each feature module follows NestJS conventions:

```
feature-name/
├── feature-name.module.ts       # Module definition
├── feature-name.controller.ts   # HTTP route handlers
├── feature-name.service.ts      # Business logic
├── feature-name.repository.ts   # Data access layer (optional)
├── dto/                         # Data Transfer Objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── feature-response.dto.ts
├── entities/                    # Database entities
│   └── feature.entity.ts
├── interfaces/                  # Module interfaces
│   └── feature.interface.ts
└── __tests__/                   # Module tests
    ├── feature.controller.spec.ts
    └── feature.service.spec.ts
```

### API Routes Structure

| Module | Base Path | Endpoints |
|--------|-----------|-----------|
| Projects | `/api/projects` | GET, POST, PATCH, DELETE |
| Files | `/api/files` | GET, POST, PUT, DELETE |
| Compilation | `/api/compile` | POST (compile), GET (status) |
| Templates | `/api/templates` | GET, POST |

---

## 4. Shared Types and Contracts

Shared definitions live in the `packages/shared-types` workspace to ensure type consistency across frontend and backend.

```
packages/shared-types/
├── src/
│   ├── index.ts              # Public exports
│   ├── api/                  # API contract types
│   │   ├── requests/
│   │   │   ├── project.requests.ts
│   │   │   ├── file.requests.ts
│   │   │   └── compilation.requests.ts
│   │   └── responses/
│   │       ├── project.responses.ts
│   │       ├── file.responses.ts
│   │       └── compilation.responses.ts
│   ├── models/               # Domain models
│   │   ├── project.model.ts
│   │   ├── file.model.ts
│   │   ├── compilation.model.ts
│   │   └── template.model.ts
│   ├── enums/                # Shared enums
│   │   ├── project-status.enum.ts
│   │   ├── file-type.enum.ts
│   │   └── compilation-status.enum.ts
│   └── utils/                # Type utilities
│       └── type-helpers.ts
├── package.json
└── tsconfig.json
```

### Package Structure

```
packages/
├── shared-types/            # TypeScript type definitions
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
│
├── ui-components/           # Reusable UI component library
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
│
└── latex-utils/             # LaTeX-specific utilities
    ├── src/
    ├── dist/
    ├── package.json
    └── tsconfig.json
```

### Shared Types Usage

Types are consumed in both frontend and backend via workspace imports:

```typescript
// Frontend: apps/frontend/src/services/projectApi.ts
import { CreateProjectRequest, ProjectResponse } from "@latex-editor/shared-types";

// Backend: apps/backend/src/projects/projects.controller.ts
import { CreateProjectRequest, ProjectResponse } from "@latex-editor/shared-types";
```

---

## 5. Configuration Folders

Configuration is organized to separate environment-specific settings from application code.

### Root Configuration

```
latex-editor/
├── tooling/
│   ├── eslint-config/
│   │   ├── base.js
│   │   ├── react.js
│   │   ├── node.js
│   │   └── package.json
│   ├── typescript-config/
│   │   ├── base.json
│   │   ├── react.json
│   │   ├── node.json
│   │   └── package.json
│   └── jest-config/
│       ├── base.js
│       ├── react.js
│       └── package.json
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
└── scripts/
    ├── build.sh
    ├── dev.sh
    ├── test.sh
    └── deploy.sh
```

### Frontend Configuration

```
apps/frontend/
├── .env                     # Local environment variables
├── .env.example             # Example environment template
├── .env.production          # Production environment
├── vite.config.ts           # Vite bundler config
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
├── tsconfig.json            # TypeScript config
├── tsconfig.app.json        # App-specific TS config
├── tsconfig.node.json       # Node-specific TS config
└── .eslintrc.cjs            # ESLint config
```

### Backend Configuration

```
apps/backend/
├── src/config/              # Runtime configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── latex.config.ts
│   └── storage.config.ts
│
├── .env                     # Local environment variables
├── .env.example             # Example environment template
├── .env.production          # Production environment
├── nest-cli.json            # NestJS CLI config
├── tsconfig.json            # TypeScript config
├── tsconfig.build.json      # Build-specific TS config
├── jest.config.js           # Jest test config
└── .eslintrc.js             # ESLint config
```

---

## 6. Templates and Examples Folder

Sample projects and LaTeX templates are stored in the root-level `templates/` directory.

```
templates/
├── README.md                # Templates documentation
├── basic/
│   ├── main.tex
│   ├── references.bib
│   └── README.md
├── academic/
│   ├── ieee/
│   │   ├── main.tex
│   │   ├── ieee-template.cls
│   │   └── README.md
│   ├── acm/
│   │   ├── main.tex
│   │   ├── acm-template.cls
│   │   └── README.md
│   └── elsevier/
│       ├── main.tex
│       ├── elsarticle.cls
│       └── README.md
├── resume/
│   ├── modern/
│   │   ├── main.tex
│   │   └── README.md
│   └── classic/
│       ├── main.tex
│       └── README.md
├── presentation/
│   ├── beamer/
│   │   ├── main.tex
│   │   └── README.md
│   └── README.md
├── thesis/
│   ├── main.tex
│   ├── chapters/
│   │   ├── chapter1.tex
│   │   └── chapter2.tex
│   ├── bibliography.bib
│   └── README.md
└── examples/
    ├── math-symbols/
    │   ├── main.tex
    │   └── README.md
    ├── tables/
    │   ├── main.tex
    │   └── README.md
    └── figures/
        ├── main.tex
        └── README.md
```

---

## 7. Test Folders

Tests are organized by type and scope to maintain clarity and enable targeted test execution.

### Frontend Tests

```
apps/frontend/
├── tests/
│   ├── unit/                # Unit tests for utilities, hooks
│   │   ├── utils/
│   │   ├── hooks/
│   │   └── stores/
│   │
│   ├── integration/         # Component integration tests
│   │   ├── components/
│   │   └── features/
│   │
│   ├── e2e/                 # End-to-end Playwright tests
│   │   ├── specs/
│   │   │   ├── project.spec.ts
│   │   │   ├── editor.spec.ts
│   │   │   └── compilation.spec.ts
│   │   ├── fixtures/
│   │   ├── page-objects/
│   │   └── playwright.config.ts
│   │
│   └── setup.ts             # Test setup and utilities
│
└── src/
    ├── components/
    │   └── ui/Button/
    │       ├── Button.tsx
    │       └── Button.test.tsx   # Co-located unit test
    └── features/
        └── project/
            ├── components/
            ├── hooks/
            └── __tests__/       # Feature integration tests
```

### Backend Tests

```
apps/backend/
├── test/
│   ├── unit/                # Unit tests
│   │   ├── modules/
│   │   ├── common/
│   │   └── utils/
│   │
│   ├── integration/         # API integration tests
│   │   ├── projects/
│   │   ├── files/
│   │   └── compilation/
│   │
│   ├── e2e/                 # End-to-end tests
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   │
│   └── setup.ts             # Test utilities and fixtures
│
└── src/
    └── modules/
        └── projects/
            ├── projects.service.ts
            └── __tests__/       # Co-located tests
                ├── projects.controller.spec.ts
                └── projects.service.spec.ts
```

### Test Configuration

| Test Type | Location | Runner | Command |
|-----------|----------|--------|---------|
| Unit | `tests/unit/` or `__tests__/` | Vitest/Jest | `pnpm test:unit` |
| Integration | `tests/integration/` | Vitest/Jest | `pnpm test:integration` |
| E2E Frontend | `tests/e2e/` | Playwright | `pnpm test:e2e` |
| E2E Backend | `test/e2e/` | Jest | `pnpm test:e2e` |

---

## 8. Build and Deployment Folders

Build outputs and deployment artifacts are organized to support multiple environments.

```
latex-editor/
├── apps/
│   ├── frontend/
│   │   ├── dist/            # Vite build output
│   │   ├── dist-ssr/        # SSR build output (if applicable)
│   │   └── .turbo/          # Turborepo cache
│   │
│   └── backend/
│       ├── dist/            # NestJS compiled output
│       └── .turbo/          # Turborepo cache
│
├── packages/
│   ├── shared-types/dist/   # Compiled types
│   ├── ui-components/dist/  # Compiled components
│   └── latex-utils/dist/    # Compiled utilities
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx.conf           # Nginx reverse proxy config
│
├── scripts/
│   ├── build.sh             # Build all packages
│   ├── dev.sh               # Start development environment
│   ├── test.sh              # Run all tests
│   ├── deploy.sh            # Deployment script
│   └── setup.sh             # Initial setup script
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # Continuous integration
│   │   ├── cd.yml           # Continuous deployment
│   │   └── release.yml      # Release automation
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│
└── infrastructure/
    ├── kubernetes/          # K8s manifests (if applicable)
    ├── terraform/           # Infrastructure as code
    └── ansible/             # Server provisioning
```

---

## 9. Documentation Folders

Documentation is organized by audience and purpose to make information easy to find.

```
docs/
├── README.md                # Documentation index
├── architecture/            # Architecture documentation
│   ├── README.md
│   ├── system-overview.md
│   ├── frontend-architecture.md
│   ├── backend-architecture.md
│   └── data-flow.md
│
├── api/                     # API documentation
│   ├── README.md
│   ├── endpoints.md
│   └── authentication.md
│
├── development/             # Developer guides
│   ├── README.md
│   ├── getting-started.md
│   ├── development-workflow.md
│   ├── testing-guide.md
│   └── contributing.md
│
├── deployment/              # Deployment guides
│   ├── README.md
│   ├── local-deployment.md
│   ├── docker-deployment.md
│   └── production-checklist.md
│
├── user-guide/              # End-user documentation
│   ├── README.md
│   ├── installation.md
│   ├── quick-start.md
│   ├── features/
│   │   ├── projects.md
│   │   ├── editor.md
│   │   ├── compilation.md
│   │   └── templates.md
│   └── troubleshooting.md
│
├── templates/               # Document templates
│   ├── adr-template.md      # Architecture Decision Record
│   ├── prd-template.md      # Product Requirements Doc
│   └── bug-report-template.md
│
└── diagrams/                # Architecture diagrams
    ├── system-architecture.png
    ├── data-flow.png
    └── component-diagram.png
```

---

## 10. Suggested Naming Conventions

### File and Folder Naming Rules

| Element | Convention | Example |
|---------|------------|---------|
| Folders | kebab-case | `project-management/`, `ui-components/` |
| React components | PascalCase | `ProjectList.tsx`, `CodeEditor.tsx` |
| Regular files | camelCase | `useProjects.ts`, `projectApi.ts` |
| Utility files | camelCase | `formatters.ts`, `validators.ts` |
| Test files | `.test.ts` or `.spec.ts` | `Button.test.tsx`, `projects.service.spec.ts` |
| Type definition files | `.types.ts` | `project.types.ts` |
| Style files | `.module.css` or `.css` | `Button.module.css` |
| Config files | lowercase | `vite.config.ts`, `tsconfig.json` |
| Environment files | uppercase | `.env`, `.env.production` |

### Naming Patterns by Type

```
# Components
ComponentName/              # Folder
├── ComponentName.tsx       # Main file (matches folder)
├── ComponentName.test.tsx  # Test file
└── index.ts                # Public export

# Features (frontend)
featureName/                # Folder
├── components/             # Sub-components
├── hooks/                  # Feature hooks
│   └── useFeatureName.ts
├── services/
│   └── featureApi.ts
└── types/
    └── feature.types.ts

# Modules (backend)
feature-name/               # Folder
├── feature-name.module.ts
├── feature-name.controller.ts
├── feature-name.service.ts
├── feature-name.repository.ts
├── dto/
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── feature-response.dto.ts
└── entities/
    └── feature.entity.ts

# Tests
tests/
├── unit/
│   └── utils/
│       └── formatters.test.ts
├── integration/
│   └── features/
│       └── project.integration.test.ts
└── e2e/
    └── specs/
        └── project.spec.ts
```

### Import Organization

Organize imports in the following order:

```typescript
// 1. External dependencies
import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";

// 2. Internal absolute imports (aliases)
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/features/project/hooks";

// 3. Internal relative imports
import { ProjectCard } from "./ProjectCard";
import { styles } from "./ProjectList.module.css";

// 4. Type-only imports
import type { Project } from "@latex-editor/shared-types";
```

---

## 11. Suggested Module Boundaries

### Frontend Module Boundaries

```
Layer Structure (top-down dependency):

┌─────────────────────────────────────┐
│  Pages / Routes                     │  Top level: composes features
├─────────────────────────────────────┤
│  Features                           │  Business logic, domain-specific
├─────────────────────────────────────┤
│  Components (Shared)                │  Reusable UI primitives
├─────────────────────────────────────┤
│  Services / Utils                   │  Infrastructure, external APIs
├─────────────────────────────────────┤
│  Types / Constants                  │  Foundation, no dependencies
└─────────────────────────────────────┘
```

### Dependency Rules

| Layer | Can Import From | Cannot Import From |
|-------|----------------|-------------------|
| Pages | Features, Components, Services, Utils, Types | - |
| Features | Components, Services, Utils, Types | Pages, other Features |
| Components | Utils, Types | Features, Pages, Services |
| Services | Utils, Types | Components, Features, Pages |
| Utils | Types | Components, Services, Features |
| Types | - | Anything |

### Backend Module Boundaries

```
Layer Structure (NestJS architecture):

┌─────────────────────────────────────┐
│  Controllers                        │  HTTP layer: routes, validation
├─────────────────────────────────────┤
│  Services                           │  Business logic, orchestration
├─────────────────────────────────────┤
│  Repositories                       │  Data access abstraction
├─────────────────────────────────────┤
│  Entities / DTOs                    │  Data models, contracts
├─────────────────────────────────────┤
│  Common / Utils                     │  Cross-cutting concerns
└─────────────────────────────────────┘
```

### Feature Module Boundaries

Each feature module should be:

- **Self-contained**: All code for a feature lives in one place
- **Independently testable**: Can be tested without other features
- **Loosely coupled**: Minimize imports from other features
- **Well-defined API**: Clear public exports via `index.ts`

```typescript
// Good: Feature imports through public API
import { useProjects, ProjectList } from "@/features/project";

// Avoid: Deep imports into feature internals
import { useProjects } from "@/features/project/hooks/useProjects";
import { ProjectList } from "@/features/project/components/ProjectList";
```

### Boundary Enforcement

Use ESLint rules to enforce module boundaries:

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          // Prevent features from importing from other features directly
          {
            target: "./src/features/project",
            from: "./src/features/compilation",
            message: "Project feature should not import from Compilation feature",
          },
        ],
      },
    ],
  },
};
```

---

## Summary

This project structure provides:

1. **Clear separation**: Frontend, backend, and shared code are organized distinctly
2. **Feature-based organization**: Code grouped by feature rather than type
3. **Scalability**: Structure supports growth from small to large teams
4. **Maintainability**: Consistent patterns make code predictable
5. **Testability**: Clear boundaries enable comprehensive testing
6. **Developer experience**: Logical organization reduces cognitive load

For questions or improvements to this structure, refer to the architecture documentation in `docs/architecture/`.
