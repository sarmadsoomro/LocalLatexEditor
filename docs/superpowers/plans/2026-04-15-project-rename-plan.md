# Project Rename Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the project rename feature with inline editing from both ProjectCard and ProjectDetail header.

**Architecture:** Optimistic updates via reusable EditableProjectName component, new PUT endpoint in backend, validation matching create-project rules.

**Tech Stack:** React + TypeScript + Zustand (frontend), Express + Zod (backend), Vitest for testing

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `apps/frontend/src/components/EditableProjectName.tsx` | Reusable inline editable name component |
| `apps/frontend/src/components/__tests__/EditableProjectName.test.tsx` | Component tests |

### Modified Files
| File | Changes |
|------|---------|
| `apps/backend/src/validators/project.ts` | Add `renameProjectSchema` |
| `apps/backend/src/services/projectService.ts` | Add `renameProject()` function |
| `apps/backend/src/routes/projects.ts` | Add PUT /:id route handler |
| `apps/frontend/src/services/projectApi.ts` | Add `renameProject()` method |
| `apps/frontend/src/stores/projectStore.ts` | Add `renameProject` action with optimistic updates |
| `apps/frontend/src/components/ProjectCard.tsx` | Replace static name with EditableProjectName |
| `apps/frontend/src/pages/ProjectDetail.tsx` | Replace header name with EditableProjectName |

---

## Task 1: Backend Validation Schema

**Files:**
- Modify: `apps/backend/src/validators/project.ts`

- [ ] **Step 1: Add renameProjectSchema**

Add after the existing schemas:

```typescript
export const renameProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .regex(
      /^[^<>:"\\/|?*]+$/,
      'Project name contains invalid characters'
    ),
});

export type RenameProjectInput = z.infer<typeof renameProjectSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/validators/project.ts
git commit -m "feat(backend): add renameProject validation schema"
```

---

## Task 2: Backend Service - renameProject Function

**Files:**
- Modify: `apps/backend/src/services/projectService.ts`

- [ ] **Step 1: Add renameProject function after updateProjectLastOpened**

```typescript
export async function renameProject(id: string, newName: string): Promise<ProjectWithMetadata> {
  // Validate name format
  if (!newName || newName.trim().length === 0) {
    throw new ValidationError('Project name is required');
  }
  
  if (newName.length > 100) {
    throw new ValidationError('Project name must be less than 100 characters');
  }
  
  const invalidChars = /[<>:"\/\\|?*]/;
  if (invalidChars.test(newName)) {
    throw new ValidationError('Project name contains invalid characters');
  }
  
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  // Check for name conflicts (case-insensitive, exclude self)
  const trimmedName = newName.trim();
  const existingProject = projects.find(
    (p) => p.id !== id && p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  
  if (existingProject) {
    throw new ConflictError(`Project with name "${trimmedName}" already exists`);
  }
  
  // Update project
  const project = projects[projectIndex];
  project.name = trimmedName;
  project.updatedAt = new Date().toISOString();
  
  await saveProjectsMetadata(projects);
  
  return project;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/services/projectService.ts
git commit -m "feat(backend): add renameProject service function"
```

---

## Task 3: Backend Route Handler

**Files:**
- Modify: `apps/backend/src/routes/projects.ts`

- [ ] **Step 1: Import renameProjectSchema and type**

Add to imports:
```typescript
import {
  createProjectSchema,
  projectIdSchema,
  importProjectSchema,
  renameProjectSchema,
} from '../validators/project.js';
import type { CreateProjectInput, ProjectIdInput, ImportProjectInput, RenameProjectInput } from '../validators/project.js';
```

Add `renameProject` to service imports:
```typescript
import {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  importProject,
  getProjectFiles,
  updateProjectLastOpened,
  renameProject,
} from '../services/projectService.js';
```

- [ ] **Step 2: Add PUT route handler before fileRoutes**

Add before `import fileRoutes from './files.js';`:

```typescript
router.put(
  '/:id',
  validateParams<ProjectIdInput>(projectIdSchema),
  validateBody<RenameProjectInput>(renameProjectSchema),
  async (req, res, next) => {
    try {
      const project = await renameProject(req.params.id, req.body.name);
      res.json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/routes/projects.ts
git commit -m "feat(backend): add PUT /api/projects/:id endpoint for renaming"
```

---

## Task 4: Frontend API Service

**Files:**
- Modify: `apps/frontend/src/services/projectApi.ts`

- [ ] **Step 1: Add renameProject method**

Add after `deleteProject` method:

```typescript
async renameProject(
  id: string,
  name: string,
): Promise<{ project: ProjectWithMetadata }> {
  return api.put<{ project: ProjectWithMetadata }>(`/api/projects/${id}`, {
    name,
  });
},
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/services/projectApi.ts
git commit -m "feat(frontend): add renameProject API method"
```

---

## Task 5: Frontend Store - renameProject Action

**Files:**
- Modify: `apps/frontend/src/stores/projectStore.ts`

- [ ] **Step 1: Add renameProject action to store interface**

Add to the store interface/type definition:
```typescript
renameProject: (id: string, newName: string) => Promise<void>;
```

- [ ] **Step 2: Add renameProject implementation**

Add to the store implementation:

```typescript
renameProject: async (id, newName) => {
  const { projects, currentProject } = get();
  
  // Optimistic update - update UI immediately
  const previousProjects = [...projects];
  const optimisticProjects = projects.map((p) =>
    p.id === id
      ? { ...p, name: newName, updatedAt: new Date().toISOString() }
      : p,
  );
  
  set({
    projects: optimisticProjects,
    currentProject:
      currentProject?.id === id
        ? { ...currentProject, name: newName, updatedAt: new Date().toISOString() }
        : currentProject,
  });

  try {
    const response = await projectApi.renameProject(id, newName);
    
    // Update with server response (ensures timestamp precision)
    set({
      projects: optimisticProjects.map((p) =>
        p.id === id ? response.project : p,
      ),
      currentProject:
        currentProject?.id === id ? response.project : currentProject,
    });
  } catch (error) {
    // Rollback on error
    set({
      projects: previousProjects,
      currentProject:
        currentProject?.id === id ? currentProject : get().currentProject,
    });
    throw error;
  }
},
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/stores/projectStore.ts
git commit -m "feat(frontend): add renameProject action with optimistic updates"
```

---

## Task 6: EditableProjectName Component

**Files:**
- Create: `apps/frontend/src/components/EditableProjectName.tsx`

- [ ] **Step 1: Create the component file**

```typescript
import { useState, useRef, useCallback } from 'react';

interface EditableProjectNameProps {
  projectId: string;
  initialName: string;
  onRename: (newName: string) => Promise<void>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

export function EditableProjectName({
  projectId,
  initialName,
  onRename,
  className = '',
  size = 'md',
}: EditableProjectNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Project name is required';
    }
    if (trimmed.length > 100) {
      return 'Project name must be less than 100 characters';
    }
    const invalidChars = /[<>:"\/\\|?*]/;
    if (invalidChars.test(trimmed)) {
      return 'Project name contains invalid characters';
    }
    return null;
  };

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(initialName);
    setError(null);
    // Focus and select all text after render
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [initialName]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(initialName);
    setError(null);
  }, [initialName]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();
    
    // Skip if unchanged
    if (trimmedValue === initialName) {
      setIsEditing(false);
      setError(null);
      return;
    }

    // Validate
    const validationError = validateName(trimmedValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onRename(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename project';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, initialName, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    // Small delay to allow click events to process
    setTimeout(() => {
      handleCancel();
    }, 200);
  }, [handleCancel]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    // Clear error on change
    if (error) {
      setError(null);
    }
  }, [error]);

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          className={`
            ${sizeClasses[size]}
            w-full px-2 py-1 rounded
            border-2 
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#14B8A6] focus:border-[#0D9488] focus:ring-[#14B8A6]'}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            bg-white
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Edit project name"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `error-${projectId}` : undefined}
        />
        {isSaving && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <span className="inline-block w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        {error && (
          <p
            id={`error-${projectId}`}
            className="absolute -bottom-5 left-0 text-xs text-red-600 whitespace-nowrap"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <span
      onClick={handleStartEdit}
      className={`
        ${sizeClasses[size]}
        ${className}
        cursor-pointer
        hover:text-[#0D9488]
        transition-colors duration-150
        truncate
        inline-block
        max-w-full
      `}
      title="Click to rename"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
    >
      {initialName}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/EditableProjectName.tsx
git commit -m "feat(frontend): create EditableProjectName component"
```

---

## Task 7: Update ProjectCard Component

**Files:**
- Modify: `apps/frontend/src/components/ProjectCard.tsx`

- [ ] **Step 1: Import EditableProjectName and useProjectStore**

Add imports:
```typescript
import { EditableProjectName } from './EditableProjectName';
import { useProjectStore } from '../stores/projectStore';
```

- [ ] **Step 2: Add onRename prop**

Update interface:
```typescript
interface ProjectCardProps {
  project: ProjectWithMetadata;
  onClick?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onRename?: (newName: string) => Promise<void>;
  isExporting?: boolean;
}
```

- [ ] **Step 3: Update component signature and add rename handler**

```typescript
export function ProjectCard({ 
  project, 
  onClick, 
  onDelete, 
  onExport, 
  onRename,
  isExporting 
}: ProjectCardProps) {
  const { renameProject } = useProjectStore();

  const handleRename = async (newName: string) => {
    if (onRename) {
      await onRename(newName);
    } else {
      await renameProject(project.id, newName);
    }
  };
```

- [ ] **Step 4: Replace project name with EditableProjectName**

Replace the `<h3>` element:
```typescript
// Replace this:
// <h3 className="font-heading text-lg font-semibold text-[#134E4A] truncate group-hover:text-[#0D9488] transition-colors duration-150">
//   {project.name}
// </h3>

// With this:
<EditableProjectName
  projectId={project.id}
  initialName={project.name}
  onRename={handleRename}
  size="lg"
  className="font-heading text-[#134E4A] group-hover:text-[#0D9488] transition-colors duration-150"
/>
```

- [ ] **Step 5: Prevent card click when editing**

Add click handler to stop propagation on the container:
```typescript
<div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/ProjectCard.tsx
git commit -m "feat(frontend): integrate EditableProjectName into ProjectCard"
```

---

## Task 8: Update ProjectDetail Header

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx`

- [ ] **Step 1: Import EditableProjectName**

Add import:
```typescript
import { EditableProjectName } from '../components/EditableProjectName';
```

- [ ] **Step 2: Extract renameProject from store**

Add to the destructured store properties:
```typescript
const {
  currentProject,
  setCurrentProject,
  renameProject, // Add this
  // ... other properties
} = useProjectStore(
  // ... selector
);
```

- [ ] **Step 3: Replace project name in header**

Find the header section with `{currentProject?.name || "Loading..."}` and replace with:

```typescript
{currentProject ? (
  <EditableProjectName
    projectId={currentProject.id}
    initialName={currentProject.name}
    onRename={async (newName) => {
      await renameProject(currentProject.id, newName);
    }}
    size="lg"
    className="text-[#134E4A]"
  />
) : (
  "Loading..."
)}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(frontend): add inline rename to ProjectDetail header"
```

---

## Task 9: Test the Feature

- [ ] **Step 1: Start development servers**

```bash
pnpm dev
```

- [ ] **Step 2: Test from ProjectCard**
1. Navigate to project list
2. Click on a project name
3. Type a new name
4. Press Enter - should save
5. Verify name updated in UI

- [ ] **Step 3: Test from ProjectDetail**
1. Open a project
2. Click the project name in header
3. Type a new name
4. Press Enter - should save
5. Navigate back to list - name should persist

- [ ] **Step 4: Test validation errors**
1. Try renaming to empty string - should show error
2. Try renaming to name with invalid chars (`<`, `>`, etc.) - should show error
3. Try renaming to existing project name - should show error

- [ ] **Step 5: Test keyboard navigation**
1. Press Escape while editing - should cancel and revert
2. Press Enter with no changes - should exit edit mode

- [ ] **Step 6: Run lint and typecheck**

```bash
pnpm lint
pnpm typecheck
```

Expected: No errors

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: complete project rename feature with inline editing

- Add PUT /api/projects/:id endpoint
- Add renameProject service function with validation
- Create EditableProjectName reusable component
- Integrate into ProjectCard and ProjectDetail
- Support optimistic updates with rollback on error
- Full keyboard navigation (Enter, Escape)"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Backend:
  - [ ] PUT endpoint responds correctly
  - [ ] Validation works (empty, too long, invalid chars, duplicate)
  - [ ] 404 for non-existent project
  - [ ] 409 for duplicate name

- [ ] Frontend:
  - [ ] Clicking name enters edit mode
  - [ ] Enter saves changes
  - [ ] Escape cancels changes
  - [ ] Validation errors show inline
  - [ ] Optimistic update feels instant
  - [ ] Rollback works on API error
  - [ ] Works on both ProjectCard and ProjectDetail

- [ ] Code Quality:
  - [ ] All TypeScript compiles
  - [ ] ESLint passes
  - [ ] Follows existing code patterns
  - [ ] No console errors
