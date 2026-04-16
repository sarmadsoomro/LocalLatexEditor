# TexCraft UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign TexCraft UI with consistent colors, cleaner header layout, improved tab bar, and proper branding with copyright

**Architecture:** Update existing React components to use CSS variables consistently, refactor ProjectDetail header into cleaner layout with new compound components, add footer and About section for copyright display

**Tech Stack:** React 18, TypeScript, Tailwind CSS, CSS Variables, Zustand

---

## File Structure

### Files to Modify (11 files)
1. `apps/frontend/src/index.css` - Add error/warning color variables
2. `apps/frontend/src/components/PDFPreview.tsx` - Fix hardcoded colors
3. `apps/frontend/src/components/LogViewer.tsx` - Fix hardcoded colors
4. `apps/frontend/src/components/ResizableSplitPane.tsx` - Fix hardcoded colors
5. `apps/frontend/src/components/Editor/TabBar.tsx` - Fix colors + improve UX
6. `apps/frontend/src/pages/ProjectDetail.tsx` - Refactor header layout
7. `apps/frontend/src/pages/ProjectList.tsx` - Update title + add footer
8. `apps/frontend/src/components/Settings/SettingsModal.tsx` - Add About tab
9. `apps/frontend/index.html` - Update title
10. `apps/frontend/package.json` - Update product name
11. `apps/backend/package.json` - Update name

### Files to Create (4 files)
1. `apps/frontend/src/components/CompileButton.tsx` - New component
2. `apps/frontend/src/components/AutoCompileToggle.tsx` - New component
3. `apps/frontend/src/components/SettingsDropdown.tsx` - New component
4. `apps/frontend/src/components/Settings/AboutSection.tsx` - New component

---

## Phase 1: CSS Variables Setup

### Task 1: Add error/warning color variables to index.css

**Files:**
- Modify: `apps/frontend/src/index.css:183-190`

- [ ] **Step 1: Add missing CSS variables after line 183**

Add these variables inside the `:root` block (before the closing brace):

```css
/* Status colors */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
```

Add these variables inside the `.dark` block (around line 183, after existing dark variables):

```css
--color-success: #34d399;
--color-warning: #fbbf24;
--color-error: #f87171;
```

- [ ] **Step 2: Verify the changes**

Check that the variables are properly nested and syntax is correct.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/index.css
git commit -m "feat: add error/warning/success CSS variables"
```

---

## Phase 2: Color Consistency Fixes

### Task 2: Fix PDFPreview.tsx colors

**Files:**
- Modify: `apps/frontend/src/components/PDFPreview.tsx:33,535,602,672`

- [ ] **Step 1: Fix loading spinner color (line 33)**

Change:
```tsx
className="animate-spin h-8 w-8 text-blue-600"
```
To:
```tsx
className="animate-spin h-8 w-8 text-primary"
```

- [ ] **Step 2: Fix error state colors (line 535)**

Change:
```tsx
className="h-full flex items-center justify-center text-red-500 p-4"
```
To:
```tsx
className="h-full flex items-center justify-center text-error p-4"
```

- [ ] **Step 3: Fix error icon color (line 538)**

Change:
```tsx
className="mx-auto h-12 w-12 text-red-400 mb-2"
```
To:
```tsx
className="mx-auto h-12 w-12 text-error/60 mb-2"
```

- [ ] **Step 4: Fix error text color (line 551)**

Change:
```tsx
<p className="text-sm text-red-400 mt-1">{error}</p>
```
To:
```tsx
<p className="text-sm text-error/70 mt-1">{error}</p>
```

- [ ] **Step 5: Fix error button color (line 553-555)**

Change:
```tsx
<button
  onClick={() => window.open(pdfUrl, "_blank")}
  className="mt-4 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
>
```
To:
```tsx
<button
  onClick={() => window.open(pdfUrl, "_blank")}
  className="mt-4 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors cursor-pointer"
>
```

- [ ] **Step 6: Fix toolbar background (line 602)**

Change:
```tsx
className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-gray-200 gap-4"
```
To:
```tsx
className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border gap-4"
```

- [ ] **Step 7: Fix page input focus color (line 672)**

Change:
```tsx
className="w-10 px-1.5 py-0.5 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
```
To:
```tsx
className="w-10 px-1.5 py-0.5 text-sm text-center border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
```

- [ ] **Step 8: Fix zoom input focus color (line 832)**

Change:
```tsx
className="w-12 px-1.5 py-0.5 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
```
To:
```tsx
className="w-12 px-1.5 py-0.5 text-sm text-center border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
```

- [ ] **Step 9: Fix dropdown background color (line 895)**

Change:
```tsx
className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 min-w-[80px]"
```
To:
```tsx
className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-10 py-1 min-w-[80px]"
```

- [ ] **Step 10: Fix dropdown item hover color (line 903)**

Change:
```tsx
className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-100 ${
  Math.abs(scale - preset.value) < 0.01
    ? "bg-blue-50 text-blue-700"
    : "text-gray-700"
}`}
```
To:
```tsx
className={`w-full px-3 py-1 text-sm text-left hover:bg-surface-hover ${
  Math.abs(scale - preset.value) < 0.01
    ? "bg-primary/10 text-primary"
    : "text-secondary"
}`}
```

- [ ] **Step 11: Fix PDF content background (line 930)**

Change:
```tsx
className="flex-1 overflow-auto bg-gray-200 flex items-start justify-center p-4"
```
To:
```tsx
className="flex-1 overflow-auto bg-background flex items-start justify-center p-4"
```

- [ ] **Step 12: Fix loading spinner color in Document (line 937)**

Change:
```tsx
className="animate-spin h-8 w-8 text-blue-600"
```
To:
```tsx
className="animate-spin h-8 w-8 text-primary"
```

- [ ] **Step 13: Commit the changes**

```bash
git add apps/frontend/src/components/PDFPreview.tsx
git commit -m "fix: use CSS variables for colors in PDFPreview"
```

---

### Task 3: Fix LogViewer.tsx colors

**Files:**
- Modify: `apps/frontend/src/components/LogViewer.tsx:35,37,38,39,43,54,57,63,67,95,104,107,118,122"

- [ ] **Step 1: Fix container background (line 35)**

Change:
```tsx
className="flex flex-col h-full bg-gray-50"
```
To:
```tsx
className="flex flex-col h-full bg-background"
```

- [ ] **Step 2: Fix error section border (line 37)**

Change:
```tsx
className="border-b border-gray-200 bg-red-50 max-h-48 overflow-auto"
```
To:
```tsx
className="border-b border-border bg-error-light max-h-48 overflow-auto"
```

- [ ] **Step 3: Fix error header (line 38)**

Change:
```tsx
className="px-4 py-2 border-b border-red-200 bg-red-100 sticky top-0"
```
To:
```tsx
className="px-4 py-2 border-b border-error/20 bg-error/10 sticky top-0"
```

- [ ] **Step 4: Fix error count text (line 39)**

Change:
```tsx
className="text-sm font-semibold text-red-800"
```
To:
```tsx
className="text-sm font-semibold text-error"
```

- [ ] **Step 5: Fix error item divider (line 43)**

Change:
```tsx
className="divide-y divide-red-100"
```
To:
```tsx
className="divide-y divide-error/10"
```

- [ ] **Step 6: Fix error item hover states (line 48-50)**

Change:
```tsx
className={`
  px-4 py-2 cursor-pointer transition-colors
  ${selectedError === error ? 'bg-red-200' : 'hover:bg-red-100'}
`}
```
To:
```tsx
className={`
  px-4 py-2 cursor-pointer transition-colors
  ${selectedError === error ? 'bg-error/30' : 'hover:bg-error/10'}
`}
```

- [ ] **Step 7: Fix error line badge (line 54)**

Change:
```tsx
className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800"
```
To:
```tsx
className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error text-white"
```

- [ ] **Step 8: Fix error file text (line 57)**

Change:
```tsx
className="text-xs text-red-700 truncate"
```
To:
```tsx
className="text-xs text-error/80 truncate"
```

- [ ] **Step 9: Fix error message text (line 63)**

Change:
```tsx
className="text-sm text-red-800 font-mono"
```
To:
```tsx
className="text-sm text-error font-mono"
```

- [ ] **Step 10: Fix suggestions section (line 67-68)**

Change:
```tsx
<div className="mt-2 pt-2 border-t border-red-200">
  <span className="text-xs font-medium text-red-700">Suggestions:</span>
```
To:
```tsx
<div className="mt-2 pt-2 border-t border-error/20">
  <span className="text-xs font-medium text-error/80">Suggestions:</span>
```

- [ ] **Step 11: Fix suggestion items (line 71)**

Change:
```tsx
className="text-xs text-red-700"
```
To:
```tsx
className="text-xs text-error/80"
```

- [ ] **Step 12: Fix log header border (line 84)**

Change:
```tsx
className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-white"
```
To:
```tsx
className="flex items-center gap-4 px-4 py-2 border-b border-border bg-surface"
```

- [ ] **Step 13: Fix log header text (line 85)**

Change:
```tsx
className="text-sm font-medium text-gray-700"
```
To:
```tsx
className="text-sm font-medium text-heading"
```

- [ ] **Step 14: Fix error count display (line 86)**

Change:
```tsx
className="flex items-center gap-1 text-sm text-red-600"
```
To:
```tsx
className="flex items-center gap-1 text-sm text-error"
```

- [ ] **Step 15: Fix warning count display (line 95)**

Change:
```tsx
className="flex items-center gap-1 text-sm text-yellow-600"
```
To:
```tsx
className="flex items-center gap-1 text-sm text-warning"
```

- [ ] **Step 16: Fix logs container text (line 107)**

Change:
```tsx
className="text-gray-400 text-center py-8"
```
To:
```tsx
className="text-muted text-center py-8"
```

- [ ] **Step 17: Fix log line hover (line 118)**

Change:
```tsx
className="flex items-start py-0.5 px-2 -mx-2 rounded hover:bg-gray-100"
```
To:
```tsx
className="flex items-start py-0.5 px-2 -mx-2 rounded hover:bg-surface-hover"
```

- [ ] **Step 18: Fix log line number color (line 119)**

Change:
```tsx
className="select-none text-gray-400 w-8 text-right mr-3 flex-shrink-0"
```
To:
```tsx
className="select-none text-muted w-8 text-right mr-3 flex-shrink-0"
```

- [ ] **Step 19: Fix log line text color (line 122)**

Change:
```tsx
className="flex-1 whitespace-pre-wrap break-all text-gray-700"
```
To:
```tsx
className="flex-1 whitespace-pre-wrap break-all text-secondary"
```

- [ ] **Step 20: Commit the changes**

```bash
git add apps/frontend/src/components/LogViewer.tsx
git commit -m "fix: use CSS variables for colors in LogViewer"
```

---

### Task 4: Fix ResizableSplitPane.tsx colors

**Files:**
- Modify: `apps/frontend/src/components/ResizableSplitPane.tsx:177,180,205-207`

- [ ] **Step 1: Fix divider colors (lines 177-180)**

Change:
```tsx
className={`
  flex-shrink-0 w-1 bg-gray-200 hover:bg-blue-400
  cursor-col-resize select-none
  transition-colors duration-150
  ${isDragging ? 'bg-blue-500' : ''}
`}
```
To:
```tsx
className={`
  flex-shrink-0 w-1 bg-border hover:bg-primary-light
  cursor-col-resize select-none
  transition-colors duration-150
  ${isDragging ? 'bg-primary' : ''}
`}
```

- [ ] **Step 2: Fix divider handle colors (lines 205-207)**

Change:
```tsx
className={`
  w-1 h-8 rounded-full
  transition-colors duration-150
  ${isDragging ? 'bg-blue-600' : 'bg-gray-400 group-hover:bg-blue-500'}
`}
```
To:
```tsx
className={`
  w-1 h-8 rounded-full
  transition-colors duration-150
  ${isDragging ? 'bg-primary-dark' : 'bg-text-muted group-hover:bg-primary-light'}
`}
```

- [ ] **Step 3: Commit the changes**

```bash
git add apps/frontend/src/components/ResizableSplitPane.tsx
git commit -m "fix: use CSS variables for colors in ResizableSplitPane"
```

---

### Task 5: Fix TabBar.tsx colors and improvements

**Files:**
- Modify: `apps/frontend/src/components/Editor/TabBar.tsx:93,115,121-123,136-146"

- [ ] **Step 1: Fix scroll container background (line 93)**

Change:
```tsx
className={`flex h-11 items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto ${className}`}
```
To:
```tsx
className={`flex h-11 items-center bg-surface border-b border-border overflow-x-auto relative ${className}`}
```

- [ ] **Step 2: Add overflow shadow indicator after line 93**

Add this JSX after the opening `<div` tag and before `{tabs.map(...)}`:

```tsx
{/* Overflow shadow indicator */}
<div 
  className={`
    absolute right-0 top-0 bottom-0 w-8 
    bg-gradient-to-l from-surface to-transparent
    pointer-events-none z-10
    ${tabs.length > 3 ? 'opacity-100' : 'opacity-0'}
    transition-opacity duration-200
  `}
/>
```

- [ ] **Step 3: Fix tab border color (line 115)**

Change:
```tsx
className="group flex items-center gap-2 px-3 py-2 text-sm font-medium border-r border-gray-200 dark:border-gray-700 min-w-0 max-w-[200px]"
```
To:
```tsx
className="group flex items-center gap-2 px-3 py-2 text-sm font-medium border-r border-border min-w-0 max-w-[200px]"
```

- [ ] **Step 4: Fix active tab colors (lines 121-123)**

Change:
```tsx
${
  tab.isActive
    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b-2 border-b-primary"
    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
}
```
To:
```tsx
${
  tab.isActive
    ? "bg-background text-heading border-b-2 border-b-primary"
    : "bg-surface text-muted hover:bg-surface-hover hover:text-heading"
}
```

- [ ] **Step 5: Fix close button visibility (lines 136-146)**

Change:
```tsx
<button
  type="button"
  onClick={(e) => handleCloseClick(e, tab.id)}
  className={`
    flex-shrink-0 w-4 h-4 flex items-center justify-center
    rounded opacity-0 group-hover:opacity-100
    text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
    hover:bg-gray-300 dark:hover:bg-gray-600
    transition-all duration-150
    focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-primary
  `}
  aria-label={`Close ${tab.name}`}
  tabIndex={-1}
>
```
To:
```tsx
<button
  type="button"
  onClick={(e) => handleCloseClick(e, tab.id)}
  className={`
    flex-shrink-0 w-5 h-5 flex items-center justify-center
    rounded 
    opacity-60 hover:opacity-100
    text-muted hover:text-heading
    hover:bg-surface-hover
    transition-all duration-150
    focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-primary
  `}
  aria-label={`Close ${tab.name}`}
  tabIndex={-1}
>
```

- [ ] **Step 6: Add title attribute for tooltips (after line 97)**

Add `title` attribute to the tab div:

Change:
```tsx
<div
  key={tab.id}
  ref={tab.isActive ? activeTabRef : null}
  role="tab"
```
To:
```tsx
<div
  key={tab.id}
  ref={tab.isActive ? activeTabRef : null}
  role="tab"
  title={`${tab.name}${tab.isDirty ? ' (unsaved changes)' : ''}`}
```

- [ ] **Step 7: Add path to Tab interface**

Add `path?: string` to the Tab interface (around line 3-8):

Change:
```tsx
export interface Tab {
  id: string;
  name: string;
  isDirty: boolean;
  isActive: boolean;
}
```
To:
```tsx
export interface Tab {
  id: string;
  name: string;
  path?: string;
  isDirty: boolean;
  isActive: boolean;
}
```

- [ ] **Step 8: Update title to show path**

Change the title from Step 6:
```tsx
title={`${tab.path || tab.name}${tab.isDirty ? ' (unsaved changes)' : ''}`}
```

- [ ] **Step 9: Commit the changes**

```bash
git add apps/frontend/src/components/Editor/TabBar.tsx
git commit -m "fix: use CSS variables and improve TabBar UX"
```

---

## Phase 3: New Header Components

### Task 6: Create CompileButton component

**Files:**
- Create: `apps/frontend/src/components/CompileButton.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useState, useRef, useEffect } from 'react';

interface CompileButtonProps {
  onClick: () => void;
  isCompiling: boolean;
  engine: string;
  onEngineChange: (engine: string) => void;
}

const ENGINES = [
  { value: 'pdflatex', label: 'pdfLaTeX' },
  { value: 'xelatex', label: 'XeLaTeX' },
  { value: 'lualatex', label: 'LuaLaTeX' },
];

export function CompileButton({
  onClick,
  isCompiling,
  engine,
  onEngineChange,
}: CompileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentEngine = ENGINES.find(e => e.value === engine) || ENGINES[0];

  return (
    <div className="flex items-center">
      <button
        onClick={onClick}
        disabled={isCompiling}
        className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-cta hover:bg-cta-dark rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Compile (Ctrl+B)"
      >
        {isCompiling ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Compiling...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Compile
          </>
        )}
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1.5 text-sm font-medium text-white bg-cta hover:bg-cta-dark border-l border-cta-dark rounded-r-lg transition-colors cursor-pointer"
          aria-label="Select engine"
          aria-expanded={isOpen}
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
            {ENGINES.map((e) => (
              <button
                key={e.value}
                onClick={() => {
                  onEngineChange(e.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-surface-hover transition-colors ${
                  engine === e.value ? 'text-primary font-medium bg-primary/5' : 'text-secondary'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompileButton;
```

- [ ] **Step 2: Commit the component**

```bash
git add apps/frontend/src/components/CompileButton.tsx
git commit -m "feat: add CompileButton component with integrated engine selector"
```

---

### Task 7: Create AutoCompileToggle component

**Files:**
- Create: `apps/frontend/src/components/AutoCompileToggle.tsx`

- [ ] **Step 1: Create the component file**

```tsx
interface AutoCompileToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AutoCompileToggle({ enabled, onChange }: AutoCompileToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
        enabled
          ? 'text-primary bg-primary/10 hover:bg-primary/20'
          : 'text-muted bg-surface border border-border hover:bg-surface-hover'
      }`}
      title={enabled ? 'Auto-compile: On (compiles after save)' : 'Auto-compile: Off'}
      aria-pressed={enabled}
    >
      {enabled ? (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Auto
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Auto
        </>
      )}
    </button>
  );
}

export default AutoCompileToggle;
```

- [ ] **Step 2: Commit the component**

```bash
git add apps/frontend/src/components/AutoCompileToggle.tsx
git commit -m "feat: add AutoCompileToggle component"
```

---

### Task 8: Create SettingsDropdown component

**Files:**
- Create: `apps/frontend/src/components/SettingsDropdown.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useState, useRef, useEffect, ReactNode } from 'react';

interface SettingsDropdownProps {
  children: ReactNode;
  engine?: string;
  onEngineChange?: (engine: string) => void;
}

const ENGINES = [
  { value: 'pdflatex', label: 'pdfLaTeX' },
  { value: 'xelatex', label: 'XeLaTeX' },
  { value: 'lualatex', label: 'LuaLaTeX' },
];

export function SettingsDropdown({
  children,
  engine,
  onEngineChange,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted hover:text-heading hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
        aria-label="Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
          {children}
          
          {engine && onEngineChange && (
            <>
              <div className="border-t border-border my-1" />
              <div className="px-4 py-2 text-xs text-muted uppercase tracking-wider">
                Engine
              </div>
              {ENGINES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => {
                    onEngineChange(e.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-surface-hover transition-colors ${
                    engine === e.value ? 'text-primary font-medium' : 'text-secondary'
                  }`}
                >
                  <div className="flex items-center">
                    {engine === e.value && (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!engine || engine !== e.value && <span className="w-4 mr-2" />}
                    {e.label}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsDropdown;
```

- [ ] **Step 2: Commit the component**

```bash
git add apps/frontend/src/components/SettingsDropdown.tsx
git commit -m "feat: add SettingsDropdown component"
```

---

## Phase 4: Main Page Updates

### Task 9: Refactor ProjectDetail.tsx header

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx:1-25,417-584"

- [ ] **Step 1: Update imports (lines 1-25)**

Add new imports:
```tsx
import { CompileButton } from "../components/CompileButton";
import { AutoCompileToggle } from "../components/AutoCompileToggle";
import { SettingsDropdown } from "../components/SettingsDropdown";
```

Remove unused import (if SettingsModal import is still needed, keep it):
- Keep `SettingsModal` import

- [ ] **Step 2: Update the header section (around line 417-584)**

Replace the entire header section with the new layout. The new header should be:

```tsx
<header className="bg-surface dark:bg-surface shadow-sm border-b border-border dark:border-border-light sticky top-0 z-10">
  <div className="px-4 py-3">
    {/* Top Row: Navigation + Title */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center min-w-0">
        <button
          onClick={handleBack}
          className="mr-3 p-2 text-muted hover:text-heading hover:bg-surface-hover dark:hover:bg-gray-700 rounded-lg transition-all duration-100 cursor-pointer flex-shrink-0"
          aria-label="Back to projects"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-semibold text-heading dark:text-heading truncate">
            {currentProject ? (
              <EditableProjectName
                projectId={currentProject.id}
                initialName={currentProject.name}
                onRename={async (newName) => {
                  await renameProject(currentProject.id, newName);
                }}
                size="lg"
                className="text-primary dark:text-heading"
              />
            ) : (
              "Loading..."
            )}
          </h1>
          {currentProject && (
            <p className="text-sm text-muted flex items-center flex-wrap gap-2">
              <span className="truncate">{currentProject.metadata.mainFile}</span>
              <span>•</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-light">
                {currentProject.metadata.template}
              </span>
              {hasUnsavedChanges && (
                <span className="text-cta font-medium">• Unsaved changes</span>
              )}
            </p>
          )}
        </div>
      </div>

      <SettingsDropdown
        engine={compiler}
        onEngineChange={handleEngineChange}
      >
        <div className="px-4 py-2">
          <ThemeToggle />
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full px-4 py-2 text-sm text-left text-secondary hover:bg-surface-hover transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </SettingsDropdown>
    </div>

    {/* Bottom Row: Actions Toolbar */}
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleSave}
        disabled={!activeFile?.isDirty}
        className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
          activeFile?.isDirty
            ? "text-white bg-primary hover:bg-primary-dark shadow-sm hover:shadow"
            : "text-muted bg-surface border border-border cursor-not-allowed"
        }`}
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save
      </button>

      <CompileButton
        onClick={handleCompile}
        isCompiling={isCompiling}
        engine={compiler}
        onEngineChange={handleEngineChange}
      />

      <AutoCompileToggle
        enabled={autoCompileEnabled}
        onChange={(enabled) => {
          setAutoCompileEnabled(enabled);
          localStorage.setItem("latex-editor-auto-compile", enabled.toString());
        }}
      />

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center px-3 py-1.5 text-sm font-medium text-secondary bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
        title="Export as ZIP"
      >
        {isExporting ? (
          <span className="inline-block w-4 h-4 mr-1.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        Export
      </button>

      <span className="sr-only" aria-live="polite">
        {status}
      </span>
    </div>
  </div>
</header>
```

- [ ] **Step 3: Remove old imports and components**

Remove these imports if no longer used:
- `CompileControls` (replaced by `CompileButton`)
- `ThemeToggle` (moved to SettingsDropdown)

- [ ] **Step 4: Commit the changes**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "refactor: redesign ProjectDetail header with cleaner layout"
```

---

### Task 10: Update ProjectList.tsx with footer

**Files:**
- Modify: `apps/frontend/src/pages/ProjectList.tsx:123,145-152,411-426"

- [ ] **Step 1: Update page container to support footer (line 123)**

Change:
```tsx
<div className="w-full min-h-screen bg-background">
```
To:
```tsx
<div className="w-full min-h-screen bg-background flex flex-col">
```

- [ ] **Step 2: Update title (lines 145-152)**

Change:
```tsx
<h1 className="font-heading text-2xl font-bold text-heading dark:text-heading">
  LaTeX Editor
</h1>
<p className="text-xs text-muted">Local document editing</p>
```
To:
```tsx
<h1 className="font-heading text-2xl font-bold text-heading dark:text-heading">
  TexCraft
</h1>
<p className="text-xs text-muted">Local LaTeX Editor</p>
```

- [ ] **Step 3: Add footer before closing div (after line 411, before closing tags)**

Add this footer before the `</div>` at the end of the component:

```tsx
<footer className="mt-auto py-4 px-6 border-t border-border">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
    <div className="flex items-center gap-2">
      <span className="font-medium text-heading">TexCraft</span>
      <span>•</span>
      <span>Local LaTeX Editor</span>
    </div>
    <p>Copyright (c) 2026 Sarmad Soomro. All rights reserved.</p>
  </div>
</footer>
```

- [ ] **Step 4: Commit the changes**

```bash
git add apps/frontend/src/pages/ProjectList.tsx
git commit -m "feat: rebrand to TexCraft and add copyright footer"
```

---

## Phase 5: Settings and About

### Task 11: Create AboutSection component

**Files:**
- Create: `apps/frontend/src/components/Settings/AboutSection.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useState, useEffect } from 'react';

export function AboutSection() {
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    // Try to get version from package.json
    fetch('/package.json')
      .then(res => res.json())
      .then(data => setVersion(data.version || '1.0.0'))
      .catch(() => setVersion('1.0.0'));
  }, []);

  return (
    <div className="space-y-6 p-2">
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-md">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-heading">TexCraft</h2>
          <p className="text-muted">Local LaTeX Editor</p>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-surface rounded-lg p-4 border border-border">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Version</dt>
            <dd className="text-heading font-medium">{version}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">License</dt>
            <dd className="text-heading font-medium">MIT</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Author</dt>
            <dd className="text-heading font-medium">Sarmad Soomro</dd>
          </div>
        </dl>
      </div>

      {/* Description */}
      <p className="text-sm text-secondary leading-relaxed">
        TexCraft is a lightweight, browser-based LaTeX editing environment that runs entirely on your local machine. 
        Edit LaTeX documents with a professional editor, compile locally to PDF, and preview results instantly.
      </p>

      {/* Copyright */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-sm text-muted">
          Copyright (c) 2026 Sarmad Soomro. All rights reserved.
        </p>
      </div>

      {/* Links */}
      <div className="flex justify-center gap-4">
        <a
          href="https://github.com/sarmadsoomro/LocalLatexEditor"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub
        </a>
        <span className="text-border">|</span>
        <a
          href="#"
          className="text-primary hover:text-primary-dark text-sm transition-colors"
        >
          Documentation
        </a>
      </div>
    </div>
  );
}

export default AboutSection;
```

- [ ] **Step 2: Commit the component**

```bash
git add apps/frontend/src/components/Settings/AboutSection.tsx
git commit -m "feat: add AboutSection component for settings"
```

---

### Task 12: Update SettingsModal to include About tab

**Files:**
- Modify: `apps/frontend/src/components/Settings/SettingsModal.tsx` (add About tab)

- [ ] **Step 1: Add About import**

Add import at top of file:
```tsx
import { AboutSection } from './AboutSection';
import { Info } from 'lucide-react';
```

- [ ] **Step 2: Add About to tabs array**

Find the tabs array and add About:
```tsx
const tabs = [
  { id: 'editor', label: 'Editor', icon: FileText },
  { id: 'compiler', label: 'Compiler', icon: Terminal },
  { id: 'ui', label: 'UI & Theme', icon: Palette },
  { id: 'about', label: 'About', icon: Info },
];
```

- [ ] **Step 3: Add About section rendering**

Find where tabs are rendered (switch statement or conditional) and add:
```tsx
{activeTab === 'about' && <AboutSection />}
```

- [ ] **Step 4: Commit the changes**

```bash
git add apps/frontend/src/components/Settings/SettingsModal.tsx
git commit -m "feat: add About tab to SettingsModal"
```

---

## Phase 6: Package and HTML Updates

### Task 13: Update index.html title

**Files:**
- Modify: `apps/frontend/index.html` (title tag)

- [ ] **Step 1: Change title**

Change:
```html
<title>Local LaTeX Editor</title>
```
To:
```html
<title>TexCraft - Local LaTeX Editor</title>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/index.html
git commit -m "chore: update page title to TexCraft"
```

---

### Task 14: Update package.json files

**Files:**
- Modify: `apps/frontend/package.json`
- Modify: `apps/backend/package.json`

- [ ] **Step 1: Update frontend package.json**

Add or update:
```json
{
  "name": "texcraft-frontend",
  "productName": "TexCraft",
  "version": "1.0.0"
}
```

- [ ] **Step 2: Update backend package.json**

Add or update:
```json
{
  "name": "texcraft-backend",
  "version": "1.0.0"
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/package.json apps/backend/package.json
git commit -m "chore: update package names to TexCraft"
```

---

## Phase 7: Testing and Verification

### Task 15: Run type checks and build

- [ ] **Step 1: Run TypeScript check**

```bash
cd apps/frontend
pnpm typecheck
```

Expected: No TypeScript errors

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Expected: No lint errors

- [ ] **Step 3: Build the project**

```bash
pnpm build
```

Expected: Build completes successfully

- [ ] **Step 4: Commit if all checks pass**

```bash
git commit -m "chore: verify build passes after UI redesign"
```

---

## Summary

**Total Tasks:** 15
**Files Created:** 4
**Files Modified:** 11
**Estimated Time:** 3-4 hours

### Phase Breakdown

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1 | CSS variables setup |
| 2 | 4 | Color consistency fixes |
| 3 | 3 | New header components |
| 4 | 2 | Main page updates |
| 5 | 2 | Settings and About |
| 6 | 2 | Package and HTML updates |
| 7 | 1 | Testing and verification |

---

## Rollback Instructions

If critical issues are found:

```bash
# View recent commits
git log --oneline -20

# Soft reset to before changes (keep working directory)
git reset --soft HEAD~15

# Or hard reset (discard all changes)
git reset --hard <commit-before-changes>
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-16-texcraft-ui-ux-redesign-plan.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach would you prefer?**
