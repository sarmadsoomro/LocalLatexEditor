# Project Rename Feature Design

**Date:** 2026-04-15  
**Status:** Design Complete - Ready for Implementation  
**Scope:** Backend API + Frontend UI for renaming existing projects

---

## 1. Overview

Enable users to rename existing LaTeX projects via inline editing. The rename functionality is available from both the project list (ProjectCard) and project detail page header.

### User Requirements
- Inline editing: Click project name to edit directly
- Both locations: ProjectCard and ProjectDetail header
- Inline validation: Red border with error message
- Keyboard: Enter to save, Escape to cancel
- Optimistic updates: UI feels instant with rollback on failure

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────────┐      ┌──────────────────────┐             │
│  │ ProjectCard     │      │ ProjectDetail Header │             │
│  │                 │      │                      │             │
│  │ ┌─────────────┐ │      │   ┌──────────────┐   │             │
│  │ │EditableName │ │      │   │EditableName  │   │             │
│  │ │  Component  │ │      │   │   Component  │   │             │
│  │ └──────┬──────┘ │      │   └──────┬───────┘   │             │
│  └────────┼────────┘      └──────────┼───────────┘             │
│           │                          │                          │
│           └───────────┬──────────────┘                          │
│                       ▼                                         │
│              ┌────────────────┐                                 │
│              │ projectStore   │                                 │
│              │ renameProject()│                                 │
│              └───────┬────────┘                                 │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       │ PUT /api/projects/:id
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  ┌─────────────────┐      ┌──────────────────────┐             │
│  │ projects.ts     │──────▶ projectService.ts    │             │
│  │ Route Handler   │      │ renameProject()      │             │
│  └─────────────────┘      └──────────┬───────────┘             │
│                                      │                          │
│                                      ▼                          │
│                            ┌──────────────────┐                │
│                            │ projects.json    │                │
│                            │ Update metadata  │                │
│                            └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Design

### 3.1 API Endpoint

**PUT /api/projects/:id**

**Request Body:**
```typescript
{
  name: string  // New project name
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    project: ProjectWithMetadata
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid name (empty, too long, invalid characters)
- `409 Conflict`: Name already exists
- `404 Not Found`: Project not found

### 3.2 Service Function

**`renameProject(id: string, newName: string): Promise<ProjectWithMetadata>`**

**Validation Rules (same as create):**
- Required, non-empty
- Max 100 characters
- No invalid characters: `< > : " / \ | ? *`
- Unique name check (case-insensitive)

**Implementation:**
1. Load projects metadata
2. Find project by ID
3. Validate new name
4. Check for name conflicts (exclude self)
5. Update project name and `updatedAt`
6. Save metadata
7. Return updated project

### 3.3 Validation Schema

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
```

---

## 4. Frontend Design

### 4.1 Component: EditableProjectName

**Props:**
```typescript
interface EditableProjectNameProps {
  projectId: string;
  initialName: string;
  onRename: (newName: string) => Promise<void>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';  // For styling variants
}
```

**State:**
```typescript
interface State {
  isEditing: boolean;
  editValue: string;
  error: string | null;
  isSaving: boolean;
}
```

**Behavior:**

| Action | Result |
|--------|--------|
| Click on name | Enter edit mode, select all text |
| Type | Update `editValue`, clear error on change |
| Enter | Validate, call `onRename`, exit edit mode on success |
| Escape | Cancel, revert to original, exit edit mode |
| Blur (click away) | Same as Escape (cancel) |
| Validation fail | Show error, stay in edit mode |
| API error | Show error, stay in edit mode, don't revert |

**Styling:**
- Display mode: Current text with edit cursor on hover
- Edit mode: Text input with focus ring
- Error: Red border (`border-red-500`), error message below

### 4.2 Store Updates

**`projectStore.ts` - Add:**
```typescript
renameProject: async (id: string, newName: string) => {
  // Optimistic update
  const previousProjects = get().projects;
  const updatedProjects = previousProjects.map(p => 
    p.id === id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
  );
  set({ projects: updatedProjects });

  try {
    const response = await projectApi.renameProject(id, newName);
    // Update with server response (timestamp precision)
    set({
      projects: updatedProjects.map(p => 
        p.id === id ? response.project : p
      ),
      currentProject: get().currentProject?.id === id 
        ? response.project 
        : get().currentProject
    });
  } catch (error) {
    // Rollback on error
    set({ projects: previousProjects });
    throw error;
  }
}
```

### 4.3 API Service Updates

**`projectApi.ts` - Add:**
```typescript
async renameProject(id: string, name: string): Promise<{ project: ProjectWithMetadata }> {
  return api.put(`/api/projects/${id}`, { name });
}
```

### 4.4 Integration Points

**ProjectCard:**
- Replace `<h3>{project.name}</h3>` with `<EditableProjectName />`
- Keep card click behavior for navigation
- Stop propagation on edit interactions

**ProjectDetail Header:**
- Replace project name display with `<EditableProjectName />`
- Larger size variant for header prominence
- Update `currentProject` in store on rename

---

## 5. Error Handling

### Validation Errors (Frontend + Backend)

| Error | User Message |
|-------|--------------|
| Empty name | "Project name is required" |
| >100 chars | "Project name must be less than 100 characters" |
| Invalid chars | "Project name contains invalid characters" |
| Name exists | "A project with this name already exists" |

### Display
- Inline below input field
- Red text (`text-red-600`)
- Red border on input (`border-red-500 focus:ring-red-500`)

---

## 6. Testing Strategy

### Unit Tests
- Validation logic (valid/invalid names)
- `EditableProjectName` component behavior
- Store `renameProject` action (success, error, rollback)

### Integration Tests
- API endpoint happy path
- API error responses
- Concurrent rename conflicts

### E2E Tests
- Full rename flow from ProjectCard
- Full rename flow from ProjectDetail
- Keyboard navigation (Enter, Escape)
- Error display and recovery

---

## 7. Implementation Checklist

### Backend
- [ ] Add `renameProjectSchema` validator
- [ ] Add `renameProject()` service function
- [ ] Add `PUT /api/projects/:id` route handler
- [ ] Add unit tests for service function

### Frontend
- [ ] Add `renameProject()` to `projectApi.ts`
- [ ] Create `EditableProjectName` component
- [ ] Add `renameProject` action to `projectStore`
- [ ] Update `ProjectCard` to use editable name
- [ ] Update `ProjectDetail` header to use editable name
- [ ] Add component tests

---

## 8. Files to Modify

### New Files
- `apps/frontend/src/components/EditableProjectName.tsx`
- `apps/frontend/src/components/__tests__/EditableProjectName.test.tsx`

### Modified Files
- `apps/backend/src/validators/project.ts` - Add schema
- `apps/backend/src/services/projectService.ts` - Add function
- `apps/backend/src/routes/projects.ts` - Add route
- `apps/frontend/src/services/projectApi.ts` - Add method
- `apps/frontend/src/stores/projectStore.ts` - Add action
- `apps/frontend/src/components/ProjectCard.tsx` - Use editable name
- `apps/frontend/src/pages/ProjectDetail.tsx` - Use editable name

---

## 9. Security Considerations

- Validate project ID format (same as existing routes)
- Validate name doesn't contain path traversal characters
- Ensure user can only rename their own projects (future multi-user consideration)
- Same validation rules as project creation for consistency

---

## 10. Future Enhancements

- Rename from context menu (right-click)
- Bulk rename operations
- Project name history/undo
- Fuzzy search for duplicate detection
