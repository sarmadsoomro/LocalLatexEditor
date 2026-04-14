# API and Internal Contracts

Technical specification for the REST API between the browser frontend and local backend of the LaTeX editor.

---

## 1. API Overview

### 1.1 Base URL

The local backend runs on a configurable port (default: `3000`). All API requests are made to:

```
http://localhost:3000/api/v1
```

### 1.2 Authentication

No authentication is required for local development. The backend binds to `localhost` only, preventing external access.

### 1.3 Content Types

All requests and responses use JSON:

| Header         | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |
| `Accept`       | `application/json` |

### 1.4 Response Format

All responses follow a consistent envelope structure:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 2. Proposed Local API Endpoints

### 2.1 Project Endpoints

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| GET    | `/projects`             | List all projects         |
| POST   | `/projects`             | Create a new project      |
| GET    | `/projects/{id}`        | Get project details       |
| DELETE | `/projects/{id}`        | Delete a project          |
| POST   | `/projects/{id}/import` | Import files into project |

### 2.2 File Endpoints

| Method | Endpoint                      | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/projects/{id}/files`        | List all files in project    |
| POST   | `/projects/{id}/files`        | Create new file or directory |
| POST   | `/projects/{id}/files/upload` | Upload a file                |
| GET    | `/projects/{id}/files/{path}` | Get file content             |
| PUT    | `/projects/{id}/files/{path}` | Save/update file content     |
| DELETE | `/projects/{id}/files/{path}` | Delete a file                |

### 2.3 Compilation Endpoints

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| POST   | `/projects/{id}/compile` | Start a compilation job |
| GET    | `/compile/{jobId}`       | Get compilation status  |
| GET    | `/compile/{jobId}/logs`  | Get compilation logs    |

### 2.4 Preview Endpoints

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/projects/{id}/pdf`            | Get compiled PDF           |
| GET    | `/projects/{id}/preview/{page}` | Get preview image for page |

---

## 3. Request/Response Examples

### 3.1 Create Project

**Request:**

```http
POST /api/v1/projects
Content-Type: application/json

{
  "name": "My Research Paper",
  "template": "article"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "proj_abc123xyz",
    "name": "My Research Paper",
    "template": "article",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "files": [
      {
        "path": "main.tex",
        "type": "file",
        "size": 512
      }
    ]
  },
  "error": null
}
```

### 3.2 Get Project Files

**Request:**

```http
GET /api/v1/projects/proj_abc123xyz/files
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "projectId": "proj_abc123xyz",
    "files": [
      {
        "path": "main.tex",
        "type": "file",
        "size": 1024,
        "modifiedAt": "2024-01-15T11:00:00Z"
      },
      {
        "path": "references.bib",
        "type": "file",
        "size": 2048,
        "modifiedAt": "2024-01-15T10:45:00Z"
      },
      {
        "path": "figures",
        "type": "directory",
        "children": [
          {
            "path": "figures/chart.png",
            "type": "file",
            "size": 45056
          }
        ]
      }
    ]
  },
  "error": null
}
```

### 3.3 Save File

**Request:**

```http
PUT /api/v1/projects/proj_abc123xyz/files/main.tex
Content-Type: application/json

{
  "content": "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "path": "main.tex",
    "size": 78,
    "modifiedAt": "2024-01-15T11:30:00Z",
    "hash": "a1b2c3d4e5f6"
  },
  "error": null
}
```

### 3.4 Get File Content

**Request:**

```http
GET /api/v1/projects/proj_abc123xyz/files/main.tex
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "path": "main.tex",
    "content": "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}",
    "size": 78,
    "modifiedAt": "2024-01-15T11:30:00Z",
    "hash": "a1b2c3d4e5f6"
  },
  "error": null
}
```

### 3.5 Compile Project

**Request:**

```http
POST /api/v1/projects/proj_abc123xyz/compile
Content-Type: application/json

{
  "mainFile": "main.tex",
  "compiler": "pdflatex",
  "options": {
    "draftMode": false,
    "shellEscape": false
  }
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "jobId": "compile_job_789xyz",
    "status": "queued",
    "projectId": "proj_abc123xyz",
    "createdAt": "2024-01-15T11:35:00Z"
  },
  "error": null
}
```

### 3.6 Get Compilation Status

**Request:**

```http
GET /api/v1/compile/compile_job_789xyz
```

**Response (200 OK) - In Progress:**

```json
{
  "success": true,
  "data": {
    "jobId": "compile_job_789xyz",
    "status": "compiling",
    "projectId": "proj_abc123xyz",
    "progress": 45,
    "startedAt": "2024-01-15T11:35:02Z"
  },
  "error": null
}
```

**Response (200 OK) - Completed:**

```json
{
  "success": true,
  "data": {
    "jobId": "compile_job_789xyz",
    "status": "completed",
    "projectId": "proj_abc123xyz",
    "mainFile": "main.tex",
    "output": {
      "pdfPath": "/output/main.pdf",
      "pages": 12,
      "fileSize": 245760
    },
    "stats": {
      "startedAt": "2024-01-15T11:35:02Z",
      "completedAt": "2024-01-15T11:35:08Z",
      "duration": 6000
    }
  },
  "error": null
}
```

**Response (200 OK) - Failed:**

```json
{
  "success": true,
  "data": {
    "jobId": "compile_job_789xyz",
    "status": "failed",
    "projectId": "proj_abc123xyz",
    "mainFile": "main.tex",
    "error": {
      "code": "COMPILATION_ERROR",
      "message": "LaTeX compilation failed with errors",
      "details": [
        {
          "line": 23,
          "column": 15,
          "severity": "error",
          "message": "Undefined control sequence"
        }
      ]
    },
    "stats": {
      "startedAt": "2024-01-15T11:35:02Z",
      "completedAt": "2024-01-15T11:35:05Z",
      "duration": 3000
    }
  },
  "error": null
}
```

### 3.7 Get PDF

**Request:**

```http
GET /api/v1/projects/proj_abc123xyz/pdf
```

**Response:** Returns the PDF file as binary data with `Content-Type: application/pdf`.

---

## 4. Compile Job Flow

Sequence of API calls for compiling a LaTeX project:

```
┌─────────────────┐
│   Frontend      │
│  (Browser)      │
└────────┬────────┘
         │ 1. POST /projects/{id}/compile
         │    { mainFile, compiler, options }
         ▼
┌─────────────────┐
│   Backend       │
│  Creates Job    │
│  Returns jobId  │
└────────┬────────┘
         │ 2. Returns 202 + jobId
         ▼
┌─────────────────┐
│   Frontend      │
│  Polls Status   │
└────────┬────────┘
         │ 3. GET /compile/{jobId} (repeating)
         ▼
┌─────────────────┐
│   Backend       │
│  Returns Status │
└────────┬────────┘
         │ 4. Returns status/progress
         ▼
        ... (repeat until completed/failed)
         │
         ▼
┌─────────────────┐
│   Frontend      │
│  Status: done   │
└────────┬────────┘
         │ 5. GET /projects/{id}/pdf
         ▼
┌─────────────────┐
│   Backend       │
│  Returns PDF    │
└────────┬────────┘
         │ 6. PDF binary data
         ▼
┌─────────────────┐
│   Frontend      │
│  Displays PDF   │
└─────────────────┘
```

### Polling Strategy

The frontend should poll compilation status with exponential backoff:

| Attempt | Delay  | Total Time |
| ------- | ------ | ---------- |
| 1       | 500ms  | 500ms      |
| 2       | 500ms  | 1s         |
| 3       | 1000ms | 2s         |
| 4       | 2000ms | 4s         |
| 5+      | 2000ms | ...        |

Maximum polling interval: 2 seconds  
Maximum wait time: 5 minutes (compilation timeout)

---

## 5. Project Creation Flow

Sequence for creating a new project:

### 5.1 Create from Template

```
┌─────────────────┐
│   Frontend      │
│  User selects   │
│  template       │
└────────┬────────┘
         │ 1. POST /projects
         │    { name, template }
         ▼
┌─────────────────┐
│   Backend       │
│  Creates folder │
│  Copies template│
│  Initializes git│
└────────┬────────┘
         │ 2. Returns 201
         │    { id, name, files }
         ▼
┌─────────────────┐
│   Frontend      │
│  Opens editor   │
│  with main.tex  │
└─────────────────┘
```

**Example Request:**

```json
{
  "name": "Research Paper Q1 2024",
  "template": "ieee-conference"
}
```

**Available Templates:**

| Template ID       | Description           |
| ----------------- | --------------------- |
| `article`         | Basic article class   |
| `report`          | Report with chapters  |
| `book`            | Book format           |
| `beamer`          | Presentation slides   |
| `letter`          | Formal letter         |
| `ieee-conference` | IEEE conference paper |
| `acm-sigconf`     | ACM conference paper  |
| `empty`           | Empty project         |

### 5.2 Create Empty Project

```json
{
  "name": "My Notes",
  "template": "empty"
}
```

---

## 6. Project Import Flow

Sequence for importing an existing LaTeX project:

### 6.1 Import from Directory

```
┌─────────────────┐
│   Frontend      │
│  User selects   │
│  directory      │
└────────┬────────┘
         │ 1. POST /projects/{id}/import
         │    { source: "directory", path: "/path/to/project" }
         ▼
┌─────────────────┐
│   Backend       │
│  Scans files    │
│  Copies to      │
│  project folder │
└────────┬────────┘
         │ 2. Returns 200
         │    { importedFiles: [...] }
         ▼
┌─────────────────┐
│   Frontend      │
│  Shows file     │
│  tree           │
└─────────────────┘
```

**Example Request:**

```json
{
  "source": "directory",
  "path": "/Users/me/documents/thesis",
  "options": {
    "includeGit": true,
    "filter": ["*.tex", "*.bib", "*.cls", "*.sty", "*.png", "*.jpg", "*.pdf"]
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "importedFiles": [
      {
        "path": "main.tex",
        "size": 2048,
        "status": "imported"
      },
      {
        "path": "chapter1.tex",
        "size": 4096,
        "status": "imported"
      },
      {
        "path": "old-draft.tex",
        "size": 102400,
        "status": "skipped",
        "reason": "backup file"
      }
    ],
    "totalImported": 12,
    "totalSkipped": 1
  },
  "error": null
}
```

### 6.2 Import from Zip

```json
{
  "source": "zip",
  "file": "<base64-encoded-zip-content>",
  "options": {
    "stripFirstFolder": true
  }
}
```

---

## 7. File Save/Load Flow

Sequence for file operations:

### 7.1 Load File

```
┌─────────────────┐
│   Frontend      │
│  User clicks    │
│  file in tree   │
└────────┬────────┘
         │ 1. GET /projects/{id}/files/{path}
         ▼
┌─────────────────┐
│   Backend       │
│  Reads file     │
│  from disk      │
└────────┬────────┘
         │ 2. Returns 200
         │    { content, size, hash }
         ▼
┌─────────────────┐
│   Frontend      │
│  Displays in    │
│  editor         │
└─────────────────┘
```

### 7.2 Auto-Save Flow

```
┌─────────────────┐
│   Frontend      │
│  User types     │
│  (debounced)    │
└────────┬────────┘
         │ 1. PUT /projects/{id}/files/{path}
         │    { content, lastHash }
         ▼
┌─────────────────┐
│   Backend       │
│  Checks hash    │
│  for conflicts  │
└────────┬────────┘
         │ 2a. Returns 200 (no conflict)
         │     { newHash, modifiedAt }
         │
         │ 2b. Returns 409 (conflict)
         │     { conflict: true, serverContent }
         ▼
┌─────────────────┐
│   Frontend      │
│  Shows save     │
│  confirmation   │
└─────────────────┘
```

**Save Request with Optimistic Locking:**

```json
{
  "content": "new file content here...",
  "lastHash": "a1b2c3d4e5f6"
}
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "path": "main.tex",
    "size": 1024,
    "modifiedAt": "2024-01-15T12:00:00Z",
    "hash": "b2c3d4e5f6g7"
  },
  "error": null
}
```

**Conflict Response (409):**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "File was modified by another process",
    "details": {
      "currentHash": "x9y8z7w6v5u4",
      "serverModifiedAt": "2024-01-15T11:55:00Z"
    }
  }
}
```

### 7.3 Batch Operations

**Batch Save Multiple Files:**

```http
PUT /api/v1/projects/{id}/files
Content-Type: application/json

{
  "files": [
    {
      "path": "main.tex",
      "content": "...",
      "lastHash": "abc123"
    },
    {
      "path": "chapter1.tex",
      "content": "...",
      "lastHash": "def456"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "path": "main.tex",
        "status": "saved",
        "hash": "new123"
      },
      {
        "path": "chapter1.tex",
        "status": "conflict",
        "currentHash": "other456"
      }
    ]
  },
  "error": null
}
```

---

## 8. Error Response Format

All errors follow a consistent structure:

### 8.1 Standard Error Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  }
}
```

### 8.2 HTTP Status Codes

| Status | Code                  | Description                             |
| ------ | --------------------- | --------------------------------------- |
| 400    | `BAD_REQUEST`         | Invalid request parameters              |
| 404    | `NOT_FOUND`           | Resource not found                      |
| 409    | `CONFLICT`            | Resource conflict (e.g., file modified) |
| 422    | `VALIDATION_ERROR`    | Validation failed                       |
| 429    | `RATE_LIMITED`        | Too many requests                       |
| 500    | `INTERNAL_ERROR`      | Server error                            |
| 503    | `SERVICE_UNAVAILABLE` | Service temporarily unavailable         |

### 8.3 Common Error Examples

**Validation Error (400):**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid project name",
    "details": {
      "field": "name",
      "constraint": "Project name must be 1-100 characters"
    }
  }
}
```

**Not Found (404):**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found",
    "details": {
      "resource": "project",
      "id": "proj_invalid123"
    }
  }
}
```

**Compilation Error (200 with error details):**

```json
{
  "success": true,
  "data": {
    "jobId": "compile_job_789",
    "status": "failed",
    "error": {
      "code": "COMPILATION_ERROR",
      "message": "LaTeX compilation failed",
      "details": {
        "errors": [
          {
            "line": 42,
            "column": 12,
            "severity": "error",
            "message": "Undefined control sequence: \\unknowncommand",
            "source": "main.tex"
          },
          {
            "line": 50,
            "severity": "warning",
            "message": "Overfull \\hbox (12.3pt too wide)"
          }
        ],
        "logUrl": "/compile/compile_job_789/logs"
      }
    }
  },
  "error": null
}
```

---

## 9. Event or WebSocket Updates

### 9.1 WebSocket Connection

For real-time updates, connect to the WebSocket endpoint:

```
ws://localhost:3000/ws
```

### 9.2 Connection Handshake

**Client connects and subscribes to project:**

```json
{
  "type": "subscribe",
  "payload": {
    "projectId": "proj_abc123xyz"
  }
}
```

**Server acknowledges:**

```json
{
  "type": "subscribed",
  "payload": {
    "projectId": "proj_abc123xyz",
    "sessionId": "ws_sess_xyz789"
  }
}
```

### 9.3 Event Types

| Event Type          | Direction        | Description                       |
| ------------------- | ---------------- | --------------------------------- |
| `file.changed`      | Server -> Client | File content changed              |
| `file.created`      | Server -> Client | New file created                  |
| `file.deleted`      | Server -> Client | File deleted                      |
| `compile.started`   | Server -> Client | Compilation started               |
| `compile.progress`  | Server -> Client | Compilation progress update       |
| `compile.completed` | Server -> Client | Compilation finished              |
| `compile.failed`    | Server -> Client | Compilation failed                |
| `cursor.position`   | Bidirectional    | Cursor position for collaboration |
| `user.joined`       | Server -> Client | Another user joined project       |
| `user.left`         | Server -> Client | User left project                 |

### 9.4 Event Examples

**File Changed Event:**

```json
{
  "type": "file.changed",
  "timestamp": "2024-01-15T12:00:00Z",
  "payload": {
    "projectId": "proj_abc123xyz",
    "file": {
      "path": "main.tex",
      "size": 2048,
      "hash": "newhash123",
      "modifiedAt": "2024-01-15T12:00:00Z"
    },
    "source": "user",
    "userId": "user_session_abc"
  }
}
```

**Compilation Progress Event:**

```json
{
  "type": "compile.progress",
  "timestamp": "2024-01-15T12:05:30Z",
  "payload": {
    "jobId": "compile_job_789xyz",
    "projectId": "proj_abc123xyz",
    "status": "compiling",
    "progress": 65,
    "currentStep": "Processing page 8 of 12",
    "logs": [
      "(./main.tex [8]",
      "Overfull \\hbox (2.3pt too wide) in paragraph at lines 145--150"
    ]
  }
}
```

**Compilation Completed Event:**

```json
{
  "type": "compile.completed",
  "timestamp": "2024-01-15T12:05:45Z",
  "payload": {
    "jobId": "compile_job_789xyz",
    "projectId": "proj_abc123xyz",
    "status": "completed",
    "output": {
      "pages": 12,
      "fileSize": 245760
    }
  }
}
```

### 9.5 Heartbeat

To keep connections alive, both client and server send periodic pings:

**Client Ping (every 30s):**

```json
{
  "type": "ping",
  "timestamp": "2024-01-15T12:00:30Z"
}
```

**Server Pong:**

```json
{
  "type": "pong",
  "timestamp": "2024-01-15T12:00:30Z"
}
```

### 9.6 Reconnection Strategy

If the WebSocket disconnects, the client should:

1. Wait 1 second before first reconnection attempt
2. Use exponential backoff: 1s, 2s, 4s, 8s, max 30s
3. Re-subscribe to all previously subscribed projects after reconnecting
4. Fetch current state via REST API to catch missed updates

### 9.7 Fallback to Polling

If WebSockets are unavailable, fall back to REST API polling:

```
GET /api/v1/projects/{id}/events?since={timestamp}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "type": "file.changed",
        "timestamp": "2024-01-15T12:00:00Z",
        "payload": { ... }
      }
    ],
    "lastEventId": "evt_123"
  },
  "error": null
}
```

---

## Appendix A: Data Types

### Project

| Field       | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `id`        | string   | Unique project identifier   |
| `name`      | string   | Display name                |
| `template`  | string   | Template used for creation  |
| `createdAt` | ISO 8601 | Creation timestamp          |
| `updatedAt` | ISO 8601 | Last modification timestamp |
| `files`     | File[]   | List of files in project    |
| `settings`  | object   | Project-specific settings   |

### File

| Field        | Type     | Description                         |
| ------------ | -------- | ----------------------------------- |
| `path`       | string   | Relative path from project root     |
| `type`       | string   | `file` or `directory`               |
| `size`       | number   | File size in bytes                  |
| `modifiedAt` | ISO 8601 | Last modification timestamp         |
| `hash`       | string   | Content hash for conflict detection |
| `content`    | string   | File content (when requested)       |
| `children`   | File[]   | Child files (for directories)       |

### Compile Job

| Field       | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `jobId`     | string | Unique job identifier                        |
| `projectId` | string | Associated project                           |
| `status`    | string | `queued`, `compiling`, `completed`, `failed` |
| `mainFile`  | string | Entry point file                             |
| `compiler`  | string | `pdflatex`, `xelatex`, `lualatex`            |
| `progress`  | number | Progress percentage (0-100)                  |
| `output`    | object | Output file information                      |
| `error`     | object | Error details (if failed)                    |
| `stats`     | object | Timing statistics                            |

---

## Appendix B: Rate Limits

| Endpoint         | Limit | Window   |
| ---------------- | ----- | -------- |
| All endpoints    | 100   | 1 minute |
| Compile requests | 5     | 1 minute |
| File save        | 60    | 1 minute |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705321200
```

---

_Document Version: 1.0_  
_Last Updated: 2024-01-15_
