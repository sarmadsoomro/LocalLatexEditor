import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Settings, EditorSettings, CompilerSettings, UISettings, SyntaxThemeId } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends Settings {
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  updateCompilerSettings: (settings: Partial<CompilerSettings>) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  resetSettings: () => void;
  resetEditorSettings: () => void;
  resetCompilerSettings: () => void;
  resetUISettings: () => void;
  getMonacoOptions: () => Record<string, unknown>;
  updateSyntaxTheme: (theme: SyntaxThemeId) => void;
  getCurrentSyntaxTheme: () => SyntaxThemeId;
}

const STORAGE_KEY = 'latex-editor-settings';

/** Saved compiler settings minus keys that no longer exist (synctex, draftMode, ...). */
function pickKnown(defaults: CompilerSettings, saved: Partial<CompilerSettings> | undefined): CompilerSettings {
  const merged = { ...defaults };
  if (!saved) return merged;
  for (const key of Object.keys(defaults) as Array<keyof CompilerSettings>) {
    if (saved[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = saved[key];
    }
  }
  return merged;
}

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

      updateSyntaxTheme: (theme) =>
        set((state) => ({
          editor: { ...state.editor, syntaxTheme: theme },
        })),

      getCurrentSyntaxTheme: () => get().editor.syntaxTheme,
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Deep-merge each section so settings added in a new version get their
      // defaults instead of being undefined for people with saved settings.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Settings>;
        const editor = { ...current.editor, ...saved.editor };
        // Version 1 had no 'auto' theme and defaulted to LaTeX Light, which left a
        // white editor in dark mode. Move people still on that default to 'auto'.
        if ((saved.version ?? 1) < 2 && editor.syntaxTheme === 'latex-light') {
          editor.syntaxTheme = 'auto';
        }
        return {
          ...current,
          editor,
          compiler: pickKnown(current.compiler, saved.compiler),
          ui: { ...current.ui, ...saved.ui },
        };
      },
      partialize: (state) => ({
        editor: state.editor,
        compiler: state.compiler,
        ui: state.ui,
        version: state.version,
      }),
    }
  )
);

export const selectEditorSettings = (state: SettingsState) => state.editor;
export const selectCompilerSettings = (state: SettingsState) => state.compiler;
export const selectUISettings = (state: SettingsState) => state.ui;