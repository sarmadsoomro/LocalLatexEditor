import type * as monaco from 'monaco-editor';

export interface SyntaxTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: monaco.editor.IColors;
  rules: monaco.editor.ITokenThemeRule[];
}

// LaTeX Light Theme (Default)
export const latexLightTheme: SyntaxTheme = {
  id: 'latex-light',
  name: 'LaTeX Light',
  isDark: false,
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#2C2C2C',
    'editor.lineHighlightBackground': '#F5F5F5',
    'editor.selectionBackground': '#ADD6FF',
    'editor.inactiveSelectionBackground': '#E5EBF1',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#2C2C2C',
    'editorCursor.foreground': '#2C2C2C',
    'editorWhitespace.foreground': '#CCCCCC',
  },
  rules: [
    { token: 'comment', foreground: '#008000', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#0000FF', fontStyle: 'bold' },
    { token: 'tag', foreground: '#795E26' },
    { token: 'string', foreground: '#A31515' },
    { token: 'operator', foreground: '#000000', fontStyle: 'bold' },
    { token: 'number', foreground: '#098658' },
    { token: 'variable.parameter', foreground: '#001080' },
    { token: 'delimiter.bracket', foreground: '#0431FA' },
  ],
};

// LaTeX Dark Theme
export const latexDarkTheme: SyntaxTheme = {
  id: 'latex-dark',
  name: 'LaTeX Dark',
  isDark: true,
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editor.lineHighlightBackground': '#2D2D2D',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#D4D4D4',
    'editorCursor.foreground': '#D4D4D4',
    'editorWhitespace.foreground': '#3E3E3E',
  },
  rules: [
    { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#569CD6', fontStyle: 'bold' },
    { token: 'tag', foreground: '#4EC9B0' },
    { token: 'string', foreground: '#CE9178' },
    { token: 'operator', foreground: '#D4D4D4', fontStyle: 'bold' },
    { token: 'number', foreground: '#B5CEA8' },
    { token: 'variable.parameter', foreground: '#9CDCFE' },
    { token: 'delimiter.bracket', foreground: '#FFD700' },
  ],
};

// Dracula Theme
export const draculaTheme: SyntaxTheme = {
  id: 'dracula',
  name: 'Dracula',
  isDark: true,
  colors: {
    'editor.background': '#282A36',
    'editor.foreground': '#F8F8F2',
    'editor.lineHighlightBackground': '#44475A',
    'editor.selectionBackground': '#44475A',
    'editor.inactiveSelectionBackground': '#44475A',
    'editorLineNumber.foreground': '#6272A4',
    'editorLineNumber.activeForeground': '#F8F8F2',
    'editorCursor.foreground': '#F8F8F2',
    'editorWhitespace.foreground': '#44475A',
  },
  rules: [
    { token: 'comment', foreground: '#6272A4', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#FF79C6', fontStyle: 'bold' },
    { token: 'tag', foreground: '#8BE9FD' },
    { token: 'string', foreground: '#F1FA8C' },
    { token: 'operator', foreground: '#FF79C6' },
    { token: 'number', foreground: '#BD93F9' },
    { token: 'variable.parameter', foreground: '#FFB86C' },
    { token: 'delimiter.bracket', foreground: '#F8F8F2' },
  ],
};

// Solarized Dark Theme
export const solarizedDarkTheme: SyntaxTheme = {
  id: 'solarized-dark',
  name: 'Solarized Dark',
  isDark: true,
  colors: {
    'editor.background': '#002B36',
    'editor.foreground': '#839496',
    'editor.lineHighlightBackground': '#073642',
    'editor.selectionBackground': '#073642',
    'editor.inactiveSelectionBackground': '#073642',
    'editorLineNumber.foreground': '#586E75',
    'editorLineNumber.activeForeground': '#839496',
    'editorCursor.foreground': '#839496',
    'editorWhitespace.foreground': '#073642',
  },
  rules: [
    { token: 'comment', foreground: '#586E75', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#268BD2', fontStyle: 'bold' },
    { token: 'tag', foreground: '#B58900' },
    { token: 'string', foreground: '#2AA198' },
    { token: 'operator', foreground: '#DC322F' },
    { token: 'number', foreground: '#D33682' },
    { token: 'variable.parameter', foreground: '#CB4B16' },
    { token: 'delimiter.bracket', foreground: '#93A1A1' },
  ],
};

// One Dark Theme (Atom)
export const oneDarkTheme: SyntaxTheme = {
  id: 'one-dark',
  name: 'One Dark',
  isDark: true,
  colors: {
    'editor.background': '#282C34',
    'editor.foreground': '#ABB2BF',
    'editor.lineHighlightBackground': '#2C313C',
    'editor.selectionBackground': '#3E4451',
    'editor.inactiveSelectionBackground': '#3E4451',
    'editorLineNumber.foreground': '#4B5363',
    'editorLineNumber.activeForeground': '#ABB2BF',
    'editorCursor.foreground': '#528BFF',
    'editorWhitespace.foreground': '#3E4451',
  },
  rules: [
    { token: 'comment', foreground: '#5C6370', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#C678DD', fontStyle: 'bold' },
    { token: 'tag', foreground: '#E06C75' },
    { token: 'string', foreground: '#98C379' },
    { token: 'operator', foreground: '#56B6C2' },
    { token: 'number', foreground: '#D19A66' },
    { token: 'variable.parameter', foreground: '#E5C07B' },
    { token: 'delimiter.bracket', foreground: '#ABB2BF' },
  ],
};

// GitHub Light Theme
export const githubLightTheme: SyntaxTheme = {
  id: 'github-light',
  name: 'GitHub Light',
  isDark: false,
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#24292E',
    'editor.lineHighlightBackground': '#F6F8FA',
    'editor.selectionBackground': '#B4D7FF',
    'editor.inactiveSelectionBackground': '#E1E4E8',
    'editorLineNumber.foreground': '#6A737D',
    'editorLineNumber.activeForeground': '#24292E',
    'editorCursor.foreground': '#24292E',
    'editorWhitespace.foreground': '#E1E4E8',
  },
  rules: [
    { token: 'comment', foreground: '#6A737D', fontStyle: 'italic' },
    { token: 'keyword', foreground: '#D73A49', fontStyle: 'bold' },
    { token: 'tag', foreground: '#22863A' },
    { token: 'string', foreground: '#032F62' },
    { token: 'operator', foreground: '#D73A49' },
    { token: 'number', foreground: '#005CC5' },
    { token: 'variable.parameter', foreground: '#E36209' },
    { token: 'delimiter.bracket', foreground: '#24292E' },
  ],
};

// Export all themes
export const SYNTAX_THEMES: SyntaxTheme[] = [
  latexLightTheme,
  latexDarkTheme,
  draculaTheme,
  solarizedDarkTheme,
  oneDarkTheme,
  githubLightTheme,
];

// Helper to get theme by ID
export function getThemeById(id: string): SyntaxTheme | undefined {
  return SYNTAX_THEMES.find(theme => theme.id === id);
}

// Helper to register all themes with Monaco
export function registerThemes(monaco: typeof import('monaco-editor')): void {
  SYNTAX_THEMES.forEach(theme => {
    monaco.editor.defineTheme(theme.id, {
      base: theme.isDark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: theme.rules,
      colors: theme.colors,
    });
  });
}
