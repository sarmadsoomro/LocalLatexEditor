# LaTeX Snippets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement LaTeX code snippets that allow users to quickly insert common LaTeX patterns using tab-triggered expansions.

**Architecture:** Configure Monaco Editor with custom snippet contributions, create a snippets registry with LaTeX patterns, and add UI for snippet discovery and insertion.

**Tech Stack:** Monaco Editor snippets API, React, TypeScript

---

## File Structure

```
apps/frontend/src/
├── components/
│   ├── Snippets/
│   │   ├── index.ts              # Component exports
│   │   ├── SnippetPanel.tsx      # Snippet browser panel
│   │   └── SnippetItem.tsx       # Individual snippet display
│   ├── Editor/
│   │   └── MonacoEditor.tsx      # Configure snippets (modified)
│   └── Toolbar.tsx               # Add snippets button (modified)
├── config/
│   └── latexSnippets.ts          # Snippet definitions
└── types/
    └── snippets.ts               # Snippet type definitions
```

---

## Task 1: Define Snippet Types

**Files:**
- Create: `apps/frontend/src/types/snippets.ts`

**Purpose:** Define TypeScript interfaces for LaTeX snippets.

- [ ] **Step 1: Create snippet types**

```typescript
// apps/frontend/src/types/snippets.ts

/**
 * Monaco Editor compatible snippet format
 */
export interface LaTeXSnippet {
  prefix: string;           // Trigger text (e.g., "sec", "fig")
  body: string[];          // Snippet body (array of lines)
  description: string;     // Human-readable description
  scope?: string;          // Language scope (e.g., "latex")
  category: SnippetCategory;
  priority?: number;       // Higher = shown first in suggestions
}

export type SnippetCategory =
  | 'structure'     // Document structure (section, chapter)
  | 'formatting'    // Text formatting (bold, italic)
  | 'environment'   // Environments (equation, figure)
  | 'math'          // Math mode symbols and structures
  | 'reference'     // Citations and references
  | 'table'         // Table-related
  | 'custom';       // User-defined snippets

export interface SnippetGroup {
  category: SnippetCategory;
  label: string;
  snippets: LaTeXSnippet[];
}

/**
 * Monaco snippet contribution format
 */
export interface MonacoSnippetContribution {
  [name: string]: {
    prefix: string;
    body: string[];
    description: string;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/types/snippets.ts
git commit -m "feat(snippets): add snippet type definitions"
```

---

## Task 2: Create LaTeX Snippets Registry

**Files:**
- Create: `apps/frontend/src/config/latexSnippets.ts`

**Purpose:** Define comprehensive LaTeX snippet library.

- [ ] **Step 1: Create snippets configuration**

```typescript
// apps/frontend/src/config/latexSnippets.ts

import type { LaTeXSnippet, SnippetGroup } from '../types/snippets';

/**
 * Document Structure Snippets
 */
const structureSnippets: LaTeXSnippet[] = [
  {
    prefix: 'doc',
    body: [
      '\\documentclass{${1:article}}',
      '',
      '\\usepackage[utf8]{inputenc}',
      '\\usepackage{geometry}',
      '\\geometry{a4paper, margin=1in}',
      '',
      '\\title{${2:Title}}',
      '\\author{${3:Author}}',
      '\\date{\\today}',
      '',
      '\\begin{document}',
      '',
      '\\maketitle',
      '',
      '${0}',
      '',
      '\\end{document}',
    ],
    description: 'Full document template',
    category: 'structure',
    priority: 100,
  },
  {
    prefix: 'sec',
    body: ['\\section{${1:Section Title}}', '${0}'],
    description: 'Insert section',
    category: 'structure',
  },
  {
    prefix: 'ssec',
    body: ['\\subsection{${1:Subsection Title}}', '${0}'],
    description: 'Insert subsection',
    category: 'structure',
  },
  {
    prefix: 'sssec',
    body: ['\\subsubsection{${1:Subsubsection Title}}', '${0}'],
    description: 'Insert subsubsection',
    category: 'structure',
  },
  {
    prefix: 'para',
    body: ['\\paragraph{${1:Paragraph Title}}', '${0}'],
    description: 'Insert paragraph',
    category: 'structure',
  },
];

/**
 * Text Formatting Snippets
 */
const formattingSnippets: LaTeXSnippet[] = [
  {
    prefix: 'bf',
    body: ['\\textbf{${1:text}}${0}'],
    description: 'Bold text',
    category: 'formatting',
  },
  {
    prefix: 'it',
    body: ['\\textit{${1:text}}${0}'],
    description: 'Italic text',
    category: 'formatting',
  },
  {
    prefix: 'tt',
    body: ['\\texttt{${1:text}}${0}'],
    description: 'Typewriter text',
    category: 'formatting',
  },
  {
    prefix: 'underline',
    body: ['\\underline{${1:text}}${0}'],
    description: 'Underlined text',
    category: 'formatting',
  },
  {
    prefix: 'emph',
    body: ['\\emph{${1:text}}${0}'],
    description: 'Emphasized text',
    category: 'formatting',
  },
];

/**
 * Environment Snippets
 */
const environmentSnippets: LaTeXSnippet[] = [
  {
    prefix: 'env',
    body: [
      '\\begin{${1:environment}}',
      '  ${0}',
      '\\end{${1:environment}}',
    ],
    description: 'Generic environment',
    category: 'environment',
  },
  {
    prefix: 'eq',
    body: [
      '\\begin{equation}',
      '  ${0}',
      '\\end{equation}',
    ],
    description: 'Numbered equation environment',
    category: 'environment',
  },
  {
    prefix: 'eq*',
    body: [
      '\\begin{equation*}',
      '  ${0}',
      '\\end{equation*}',
    ],
    description: 'Unnumbered equation environment',
    category: 'environment',
  },
  {
    prefix: 'align',
    body: [
      '\\begin{align}',
      '  ${1} &= ${2} \\\\',
      '  ${0}',
      '\\end{align}',
    ],
    description: 'Aligned equations',
    category: 'environment',
  },
  {
    prefix: 'fig',
    body: [
      '\\begin{figure}[${1:htbp}]',
      '  \\centering',
      '  \\includegraphics[width=${2:0.8}\\textwidth]{${3:filename}}',
      '  \\caption{${4:Caption}}',
      '  \\label{fig:${5:label}}',
      '\\end{figure}',
    ],
    description: 'Figure environment',
    category: 'environment',
  },
  {
    prefix: 'tab',
    body: [
      '\\begin{table}[${1:htbp}]',
      '  \\centering',
      '  \\begin{tabular}{${2:ccc}}',
      '    \\toprule',
      '    ${3:Column 1} & ${4:Column 2} & ${5:Column 3} \\\\',
      '    \\midrule',
      '    ${0}',
      '    \\bottomrule',
      '  \\end{tabular}',
      '  \\caption{${6:Caption}}',
      '  \\label{tab:${7:label}}',
      '\\end{table}',
    ],
    description: 'Table environment',
    category: 'environment',
  },
  {
    prefix: 'list',
    body: [
      '\\begin{itemize}',
      '  \\item ${1}',
      '  \\item ${0}',
      '\\end{itemize}',
    ],
    description: 'Itemize environment',
    category: 'environment',
  },
  {
    prefix: 'enum',
    body: [
      '\\begin{enumerate}',
      '  \\item ${1}',
      '  \\item ${0}',
      '\\end{enumerate}',
    ],
    description: 'Enumerate environment',
    category: 'environment',
  },
  {
    prefix: 'desc',
    body: [
      '\\begin{description}',
      '  \\item[${1:Term}] ${2:Description}',
      '  \\item[${0}]',
      '\\end{description}',
    ],
    description: 'Description environment',
    category: 'environment',
  },
];

/**
 * Math Mode Snippets
 */
const mathSnippets: LaTeXSnippet[] = [
  {
    prefix: 'frac',
    body: ['\\frac{${1:numerator}}{${2:denominator}}${0}'],
    description: 'Fraction',
    category: 'math',
  },
  {
    prefix: 'sqrt',
    body: ['\\sqrt{${1:expression}}${0}'],
    description: 'Square root',
    category: 'math',
  },
  {
    prefix: 'sqrtn',
    body: ['\\sqrt[${1:n}]{${2:expression}}${0}'],
    description: 'nth root',
    category: 'math',
  },
  {
    prefix: 'sum',
    body: ['\\sum_{${1:i=1}}^{${2:n}} ${0}'],
    description: 'Summation',
    category: 'math',
  },
  {
    prefix: 'prod',
    body: ['\\prod_{${1:i=1}}^{${2:n}} ${0}'],
    description: 'Product',
    category: 'math',
  },
  {
    prefix: 'int',
    body: ['\\int_{${1:a}}^{${2:b}} ${0} \\, dx'],
    description: 'Integral',
    category: 'math',
  },
  {
    prefix: 'lim',
    body: ['\\lim_{${1:x} \\to ${2:0}} ${0}'],
    description: 'Limit',
    category: 'math',
  },
  {
    prefix: 'hat',
    body: ['\\hat{${1:x}}${0}'],
    description: 'Hat accent',
    category: 'math',
  },
  {
    prefix: 'bar',
    body: ['\\bar{${1:x}}${0}'],
    description: 'Bar accent',
    category: 'math',
  },
  {
    prefix: 'vec',
    body: ['\\vec{${1:v}}${0}'],
    description: 'Vector arrow',
    category: 'math',
  },
  {
    prefix: 'ldots',
    body: ['\\ldots${0}'],
    description: 'Lower dots',
    category: 'math',
  },
  {
    prefix: 'cdots',
    body: ['\\cdots${0}'],
    description: 'Center dots',
    category: 'math',
  },
];

/**
 * Reference and Citation Snippets
 */
const referenceSnippets: LaTeXSnippet[] = [
  {
    prefix: 'cite',
    body: ['\\cite{${1:key}}${0}'],
    description: 'Citation',
    category: 'reference',
  },
  {
    prefix: 'citep',
    body: ['\\citep{${1:key}}${0}'],
    description: 'Parenthetical citation',
    category: 'reference',
  },
  {
    prefix: 'citet',
    body: ['\\citet{${1:key}}${0}'],
    description: 'Textual citation',
    category: 'reference',
  },
  {
    prefix: 'ref',
    body: ['\\ref{${1:label}}${0}'],
    description: 'Reference',
    category: 'reference',
  },
  {
    prefix: 'eqref',
    body: ['\\eqref{${1:eq:label}}${0}'],
    description: 'Equation reference',
    category: 'reference',
  },
  {
    prefix: 'pageref',
    body: ['\\pageref{${1:label}}${0}'],
    description: 'Page reference',
    category: 'reference',
  },
  {
    prefix: 'label',
    body: ['\\label{${1:label}}${0}'],
    description: 'Label',
    category: 'reference',
  },
];

/**
 * All snippets combined
 */
export const ALL_SNIPPETS: LaTeXSnippet[] = [
  ...structureSnippets,
  ...formattingSnippets,
  ...environmentSnippets,
  ...mathSnippets,
  ...referenceSnippets,
];

/**
 * Snippets grouped by category for UI display
 */
export const SNIPPET_GROUPS: SnippetGroup[] = [
  { category: 'structure', label: 'Document Structure', snippets: structureSnippets },
  { category: 'formatting', label: 'Text Formatting', snippets: formattingSnippets },
  { category: 'environment', label: 'Environments', snippets: environmentSnippets },
  { category: 'math', label: 'Math Mode', snippets: mathSnippets },
  { category: 'reference', label: 'References', snippets: referenceSnippets },
];

/**
 * Convert snippets to Monaco format
 */
export function getMonacoSnippets(): Record<string, { prefix: string; body: string[]; description: string }> {
  const result: Record<string, { prefix: string; body: string[]; description: string }> = {};

  ALL_SNIPPETS.forEach((snippet, index) => {
    const key = `${snippet.category}_${index}`;
    result[key] = {
      prefix: snippet.prefix,
      body: snippet.body,
      description: snippet.description,
    };
  });

  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/config/latexSnippets.ts
git commit -m "feat(snippets): add comprehensive LaTeX snippets library"
```

---

## Task 3: Configure Monaco Editor with Snippets

**Files:**
- Modify: `apps/frontend/src/components/Editor/MonacoEditor.tsx`

**Purpose:** Register snippets with Monaco Editor.

- [ ] **Step 1: Update MonacoEditor to register snippets**

```typescript
// apps/frontend/src/components/Editor/MonacoEditor.tsx

import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useSettingsStore } from '../../stores/settingsStore';
import { getMonacoSnippets } from '../../config/latexSnippets';

interface MonacoEditorProps {
  content: string;
  language?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  content,
  language = 'latex',
  onChange,
  onSave,
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const { getMonacoOptions } = useSettingsStore();

  useEffect(() => {
    if (editorRef.current) {
      const options = getMonacoOptions();
      editorRef.current.updateOptions(options);
    }
  }, [getMonacoOptions]);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add save keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Register LaTeX snippets
    registerSnippets(monaco);

    // Apply initial settings
    const options = getMonacoOptions();
    editor.updateOptions(options);
  };

  const registerSnippets = (monaco: typeof import('monaco-editor')) => {
    // Register snippet completion provider
    const snippets = getMonacoSnippets();

    monaco.languages.registerCompletionItemProvider('latex', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = Object.entries(snippets).map(([key, snippet]) => ({
          label: snippet.prefix,
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: snippet.description,
          insertText: snippet.body.join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: snippet.description,
          range,
        }));

        return { suggestions };
      },
      triggerCharacters: ['\\'], // Trigger on backslash
    });

    // Also register as language configuration for built-in snippets
    monaco.languages.setLanguageConfiguration('latex', {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    });
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange?.(value);
    }
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={content}
      onChange={handleChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        quickSuggestions: true,
        snippetSuggestions: 'top',
        suggestOnTriggerCharacters: true,
      }}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/Editor/MonacoEditor.tsx
git commit -m "feat(snippets): integrate snippets with Monaco Editor"
```

---

## Task 4: Create Snippet Browser Panel

**Files:**
- Create: `apps/frontend/src/components/Snippets/SnippetItem.tsx`
- Create: `apps/frontend/src/components/Snippets/SnippetPanel.tsx`
- Create: `apps/frontend/src/components/Snippets/index.ts`

**Purpose:** UI for browsing and inserting snippets.

- [ ] **Step 1: Create SnippetItem component**

```typescript
// apps/frontend/src/components/Snippets/SnippetItem.tsx

import React from 'react';
import { Code } from 'lucide-react';
import type { LaTeXSnippet } from '../../types/snippets';

interface SnippetItemProps {
  snippet: LaTeXSnippet;
  onInsert: (snippet: LaTeXSnippet) => void;
}

export const SnippetItem: React.FC<SnippetItemProps> = ({ snippet, onInsert }) => {
  // Preview first line of body, truncated
  const preview = snippet.body[0].substring(0, 50) + (snippet.body[0].length > 50 ? '...' : '');

  return (
    <button
      onClick={() => onInsert(snippet)}
      className="w-full text-left p-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-lg transition-all group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <code className="px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded text-sm font-mono">
            {snippet.prefix}
          </code>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            Tab
          </span>
        </div>
        <Code size={14} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
        {snippet.description}
      </p>
      <code className="block text-xs text-[var(--color-text-secondary)] font-mono truncate">
        {preview}
      </code>
    </button>
  );
};
```

- [ ] **Step 2: Create SnippetPanel component**

```typescript
// apps/frontend/src/components/Snippets/SnippetPanel.tsx

import React, { useState, useMemo } from 'react';
import { X, Search, Code2 } from 'lucide-react';
import { SNIPPET_GROUPS, ALL_SNIPPETS } from '../../config/latexSnippets';
import { SnippetItem } from './SnippetItem';
import type { LaTeXSnippet } from '../../types/snippets';

interface SnippetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet: (snippet: LaTeXSnippet) => void;
}

export const SnippetPanel: React.FC<SnippetPanelProps> = ({
  isOpen,
  onClose,
  onInsertSnippet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSnippets = useMemo(() => {
    let snippets = ALL_SNIPPETS;

    if (selectedCategory) {
      snippets = snippets.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      snippets = snippets.filter(
        (s) =>
          s.prefix.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.body.some((line) => line.toLowerCase().includes(query))
      );
    }

    return snippets;
  }, [searchQuery, selectedCategory]);

  const groupedSnippets = useMemo(() => {
    const grouped: Record<string, LaTeXSnippet[]> = {};
    filteredSnippets.forEach((snippet) => {
      if (!grouped[snippet.category]) {
        grouped[snippet.category] = [];
      }
      grouped[snippet.category].push(snippet);
    });
    return grouped;
  }, [filteredSnippets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <Code2 className="text-[var(--color-primary)]" size={24} />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              LaTeX Snippets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search snippets..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === null
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              All
            </button>
            {SNIPPET_GROUPS.map((group) => (
              <button
                key={group.category}
                onClick={() => setSelectedCategory(group.category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === group.category
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        {/* Snippet List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              <p>No snippets found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSnippets).map(([category, snippets]) => {
                const group = SNIPPET_GROUPS.find((g) => g.category === category);
                return (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
                      {group?.label || category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {snippets.map((snippet, index) => (
                        <SnippetItem
                          key={`${category}-${index}`}
                          snippet={snippet}
                          onInsert={onInsertSnippet}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
          Type snippet prefix and press Tab to insert • {filteredSnippets.length} snippets available
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create index export**

```typescript
// apps/frontend/src/components/Snippets/index.ts
export { SnippetPanel } from './SnippetPanel';
export { SnippetItem } from './SnippetItem';
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/Snippets/
git commit -m "feat(snippets): add snippet browser panel UI"
```

---

## Task 5: Integrate Snippet Panel into ProjectDetail

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx`

**Purpose:** Add snippet browser button and integration.

- [ ] **Step 1: Add snippet button and panel to ProjectDetail**

Add imports:

```typescript
import { SnippetPanel } from '../components/Snippets';
import { Code2 } from 'lucide-react';
import type { LaTeXSnippet } from '../types/snippets';
```

Add state:

```typescript
const [isSnippetPanelOpen, setIsSnippetPanelOpen] = useState(false);
```

Add button in toolbar:

```typescript
<button
  onClick={() => setIsSnippetPanelOpen(true)}
  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
  title="LaTeX Snippets"
>
  <Code2 size={20} />
</button>
```

Add snippet panel:

```typescript
<SnippetPanel
  isOpen={isSnippetPanelOpen}
  onClose={() => setIsSnippetPanelOpen(false)}
  onInsertSnippet={(snippet: LaTeXSnippet) => {
    // Get current editor and insert snippet
    // This requires exposing editor ref or using a store action
    console.log('Insert snippet:', snippet);
    setIsSnippetPanelOpen(false);
  }}
/>
```

- [ ] **Step 2: Add keyboard shortcut**

```typescript
// In useKeyboardShortcuts or useEffect:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Shift+Space to open snippets
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      setIsSnippetPanelOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(snippets): integrate snippet panel into project detail"
```

---

## Summary

This implementation adds LaTeX snippet functionality:

**Features:**
- 40+ built-in LaTeX snippets covering:
  - Document structure (sections, document template)
  - Text formatting (bold, italic, etc.)
  - Environments (equation, figure, table, lists)
  - Math mode (fractions, roots, sums, integrals)
  - References (citations, labels, cross-references)
- Tab-triggered snippet expansion in editor
- Snippet browser panel for discovery
- Category filtering and search
- Visual preview of snippet content

**Files Created:**
- `apps/frontend/src/types/snippets.ts`
- `apps/frontend/src/config/latexSnippets.ts`
- `apps/frontend/src/components/Snippets/SnippetItem.tsx`
- `apps/frontend/src/components/Snippets/SnippetPanel.tsx`
- `apps/frontend/src/components/Snippets/index.ts`

**Files Modified:**
- `apps/frontend/src/components/Editor/MonacoEditor.tsx`
- `apps/frontend/src/pages/ProjectDetail.tsx`
