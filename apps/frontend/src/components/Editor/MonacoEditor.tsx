import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useSettingsStore } from "../../stores/settingsStore";
import { latexLanguageConfig, latexTokenizer } from "../../editor/latexTokenizer";
import { bibtexLanguageConfig, bibtexTokenizer } from "../../editor/bibtexTokenizer";
import { registerThemes } from "../../editor/latexThemes";

export interface MonacoEditorProps {
  content: string;
  language?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function MonacoEditor({
  content,
  language = "latex",
  onChange,
  onSave,
  readOnly = false,
  className = "",
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);

  const getMonacoOptions = useSettingsStore((state) => state.getMonacoOptions);
  const settingsOptions = useSettingsStore((state) => state.getMonacoOptions());
  const syntaxTheme = useSettingsStore((state) => state.editor.syntaxTheme);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register LaTeX language if not already registered
      if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === "latex")) {
        monaco.languages.register({ id: "latex" });
      }

      // Register BibTeX language if not already registered
      if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === "bibtex")) {
        monaco.languages.register({ id: "bibtex" });
      }

      // Set language configuration
      monaco.languages.setLanguageConfiguration("latex", latexLanguageConfig);
      monaco.languages.setLanguageConfiguration("bibtex", bibtexLanguageConfig);

      // Set Monarch tokenizer for syntax highlighting
      monaco.languages.setMonarchTokensProvider("latex", latexTokenizer);
      monaco.languages.setMonarchTokensProvider("bibtex", bibtexTokenizer);

      // Register all syntax themes
      registerThemes(monaco);

      // Apply current theme
      monaco.editor.setTheme(syntaxTheme);

      // Force tokenization refresh
      const model = editor.getModel();
      if (model) {
        monaco.editor.tokenize(model.getValue(), "latex");
      }

      // Update editor options
      editor.updateOptions(getMonacoOptions());

      // Add save keyboard shortcut (Ctrl/Cmd + S)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave?.();
      });

      // Focus the editor
      editor.focus();
    },
    [onSave, getMonacoOptions, syntaxTheme],
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(getMonacoOptions());
    }
  }, [settingsOptions, getMonacoOptions]);

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        onChange?.(value);
      }
    },
    [onChange],
  );

  // Update editor value when content prop changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== content) {
        editorRef.current.setValue(content);
      }
    }
  }, [content]);

  // Listen for syntax theme changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(syntaxTheme);
    }
  }, [syntaxTheme]);

  // Don't set model markers - rely on LogViewer for error display

  return (
    <div className={`h-full w-full relative ${className}`}>
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: "on",
          tabSize: 2,
          fontSize: 16,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineNumbers: "on",
          renderLineHighlight: "line",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          folding: true,
          foldingStrategy: "indentation",
          renderWhitespace: "selection",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          padding: { top: 8, bottom: 8 },
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          ...getMonacoOptions(),
        }}
        theme={syntaxTheme}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-gray-500">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
