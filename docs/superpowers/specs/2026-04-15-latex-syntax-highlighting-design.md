# LaTeX Syntax Highlighting with Color Themes

**Date:** April 15, 2026  
**Status:** Approved for Implementation  
**Branch:** `feature/latex-syntax-highlighting`

---

## Overview

Add comprehensive syntax highlighting to the Monaco Editor for LaTeX documents, with 6 curated color themes that users can switch between in the settings panel. This feature will differentiate LaTeX commands, comments, environments, math mode, and other structural elements through color-coded tokens.

---

## Goals

1. Provide immediate visual differentiation between LaTeX commands, text content, comments, and math expressions
2. Offer 6 professionally curated color themes suitable for extended editing sessions
3. Integrate seamlessly with existing settings system
4. Maintain editor performance with native Monaco tokenization
5. Persist theme preference across sessions

---

## Token Categories

The syntax highlighter will recognize and color the following LaTeX token types:

| Token Type | Examples | Token ID | Description |
|------------|----------|----------|-------------|
| **Control Sequence** | `\section`, `\usepackage`, `\textbf` | `keyword` | Backslash commands |
| **Environment Keywords** | `\begin`, `\end` | `keyword` | Environment delimiters |
| **Environment Names** | `document`, `equation`, `itemize` | `tag` | Environment identifiers |
| **Comments** | `% this is a comment` | `comment` | Line comments |
| **Math Mode Inline** | `$...$`, `\(...\)` | `string` | Inline math expressions |
| **Math Mode Display** | `$$...$$`, `\[...\]` | `string` | Display math expressions |
| **Braces Curly** | `{ }` | `delimiter.bracket` | Curly braces |
| **Braces Square** | `[ ]` | `delimiter.bracket` | Square brackets |
| **Special Characters** | `&`, `\\`, `#`, `^`, `_`, `~` | `operator` | LaTeX special chars |
| **Strings** | `"file.pdf"` | `string` | Quoted strings |
| **Numbers** | `1.5`, `3cm`, `\textwidth` | `number` | Numeric values |
| **Parameters** | `#1`, `#2` | `variable.parameter` | Macro parameters |

---

## Theme Collection

Six curated themes based on popular editor color schemes:

### 1. LaTeX Light (Default)
Clean, high-contrast theme with a white background. Optimized for readability and print compatibility.

### 2. LaTeX Dark
Dark background with vibrant, accessible colors. Reduced eye strain for low-light editing.

### 3. Dracula
Popular purple-tinted dark theme with high contrast and carefully selected accent colors.

### 4. Solarized Dark
Low-contrast theme with scientifically selected colors that reduce eye fatigue during long sessions.

### 5. One Dark
Atom editor's iconic theme with a deep blue-gray background and bright, distinctive token colors.

### 6. GitHub Light
Clean theme matching GitHub's interface colors for a familiar, comfortable editing experience.

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  MonacoEditor.tsx                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Editor Initialization:                         │   │
│  │  1. Import and register LaTeX tokenizer         │   │
│  │  2. Define all 6 color themes via monaco API    │   │
│  │  3. Apply current theme from settings           │   │
│  │  4. Listen for theme changes in settings        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────┐
│               latexTokenizer.ts (NEW)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Monarch Tokenizer Rules:                       │   │
│  │  - root state: commands, comments, math         │   │
│  │  - math state: nested math content              │   │
│  │  - string state: quoted strings                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────┐
│               latexThemes.ts (NEW)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Theme Definitions:                             │   │
│  │  - 6 theme objects with token colors            │   │
│  │  - Editor chrome colors (bg, fg, selection)     │   │
│  │  - Base colors for Monaco integration           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ reads/writes
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  settingsStore.ts                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  New State:                                     │   │
│  │  - syntaxTheme: string (theme ID)               │   │
│  │                                                 │   │
│  │  New Methods:                                   │   │
│  │  - updateSyntaxTheme(themeId)                   │   │
│  │  - getCurrentSyntaxTheme()                      │   │
│  │  - setMonacoTheme() (internal)                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ displays
                           ▼
┌─────────────────────────────────────────────────────────┐
│               EditorSettings.tsx                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  New UI Component:                              │   │
│  │  - Theme selector dropdown                      │   │
│  │  - Shows theme name + preview swatch            │   │
│  │  - Updates store on change                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initialization:** MonacoEditor mounts → registers LaTeX tokenizer → defines all themes → applies current theme from settings
2. **Theme Change:** User selects new theme in settings → settingsStore updates → MonacoEditor receives update → calls `monaco.editor.setTheme()`
3. **Persistence:** Theme preference saved to localStorage via Zustand persist middleware

---

## File Structure

### New Files

```
apps/frontend/src/
├── editor/
│   ├── latexTokenizer.ts      # Monarch tokenizer rules
│   ├── latexThemes.ts         # Theme color definitions
│   └── index.ts               # Barrel export
```

### Modified Files

```
apps/frontend/src/
├── components/Editor/
│   └── MonacoEditor.tsx       # Register tokenizer & themes
├── stores/
│   └── settingsStore.ts       # Add syntaxTheme state
├── types/
│   └── settings.ts            # Add SyntaxTheme type
├── components/Settings/
│   └── EditorSettings.tsx     # Add theme selector UI
```

---

## Implementation Details

### 1. Tokenizer Rules (latexTokenizer.ts)

Using Monaco's Monarch tokenizer format:

```typescript
export const latexLanguageConfig: monaco.languages.LanguageConfiguration = {
  // Bracket matching, auto-closing pairs, etc.
};

export const latexTokenizer: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      // Comments: % to end of line
      [/%.*$/, 'comment'],
      
      // Display math: $$...$$
      [/\$\$/, { token: 'string', next: '@mathDisplay' }],
      
      // Inline math: $...$
      [/\$/, { token: 'string', next: '@mathInline' }],
      
      // Control sequences: \command
      [/(\\[a-zA-Z@]+)/, {
        cases: {
          '\\begin|\\end': 'keyword',
          '\\[a-zA-Z@]+': 'keyword'
        }
      }],
      
      // Environment names after \begin{ or \end{
      [/(\\(?:begin|end)\{)([a-zA-Z@]+)(\})/, 
        ['keyword', 'tag', 'delimiter.bracket']],
      
      // Special characters
      [/[&\\#^_{}~$]/, 'operator'],
      
      // Parameters: #1, #2, etc.
      [/#\d+/, 'variable.parameter'],
      
      // Numbers
      [/-?\d+\.?\d*(?:cm|mm|pt|em|ex|sp|bp|dd|pc|in)?/, 'number'],
      
      // Strings
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
    ],
    
    mathInline: [
      [/\$/, { token: 'string', next: '@pop' }],
      [/[^$\\]+/, 'string'],
      [/[\\&]/, 'operator'],
    ],
    
    mathDisplay: [
      [/\$\$/, { token: 'string', next: '@pop' }],
      [/[^\$\\]+/, 'string'],
      [/[\\&]/, 'operator'],
    ],
  }
};
```

### 2. Theme Definition (latexThemes.ts)

Example theme structure:

```typescript
export interface SyntaxTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    // Editor chrome
    'editor.background': string;
    'editor.foreground': string;
    'editor.lineHighlightBackground': string;
    'editor.selectionBackground': string;
    'editor.inactiveSelectionBackground': string;
    // ... other chrome colors
  };
  rules: Array<{
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
}

export const latexLightTheme: SyntaxTheme = {
  id: 'latex-light',
  name: 'LaTeX Light',
  isDark: false,
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#2C2C2C',
    // ...
  },
  rules: [
    { token: 'comment', foreground: '#008000' },
    { token: 'keyword', foreground: '#0000FF', fontStyle: 'bold' },
    { token: 'tag', foreground: '#795E26' },
    { token: 'string', foreground: '#A31515' },
    { token: 'operator', foreground: '#000000' },
    { token: 'number', foreground: '#098658' },
    { token: 'variable.parameter', foreground: '#001080' },
  ]
};
```

### 3. Settings Integration

**types/settings.ts:**
```typescript
export type SyntaxThemeId = 
  | 'latex-light' 
  | 'latex-dark' 
  | 'dracula' 
  | 'solarized-dark' 
  | 'one-dark' 
  | 'github-light';

export interface EditorSettings {
  // ... existing settings
  syntaxTheme: SyntaxThemeId;
}
```

**settingsStore.ts:**
- Add `syntaxTheme` to state
- Add `updateSyntaxTheme(themeId: SyntaxThemeId)` action
- In `getMonacoOptions()`, return current theme

**EditorSettings.tsx:**
- Add dropdown selector for themes
- Show theme name with color preview
- Call `updateSyntaxTheme()` on change

---

## UI Changes

### EditorSettings Panel

Add new section after "Font":

```
┌─────────────────────────────────────────┐
│ Syntax Theme                            │
│ Configure syntax highlighting colors    │
├─────────────────────────────────────────┤
│ Theme                                   │
│ ┌─────────────────────────────────────┐ │
│ │ LaTeX Light (Default)          ▼    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Theme dropdown shows:
- Theme name
- Small color preview (4-5 colored squares representing token colors)
- "(Default)" indicator for default theme

---

## Performance Considerations

1. **Tokenization:** Monarch tokenizer runs in web worker, non-blocking
2. **Theme Switching:** Instant via `monaco.editor.setTheme()`, no re-tokenization needed
3. **Memory:** Theme definitions are small objects (~5KB total for all 6 themes)
4. **Initial Load:** Tokenizer registration happens once on editor mount

---

## Testing Strategy

1. **Unit Tests:**
   - Test tokenizer rules with sample LaTeX documents
   - Verify all token types are correctly identified
   - Test theme color contrast ratios meet WCAG AA

2. **Integration Tests:**
   - Theme switching updates editor immediately
   - Theme preference persists across sessions
   - Settings UI correctly reflects current theme

3. **Manual Testing:**
   - Verify highlighting on complex documents
   - Test all 6 themes for visual appeal
   - Check performance on large files (>10KB)

---

## Migration Notes

- New setting `syntaxTheme` defaults to `'latex-light'`
- Existing users will automatically get the light theme
- No breaking changes to existing settings

---

## Future Enhancements (Out of Scope)

- Custom theme creation by users
- Import/export VSCode theme files
- Additional themes (Nord, Monokai, etc.)
- Bold/italic font style customization per token type

---

## Acceptance Criteria

- [ ] LaTeX commands appear in a distinct color from regular text
- [ ] Comments appear in a distinct color
- [ ] Math expressions appear in a distinct color
- [ ] 6 themes available in settings dropdown
- [ ] Theme changes apply immediately without reload
- [ ] Theme preference persists across browser sessions
- [ ] All themes have sufficient contrast for readability
- [ ] Performance remains smooth on documents up to 50KB
