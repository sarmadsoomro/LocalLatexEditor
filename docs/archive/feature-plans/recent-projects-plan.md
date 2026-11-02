# Recent Projects Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a "Recent Projects" section on the project list page that displays recently accessed projects first, making it easier for users to continue their work.

**Architecture:** Update the project store to sort projects by `lastOpened` timestamp, add a "Recent" section to the ProjectList page, and ensure the timestamp is updated when projects are opened.

**Tech Stack:** React, Zustand, date-fns (for relative time formatting)

---

## File Structure

```
apps/frontend/src/
├── components/
│   └── RecentProjects.tsx     # Recent projects section component
├── pages/
│   └── ProjectList.tsx        # Modify to show recent projects section
├── stores/
│   └── projectStore.ts        # Update with recent projects selector
└── utils/
    └── date.ts                # Date formatting utilities
```

---

## Task 1: Add Date Formatting Utilities

**Files:**
- Create: `apps/frontend/src/utils/date.ts`

**Purpose:** Create utility functions for formatting dates and relative times.

- [ ] **Step 1: Install date-fns dependency**

```bash
cd apps/frontend
npm install date-fns
# or
pnpm add date-fns
```

- [ ] **Step 2: Create date utilities**

```typescript
// apps/frontend/src/utils/date.ts

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

/**
 * Format a date for display in recent projects list
 * Shows: "Today", "Yesterday", "This Week", or actual date
 */
export function formatRelativeDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'Never opened';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Day name (Monday, Tuesday, etc.)
  }

  // Older than a week
  return format(date, 'MMM d, yyyy');
}

/**
 * Format as "2 hours ago", "3 days ago", etc.
 */
export function formatTimeAgo(dateString: string | Date | undefined): string {
  if (!dateString) return 'Never';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format for tooltip (full datetime)
 */
export function formatFullDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'Never opened';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

  return format(date, 'MMMM d, yyyy h:mm:ss a');
}

/**
 * Group projects by time period for sectioned list
 */
export interface GroupedProjects<T> {
  today: T[];
  yesterday: T[];
  thisWeek: T[];
  older: T[];
}

export function groupByDate<T extends { lastOpened?: string | Date }>(
  items: T[]
): GroupedProjects<T> {
  const grouped: GroupedProjects<T> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  items.forEach((item) => {
    if (!item.lastOpened) {
      grouped.older.push(item);
      return;
    }

    const date = typeof item.lastOpened === 'string' ? parseISO(item.lastOpened) : item.lastOpened;

    if (isToday(date)) {
      grouped.today.push(item);
    } else if (isYesterday(date)) {
      grouped.yesterday.push(item);
    } else if (isThisWeek(date)) {
      grouped.thisWeek.push(item);
    } else {
      grouped.older.push(item);
    }
  });

  return grouped;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/utils/date.ts
git commit -m "feat(recent-projects): add date formatting utilities"
```

---

## Task 2: Create RecentProjects Component

**Files:**
- Create: `apps/frontend/src/components/RecentProjects.tsx`

**Purpose:** Display recent projects in a horizontal scrollable or grid layout.

- [ ] **Step 1: Create RecentProjects component**

```typescript
// apps/frontend/src/components/RecentProjects.tsx

import React from 'react';
import { Clock, FolderOpen, ChevronRight } from 'lucide-react';
import type { Project } from '../types/project';
import { formatRelativeDate, formatTimeAgo, formatFullDate, groupByDate } from '../utils/date';

interface RecentProjectsProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  maxItems?: number;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  onOpenProject,
  maxItems = 6,
}) => {
  // Sort by lastOpened (most recent first), filter out projects never opened
  const recentProjects = [...projects]
    .filter((p) => p.lastOpened)
    .sort((a, b) => {
      const dateA = new Date(a.lastOpened!).getTime();
      const dateB = new Date(b.lastOpened!).getTime();
      return dateB - dateA;
    })
    .slice(0, maxItems);

  if (recentProjects.length === 0) {
    return null;
  }

  const grouped = groupByDate(recentProjects);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="text-[var(--color-primary)]" size={20} />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Projects</h2>
      </div>

      {/* Today's projects */}
      {grouped.today.length > 0 && (
        <ProjectGroup
          title="Today"
          projects={grouped.today}
          onOpenProject={onOpenProject}
        />
      )}

      {/* Yesterday's projects */}
      {grouped.yesterday.length > 0 && (
        <ProjectGroup
          title="Yesterday"
          projects={grouped.yesterday}
          onOpenProject={onOpenProject}
        />
      )}

      {/* This week's projects */}
      {grouped.thisWeek.length > 0 && (
        <ProjectGroup
          title="This Week"
          projects={grouped.thisWeek}
          onOpenProject={onOpenProject}
        />
      )}

      {/* Older projects (only show if no recent ones exist) */}
      {grouped.today.length === 0 &&
        grouped.yesterday.length === 0 &&
        grouped.thisWeek.length === 0 &&
        grouped.older.length > 0 && (
          <ProjectGroup
            title="Earlier"
            projects={grouped.older}
            onOpenProject={onOpenProject}
          />
        )}
    </div>
  );
};

interface ProjectGroupProps {
  title: string;
  projects: Project[];
  onOpenProject: (projectId: string) => void;
}

const ProjectGroup: React.FC<ProjectGroupProps> = ({ title, projects, onOpenProject }) => (
  <div>
    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <RecentProjectCard
          key={project.id}
          project={project}
          onClick={() => onOpenProject(project.id)}
        />
      ))}
    </div>
  </div>
);

interface RecentProjectCardProps {
  project: Project;
  onClick: () => void;
}

const RecentProjectCard: React.FC<RecentProjectCardProps> = ({ project, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-start gap-3 p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-lg transition-all text-left w-full"
  >
    <div className="flex-shrink-0 p-2 bg-[var(--color-primary)]/10 rounded-lg">
      <FolderOpen className="text-[var(--color-primary)]" size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
        {project.name}
      </h4>
      <p
        className="text-sm text-[var(--color-text-secondary)] mt-1"
        title={formatFullDate(project.lastOpened)}
      >
        {formatTimeAgo(project.lastOpened)}
      </p>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
        {project.path}
      </p>
    </div>
    <ChevronRight
      className="flex-shrink-0 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors"
      size={18}
    />
  </button>
);

export default RecentProjects;
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/RecentProjects.tsx
git commit -m "feat(recent-projects): add RecentProjects component with time grouping"
```

---

## Task 3: Update Project Store with Recent Projects Selector

**Files:**
- Modify: `apps/frontend/src/stores/projectStore.ts`

**Purpose:** Add selector for sorted recent projects.

- [ ] **Step 1: Add selectors to projectStore**

```typescript
// apps/frontend/src/stores/projectStore.ts

// Add these selectors at the bottom of the file (outside create()):

export const selectRecentProjects = (state: ProjectState) => {
  return [...state.projects]
    .filter((p) => p.lastOpened)
    .sort((a, b) => {
      const dateA = new Date(a.lastOpened!).getTime();
      const dateB = new Date(b.lastOpened!).getTime();
      return dateB - dateA;
    });
};

export const selectSortedProjects = (state: ProjectState) => {
  return [...state.projects].sort((a, b) => {
    // Sort by lastOpened (most recent first), then by name
    if (a.lastOpened && b.lastOpened) {
      const dateDiff = new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    if (a.lastOpened && !b.lastOpened) return -1;
    if (!a.lastOpened && b.lastOpened) return 1;
    return a.name.localeCompare(b.name);
  });
};
```

- [ ] **Step 2: Ensure updateProjectLastOpened exists**

Verify the store has an action to update the lastOpened timestamp (should already exist from Phase 2):

```typescript
// In the store's actions:
updateProjectLastOpened: (projectId: string) =>
  set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, lastOpened: new Date().toISOString() } : p
    ),
  })),
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/stores/projectStore.ts
git commit -m "feat(recent-projects): add recent projects selectors to store"
```

---

## Task 4: Update ProjectList Page

**Files:**
- Modify: `apps/frontend/src/pages/ProjectList.tsx`

**Purpose:** Add RecentProjects section to the project list page.

- [ ] **Step 1: Add imports and RecentProjects component**

```typescript
// Add to imports in ProjectList.tsx
import { RecentProjects } from '../components/RecentProjects';
import { selectSortedProjects } from '../stores/projectStore';
```

- [ ] **Step 2: Use sorted projects and add Recent section**

```typescript
// In the component, use sorted projects:
const sortedProjects = useProjectStore(selectSortedProjects);

// In the JSX, add RecentProjects section before the All Projects grid:
return (
  <div className="min-h-screen bg-[var(--color-background)]">
    {/* Header section */}
    
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Recent Projects Section */}
      <section className="mb-12">
        <RecentProjects
          projects={projects}
          onOpenProject={handleOpenProject}
          maxItems={6}
        />
      </section>

      {/* All Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            All Projects
          </h2>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
        </div>

        {projects.length === 0 ? (
          <EmptyState onCreate={() => setIsCreateOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => handleOpenProject(project.id)}
                onDelete={() => handleDeleteProject(project.id)}
                onExport={() => handleExportProject(project.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  </div>
);
```

- [ ] **Step 3: Update handleOpenProject to track lastOpened**

```typescript
const handleOpenProject = async (projectId: string) => {
  // Update lastOpened timestamp
  await projectApi.updateLastOpened(projectId);
  
  // Navigate to project
  navigate(`/projects/${projectId}`);
};
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/ProjectList.tsx
git commit -m "feat(recent-projects): integrate recent projects into project list page"
```

---

## Task 5: Add API Endpoint for Updating lastOpened

**Files:**
- Modify: `apps/backend/src/routes/projects.ts`
- Modify: `apps/frontend/src/services/projectApi.ts`

**Purpose:** Create backend endpoint to update the lastOpened timestamp.

- [ ] **Step 1: Add endpoint to backend routes**

```typescript
// apps/backend/src/routes/projects.ts

// Add PATCH endpoint for updating lastOpened
router.patch('/:id/last-opened', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await projectService.updateLastOpened(id);
    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 2: Add method to projectService**

```typescript
// apps/backend/src/services/projectService.ts

async updateLastOpened(projectId: string): Promise<Project> {
  const project = await this.getProject(projectId);
  project.metadata.lastOpened = new Date().toISOString();
  await this.saveMetadata(projectId, project.metadata);
  return project;
}
```

- [ ] **Step 3: Add to frontend API service**

```typescript
// apps/frontend/src/services/projectApi.ts

export const projectApi = {
  // ... existing methods ...

  updateLastOpened: async (projectId: string): Promise<Project> => {
    const response = await api.patch<ProjectResponse>(`/projects/${projectId}/last-opened`);
    return response.data.data;
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/routes/projects.ts apps/backend/src/services/projectService.ts apps/frontend/src/services/projectApi.ts
git commit -m "feat(recent-projects): add API endpoint for tracking last opened timestamp"
```

---

## Task 6: Update ProjectDetail to Track Opening

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx`

**Purpose:** Ensure project is marked as opened when user navigates to it.

- [ ] **Step 1: Add useEffect to update lastOpened on mount**

```typescript
// In ProjectDetail.tsx, add useEffect:
import { useEffect } from 'react';
import { projectApi } from '../services/projectApi';

// In the component:
const { projectId } = useParams<{ projectId: string }>();

useEffect(() => {
  // Update last opened when project is opened
  if (projectId) {
    projectApi.updateLastOpened(projectId).catch(console.error);
  }
}, [projectId]);
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(recent-projects): update last opened when opening project"
```

---

## Summary

This implementation creates a "Recent Projects" feature that:

1. **Sorts projects by recency** using the existing `lastOpened` timestamp
2. **Groups projects by time** (Today, Yesterday, This Week, Earlier)
3. **Shows relative time** ("2 hours ago", "Yesterday at 3:45 PM")
4. **Updates automatically** when projects are opened
5. **Integrates seamlessly** with the existing project list page

**Features:**
- Horizontal card-based layout for recent projects
- Time-based grouping for better organization
- Tooltips showing exact open time
- Quick access to continue recent work
- Sorted "All Projects" list (recent first)

**Files Created:**
- `apps/frontend/src/utils/date.ts`
- `apps/frontend/src/components/RecentProjects.tsx`

**Files Modified:**
- `apps/frontend/src/stores/projectStore.ts`
- `apps/frontend/src/pages/ProjectList.tsx`
- `apps/frontend/src/pages/ProjectDetail.tsx`
- `apps/backend/src/routes/projects.ts`
- `apps/backend/src/services/projectService.ts`
- `apps/frontend/src/services/projectApi.ts`

**Dependencies Added:**
- `date-fns` for date formatting
