export type SyntaxThemeId = 
  | 'latex-light' 
  | 'latex-dark' 
  | 'dracula' 
  | 'solarized-dark' 
  | 'one-dark' 
  | 'github-light';

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
  syntaxTheme: SyntaxThemeId; // Syntax highlighting theme
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
  confirmCloseUnsaved: boolean; // Show warning when closing unsaved files, default true
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
    syntaxTheme: 'latex-light',
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
