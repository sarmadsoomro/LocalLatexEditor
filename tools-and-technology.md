# Tools and Technology

**Project:** Local LaTeX Editor  
**Document Type:** Technical Decision Documentation  
**Last Updated:** March 2026  
**Status:** Draft for Review

---

## Executive Summary

This document outlines the technology stack recommendations for building a local LaTeX editor as a localhost web application. The editor requires browser-based editing capabilities, local file system integration, LaTeX compilation pipeline, and PDF rendering. Each section provides a comprehensive comparison of available options with specific recommendations for MVP and future phases.

**Key Architectural Decisions:**
- Frontend: React + TypeScript with Monaco Editor
- Backend: Node.js/Express for seamless JavaScript ecosystem integration
- PDF Rendering: PDF.js for browser-based viewing
- Compilation: Child process execution with proper sandboxing
- Distribution: Electron for cross-platform desktop packaging

---

## 1. Frontend Framework

### Overview

The frontend framework choice impacts developer productivity, component ecosystem, performance, and long-term maintainability. For a desktop-like application experience with real-time preview, we need a framework with excellent state management and reactive UI capabilities.

### Comparison Table

| Framework | Pros | Cons | Best For |
|-----------|------|------|----------|
| **React** | Massive ecosystem, excellent TypeScript support, strong community, React DevTools, Next.js integration path, extensive LaTeX-related npm packages | Steeper learning curve for beginners, requires additional libraries for state management, boilerplate overhead | Complex applications with rich interactivity |
| **Vue 3** | Gentle learning curve, excellent documentation, Composition API for reactivity, smaller bundle sizes, single-file components | Smaller ecosystem than React, fewer specialized LaTeX libraries, less corporate adoption | Rapid prototyping and smaller teams |
| **Angular** | Full-featured framework, dependency injection, TypeScript-first, enterprise-grade tooling, built-in state management | Heavy bundle size, steep learning curve, opinionated structure, slower development velocity | Large enterprise applications |
| **Svelte** | Minimal runtime overhead, true reactivity, less boilerplate, excellent performance | Smaller ecosystem, newer framework with less battle-testing, fewer job candidates | Performance-critical applications |
| **SolidJS** | Fastest rendering performance, fine-grained reactivity, React-like syntax | Very small ecosystem, limited third-party libraries, newer framework | Maximum performance requirements |

### Recommendation

**Primary Choice: React 18+ with TypeScript**

**Rationale:**
- React's ecosystem includes numerous LaTeX-related packages (react-latex, better-react-mathjax)
- Excellent debugging tools for a complex editor application
- Strong typing with TypeScript reduces runtime errors
- Vast community means solutions exist for edge cases
- Easy to find developers familiar with the stack

**Alternative Consideration: Vue 3**
- Choose if team has Vue expertise
- Composition API provides similar reactivity patterns to React hooks
- Smaller learning curve for new team members

**Version Recommendation:** React 18.2+ for concurrent features and improved rendering performance

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | React 18 + functional components + hooks | Use Context API for state management initially |
| **Future** | Add Redux Toolkit or Zustand for complex state | Implement React Query for server state |

---

## 2. Editor Component

### Overview

The code editor is the core user interface element. It must handle LaTeX syntax highlighting, provide IntelliSense-style features, support large documents, and offer extensibility for custom LaTeX commands and snippets.

### Comparison Table

| Editor | Pros | Cons | Best For |
|--------|------|------|----------|
| **Monaco Editor** | VS Code's editor, excellent TypeScript support, IntelliSense, built-in themes, massive extension ecosystem, LaTeX language support via extensions | Heavy bundle size (~3MB), complex API, resource-intensive | Professional IDEs and complex editing |
| **CodeMirror 6** | Modular architecture, smaller bundle sizes, excellent mobile support, good performance, native LaTeX mode | Smaller ecosystem than Monaco, less batteries-included | Customizable lightweight editors |
| **Ace Editor** | Mature and stable, good language support, themes, smaller than Monaco | Slower development, fewer modern features, aging codebase | Legacy applications |
| **PrismJS (view-only)** | Lightweight, excellent syntax highlighting, easy theming | Not a full editor, view-only capability | Simple syntax display |
| **ProseMirror** | Excellent for rich text, collaborative editing support | Not ideal for code editing, steep learning curve | Rich text documents |

### Recommendation

**Primary Choice: Monaco Editor (@monaco-editor/react)**

**Rationale:**
- Industry standard for code editing (powers VS Code)
- Built-in LaTeX syntax highlighting and bracket matching
- Command palette and minimap provide IDE-like experience
- IntelliSense extensible for custom LaTeX commands
- Worker-based architecture keeps UI responsive during large file edits
- Strong TypeScript definitions

**Configuration for LaTeX:**

```typescript
const editorOptions = {
  language: 'latex',
  theme: 'vs-dark',
  minimap: { enabled: true },
  fontSize: 14,
  wordWrap: 'on',
  automaticLayout: true,
  folding: true,
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true }
};
```

**Alternative Consideration: CodeMirror 6**
- Choose if bundle size is critical constraint
- Better for embedded/integrated scenarios
- More flexible theming system

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Monaco Editor with basic LaTeX mode | Enable word wrap, bracket matching, basic snippets |
| **Future** | Custom language server for LaTeX | Add autocomplete for commands, references, citations |

---

## 3. Backend Framework

### Overview

The backend handles LaTeX compilation orchestration, file system operations, process management, and potentially PDF generation. Since this is a local application, the backend primarily bridges the frontend with system resources.

### Comparison Table

| Framework | Pros | Cons | Best For |
|-----------|------|------|----------|
| **Node.js/Express** | Same language as frontend, massive npm ecosystem, excellent async handling, easy file streaming, child process management | Single-threaded limitations for CPU-intensive tasks, callback complexity (mitigated by async/await) | I/O-bound applications with JavaScript frontend |
| **Python/FastAPI** | Excellent for data processing, easy LaTeX tool integration, great async support, type hints, auto-generated OpenAPI docs | Context switching between languages, separate build pipeline, smaller frontend ecosystem integration | Python-heavy environments |
| **Python/Flask** | Simple and flexible, mature ecosystem, extensive LaTeX libraries | Sync by default, less modern than FastAPI, manual API documentation | Simple Python backends |
| **Deno** | Modern JavaScript runtime, built-in TypeScript, secure by default, standard library | Smaller ecosystem than Node.js, newer technology | Security-focused JavaScript apps |
| **Go/Gin** | Excellent performance, concurrency, single binary deployment | Steep learning curve, smaller web ecosystem, more verbose | High-performance requirements |
| **Rust/Actix** | Maximum performance, memory safety, excellent for system operations | Very steep learning curve, verbose development | Performance-critical system tools |

### Recommendation

**Primary Choice: Node.js with Express and TypeScript**

**Rationale:**
- Unified JavaScript/TypeScript stack reduces context switching
- Excellent support for spawning and managing LaTeX compilation processes
- Native file system watching capabilities with fs.watch and chokidar
- Stream-based PDF serving to frontend
- Easy integration with frontend build tools
- Strong support for real-time communication (WebSockets) for live preview

**Architecture Pattern:**

```
src/
  server.ts          # Express server setup
  routes/
    compile.ts       # LaTeX compilation endpoints
    files.ts         # File system operations
    pdf.ts           # PDF serving and streaming
  services/
    latex.ts         # LaTeX process management
    watcher.ts       # File watching service
    logger.ts        # Compilation logging
  types/
    index.ts         # Shared TypeScript definitions
```

**Alternative Consideration: Python/FastAPI**
- Choose if heavy LaTeX post-processing required
- Better for PDF manipulation libraries (PyPDF2, reportlab)
- More mature LaTeX tooling ecosystem in Python

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Express with basic middleware | Focus on compilation and file serving |
| **Future** | Add WebSocket server for live updates | Implement session management for multiple projects |

---

## 4. PDF Rendering Approach

### Overview

PDF rendering in the browser requires either native browser capabilities or JavaScript-based PDF libraries. Since this is a local application, we can leverage both browser features and native PDF support.

### Comparison Table

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **PDF.js (Mozilla)** | Industry standard, excellent rendering quality, text selection, annotation support, active development, works in all modern browsers | Large bundle size, memory intensive for large PDFs, slower than native | Cross-platform PDF viewing |
| **Native Browser PDF** | Zero overhead, instant rendering, OS-native controls, minimal implementation | Limited customization, no text extraction, different per browser | Quick preview without features |
| **PDF-LIB** | Create and modify PDFs programmatically, good for overlays/annotations, pure JavaScript | Not for viewing, higher complexity | PDF manipulation and generation |
| **React-PDF** | React wrapper for PDF.js, easy integration, component-based | Adds React dependency layer, same PDF.js limitations | React applications |
| **PDF-TRON** | Commercial, excellent features, annotations, forms | Licensing costs, proprietary | Enterprise applications |

### Recommendation

**Primary Choice: PDF.js (via react-pdf or direct integration)**

**Rationale:**
- Battle-tested in Firefox and countless web applications
- Enables text selection, search, and annotation features
- Can render pages as canvas or SVG for flexibility
- Supports streaming large PDFs efficiently
- Active community and Mozilla backing

**Implementation Strategy:**

```typescript
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// For React wrapper:
import { Document, Page } from 'react-pdf';
```

**Alternative Consideration: Native Browser PDF**
- Use for initial MVP if rapid development needed
- Embed with embed tag
- Switch to PDF.js for production features

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | PDF.js basic rendering | Single page view, basic navigation |
| **Future** | Advanced PDF.js features | Thumbnails, search, annotations, outline navigation |

---

## 5. Local Compilation Approach

### Overview

LaTeX compilation requires executing external commands (pdflatex, xelatex, lualatex) with proper working directory management, error capturing, and security considerations.

### Comparison Table

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Node.js child_process** | Native Node.js, full control over execution, easy stdout/stderr capture, flexible process management | Requires careful error handling, security considerations | Full control over compilation |
| **Node.js execa** | Promise-based, better cross-platform support, improved API over native child_process, excellent streaming | Additional dependency | Modern Node.js applications |
| **Docker containers** | Complete isolation, reproducible environments, easy LaTeX distribution management | Resource overhead, complexity, slower startup | Team environments with varying setups |
| **WebAssembly (TeXLive.js)** | No external dependencies, works in browser, portable | Slower compilation, limited packages, large WASM files | Zero-install scenarios |
| **Overleaf LaTeX-CI** | Cloud compilation, no local LaTeX needed | Requires internet, latency, potential costs | Backup/offload compilation |

### Recommendation

**Primary Choice: Node.js execa with child_process fallback**

**Rationale:**
- Execa provides excellent Promise-based API for process management
- Automatic escaping and cross-platform shell handling
- Built-in timeout and cancellation support
- Easy stdout/stderr streaming for real-time log output
- Graceful error handling for compilation errors

**Implementation Pattern:**

```typescript
import { execa } from 'execa';

async function compileLaTeX(filePath: string, options: CompileOptions) {
  const { stdout, stderr, exitCode } = await execa(
    'pdflatex',
    ['-interaction=nonstopmode', '-file-line-error', filePath],
    {
      cwd: path.dirname(filePath),
      timeout: 30000,
      reject: false  // Don't throw on non-zero exit
    }
  );
  
  return { success: exitCode === 0, logs: stdout, errors: stderr };
}
```

**Alternative Consideration: Docker**
- Use for consistent team environments
- Pre-configured with complete LaTeX distribution
- Example: texlive/texlive:latest image

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Simple execa with pdflatex | Basic compilation with error capture |
| **Future** | Multi-pass compilation (bibtex, makeindex) | Caching, incremental compilation |

---

## 6. File Watching Tools

### Overview

File watching detects changes to LaTeX source files and triggers automatic compilation for live preview functionality.

### Comparison Table

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **Chokidar** | Industry standard, cross-platform, stable, debouncing, ignores dotfiles by default | Additional dependency | Production applications |
| **Node.js fs.watch** | Built-in, no dependencies | Unreliable across platforms, inconsistent events, macOS issues | Simple cases only |
| **Node.js fs.watchFile** | Polling-based, works everywhere | CPU intensive, slow, resource-heavy | Network file systems |
| **Watchman** | Facebook's tool, very reliable, query subscriptions | Requires separate installation, complex | Large monorepos |
| **Parcel/Watcher** | Fast native bindings, used by VS Code | Rust dependency, newer | High-performance needs |

### Recommendation

**Primary Choice: Chokidar**

**Rationale:**
- Used by VS Code, Webpack, and countless other tools
- Handles platform differences (macOS fsevents, Linux inotify, Windows ReadDirectoryChanges)
- Built-in debouncing prevents compilation thrashing
- Easy ignore patterns for build artifacts
- Excellent documentation and stability

**Implementation:**

```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch('**/*.tex', {
  ignored: ['**/node_modules/**', '**/*.pdf', '**/*.aux'],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher.on('change', (path) => {
  console.log(`File ${path} changed`);
  triggerCompilation(path);
});
```

**Version Recommendation:** Chokidar 3.5+ for stability improvements

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Chokidar with basic change detection | Watch .tex files only |
| **Future** | Smart watching with dependency tracking | Watch included files, images, bibliography |

---

## 7. Logging Tools

### Overview

LaTeX compilation produces extensive output. Proper logging helps users debug compilation errors, track warnings, and understand the build process.

### Comparison Table

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **Winston** | Feature-rich, multiple transports, log levels, JSON formatting, widely used | Larger bundle size | Comprehensive logging needs |
| **Pino** | High performance, JSON-first, low overhead, modern | Less built-in features than Winston | Performance-critical logging |
| **Bunyan** | Structured JSON logs, child loggers, stream processing | Less active development | JSON logging pipelines |
| **Console API** | Built-in, no dependencies | No persistence, limited formatting | Development only |
| **Signale** | Clean output, customizable, scoped loggers | Less structured | CLI applications |
| **LaTeX-specific parser** | Understands LaTeX error format, line numbers, context | Custom implementation needed | LaTeX compilation specifically |

### Recommendation

**Primary Choice: Pino for backend + custom LaTeX parser**

**Rationale:**
- Pino's performance is critical for real-time log streaming
- JSON structure enables frontend log display with filtering
- Low overhead won't slow down compilation
- Combine with custom LaTeX error parser for intelligent error highlighting

**Implementation Strategy:**

```typescript
import pino from 'pino';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Custom LaTeX error parser
function parseLaTeXErrors(logOutput: string): LaTeXError[] {
  const errorPattern = /^(.*?):(\d+):\s*(.*?)$/gm;
  const errors = [];
  let match;
  while ((match = errorPattern.exec(logOutput)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2]),
      message: match[3]
    });
  }
  return errors;
}
```

**Alternative Consideration: Winston**
- Choose if need multiple transports (file + console + remote)
- Better for complex logging pipelines

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Console output captured and displayed | Simple error display in UI |
| **Future** | Structured logging with Pino | Log filtering, severity levels, export |

---

## 8. Packaging and Distribution Tools

### Overview

Since this is a local web application, packaging determines how users install and run the editor. Options range from pure web to full desktop applications.

### Comparison Table

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **Electron** | Mature ecosystem, cross-platform, web technologies, native APIs, auto-updater, large community | Large bundle size, memory usage, Chromium overhead | Full desktop applications |
| **Tauri** | Small bundle size (~600KB), Rust backend, secure, modern, webview-based | Newer ecosystem, Rust learning curve, limited plugins | Size-conscious applications |
| **Pure Web (localhost)** | No packaging needed, instant updates, works everywhere | Requires manual server start, less polished, no native OS integration | Developer tools |
| **VS Code Extension** | Built-in distribution, access to VS Code APIs, large user base | Limited to VS Code users, restricted UI | VS Code ecosystem |
| **PWA (Progressive Web App)** | Installable, offline capable, native-like | Limited file system access, no LaTeX compilation | Simple editing scenarios |
| **Neutralinojs** | Lightweight alternative to Electron, native API access | Smaller community, less mature | Lightweight desktop apps |

### Recommendation

**Primary Choice: Electron for desktop, with pure web fallback**

**Rationale:**
- Electron provides the most mature path to a polished desktop application
- Native file dialogs, menu bars, and OS integration
- Auto-updater ensures users always have latest version
- Extensive documentation and community support
- Used by VS Code, Slack, Discord - proven at scale

**Architecture:**

```
Desktop App (Electron)
  |- Main Process: Node.js backend + file system access
  |- Renderer Process: React frontend
  |- Preload: Secure bridge between processes
```

**Alternative Consideration: Tauri**
- Choose if application size is critical concern
- Much smaller memory footprint
- Better security model by default

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Pure web (localhost server) | Manual npm start, browser access |
| **Phase 2** | Electron wrapper | Packaged desktop app with installer |
| **Future** | Auto-updater, native menus | Polished desktop experience |

---

## 9. Testing Tools

### Overview

Comprehensive testing ensures the editor works reliably across different LaTeX documents, compilation scenarios, and user interactions.

### Frontend Testing Comparison

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **Jest** | Industry standard, snapshot testing, mocking, coverage reports | Can be slow, complex configuration | Unit testing |
| **Vitest** | Fast (Vite-based), Jest-compatible API, modern | Newer, smaller ecosystem | Vite-based projects |
| **React Testing Library** | User-centric testing, accessibility-focused, encourages best practices | Requires companion runner (Jest/Vitest) | React component testing |
| **Cypress** | E2E testing, time-travel debugging, excellent developer experience | Slower than unit tests, resource-intensive | End-to-end flows |
| **Playwright** | Cross-browser, fast, reliable, auto-waiting, trace viewer | Steeper learning curve | Cross-browser E2E |

### Backend Testing Comparison

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **Jest** | Same as frontend, unified testing, mocking | Can be slow | Node.js unit testing |
| **Mocha + Chai** | Flexible, mature, extensive plugin ecosystem | More configuration required | Custom testing setups |
| **Supertest** | HTTP assertion library, easy API testing | Needs companion framework | API endpoint testing |
| **AVA** | Minimalist, fast, concurrent test runs | Smaller ecosystem, less features | Simple test setups |

### Recommendation

**Primary Choice: Vitest + React Testing Library + Playwright**

**Rationale:**
- Vitest provides fast unit testing with modern ES modules support
- React Testing Library ensures tests reflect user behavior
- Playwright covers E2E scenarios including LaTeX compilation flows
- Unified TypeScript support across all tools

**Testing Strategy:**

```
tests/
  unit/              # Vitest + React Testing Library
    components/
    utils/
  integration/       # Vitest
    api/
    latex/
  e2e/               # Playwright
    user-flows/
    compilation/
```

**Version Recommendations:**
- Vitest 1.0+
- React Testing Library 14.0+
- Playwright 1.40+

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Jest or Vitest unit tests | Core utilities and components |
| **Phase 2** | React Testing Library | Component interaction tests |
| **Future** | Playwright E2E | Full user workflows |

---

## 10. Documentation Tools

### Overview

Documentation includes user guides, API documentation, developer guides, and inline code documentation.

### Comparison Table

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **TypeDoc** | Auto-generates from TypeScript, clean output, extensible | TypeScript only | TypeScript projects |
| **VitePress** | Fast, Vue-based, modern, markdown-based, great search | Vue dependency | Modern documentation sites |
| **Docusaurus** | React-based, versioning, blog support, large community | Heavier setup, more complex | Comprehensive doc sites |
| **MkDocs** | Python-based, material theme, simple | Requires Python | Simple documentation |
| **JSDoc** | Standard, IDE integration, annotations | Verbose, less modern output | Inline documentation |
| **Storybook** | Component showcase, interactive, isolation | Additional setup overhead | Component libraries |

### Recommendation

**Primary Choice: TypeDoc + VitePress**

**Rationale:**
- TypeDoc generates API docs automatically from TypeScript
- VitePress creates beautiful, fast documentation site
- Markdown-based content is easy to maintain
- Search functionality built-in
- Modern developer experience

**Alternative Consideration: Docusaurus**
- Choose if need blog, versioning, or i18n
- Better for larger documentation projects

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | TypeDoc for API, README for guides | Basic documentation |
| **Future** | VitePress site | Full documentation website |

---

## 11. CI/CD Recommendations

### Overview

While this is local-first software, CI/CD ensures code quality, automated testing, and streamlined releases.

### Comparison Table

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **GitHub Actions** | Native GitHub integration, extensive marketplace, free tier, community workflows | Vendor lock-in | GitHub-hosted projects |
| **GitLab CI** | Built-in to GitLab, powerful, container registry integration | Requires GitLab | GitLab users |
| **CircleCI** | Fast, reliable, excellent Docker support, good caching | Pricing for larger teams | Professional teams |
| **Travis CI** | Simple, widely known | Slower, recent reliability issues | Simple setups |
| **Jenkins** | Self-hosted, unlimited customization, plugins | Maintenance overhead, complex | Enterprise self-hosted |
| **GitHub Actions + electron-builder** | Automated releases, code signing, auto-updater | GitHub-specific | Electron apps |

### Recommendation

**Primary Choice: GitHub Actions**

**Rationale:**
- Tight integration with GitHub repositories
- Free tier sufficient for open source and small teams
- Extensive marketplace of pre-built actions
- Excellent support for Node.js, TypeScript, and Electron
- Built-in artifact storage and release management

**Recommended Workflow:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

**Alternative Consideration: GitLab CI**
- Choose if already using GitLab for repository hosting
- Better integrated container registry for Docker-based builds

### MVP vs Future Phase

| Phase | Approach | Notes |
|-------|----------|-------|
| **MVP** | Manual testing and deployment | No CI/CD needed initially |
| **Phase 2** | GitHub Actions for testing | Automated test runs on PRs |
| **Future** | Automated releases with electron-builder | Signed installers, auto-updates |

---

## 12. Recommended Development Environment

### Overview

A well-configured development environment accelerates productivity and ensures consistency across team members.

### IDE Comparison

| IDE | Pros | Cons | Best For |
|-----|------|------|----------|
| **VS Code** | Free, excellent TypeScript support, massive extension ecosystem, integrated terminal, debugging, Git integration | Electron-based (resource usage) | Most developers |
| **WebStorm** | Full IDE experience, excellent refactoring, built-in tools | Paid license, heavier | Professional developers |
| **Vim/Neovim** | Lightweight, keyboard-centric, highly customizable | Steep learning curve | Experienced developers |
| **Cursor** | AI-powered coding, VS Code compatible | Subscription for AI features | AI-assisted development |

### Recommendation

**Primary Choice: VS Code**

**Rationale:**
- Same editor as Monaco (the editor component we're using)
- Excellent TypeScript and React support
- Extensive extension ecosystem
- Free and widely adopted
- Built-in debugging and Git integration

### Recommended VS Code Extensions

| Extension | Purpose |
|-----------|---------|
| **ESLint** | Code linting and style enforcement |
| **Prettier** | Code formatting |
| **TypeScript Importer** | Automatic TypeScript imports |
| **React Developer Tools** | React component debugging |
| **Auto Rename Tag** | Automatic HTML/JSX tag renaming |
| **GitLens** | Enhanced Git visualization |
| **Error Lens** | Inline error highlighting |
| **Path Intellisense** | Autocomplete file paths |
| **Thunder Client** | REST API testing (alternative to Postman) |
| **LaTeX Workshop** | LaTeX syntax highlighting and preview |

### Recommended Development Setup

```
Development Stack:
- Node.js 20 LTS
- npm 10+ or pnpm 8+
- VS Code with extensions above
- Git 2.40+
- LaTeX Distribution (TeX Live or MiKTeX)

VS Code Settings (.vscode/settings.json):
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

### Alternative Consideration: WebStorm
- Choose if need advanced refactoring capabilities
- Better for large codebases
- Worth the license fee for professional development

---

## Appendix A: Technology Summary Table

| Category | Primary Choice | Alternative | MVP Phase | Future Phase |
|----------|---------------|-------------|-----------|--------------|
| Frontend Framework | React 18 + TypeScript | Vue 3 | Context API | Redux/Zustand |
| Editor Component | Monaco Editor | CodeMirror 6 | Basic mode | Language server |
| Backend Framework | Node.js/Express | Python/FastAPI | REST API | WebSockets |
| PDF Rendering | PDF.js | Native browser | Basic viewer | Advanced features |
| Compilation | execa/child_process | Docker | Single pass | Multi-pass, caching |
| File Watching | Chokidar | fs.watch | Basic watching | Smart dependencies |
| Logging | Pino + custom parser | Winston | Console display | Structured logs |
| Packaging | Electron | Tauri | Pure web | Desktop app |
| Testing | Vitest + RTL + Playwright | Jest + Cypress | Unit tests | E2E coverage |
| Documentation | TypeDoc + VitePress | Docusaurus | README + API | Full site |
| CI/CD | GitHub Actions | GitLab CI | Manual | Automated |
| IDE | VS Code | WebStorm | Basic setup | Full extensions |

---

## Appendix B: Package.json Dependencies (Recommended)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@monaco-editor/react": "^4.6.0",
    "express": "^4.18.2",
    "chokidar": "^3.5.3",
    "execa": "^8.0.1",
    "pino": "^8.17.0",
    "pdfjs-dist": "^4.0.0",
    "react-pdf": "^7.6.0",
    "ws": "^8.14.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "playwright": "^1.40.0",
    "electron": "^28.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "typedoc": "^0.25.0"
  }
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 2026 | Technical Team | Initial document creation |

---

*This document is a living document. Technology choices should be re-evaluated as the project evolves and new tools become available.*
