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
 * Simplified version to avoid state issues
 */
export const latexTokenizer: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.latex',

  tokenizer: {
    root: [
      // Comments: % to end of line
      [/%.*$/, 'comment'],

      // Escaped dollar sign \$ - treat as literal text, NOT math mode
      [/\\\$/, 'string'],

      // Display math: $$...$$
      [/\$\$/, { token: 'string', next: '@mathDisplay' }],

      // Inline math: $...$ (but not $$ which is caught above, and not \$ which is escaped)
      [/\$(?!\$)/, { token: 'string', next: '@mathInline' }],

      // Environment names after \begin{ or \end{
      [/(\\(?:begin|end))(\{)([a-zA-Z@*]+)(\})/, 
        ['keyword', 'delimiter.bracket', 'tag', 'delimiter.bracket']],

      // Control sequences: \command (includes starred versions like \section*)
      [/\\[a-zA-Z@]+\*?/, 'keyword'],

      // Parameters: #1, #2, etc.
      [/#\d+/, 'variable.parameter'],

      // Special characters - using string literals to avoid regex escaping issues
      { regex: /&/, action: { token: 'operator' } },
      { regex: /\\/, action: { token: 'operator' } },
      { regex: /#/, action: { token: 'operator' } },
      { regex: /\^/, action: { token: 'operator' } },
      { regex: /_/, action: { token: 'operator' } },
      { regex: /\~/, action: { token: 'operator' } },
      
      // Brackets
      { regex: /\{/, action: { token: 'delimiter.bracket' } },
      { regex: /\}/, action: { token: 'delimiter.bracket' } },
      { regex: /\[/, action: { token: 'delimiter.bracket' } },
      { regex: /\]/, action: { token: 'delimiter.bracket' } },

      // Numbers with units
      [/-?\d+\.?\d*(?:cm|mm|pt|em|ex|sp|bp|dd|pc|in|px|%)?/, 'number'],

      // Strings in quotes
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
    ],

    mathInline: [
      // Escaped dollar sign inside math mode
      [/\\\$/, 'string'],
      // End of inline math (but not escaped)
      [/\$(?!\$)/, { token: 'string', next: '@pop' }],
      // Other escaped characters
      [/\\./, 'operator'],
      // Everything else in math mode
      [/[^\\$]+/, 'string'],
    ],

    mathDisplay: [
      // Escaped dollar sign inside math mode
      [/\\\$/, 'string'],
      // End of display math
      [/\$\$/, { token: 'string', next: '@pop' }],
      // Other escaped characters
      [/\\./, 'operator'],
      // Everything else in math mode
      [/[^\\$]+/, 'string'],
    ],
  },
};
