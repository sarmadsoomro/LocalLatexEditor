# System Architecture

## Overview

This document describes the system architecture for a local LaTeX editor that runs as a localhost web application. The system consists of a browser-based frontend communicating with a local backend server that handles file operations and LaTeX compilation.

---

## 1. High-Level Architecture

### System Context

The LaTeX editor follows a client-server architecture where:
- **Frontend**: Browser-based single-page application (SPA)
- **Backend**: Local HTTP/WebSocket server handling file I/O and LaTeX compilation
- **Communication**: RESTful APIs and WebSocket for real-time updates

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                │
│                              (Browser)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Editor    │  │  File Tree   │  │  PDF Viewer  │  │  Toolbar/    │ │
│  │              │  │              │  │              │  │  Status      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                              │                                          │
│                              ▼                                          │
│                     ┌─────────────────┐                                 │
│                     │   State Manager │                                 │
│                     │  (Redux/Zustand)│                                 │
│                     └────────┬────────┘                                 │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
                      HTTP / WebSocket
                               │
┌──────────────────────────────┼─────────────────────────────────────────┐
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                      BACKEND SERVER                            │     │
│  │                    (Node.js/Python/Go)                         │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                          │
│           ┌──────────────────┼──────────────────┐                       │
│           ▼                  ▼                  ▼                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │   REST API   │   │  WebSocket   │   │   Compiler   │                 │
│  │    Router    │   │    Server    │   │   Service    │                 │
│  └──────┬───────┘   └──────────────┘   └──────┬───────┘                 │
│         │                                       │                       │
│         ▼                                       ▼                       │
│  ┌──────────────┐                       ┌──────────────┐                 │
│  │ File System  │                       │   LaTeX      │                 │
│  │   Service    │                       │   Engine     │                 │
│  └──────┬───────┘                       └──────┬───────┘                 │
│         │                                       │                       │
└─────────┼───────────────────────────────────────┼───────────────────────┘
          │                                       │
          ▼                                       ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│     Local File System   │           │   pdflatex/xelatex/     │
│   (Project directories) │           │      lualatex           │
│                         │           │  (System installation)  │
└─────────────────────────┘           └─────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Primary Role |
|-----------|------------|--------------|
| Frontend | React/Vue/Svelte | User interface and state management |
| API Server | Express/Fastify/FastAPI | HTTP request handling |
| WebSocket Server | ws/socket.io | Real-time bidirectional communication |
| File Service | Node fs/Python os | File I/O operations |
| Compiler Service | Child process spawn | LaTeX engine invocation |
| Project Manager | In-memory/JSON | Project metadata management |

---

## 2. Frontend Components

### 2.1 Editor Component

The editor provides the primary LaTeX editing experience with syntax highlighting and IntelliSense.

**Features:**
- Syntax highlighting for LaTeX
- Code completion (commands, environments)
- Error underlining from compilation feedback
- Multiple cursor support
- Search and replace
- Folding/collapsing of sections

**Architecture:**
```
┌─────────────────────────────────────────┐
│            Editor Component             │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐  │
│  │   Monaco     │  │   Custom LaTeX  │  │
│  │   Editor     │  │   Extensions    │  │
│  │   (Core)     │  │                 │  │
│  └──────────────┘  └─────────────────┘  │
│         │                   │           │
│         └─────────┬─────────┘           │
│                   ▼                     │
│         ┌─────────────────┐             │
│         │  Language Server│             │
│         │  Protocol (LSP) │             │
│         └────────┬────────┘             │
└──────────────────┼──────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Backend LSP Bridge │
        └─────────────────────┘
```

### 2.2 File Tree Component

Displays project structure and handles file operations.

**Features:**
- Hierarchical folder/file display
- Drag-and-drop reordering
- Context menu (new file/folder, rename, delete)
- File type icons
- Active file highlighting
- Collapsible folders

**State Integration:**
```typescript
interface FileTreeState {
  rootPath: string;
  files: FileNode[];
  expandedFolders: Set<string>;
  selectedFile: string | null;
  clipboard: {
    operation: 'copy' | 'cut';
    path: string;
  } | null;
}
```

### 2.3 PDF Viewer Component

Renders compiled PDF output with navigation controls.

**Features:**
- PDF.js-based rendering
- Page navigation (next/previous/goto)
- Zoom controls (fit width/fit page/percentage)
- Search within PDF
- SyncTeX integration (click to source location)
- Download PDF

**Rendering Pipeline:**
```
PDF File → PDF.js → Canvas/SVG → React Component
                  ↓
         Text Layer (searchable)
                  ↓
         Annotation Layer (links)
```

### 2.4 State Management

Centralized state management using Redux or Zustand for predictable state updates.

**State Structure:**
```typescript
interface RootState {
  editor: {
    currentFile: string | null;
    openFiles: string[];
    fileContents: Map<string, string>;
    cursorPosition: { line: number; column: number };
    isDirty: Set<string>;
  };
  fileTree: {
    rootPath: string | null;
    nodes: FileNode[];
    selectedPath: string | null;
  };
  compilation: {
    isCompiling: boolean;
    progress: number;
    lastResult: CompilationResult | null;
    errors: LaTeXError[];
  };
  pdfViewer: {
    currentPage: number;
    totalPages: number;
    zoom: number | 'fit-width' | 'fit-page';
    searchQuery: string | null;
  };
}
```

### 2.5 API Client

Centralized HTTP/WebSocket client for backend communication.

**Responsibilities:**
- Request/response handling
- Error transformation
- Retry logic
- Authentication (if needed)
- Request cancellation

**Client Structure:**
```typescript
class ApiClient {
  // REST endpoints
  async getProject(): Promise<Project>;
  async saveFile(path: string, content: string): Promise<void>;
  async compile(project: string): Promise<CompilationResult>;
  
  // WebSocket events
  onCompilationProgress(callback: (progress: number) => void): void;
  onFileChange(callback: (change: FileChange) => void): void;
}
```

---

## 3. Backend Components

### 3.1 API Server

RESTful HTTP server handling client requests.

**Technology Options:**
| Framework | Language | Best For |
|-----------|----------|----------|
| Express.js | JavaScript | Ecosystem familiarity |
| Fastify | JavaScript | Performance |
| FastAPI | Python | Developer experience |
| Gin | Go | Performance + simplicity |

**Endpoint Structure:**
```
GET    /api/projects              # List all projects
POST   /api/projects              # Create new project
GET    /api/projects/:id          # Get project details
DELETE /api/projects/:id          # Delete project

GET    /api/projects/:id/files    # List project files
GET    /api/projects/:id/files/*  # Read file content
POST   /api/projects/:id/files/*  # Create/update file
DELETE /api/projects/:id/files/*  # Delete file

POST   /api/projects/:id/compile  # Compile project
GET    /api/projects/:id/pdf      # Get compiled PDF
```

### 3.2 File System Service

Handles all file I/O operations with safety checks.

**Responsibilities:**
- Read/write files
- Directory traversal
- File watching
- Path validation (prevent directory traversal)
- Atomic writes

**Service Interface:**
```typescript
interface FileSystemService {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listDirectory(path: string): Promise<FileInfo[]>;
  createDirectory(path: string): Promise<void>;
  watchDirectory(path: string, callback: FileChangeCallback): void;
  exists(path: string): Promise<boolean>;
}
```

### 3.3 Compilation Service

Manages LaTeX compilation workflow.

**Responsibilities:**
- Spawn LaTeX processes
- Manage compilation working directory
- Parse compilation output
- Handle multiple passes
- Manage auxiliary files

**Compilation Workflow:**
```
┌─────────────┐
│ Receive     │
│ Request     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validate    │
│ Main File   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Copy to     │────>│ Working     │
│ Temp Dir    │     │ Directory   │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│ Run         │
│ pdflatex    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Parse       │
│ Output      │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Copy PDF    │────>│ Output      │
│ to Project  │     │ Location    │
└─────────────┘     └─────────────┘
```

### 3.4 Project Manager

Maintains project metadata and configuration.

**Responsibilities:**
- Project metadata persistence
- Configuration management
- Recent projects tracking
- Project templates

**Project Structure:**
```
project-root/
├── .latex-editor/
│   ├── config.json          # Project settings
│   ├── recent-files.json    # Recently opened files
│   └── cache/               # Compilation cache
├── main.tex                 # Main LaTeX file
├── chapters/
├── figures/
└── output/
    └── main.pdf
```

---

## 4. Communication Between Frontend and Backend

### 4.1 REST API Design

Standard HTTP methods for CRUD operations.

**Request/Response Format:**
```typescript
// Standard response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Example: Compile request
POST /api/projects/my-paper/compile
{
  "mainFile": "main.tex",
  "compiler": "pdflatex",
  "options": ["-shell-escape"]
}

// Example: Compile response
{
  "success": true,
  "data": {
    "pdfPath": "/projects/my-paper/output/main.pdf",
    "pages": 12,
    "warnings": [...],
    "errors": []
  }
}
```

### 4.2 WebSocket Design

Real-time bidirectional communication for:
- Compilation progress updates
- File system change notifications
- Collaborative editing (future)

**Message Protocol:**
```typescript
interface WebSocketMessage {
  type: 'compilation.progress' | 'file.change' | 'error';
  timestamp: number;
  payload: unknown;
}

// Compilation progress
{
  "type": "compilation.progress",
  "timestamp": 1234567890,
  "payload": {
    "projectId": "my-paper",
    "stage": "compiling",
    "progress": 0.45,
    "message": "Processing chapter 3..."
  }
}

// File change notification
{
  "type": "file.change",
  "timestamp": 1234567891,
  "payload": {
    "path": "/projects/my-paper/chapters/intro.tex",
    "changeType": "modified",
    "external": true
  }
}
```

### 4.3 Communication Flow

**File Save Flow:**
```
User Edit ──> Editor Component ──> State Update ──> Auto-save Timer
                                              │
                                              ▼
                                    API Client ──> POST /api/files
                                              │
                                              ▼
                                    Backend ──> File System Service
                                              │
                                              ▼
                                    Write to Disk
                                              │
                                              ▼
                                    Response ──> Success/Error
```

---

## 5. File System Interaction Model

### 5.1 File Organization

Projects are organized as directories with metadata.

**Directory Structure:**
```
~/Documents/LaTeXEditor/
├── projects.json            # Project registry
├── projects/
│   ├── thesis-2024/
│   │   ├── .latex-editor/   # Editor metadata
│   │   ├── main.tex
│   │   ├── chapters/
│   │   ├── figures/
│   │   └── output/
│   └── research-paper/
│       ├── .latex-editor/
│       └── ...
└── templates/
    ├── article/
    ├── report/
    └── book/
```

### 5.2 File Operations

**Atomic Write Pattern:**
```
Write Request
     │
     ▼
Write to .tmp file
     │
     ▼
Verify write success
     │
     ▼
Rename .tmp to target
     │
     ▼
Update metadata
```

### 5.3 File Watching

Backend monitors project directories for external changes.

**Watch Strategy:**
- Use `fs.watch` (Node.js) or `watchdog` (Python)
- Debounce rapid successive changes
- Distinguish internal vs external changes
- Notify frontend via WebSocket

---

## 6. Compilation Pipeline

### 6.1 Compilation Sequence

Standard LaTeX requires multiple passes.

**Multi-Pass Flow:**
```
┌──────────────┐
│ 1. pdflatex  │ ──> Generate aux files
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. bibtex/   │ ──> Process bibliography
│    biber     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. pdflatex  │ ──> Resolve references
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. pdflatex  │ ──> Final output
└──────────────┘
```

### 6.2 Compilation State Machine

```
                    ┌─────────┐
         ┌─────────>│  IDLE   │<────────┐
         │          └────┬────┘         │
         │               │              │
    Cancel │          Compile          │ Success
         │               │              │
         │               ▼              │
         │     ┌──────────────────┐     │
         └─────│  COMPILING       │     │
               │  (with progress) │     │
               └────────┬─────────┘     │
                        │               │
           ┌────────────┼────────────┐  │
           │            │            │  │
           ▼            ▼            ▼  │
     ┌─────────┐  ┌─────────┐  ┌────────┴┐
     │ SUCCESS │  │ WARNING │  │  ERROR  │
     └─────────┘  └─────────┘  └─────────┘
```

### 6.3 Error Parsing

LaTeX compilation output parsing strategy.

**Error Extraction:**
```typescript
interface LaTeXError {
  type: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column?: number;
  message: string;
  context?: string;
}

// Parse log file for:
// - ! LaTeX Error: ...
// - Warning: ...
// - Overfull/Underfull \hbox...
// - Undefined references...
```

---

## 7. PDF Preview Pipeline

### 7.1 PDF Generation Flow

From LaTeX source to browser-rendered PDF.

**Pipeline:**
```
LaTeX Source
     │
     ▼
┌─────────────┐
│  Compiler   │
│  Service    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PDF File   │
│  Generated  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Backend    │────>│  Static     │
│  File       │     │  File       │
│  Server     │     │  URL        │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  Frontend   │
│  PDF.js     │
│  Renderer   │
└─────────────┘
```

### 7.2 Live Reload

Automatic PDF refresh on successful compilation.

**Mechanism:**
1. User triggers compilation
2. Backend compiles and generates PDF
3. Backend sends `pdf.updated` WebSocket event
4. Frontend receives event
5. PDF viewer reloads with cache-busting query param
6. User sees updated PDF

### 7.3 SyncTeX Integration

Bidirectional navigation between source and PDF.

**Forward Search (Source to PDF):**
```
User clicks "View in PDF"
     │
     ▼
Get current cursor position
     │
     ▼
Call: synctex view -i line:col:file.tex -o output.pdf
     │
     ▼
Receive page number and coordinates
     │
     ▼
Navigate PDF viewer to page at coordinates
```

**Inverse Search (PDF to Source):**
```
User clicks in PDF
     │
     ▼
Get click coordinates (page, x, y)
     │
     ▼
Call: synctex edit -o page:x:y:output.pdf
     │
     ▼
Receive source file and line number
     │
     ▼
Open file in editor and scroll to line
```

---

## 8. Import/Export Workflow

### 8.1 Project Import

Support for importing existing LaTeX projects.

**Import Sources:**
| Source | Method | Notes |
|--------|--------|-------|
| Local folder | File picker | Select existing project directory |
| ZIP file | Upload + extract | Common for shared projects |
| Git repository | Clone | URL + credentials |
| Overleaf | API export | Requires API token |

**Import Flow:**
```
User selects import source
     │
     ▼
Validate source contents
     │
     ▼
Copy/Extract to projects directory
     │
     ▼
Create .latex-editor metadata
     │
     ▼
Index all files
     │
     ▼
Open project in editor
```

### 8.2 Project Export

Export projects for sharing or archiving.

**Export Formats:**
| Format | Contents | Use Case |
|--------|----------|----------|
| ZIP | Full project | Sharing source |
| PDF only | Compiled output | Submission |
| Clean | Without aux files | Version control |
| With dependencies | Includes packages | Self-contained |

**Export Flow:**
```
User selects export format
     │
     ▼
Create temporary directory
     │
     ▼
Copy relevant files
     │
     ▼
Remove excluded files (aux, log, etc.)
     │
     ▼
Create archive (ZIP) or copy PDF
     │
     ▼
Trigger browser download
     │
     ▼
Cleanup temporary files
```

---

## 9. Local Storage Model

### 9.1 Storage Locations

**User Data Directory:**
```
~/.latex-editor/                     # Main config directory
├── config.json                      # Global settings
├── recent-projects.json             # Recently opened projects
├── templates/                       # Custom templates
│   ├── custom-template-1/
│   └── custom-template-2/
├── cache/                           # Shared cache
│   └── package-index.json
└── logs/                            # Application logs
    └── 2024-03/
```

**Project Data:**
```
project-directory/
├── .latex-editor/
│   ├── config.json                  # Project settings
│   ├── recent-files.json            # Recently opened files
│   ├── bookmarks.json               # User bookmarks
│   └── cache/
│       ├── compilation/
│       │   └── last-successful/     # Cached compilation
│       └── thumbnails/              # PDF thumbnails
└── ... (user files)
```

### 9.2 Configuration Schema

**Global Configuration:**
```json
{
  "version": "1.0.0",
  "editor": {
    "fontSize": 14,
    "fontFamily": "Consolas, monospace",
    "tabSize": 2,
    "wordWrap": true,
    "theme": "light"
  },
  "compilation": {
    "defaultCompiler": "pdflatex",
    "autoCompile": true,
    "autoCompileDelay": 2000
  },
  "pdfViewer": {
    "defaultZoom": "fit-width",
    "invertColors": false
  },
  "projectsDirectory": "~/Documents/LaTeXEditor/projects"
}
```

**Project Configuration:**
```json
{
  "version": "1.0.0",
  "mainFile": "main.tex",
  "compiler": "pdflatex",
  "compilerOptions": ["-shell-escape"],
  "outputDirectory": "output",
  "bibliographyTool": "bibtex",
  "recentFiles": [
    "chapters/introduction.tex",
    "main.tex"
  ]
}
```

---

## 10. Error Reporting Model

### 10.1 Error Classification

**Error Types:**
| Type | Source | Example | Severity |
|------|--------|---------|----------|
| Compilation | LaTeX engine | Undefined control sequence | Error |
| Syntax | Editor parser | Unclosed environment | Warning |
| File System | OS | Permission denied | Error |
| Network | Communication | Connection lost | Error |
| Validation | Input check | Invalid file name | Warning |

### 10.2 Error Flow

**Error Propagation:**
```
┌─────────────────┐
│ Error Origin    │
│ (Compiler, FS)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend Handler │
│ - Categorize    │
│ - Format        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Response    │
│ or WebSocket    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend Store  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI Components   │
│ - Notifications │
│ - Editor marks  │
│ - Status bar    │
└─────────────────┘
```

### 10.3 Error Display Strategy

**UI Components:**
- **Toast notifications**: For async operations (save, compile)
- **Editor gutter**: Line-specific errors from compilation
- **Status bar**: Current operation status
- **Problems panel**: Aggregated error list
- **Modal dialogs**: Critical errors requiring action

**Error Format:**
```typescript
interface ErrorReport {
  id: string;
  timestamp: number;
  severity: 'error' | 'warning' | 'info';
  category: 'compilation' | 'file-system' | 'network' | 'validation';
  message: string;
  source?: {
    file?: string;
    line?: number;
    column?: number;
  };
  action?: {
    label: string;
    handler: () => void;
  };
}
```

---

## 11. Extensibility Considerations

### 11.1 Plugin Architecture

Future support for extensions.

**Plugin Hooks:**
| Hook | Timing | Use Case |
|------|--------|----------|
| pre-compile | Before compilation | Linting, preprocessing |
| post-compile | After compilation | Post-processing PDF |
| on-save | File save | Auto-format, validation |
| editor:init | Editor creation | Custom keybindings |
| menu:register | UI load | Add menu items |

**Plugin Structure:**
```typescript
interface Plugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

interface PluginContext {
  // Access to editor
  editor: EditorAPI;
  
  // Access to file system
  files: FileSystemAPI;
  
  // Access to compiler
  compiler: CompilerAPI;
  
  // Register hooks
  registerHook(hook: string, handler: Function): void;
  
  // UI components
  registerCommand(id: string, handler: Function): void;
  addMenuItem(menu: string, item: MenuItem): void;
}
```

### 11.2 Language Server Protocol

LSP integration for advanced IDE features.

**Capabilities:**
- Go to definition (labels, citations)
- Find references
- Document symbols (sections, labels)
- Code completion
- Hover information
- Document formatting

**LSP Architecture:**
```
┌─────────────┐     LSP     ┌─────────────┐
│   Editor    │<───────────>│ LaTeX LSP   │
│  (Client)   │  (stdio)    │  Server     │
└─────────────┘             └──────┬──────┘
                                   │
                                   ▼
                          ┌─────────────┐
                          │   Backend   │
                          │   Bridge    │
                          └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │  File       │
                          │  System     │
                          └─────────────┘
```

### 11.3 Theming System

Support for custom themes and editor styling.

**Theme Structure:**
```json
{
  "name": "My Custom Theme",
  "type": "light",
  "colors": {
    "editor.background": "#ffffff",
    "editor.foreground": "#333333",
    "editor.selection": "#b3d4fc",
    "syntax.comment": "#6a9955",
    "syntax.command": "#0000ff",
    "syntax.environment": "#af00db"
  },
  "fonts": {
    "editor": "JetBrains Mono",
    "ui": "system-ui"
  }
}
```

### 11.4 External Tool Integration

Support for external LaTeX tools.

**Integration Points:**
| Tool | Integration | Notes |
|------|-------------|-------|
| Git | Version control | Track changes, blame |
| Zotero | Bibliography | Import citations |
| Grammarly | Proofreading | API integration |
| Overleaf | Cloud sync | Import/export |
| Dropbox | Cloud storage | Project hosting |

---

## Appendix A: Technology Stack Recommendations

### Option 1: JavaScript/TypeScript (Node.js)

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Editor | Monaco Editor |
| PDF | PDF.js |
| State | Zustand |
| Backend | Fastify |
| WebSocket | ws |
| File Watch | chokidar |

### Option 2: Python

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Editor | Monaco Editor |
| PDF | PDF.js |
| Backend | FastAPI |
| WebSocket | native FastAPI |
| File Watch | watchdog |

### Option 3: Go

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Editor | Monaco Editor |
| PDF | PDF.js |
| Backend | Gin or Echo |
| WebSocket | gorilla/websocket |
| File Watch | fsnotify |

---

## Appendix B: API Reference Summary

### REST Endpoints

```
Projects
  GET    /api/projects
  POST   /api/projects
  GET    /api/projects/:id
  PATCH  /api/projects/:id
  DELETE /api/projects/:id

Files
  GET    /api/projects/:id/files
  GET    /api/projects/:id/files/*
  POST   /api/projects/:id/files/*
  PUT    /api/projects/:id/files/*
  DELETE /api/projects/:id/files/*

Compilation
  POST   /api/projects/:id/compile
  GET    /api/projects/:id/compile/status
  GET    /api/projects/:id/pdf

Import/Export
  POST   /api/import/local
  POST   /api/import/zip
  POST   /api/import/git
  POST   /api/projects/:id/export
```

### WebSocket Events

```
Client -> Server
  subscribe:project
  unsubscribe:project
  compile:start
  compile:cancel

Server -> Client
  compilation:progress
  compilation:complete
  compilation:error
  file:created
  file:modified
  file:deleted
  pdf:updated
```

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 1.0.0 |
| Last Updated | 2024 |
| Status | Draft |
| Author | System Architecture Team |

---

*End of System Architecture Document*
