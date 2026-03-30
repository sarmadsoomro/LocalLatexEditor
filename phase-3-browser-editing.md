# Phase 3: Browser Editing Experience

## Phase Objective

Enable users to edit LaTeX source files directly in the browser with a professional code editing experience. This phase transforms the project from a file browser into a functional editor by integrating a robust text editor component, implementing multi-file workflows, and establishing the core editing interactions that users expect from modern development tools.

The primary goal is to deliver a seamless editing experience where users can open multiple files simultaneously, make changes with proper syntax highlighting, and manage their work through intuitive save workflows and visual indicators for unsaved changes.

---

## Features Included

| Feature | Description |
|---------|-------------|
| **Editor Integration** | Embed Monaco Editor or CodeMirror 6 for professional code editing capabilities |
| **Multi-File Editing** | Tab-based interface allowing users to work with multiple files simultaneously |
| **LaTeX Syntax Highlighting** | Full syntax support for LaTeX commands, environments, math modes, and comments |
| **Save Workflow** | Explicit save action with keyboard shortcuts (Ctrl/Cmd+S) and visual feedback |
| **Dirty State Handling** | Visual indicators for files with unsaved changes (dot indicators, tab styling) |
| **Basic UX Interactions** | Context menus, double-click to open, hover states, and loading indicators |
| **File Creation** | Create new .tex files from the file tree with automatic editor opening |
| **File Deletion** | Delete files with confirmation dialog and proper tab cleanup |

---

## Features Excluded

The following features are intentionally deferred to future phases to maintain scope:

| Feature | Rationale |
|---------|-----------|
| **Auto-save** | Requires careful conflict resolution; deferred to Phase 4 |
| **Split-screen editing** | Complex layout management; planned for Phase 5 |
| **Find and replace across files** | Requires search indexing infrastructure; Phase 5 |
| **Code folding** | Nice-to-have enhancement; Phase 5 |
| **Minimap/overview** | Performance consideration; Phase 5 |
| **Vim/Emacs keybindings** | Plugin architecture needed; Phase 6 |
| **Collaborative editing** | Requires operational transformation; Phase 7 |
| **Auto-completion** | Language server integration required; Phase 5 |

---

## Technical Tasks

### Task 1: Integrate Editor Component

**Objective:** Choose and integrate a code editor component that provides robust LaTeX editing capabilities.

**Decision Matrix:**

| Criteria | Monaco Editor | CodeMirror 6 |
|----------|---------------|--------------|
| Bundle Size | Larger (~3MB) | Smaller (~500KB) |
| LaTeX Support | Good (via extensions) | Excellent (native) |
| Mobile Support | Limited | Good |
| Customization | Extensive | Very Extensible |
| VS Code Feel | Native | Similar |
| Recommendation | **Selected** | Alternative |

**Implementation Steps:**

1. Install Monaco Editor via npm:

```bash
npm install @monaco-editor/react monaco-editor
```

2. Create the Editor component wrapper:

```typescript
// components/Editor/MonacoEditor.tsx
import Editor from '@monaco-editor/react';
import { useRef } from 'react';

interface MonacoEditorProps {
  content: string;
  language?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
}

export function MonacoEditor({
  content,
  language = 'latex',
  onChange,
  onSave
}: MonacoEditorProps) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Register save keyboard shortcut
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => onSave?.()
    );
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      value={content}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  );
}
```

3. Configure webpack/vite for Monaco worker files

**Acceptance Criteria:**
- Editor renders without errors
- Text input is responsive
- No console warnings about worker files

---

### Task 2: Configure LaTeX Syntax Highlighting

**Objective:** Ensure LaTeX files receive proper syntax highlighting with support for commands, environments, math modes, and comments.

**Implementation:**

Monaco Editor includes built-in LaTeX support. Verify and enhance it:

```typescript
// utils/monaco-latex-config.ts
export function configureLatexLanguage(monaco: typeof import('monaco-editor')) {
  // LaTeX language is built-in, but we can enhance it
  monaco.languages.setLanguageConfiguration('latex', {
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '$', close: '$' },
      { open: '$$', close: '$$' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '$', close: '$' },
    ],
  });

  // Optional: Add custom token provider for better highlighting
  monaco.languages.setMonarchTokensProvider('latex', {
    tokenizer: {
      root: [
        [/%.*$/, 'comment'],
        [/\\[a-zA-Z]+/, 'keyword'],
        [/\\[^a-zA-Z]/, 'keyword'],
        [/\$\$.*?\$\$/, 'string'], // Display math
        [/\$.*?\$/, 'string'],     // Inline math
        [/[{}[\]]/, 'delimiter.bracket'],
      ],
    },
  });
}
```

**Acceptance Criteria:**
- LaTeX commands (`\command`) highlighted as keywords
- Comments (`% comment`) styled appropriately
- Math modes (`$...$`, `$$...$$`) visually distinct
- Bracket matching works for `{}`, `[]`, `()`

---

### Task 3: Implement File Open in Editor

**Objective:** Enable users to open files from the file tree into the editor.

**Implementation:**

```typescript
// hooks/useFileOperations.ts
import { useState, useCallback } from 'react';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export function useFileOperations() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const openFile = useCallback(async (filePath: string) => {
    // Check if already open
    const existing = openFiles.find(f => f.path === filePath);
    if (existing) {
      setActiveFile(filePath);
      return;
    }

    // Load file content via API
    const response = await fetch(`/api/files/${encodeURIComponent(filePath)}`);
    const content = await response.text();
    
    const fileName = filePath.split('/').pop() || filePath;
    
    setOpenFiles(prev => [...prev, {
      path: filePath,
      name: fileName,
      content,
      isDirty: false,
    }]);
    
    setActiveFile(filePath);
  }, [openFiles]);

  const closeFile = useCallback((filePath: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== filePath));
    
    if (activeFile === filePath) {
      // Activate another file or null
      const remaining = openFiles.filter(f => f.path !== filePath);
      setActiveFile(remaining.length > 0 ? remaining[0].path : null);
    }
  }, [activeFile, openFiles]);

  return { openFiles, activeFile, openFile, closeFile, setActiveFile };
}
```

**File Tree Integration:**

```typescript
// components/FileTree/FileTreeItem.tsx
interface FileTreeItemProps {
  file: FileNode;
  onFileOpen: (path: string) => void;
}

export function FileTreeItem({ file, onFileOpen }: FileTreeItemProps) {
  const handleDoubleClick = () => {
    if (file.type === 'file' && file.path.endsWith('.tex')) {
      onFileOpen(file.path);
    }
  };

  return (
    <div 
      className="file-tree-item"
      onDoubleClick={handleDoubleClick}
    >
      {file.name}
    </div>
  );
}
```

**Acceptance Criteria:**
- Double-click .tex file opens it in editor
- Single-click on already-open file activates its tab
- File content loads correctly
- Error handling for failed loads

---

### Task 4: Implement Save Functionality

**Objective:** Enable users to save file changes back to disk.

**Implementation:**

```typescript
// hooks/useFileOperations.ts (additional methods)
const saveFile = useCallback(async (filePath: string) => {
  const file = openFiles.find(f => f.path === filePath);
  if (!file || !file.isDirty) return;

  try {
    const response = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: file.content,
    });

    if (response.ok) {
      setOpenFiles(prev => prev.map(f => 
        f.path === filePath ? { ...f, isDirty: false } : f
      ));
    } else {
      throw new Error('Save failed');
    }
  } catch (error) {
    console.error('Failed to save file:', error);
    // Show error notification
  }
}, [openFiles]);

const updateFileContent = useCallback((filePath: string, newContent: string) => {
  setOpenFiles(prev => prev.map(f => 
    f.path === filePath 
      ? { ...f, content: newContent, isDirty: true }
      : f
  ));
}, []);
```

**API Endpoint:**

```typescript
// app/api/files/[path]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: { path: string } }
) {
  const filePath = decodeURIComponent(params.path);
  const content = await request.text();
  
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to save file' }), 
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- Ctrl/Cmd+S triggers save
- Save button in UI works
- Visual feedback on successful save
- Error handling for failed saves
- File system reflects changes

---

### Task 5: Build Tab System for Multiple Files

**Objective:** Implement a tab bar for managing multiple open files.

**Implementation:**

```typescript
// components/Editor/TabBar.tsx
interface TabBarProps {
  files: Array<{
    path: string;
    name: string;
    isDirty: boolean;
  }>;
  activeFile: string | null;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
}

export function TabBar({ files, activeFile, onTabClick, onTabClose }: TabBarProps) {
  return (
    <div className="tab-bar flex border-b bg-gray-100">
      {files.map(file => (
        <div
          key={file.path}
          className={`tab flex items-center px-3 py-2 cursor-pointer border-r
            ${activeFile === file.path 
              ? 'bg-white border-t-2 border-t-blue-500' 
              : 'hover:bg-gray-200'
            }`}
          onClick={() => onTabClick(file.path)}
        >
          <span className="text-sm truncate max-w-[150px]">
            {file.name}
          </span>
          {file.isDirty && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />
          )}
          <button
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.path);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Styling:**

```css
/* styles/tabs.css */
.tab-bar {
  overflow-x: auto;
  scrollbar-width: thin;
}

.tab {
  min-width: 100px;
  max-width: 200px;
  transition: background-color 0.15s ease;
}

.tab.active {
  box-shadow: 0 -2px 0 0 var(--primary-color);
}
```

**Acceptance Criteria:**
- Tabs display file names
- Active tab visually highlighted
- Scrollable when many tabs open
- Close button on each tab
- Middle-click to close tab

---

### Task 6: Implement Dirty State Tracking

**Objective:** Track and display which files have unsaved changes.

**State Management:**

The dirty state is already tracked in the `openFiles` array via the `isDirty` flag. This is set to `true` when content changes and `false` after successful save.

**Visual Indicators:**

1. **Tab indicator:** Blue dot next to filename
2. **Window title:** Asterisk prefix when any file is dirty
3. **Before unload warning:** Prevent accidental navigation

```typescript
// hooks/useBeforeUnload.ts
import { useEffect } from 'react';

export function useBeforeUnload(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
```

**Acceptance Criteria:**
- Dirty indicator appears on content change
- Indicator disappears on save
- Browser warns before closing with unsaved changes
- Closing tab with unsaved changes shows confirmation

---

### Task 7: Add Keyboard Shortcuts

**Objective:** Implement common keyboard shortcuts for editor operations.

**Shortcuts Implementation:**

```typescript
// hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';

interface ShortcutsConfig {
  onSave: () => void;
  onCloseTab: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
}

export function useKeyboardShortcuts({
  onSave,
  onCloseTab,
  onNextTab,
  onPrevTab,
}: ShortcutsConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Save: Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
    
    // Close tab: Ctrl/Cmd + W
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault();
      onCloseTab();
    }
    
    // Next tab: Ctrl/Cmd + Tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevTab();
      } else {
        onNextTab();
      }
    }
    
    // Number keys 1-9 for direct tab access
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const tabIndex = parseInt(e.key) - 1;
      // Activate tab at index
    }
  }, [onSave, onCloseTab, onNextTab, onPrevTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

**Shortcuts Reference:**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save current file |
| `Ctrl/Cmd + W` | Close current tab |
| `Ctrl/Cmd + Tab` | Next tab |
| `Ctrl/Cmd + Shift + Tab` | Previous tab |
| `Ctrl/Cmd + 1-9` | Jump to tab 1-9 |

**Acceptance Criteria:**
- All shortcuts work as specified
- Shortcuts don't interfere with editor input
- Shortcuts are discoverable (show in UI where appropriate)

---

## Deliverables

At the completion of Phase 3, the following deliverables will be produced:

| Deliverable | Description |
|-------------|-------------|
| **Functional Editor** | Monaco Editor integrated with LaTeX syntax highlighting |
| **Tab System** | Multi-file editing with tab-based navigation |
| **Save Workflow** | Complete save functionality with keyboard shortcuts |
| **Dirty State UI** | Visual indicators for unsaved changes throughout the interface |
| **File Operations** | Create and delete file capabilities with confirmation dialogs |
| **Updated Documentation** | Developer docs for editor integration and file operations |
| **Test Suite** | Unit tests for file operations and integration tests for editor |

---

## Dependencies

Phase 3 has the following dependencies that must be satisfied before starting:

| Dependency | Source | Verification |
|------------|--------|--------------|
| **Phase 2 Completion** | Internal | File tree browser functional, project structure defined |
| **File System API** | Internal | Read/write endpoints implemented and tested |
| **Project State Management** | Internal | Selected project persists across sessions |
| **Monaco Editor Package** | NPM | `@monaco-editor/react` installed |
| **Build Configuration** | Internal | Webpack/Vite configured for Monaco workers |

**Blockers to Resolve:**

- Ensure file system API handles concurrent writes safely
- Verify Monaco worker files are correctly served in production build

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Monaco bundle size** | High | Medium | Implement code-splitting and lazy loading; consider CodeMirror fallback |
| **Large file performance** | Medium | High | Implement virtual scrolling; set file size limits |
| **Concurrent edit conflicts** | Medium | High | Implement file locking or last-write-wins strategy |
| **Memory leaks with tabs** | Medium | Medium | Proper cleanup on tab close; limit max open tabs |
| **Browser compatibility** | Low | Medium | Test on target browsers; document limitations |
| **Dirty state sync issues** | Medium | Medium | Comprehensive state testing; clear state transitions |

---

## Testing Approach

### Unit Tests

```typescript
// __tests__/hooks/useFileOperations.test.ts
describe('useFileOperations', () => {
  it('should mark file as dirty on content change', () => {
    // Test dirty state tracking
  });

  it('should clear dirty state on successful save', () => {
    // Test save workflow
  });

  it('should prevent opening same file twice', () => {
    // Test duplicate prevention
  });

  it('should activate existing file on re-open attempt', () => {
    // Test tab activation
  });
});
```

### Integration Tests

1. **File Open Flow:**
   - Double-click file in tree
   - Verify tab appears
   - Verify content loads

2. **Edit and Save Flow:**
   - Type in editor
   - Verify dirty indicator appears
   - Press Ctrl+S
   - Verify indicator clears
   - Verify file on disk updated

3. **Tab Management:**
   - Open 5 files
   - Switch between tabs
   - Close middle tab
   - Verify correct tab activation

4. **Edge Cases:**
   - Close tab with unsaved changes
   - Refresh page with unsaved changes
   - Attempt to open binary file
   - Open non-existent file

### Manual Testing Checklist

- [ ] Monaco Editor loads without console errors
- [ ] LaTeX syntax highlighting works
- [ ] Double-click opens file
- [ ] Tabs display correctly
- [ ] Active tab highlighted
- [ ] Dirty indicator shows on change
- [ ] Ctrl+S saves file
- [ ] Save clears dirty indicator
- [ ] Closing dirty tab shows confirmation
- [ ] Browser warns on close with unsaved changes
- [ ] Create new file works
- [ ] Delete file works with confirmation
- [ ] Keyboard shortcuts work
- [ ] Mobile touch interactions work

---

## Definition of Done

Phase 3 is considered complete when ALL of the following criteria are met:

### Functional Requirements
- [ ] Monaco Editor integrated and functional
- [ ] LaTeX syntax highlighting configured
- [ ] Files open in editor on double-click
- [ ] Multiple files editable via tabs
- [ ] Save functionality works via button and keyboard
- [ ] Dirty state tracked and displayed
- [ ] New file creation implemented
- [ ] File deletion with confirmation implemented

### Quality Requirements
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing checklist completed
- [ ] No console errors in normal operation
- [ ] Performance acceptable with 10+ tabs open
- [ ] Memory usage stable (no leaks)

### Documentation Requirements
- [ ] Editor integration documented
- [ ] File operations API documented
- [ ] Keyboard shortcuts listed in help
- [ ] Known limitations documented

### Review Requirements
- [ ] Code review completed
- [ ] UX review completed
- [ ] Accessibility check passed

---

## Estimated Complexity

| Aspect | Estimate | Notes |
|--------|----------|-------|
| **Story Points** | 13 points | Based on Fibonacci scale |
| **Developer Days** | 5-7 days | Single developer |
| **Calendar Time** | 1-2 weeks | With reviews and iteration |
| **Priority** | High | Core functionality |

**Breakdown:**

- Editor integration: 1.5 days
- Syntax highlighting: 0.5 day
- File open/close: 1 day
- Save functionality: 1 day
- Tab system: 1 day
- Dirty state: 0.5 day
- Testing & polish: 1-2 days

---

## Suggested Milestone Outcome

### Success Criteria

Phase 3 success means users can:

1. **Open any .tex file** from the project browser with a double-click
2. **Edit multiple files** simultaneously with a familiar tabbed interface
3. **See LaTeX code** properly highlighted with syntax coloring
4. **Save changes** confidently with keyboard shortcuts or UI buttons
5. **Track their work** through clear visual indicators of unsaved changes
6. **Manage files** by creating new documents and deleting old ones

### Demo Script

A successful Phase 3 demo would include:

1. Open the LaTeX editor application
2. Select a project from the Phase 2 file browser
3. Double-click `main.tex` to open it
4. Show syntax highlighting on LaTeX commands
5. Make an edit and point out the dirty indicator
6. Press Ctrl+S to save
7. Open a second file `references.bib`
8. Switch between tabs
9. Create a new file `chapter1.tex`
10. Show multiple tabs with different states

### User Feedback Targets

After Phase 3, user feedback should indicate:

- Editor feels responsive and professional
- Tab system is intuitive
- Save workflow is clear
- Dirty state indicators are noticeable but not annoying
- No data loss concerns

---

## Appendix

### A. Monaco Editor Configuration Reference

```typescript
const defaultOptions = {
  // Editor appearance
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Fira Code, monospace',
  lineHeight: 22,
  
  // Editor behavior
  wordWrap: 'on',
  wrappingIndent: 'indent',
  tabSize: 2,
  insertSpaces: true,
  
  // UI features
  minimap: { enabled: false },
  lineNumbers: 'on',
  folding: true,
  renderWhitespace: 'selection',
  
  // Performance
  renderLineHighlight: 'line',
  smoothScrolling: true,
  cursorSmoothCaretAnimation: 'on',
};
```

### B. File Operation Error Codes

| Error Code | Description | User Message |
|------------|-------------|--------------|
| `FILE_NOT_FOUND` | File doesn't exist | "File not found. It may have been moved or deleted." |
| `PERMISSION_DENIED` | No write access | "Cannot save file. Check file permissions." |
| `DISK_FULL` | No space left | "Disk full. Free up space and try again." |
| `FILE_LOCKED` | File in use | "File is being used by another program." |
| `NETWORK_ERROR` | API failure | "Connection failed. Changes saved locally." |

### C. Related Documentation

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Phase 2 File Browser Spec](./phase-2-file-browser.md)
- [Project Architecture Overview](./architecture.md)
