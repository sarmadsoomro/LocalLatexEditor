import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

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

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register LaTeX language if not already registered
      monaco.languages.register({ id: "latex" });

      // Configure LaTeX language settings
      monaco.languages.setLanguageConfiguration("latex", {
        comments: {
          lineComment: "%",
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: "`", close: "'" },
        ],
        surroundingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
      });

      // Add save keyboard shortcut (Ctrl/Cmd + S)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave?.();
      });

      // Focus the editor
      editor.focus();
    },
    [onSave],
  );

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
        }}
        theme="vs"
        loading={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-gray-500">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
