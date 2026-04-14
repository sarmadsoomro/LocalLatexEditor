# ZIP Export Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend API and frontend UI to export LaTeX projects as ZIP files for sharing and Overleaf upload.

**Architecture:** Backend streaming ZIP generation using `archiver` library (no temp files). Frontend triggers download with generated filename. Export accessible from both Project List and Project Detail pages.

**Tech Stack:** Node.js + Express (backend), React + TypeScript (frontend), Archiver (ZIP streaming)

---

## File Structure

**New Files:**
- `apps/backend/src/services/exportService.ts` — ZIP generation with file filtering

**Modified Files:**
- `apps/backend/package.json` — Add archiver dependencies
- `apps/backend/src/routes/projects.ts` — Add export route handler
- `apps/frontend/src/services/projectApi.ts` — Add exportProject function
- `apps/frontend/src/pages/ProjectList.tsx` — Add export button to project cards
- `apps/frontend/src/pages/ProjectDetail.tsx` — Add export button to toolbar

---

## Task 1: Install Backend Dependencies

**Files:**
- Modify: `apps/backend/package.json`

- [ ] **Step 1: Add archiver dependencies**

Add to `apps/backend/package.json` in the `dependencies` section:

```json
"archiver": "^6.0.1"
```

Add to `apps/backend/package.json` in the `devDependencies` section:

```json
"@types/archiver": "^6.0.2"
```

- [ ] **Step 2: Install dependencies**

Run from project root:
```bash
pnpm install
```

Expected: Dependencies installed without errors

- [ ] **Step 3: Commit**

```bash
git add apps/backend/package.json pnpm-lock.yaml
git commit -m "deps(backend): add archiver for ZIP export"
```

---

## Task 2: Create Export Service

**Files:**
- Create: `apps/backend/src/services/exportService.ts`

- [ ] **Step 1: Create exportService.ts with ZIP generation logic**

```typescript
import { Response } from 'express';
import archiver from 'archiver';
import { promises as fs } from 'fs';
import path from 'path';
import { getProjectPath } from '../config/storage.js';
import { getProject } from './projectService.js';
import { NotFoundError, InternalError } from '../types/error.js';

// Patterns to exclude from ZIP export
const EXCLUDED_PATTERNS = [
  /^output\//,           // output directory
  /\.aux$/,             // LaTeX auxiliary files
  /\.log$/,             // LaTeX log files
  /\.out$/,             // LaTeX output files
  /\.toc$/,             // Table of contents
  /\.lof$/,             // List of figures
  /\.lot$/,             // List of tables
  /\.synctex\.gz$/,     // SyncTeX data
  /^\.DS_Store$/,        // macOS metadata
  /^Thumbs\.db$/,        // Windows metadata
];

/**
 * Check if a file should be excluded from ZIP export
 */
function shouldExcludeFile(filePath: string): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
 * Recursively collect files from project directory
 */
async function collectFiles(
  dirPath: string,
  relativePath: string = ''
): Promise<Array<{ absolutePath: string; relativePath: string }>> {
  const files: Array<{ absolutePath: string; relativePath: string }> = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryRelativePath = path.join(relativePath, entry.name);
    const entryAbsolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively collect from subdirectory
      const subFiles = await collectFiles(entryAbsolutePath, entryRelativePath);
      files.push(...subFiles);
    } else if (!shouldExcludeFile(entryRelativePath)) {
      files.push({
        absolutePath: entryAbsolutePath,
        relativePath: entryRelativePath,
      });
    }
  }

  return files;
}

/**
 * Export a project as a ZIP file, streamed directly to the response
 */
export async function exportProjectAsZip(
  projectId: string,
  res: Response
): Promise<void> {
  // Verify project exists and get metadata
  const project = await getProject(projectId);
  const projectPath = getProjectPath(projectId);

  // Check if project directory exists
  try {
    await fs.access(projectPath);
  } catch {
    throw new NotFoundError('Project directory', projectId);
  }

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const safeProjectName = project.name.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const filename = `${safeProjectName}_${date}.zip`;

  // Set response headers
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Create archiver instance
  const archive = archiver('zip', {
    zlib: { level: 6 }, // Compression level (0-9)
  });

  // Handle archive errors
  archive.on('error', (err) => {
    throw new InternalError(`ZIP generation failed: ${err.message}`);
  });

  // Pipe archive to response
  archive.pipe(res);

  // Collect and add files to archive
  const files = await collectFiles(projectPath);

  for (const file of files) {
    archive.file(file.absolutePath, { name: file.relativePath });
  }

  // Finalize archive
  await archive.finalize();
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/services/exportService.ts
git commit -m "feat(backend): add exportService for ZIP generation"
```

---

## Task 3: Add Export Route

**Files:**
- Modify: `apps/backend/src/routes/projects.ts`

- [ ] **Step 1: Add import for exportService**

Add to imports at the top of `apps/backend/src/routes/projects.ts`:

```typescript
import { exportProjectAsZip } from '../services/exportService.js';
```

- [ ] **Step 2: Add export route handler before existing routes**

Add after the existing imports and before the existing routes in `apps/backend/src/routes/projects.ts`:

```typescript
router.get(
  '/:id/export',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      await exportProjectAsZip(req.params.id, res);
    } catch (error) {
      next(error);
    }
  }
);
```

**Note:** Add this route before the `router.use('/:id/files', fileRoutes);` line to avoid route conflicts.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/routes/projects.ts
git commit -m "feat(backend): add project export endpoint"
```

---

## Task 4: Add Frontend Export API

**Files:**
- Modify: `apps/frontend/src/services/projectApi.ts`

- [ ] **Step 1: Add exportProject function to projectApi**

Add to the `projectApi` object in `apps/frontend/src/services/projectApi.ts` (after the existing methods):

```typescript
  async exportProject(projectId: string, projectName: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/export`);

    if (!response.ok) {
      let errorMsg = 'Failed to export project';
      try {
        const error = await response.json();
        if (error.error?.message) errorMsg = error.error.message;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    // Get the blob from response
    const blob = await response.blob();

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `${safeProjectName}_${date}.zip`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    window.URL.revokeObjectURL(url);
  },
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/services/projectApi.ts
git commit -m "feat(frontend): add exportProject API function"
```

---

## Task 5: Add Export Button to ProjectList

**Files:**
- Modify: `apps/frontend/src/pages/ProjectList.tsx`

- [ ] **Step 1: Add state and handler for export**

Add to imports at the top:
```typescript
import { useState } from 'react';
```

Find the component where `projects` are mapped. Add state for tracking which project is being exported:

```typescript
const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);
```

Add the export handler inside the component:

```typescript
const handleExport = async (projectId: string, projectName: string) => {
  setExportingProjectId(projectId);
  try {
    await projectApi.exportProject(projectId, projectName);
    showToast('Project exported successfully', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export project';
    showToast(message, 'error');
  } finally {
    setExportingProjectId(null);
  }
};
```

- [ ] **Step 2: Add export button to project cards**

Find where project cards are rendered (look for the map over `projects`). Add an export button next to the delete button in each card:

```tsx
<button
  onClick={() => handleExport(project.id, project.name)}
  disabled={exportingProjectId === project.id}
  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
  title="Export as ZIP"
>
  {exportingProjectId === project.id ? (
    <span className="inline-block w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )}
</button>
```

**Note:** Place this button before or after the delete button, with similar styling.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/ProjectList.tsx
git commit -m "feat(frontend): add export button to ProjectList"
```

---

## Task 6: Add Export Button to ProjectDetail

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx`

- [ ] **Step 1: Add state and handler for export**

Add state for tracking export loading:

```typescript
const [isExporting, setIsExporting] = useState(false);
```

Add the export handler inside the component (where `project` is available):

```typescript
const handleExport = async () => {
  if (!project) return;
  
  setIsExporting(true);
  try {
    await projectApi.exportProject(project.id, project.name);
    showToast('Project exported successfully', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export project';
    showToast(message, 'error');
  } finally {
    setIsExporting(false);
  }
};
```

- [ ] **Step 2: Add export button to toolbar**

Find the toolbar/header area where action buttons like Compile are located. Add the export button:

```tsx
<button
  onClick={handleExport}
  disabled={isExporting}
  className="flex items-center gap-2 px-3 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
  title="Export as ZIP"
>
  {isExporting ? (
    <span className="inline-block w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )}
  <span className="text-sm">Export</span>
</button>
```

**Note:** Place this button near other action buttons (Compile, Save) with consistent styling.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(frontend): add export button to ProjectDetail"
```

---

## Task 7: Type Checking

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript type checking**

```bash
pnpm typecheck
```

Expected: No TypeScript errors related to the new code

- [ ] **Step 2: Fix any type errors**

If there are errors, fix them and re-run typecheck until clean.

---

## Task 8: Manual Testing

**Files:**
- No file changes

- [ ] **Step 1: Start development servers**

```bash
pnpm dev
```

Wait for both frontend (port 3000) and backend (port 3001) to start.

- [ ] **Step 2: Create a test project**

1. Open http://localhost:3000
2. Create a new project with some files
3. Add a main.tex with some content
4. Create a subdirectory with an image file

- [ ] **Step 3: Test export from Project List**

1. On the Project List page, click the export icon on a project card
2. Verify:
   - Button shows spinner while exporting
   - ZIP file downloads automatically
   - Filename format: `{project-name}_{YYYY-MM-DD}.zip`
   - Success toast appears
   - Button returns to normal state

- [ ] **Step 4: Test export from Project Detail**

1. Open a project
2. Click the Export button in the toolbar
3. Verify same behavior as above

- [ ] **Step 5: Verify ZIP contents**

1. Extract the downloaded ZIP
2. Verify:
   - All source files are present (.tex, images, etc.)
   - `output/` directory is NOT present
   - Auxiliary files (.aux, .log) are NOT present
   - File structure is preserved

- [ ] **Step 6: Test error handling**

1. Try exporting a non-existent project (if possible)
2. Verify error toast appears with appropriate message

- [ ] **Step 7: Test with Overleaf**

1. Go to https://www.overleaf.com
2. Create a new project → Upload project
3. Upload the exported ZIP
4. Verify project opens correctly and compiles

---

## Task 9: Final Commit and Summary

- [ ] **Step 1: Final review**

Check all files are staged and committed:
```bash
git status
```

- [ ] **Step 2: Create final commit if needed**

If there are any uncommitted changes:
```bash
git add -A
git commit -m "feat: implement ZIP export feature

- Add backend endpoint for streaming ZIP export
- Add export button to ProjectList page
- Add export button to ProjectDetail page
- Exclude compilation artifacts from export
- Generate filename with project name and date"
```

- [ ] **Step 3: Verify branch status**

```bash
git log --oneline -5
```

Expected: Feature commits on `feature/zip-export` branch

---

## Verification Checklist

- [ ] Backend dependencies installed (archiver, @types/archiver)
- [ ] exportService.ts created with ZIP generation logic
- [ ] Export route added to projects.ts
- [ ] exportProject function added to projectApi.ts
- [ ] Export button added to ProjectList page
- [ ] Export button added to ProjectDetail page
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed successfully
- [ ] ZIP contents verified (correct files included/excluded)
- [ ] Overleaf import tested successfully
- [ ] All changes committed to feature/zip-export branch

---

## Notes

1. **Pattern Matching:** The export service uses regex patterns to exclude files. Ensure these patterns work on both Windows and Unix paths (backslashes vs forward slashes).

2. **Filename Sanitization:** Project names with special characters are sanitized to safe filenames by replacing invalid characters with underscores.

3. **Streaming:** The ZIP is streamed directly to the response without creating temporary files, making it memory-efficient for large projects.

4. **Toast Notifications:** The frontend uses the existing toast system for feedback. Ensure `showToast` is available in both pages.

---

**Plan created:** 2025-04-15  
**Branch:** feature/zip-export  
**Based on spec:** docs/superpowers/specs/2025-04-15-zip-export-design.md
