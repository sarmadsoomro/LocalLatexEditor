# FRONTEND KNOWLEDGE BASE

**Scope:** React + Vite Application
**Port:** 3000 (dev)
**Entry:** `src/main.tsx`

---

## OVERVIEW

React 18 SPA with Monaco Editor for LaTeX editing, Zustand for state management, and react-pdf for PDF preview. Proxies API calls to backend on port 3001.

---

## STRUCTURE

```
apps/frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Editor/         # Monaco editor wrapper
│   │   ├── FileTree.tsx    # Project file browser
│   │   ├── PDFPreview.tsx  # PDF viewer
│   │   └── ...
│   ├── pages/              # Route-level components
│   │   ├── ProjectList.tsx
│   │   └── ProjectDetail.tsx
│   ├── stores/             # Zustand state stores
│   │   ├── projectStore.ts
│   │   ├── editorStore.ts
│   │   └── compilationStore.ts
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── utils/              # Utility functions
│   └── main.tsx           # App entry point
├── vite.config.ts         # Vite config with proxy
└── package.json
```

---

## WHERE TO LOOK

| Task          | Location          | Notes                        |
| ------------- | ----------------- | ---------------------------- |
| Add component | `src/components/` | PascalCase, co-locate styles |
| Add page      | `src/pages/`      | Route-level components only  |
| Add store     | `src/stores/`     | Zustand store pattern        |
| Add hook      | `src/hooks/`      | Prefix with `use`            |
| API calls     | `src/services/`   | Backend communication        |
| Routing       | `src/App.tsx`     | react-router-dom routes      |

---

## CONVENTIONS

### State Management (Zustand)

```typescript
// stores/projectStore.ts pattern
interface ProjectState {
  projects: Project[];
  selectedId: string | null;
  fetchProjects: () => Promise<void>;
}
```

### Path Alias

- `@/` maps to `src/`
- Import: `import { Button } from '@/components/Button'`

### Monaco Editor

- Loaded in separate chunk via `manualChunks: { monaco: ['monaco-editor'] }`
- Optimized deps: `include: ['monaco-editor']`

---

## ANTI-PATTERNS

1. **No direct fetch** — Use `src/services/` layer
2. **No prop drilling** — Use Zustand for shared state
3. **No barrel imports** — Import directly from component file

---

## COMMANDS

```bash
cd apps/frontend
pnpm dev           # Start dev server (port 3000)
pnpm build         # Build for production
pnpm test:unit     # Vitest tests
pnpm test:e2e      # Playwright tests
```

---

## NOTES

- Vite proxy: `/api` → `http://localhost:3001`
- StrictMode enabled
- Tailwind CSS for styling
- `cn()` utility from `tailwind-merge` + `clsx`
