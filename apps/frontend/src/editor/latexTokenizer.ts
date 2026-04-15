import type * as monaco from 'monaco-editor';

/**
 * LaTeX language configuration for Monaco Editor
 */
export const latexLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '%',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

/**
 * Monarch tokenizer for LaTeX syntax highlighting
 */
export const latexTokenizer: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.latex',

  tokenizer: {
    root: [
      // Comments: % to end of line
      [/%.*$/, 'comment'],

      // Display math: $$...$$
      [/\$\$/, { token: 'string', next: '@mathDisplay' }],

      // Inline math: $...$
      [/\$/, { token: 'string', next: '@mathInline' }],

      // Environment names after \begin{ or \end{
      [/(\\(?:begin|end))(\{)([a-zA-Z@*]+)(\})/, 
        ['keyword', 'delimiter.bracket', 'tag', 'delimiter.bracket']],

      // Control sequences with brackets: \command[opt]{arg}
      [/(\\[a-zA-Z@]+)(\*?)(?:(\[))/, {
        cases: {
          '$1': ['keyword', 'keyword', { token: 'delimiter.bracket', next: '@optArg' }],
        }
      }],

      // Control sequences: \command
      [/\\[a-zA-Z@]+\*?/, 'keyword'],

      // Special characters
      [/[&\\#^_{}~$]/, 'operator'],

      // Parameters: #1, #2, etc.
      [/#\d+/, 'variable.parameter'],

      // Numbers with units
      [/-?\d+\.?\d*(?:cm|mm|pt|em|ex|sp|bp|dd|pc|in|px|%)?/, 'number'],

      // Strings in quotes
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],

      // Brackets
      [/[{}]/, 'delimiter.bracket'],
      [/[\[\]]/, 'delimiter.bracket'],
    ],

    mathInline: [
      [/\$/, { token: 'string', next: '@pop' }],
      [/\\./, 'operator'],
      [/[^\\$]+/, 'string'],
    ],

    mathDisplay: [
      [/\$\$/, { token: 'string', next: '@pop' }],
      [/\\./, 'operator'],
      [/[^\\$]+/, 'string'],
    ],

    optArg: [
      [/\]/, { token: 'delimiter.bracket', next: '@pop' }],
      [/[^\]]+/, 'string'],
    ],
  },
};
