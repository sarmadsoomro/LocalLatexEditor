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