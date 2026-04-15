# LaTeX Syntax Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive LaTeX syntax highlighting with 6 curated color themes to the Monaco Editor

**Architecture:** Use Monaco's native Monarch tokenizer for real-time LaTeX token recognition. Define 6 color themes programmatically via Monaco's `defineTheme()` API. Store theme preference in Zustand settings store.

**Tech Stack:** React 18, Monaco Editor, Zustand, TypeScript, Tailwind CSS

---

## Task 1: Create Types for Syntax Theme

**Files:**
- Modify: `apps/frontend/src/types/settings.ts`

- [ ] **Step 1: Add SyntaxThemeId type and update EditorSettings**

Add to `apps/frontend/src/types/settings.ts`:

```typescript
// Add after imports
export type SyntaxThemeId = 
  | 'latex-light' 
  | 'latex-dark' 
  | 'dracula' 
  | 'solarized-dark' 
  | 'one-dark' 
  | 'github-light';

// Add to EditorSettings interface
export interface EditorSettings {
  // ... existing fields
  syntaxTheme: SyntaxThemeId;
}

// Update DEFAULT_SETTINGS
export const DEFAULT_SETTINGS: Settings = {
  editor: {
    // ... existing settings
    syntaxTheme: 'latex-light',
  },
  // ... rest unchanged
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/types/settings.ts
git commit -m "feat(types): add SyntaxThemeId type and syntaxTheme setting"
```

---

## Task 2: Create Tokenizer Module

**Files:**
- Create: `apps/frontend/src/editor/latexTokenizer.ts`

- [ ] **Step 1: Create tokenizer file with complete Monarch rules**

```typescript
import type * as monaco from 'monaco-editor';

/**
 * LaTeX language configuration for Monaco Editor
 */
export const latexLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '%',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

/**
 * Monarch tokenizer for LaTeX syntax highlighting
 */
export const latexTokenizer: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.latex',

  tokenizer: {
    root: [
      // Comments: % to end of line
      [/%.*$/, 'comment'],

      // Display math: $$...$$
      [/\$\$/, { token: 'string', next: '@mathDisplay' }],

      // Inline math: $...$
      [/\$/, { token: 'string', next: '@mathInline' }],

      // Environment names after \begin{ or \end{
      [/(\\(?:begin|end))(\{)([a-zA-Z@*]+)(\})/, 
        ['keyword', 'delimiter.bracket', 'tag', 'delimiter.bracket']],

      // Control sequences with brackets: \command[opt]{arg}
      [/(\\[a-zA-Z@]+)(\*?)(?:(\[))/, {
        cases: {
          '$1': ['keyword', 'keyword', { token: 'delimiter.bracket', next: '@optArg' }],
        }
      }],

      // Control sequences: \command
      [/\\[a-zA-Z@]+\*?/, 'keyword'],

      // Special characters
      [/[&\\#^_{}~$]/, 'operator'],

      // Parameters: #1, #2, etc.
      [/#\d+/, 'variable.parameter'],

      // Numbers with units
      [/-?\d+\.?\d*(?:cm|mm|pt|em|ex|sp|bp|dd|pc|in|px|%)?/, 'number'],

      // Strings in quotes
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],

      // Brackets
      [/[{}]/, 'delimiter.bracket'],
      [/[\[\]]/, 'delimiter.bracket'],
    ],

    mathInline: [
      [/\$/, { token: 'string', next: '@pop' }],
      [/\\./, 'operator'],
      [/[^\\$]+/, 'string'],
    ],

    mathDisplay: [
      [/\$\$/, { token: 'string', next: '@pop' }],
      [/\\./, 'operator'],
      [/[^\\$]+/, 'string'],
    ],

    optArg: [
      [/\]/, { token: 'delimiter.bracket', next: '@pop' }],
      [/[^\]]+/, 'string'],
    ],
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/editor/latexTokenizer.ts
git commit -m "feat(editor): add LaTeX Monarch tokenizer"
```

---

## Task 3: Create Themes Module

**Files:**
- Create: `apps/frontend/src/editor/latexThemes.ts`

- [ ] **Step 1: Create theme definitions**

```typescript
import type * as monaco from 'monaco-editor';

export interface SyntaxTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: monaco.editor.IColors;
  rules: monaco.editor.ITokenThemeRule[];
}

// LaTeX Light Theme (Default)
export const latexLightTheme: SyntaxTheme = {
  id: 'latex-light',
  name: 'LaTeX Light',
  isDark: false,
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#2C2C2C',
    'editor.lineHighlightBackground': '#F5F5F5',
    'editor.selectionBackground': '#ADD6FF',
    'editor.inactiveSelectionBackground': '#E5EBF1',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#2C2C2C',
    'editorCursor.foreground': '#2C2C2C',
    'editorWhitespace.foreground': '#CCCCCC',
  },
  rules: [
    { token: 'comment', foreground: '#008000', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#0000FF', fontStyle: 'bold' },
    { token: 'tag', foreground: '#795E26' },
    { token: 'string', foreground: '#A31515' },
    { token: 'operator', foreground: '#000000', fontStyle: 'bold' },
    { token: 'number', foreground: '#098658' },
    { token: 'variable.parameter', foreground: '#001080' },
    { token: 'delimiter.bracket', foreground: '#0431FA' },
  ],
};

// LaTeX Dark Theme
export const latexDarkTheme: SyntaxTheme = {
  id: 'latex-dark',
  name: 'LaTeX Dark',
  isDark: true,
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#2D2D2D',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#D4D4D4',
    'editorCursor.foreground': '#D4D4D4',
    'editorWhitespace.foreground': '#3E3E3E',
  },
  rules: [
    { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#569CD6', fontStyle: 'bold' },
    { token: 'tag', foreground: '#4EC9B0' },
    { token: 'string', foreground: '#CE9178' },
    { token: 'operator', foreground: '#D4D4D4', fontStyle: 'bold' },
    { token: 'number', foreground: '#B5CEA8' },
    { token: 'variable.parameter', foreground: '#9CDCFE' },
    { token: 'delimiter.bracket', foreground: '#FFD700' },
  ],
};

// Dracula Theme
export const draculaTheme: SyntaxTheme = {
  id: 'dracula',
  name: 'Dracula',
  isDark: true,
  colors: {
    'editor.background': '#282A36',
    'editor.foreground': '#F8F8F2',
    'editor.lineHighlightBackground': '#44475A',
    'editor.selectionBackground': '#44475A',
    'editor.inactiveSelectionBackground': '#44475A',
    'editorLineNumber.foreground': '#6272A4',
    'editorLineNumber.activeForeground': '#F8F8F2',
    'editorCursor.foreground': '#F8F8F2',
    'editorWhitespace.foreground': '#44475A',
  },
  rules: [
    { token: 'comment', foreground: '#6272A4', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#FF79C6', fontStyle: 'bold' },
    { token: 'tag', foreground: '#8BE9FD' },
    { token: 'string', foreground: '#F1FA8C' },
    { token: 'operator', foreground: '#FF79C6' },
    { token: 'number', foreground: '#BD93F9' },
    { token: 'variable.parameter', foreground: '#FFB86C' },
    { token: 'delimiter.bracket', foreground: '#F8F8F2' },
  ],
};

// Solarized Dark Theme
export const solarizedDarkTheme: SyntaxTheme = {
  id: 'solarized-dark',
  name: 'Solarized Dark',
  isDark: true,
  colors: {
    'editor.background': '#002B36',
    'editor.foreground': '#839496',
    'editor.lineHighlightBackground': '#073642',
    'editor.selectionBackground': '#073642',
    'editor.inactiveSelectionBackground': '#073642',
    'editorLineNumber.foreground': '#586E75',
    'editorLineNumber.activeForeground': '#839496',
    'editorCursor.foreground': '#839496',
    'editorWhitespace.foreground': '#073642',
  },
  rules: [
    { token: 'comment', foreground: '#586E75', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#268BD2', fontStyle: 'bold' },
    { token: 'tag', foreground: '#B58900' },
    { token: 'string', foreground: '#2AA198' },
    { token: 'operator', foreground: '#DC322F' },
    { token: 'number', foreground: '#D33682' },
    { token: 'variable.parameter', foreground: '#CB4B16' },
    { token: 'delimiter.bracket', foreground: '#93A1A1' },
  ],
};

// One Dark Theme (Atom)
export const oneDarkTheme: SyntaxTheme = {
  id: 'one-dark',
  name: 'One Dark',
  isDark: true,
  colors: {
    'editor.background': '#282C34',
    'editor.foreground': '#ABB2BF',
    'editor.lineHighlightBackground': '#2C313C',
    'editor.selectionBackground': '#3E4451',
    'editor.inactiveSelectionBackground': '#3E4451',
    'editorLineNumber.foreground': '#4B5363',
    'editorLineNumber.activeForeground': '#ABB2BF',
    'editorCursor.foreground': '#528BFF',
    'editorWhitespace.foreground': '#3E4451',
  },
  rules: [
    { token: 'comment', foreground: '#5C6370', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#C678DD', fontStyle: 'bold' },
    { token: 'tag', foreground: '#E06C75' },
    { token: 'string', foreground: '#98C379' },
    { token: 'operator', foreground: '#56B6C2' },
    { token: 'number', foreground: '#D19A66' },
    { token: 'variable.parameter', foreground: '#E5C07B' },
    { token: 'delimiter.bracket', foreground: '#ABB2BF' },
  ],
};

// GitHub Light Theme
export const githubLightTheme: SyntaxTheme = {
  id: 'github-light',
  name: 'GitHub Light',
  isDark: false,
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#24292E',
    'editor.lineHighlightBackground': '#F6F8FA',
    'editor.selectionBackground': '#B4D7FF',
    'editor.inactiveSelectionBackground': '#E1E4E8',
    'editorLineNumber.foreground': '#6A737D',
    'editorLineNumber.activeForeground': '#24292E',
    'editorCursor.foreground': '#24292E',
    'editorWhitespace.foreground': '#E1E4E8',
  },
  rules: [
    { token: 'comment', foreground: '#6A737D', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#D73A49', fontStyle: 'bold' },
    { token: 'tag', foreground: '#22863A' },
    { token: 'string', foreground: '#032F62' },
    { token: 'operator', foreground: '#D73A49' },
    { token: 'number', foreground: '#005CC5' },
    { token: 'variable.parameter', foreground: '#E36209' },
    { token: 'delimiter.bracket', foreground: '#24292E' },
  ],
};

// Export all themes
export const SYNTAX_THEMES: SyntaxTheme[] = [
  latexLightTheme,
  latexDarkTheme,
  draculaTheme,
  solarizedDarkTheme,
  oneDarkTheme,
  githubLightTheme,
];

// Helper to get theme by ID
export function getThemeById(id: string): SyntaxTheme | undefined {
  return SYNTAX_THEMES.find(theme => theme.id === id);
}

// Helper to register all themes with Monaco
export function registerThemes(monaco: typeof import('monaco-editor')): void {
  SYNTAX_THEMES.forEach(theme => {
    monaco.editor.defineTheme(theme.id, {
      base: theme.isDark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: theme.rules,
      colors: theme.colors,
    });
  });
}
```

- [ ] **Step 2: Create barrel export file**

Create `apps/frontend/src/editor/index.ts`:

```typescript
export { latexLanguageConfig, latexTokenizer } from './latexTokenizer';
export {
  type SyntaxTheme,
  latexLightTheme,
  latexDarkTheme,
  draculaTheme,
  solarizedDarkTheme,
  oneDarkTheme,
  githubLightTheme,
  SYNTAX_THEMES,
  getThemeById,
  registerThemes,
} from './latexThemes';
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/editor/
git commit -m "feat(editor): add 6 LaTeX syntax themes"
```

---

## Task 4: Update Settings Store

**Files:**
- Modify: `apps/frontend/src/stores/settingsStore.ts`

- [ ] **Step 1: Add syntax theme methods to store**

Add import at top:
```typescript
import type { SyntaxThemeId } from '../types/settings';
```

Update the interface and store:

```typescript
interface SettingsState extends Settings {
  // ... existing methods
  updateSyntaxTheme: (theme: SyntaxThemeId) => void;
  getCurrentSyntaxTheme: () => SyntaxThemeId;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      // ... existing methods

      updateSyntaxTheme: (theme) =>
        set((state) => ({
          editor: { ...state.editor, syntaxTheme: theme },
        })),

      getCurrentSyntaxTheme: () => get().editor.syntaxTheme,
    }),
    // ... rest unchanged
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/stores/settingsStore.ts
git commit -m "feat(settings): add syntax theme state management"
```

---

## Task 5: Update Monaco Editor Component

**Files:**
- Modify: `apps/frontend/src/components/Editor/MonacoEditor.tsx`

- [ ] **Step 1: Add imports and integrate tokenizer**

Add imports:
```typescript
import { latexLanguageConfig, latexTokenizer } from '../../editor/latexTokenizer';
import { registerThemes } from '../../editor/latexThemes';
```

- [ ] **Step 2: Register tokenizer and themes on mount**

Update the `handleEditorDidMount` callback:

```typescript
const handleEditorDidMount: OnMount = useCallback(
  (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register LaTeX language
    monaco.languages.register({ id: 'latex' });

    // Set language configuration
    monaco.languages.setLanguageConfiguration('latex', latexLanguageConfig);

    // Set Monarch tokenizer
    monaco.languages.setMonarchTokensProvider('latex', latexTokenizer);

    // Register all syntax themes
    registerThemes(monaco);

    // Apply current theme
    const currentTheme = useSettingsStore.getState().getCurrentSyntaxTheme();
    monaco.editor.setTheme(currentTheme);

    // Update editor options
    editor.updateOptions(getMonacoOptions());

    // Add save keyboard shortcut (Ctrl/Cmd + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Focus the editor
    editor.focus();
  },
  [onSave, getMonacoOptions],
);
```

- [ ] **Step 3: Listen for theme changes**

Add theme change listener in a new useEffect:

```typescript
// Listen for syntax theme changes
useEffect(() => {
  const unsubscribe = useSettingsStore.subscribe(
    (state) => state.editor.syntaxTheme,
    (theme) => {
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(theme);
      }
    }
  );

  return () => unsubscribe();
}, []);
```

- [ ] **Step 4: Update theme prop**

Change the Editor component's theme prop from hardcoded "vs" to dynamic:

```typescript
<Editor
  // ... other props
  theme={useSettingsStore.getState().getCurrentSyntaxTheme()}
  // ... rest
/>
```

Actually, better to read from store:

```typescript
const syntaxTheme = useSettingsStore((state) => state.editor.syntaxTheme);

// Then in JSX:
<Editor
  // ... other props
  theme={syntaxTheme}
  // ... rest
/>
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/Editor/MonacoEditor.tsx
git commit -m "feat(editor): integrate LaTeX tokenizer and themes"
```

---

## Task 6: Add Theme Selector UI

**Files:**
- Modify: `apps/frontend/src/components/Settings/EditorSettings.tsx`

- [ ] **Step 1: Add imports and theme selector**

Add imports:
```typescript
import { SYNTAX_THEMES } from '../../editor/latexThemes';
import type { SyntaxThemeId } from '../../types/settings';
```

- [ ] **Step 2: Add theme selector section**

Add new section after "Font" section (around line 75):

```typescript
<SettingsSection
  title="Syntax Theme"
  description="Choose a color theme for LaTeX syntax highlighting"
>
  <SettingItem>
    <SelectSetting
      label="Theme"
      value={editor.syntaxTheme}
      options={SYNTAX_THEMES.map(theme => ({
        value: theme.id,
        label: theme.name,
      }))}
      onChange={(theme) =>
        updateEditorSettings({ syntaxTheme: theme as SyntaxThemeId })
      }
      description="Select your preferred syntax highlighting colors"
    />
  </SettingItem>
</SettingsSection>
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/Settings/EditorSettings.tsx
git commit -m "feat(settings): add syntax theme selector UI"
```

---

## Task 7: Test the Implementation

- [ ] **Step 1: Start the development server**

```bash
pnpm dev
```

Verify:
- Frontend starts on http://localhost:3000
- Backend starts on http://localhost:3001

- [ ] **Step 2: Create a test LaTeX file**

Create a project and add a .tex file with this content to test all token types:

```latex
\documentclass[12pt]{article}
\usepackage{amsmath}

% This is a comment
\title{Test Document}
\author{Author Name}

\begin{document}
\maketitle

\section{Introduction}
This is regular text with some \textbf{bold} and \textit{italic} formatting.

\subsection{Math Mode}
Inline math: $E = mc^2$

Display math:
\[
  \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
\]

\begin{equation}
  a^2 + b^2 = c^2
\end{equation}

\section{Special Characters}
Ampersand: & \\ 
Hash: #1, #2
Caret: x^2
Underscore: x_i

\end{document}
```

- [ ] **Step 3: Verify syntax highlighting**

Check that these appear in different colors:
- Comments (green/gray, italic)
- Commands like `\documentclass`, `\section` (blue/purple, bold)
- Environment names like `document`, `equation` (distinct color)
- Math mode content (string color)
- Special characters like `&`, `\\`, `#`, `^`, `_` (operator color)
- Braces `{ }` (bracket color)
- Numbers like `12pt` (number color)

- [ ] **Step 4: Test theme switching**

1. Open Settings (gear icon or similar)
2. Go to Editor Settings
3. Change "Syntax Theme" dropdown through all 6 options
4. Verify theme changes immediately in the editor
5. Refresh the page and verify theme persists

- [ ] **Step 5: Run type checking**

```bash
pnpm typecheck
```

Expected: No errors

- [ ] **Step 6: Run linter**

```bash
pnpm lint
```

Expected: No errors

- [ ] **Step 7: Commit test verification**

```bash
git commit -m "test: verify LaTeX syntax highlighting works correctly"
```

---

## Task 8: Final Review and Merge Preparation

- [ ] **Step 1: Review all changes**

```bash
git log --oneline feature/latex-syntax-highlighting
```

Expected commits:
1. feat(types): add SyntaxThemeId type and syntaxTheme setting
2. feat(editor): add LaTeX Monarch tokenizer
3. feat(editor): add 6 LaTeX syntax themes
4. feat(settings): add syntax theme state management
5. feat(editor): integrate LaTeX tokenizer and themes
6. feat(settings): add syntax theme selector UI
7. test: verify LaTeX syntax highlighting works correctly

- [ ] **Step 2: Verify no build errors**

```bash
pnpm build
```

Expected: Build completes successfully

- [ ] **Step 3: Final commit if needed**

If any fixes were needed:
```bash
git add .
git commit -m "fix: address review feedback"
```

---

## Summary of Changes

### New Files Created
- `apps/frontend/src/editor/latexTokenizer.ts` - Monarch tokenizer rules
- `apps/frontend/src/editor/latexThemes.ts` - 6 theme definitions
- `apps/frontend/src/editor/index.ts` - Barrel export

### Files Modified
- `apps/frontend/src/types/settings.ts` - Added SyntaxThemeId type and setting
- `apps/frontend/src/stores/settingsStore.ts` - Added theme state management
- `apps/frontend/src/components/Editor/MonacoEditor.tsx` - Integrated tokenizer & themes
- `apps/frontend/src/components/Settings/EditorSettings.tsx` - Added theme selector

### Features Delivered
- Comprehensive LaTeX syntax highlighting (commands, comments, math, environments, operators)
- 6 curated color themes: LaTeX Light, LaTeX Dark, Dracula, Solarized Dark, One Dark, GitHub Light
- Theme selector in Editor Settings
- Persistent theme preference across sessions
- Immediate theme switching without page reload
