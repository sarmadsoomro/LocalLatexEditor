# Enhanced File Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance file management capabilities with drag-and-drop file reordering, duplicate file, bulk operations, and main file designation features.

**Architecture:** Extend existing file API and FileTree component with drag-and-drop support, add backend endpoints for file operations, and improve file context menu with new actions.

**Tech Stack:** React DnD (or native HTML5 drag-and-drop), Express, Zustand

---

## File Structure

```
apps/frontend/src/
├── components/
│   ├── FileTree.tsx             # Enhance with drag-and-drop
│   ├── FileContextMenu.tsx      # New context menu component
│   └── DragPreview.tsx          # Visual feedback during drag
├── hooks/
│   └── useFileDragDrop.ts       # Drag-and-drop logic hook
└── services/
    └── fileApi.ts               # Extend with new operations

apps/backend/src/
├── routes/
│   └── files.ts                 # Add new endpoints
└── services/
    └── fileSystemService.ts     # Add file operations
```

---

## Task 1: Extend File API Service

**Files:**
- Modify: `apps/frontend/src/services/fileApi.ts`

**Purpose:** Add API methods for new file operations.

- [ ] **Step 1: Add new file operations to API service**

```typescript
// Add to apps/frontend/src/services/fileApi.ts

export const fileApi = {
  // ... existing methods ...

  /**
   * Duplicate a file
   */
  duplicateFile: async (projectId: string, filePath: string): Promise<FileNode> => {
    const response = await api.post<FileResponse>(
      `/projects/${projectId}/files/${encodeURIComponent(filePath)}/duplicate`
    );
    return response.data.data;
  },

  /**
   * Move a file to a different folder
   */
  moveFile: async (
    projectId: string,
    sourcePath: string,
    targetPath: string
  ): Promise<FileNode> => {
    const response = await api.post<FileResponse>(
      `/projects/${projectId}/files/${encodeURIComponent(sourcePath)}/move`,
      { targetPath }
    );
    return response.data.data;
  },

  /**
   * Set the main compilation file for a project
   */
  setMainFile: async (projectId: string, filePath: string): Promise<void> => {
    await api.post(`/projects/${projectId}/main-file`, { filePath });
  },

  /**
   * Get project statistics (file counts, sizes)
   */
  getProjectStats: async (projectId: string): Promise<ProjectStats> => {
    const response = await api.get<ApiResponse<ProjectStats>>(
      `/projects/${projectId}/stats`
    );
    return response.data.data;
  },
};

// Add type definitions
export interface ProjectStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/services/fileApi.ts
git commit -m "feat(files): extend file API with duplicate, move, and main file operations"
```

---

## Task 2: Create Backend Endpoints for File Operations

**Files:**
- Modify: `apps/backend/src/routes/files.ts`
- Modify: `apps/backend/src/services/fileSystemService.ts`

**Purpose:** Add server-side support for enhanced file operations.

- [ ] **Step 1: Add file operations to backend service**

```typescript
// Add to apps/backend/src/services/fileSystemService.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { storage } from '../config/storage';
import type { FileNode } from '../types/project';

export class FileSystemService {
  // ... existing methods ...

  /**
   * Duplicate a file
   */
  async duplicateFile(projectId: string, filePath: string): Promise<FileNode> {
    const projectPath = storage.getProjectPath(projectId);
    const fullPath = path.join(projectPath, filePath);
    const dir = path.dirname(fullPath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);

    // Find a unique name
    let counter = 1;
    let newPath: string;
    do {
      const newName = `${base}_copy${counter}${ext}`;
      newPath = path.join(dir, newName);
      counter++;
    } while (await this.fileExists(newPath));

    // Copy file
    await fs.copyFile(fullPath, newPath);

    return this.buildFileNode(newPath, projectPath);
  }

  /**
   * Move a file to a new location
   */
  async moveFile(
    projectId: string,
    sourcePath: string,
    targetPath: string
  ): Promise<FileNode> {
    const projectPath = storage.getProjectPath(projectId);
    const sourceFullPath = path.join(projectPath, sourcePath);
    const targetFullPath = path.join(projectPath, targetPath);

    // Ensure target directory exists
    const targetDir = path.dirname(targetFullPath);
    await fs.mkdir(targetDir, { recursive: true });

    // Move file
    await fs.rename(sourceFullPath, targetFullPath);

    return this.buildFileNode(targetFullPath, projectPath);
  }

  /**
   * Get project file statistics
   */
  async getProjectStats(projectId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  }> {
    const projectPath = storage.getProjectPath(projectId);
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byType: {} as Record<string, { count: number; size: number }>,
    };

    const processDirectory = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== 'output') {
          await processDirectory(fullPath);
        } else if (entry.isFile()) {
          const fileStats = await fs.stat(fullPath);
          const ext = path.extname(entry.name).toLowerCase() || 'no-extension';

          stats.totalFiles++;
          stats.totalSize += fileStats.size;

          if (!stats.byType[ext]) {
            stats.byType[ext] = { count: 0, size: 0 };
          }
          stats.byType[ext].count++;
          stats.byType[ext].size += fileStats.size;
        }
      }
    };

    await processDirectory(projectPath);
    return stats;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async buildFileNode(fullPath: string, projectPath: string): Promise<FileNode> {
    const stats = await fs.stat(fullPath);
    const relativePath = path.relative(projectPath, fullPath);

    return {
      name: path.basename(fullPath),
      path: relativePath,
      type: 'file',
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
  }
}

export const fileSystemService = new FileSystemService();
```

- [ ] **Step 2: Add endpoints to routes**

```typescript
// Add to apps/backend/src/routes/files.ts

// Duplicate file
router.post('/:path/duplicate', async (req, res, next) => {
  try {
    const { projectId, path: filePath } = req.params;
    const file = await fileSystemService.duplicateFile(projectId, filePath);
    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
});

// Move file
router.post('/:path/move', async (req, res, next) => {
  try {
    const { projectId, path: sourcePath } = req.params;
    const { targetPath } = req.body;
    const file = await fileSystemService.moveFile(projectId, sourcePath, targetPath);
    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
});

// Get project stats
router.get('/stats', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const stats = await fileSystemService.getProjectStats(projectId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/services/fileSystemService.ts apps/backend/src/routes/files.ts
git commit -m "feat(files): add backend support for duplicate, move, and stats operations"
```

---

## Task 3: Create Drag-and-Drop Hook

**Files:**
- Create: `apps/frontend/src/hooks/useFileDragDrop.ts`

**Purpose:** Manage drag-and-drop state and operations.

- [ ] **Step 1: Create drag-and-drop hook**

```typescript
// apps/frontend/src/hooks/useFileDragDrop.ts

import { useState, useCallback, useRef } from 'react';
import type { FileNode } from '../types/project';

interface DragState {
  isDragging: boolean;
  draggedItem: FileNode | null;
  dragOverItem: FileNode | null;
  dragOverFolder: string | null;
}

interface UseFileDragDropOptions {
  projectId: string;
  onMoveFile: (sourcePath: string, targetPath: string) => Promise<void>;
}

export function useFileDragDrop({ projectId, onMoveFile }: UseFileDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverItem: null,
    dragOverFolder: null,
  });

  const dragCounter = useRef(0);

  const handleDragStart = useCallback((item: FileNode) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOverItem: null,
      dragOverFolder: null,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverItem: null,
      dragOverFolder: null,
    });
    dragCounter.current = 0;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, item?: FileNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (item && item.type === 'directory') {
      setDragState((prev) => ({
        ...prev,
        dragOverFolder: item.path,
      }));
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, item?: FileNode) => {
    e.preventDefault();
    dragCounter.current++;

    if (item) {
      setDragState((prev) => ({
        ...prev,
        dragOverItem: item,
        dragOverFolder: item.type === 'directory' ? item.path : prev.dragOverFolder,
      }));
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;

    if (dragCounter.current === 0) {
      setDragState((prev) => ({
        ...prev,
        dragOverItem: null,
        dragOverFolder: null,
      }));
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetItem?: FileNode) => {
      e.preventDefault();
      e.stopPropagation();

      const { draggedItem } = dragState;
      if (!draggedItem) return;

      // Determine target path
      let targetPath: string;
      if (targetItem) {
        if (targetItem.type === 'directory') {
          // Drop into folder
          targetPath = `${targetItem.path}/${draggedItem.name}`;
        } else {
          // Drop next to file (same directory)
          const parentPath = targetItem.path.substring(0, targetItem.path.lastIndexOf('/'));
          targetPath = parentPath ? `${parentPath}/${draggedItem.name}` : draggedItem.name;
        }
      } else {
        // Drop into root
        targetPath = draggedItem.name;
      }

      // Don't move if paths are the same
      if (draggedItem.path !== targetPath) {
        await onMoveFile(draggedItem.path, targetPath);
      }

      handleDragEnd();
    },
    [dragState, onMoveFile, handleDragEnd]
  );

  const handleExternalDrop = useCallback(
    async (e: React.DragEvent, targetFolder?: string) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      
      // Handle external file drops
      for (const file of files) {
        // Upload logic here
        console.log('Upload file:', file.name, 'to folder:', targetFolder);
      }

      handleDragEnd();
    },
    [handleDragEnd]
  );

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleExternalDrop,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/hooks/useFileDragDrop.ts
git commit -m "feat(files): add useFileDragDrop hook for drag-and-drop operations"
```

---

## Task 4: Enhance FileTree with Context Menu

**Files:**
- Create: `apps/frontend/src/components/FileContextMenu.tsx`
- Modify: `apps/frontend/src/components/FileTree.tsx`

**Purpose:** Add right-click context menu with file operations.

- [ ] **Step 1: Create FileContextMenu component**

```typescript
// apps/frontend/src/components/FileContextMenu.tsx

import React, { useRef, useEffect } from 'react';
import {
  Copy,
  Scissors,
  Trash2,
  Edit3,
  Star,
  RefreshCw,
  Download,
  FolderPlus,
  FilePlus,
} from 'lucide-react';
import type { FileNode } from '../types/project';

interface FileContextMenuProps {
  file: FileNode;
  position: { x: number; y: number };
  isMainFile: boolean;
  onClose: () => void;
  onRename: (file: FileNode) => void;
  onDelete: (file: FileNode) => void;
  onDuplicate: (file: FileNode) => void;
  onSetMainFile: (file: FileNode) => void;
  onRefresh: (file: FileNode) => void;
  onNewFile: (folder: FileNode) => void;
  onNewFolder: (folder: FileNode) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  position,
  isMainFile,
  onClose,
  onRename,
  onDelete,
  onDuplicate,
  onSetMainFile,
  onRefresh,
  onNewFile,
  onNewFolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    ...(file.type === 'directory'
      ? [
          {
            label: 'New File',
            icon: <FilePlus size={14} />,
            action: () => onNewFile(file),
          },
          {
            label: 'New Folder',
            icon: <FolderPlus size={14} />,
            action: () => onNewFolder(file),
          },
          { type: 'separator' as const },
        ]
      : []),
    ...(file.type === 'file' && file.name.endsWith('.tex') && !isMainFile
      ? [
          {
            label: 'Set as Main File',
            icon: <Star size={14} />,
            action: () => onSetMainFile(file),
          },
        ]
      : []),
    {
      label: 'Rename',
      icon: <Edit3 size={14} />,
      action: () => onRename(file),
    },
    {
      label: 'Duplicate',
      icon: <Copy size={14} />,
      action: () => onDuplicate(file),
    },
    { type: 'separator' as const },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      action: () => onDelete(file),
      danger: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-xl py-1"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
          {file.name}
        </p>
      </div>
      
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="my-1 border-t border-[var(--color-border)]" />;
        }

        return (
          <button
            key={index}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
              item.danger
                ? 'text-[var(--color-error)] hover:bg-[var(--color-error)]/10'
                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Update FileTree component**

Add to imports in FileTree.tsx:

```typescript
import { FileContextMenu } from './FileContextMenu';
import { useFileDragDrop } from '../hooks/useFileDragDrop';
```

Add state:

```typescript
const [contextMenu, setContextMenu] = useState<{
  file: FileNode;
  position: { x: number; y: number };
} | null>(null);
```

Add drag-and-drop hook:

```typescript
const { dragState, handleDragStart, handleDragOver, handleDragEnter, handleDragLeave, handleDrop } =
  useFileDragDrop({
    projectId,
    onMoveFile: async (source, target) => {
      try {
        await fileApi.moveFile(projectId, source, target);
        // Refresh file tree
        onRefresh();
      } catch (error) {
        console.error('Failed to move file:', error);
      }
    },
  });
```

Add right-click handler:

```typescript
const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
  e.preventDefault();
  e.stopPropagation();
  setContextMenu({
    file,
    position: { x: e.clientX, y: e.clientY },
  });
};
```

Add to file item rendering (draggable attributes and context menu handler):

```typescript
<div
  draggable
  onDragStart={() => handleDragStart(file)}
  onDragOver={(e) => handleDragOver(e, file)}
  onDragEnter={(e) => handleDragEnter(e, file)}
  onDragLeave={handleDragLeave}
  onDrop={(e) => handleDrop(e, file)}
  onContextMenu={(e) => handleContextMenu(e, file)}
  className={`... ${dragState.dragOverFolder === file.path ? 'bg-[var(--color-primary)]/10' : ''}`}
>
  {/* File item content */}
</div>
```

Add context menu component:

```typescript
{contextMenu && (
  <FileContextMenu
    file={contextMenu.file}
    position={contextMenu.position}
    isMainFile={contextMenu.file.path === mainFilePath}
    onClose={() => setContextMenu(null)}
    onRename={(file) => {/* handle rename */}}
    onDelete={(file) => onDeleteFile?.(file)}
    onDuplicate={async (file) => {
      try {
        await fileApi.duplicateFile(projectId, file.path);
        onRefresh();
      } catch (error) {
        console.error('Failed to duplicate file:', error);
      }
    }}
    onSetMainFile={async (file) => {
      try {
        await fileApi.setMainFile(projectId, file.path);
        // Update main file state
      } catch (error) {
        console.error('Failed to set main file:', error);
      }
    }}
    onRefresh={(file) => onRefresh()}
    onNewFile={(folder) => {/* handle new file */}}
    onNewFolder={(folder) => {/* handle new folder */}}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/FileContextMenu.tsx apps/frontend/src/components/FileTree.tsx
git commit -m "feat(files): add context menu with enhanced file operations"
```

---

## Task 5: Add Project Statistics Display

**Files:**
- Create: `apps/frontend/src/components/ProjectStats.tsx`
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx`

**Purpose:** Show project file statistics in the UI.

- [ ] **Step 1: Create ProjectStats component**

```typescript
// apps/frontend/src/components/ProjectStats.tsx

import React, { useEffect, useState } from 'react';
import { FileText, HardDrive, Layers } from 'lucide-react';
import { fileApi } from '../services/fileApi';
import type { ProjectStats } from '../services/fileApi';

interface ProjectStatsProps {
  projectId: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ projectId }) => {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fileApi.getProjectStats(projectId);
        setStats(data);
      } catch (error) {
        console.error('Failed to load project stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-[var(--color-text-secondary)]">
        <div className="animate-spin w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const fileTypes = Object.entries(stats.byType)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <div className="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        Project Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[var(--color-primary)]" />
          <div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {stats.totalFiles}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">Files</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <HardDrive size={16} className="text-[var(--color-primary)]" />
          <div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {formatBytes(stats.totalSize)}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">Total Size</p>
          </div>
        </div>
      </div>

      {fileTypes.length > 0 && (
        <>
          <div className="border-t border-[var(--color-border)] pt-3 mb-3" />
          <h4 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            Top File Types
          </h4>
          <div className="space-y-1">
            {fileTypes.map(([ext, data]) => (
              <div key={ext} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">
                  {ext === 'no-extension' ? 'no ext' : ext}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-text-tertiary)]">
                    {data.count} files
                  </span>
                  <span className="text-[var(--color-text-secondary)] w-16 text-right">
                    {formatBytes(data.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Add to ProjectDetail sidebar**

```typescript
// In ProjectDetail.tsx sidebar, add ProjectStats:
<div className="w-64 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
  {/* File Tree */}
  <FileTree ... />
  
  {/* Project Stats */}
  <div className="p-4 border-t border-[var(--color-border)]">
    <ProjectStats projectId={projectId} />
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ProjectStats.tsx apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(files): add project statistics display"
```

---

## Summary

This implementation enhances file management with:

**Features:**
- **Duplicate files** - Create copies with automatic naming
- **Move files** - Drag-and-drop within project
- **Set main file** - Designate compilation entry point
- **Context menu** - Right-click access to file operations
- **Project statistics** - File counts and sizes by type
- **Drag-and-drop** - Visual feedback during operations

**Files Created:**
- `apps/frontend/src/hooks/useFileDragDrop.ts`
- `apps/frontend/src/components/FileContextMenu.tsx`
- `apps/frontend/src/components/ProjectStats.tsx`

**Files Modified:**
- `apps/frontend/src/services/fileApi.ts`
- `apps/backend/src/services/fileSystemService.ts`
- `apps/backend/src/routes/files.ts`
- `apps/frontend/src/components/FileTree.tsx`
- `apps/frontend/src/pages/ProjectDetail.tsx`

**API Endpoints Added:**
- `POST /api/projects/:id/files/:path/duplicate`
- `POST /api/projects/:id/files/:path/move`
- `GET /api/projects/:id/stats`
