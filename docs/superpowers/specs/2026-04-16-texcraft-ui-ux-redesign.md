# TexCraft UI/UX Redesign

**Date:** April 16, 2026  
**Author:** OpenCode  
**Status:** Approved - Ready for Implementation  
**Approach:** B (Header Redesign + Color Consistency)

---

## Overview

Redesign the TexCraft (formerly Local LaTeX Editor) UI to improve visual consistency, reduce header clutter, and establish proper branding with copyright information.

---

## Goals

1. Fix color inconsistencies across components for unified light/dark mode support
2. Redesign ProjectDetail header for better visual hierarchy and reduced clutter
3. Improve TabBar accessibility and overflow handling
4. Rebrand from "Local LaTeX Editor" to "TexCraft"
5. Add copyright notice in footer and About dialog

---

## Part 1: Color Consistency Fixes

### Problem
Several components use hardcoded Tailwind colors instead of CSS variables, breaking dark mode consistency.

### Files to Update

#### 1. PDFPreview.tsx

**Current Issues:**
- Line 505: `text-blue-600` for loading spinner
- Line 535: `text-red-500` for error state
- Line 602: `bg-gray-100` for toolbar background
- Line 672: `focus:ring-blue-500` for input focus

**Changes Required:**
```tsx
// Line 33: Change from
className="animate-spin h-8 w-8 text-blue-600"
// To
className="animate-spin h-8 w-8 text-primary"

// Line 535: Error state colors
// Change from red-500/red-400 to text-error
className="h-full flex items-center justify-center text-error p-4"

// Line 602: Toolbar background
// Change from bg-gray-100 to bg-surface
className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border gap-4"

// Line 672: Input focus
// Change from focus:ring-blue-500 to focus:ring-primary
className="w-10 px-1.5 py-0.5 text-sm text-center border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
```

#### 2. LogViewer.tsx

**Current Issues:**
- Line 35: `bg-gray-50` for container
- Line 37: `bg-red-50`, `bg-red-100`, `text-red-800` for errors
- Line 95: `text-yellow-600` for warnings

**Changes Required:**
```tsx
// Line 35: Container background
className="flex flex-col h-full bg-background"

// Line 37: Error section
className="border-b border-border bg-error-light max-h-48 overflow-auto"
className="px-4 py-2 border-b border-error/20 bg-error/10 sticky top-0"
className="text-sm font-semibold text-error"

// Line 54: Error line badge
className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error text-error-light"

// Line 63: Error message
className="text-sm text-error font-mono"

// Line 95: Warning text
className="flex items-center gap-1 text-sm text-warning"
```

**Add to CSS variables** (if not present):
```css
--color-error-light: #fee2e2;
--color-error: #ef4444;
--color-warning: #f59e0b;

.dark {
  --color-error-light: rgba(239, 68, 68, 0.2);
  --color-error: #f87171;
  --color-warning: #fbbf24;
}
```

#### 3. ResizableSplitPane.tsx

**Current Issues:**
- Line 177: `bg-gray-200` for divider
- Line 177: `hover:bg-blue-400` for hover state
- Line 180: `bg-blue-500` for active state

**Changes Required:**
```tsx
// Line 177: Divider colors
className={`
  flex-shrink-0 w-1 bg-border hover:bg-primary-light
  cursor-col-resize select-none
  transition-colors duration-150
  ${isDragging ? 'bg-primary' : ''}
`}

// Line 205: Handle colors
className={`
  w-1 h-8 rounded-full
  transition-colors duration-150
  ${isDragging ? 'bg-primary-dark' : 'bg-border-dark group-hover:bg-primary-light'}
`}
```

#### 4. TabBar.tsx

**Current Issues:**
- Line 93: `bg-gray-100` for background
- Line 115: `border-gray-200` for borders
- Line 121: `text-gray-900` for active tab text

**Changes Required:**
```tsx
// Line 93: Background
className={`flex h-11 items-center bg-surface border-b border-border overflow-x-auto ${className}`}

// Line 115: Tab borders
className="group flex items-center gap-2 px-3 py-2 text-sm font-medium border-r border-border min-w-0 max-w-[200px]"

// Line 121: Active tab colors
className={tab.isActive
  ? "bg-background text-heading border-b-2 border-b-primary"
  : "bg-surface text-muted hover:bg-surface-hover hover:text-heading"
}
```

---

## Part 2: ProjectDetail Header Redesign

### Current Problems

The header has 8+ elements competing for space:
- Back button
- Project name with metadata
- Theme toggle
- Settings button
- Save button
- Auto-compile checkbox
- Compile controls (engine + buttons)
- Export button

### New Header Layout

**Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Back]  [Project Name]  [template]                    [Actions] [⚙️ ▼]       │
│         main.tex • Unsaved changes                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [💾 Save] [▶️ Compile ▼] [🔄 Auto] [📥 Export]                              │
│                                                                             │
│  Settings Dropdown:                                                         │
│  ├── 🌓 Theme Toggle                                                        │
│  ├── ⚙️ Settings...                                                         │
│  └── ─────────────                                                          │
│      Engine: [pdflatex ▼]                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### Header Component Structure

```tsx
<header className="bg-surface shadow-sm border-b border-border sticky top-0 z-10">
  {/* Top Row: Navigation + Title + Secondary Actions */}
  <div className="px-4 py-2 flex items-center justify-between">
    {/* Left: Back + Project Info */}
    <div className="flex items-center min-w-0">
      <BackButton onClick={handleBack} />
      <div className="ml-3 min-w-0">
        <EditableProjectName 
          projectId={currentProject.id}
          initialName={currentProject.name}
        />
        <div className="flex items-center text-xs text-muted mt-0.5">
          <span className="truncate">{currentProject.metadata.mainFile}</span>
          <span className="mx-2">•</span>
          <TemplateBadge template={currentProject.metadata.template} />
          {hasUnsavedChanges && (
            <span className="ml-2 text-cta font-medium">• Unsaved</span>
          )}
        </div>
      </div>
    </div>

    {/* Right: Actions Toolbar + Settings */}
    <div className="flex items-center gap-2">
      {/* Primary Actions */}
      <div className="flex items-center gap-1.5">
        <SaveButton 
          onClick={handleSave} 
          disabled={!activeFile?.isDirty}
        />
        <CompileButton 
          onClick={handleCompile}
          isCompiling={isCompiling}
          engine={compiler}
          onEngineChange={setCompiler}
        />
        <AutoCompileToggle 
          enabled={autoCompileEnabled}
          onChange={setAutoCompileEnabled}
        />
        <ExportButton 
          onClick={handleExport}
          isExporting={isExporting}
        />
      </div>

      {/* Settings Dropdown */}
      <SettingsDropdown>
        <ThemeToggle />
        <SettingsItem onClick={() => setIsSettingsOpen(true)} />
        <Divider />
        <EngineSelector 
          engine={compiler}
          onChange={setCompiler}
        />
      </SettingsDropdown>
    </div>
  </div>
</header>
```

#### New Components to Create

**1. CompileButton (integrated engine dropdown)**
```tsx
interface CompileButtonProps {
  onClick: () => void;
  isCompiling: boolean;
  engine: string;
  onEngineChange: (engine: string) => void;
}

// Shows: [▶️ Compile] [▼]
// Dropdown contains engine options
// Keyboard shortcut: Ctrl+B
```

**2. AutoCompileToggle**
```tsx
interface AutoCompileToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

// Icon button with tooltip
// Checkmark icon when enabled, refresh icon when disabled
// Tooltip: "Auto-compile: On/Off (saves on Ctrl+S)"
```

**3. SettingsDropdown**
```tsx
// Dropdown menu component
// Trigger: Gear icon with dropdown arrow
// Contains: ThemeToggle, Settings link, Divider, EngineSelector
```

#### Responsive Behavior

- **≥1024px**: Full layout as designed
- **768px-1023px**: Actions toolbar may wrap to second row
- **<768px**: Stack vertically, actions toolbar below project info
- **<640px**: Compact mode - smaller buttons, icon-only where possible

---

## Part 3: Tab Bar Improvements

### Current Issues

1. Close button invisible until hover (accessibility problem)
2. No overflow indication when many tabs open
3. Missing file path context in tooltips

### Changes

#### 1. Always-Visible Close Button

```tsx
// TabBar.tsx - Line 136-164
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
  <svg className="w-3 h-3" ... />
</button>
```

#### 2. Overflow Shadow Indicator

```tsx
// TabBar.tsx - Add to scroll container
<div 
  ref={scrollContainerRef}
  className="relative flex h-11 items-center bg-surface border-b border-border overflow-x-auto"
>
  {/* Shadow overlay for overflow indication */}
  <div 
    className={`
      absolute right-0 top-0 bottom-0 w-8 
      bg-gradient-to-l from-surface to-transparent
      pointer-events-none
      ${hasOverflow ? 'opacity-100' : 'opacity-0'}
      transition-opacity duration-200
    `}
  />
  {/* ... tabs ... */}
</div>
```

#### 3. Tab Tooltips

```tsx
// Add title attribute showing full path
<div
  key={tab.id}
  title={`${tab.path} ${tab.isDirty ? '(unsaved changes)' : ''}`}
  // ... rest of tab props
>
```

---

## Part 4: Project Branding

### Rename to "TexCraft"

**Files to Update:**

1. **apps/frontend/index.html**
   ```html
   <title>TexCraft - Local LaTeX Editor</title>
   ```

2. **apps/frontend/src/pages/ProjectList.tsx** (Line 145-146)
   ```tsx
   <h1 className="font-heading text-2xl font-bold text-heading dark:text-heading">
     TexCraft
   </h1>
   <p className="text-xs text-muted">Local LaTeX editing</p>
   ```

3. **apps/frontend/package.json**
   ```json
   {
     "name": "texcraft-frontend",
     "productName": "TexCraft"
   }
   ```

4. **apps/backend/package.json**
   ```json
   {
     "name": "texcraft-backend"
   }
   ```

5. **README.md**
   - Update all references from "Local LaTeX Editor" to "TexCraft"
   - Keep mention: "A local LaTeX editor" in description

### Copyright Implementation

#### A. Footer on ProjectList Page

```tsx
// Add to ProjectList.tsx after </main>
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

#### B. About Dialog in Settings

**New File: apps/frontend/src/components/Settings/AboutSection.tsx**

```tsx
export function AboutSection() {
  return (
    <div className="space-y-6">
      {/* Logo/Icon */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-md">
          <svg className="w-10 h-10 text-white" ... />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-heading">TexCraft</h2>
          <p className="text-muted">Local LaTeX Editor</p>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-surface rounded-lg p-4 border border-border">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Version</dt>
            <dd className="text-heading font-medium">1.0.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">License</dt>
            <dd className="text-heading font-medium">MIT</dd>
          </div>
        </dl>
      </div>

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
          className="text-primary hover:text-primary-dark text-sm"
        >
          GitHub
        </a>
        <span className="text-border">|</span>
        <a 
          href="#"
          className="text-primary hover:text-primary-dark text-sm"
        >
          Documentation
        </a>
      </div>
    </div>
  );
}
```

**Update SettingsTabs.tsx to include About tab:**

```tsx
const tabs = [
  { id: 'editor', label: 'Editor', icon: FileText },
  { id: 'compiler', label: 'Compiler', icon: Terminal },
  { id: 'ui', label: 'UI & Theme', icon: Palette },
  { id: 'about', label: 'About', icon: Info },
];
```

---

## Implementation Checklist

### Phase 1: Color Consistency
- [ ] Update PDFPreview.tsx colors
- [ ] Update LogViewer.tsx colors
- [ ] Update ResizableSplitPane.tsx colors
- [ ] Update TabBar.tsx colors
- [ ] Add missing CSS variables to index.css
- [ ] Test both light and dark modes

### Phase 2: Header Redesign
- [ ] Create CompileButton component with integrated engine dropdown
- [ ] Create AutoCompileToggle component
- [ ] Create SettingsDropdown component
- [ ] Refactor ProjectDetail.tsx header layout
- [ ] Test responsive behavior at all breakpoints

### Phase 3: Tab Bar Improvements
- [ ] Make close buttons always visible
- [ ] Add overflow shadow indicator
- [ ] Add tab tooltips with file paths
- [ ] Test with many open tabs

### Phase 4: Branding & Copyright
- [ ] Update index.html title
- [ ] Update ProjectList.tsx title
- [ ] Update package.json files
- [ ] Add footer to ProjectList
- [ ] Create AboutSection component
- [ ] Add About tab to SettingsModal
- [ ] Update README.md

---

## Testing Requirements

### Visual Testing
- [ ] Verify all components render correctly in light mode
- [ ] Verify all components render correctly in dark mode
- [ ] Check contrast ratios meet WCAG AA (4.5:1)
- [ ] Verify no color harshness or visual artifacts

### Functional Testing
- [ ] Header actions work correctly (Save, Compile, Export)
- [ ] Settings dropdown opens/closes properly
- [ ] Engine selector changes compiler correctly
- [ ] Auto-compile toggle persists to localStorage
- [ ] Tab bar keyboard navigation works
- [ ] Tab close buttons work with mouse and keyboard

### Responsive Testing
- [ ] Test at 1920px (desktop)
- [ ] Test at 1366px (laptop)
- [ ] Test at 1024px (tablet landscape)
- [ ] Test at 768px (tablet portrait)
- [ ] Test at 375px (mobile)

### Accessibility Testing
- [ ] All interactive elements have focus indicators
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces actions correctly
- [ ] Color is not the only indicator of state

---

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `apps/frontend/src/components/PDFPreview.tsx` | ~30 | Color variable updates |
| `apps/frontend/src/components/LogViewer.tsx` | ~25 | Color variable updates |
| `apps/frontend/src/components/ResizableSplitPane.tsx` | ~15 | Color variable updates |
| `apps/frontend/src/components/Editor/TabBar.tsx` | ~30 | Colors + close button visibility + overflow |
| `apps/frontend/src/pages/ProjectDetail.tsx` | ~150 | Header redesign |
| `apps/frontend/src/pages/ProjectList.tsx` | ~30 | Title update + footer |
| `apps/frontend/src/components/Settings/SettingsModal.tsx` | ~20 | Add About tab |
| `apps/frontend/src/components/Settings/AboutSection.tsx` | ~80 | New component |
| `apps/frontend/src/components/CompileButton.tsx` | ~60 | New component |
| `apps/frontend/src/components/AutoCompileToggle.tsx` | ~40 | New component |
| `apps/frontend/src/components/SettingsDropdown.tsx` | ~50 | New component |
| `apps/frontend/src/index.css` | ~20 | Add error/warning color variables |
| `apps/frontend/index.html` | ~1 | Title update |
| `apps/frontend/package.json` | ~2 | Product name update |
| `apps/backend/package.json` | ~2 | Name update |
| `README.md` | ~10 | Brand name updates |

**Total Files:** 16  
**Estimated Lines Changed:** ~575  
**Estimated Time:** 3-4 hours

---

## Rollback Plan

If issues are found:

1. **Color issues**: Revert to hardcoded colors temporarily
2. **Header issues**: Keep old header as `ProjectDetail.legacy.tsx` during transition
3. **Branding issues**: Revert name changes easily (text-only changes)

---

## Success Criteria

- [ ] No visual regressions in light/dark mode
- [ ] Header is less cluttered and more intuitive
- [ ] All actions remain easily accessible
- [ ] Tab bar is more user-friendly
- [ ] Branding consistently shows "TexCraft"
- [ ] Copyright notice visible in footer and About
- [ ] All tests pass (lint, typecheck, build)
