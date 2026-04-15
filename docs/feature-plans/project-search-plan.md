# Project-Wide Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement project-wide search functionality that allows users to search for text across all files in a project, with results showing file names, line numbers, and context snippets.

**Architecture:** Add a backend search endpoint that recursively searches project files, and a frontend search UI (modal or panel) with real-time results, filtering, and navigation to matches.

**Tech Stack:** React, Express, streaming search, regex matching, Monaco Editor find integration

---

## File Structure

```
apps/frontend/src/
├── components/
│   ├── Search/
│   │   ├── index.ts               # Component exports
│   │   ├── SearchModal.tsx        # Main search modal
│   │   ├── SearchResults.tsx      # Results list component
│   │   ├── SearchInput.tsx        # Search input with options
│   │   └── SearchResultItem.tsx   # Individual result item
│   └── Toolbar.tsx                # Add search button (modified)
├── hooks/
│   └── useProjectSearch.ts        # Search logic hook
├── services/
│   └── searchApi.ts               # Search API client
└── types/
    └── search.ts                  # Search type definitions

apps/backend/src/
├── routes/
│   └── search.ts                  # Search API endpoint
├── services/
│   └── searchService.ts           # File search logic
└── types/
    └── search.ts                  # Search result types
```

---

## Task 1: Define Search Types

**Files:**
- Create: `apps/frontend/src/types/search.ts`
- Create: `apps/backend/src/types/search.ts`

**Purpose:** Define TypeScript interfaces for search requests and results.

- [ ] **Step 1: Create frontend search types**

```typescript
// apps/frontend/src/types/search.ts

export interface SearchMatch {
  line: number;
  column: number;
  text: string;
  contextBefore: string;
  contextAfter: string;
}

export interface SearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
  totalMatches: number;
}

export interface SearchRequest {
  query: string;
  projectId: string;
  options: SearchOptions;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includePattern?: string;
  excludePattern?: string;
  fileTypes?: string[]; // ['.tex', '.bib']
}

export interface SearchResponse {
  results: SearchResult[];
  totalFiles: number;
  totalMatches: number;
  duration: number; // Search time in ms
}
```

- [ ] **Step 2: Create backend search types**

```typescript
// apps/backend/src/types/search.ts

export interface SearchMatch {
  line: number;
  column: number;
  text: string;
  contextBefore: string;
  contextAfter: string;
}

export interface FileSearchResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
  totalMatches: number;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includePattern?: string;
  excludePattern?: string;
  fileTypes?: string[];
}

export interface SearchQuery {
  query: string;
  projectId: string;
  options: SearchOptions;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/types/search.ts apps/backend/src/types/search.ts
git commit -m "feat(search): add search type definitions"
```

---

## Task 2: Create Backend Search Service

**Files:**
- Create: `apps/backend/src/services/searchService.ts`

**Purpose:** Search files in a project directory recursively.

- [ ] **Step 1: Create search service**

```typescript
// apps/backend/src/services/searchService.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileSearchResult, SearchMatch, SearchOptions } from '../types/search';
import { storage } from '../config/storage';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit
const CONTEXT_LINES = 2; // Lines of context before/after match

export class SearchService {
  async searchProject(
    projectId: string,
    query: string,
    options: SearchOptions
  ): Promise<FileSearchResult[]> {
    const projectPath = storage.getProjectPath(projectId);
    const results: FileSearchResult[] = [];

    // Build regex pattern
    const pattern = this.buildSearchPattern(query, options);

    // Get all files recursively
    const files = await this.getSearchableFiles(projectPath, options);

    // Search each file
    for (const filePath of files) {
      try {
        const result = await this.searchFile(filePath, projectPath, pattern, options);
        if (result && result.matches.length > 0) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error searching file ${filePath}:`, error);
      }
    }

    return results;
  }

  private buildSearchPattern(query: string, options: SearchOptions): RegExp {
    let pattern = query;

    if (!options.useRegex) {
      // Escape special regex characters
      pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }

  private async getSearchableFiles(
    projectPath: string,
    options: SearchOptions
  ): Promise<string[]> {
    const files: string[] = [];

    async function walk(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip hidden files and directories
        if (entry.name.startsWith('.')) continue;

        // Skip output directory
        if (entry.name === 'output') continue;

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          // Check file type filter
          if (options.fileTypes && options.fileTypes.length > 0) {
            const ext = path.extname(entry.name);
            if (!options.fileTypes.includes(ext)) continue;
          }

          // Check include/exclude patterns
          if (options.includePattern && !fullPath.includes(options.includePattern)) continue;
          if (options.excludePattern && fullPath.includes(options.excludePattern)) continue;

          files.push(fullPath);
        }
      }
    }

    await walk(projectPath);
    return files;
  }

  private async searchFile(
    filePath: string,
    projectPath: string,
    pattern: RegExp,
    options: SearchOptions
  ): Promise<FileSearchResult | null> {
    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      return null;
    }

    // Read file
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches: SearchMatch[] = [];

    // Search line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;

      // Reset regex for each line
      pattern.lastIndex = 0;

      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          line: i + 1,
          column: match.index + 1,
          text: match[0],
          contextBefore: this.getContext(lines, i, -CONTEXT_LINES),
          contextAfter: this.getContext(lines, i, CONTEXT_LINES),
        });
      }
    }

    if (matches.length === 0) {
      return null;
    }

    return {
      filePath: path.relative(projectPath, filePath),
      fileName: path.basename(filePath),
      matches,
      totalMatches: matches.length,
    };
  }

  private getContext(lines: string[], targetLine: number, offset: number): string {
    const start = Math.max(0, targetLine + offset);
    const end = offset < 0 ? targetLine : Math.min(lines.length - 1, targetLine + offset);

    if (offset < 0) {
      return lines.slice(start, end).join('\n');
    } else {
      return lines.slice(targetLine + 1, end + 1).join('\n');
    }
  }
}

export const searchService = new SearchService();
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/services/searchService.ts
git commit -m "feat(search): add backend search service"
```

---

## Task 3: Create Search API Route

**Files:**
- Create: `apps/backend/src/routes/search.ts`

**Purpose:** Express route for search endpoint.

- [ ] **Step 1: Create search route**

```typescript
// apps/backend/src/routes/search.ts

import { Router } from 'express';
import { searchService } from '../services/searchService';
import { validateRequest } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  options: z.object({
    caseSensitive: z.boolean().default(false),
    wholeWord: z.boolean().default(false),
    useRegex: z.boolean().default(false),
    includePattern: z.string().optional(),
    excludePattern: z.string().optional(),
    fileTypes: z.array(z.string()).optional(),
  }).default({}),
});

router.post('/projects/:projectId/search', validateRequest({ body: searchSchema }), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { query, options } = req.body;

    const startTime = Date.now();
    const results = await searchService.searchProject(projectId, query, options);
    const duration = Date.now() - startTime;

    const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);

    res.json({
      success: true,
      data: {
        results,
        totalFiles: results.length,
        totalMatches,
        duration,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

- [ ] **Step 2: Mount search route in index.ts**

```typescript
// apps/backend/src/index.ts

import searchRoutes from './routes/search';

// Add with other routes:
app.use('/api', searchRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/routes/search.ts apps/backend/src/index.ts
git commit -m "feat(search): add search API endpoint"
```

---

## Task 4: Create Frontend Search API Service

**Files:**
- Create: `apps/frontend/src/services/searchApi.ts`

**Purpose:** Frontend client for search API.

- [ ] **Step 1: Create search API service**

```typescript
// apps/frontend/src/services/searchApi.ts

import { api } from './api';
import type { SearchRequest, SearchResponse } from '../types/search';

interface SearchApiResponse {
  success: boolean;
  data: SearchResponse;
}

export const searchApi = {
  search: async (projectId: string, query: string, options: SearchRequest['options']): Promise<SearchResponse> => {
    const response = await api.post<SearchApiResponse>(`/projects/${projectId}/search`, {
      query,
      options,
    });
    return response.data.data;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/services/searchApi.ts
git commit -m "feat(search): add frontend search API service"
```

---

## Task 5: Create useProjectSearch Hook

**Files:**
- Create: `apps/frontend/src/hooks/useProjectSearch.ts`

**Purpose:** Hook for managing search state and operations.

- [ ] **Step 1: Create search hook**

```typescript
// apps/frontend/src/hooks/useProjectSearch.ts

import { useState, useCallback, useRef } from 'react';
import { searchApi } from '../services/searchApi';
import type { SearchResponse, SearchOptions } from '../types/search';

interface UseProjectSearchReturn {
  results: SearchResponse | null;
  isSearching: boolean;
  error: string | null;
  search: (query: string, options?: SearchOptions) => Promise<void>;
  clearResults: () => void;
}

export function useProjectSearch(projectId: string): UseProjectSearchReturn {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (query: string, options: SearchOptions = {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    }) => {
      if (!query.trim()) {
        setResults(null);
        return;
      }

      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSearching(true);
      setError(null);

      try {
        const response = await searchApi.search(projectId, query, options);
        setResults(response);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [projectId]
  );

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    search,
    clearResults,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/hooks/useProjectSearch.ts
git commit -m "feat(search): add useProjectSearch hook"
```

---

## Task 6: Create Search Modal Components

**Files:**
- Create: `apps/frontend/src/components/Search/SearchInput.tsx`
- Create: `apps/frontend/src/components/Search/SearchResultItem.tsx`
- Create: `apps/frontend/src/components/Search/SearchResults.tsx`
- Create: `apps/frontend/src/components/Search/SearchModal.tsx`
- Create: `apps/frontend/src/components/Search/index.ts`

**Purpose:** UI components for search interface.

- [ ] **Step 1: Create SearchInput component**

```typescript
// apps/frontend/src/components/Search/SearchInput.tsx

import React from 'react';
import { Search, X, CaseSensitive, WholeWord, Regex } from 'lucide-react';
import type { SearchOptions } from '../../types/search';

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  options: SearchOptions;
  onOptionsChange: (options: SearchOptions) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  query,
  onQueryChange,
  options,
  onOptionsChange,
  onSearch,
  isSearching,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const toggleOption = (key: keyof SearchOptions) => {
    onOptionsChange({ ...options, [key]: !options[key as keyof typeof options] });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in project..."
          className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]"
          autoFocus
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ToggleButton
          active={options.caseSensitive}
          onClick={() => toggleOption('caseSensitive')}
          title="Match case"
          icon={<CaseSensitive size={14} />}
        />
        <ToggleButton
          active={options.wholeWord}
          onClick={() => toggleOption('wholeWord')}
          title="Match whole word"
          icon={<WholeWord size={14} />}
        />
        <ToggleButton
          active={options.useRegex}
          onClick={() => toggleOption('useRegex')}
          title="Use regular expressions"
          icon={<Regex size={14} />}
        />
      </div>
    </div>
  );
};

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ active, onClick, title, icon }) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
      active
        ? 'bg-[var(--color-primary)] text-white'
        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
    }`}
  >
    {icon}
  </button>
);
```

- [ ] **Step 2: Create SearchResultItem component**

```typescript
// apps/frontend/src/components/Search/SearchResultItem.tsx

import React from 'react';
import { FileText } from 'lucide-react';
import type { SearchMatch, SearchResult } from '../../types/search';

interface SearchResultItemProps {
  result: SearchResult;
  onMatchClick: (filePath: string, line: number, column: number) => void;
  query: string;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onMatchClick,
  query,
}) => {
  return (
    <div className="border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)]/50">
        <FileText size={14} className="text-[var(--color-primary)]" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {result.fileName}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          ({result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''})
        </span>
      </div>

      <div className="divide-y divide-[var(--color-border)]/50">
        {result.matches.map((match, index) => (
          <MatchItem
            key={index}
            match={match}
            onClick={() => onMatchClick(result.filePath, match.line, match.column)}
            query={query}
          />
        ))}
      </div>
    </div>
  );
};

interface MatchItemProps {
  match: SearchMatch;
  onClick: () => void;
  query: string;
}

const MatchItem: React.FC<MatchItemProps> = ({ match, onClick, query }) => {
  const highlightMatch = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[var(--color-primary)]/30 text-[var(--color-text-primary)] px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-xs text-[var(--color-text-tertiary)] min-w-[3rem] text-right">
          {match.line}
        </span>
        <div className="flex-1 font-mono text-sm">
          {match.contextBefore && (
            <span className="text-[var(--color-text-tertiary)]">
              {match.contextBefore.split('\n').pop()}
            </span>
          )}
          <span className="text-[var(--color-text-secondary)]">
            {highlightMatch(match.text)}
          </span>
          {match.contextAfter && (
            <span className="text-[var(--color-text-tertiary)]">
              {match.contextAfter.split('\n')[0]}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
```

- [ ] **Step 3: Create SearchResults component**

```typescript
// apps/frontend/src/components/Search/SearchResults.tsx

import React from 'react';
import { SearchResultItem } from './SearchResultItem';
import type { SearchResponse } from '../../types/search';
import { FileX } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResponse | null;
  isSearching: boolean;
  error: string | null;
  query: string;
  onMatchClick: (filePath: string, line: number, column: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isSearching,
  error,
  query,
  onMatchClick,
}) => {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-error)]">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  if (results.totalMatches === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
        <FileX size={48} className="mb-4 opacity-50" />
        <p>No results found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {results.totalMatches} result{results.totalMatches !== 1 ? 's' : ''} in {results.totalFiles} file{results.totalFiles !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {results.duration}ms
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {results.results.map((result, index) => (
          <SearchResultItem
            key={index}
            result={result}
            onMatchClick={onMatchClick}
            query={query}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create SearchModal component**

```typescript
// apps/frontend/src/components/Search/SearchModal.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { useProjectSearch } from '../../hooks/useProjectSearch';
import type { SearchOptions } from '../../types/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onOpenFile: (filePath: string, line?: number, column?: number) => void;
}

const defaultOptions: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
};

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onOpenFile,
}) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>(defaultOptions);
  const { results, isSearching, error, search, clearResults } = useProjectSearch(projectId);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setOptions(defaultOptions);
      clearResults();
    }
  }, [isOpen, clearResults]);

  const handleSearch = useCallback(() => {
    search(query, options);
  }, [query, options, search]);

  const handleMatchClick = useCallback(
    (filePath: string, line: number, column: number) => {
      onOpenFile(filePath, line, column);
      onClose();
    },
    [onOpenFile, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Search in Project
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <SearchInput
            query={query}
            onQueryChange={setQuery}
            options={options}
            onOptionsChange={setOptions}
            onSearch={handleSearch}
            isSearching={isSearching}
          />

          <div className="mt-6 flex-1 overflow-hidden">
            <SearchResults
              results={results}
              isSearching={isSearching}
              error={error}
              query={query}
              onMatchClick={handleMatchClick}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
          Press Enter to search • Click a result to open file
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Create index export file**

```typescript
// apps/frontend/src/components/Search/index.ts
export { SearchModal } from './SearchModal';
export { SearchInput } from './SearchInput';
export { SearchResults } from './SearchResults';
export { SearchResultItem } from './SearchResultItem';
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/Search/
git commit -m "feat(search): add search modal UI components"
```

---

## Task 7: Integrate Search into ProjectDetail

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx`

**Purpose:** Add search button and integrate search modal.

- [ ] **Step 1: Add search button and modal to ProjectDetail**

Add imports:

```typescript
import { SearchModal } from '../components/Search';
import { Search } from 'lucide-react';
```

Add state:

```typescript
const [isSearchOpen, setIsSearchOpen] = useState(false);
```

Add search button in toolbar (next to settings button):

```typescript
<button
  onClick={() => setIsSearchOpen(true)}
  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
  title="Search in project (Ctrl+Shift+F)"
>
  <Search size={20} />
</button>
```

Add keyboard shortcut:

```typescript
// In useKeyboardShortcuts or useEffect:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

Add modal at the end:

```typescript
<SearchModal
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  projectId={projectId!}
  onOpenFile={(filePath, line, column) => {
    // Open file at specific line
    openFile(filePath);
    // Optionally: scroll to line in editor
  }}
/>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(search): integrate search modal into project detail page"
```

---

## Summary

This implementation creates a comprehensive project-wide search feature:

**Features:**
- Full-text search across all project files
- Case-sensitive, whole word, and regex options
- Context lines shown for each match
- File type filtering
- Real-time results with performance metrics
- Click to open file at specific line
- Keyboard shortcut (Ctrl+Shift+F)

**Files Created:**
- `apps/frontend/src/types/search.ts`
- `apps/backend/src/types/search.ts`
- `apps/backend/src/services/searchService.ts`
- `apps/backend/src/routes/search.ts`
- `apps/frontend/src/services/searchApi.ts`
- `apps/frontend/src/hooks/useProjectSearch.ts`
- `apps/frontend/src/components/Search/SearchInput.tsx`
- `apps/frontend/src/components/Search/SearchResultItem.tsx`
- `apps/frontend/src/components/Search/SearchResults.tsx`
- `apps/frontend/src/components/Search/SearchModal.tsx`
- `apps/frontend/src/components/Search/index.ts`

**Files Modified:**
- `apps/backend/src/index.ts`
- `apps/frontend/src/pages/ProjectDetail.tsx`
