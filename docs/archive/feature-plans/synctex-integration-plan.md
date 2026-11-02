# SyncTeX Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SyncTeX bidirectional navigation - click on PDF to jump to corresponding LaTeX source location, and vice versa.

**Architecture:** Parse SyncTeX data files to build coordinate mapping, handle click events on PDF viewer to calculate source position, and provide API endpoints for forward/inverse search.

**Tech Stack:** SyncTeX parser, PDF.js, Express, React, canvas coordinate mapping

---

## File Structure

```
apps/frontend/src/
├── components/
│   └── PDFPreview.tsx           # Modify to handle clicks
├── hooks/
│   └── useSyncTeX.ts            # SyncTeX navigation hook
├── services/
│   └── synctexApi.ts            # SyncTeX API client
└── types/
    └── synctex.ts               # SyncTeX type definitions

apps/backend/src/
├── routes/
│   └── synctex.ts               # SyncTeX API endpoints
├── services/
│   └── synctexService.ts        # SyncTeX data parser
└── types/
    └── synctex.ts               # SyncTeX types
```

---

## Task 1: Define SyncTeX Types

**Files:**
- Create: `apps/frontend/src/types/synctex.ts`
- Create: `apps/backend/src/types/synctex.ts`

**Purpose:** Define TypeScript interfaces for SyncTeX operations.

- [ ] **Step 1: Create frontend SyncTeX types**

```typescript
// apps/frontend/src/types/synctex.ts

/**
 * Forward search: Source → PDF
 * Given a file, line, and column in source, find corresponding PDF position
 */
export interface ForwardSearchRequest {
  file: string;        // Source file path (relative to project)
  line: number;        // Line number (1-based)
  column?: number;     // Column number (optional)
}

export interface ForwardSearchResult {
  page: number;        // PDF page number
  x: number;           // X coordinate on page (in points)
  y: number;           // Y coordinate on page (in points)
  h: number;           // Height coordinate
  v: number;           // Vertical coordinate
}

/**
 * Inverse search: PDF → Source
 * Given a page and click coordinates, find corresponding source location
 */
export interface InverseSearchRequest {
  page: number;        // PDF page number (1-based)
  x: number;           // Click X coordinate (in points)
  y: number;           // Click Y coordinate (in points)
}

export interface InverseSearchResult {
  file: string;        // Source file path
  line: number;        // Line number
  column: number;      // Column number
  context?: string;    // Context around the line
}

export interface SyncTeXStatus {
  available: boolean;  // Whether SyncTeX data exists
  filePath?: string;   // Path to .synctex.gz file
  lastModified?: string;
}
```

- [ ] **Step 2: Create backend SyncTeX types**

```typescript
// apps/backend/src/types/synctex.ts

export interface SyncTeXRecord {
  tag: number;         // Input file tag
  line: number;        // Source line
  column: number;      // Source column
  page: number;        // PDF page
  x: number;           // X coordinate
  y: number;           // Y coordinate
  h: number;           // Height
  v: number;           // Vertical
  w: number;           // Width
  m: number;           // Midpoint
}

export interface SyncTeXInput {
  tag: number;
  name: string;        // Source file name
}

export interface SyncTeXData {
  version: string;
  inputs: Map<number, string>;  // tag -> filename
  records: SyncTeXRecord[];
}

export interface ForwardSearchRequest {
  file: string;
  line: number;
  column?: number;
}

export interface ForwardSearchResult {
  page: number;
  x: number;
  y: number;
  h: number;
  v: number;
}

export interface InverseSearchRequest {
  page: number;
  x: number;
  y: number;
}

export interface InverseSearchResult {
  file: string;
  line: number;
  column: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/types/synctex.ts apps/backend/src/types/synctex.ts
git commit -m "feat(synctex): add SyncTeX type definitions"
```

---

## Task 2: Create Backend SyncTeX Parser Service

**Files:**
- Create: `apps/backend/src/services/synctexService.ts`

**Purpose:** Parse .synctex.gz files and provide forward/inverse search.

- [ ] **Step 1: Create SyncTeX service**

```typescript
// apps/backend/src/services/synctexService.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import type {
  SyncTeXData,
  SyncTeXRecord,
  SyncTeXInput,
  ForwardSearchRequest,
  ForwardSearchResult,
  InverseSearchRequest,
  InverseSearchResult,
} from '../types/synctex';
import { storage } from '../config/storage';

const gunzip = promisify(zlib.gunzip);

export class SyncTeXService {
  private cache: Map<string, SyncTeXData> = new Map();

  /**
   * Get path to SyncTeX file for a project
   */
  private getSyncTeXPath(projectId: string, mainFile: string = 'main'): string {
    const projectPath = storage.getProjectPath(projectId);
    return path.join(projectPath, `${mainFile}.synctex.gz`);
  }

  /**
   * Check if SyncTeX data is available for a project
   */
  async isAvailable(projectId: string, mainFile?: string): Promise<boolean> {
    try {
      const synctexPath = this.getSyncTeXPath(projectId, mainFile);
      await fs.access(synctexPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load and parse SyncTeX data
   */
  async loadSyncTeX(projectId: string, mainFile?: string): Promise<SyncTeXData | null> {
    const cacheKey = `${projectId}/${mainFile || 'main'}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const synctexPath = this.getSyncTeXPath(projectId, mainFile);
      const compressed = await fs.readFile(synctexPath);
      const decompressed = await gunzip(compressed);
      const content = decompressed.toString('utf-8');

      const data = this.parseSyncTeX(content);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to load SyncTeX:', error);
      return null;
    }
  }

  /**
   * Parse SyncTeX file content
   */
  private parseSyncTeX(content: string): SyncTeXData {
    const lines = content.split('\n');
    const inputs = new Map<number, string>();
    const records: SyncTeXRecord[] = [];
    let version = '';

    let currentInput: number | null = null;

    for (const line of lines) {
      if (line.startsWith('SyncTeX Version:')) {
        version = line.split(':')[1].trim();
        continue;
      }

      // Input file declaration: <tag>:<name>
      if (line.startsWith('Input:')) {
        const match = line.match(/Input:(\d+):(.+)/);
        if (match) {
          const tag = parseInt(match[1], 10);
          const name = match[2];
          inputs.set(tag, name);
        }
        continue;
      }

      // Record line (various types: x, y, k, g, etc.)
      if (line.match(/^[xykvgrm]/)) {
        const record = this.parseRecordLine(line, inputs);
        if (record) {
          records.push(record);
        }
      }
    }

    return { version, inputs, records };
  }

  /**
   * Parse a single SyncTeX record line
   */
  private parseRecordLine(line: string, inputs: Map<number, string>): SyncTeXRecord | null {
    // Simplified parsing - real SyncTeX format is more complex
    // This handles basic x,y records
    const parts = line.split(',');
    if (parts.length < 3) return null;

    const type = parts[0][0];
    const values = parts[0].substring(1).split(':');

    if (values.length < 2) return null;

    return {
      tag: parseInt(values[0], 10),
      line: parseInt(values[1], 10),
      column: parseInt(parts[1] || '0', 10),
      page: parseInt(parts[2] || '1', 10),
      x: parseFloat(parts[3] || '0'),
      y: parseFloat(parts[4] || '0'),
      h: parseFloat(parts[5] || '0'),
      v: parseFloat(parts[6] || '0'),
      w: parseFloat(parts[7] || '0'),
      m: parseFloat(parts[8] || '0'),
    };
  }

  /**
   * Forward search: Source → PDF
   */
  async forwardSearch(
    projectId: string,
    request: ForwardSearchRequest,
    mainFile?: string
  ): Promise<ForwardSearchResult | null> {
    const data = await this.loadSyncTeX(projectId, mainFile);
    if (!data) return null;

    // Find matching records
    const matches = data.records.filter((record) => {
      const inputFile = data.inputs.get(record.tag);
      return (
        inputFile?.endsWith(request.file) &&
        record.line === request.line
      );
    });

    if (matches.length === 0) return null;

    // Return the first match (or could average positions)
    const match = matches[0];
    return {
      page: match.page,
      x: match.x,
      y: match.y,
      h: match.h,
      v: match.v,
    };
  }

  /**
   * Inverse search: PDF → Source
   */
  async inverseSearch(
    projectId: string,
    request: InverseSearchRequest,
    mainFile?: string
  ): Promise<InverseSearchResult | null> {
    const data = await this.loadSyncTeX(projectId, mainFile);
    if (!data) return null;

    // Find closest record on the given page
    let closest: SyncTeXRecord | null = null;
    let minDistance = Infinity;

    for (const record of data.records) {
      if (record.page !== request.page) continue;

      const distance = Math.sqrt(
        Math.pow(record.x - request.x, 2) + Math.pow(record.y - request.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = record;
      }
    }

    if (!closest) return null;

    const inputFile = data.inputs.get(closest.tag);
    if (!inputFile) return null;

    return {
      file: inputFile,
      line: closest.line,
      column: closest.column,
    };
  }

  /**
   * Clear cache for a project (call when PDF is recompiled)
   */
  clearCache(projectId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(projectId)) {
        this.cache.delete(key);
      }
    }
  }
}

export const synctexService = new SyncTeXService();
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/services/synctexService.ts
git commit -m "feat(synctex): add SyncTeX parser service"
```

---

## Task 3: Create SyncTeX API Routes

**Files:**
- Create: `apps/backend/src/routes/synctex.ts`

**Purpose:** Express routes for forward and inverse search.

- [ ] **Step 1: Create SyncTeX routes**

```typescript
// apps/backend/src/routes/synctex.ts

import { Router } from 'express';
import { z } from 'zod';
import { synctexService } from '../services/synctexService';
import { validateRequest } from '../middleware/validate';

const router = Router();

const forwardSearchSchema = z.object({
  file: z.string().min(1),
  line: z.number().int().min(1),
  column: z.number().int().optional(),
});

const inverseSearchSchema = z.object({
  page: z.number().int().min(1),
  x: z.number(),
  y: z.number(),
});

// Check SyncTeX availability
router.get('/projects/:projectId/synctex/status', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const available = await synctexService.isAvailable(projectId);
    res.json({
      success: true,
      data: { available },
    });
  } catch (error) {
    next(error);
  }
});

// Forward search (Source → PDF)
router.post(
  '/projects/:projectId/synctex/forward',
  validateRequest({ body: forwardSearchSchema }),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const result = await synctexService.forwardSearch(projectId, req.body);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No SyncTeX data found for this location',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Inverse search (PDF → Source)
router.post(
  '/projects/:projectId/synctex/inverse',
  validateRequest({ body: inverseSearchSchema }),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const result = await synctexService.inverseSearch(projectId, req.body);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No source location found for this PDF position',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

- [ ] **Step 2: Mount SyncTeX routes**

```typescript
// apps/backend/src/index.ts

import synctexRoutes from './routes/synctex';

// Add with other routes:
app.use('/api', synctexRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/routes/synctex.ts apps/backend/src/index.ts
git commit -m "feat(synctex): add SyncTeX API endpoints"
```

---

## Task 4: Create Frontend SyncTeX Service

**Files:**
- Create: `apps/frontend/src/services/synctexApi.ts`

**Purpose:** Frontend client for SyncTeX API.

- [ ] **Step 1: Create SyncTeX API service**

```typescript
// apps/frontend/src/services/synctexApi.ts

import { api } from './api';
import type {
  ForwardSearchRequest,
  ForwardSearchResult,
  InverseSearchRequest,
  InverseSearchResult,
  SyncTeXStatus,
} from '../types/synctex';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const synctexApi = {
  getStatus: async (projectId: string): Promise<SyncTeXStatus> => {
    const response = await api.get<ApiResponse<SyncTeXStatus>>(
      `/projects/${projectId}/synctex/status`
    );
    return response.data.data;
  },

  forwardSearch: async (
    projectId: string,
    request: ForwardSearchRequest
  ): Promise<ForwardSearchResult | null> => {
    try {
      const response = await api.post<ApiResponse<ForwardSearchResult>>(
        `/projects/${projectId}/synctex/forward`,
        request
      );
      return response.data.data;
    } catch {
      return null;
    }
  },

  inverseSearch: async (
    projectId: string,
    request: InverseSearchRequest
  ): Promise<InverseSearchResult | null> => {
    try {
      const response = await api.post<ApiResponse<InverseSearchResult>>(
        `/projects/${projectId}/synctex/inverse`,
        request
      );
      return response.data.data;
    } catch {
      return null;
    }
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/services/synctexApi.ts
git commit -m "feat(synctex): add frontend SyncTeX API service"
```

---

## Task 5: Create useSyncTeX Hook

**Files:**
- Create: `apps/frontend/src/hooks/useSyncTeX.ts`

**Purpose:** Hook for managing SyncTeX operations.

- [ ] **Step 1: Create SyncTeX hook**

```typescript
// apps/frontend/src/hooks/useSyncTeX.ts

import { useState, useCallback, useEffect } from 'react';
import { synctexApi } from '../services/synctexApi';
import type {
  ForwardSearchRequest,
  ForwardSearchResult,
  InverseSearchRequest,
  InverseSearchResult,
} from '../types/synctex';

interface UseSyncTeXReturn {
  isAvailable: boolean;
  isLoading: boolean;
  forwardSearch: (request: ForwardSearchRequest) => Promise<ForwardSearchResult | null>;
  inverseSearch: (request: InverseSearchRequest) => Promise<InverseSearchResult | null>;
}

export function useSyncTeX(projectId: string): UseSyncTeXReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const status = await synctexApi.getStatus(projectId);
        setIsAvailable(status.available);
      } catch {
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [projectId]);

  const forwardSearch = useCallback(
    async (request: ForwardSearchRequest) => {
      if (!isAvailable) return null;
      return synctexApi.forwardSearch(projectId, request);
    },
    [projectId, isAvailable]
  );

  const inverseSearch = useCallback(
    async (request: InverseSearchRequest) => {
      if (!isAvailable) return null;
      return synctexApi.inverseSearch(projectId, request);
    },
    [projectId, isAvailable]
  );

  return {
    isAvailable,
    isLoading,
    forwardSearch,
    inverseSearch,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/hooks/useSyncTeX.ts
git commit -m "feat(synctex): add useSyncTeX hook"
```

---

## Task 6: Update PDFPreview for Inverse Search

**Files:**
- Modify: `apps/frontend/src/components/PDFPreview.tsx`

**Purpose:** Handle click events on PDF to trigger inverse search.

- [ ] **Step 1: Add inverse search to PDFPreview**

```typescript
// In PDFPreview.tsx

import { useSyncTeX } from '../hooks/useSyncTeX';
import type { InverseSearchResult } from '../types/synctex';

interface PDFPreviewProps {
  // ... existing props ...
  projectId: string;
  onInverseSearch?: (result: InverseSearchResult) => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  // ... existing props ...
  projectId,
  onInverseSearch,
}) => {
  const { isAvailable, inverseSearch } = useSyncTeX(projectId);

  // ... existing code ...

  const handlePDFClick = useCallback(
    async (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onInverseSearch || !isAvailable) return;

      // Get click coordinates relative to PDF page
      const canvas = event.currentTarget.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Convert to PDF coordinates (points)
      // This is a simplified conversion - real implementation needs page scaling
      const scale = 72; // 72 points per inch (standard PDF unit)
      const pdfX = (clickX / rect.width) * 8.5 * scale; // Assuming letter size
      const pdfY = (clickY / rect.height) * 11 * scale;

      const result = await inverseSearch({
        page: currentPage,
        x: pdfX,
        y: pdfY,
      });

      if (result) {
        onInverseSearch(result);
      }
    },
    [currentPage, inverseSearch, isAvailable, onInverseSearch]
  );

  return (
    <div
      className={`h-full flex flex-col ${isAvailable ? 'cursor-crosshair' : ''}`}
      onClick={handlePDFClick}
    >
      {/* ... existing PDF viewer code ... */}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/PDFPreview.tsx
git commit -m "feat(synctex): add inverse search click handling to PDF preview"
```

---

## Task 7: Integrate Forward Search with Compilation

**Files:**
- Modify: `apps/frontend/src/hooks/useCompilation.ts`
- Modify: `apps/backend/src/services/compilationService.ts`

**Purpose:** Auto-scroll PDF to current cursor position after compilation.

- [ ] **Step 1: Add forward search after compilation**

```typescript
// In useCompilation.ts

import { synctexApi } from '../services/synctexApi';

// After successful compilation, optionally scroll to current position
const scrollToCurrentPosition = async (currentFile: string, currentLine: number) => {
  const result = await synctexApi.forwardSearch(projectId, {
    file: currentFile,
    line: currentLine,
  });

  if (result) {
    // Dispatch event or update store to scroll PDF
    window.dispatchEvent(new CustomEvent('synctex:scroll', {
      detail: { page: result.page, x: result.x, y: result.y },
    }));
  }
};
```

- [ ] **Step 2: Ensure compilation generates SyncTeX**

```typescript
// In compilationService.ts

// Add -synctex=1 flag to compilation command
const args = [
  '-interaction=nonstopmode',
  '-file-line-error',
  '-synctex=1',  // Enable SyncTeX
  `-output-directory=${outputDir}`,
  mainFile,
];
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/useCompilation.ts apps/backend/src/services/compilationService.ts
git commit -m "feat(synctex): integrate forward search with compilation"
```

---

## Task 8: Add SyncTeX Indicator to UI

**Files:**
- Create: `apps/frontend/src/components/SyncTeXIndicator.tsx`

**Purpose:** Show visual indicator when SyncTeX is available.

- [ ] **Step 1: Create SyncTeX indicator component**

```typescript
// apps/frontend/src/components/SyncTeXIndicator.tsx

import React from 'react';
import { Link2 } from 'lucide-react';
import { useSyncTeX } from '../hooks/useSyncTeX';

interface SyncTeXIndicatorProps {
  projectId: string;
}

export const SyncTeXIndicator: React.FC<SyncTeXIndicatorProps> = ({ projectId }) => {
  const { isAvailable, isLoading } = useSyncTeX(projectId);

  if (isLoading) {
    return <div className="w-4 h-4 animate-pulse bg-gray-300 rounded-full" />;
  }

  if (!isAvailable) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1 text-xs text-[var(--color-primary)]"
      title="SyncTeX enabled - Click PDF to jump to source"
    >
      <Link2 size={12} />
      <span>SyncTeX</span>
    </div>
  );
};
```

- [ ] **Step 2: Add to toolbar in ProjectDetail**

```typescript
// In ProjectDetail.tsx toolbar:
<SyncTeXIndicator projectId={projectId} />
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/SyncTeXIndicator.tsx apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(synctex): add SyncTeX availability indicator"
```

---

## Summary

This implementation adds SyncTeX bidirectional navigation:

**Features:**
- Parse .synctex.gz files for coordinate mapping
- Forward search: Editor cursor → PDF scroll position
- Inverse search: PDF click → Editor file/line navigation
- Visual indicator when SyncTeX data is available
- Automatic PDF scroll after compilation

**Files Created:**
- `apps/frontend/src/types/synctex.ts`
- `apps/backend/src/types/synctex.ts`
- `apps/backend/src/services/synctexService.ts`
- `apps/backend/src/routes/synctex.ts`
- `apps/frontend/src/services/synctexApi.ts`
- `apps/frontend/src/hooks/useSyncTeX.ts`
- `apps/frontend/src/components/SyncTeXIndicator.tsx`

**Files Modified:**
- `apps/backend/src/index.ts`
- `apps/frontend/src/components/PDFPreview.tsx`
- `apps/frontend/src/hooks/useCompilation.ts`
- `apps/backend/src/services/compilationService.ts`
- `apps/frontend/src/pages/ProjectDetail.tsx`

**Note:** This is a basic SyncTeX implementation. The full SyncTeX format is complex and may require a dedicated parser library for production use.
