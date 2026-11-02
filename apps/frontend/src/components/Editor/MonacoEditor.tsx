import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useRef, useCallback, useEffect } from "react";

// side effect: point @monaco-editor/react at the bundled Monaco (no CDN, works offline)
import "../../editor/monacoSetup";
import { bibtexLanguageConfig, bibtexTokenizer } from "../../editor/bibtexTokenizer";
import { registerThemes } from "../../editor/latexThemes";
import { latexLanguageConfig, latexTokenizer } from "../../editor/latexTokenizer";
import { useSettingsStore } from "../../stores/settingsStore";
import { samePath, useSyncStore } from "../../stores/syncStore";

export interface MonacoEditorProps {
  content: string;
  language?: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  className?: string;
  /** Project-relative path of the file being edited (for PDF sync). */
  path?: string;
  /** Jump to this line's location in the PDF (SyncTeX). */
  onGoToPdf?: () => void;
}

export function MonacoEditor({
  content,
  language = "latex",
  onChange,
  onSave,
  readOnly = false,
  className = "",
  path,
  onGoToPdf,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  // refs so editor callbacks registered once at mount see current values
  const pathRef = useRef(path);
  pathRef.current = path;
  const onGoToPdfRef = useRef(onGoToPdf);
  onGoToPdfRef.current = onGoToPdf;
  const setCursor = useSyncStore((state) => state.setCursor);
  const reveal = useSyncStore((state) => state.reveal);
  const handledRevealRef = useRef(0);
  const flashRef = useRef<editor.IEditorDecorationsCollection | null>(null);

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

      // PDF sync: publish the cursor line, and "Show in PDF" (Alt+J, right-click menu)
      editor.onDidChangeCursorPosition((e) => {
        if (pathRef.current) setCursor(pathRef.current, e.position.lineNumber);
      });
      const position = editor.getPosition();
      if (pathRef.current && position) setCursor(pathRef.current, position.lineNumber);
      editor.addAction({
        id: "texcraft.showInPdf",
        label: "Show in PDF",
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyJ],
        contextMenuGroupId: "navigation",
        contextMenuOrder: 0,
        run: () => onGoToPdfRef.current?.(),
      });

      // Focus the editor
      editor.focus();
    },
    [onSave, getMonacoOptions, syntaxTheme, setCursor],
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

  // PDF sync: reveal a line requested from the PDF once this file's content is loaded
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !reveal || reveal.nonce === handledRevealRef.current) return;
    if (!path || !samePath(reveal.path, path) || ed.getValue() !== content) return;
    handledRevealRef.current = reveal.nonce;
    const line = Math.min(Math.max(reveal.line, 1), ed.getModel()?.getLineCount() ?? 1);
    ed.setPosition({ lineNumber: line, column: 1 });
    ed.revealLineInCenter(line);
    ed.focus();
    flashRef.current?.clear();
    flashRef.current = ed.createDecorationsCollection([
      { range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 }, options: { isWholeLine: true, className: "synctex-line-flash" } },
    ]);
    const timer = setTimeout(() => flashRef.current?.clear(), 1800);
    return () => clearTimeout(timer);
  }, [reveal, path, content]);

  // Keep the published cursor's file in sync when switching tabs
  useEffect(() => {
    const pos = editorRef.current?.getPosition();
    if (path && pos) setCursor(path, pos.lineNumber);
  }, [path, content, setCursor]);

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
