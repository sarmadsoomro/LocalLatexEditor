# Project Status, Filters & Trash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement functional sidebar filters (Your Projects, Published, In Progress) and trash functionality with soft delete

**Architecture:** Add `status` and `deletedAt` fields to ProjectMetadata, implement soft-delete pattern, create trash service methods, update frontend store with filter state and selectors

**Tech Stack:** TypeScript, Zustand, Express, React

---

## File Structure Overview

**Backend Changes:**
- `packages/shared-types/src/project.ts` - Add status type and deletedAt field
- `apps/backend/src/services/projectService.ts` - Add status/deletedAt to create, update delete to soft delete
- `apps/backend/src/services/trashService.ts` - New service for trash operations
- `apps/backend/src/routes/projects.ts` - Add trash endpoints
- `apps/backend/src/validators/project.ts` - Add status validation schema

**Frontend Changes:**
- `apps/frontend/src/stores/projectStore.ts` - Add filter state and selectors
- `apps/frontend/src/services/projectApi.ts` - Add trash API methods
- `apps/frontend/src/pages/ProjectList.tsx` - Wire up sidebar filters
- `apps/frontend/src/components/ProjectCard.tsx` - Add status badges

---

## Task 1: Update Shared Types

**Files:**
- Modify: `packages/shared-types/src/project.ts`

- [ ] **Step 1: Add ProjectStatus type and update ProjectMetadata**

```typescript
export type ProjectStatus = 'draft' | 'in_progress' | 'published';

export interface ProjectMetadata {
  mainFile: string;
  template: Template;
  lastOpened?: Date;
  fileCount: number;
  totalSize: number;
  status: ProjectStatus;
  deletedAt?: string | null;
}
```

- [ ] **Step 2: Add filter and trash-related types**

```typescript
export type ProjectFilter = 'all' | 'your_projects' | 'published' | 'in_progress' | 'trash';

export interface ListProjectsQuery {
  filter?: ProjectFilter;
}

export interface TrashProjectResponse {
  project: ProjectWithMetadata;
}

export interface ListTrashResponse {
  projects: ProjectWithMetadata[];
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/project.ts
git commit -m "feat(types): add ProjectStatus, deletedAt, and filter types"
```

---

## Task 2: Update Project Service - Add Status and Soft Delete

**Files:**
- Modify: `apps/backend/src/services/projectService.ts`

- [ ] **Step 1: Update createProject to include default status**

Find the `createProject` function and update the project creation to include status:

```typescript
export async function createProject(request: CreateProjectRequest): Promise<ProjectWithMetadata> {
  const { name, template = 'article' } = request;
  
  // ... existing validation code ...
  
  const project: ProjectWithMetadata = {
    id: nanoid(),
    name: name.trim(),
    path: projectPath,
    createdAt: now,
    updatedAt: now,
    metadata: {
      mainFile: `${mainFileName}.tex`,
      template,
      fileCount: templateFiles.length,
      totalSize: 0,
      status: 'draft', // Default status
      deletedAt: null,
    },
    settings: {
      compiler: 'pdflatex',
      outputDirectory: 'output',
    },
  };
  
  // ... rest of function ...
}
```

- [ ] **Step 2: Update deleteProject to soft delete**

Replace the hard delete with soft delete:

```typescript
export async function deleteProject(id: string): Promise<ProjectWithMetadata> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  // Soft delete - mark as deleted
  const updatedProject = {
    ...projects[projectIndex],
    metadata: {
      ...projects[projectIndex].metadata,
      deletedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
  
  projects[projectIndex] = updatedProject;
  await saveProjectsMetadata(projects);
  
  return updatedProject;
}
```

- [ ] **Step 3: Update listProjects to filter out deleted projects**

```typescript
export async function listProjects(): Promise<ProjectWithMetadata[]> {
  const projects = await loadProjectsMetadata();
  // Filter out deleted projects by default
  return projects.filter((p) => !p.metadata.deletedAt);
}
```

- [ ] **Step 4: Add method to update project status**

```typescript
export async function updateProjectStatus(
  id: string, 
  status: ProjectStatus
): Promise<ProjectWithMetadata> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  const updatedProject = {
    ...projects[projectIndex],
    metadata: {
      ...projects[projectIndex].metadata,
      status,
    },
    updatedAt: new Date().toISOString(),
  };
  
  projects[projectIndex] = updatedProject;
  await saveProjectsMetadata(projects);
  
  return updatedProject;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/projectService.ts
git commit -m "feat(backend): add status field and soft delete to project service"
```

---

## Task 3: Create Trash Service

**Files:**
- Create: `apps/backend/src/services/trashService.ts`

- [ ] **Step 1: Create trash service file**

```typescript
import type { ProjectWithMetadata, ProjectStatus } from '@local-latex-editor/shared-types';
import { NotFoundError } from '../types/error.js';
import { loadProjectsMetadata, saveProjectsMetadata } from './projectService.js';

export async function listTrashedProjects(): Promise<ProjectWithMetadata[]> {
  const projects = await loadProjectsMetadata();
  return projects
    .filter((p) => p.metadata.deletedAt !== null && p.metadata.deletedAt !== undefined)
    .sort((a, b) => {
      const dateA = new Date(a.metadata.deletedAt!).getTime();
      const dateB = new Date(b.metadata.deletedAt!).getTime();
      return dateB - dateA; // Most recently deleted first
    });
}

export async function restoreProject(id: string): Promise<ProjectWithMetadata> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  if (!projects[projectIndex].metadata.deletedAt) {
    throw new Error('Project is not in trash');
  }
  
  const updatedProject = {
    ...projects[projectIndex],
    metadata: {
      ...projects[projectIndex].metadata,
      deletedAt: null,
    },
    updatedAt: new Date().toISOString(),
  };
  
  projects[projectIndex] = updatedProject;
  await saveProjectsMetadata(projects);
  
  return updatedProject;
}

export async function permanentlyDeleteProject(id: string): Promise<void> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  if (!projects[projectIndex].metadata.deletedAt) {
    throw new Error('Project must be in trash before permanent deletion');
  }
  
  // Remove from metadata
  projects.splice(projectIndex, 1);
  await saveProjectsMetadata(projects);
  
  // Optionally: Delete actual files from disk
  // This is destructive, so we might want to skip it or make it configurable
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/services/trashService.ts
git commit -m "feat(backend): create trash service with list, restore, and permanent delete"
```

---

## Task 4: Add Trash API Endpoints

**Files:**
- Modify: `apps/backend/src/routes/projects.ts`

- [ ] **Step 1: Import trash service functions**

Add to imports at top of file:

```typescript
import {
  listTrashedProjects,
  restoreProject,
  permanentlyDeleteProject,
} from '../services/trashService.js';
```

- [ ] **Step 2: Add GET /trash endpoint**

Add after existing routes:

```typescript
router.get('/trash', async (_req, res, next) => {
  try {
    const projects = await listTrashedProjects();
    res.json(createSuccessResponse({ projects }));
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 3: Add POST /:id/restore endpoint**

```typescript
router.post(
  '/:id/restore',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      const project = await restoreProject(req.params.id);
      res.json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);
```

- [ ] **Step 4: Add DELETE /:id/permanent endpoint**

```typescript
router.delete(
  '/:id/permanent',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      await permanentlyDeleteProject(req.params.id);
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      next(error);
    }
  }
);
```

- [ ] **Step 5: Add PUT /:id/status endpoint for updating status**

First add the status schema to validators:

```typescript
// In apps/backend/src/validators/project.ts
import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['draft', 'in_progress', 'published']),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
```

Then add the route:

```typescript
import { updateProjectStatus } from '../services/projectService.js';
import { updateStatusSchema, type UpdateStatusInput } from '../validators/project.js';

router.put(
  '/:id/status',
  validateParams<ProjectIdInput>(projectIdSchema),
  validateBody<UpdateStatusInput>(updateStatusSchema),
  async (req, res, next) => {
    try {
      const project = await updateProjectStatus(req.params.id, req.body.status);
      res.json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/routes/projects.ts apps/backend/src/validators/project.ts
git commit -m "feat(backend): add trash endpoints and status update endpoint"
```

---

## Task 5: Update listProjects to Support Filters

**Files:**
- Modify: `apps/backend/src/services/projectService.ts`
- Modify: `apps/backend/src/routes/projects.ts`

- [ ] **Step 1: Update listProjects function to accept filter parameter**

```typescript
export async function listProjects(
  filter?: 'all' | 'published' | 'in_progress' | 'your_projects'
): Promise<ProjectWithMetadata[]> {
  const projects = await loadProjectsMetadata();
  
  // Filter out deleted projects
  let filtered = projects.filter((p) => !p.metadata.deletedAt);
  
  // Apply status filters
  switch (filter) {
    case 'published':
      filtered = filtered.filter((p) => p.metadata.status === 'published');
      break;
    case 'in_progress':
      filtered = filtered.filter((p) => p.metadata.status === 'in_progress');
      break;
    case 'your_projects':
      // For now, same as all (non-deleted) projects
      // Could be extended to filter by owner in multi-user scenario
      break;
    case 'all':
    default:
      // No additional filtering
      break;
  }
  
  return filtered;
}
```

- [ ] **Step 2: Update GET / endpoint to accept query params**

```typescript
router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.filter as 'all' | 'published' | 'in_progress' | 'your_projects' | undefined;
    const projects = await listProjects(filter);
    res.json(createSuccessResponse({ projects }));
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/services/projectService.ts apps/backend/src/routes/projects.ts
git commit -m "feat(backend): update listProjects to support status filters"
```

---

## Task 6: Update Frontend ProjectStore with Filter State

**Files:**
- Modify: `apps/frontend/src/stores/projectStore.ts`

- [ ] **Step 1: Import ProjectFilter type**

```typescript
import type { 
  ProjectWithMetadata, 
  FileNode, 
  ProjectFilter,
  ProjectStatus 
} from '@local-latex-editor/shared-types';
```

- [ ] **Step 2: Add filter state to interface and store**

Add to ProjectState interface:

```typescript
interface ProjectState {
  // ... existing fields ...
  
  // Filter state
  currentFilter: ProjectFilter;
  
  // Actions
  setCurrentFilter: (filter: ProjectFilter) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  permanentlyDeleteProject: (id: string) => Promise<void>;
}
```

- [ ] **Step 3: Add filter-related state and actions to store**

```typescript
export const useProjectStore = create<ProjectState>((set) => ({
  // ... existing initial state ...
  currentFilter: 'all',
  
  // ... existing actions ...
  
  setCurrentFilter: (filter) => set({ currentFilter: filter }),
  
  updateProjectStatus: async (id, status) => {
    const { projects, currentProject } = useProjectStore.getState();
    
    // Optimistic update
    const updatedProjects = projects.map((p) =>
      p.id === id ? { ...p, metadata: { ...p.metadata, status } } : p
    );
    
    set({
      projects: updatedProjects,
      currentProject:
        currentProject?.id === id
          ? { ...currentProject, metadata: { ...currentProject.metadata, status } }
          : currentProject,
    });
    
    try {
      await projectApi.updateStatus(id, status);
    } catch (error) {
      // Rollback on error
      set({ projects, currentProject });
      throw error;
    }
  },
  
  moveToTrash: async (id) => {
    const { projects } = useProjectStore.getState();
    
    try {
      await projectApi.deleteProject(id);
      // Remove from local state
      set({
        projects: projects.filter((p) => p.id !== id),
        currentProject: null,
      });
    } catch (error) {
      throw error;
    }
  },
  
  restoreProject: async (id) => {
    try {
      const response = await projectApi.restoreProject(id);
      set((state) => ({
        projects: [response.project, ...state.projects],
      }));
    } catch (error) {
      throw error;
    }
  },
  
  permanentlyDeleteProject: async (id) => {
    try {
      await projectApi.permanentlyDeleteProject(id);
      // No need to update state as trashed projects are in a separate view
    } catch (error) {
      throw error;
    }
  },
}));
```

- [ ] **Step 4: Add filtered projects selector**

```typescript
export const selectFilteredProjects = (state: ProjectState) => {
  const { projects, currentFilter } = state;
  
  switch (currentFilter) {
    case 'published':
      return projects.filter((p) => p.metadata.status === 'published');
    case 'in_progress':
      return projects.filter((p) => p.metadata.status === 'in_progress');
    case 'your_projects':
    case 'all':
    default:
      return projects;
  }
};
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/stores/projectStore.ts
git commit -m "feat(frontend): add filter state and trash actions to project store"
```

---

## Task 7: Add Trash Operations to Project API Service

**Files:**
- Modify: `apps/frontend/src/services/projectApi.ts`

- [ ] **Step 1: Add new API methods**

```typescript
// Add to projectApi object

async function listTrashedProjects(): Promise<ProjectWithMetadata[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/trash`);
  const data = await handleResponse<ListProjectsResponse>(response);
  return data.projects;
}

async function restoreProject(id: string): Promise<ProjectWithMetadata> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/restore`, {
    method: 'POST',
  });
  const data = await handleResponse<GetProjectResponse>(response);
  return data.project;
}

async function permanentlyDeleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/permanent`, {
    method: 'DELETE',
  });
  await handleResponse<{ success: boolean }>(response);
}

async function updateStatus(id: string, status: ProjectStatus): Promise<ProjectWithMetadata> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await handleResponse<GetProjectResponse>(response);
  return data.project;
}

async function listProjects(filter?: ProjectFilter): Promise<ProjectWithMetadata[]> {
  const queryParams = filter && filter !== 'all' && filter !== 'trash' 
    ? `?filter=${filter}` 
    : '';
  const response = await fetch(`${API_BASE_URL}/api/projects${queryParams}`);
  const data = await handleResponse<ListProjectsResponse>(response);
  return data.projects;
}
```

- [ ] **Step 2: Update exports**

```typescript
export const projectApi = {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  importProject,
  importZip,
  exportProject,
  updateLastOpened,
  renameProject,
  // New methods
  listTrashedProjects,
  restoreProject,
  permanentlyDeleteProject,
  updateStatus,
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/services/projectApi.ts
git commit -m "feat(frontend): add trash and status API methods to projectApi service"
```

---

## Task 8: Update ProjectList Sidebar with Working Filters

**Files:**
- Modify: `apps/frontend/src/pages/ProjectList.tsx`

- [ ] **Step 1: Import new types and hooks**

```typescript
import type { Template, ProjectFilter } from "@local-latex-editor/shared-types";
import { useProjectStore, selectSortedProjects, selectFilteredProjects } from "../stores/projectStore";
```

- [ ] **Step 2: Update component state and store selectors**

```typescript
export function ProjectList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { 
    projects, 
    setProjects, 
    isLoading, 
    setLoading, 
    error, 
    setError,
    currentFilter,
    setCurrentFilter,
    restoreProject,
  } = useProjectStore();
  
  // Use filtered selector instead
  const filteredProjectsList = useProjectStore(selectFilteredProjects);
  
  // State for trash view
  const [trashedProjects, setTrashedProjects] = useState<ProjectWithMetadata[]>([]);
  const [isTrashView, setIsTrashView] = useState(false);
  
  // ... rest of state ...
}
```

- [ ] **Step 3: Update loadProjects to support filters**

```typescript
const loadProjects = async (filter?: ProjectFilter) => {
  setLoading(true);
  setError(null);
  try {
    const data = await projectApi.listProjects(filter === 'trash' ? undefined : filter);
    setProjects(data.projects);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load projects");
    addToast("Failed to load projects", "error");
  } finally {
    setLoading(false);
  }
};

const loadTrashedProjects = async () => {
  setLoading(true);
  setError(null);
  try {
    const projects = await projectApi.listTrashedProjects();
    setTrashedProjects(projects);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load trash");
    addToast("Failed to load trash", "error");
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 4: Update sidebar buttons to be functional**

Replace the static sidebar buttons with functional ones:

```typescript
{/* Sidebar Navigation */}
<aside className="w-64 shrink-0 hidden lg:flex flex-col gap-1">
  <button 
    onClick={() => {
      setCurrentFilter('all');
      setIsTrashView(false);
      loadProjects('all');
    }}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
      currentFilter === 'all' && !isTrashView
        ? 'text-cta bg-cta/5 border border-cta/10' 
        : 'text-secondary hover:bg-surface-hover'
    }`}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
    All Projects
  </button>
  <button 
    onClick={() => {
      setCurrentFilter('your_projects');
      setIsTrashView(false);
      loadProjects('your_projects');
    }}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
      currentFilter === 'your_projects' && !isTrashView
        ? 'text-cta bg-cta/5 border border-cta/10' 
        : 'text-secondary hover:bg-surface-hover'
    }`}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    Your Projects
  </button>
  <button 
    onClick={() => {
      setIsTrashView(true);
      loadTrashedProjects();
    }}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
      isTrashView
        ? 'text-cta bg-cta/5 border border-cta/10' 
        : 'text-secondary hover:bg-surface-hover'
    }`}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
    Trash
  </button>
  
  <div className="my-4 h-px bg-border mx-2" />
  
  <p className="px-4 text-[10px] font-black text-muted uppercase tracking-widest mb-2">Filters</p>
  <button 
    onClick={() => {
      setCurrentFilter('published');
      setIsTrashView(false);
      loadProjects('published');
    }}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
      currentFilter === 'published' && !isTrashView
        ? 'text-cta bg-cta/5 border border-cta/10' 
        : 'text-secondary hover:bg-surface-hover'
    }`}
  >
    <span className="w-2 h-2 rounded-full bg-success" />
    Published
  </button>
  <button 
    onClick={() => {
      setCurrentFilter('in_progress');
      setIsTrashView(false);
      loadProjects('in_progress');
    }}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
      currentFilter === 'in_progress' && !isTrashView
        ? 'text-cta bg-cta/5 border border-cta/10' 
        : 'text-secondary hover:bg-surface-hover'
    }`}
  >
    <span className="w-2 h-2 rounded-full bg-warning" />
    In Progress
  </button>
</aside>
```

- [ ] **Step 5: Update project grid to handle trash view**

Update the grid to show either filtered projects or trashed projects:

```typescript
// In the render section, replace filteredProjects usage:
const displayProjects = isTrashView ? trashedProjects : filteredProjectsList;

// Update the empty state for trash:
{isTrashView && trashedProjects.length === 0 && (
  <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-border">
    <Trash2 className="w-16 h-16 mx-auto mb-6 text-muted/10" />
    <p className="text-xl font-bold text-heading opacity-40">Trash is empty</p>
    <p className="text-sm text-secondary mt-2">Deleted projects will appear here</p>
  </div>
)}
```

- [ ] **Step 6: Add restore and permanent delete handlers**

```typescript
const handleRestoreProject = async (id: string) => {
  try {
    await restoreProject(id);
    setTrashedProjects(trashedProjects.filter((p) => p.id !== id));
    addToast("Project restored successfully", "success");
  } catch (err) {
    addToast(
      err instanceof Error ? err.message : "Failed to restore project",
      "error"
    );
  }
};

const handlePermanentDelete = async (id: string) => {
  try {
    await projectApi.permanentlyDeleteProject(id);
    setTrashedProjects(trashedProjects.filter((p) => p.id !== id));
    addToast("Project permanently deleted", "success");
  } catch (err) {
    addToast(
      err instanceof Error ? err.message : "Failed to delete project",
      "error"
    );
  }
};
```

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/pages/ProjectList.tsx
git commit -m "feat(frontend): wire up sidebar filters and trash view"
```

---

## Task 9: Add Status Badges to ProjectCard

**Files:**
- Modify: `apps/frontend/src/components/ProjectCard.tsx`

- [ ] **Step 1: Add status badge display**

Add status badge next to template badge:

```typescript
// Add helper function
function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'published':
      return 'bg-success/10 text-success border-success/20';
    case 'in_progress':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'draft':
    default:
      return 'bg-muted/10 text-muted border-border';
  }
}

function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'published':
      return 'Published';
    case 'in_progress':
      return 'In Progress';
    case 'draft':
    default:
      return 'Draft';
  }
}

// In the component, update the badge section:
<div className="mt-2 flex items-center gap-2">
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider text-muted border border-border">
    {project.metadata.template}
  </span>
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${getStatusColor(project.metadata.status)}`}>
    {getStatusLabel(project.metadata.status)}
  </span>
</div>
```

- [ ] **Step 2: Add status change dropdown (optional enhancement)**

Add a dropdown menu to change status:

```typescript
// Add state for status dropdown
const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

// Add click handler
const handleStatusChange = async (newStatus: ProjectStatus) => {
  try {
    await projectApi.updateStatus(project.id, newStatus);
    // Update local state or refetch
    setIsStatusMenuOpen(false);
  } catch (err) {
    console.error('Failed to update status:', err);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ProjectCard.tsx
git commit -m "feat(frontend): add status badges to ProjectCard"
```

---

## Task 10: Add Trash View with Restore Functionality

**Files:**
- Create: `apps/frontend/src/components/TrashProjectCard.tsx`

- [ ] **Step 1: Create specialized card for trash view**

```typescript
import type { ProjectWithMetadata } from "@local-latex-editor/shared-types";
import { RotateCcw, Trash2 } from "lucide-react";

interface TrashProjectCardProps {
  project: ProjectWithMetadata;
  onRestore?: () => void;
  onDelete?: () => void;
}

function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TrashProjectCard({
  project,
  onRestore,
  onDelete,
}: TrashProjectCardProps) {
  return (
    <article className="group bg-surface rounded-2xl shadow-soft-sm border border-border p-5 opacity-75 hover:opacity-100 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-xl font-bold text-heading">
            {project.name}
          </h3>
          <p className="text-xs text-muted mt-1">
            Deleted on {formatDate(project.metadata.deletedAt!)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <button
          onClick={onRestore}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-cta bg-cta/5 border border-cta/10 rounded-xl hover:bg-cta/10 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Restore
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-error bg-error/5 border border-error/10 rounded-xl hover:bg-error/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete Forever
        </button>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Update ProjectList to use TrashProjectCard in trash view**

Import and use the new component when in trash view:

```typescript
import { TrashProjectCard } from "../components/TrashProjectCard";

// In the grid section:
{isTrashView ? (
  trashedProjects.map((project) => (
    <li key={project.id}>
      <TrashProjectCard
        project={project}
        onRestore={() => handleRestoreProject(project.id)}
        onDelete={() => handlePermanentDelete(project.id)}
      />
    </li>
  ))
) : (
  // ... existing ProjectCard rendering
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/TrashProjectCard.tsx apps/frontend/src/pages/ProjectList.tsx
git commit -m "feat(frontend): add TrashProjectCard component and trash view"
```

---

## Task 11: Verify and Test

**Files:** All modified files

- [ ] **Step 1: Run type checks**

```bash
pnpm typecheck
```

Expected: No TypeScript errors

- [ ] **Step 2: Run linting**

```bash
pnpm lint
```

Expected: No lint errors

- [ ] **Step 3: Test manually**

1. Start the dev server: `pnpm dev`
2. Create a new project - verify it has "Draft" status
3. Change project status via API or UI
4. Test filters:
   - Click "Published" - should show only published projects
   - Click "In Progress" - should show only in-progress projects
   - Click "Your Projects" - should show all non-deleted projects
5. Test trash:
   - Delete a project - should disappear from main list
   - Go to Trash - should show deleted project
   - Restore project - should reappear in main list
   - Permanently delete - should be gone forever

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: implement project status, filters, and trash functionality

- Add ProjectStatus type (draft, in_progress, published)
- Add deletedAt field for soft delete
- Implement trash service with list, restore, permanent delete
- Add backend endpoints for trash operations
- Update listProjects to support status filters
- Add filter state to frontend store
- Wire up sidebar filters (Your Projects, Published, In Progress, Trash)
- Add status badges to ProjectCard
- Create TrashProjectCard with restore/delete actions"
```

---

## Testing Checklist

**Backend:**
- [ ] POST /api/projects - creates project with status='draft'
- [ ] DELETE /api/projects/:id - soft deletes (sets deletedAt)
- [ ] GET /api/projects - returns only non-deleted projects
- [ ] GET /api/projects?filter=published - returns only published
- [ ] GET /api/projects?filter=in_progress - returns only in-progress
- [ ] GET /api/projects/trash - returns deleted projects
- [ ] POST /api/projects/:id/restore - restores deleted project
- [ ] DELETE /api/projects/:id/permanent - permanently deletes
- [ ] PUT /api/projects/:id/status - updates project status

**Frontend:**
- [ ] Sidebar buttons switch filters correctly
- [ ] Active filter is visually highlighted
- [ ] Project cards show correct status badge
- [ ] Trash view shows deleted projects with restore/delete buttons
- [ ] Restored projects appear back in main list
- [ ] Toast notifications appear for all actions

---

## Notes

- **Migration:** Existing projects will not have `status` or `deletedAt` fields. Consider adding a migration script to set defaults.
- **Soft Delete:** Projects are only marked as deleted in metadata. Files remain on disk until permanent delete.
- **Future:** Could add "Empty Trash" button to delete all trashed projects at once.
