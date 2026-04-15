# Settings/Preferences Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a comprehensive settings/preferences page that allows users to customize editor, compilation, and UI preferences with persistent storage.

**Architecture:** Add a settings route with a modal/settings page UI, a Zustand store for settings state, localStorage persistence, and apply settings to Monaco Editor and compilation service.

**Tech Stack:** React, Zustand, Monaco Editor API, localStorage

---

## File Structure

```
apps/frontend/src/
├── components/
│   ├── Settings/
│   │   ├── index.ts           # Component exports
│   │   ├── SettingsModal.tsx  # Main settings modal/page
│   │   ├── SettingsTabs.tsx   # Tab navigation for settings sections
│   │   ├── EditorSettings.tsx # Editor-specific settings
│   │   ├── CompilerSettings.tsx # Compilation settings
│   │   └── UISettings.tsx     # UI/appearance settings
│   └── Toolbar.tsx            # Add settings button (modified)
├── stores/
│   └── settingsStore.ts       # Settings state management
├── types/
│   └── settings.ts            # Settings type definitions
└── utils/
    └── storage.ts             # localStorage helpers
```

---

## Task 1: Define Settings Types

**Files:**
- Create: `apps/frontend/src/types/settings.ts`

**Purpose:** Define TypeScript interfaces for all configurable settings.

- [ ] **Step 1: Create settings types file**

```typescript
// apps/frontend/src/types/settings.ts

export interface EditorSettings {
  fontSize: number;           // 10-24, default 16
  fontFamily: string;         // Default: 'JetBrains Mono', 'Fira Code', etc.
  tabSize: number;            // 2 or 4, default 2
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  wordWrapColumn: number;     // When wordWrap is 'wordWrapColumn'
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  minimap: boolean;           // Show minimap, default false
  lineHighlight: boolean;     // Highlight current line, default true
  bracketPairColorization: boolean; // Color matching brackets, default true
  autoSave: boolean;          // Auto-save files, default false
  autoSaveDelay: number;      // Delay in ms, default 1000
  autoCompile: boolean;       // Auto-compile on save, default true
  autoCompileDelay: number;   // Delay in ms, default 2000
}

export interface CompilerSettings {
  defaultEngine: 'pdflatex' | 'xelatex' | 'lualatex';
  outputDirectory: string;    // Default: 'output'
  shellEscape: boolean;       // Enable \write18, default false (security)
  synctex: boolean;           // Generate SyncTeX, default true
  draftMode: boolean;         // Draft mode for faster compiles, default false
  additionalArgs: string[];   // Extra compiler arguments
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  sidebarVisible: boolean;    // Show file tree sidebar, default true
  sidebarWidth: number;       // Width in pixels, default 250
  pdfPreviewVisible: boolean; // Show PDF preview, default true
  pdfPreviewWidth: number;    // Width percentage, default 50
  showHiddenFiles: boolean;   // Show dotfiles in file tree, default false
  showCompiledFiles: boolean; // Show .aux, .log, etc., default false
  confirmDelete: boolean;     // Show confirmation on delete, default true
  confirmCloseUnsaved: boolean; // Show confirmation on close unsaved, default true
}

export interface Settings {
  editor: EditorSettings;
  compiler: CompilerSettings;
  ui: UISettings;
  version: number;            // For migration
}

export const DEFAULT_SETTINGS: Settings = {
  editor: {
    fontSize: 16,
    fontFamily: 'JetBrains Mono',
    tabSize: 2,
    wordWrap: 'on',
    wordWrapColumn: 80,
    lineNumbers: 'on',
    minimap: false,
    lineHighlight: true,
    bracketPairColorization: true,
    autoSave: false,
    autoSaveDelay: 1000,
    autoCompile: true,
    autoCompileDelay: 2000,
  },
  compiler: {
    defaultEngine: 'pdflatex',
    outputDirectory: 'output',
    shellEscape: false,
    synctex: true,
    draftMode: false,
    additionalArgs: [],
  },
  ui: {
    theme: 'system',
    sidebarVisible: true,
    sidebarWidth: 250,
    pdfPreviewVisible: true,
    pdfPreviewWidth: 50,
    showHiddenFiles: false,
    showCompiledFiles: false,
    confirmDelete: true,
    confirmCloseUnsaved: true,
  },
  version: 1,
};
```

- [ ] **Step 2: Commit the types**

```bash
git add apps/frontend/src/types/settings.ts
git commit -m "feat(settings): add settings type definitions"
```

---

## Task 2: Create Settings Store

**Files:**
- Create: `apps/frontend/src/stores/settingsStore.ts`
- Modify: `apps/frontend/src/stores/index.ts` (add export)

**Purpose:** Zustand store for settings with localStorage persistence.

- [ ] **Step 1: Create settings store**

```typescript
// apps/frontend/src/stores/settingsStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings, EditorSettings, CompilerSettings, UISettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends Settings {
  // Actions
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  updateCompilerSettings: (settings: Partial<CompilerSettings>) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  resetSettings: () => void;
  resetEditorSettings: () => void;
  resetCompilerSettings: () => void;
  resetUISettings: () => void;
  
  // Get Monaco editor options
  getMonacoOptions: () => Record<string, unknown>;
}

const STORAGE_KEY = 'latex-editor-settings';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateEditorSettings: (settings) =>
        set((state) => ({
          editor: { ...state.editor, ...settings },
        })),

      updateCompilerSettings: (settings) =>
        set((state) => ({
          compiler: { ...state.compiler, ...settings },
        })),

      updateUISettings: (settings) =>
        set((state) => ({
          ui: { ...state.ui, ...settings },
        })),

      resetSettings: () => set(DEFAULT_SETTINGS),

      resetEditorSettings: () =>
        set((state) => ({
          ...state,
          editor: DEFAULT_SETTINGS.editor,
        })),

      resetCompilerSettings: () =>
        set((state) => ({
          ...state,
          compiler: DEFAULT_SETTINGS.compiler,
        })),

      resetUISettings: () =>
        set((state) => ({
          ...state,
          ui: DEFAULT_SETTINGS.ui,
        })),

      getMonacoOptions: () => {
        const { editor } = get();
        return {
          fontSize: editor.fontSize,
          fontFamily: editor.fontFamily,
          tabSize: editor.tabSize,
          wordWrap: editor.wordWrap,
          wordWrapColumn: editor.wordWrapColumn,
          lineNumbers: editor.lineNumbers,
          minimap: { enabled: editor.minimap },
          renderLineHighlight: editor.lineHighlight ? 'line' : 'none',
          bracketPairColorization: { enabled: editor.bracketPairColorization },
          automaticLayout: true,
          scrollBeyondLastLine: false,
        };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        editor: state.editor,
        compiler: state.compiler,
        ui: state.ui,
        version: state.version,
      }),
    }
  )
);

// Export individual selectors for performance
export const selectEditorSettings = (state: SettingsState) => state.editor;
export const selectCompilerSettings = (state: SettingsState) => state.compiler;
export const selectUISettings = (state: SettingsState) => state.ui;
```

- [ ] **Step 2: Add export to stores index**

```typescript
// apps/frontend/src/stores/index.ts
export { useSettingsStore } from './settingsStore';
export { useEditorStore } from './editorStore';
export { useProjectStore } from './projectStore';
export { useCompilationStore } from './compilationStore';
```

- [ ] **Step 3: Commit the store**

```bash
git add apps/frontend/src/stores/settingsStore.ts apps/frontend/src/stores/index.ts
git commit -m "feat(settings): add settings store with localStorage persistence"
```

---

## Task 3: Create Editor Settings Component

**Files:**
- Create: `apps/frontend/src/components/Settings/EditorSettings.tsx`

**Purpose:** UI for configuring editor preferences.

- [ ] **Step 1: Create EditorSettings component**

```typescript
// apps/frontend/src/components/Settings/EditorSettings.tsx

import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingsSection, SettingItem, SliderSetting, ToggleSetting, SelectSetting } from './SettingsComponents';

export const EditorSettings: React.FC = () => {
  const { editor, updateEditorSettings } = useSettingsStore();

  return (
    <SettingsSection title="Editor" description="Configure code editor appearance and behavior">
      <SliderSetting
        label="Font Size"
        value={editor.fontSize}
        min={10}
        max={24}
        step={1}
        unit="px"
        onChange={(value) => updateEditorSettings({ fontSize: value })}
      />

      <SelectSetting
        label="Font Family"
        value={editor.fontFamily}
        options={[
          { value: 'JetBrains Mono', label: 'JetBrains Mono' },
          { value: 'Fira Code', label: 'Fira Code' },
          { value: 'Source Code Pro', label: 'Source Code Pro' },
          { value: 'Consolas', label: 'Consolas' },
          { value: 'Monaco', label: 'Monaco' },
          { value: 'monospace', label: 'System Monospace' },
        ]}
        onChange={(value) => updateEditorSettings({ fontFamily: value })}
      />

      <SelectSetting
        label="Tab Size"
        value={editor.tabSize.toString()}
        options={[
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
        ]}
        onChange={(value) => updateEditorSettings({ tabSize: parseInt(value, 10) })}
      />

      <SelectSetting
        label="Word Wrap"
        value={editor.wordWrap}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
          { value: 'wordWrapColumn', label: 'At column' },
          { value: 'bounded', label: 'Bounded' },
        ]}
        onChange={(value) => updateEditorSettings({ wordWrap: value as typeof editor.wordWrap })}
      />

      {editor.wordWrap === 'wordWrapColumn' && (
        <SliderSetting
          label="Wrap Column"
          value={editor.wordWrapColumn}
          min={40}
          max={120}
          step={10}
          onChange={(value) => updateEditorSettings({ wordWrapColumn: value })}
        />
      )}

      <SelectSetting
        label="Line Numbers"
        value={editor.lineNumbers}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
          { value: 'relative', label: 'Relative' },
          { value: 'interval', label: 'Interval' },
        ]}
        onChange={(value) => updateEditorSettings({ lineNumbers: value as typeof editor.lineNumbers })}
      />

      <ToggleSetting
        label="Show Minimap"
        description="Display code minimap on the right side"
        checked={editor.minimap}
        onChange={(checked) => updateEditorSettings({ minimap: checked })}
      />

      <ToggleSetting
        label="Highlight Current Line"
        checked={editor.lineHighlight}
        onChange={(checked) => updateEditorSettings({ lineHighlight: checked })}
      />

      <ToggleSetting
        label="Bracket Pair Colorization"
        description="Color matching brackets differently"
        checked={editor.bracketPairColorization}
        onChange={(checked) => updateEditorSettings({ bracketPairColorization: checked })}
      />

      <div className="border-t border-[var(--color-border)] my-4" />

      <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        Auto-Save & Compile
      </h4>

      <ToggleSetting
        label="Auto-Save"
        description="Automatically save files after typing stops"
        checked={editor.autoSave}
        onChange={(checked) => updateEditorSettings({ autoSave: checked })}
      />

      {editor.autoSave && (
        <SliderSetting
          label="Auto-Save Delay"
          value={editor.autoSaveDelay}
          min={500}
          max={5000}
          step={500}
          unit="ms"
          onChange={(value) => updateEditorSettings({ autoSaveDelay: value })}
        />
      )}

      <ToggleSetting
        label="Auto-Compile"
        description="Automatically compile after saving"
        checked={editor.autoCompile}
        onChange={(checked) => updateEditorSettings({ autoCompile: checked })}
      />

      {editor.autoCompile && (
        <SliderSetting
          label="Auto-Compile Delay"
          value={editor.autoCompileDelay}
          min={1000}
          max={10000}
          step={500}
          unit="ms"
          onChange={(value) => updateEditorSettings({ autoCompileDelay: value })}
        />
      )}
    </SettingsSection>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/Settings/EditorSettings.tsx
git commit -m "feat(settings): add editor settings component"
```

---

## Task 4: Create Reusable Settings UI Components

**Files:**
- Create: `apps/frontend/src/components/Settings/SettingsComponents.tsx`

**Purpose:** Reusable UI components for settings (sliders, toggles, selects).

- [ ] **Step 1: Create shared settings components**

```typescript
// apps/frontend/src/components/Settings/SettingsComponents.tsx

import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
      )}
    </div>
    <div className="space-y-4 pl-1">{children}</div>
  </div>
);

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const SliderSetting: React.FC<SliderSettingProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-32 h-2 bg-[var(--color-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
      />
      <span className="text-sm text-[var(--color-text-secondary)] w-16 text-right">
        {value}{unit}
      </span>
    </div>
  </div>
);

interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-start justify-between py-2">
    <div>
      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{description}</p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
        checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

interface SelectSettingProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export const SelectSetting: React.FC<SelectSettingProps> = ({
  label,
  value,
  options,
  onChange,
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block p-2"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

interface SettingItemProps {
  label: string;
  children: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({ label, children }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
    {children}
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/Settings/SettingsComponents.tsx
git commit -m "feat(settings): add reusable settings UI components"
```

---

## Task 5: Create Compiler Settings Component

**Files:**
- Create: `apps/frontend/src/components/Settings/CompilerSettings.tsx`

**Purpose:** UI for configuring LaTeX compiler settings.

- [ ] **Step 1: Create CompilerSettings component**

```typescript
// apps/frontend/src/components/Settings/CompilerSettings.tsx

import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingsSection, ToggleSetting, SelectSetting } from './SettingsComponents';

export const CompilerSettings: React.FC = () => {
  const { compiler, updateCompilerSettings } = useSettingsStore();

  return (
    <SettingsSection title="Compiler" description="Configure LaTeX compilation settings">
      <SelectSetting
        label="Default Engine"
        value={compiler.defaultEngine}
        options={[
          { value: 'pdflatex', label: 'pdfLaTeX (default)' },
          { value: 'xelatex', label: 'XeLaTeX (modern fonts)' },
          { value: 'lualatex', label: 'LuaLaTeX (Lua scripting)' },
        ]}
        onChange={(value) =>
          updateCompilerSettings({ defaultEngine: value as typeof compiler.defaultEngine })
        }
      />

      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[var(--color-text-primary)]">Output Directory</span>
        <input
          type="text"
          value={compiler.outputDirectory}
          onChange={(e) => updateCompilerSettings({ outputDirectory: e.target.value })}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block w-32 p-2"
          placeholder="output"
        />
      </div>

      <ToggleSetting
        label="Enable SyncTeX"
        description="Generate SyncTeX data for source-to-PDF navigation"
        checked={compiler.synctex}
        onChange={(checked) => updateCompilerSettings({ synctex: checked })}
      />

      <ToggleSetting
        label="Draft Mode"
        description="Faster compilation, no images"
        checked={compiler.draftMode}
        onChange={(checked) => updateCompilerSettings({ draftMode: checked })}
      />

      <ToggleSetting
        label="Shell Escape"
        description="Allow LaTeX to execute shell commands (security risk)"
        checked={compiler.shellEscape}
        onChange={(checked) => updateCompilerSettings({ shellEscape: checked })}
      />

      <div className="pt-4">
        <label className="block text-sm text-[var(--color-text-primary)] mb-2">
          Additional Arguments
        </label>
        <input
          type="text"
          value={compiler.additionalArgs.join(' ')}
          onChange={(e) =>
            updateCompilerSettings({
              additionalArgs: e.target.value.split(' ').filter(Boolean),
            })
          }
          placeholder="-file-line-error -halt-on-error"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block w-full p-2"
        />
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Space-separated list of additional compiler arguments
        </p>
      </div>
    </SettingsSection>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/Settings/CompilerSettings.tsx
git commit -m "feat(settings): add compiler settings component"
```

---

## Task 6: Create UI Settings Component

**Files:**
- Create: `apps/frontend/src/components/Settings/UISettings.tsx`

**Purpose:** UI for configuring appearance and UI preferences.

- [ ] **Step 1: Create UISettings component**

```typescript
// apps/frontend/src/components/Settings/UISettings.tsx

import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingsSection, ToggleSetting, SelectSetting, SliderSetting } from './SettingsComponents';

export const UISettings: React.FC = () => {
  const { ui, updateUISettings, resetUISettings } = useSettingsStore();

  return (
    <SettingsSection title="Appearance" description="Customize the user interface">
      <SelectSetting
        label="Theme"
        value={ui.theme}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
        onChange={(value) => updateUISettings({ theme: value as typeof ui.theme })}
      />

      <div className="border-t border-[var(--color-border)] my-4" />

      <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        File Explorer
      </h4>

      <ToggleSetting
        label="Show Hidden Files"
        description="Show files starting with a dot"
        checked={ui.showHiddenFiles}
        onChange={(checked) => updateUISettings({ showHiddenFiles: checked })}
      />

      <ToggleSetting
        label="Show Compiled Files"
        description="Show auxiliary files (.aux, .log, etc.)"
        checked={ui.showCompiledFiles}
        onChange={(checked) => updateUISettings({ showCompiledFiles: checked })}
      />

      <div className="border-t border-[var(--color-border)] my-4" />

      <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        Confirmations
      </h4>

      <ToggleSetting
        label="Confirm Delete"
        description="Show confirmation before deleting files"
        checked={ui.confirmDelete}
        onChange={(checked) => updateUISettings({ confirmDelete: checked })}
      />

      <ToggleSetting
        label="Confirm Close Unsaved"
        description="Show warning when closing unsaved files"
        checked={ui.confirmCloseUnsaved}
        onChange={(checked) => updateUISettings({ confirmCloseUnsaved: checked })}
      />

      <div className="border-t border-[var(--color-border)] my-4" />

      <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        Reset
      </h4>

      <button
        onClick={resetUISettings}
        className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg transition-colors"
      >
        Reset UI Settings to Default
      </button>
    </SettingsSection>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/Settings/UISettings.tsx
git commit -m "feat(settings): add UI settings component"
```

---

## Task 7: Create Settings Modal Shell

**Files:**
- Create: `apps/frontend/src/components/Settings/SettingsTabs.tsx`
- Create: `apps/frontend/src/components/Settings/SettingsModal.tsx`

**Purpose:** Tab navigation and main modal container for settings.

- [ ] **Step 1: Create SettingsTabs component**

```typescript
// apps/frontend/src/components/Settings/SettingsTabs.tsx

import React, { useState } from 'react';
import { FileEdit, Terminal, Palette, Keyboard } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs: Tab[] = [
  { id: 'editor', label: 'Editor', icon: <FileEdit size={18} /> },
  { id: 'compiler', label: 'Compiler', icon: <Terminal size={18} /> },
  { id: 'ui', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={18} /> },
];

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, onTabChange }) => (
  <div className="flex flex-col space-y-1 pr-4 border-r border-[var(--color-border)]">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
          activeTab === tab.id
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);
```

- [ ] **Step 2: Create SettingsModal component**

```typescript
// apps/frontend/src/components/Settings/SettingsModal.tsx

import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingsTabs } from './SettingsTabs';
import { EditorSettings } from './EditorSettings';
import { CompilerSettings } from './CompilerSettings';
import { UISettings } from './UISettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('editor');
  const { resetSettings } = useSettingsStore();

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return <EditorSettings />;
      case 'compiler':
        return <CompilerSettings />;
      case 'ui':
        return <UISettings />;
      case 'shortcuts':
        return (
          <div className="p-4 text-center text-[var(--color-text-secondary)]">
            <p>Keyboard shortcuts can be viewed in the Help menu.</p>
          </div>
        );
      default:
        return <EditorSettings />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Settings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              title="Reset all settings to default"
            >
              <RotateCcw size={14} />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 p-4 bg-[var(--color-surface)]">
            <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create index export file**

```typescript
// apps/frontend/src/components/Settings/index.ts
export { SettingsModal } from './SettingsModal';
export { SettingsTabs } from './SettingsTabs';
export { EditorSettings } from './EditorSettings';
export { CompilerSettings } from './CompilerSettings';
export { UISettings } from './UISettings';
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/components/Settings/
git commit -m "feat(settings): add settings modal shell and tab navigation"
```

---

## Task 8: Integrate Settings with Monaco Editor

**Files:**
- Modify: `apps/frontend/src/components/Editor/MonacoEditor.tsx`

**Purpose:** Apply settings from the store to the Monaco Editor instance.

- [ ] **Step 1: Update MonacoEditor to use settings**

```typescript
// apps/frontend/src/components/Editor/MonacoEditor.tsx

import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useSettingsStore } from '../../stores/settingsStore';

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
      // Update editor options when settings change
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

    // Apply initial settings
    const options = getMonacoOptions();
    editor.updateOptions(options);
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
      }}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/Editor/MonacoEditor.tsx
git commit -m "feat(settings): integrate settings with Monaco Editor"
```

---

## Task 9: Add Settings Button to Toolbar

**Files:**
- Modify: `apps/frontend/src/pages/ProjectDetail.tsx` (or Toolbar component)

**Purpose:** Add a settings button to open the settings modal.

- [ ] **Step 1: Add settings button and modal to ProjectDetail**

Add imports at the top of `ProjectDetail.tsx`:

```typescript
import { SettingsModal } from '../../components/Settings';
```

Add state for modal:

```typescript
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
```

Add settings button in the toolbar (near the Compile button):

```typescript
<button
  onClick={() => setIsSettingsOpen(true)}
  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
  title="Settings"
>
  <Settings size={20} />
</button>
```

Add the modal at the end of the component (before closing div):

```typescript
<SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/ProjectDetail.tsx
git commit -m "feat(settings): add settings button to toolbar"
```

---

## Task 10: Apply Compiler Settings to Compilation

**Files:**
- Modify: `apps/frontend/src/hooks/useCompilation.ts`

**Purpose:** Pass compiler settings from the store to the compilation API.

- [ ] **Step 1: Update useCompilation hook**

```typescript
// apps/frontend/src/hooks/useCompilation.ts

import { useSettingsStore } from '../stores/settingsStore';

// In the hook, get compiler settings:
const { compiler } = useSettingsStore();

// When calling compile API, pass the engine:
const startCompilation = async () => {
  // ... existing code ...
  
  const response = await compilationApi.compile(projectId, {
    engine: compiler.defaultEngine,
    synctex: compiler.synctex,
    draft: compiler.draftMode,
    shellEscape: compiler.shellEscape,
    args: compiler.additionalArgs,
  });
  
  // ... rest of code ...
};
```

- [ ] **Step 2: Update compilationApi service if needed**

Ensure `apps/frontend/src/services/compilationApi.ts` accepts these options:

```typescript
interface CompileOptions {
  engine?: string;
  synctex?: boolean;
  draft?: boolean;
  shellEscape?: boolean;
  args?: string[];
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/useCompilation.ts apps/frontend/src/services/compilationApi.ts
git commit -m "feat(settings): apply compiler settings to compilation workflow"
```

---

## Task 11: Apply UI Settings (Theme, File Tree)

**Files:**
- Modify: `apps/frontend/src/App.tsx` (theme handling)
- Modify: `apps/frontend/src/components/FileTree.tsx` (show hidden files)

**Purpose:** Apply UI settings like theme and file visibility.

- [ ] **Step 1: Add theme handling to App.tsx**

```typescript
// In App.tsx
import { useSettingsStore } from './stores/settingsStore';
import { useEffect } from 'react';

function App() {
  const { ui } = useSettingsStore();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (ui.theme === 'dark') {
        root.classList.add('dark');
      } else if (ui.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (ui.theme === 'system') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [ui.theme]);

  // ... rest of App component ...
}
```

- [ ] **Step 2: Update FileTree to respect showHiddenFiles setting**

```typescript
// In FileTree.tsx, filter files based on settings
import { useSettingsStore } from '../../stores/settingsStore';

const { ui } = useSettingsStore();

// When rendering files, filter:
const visibleFiles = files.filter((file) => {
  if (!ui.showHiddenFiles && file.name.startsWith('.')) {
    return false;
  }
  if (!ui.showCompiledFiles && isCompiledFile(file.name)) {
    return false;
  }
  return true;
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/App.tsx apps/frontend/src/components/FileTree.tsx
git commit -m "feat(settings): apply UI settings for theme and file visibility"
```

---

## Summary

This implementation plan creates a comprehensive settings system with:

1. **Type-safe settings** with TypeScript interfaces and defaults
2. **Persistent storage** using Zustand + localStorage
3. **Three settings categories**: Editor, Compiler, and UI
4. **Reusable UI components** for consistent settings interface
5. **Full integration** with Monaco Editor, compilation, and theming
6. **Modal-based UI** with tab navigation for easy access

**Files Created:**
- `apps/frontend/src/types/settings.ts`
- `apps/frontend/src/stores/settingsStore.ts`
- `apps/frontend/src/components/Settings/SettingsComponents.tsx`
- `apps/frontend/src/components/Settings/EditorSettings.tsx`
- `apps/frontend/src/components/Settings/CompilerSettings.tsx`
- `apps/frontend/src/components/Settings/UISettings.tsx`
- `apps/frontend/src/components/Settings/SettingsTabs.tsx`
- `apps/frontend/src/components/Settings/SettingsModal.tsx`
- `apps/frontend/src/components/Settings/index.ts`

**Files Modified:**
- `apps/frontend/src/stores/index.ts`
- `apps/frontend/src/components/Editor/MonacoEditor.tsx`
- `apps/frontend/src/pages/ProjectDetail.tsx`
- `apps/frontend/src/hooks/useCompilation.ts`
- `apps/frontend/src/services/compilationApi.ts`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/FileTree.tsx`
