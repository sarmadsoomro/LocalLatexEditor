# ZIP Export Feature Design

**Date:** 2025-04-15  
**Branch:** feature/zip-export  
**Status:** Design Complete  

---

## Overview

Enable users to export LaTeX projects as ZIP files for sharing and uploading to Overleaf. The feature will be accessible from both the Project List and Project Detail pages.

---

## Requirements

### Functional Requirements

1. Export project as ZIP file containing only source files (no compiled output)
2. Accessible from Project List page (per-project export button)
3. Accessible from Project Detail page (toolbar export button)
4. ZIP filename format: `{project-name}_{YYYY-MM-DD}.zip`
5. Exclude compilation artifacts and temporary files

### Non-Functional Requirements

1. Streaming ZIP generation (no temp files)
2. Memory-efficient for large projects
3. Clear loading feedback during export
4. Toast notification on success/error

---

## Architecture

### API Endpoint

```
GET /api/projects/:id/export
```

**Headers:**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="{project-name}_{YYYY-MM-DD}.zip"`

**Response:** Binary ZIP file stream

**Error Responses:**
- `404` — Project not found
- `500` — ZIP generation failed

### Files Included in ZIP

**Included:**
- `.tex` files
- `.bib` files
- `.cls` and `.sty` files
- Image files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`)
- Figure PDFs
- `.txt`, `.md` files
- Any other source assets

**Excluded:**
- `output/` directory and all contents
- LaTeX auxiliary files (`.aux`, `.log`, `.out`, `.toc`, `.lof`, `.lot`, `.synctex.gz`)
- System files (`.DS_Store`, `Thumbs.db`)

---

## Backend Implementation

### New Files

1. `apps/backend/src/services/exportService.ts` — ZIP generation logic
2. `apps/backend/src/routes/export.ts` — Export route handler (or add to projects.ts)

### Dependencies

Add to `apps/backend/package.json`:
```json
{
  "dependencies": {
    "archiver": "^6.0.1"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.2"
  }
}
```

### Service Interface

```typescript
// exportService.ts
export async function exportProjectAsZip(
  projectId: string,
  res: Response
): Promise<void>;

// Configuration
const EXCLUDED_PATTERNS = [
  'output/',
  '*.aux',
  '*.log',
  '*.out',
  '*.toc',
  '*.lof',
  '*.lot',
  '*.synctex.gz',
  '.DS_Store',
  'Thumbs.db',
];
```

### Route Handler

Add to `apps/backend/src/routes/projects.ts`:
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

---

## Frontend Implementation

### New Files

1. `apps/frontend/src/services/exportApi.ts` — Export API service (or add to projectApi.ts)

### API Service

```typescript
// exportApi.ts or add to projectApi.ts
export async function exportProject(projectId: string, projectName: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/export`);
  
  if (!response.ok) {
    throw new Error('Failed to export project');
  }
  
  const blob = await response.blob();
  const date = new Date().toISOString().split('T')[0];
  const filename = `${projectName}_${date}.zip`;
  
  // Trigger download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
```

### UI Integration

**ProjectList Page:**
- Add export icon button to `ProjectCard` component
- Position: Next to delete button or in dropdown menu
- Icon: Download or Archive icon
- Show loading spinner during export

**ProjectDetail Page:**
- Add export button to top toolbar
- Icon: Download or Archive icon  
- Consistent with other action buttons (Compile, Save, etc.)

### UX Flow

1. User clicks Export button
2. Button enters loading state (disabled + spinner)
3. API call initiated
4. On success: File downloads automatically, show success toast
5. On error: Show error toast with message

### Loading State

```typescript
const [isExporting, setIsExporting] = useState(false);

const handleExport = async () => {
  setIsExporting(true);
  try {
    await exportProject(project.id, project.name);
    showToast('Project exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export project', 'error');
  } finally {
    setIsExporting(false);
  }
};
```

---

## Error Handling

### Backend Errors

1. **Project not found (404):** Return standard NotFoundError
2. **ZIP generation failed (500):** Log error, return InternalError
3. **Stream error:** End response gracefully, log error

### Frontend Errors

1. **Network error:** Show "Network error. Please try again."
2. **Server error:** Show "Failed to export project. Please try again."
3. **Download blocked:** Show "Download blocked by browser. Check popup settings."

---

## Security Considerations

1. **Path traversal:** Validate projectId before accessing filesystem
2. **File access:** Only include files within project directory
3. **Rate limiting:** Consider rate limiting export endpoint (future)
4. **Authentication:** Not applicable (local-only app)

---

## Testing Strategy

### Unit Tests

1. Export service filters excluded patterns correctly
2. Export service includes correct files
3. Export service generates valid ZIP structure

### Integration Tests

1. API endpoint returns correct headers
2. API endpoint streams ZIP file
3. API endpoint handles errors correctly

### E2E Tests

1. Export from Project List page
2. Export from Project Detail page
3. Verify downloaded ZIP contents
4. Verify excluded files not in ZIP

---

## Future Enhancements

1. **Export options dialog:** Let users choose what to include
2. **Progress indicator:** Show ZIP creation progress for large projects
3. **Multiple format support:** Export as tarball, 7z, etc.
4. **Template export:** Export as reusable template

---

## Implementation Checklist

### Backend
- [ ] Install `archiver` and `@types/archiver`
- [ ] Create `exportService.ts` with ZIP generation logic
- [ ] Add export route to `projects.ts`
- [ ] Test export endpoint manually

### Frontend
- [ ] Add export function to `projectApi.ts`
- [ ] Add export button to `ProjectCard` component
- [ ] Add export button to `ProjectDetail` page
- [ ] Add loading states and toast notifications

### Testing
- [ ] Write unit tests for export service
- [ ] Write integration tests for API endpoint
- [ ] Manual testing of export feature

### Documentation
- [ ] Update API documentation
- [ ] Update user guide (if applicable)

---

## Open Questions

None — design approved.

---

**Approved by:** User  
**Date:** 2025-04-15
