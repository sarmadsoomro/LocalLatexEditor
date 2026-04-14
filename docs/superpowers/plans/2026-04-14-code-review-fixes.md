# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and important issues identified in the code review.

**Architecture:** Fix each issue in isolation with proper verification before moving to the next task.

**Tech Stack:** TypeScript, ESLint, Vitest, Express

---

## Task 1: Fix ESLint Configuration (Critical)

**Files:**
- Modify: `tooling/eslint-config/base.js`
- Modify: `tooling/eslint-config/package.json`
- Modify: `apps/backend/.eslintrc.cjs` (if exists)

- [ ] **Step 1: Add missing eslint-import-resolver-typescript dependency**

Modify `tooling/eslint-config/package.json`:
```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-import-resolver-typescript": "^3.6.1"
  }
}
```

- [ ] **Step 2: Update base ESLint config to use typescript resolver**

Modify `tooling/eslint-config/base.js`:
```javascript
const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project,
    tsconfigRootDir: process.cwd(),
  },
  plugins: ["@typescript-eslint", "import"],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project,
      },
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: "./apps/frontend/src/features",
            from: "./apps/frontend/src/features",
            except: ["./[^/]+/index.ts"],
            message: "Features should not import from other features directly. Use the shared types or services layer instead.",
          },
        ],
      },
    ],
  },
  ignorePatterns: ["node_modules/", "dist/", "build/", ".turbo/"],
};
```

- [ ] **Step 3: Reinstall dependencies and verify ESLint**

Run: `cd tooling/eslint-config && pnpm install && cd ../.. && pnpm install && pnpm lint 2>&1 | tail -20`

Expected: ESLint errors should be significantly reduced (only actual code issues, not resolver failures)

---

## Task 2: Fix Frontend API Tests (Critical)

**Files:**
- Modify: `apps/frontend/src/__tests__/services/api.test.ts`
- Modify: `apps/frontend/src/services/api.ts`

- [ ] **Step 1: Fix apiClient to handle mock properly**

The issue is that the `apiClient` adds `Content-Type: application/json` header automatically, but tests don't expect it for GET requests.

Modify `apps/frontend/src/services/api.ts` to only add Content-Type for requests with bodies:
```typescript
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const hasBody = options.body !== undefined;
  
  const config: RequestInit = {
    headers: hasBody ? {
      'Content-Type': 'application/json',
      ...options.headers,
    } : options.headers,
    ...options,
  };

  const response = await fetch(url, config);
  // ... rest unchanged
}
```

- [ ] **Step 2: Fix the test mock setup**

The tests need to properly handle the Response object. Update the test file:

Modify `apps/frontend/src/__tests__/services/api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

afterEach(() => {
  mockFetch.mockReset();
});

describe('apiClient', () => {
  it('should make GET request and return data', async () => {
    const { apiClient } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1', name: 'Test' }, error: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const result = await apiClient<{ id: string; name: string }>('/api/projects');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('should make POST request with body', async () => {
    const { apiClient } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1' }, error: null };
    const requestBody = { name: 'New Project' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await apiClient('/api/projects', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('should throw ApiError on unsuccessful response with error data', async () => {
    const { apiClient, ApiError } = await import('../../services/api');
    const errorData = {
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'name' },
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve(errorData),
    });

    await expect(apiClient('/api/projects')).rejects.toThrow(ApiError);
    await expect(apiClient('/api/projects')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      statusCode: 400,
    });
  });

  it('should throw ApiError on HTTP error without JSON body', async () => {
    const { apiClient, ApiError } = await import('../../services/api');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(apiClient('/api/projects')).rejects.toThrow(ApiError);
    await expect(apiClient('/api/projects')).rejects.toMatchObject({
      code: 'HTTP_500',
      message: 'Internal Server Error',
      statusCode: 500,
    });
  });

  it('should throw ApiError when response indicates failure in body', async () => {
    const { apiClient, ApiError } = await import('../../services/api');
    const errorData = {
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found',
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(errorData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await expect(apiClient('/api/projects/123')).rejects.toThrow(ApiError);
    await expect(apiClient('/api/projects/123')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Project not found',
    });
  });
});

describe('api convenience methods', () => {
  it('api.get should call apiClient with GET method', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: [], error: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.get('/api/projects');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('api.post should call apiClient with POST method and body', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1' }, error: null };
    const body = { name: 'New Project' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.post('/api/projects', body);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
  });

  it('api.put should call apiClient with PUT method and body', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1' }, error: null };
    const body = { name: 'Updated Project' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.put('/api/projects/1', body);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
      })
    );
  });

  it('api.delete should call apiClient with DELETE method', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: null, error: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.delete('/api/projects/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
```

- [ ] **Step 3: Run tests to verify fix**

Run: `cd apps/frontend && pnpm test:unit -- --run src/__tests__/services/api.test.ts`

Expected: All 9 tests pass

---

## Task 3: Fix CORS Configuration (Critical)

**Files:**
- Modify: `apps/backend/src/index.ts`

- [ ] **Step 1: Restrict CORS to frontend origin**

Modify `apps/backend/src/index.ts`:
```typescript
import express from "express";
import cors from "cors";
import pino from "pino";
import projectRoutes from "./routes/projects.js";
import importRoutes from "./routes/import.js";
import compilationRoutes, {
  compilationJobRouter,
  projectPdfRouter,
  systemCheckRouter,
} from "./routes/compilation.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ensureStorageDirectories } from "./config/storage.js";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/projects", projectRoutes);
app.use("/api/projects/:id", compilationRoutes);
app.use("/api/projects/:id", projectPdfRouter);
app.use("/api/compile", compilationJobRouter);
app.use("/api", systemCheckRouter);
app.use("/api", importRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await ensureStorageDirectories();
    logger.info("Storage directories initialized");

    app.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
```

- [ ] **Step 2: Verify the change**

Run: `cd apps/backend && pnpm build && echo "Build successful"`

---

## Task 4: Fix Non-Atomic Project Metadata Writes (Critical)

**Files:**
- Modify: `apps/backend/src/services/projectService.ts`

- [ ] **Step 1: Implement atomic write for projects.json**

Modify `apps/backend/src/services/projectService.ts` to use write-to-temp + rename pattern:

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type {
  ProjectWithMetadata,
  CreateProjectRequest,
  FileNode,
  Template,
} from '@local-latex-editor/shared-types';
import { storageConfig, getProjectPath } from '../config/storage.js';
import { buildFileTree, getProjectStats } from './fileSystemService.js';
import { getTemplate } from './templates.js';
import { ValidationError, NotFoundError, ConflictError } from '../types/error.js';

const PROJECTS_METADATA_FILE = path.join(storageConfig.projectsDir, '..', 'projects.json');
const PROJECTS_CACHE_TTL_MS = 3000;

interface StoredProject extends ProjectWithMetadata {}

let projectsMetadataCache: StoredProject[] | null = null;
let projectsMetadataCacheAt = 0;

async function loadProjectsMetadata(forceRefresh = false): Promise<StoredProject[]> {
  const cachedProjects = projectsMetadataCache;
  const cacheIsFresh =
    !forceRefresh &&
    cachedProjects !== null &&
    Date.now() - projectsMetadataCacheAt < PROJECTS_CACHE_TTL_MS;

  if (cacheIsFresh && cachedProjects) {
    return cachedProjects;
  }

  try {
    const data = await fs.readFile(PROJECTS_METADATA_FILE, 'utf-8');
    const parsed = JSON.parse(data) as StoredProject[];
    projectsMetadataCache = parsed;
    projectsMetadataCacheAt = Date.now();
    return parsed;
  } catch {
    projectsMetadataCache = [];
    projectsMetadataCacheAt = Date.now();
    return [];
  }
}

async function saveProjectsMetadata(projects: StoredProject[]): Promise<void> {
  await fs.mkdir(path.dirname(PROJECTS_METADATA_FILE), { recursive: true });
  
  const tempFile = `${PROJECTS_METADATA_FILE}.tmp.${nanoid()}`;
  const jsonContent = JSON.stringify(projects, null, 2);
  
  try {
    await fs.writeFile(tempFile, jsonContent, 'utf-8');
    await fs.rename(tempFile, PROJECTS_METADATA_FILE);
    projectsMetadataCache = projects;
    projectsMetadataCacheAt = Date.now();
  } catch (error) {
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw error;
  }
}

// ... rest of the file unchanged
```

- [ ] **Step 2: Verify the change compiles**

Run: `cd apps/backend && pnpm build && echo "Build successful"`

---

## Task 5: Fix In-Memory Job Storage (Critical)

**Files:**
- Modify: `apps/backend/src/routes/compilation.ts`
- Create: `apps/backend/src/services/jobStore.ts`

- [ ] **Step 1: Create job persistence service**

Create `apps/backend/src/services/jobStore.ts`:
```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export interface JobStatus {
  jobId: string;
  projectId: string;
  status: 'pending' | 'compiling' | 'complete' | 'failed' | 'cancelled';
  progress: number;
  result?: {
    success: boolean;
    outputPath?: string;
    logOutput: string;
    errors: Array<{
      line: number;
      column: number;
      message: string;
      type: 'error' | 'warning';
    }>;
    warnings: Array<{
      line: number;
      column: number;
      message: string;
      type: 'error' | 'warning';
    }>;
    duration: number;
  };
  createdAt: Date;
}

const JOBS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.local-latex-editor', 'jobs');
const JOBS_INDEX_FILE = path.join(JOBS_DIR, 'index.json');

class JobStore {
  private memoryCache: Map<string, JobStatus> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(JOBS_DIR, { recursive: true });
      await this.loadIndex();
      this.initialized = true;
    } catch {
      this.initialized = true;
    }
  }

  private async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(JOBS_INDEX_FILE, 'utf-8');
      const jobs: JobStatus[] = JSON.parse(data);
      for (const job of jobs) {
        job.createdAt = new Date(job.createdAt);
        this.memoryCache.set(job.jobId, job);
      }
    } catch {
      // Index doesn't exist yet, that's fine
    }
  }

  private async persistIndex(): Promise<void> {
    const jobs = Array.from(this.memoryCache.values());
    const tempFile = path.join(JOBS_DIR, `index.tmp.${nanoid()}`);
    await fs.writeFile(tempFile, JSON.stringify(jobs, null, 2), 'utf-8');
    await fs.rename(tempFile, JOBS_INDEX_FILE);
  }

  async set(jobId: string, job: JobStatus): Promise<void> {
    this.memoryCache.set(jobId, job);
    await this.persistIndex();
  }

  async get(jobId: string): Promise<JobStatus | undefined> {
    return this.memoryCache.get(jobId);
  }

  async delete(jobId: string): Promise<void> {
    this.memoryCache.delete(jobId);
    await this.persistIndex();
  }

  async getAll(): Promise<JobStatus[]> {
    return Array.from(this.memoryCache.values());
  }

  async cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [jobId, job] of this.memoryCache.entries()) {
      const jobAge = now - new Date(job.createdAt).getTime();
      if (jobAge > maxAgeMs && (job.status === 'complete' || job.status === 'failed' || job.status === 'cancelled')) {
        toDelete.push(jobId);
      }
    }
    
    for (const jobId of toDelete) {
      this.memoryCache.delete(jobId);
    }
    
    if (toDelete.length > 0) {
      await this.persistIndex();
    }
  }
}

export const jobStore = new JobStore();
```

- [ ] **Step 2: Update compilation routes to use jobStore**

Modify `apps/backend/src/routes/compilation.ts`:

```typescript
import { Router } from "express";
import path from "path";
import { promises as fs, createReadStream } from "fs";
import { spawn } from "child_process";
import { nanoid } from "nanoid";
import type { CompilationResult } from "@local-latex-editor/shared-types";

import { validateBody, validateParams } from "../middleware/validate.js";
import {
  compileBodySchema,
  compileParamsSchema,
} from "../validators/compile.js";
import { compileProject } from "../services/compilationService.js";
import { createSuccessResponse } from "../types/response.js";
import { NotFoundError } from "../types/error.js";
import { getProject } from "../services/projectService.js";
import { getProjectPath } from "../config/storage.js";
import { jobStore } from "../services/jobStore.js";

const router: Router = Router({ mergeParams: true });

router.post(
  "/compile",
  validateParams(compileParamsSchema),
  validateBody(compileBodySchema),
  async (req, res, next) => {
    try {
      const { id: projectId } = req.params;
      const { engine, mainFile } = req.body;

      await getProject(projectId);

      const jobId = nanoid();

      const job = {
        jobId,
        projectId,
        status: "pending" as const,
        progress: 0,
        createdAt: new Date(),
      };
      
      await jobStore.set(jobId, job);

      (async () => {
        try {
          await jobStore.set(jobId, { ...job, status: "compiling", progress: 10 });

          const result = await compileProject(projectId, { engine, mainFile });

          await jobStore.set(jobId, {
            ...job,
            status: result.success ? "complete" : "failed",
            progress: 100,
            result: {
              success: result.success,
              outputPath: result.outputPath,
              logOutput: result.logOutput,
              errors: result.errors,
              warnings: result.warnings,
              duration: result.duration,
            },
          });
        } catch (error) {
          const errObj = error as any;
          const originalLogOutput = errObj.logOutput || "Compilation failed";
          const originalErrors = errObj.errors || [
            {
              line: 0,
              column: 0,
              message: (error as Error).message,
              type: "error",
            },
          ];

          await jobStore.set(jobId, {
            ...job,
            status: "failed",
            progress: 100,
            result: {
              success: false,
              logOutput: originalLogOutput,
              errors: originalErrors,
              warnings: errObj.warnings || [],
              duration: 0,
            },
          });
        }
      })();

      res
        .status(202)
        .json(createSuccessResponse({ jobId, status: "compiling" }));
    } catch (error) {
      next(error);
    }
  },
);

export default router;

export const compilationJobRouter: Router = Router();

compilationJobRouter.get("/:jobId/status", async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await jobStore.get(jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }

    res.json(
      createSuccessResponse({
        jobId: job.jobId,
        projectId: job.projectId,
        status: job.status,
        progress: job.progress,
        result: job.result || null,
        createdAt: job.createdAt,
      }),
    );
  } catch (error) {
    next(error);
  }
});

compilationJobRouter.post("/:jobId/cancel", async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await jobStore.get(jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }

    job.status = "cancelled";
    await jobStore.set(jobId, job);

    res.json(
      createSuccessResponse({
        jobId,
        status: "cancelled",
        message: "Compilation job cancelled",
      }),
    );
  } catch (error) {
    next(error);
  }
});

export const projectPdfRouter: Router = Router({ mergeParams: true });

projectPdfRouter.get(
  "/pdf",
  validateParams(compileParamsSchema),
  async (req, res, next) => {
    try {
      const { id: projectId } = req.params;

      const project = await getProject(projectId);

      const projectPath = getProjectPath(projectId);
      const outputDir = path.join(projectPath, "output");

      const mainFile = project.metadata?.mainFile || "main.tex";
      const mainFileBasename = path.basename(mainFile, ".tex");
      const pdfPath = path.join(outputDir, `${mainFileBasename}.pdf`);

      try {
        await fs.access(pdfPath);
      } catch {
        throw new NotFoundError("PDF", `${mainFileBasename}.pdf`);
      }

      const stat = await fs.stat(pdfPath);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${projectId}-${mainFileBasename}.pdf"`,
      );
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const readStream = createReadStream(pdfPath);
      readStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

export const systemCheckRouter: Router = Router();

interface EngineStatus {
  engine: string;
  installed: boolean;
  version?: string;
}

async function checkEngine(engine: string): Promise<EngineStatus> {
  return new Promise((resolve) => {
    const childProcess = spawn(engine, ["--version"], {
      shell: false,
    });

    let stdout = "";

    const timeout = setTimeout(() => {
      childProcess.kill();
      resolve({ engine, installed: false });
    }, 5000);

    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    childProcess.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        const version = stdout.split("\n")[0]?.trim();
        resolve({ engine, installed: true, version });
      } else {
        resolve({ engine, installed: false });
      }
    });

    childProcess.on("error", () => {
      clearTimeout(timeout);
      resolve({ engine, installed: false });
    });
  });
}

systemCheckRouter.get("/system/latex-check", async (_req, res) => {
  const engines = ["pdflatex", "xelatex", "lualatex"];
  const results = await Promise.all(engines.map(checkEngine));

  const anyInstalled = results.some((r) => r.installed);

  res.json(
    createSuccessResponse({
      latexInstalled: anyInstalled,
      engines: results,
      message: anyInstalled
        ? "LaTeX is installed and ready"
        : "No LaTeX engine found. Please install TeX Live, MiKTeX, or MacTeX.",
    }),
  );
});
```

- [ ] **Step 3: Initialize jobStore on server start**

Modify `apps/backend/src/index.ts` to initialize jobStore:

```typescript
// ... imports same as before ...
import { jobStore } from "./services/jobStore.js";

async function startServer() {
  try {
    await ensureStorageDirectories();
    await jobStore.initialize();
    logger.info("Storage directories initialized");
    logger.info("Job store initialized");

    app.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Verify the change compiles**

Run: `cd apps/backend && pnpm build && echo "Build successful"`

---

## Task 6: Remove Debug console.log Statements (Minor)

**Files:**
- Modify: `apps/backend/src/routes/files.ts`
- Modify: `apps/frontend/src/components/Editor/MonacoEditor.tsx`

- [ ] **Step 1: Remove console.log statements from files.ts**

The console.log statements are at lines 138, 142, 172, 200, 201, 209, 213. Remove them.

Modify `apps/backend/src/routes/files.ts`:
```typescript
// In router.get("/:path(*)" handler around line 130-188):
router.get(
  "/:path(*)",
  validateParams<FilePathParams>(filePathParamsSchema),
  async (req, res, next) => {
    try {
      const { id, path: filePath } = req.params;
      const { absolutePath } = await resolveProjectFilePath(id, filePath);

      try {
        const stats = await fs.stat(absolutePath);

        if (stats.isDirectory()) {
          const files = await getProjectFiles(id);
          const normalizedPath = decodeURIComponent(filePath);

          if (normalizedPath === "" || normalizedPath === "/") {
            res.json(createSuccessResponse({ files }));
          } else {
            const cleanPath = normalizedPath.replace(/^\/|\/$/g, "");
            const findInTree = (
              nodes: typeof files,
              targetPath: string,
            ): typeof files | null => {
              for (const node of nodes) {
                if (node.path === targetPath && node.type === "directory") {
                  return node.children || [];
                }
                if (node.children) {
                  const found = findInTree(node.children, targetPath);
                  if (found) return found;
                }
              }
              return null;
            };
            const dirFiles = findInTree(files, cleanPath) || [];
            res.json(createSuccessResponse({ files: dirFiles }));
          }
        } else {
          const content = await fs.readFile(absolutePath, "utf-8");
          res.json(createSuccessResponse({ content }));
        }
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          throw new NotFoundError("File", filePath);
        }
        if ((error as NodeJS.ErrnoException).code === "EISDIR") {
          throw new ValidationError("Path is a directory, not a file");
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },
);

// In router.put("/:path(*)") handler around line 190-217:
router.put(
  "/:path(*)",
  validateParams<FilePathParams>(filePathParamsSchema),
  validateBody<WriteFileInput>(writeFileBodySchema),
  async (req, res, next) => {
    try {
      const { id, path: filePath } = req.params;
      const { content } = req.body;
      const { absolutePath } = await resolveProjectFilePath(id, filePath);

      const parentDir = path.dirname(absolutePath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(absolutePath, content, "utf-8");

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
```

- [ ] **Step 2: Check MonacoEditor.tsx for debug logs**

Run: `grep -n "console.log" apps/frontend/src/components/Editor/MonacoEditor.tsx`

If found, remove them (the review mentioned lines 74, 86).

- [ ] **Step 3: Verify ESLint passes**

Run: `pnpm lint --filter=backend --filter=frontend 2>&1 | grep -E "(error|warning)" | head -20`

Expected: No console.log errors

---

## Task 7: Fix Windows Path Separator Bug (Important)

**Files:**
- Modify: `apps/backend/src/routes/files.ts`

- [ ] **Step 1: Fix path traversal check to use cross-platform method**

The issue is at line 55 in `resolveProjectFilePath`:
```typescript
if (
  !normalizedPath.startsWith(projectPath + path.sep) &&
  normalizedPath !== projectPath
) {
```

On Windows, if someone passes `/` or `\` incorrectly, this could bypass. Use a more robust check:

```typescript
async function resolveProjectFilePath(
  projectId: string,
  filePath: string,
): Promise<{ absolutePath: string; projectPath: string }> {
  await getProject(projectId);
  const projectPath = getProjectPath(projectId);

  const decodedPath = decodeURIComponent(filePath);
  const absolutePath = path.join(projectPath, decodedPath);

  const normalizedPath = path.normalize(absolutePath);
  
  const relativePath = path.relative(projectPath, normalizedPath);
  const isOutsideProject = relativePath.startsWith('..') || path.isAbsolute(relativePath);
  
  if (isOutsideProject || (!normalizedPath.startsWith(projectPath) && normalizedPath !== projectPath)) {
    throw new ValidationError(
      "Invalid file path: directory traversal detected",
    );
  }

  return { absolutePath: normalizedPath, projectPath };
}
```

- [ ] **Step 2: Verify the change compiles**

Run: `cd apps/backend && pnpm build && echo "Build successful"`

---

## Task 8: Add Rate Limiting (Important)

**Files:**
- Modify: `apps/backend/package.json`
- Modify: `apps/backend/src/index.ts`

- [ ] **Step 1: Add express-rate-limit dependency**

Modify `apps/backend/package.json`:
```json
{
  "dependencies": {
    "@local-latex-editor/shared-types": "workspace:*",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "multer": "1.4.5-lts.2",
    "nanoid": "^5.0.5",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    "unzipper": "^0.10.14",
    "zod": "^3.22.4"
  }
}
```

- [ ] **Step 2: Add rate limiting middleware**

Modify `apps/backend/src/index.ts`:
```typescript
import express from "express";
import cors from "cors";
import pino from "pino";
import rateLimit from "express-rate-limit";
import projectRoutes from "./routes/projects.js";
import importRoutes from "./routes/import.js";
import compilationRoutes, {
  compilationJobRouter,
  projectPdfRouter,
  systemCheckRouter,
} from "./routes/compilation.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ensureStorageDirectories } from "./config/storage.js";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const app = express();
const PORT = process.env.PORT || 3001;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

const compileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many compilation requests' }, data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.use("/api", apiLimiter);
app.use("/api/projects/:id/compile", compileLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/projects", projectRoutes);
app.use("/api/projects/:id", compilationRoutes);
app.use("/api/projects/:id", projectPdfRouter);
app.use("/api/compile", compilationJobRouter);
app.use("/api", systemCheckRouter);
app.use("/api", importRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await ensureStorageDirectories();
    logger.info("Storage directories initialized");

    app.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
```

- [ ] **Step 3: Install and verify**

Run: `cd apps/backend && pnpm install && pnpm build && echo "Build successful"`

---

## Task 9: Validate All Routes (Important)

**Files:**
- Modify: `apps/backend/src/routes/compilation.ts`

- [ ] **Step 1: Add validation to routes missing it**

The `compilationJobRouter` routes at `/:jobId/status` and `/:jobId/cancel` lack validation.

Modify `apps/backend/src/routes/compilation.ts` to add jobId validation:

```typescript
import { Router } from "express";
import path from "path";
import { promises as fs, createReadStream } from "fs";
import { spawn } from "child_process";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { CompilationResult } from "@local-latex-editor/shared-types";

import { validateBody, validateParams } from "../middleware/validate.js";
import {
  compileBodySchema,
  compileParamsSchema,
} from "../validators/compile.js";
import { compileProject } from "../services/compilationService.js";
import { createSuccessResponse } from "../types/response.js";
import { NotFoundError } from "../types/error.js";
import { getProject } from "../services/projectService.js";
import { getProjectPath } from "../config/storage.js";
import { jobStore } from "../services/jobStore.js";

const router: Router = Router({ mergeParams: true });

const jobIdParamsSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

router.post(
  "/compile",
  validateParams(compileParamsSchema),
  validateBody(compileBodySchema),
  async (req, res, next) => {
    // ... existing code ...
  },
);

export default router;

export const compilationJobRouter: Router = Router();

compilationJobRouter.get(
  "/:jobId/status",
  validateParams(jobIdParamsSchema),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;

      const job = await jobStore.get(jobId);
      if (!job) {
        throw new NotFoundError("Job", jobId);
      }

      res.json(
        createSuccessResponse({
          jobId: job.jobId,
          projectId: job.projectId,
          status: job.status,
          progress: job.progress,
          result: job.result || null,
          createdAt: job.createdAt,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

compilationJobRouter.post(
  "/:jobId/cancel",
  validateParams(jobIdParamsSchema),
  async (req, res, next) => {
    try {
      const { jobId } = req.params;

      const job = await jobStore.get(jobId);
      if (!job) {
        throw new NotFoundError("Job", jobId);
      }

      job.status = "cancelled";
      await jobStore.set(jobId, job);

      res.json(
        createSuccessResponse({
          jobId,
          status: "cancelled",
          message: "Compilation job cancelled",
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

// ... rest unchanged ...
```

- [ ] **Step 2: Verify the change compiles**

Run: `cd apps/backend && pnpm build && echo "Build successful"`

---

## Task 10: Fix Auto-Compile Queue Bounds (Important)

**Files:**
- Modify: `apps/frontend/src/hooks/useAutoCompile.ts`

- [ ] **Step 1: Add maximum queue depth**

Run: `cat apps/frontend/src/hooks/useAutoCompile.ts`

After reading the file, modify it to add queue bounds:

```typescript
const MAX_QUEUE_SIZE = 10;
const DEBOUNCE_MS = 2000;

export function useAutoCompile() {
  const { compilationState, setCompilationState } = useCompilationStore();
  const { currentProjectId, getFileContent } = useEditorStore();
  
  const compileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queueRef = useRef<number>(0);

  const triggerCompile = useCallback(async () => {
    if (!currentProjectId) return;
    
    queueRef.current += 1;
    
    if (queueRef.current > MAX_QUEUE_SIZE) {
      queueRef.current = MAX_QUEUE_SIZE;
      return;
    }

    if (compileTimeoutRef.current) {
      clearTimeout(compileTimeoutRef.current);
    }

    compileTimeoutRef.current = setTimeout(async () => {
      try {
        setCompilationState({ status: 'compiling' });
        const content = getFileContent();
        const result = await compileLatex(currentProjectId, {
          content,
          engine: 'pdflatex',
        });
        setCompilationState({
          status: result.success ? 'success' : 'error',
          result,
        });
      } catch (error) {
        setCompilationState({
          status: 'error',
          result: {
            success: false,
            errors: [{ message: (error as Error).message, line: 0, column: 0, type: 'error' as const }],
            warnings: [],
            logOutput: (error as Error).message,
            duration: 0,
          },
        });
      } finally {
        queueRef.current = Math.max(0, queueRef.current - 1);
      }
    }, DEBOUNCE_MS);
  }, [currentProjectId, getFileContent, setCompilationState]);

  useEffect(() => {
    return () => {
      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
      }
    };
  }, []);

  return { triggerCompile };
}
```

---

## Verification Steps

After completing all tasks, run these verification commands:

1. **ESLint:**
   ```bash
   pnpm lint 2>&1 | tail -5
   ```
   Expected: No errors

2. **Frontend Tests:**
   ```bash
   pnpm test:unit --filter=frontend -- --run 2>&1 | tail -20
   ```
   Expected: All tests pass

3. **Backend Build:**
   ```bash
   pnpm build --filter=backend 2>&1 | tail -5
   ```
   Expected: Build successful

4. **TypeScript Check:**
   ```bash
   pnpm typecheck 2>&1 | tail -10
   ```
   Expected: No errors

---

## Self-Review Checklist

- [ ] All Critical issues fixed (ESLint, CORS, tests, job storage, atomic writes)
- [ ] All Important issues fixed (rate limiting, validation, path sep, auto-compile bounds)
- [ ] All Minor issues fixed (console.log removal)
- [ ] Each task verified with builds/tests
- [ ] No new issues introduced