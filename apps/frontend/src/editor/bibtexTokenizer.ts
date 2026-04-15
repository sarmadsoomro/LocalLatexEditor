import type * as monaco from 'monaco-editor';

/**
 * BibTeX language configuration for Monaco Editor
 */
export const bibtexLanguageConfig: monaco.languages.LanguageConfiguration = {
  brackets: [
    ['{', '}'],
    ['(', ')'],
    ['"', '"'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
};

/**
 * Monarch tokenizer for BibTeX syntax highlighting
 * Simplified to avoid Monarch attribute issues
 */
export const bibtexTokenizer: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.bibtex',

  tokenizer: {
    root: [
      // Comments: % to end of line
      [/%.*$/, 'comment'],

      // @comment{...} - comment entry (special handling)
      [/@[cC][oO][mM][mM][eE][nN][tT]/, 'comment'],

      // @preamble{...} - preamble entry
      [/@[pP][rR][eE][aA][mM][bB][lL][eE]/, 'keyword'],

      // @string{...} - string entry
      [/@[sS][tT][rR][iI][nN][gG]/, 'keyword'],

      // Standard entry types: @article, @book, etc.
      [/@[aA][rR][tT][iI][cC][lL][eE]/, 'keyword'],
      [/@[bB][oO][oO][kK]/, 'keyword'],
      [/@[bB][oO][oO][kK][lL][eE][tT]/, 'keyword'],
      [/@[cC][oO][nN][fF][eE][rR][eE][nN][cC][eE]/, 'keyword'],
      [/@[iI][nN][bB][oO][oO][kK]/, 'keyword'],
      [/@[iI][nN][cC][oO][lL][lL][eE][cC][tT][iI][oO][nN]/, 'keyword'],
      [/@[iI][nN][pP][rR][oO][cC][eE][eE][dD][iI][nN][gG][sS]/, 'keyword'],
      [/@[mM][aA][nN][uU][aA][lL]/, 'keyword'],
      [/@[mM][aA][sS][tT][eE][rR][sS][tT][hH][eE][sS][iI][sS]/, 'keyword'],
      [/@[mM][iI][sS][cC]/, 'keyword'],
      [/@[pP][hH][dD][tT][hH][eE][sS][iI][sS]/, 'keyword'],
      [/@[pP][rR][oO][cC][eE][eE][dD][iI][nN][gG][sS]/, 'keyword'],
      [/@[tT][eE][cC][hH][rR][eE][pP][oO][rR][tT]/, 'keyword'],
      [/@[uU][nN][pP][uU][bB][lL][iI][sS][hH][eE][dD]/, 'keyword'],

      // Catch any other @ entry types
      [/@/, 'operator'],

      // Citation key: @article{key123,
      [/{([a-zA-Z0-9_:.+\/-]+)/, 'tag'],

      // Common BibTeX fields (case-insensitive)
      [/author/i, 'variable.parameter'],
      [/title/i, 'variable.parameter'],
      [/journal/i, 'variable.parameter'],
      [/year/i, 'variable.parameter'],
      [/volume/i, 'variable.parameter'],
      [/pages/i, 'variable.parameter'],
      [/doi/i, 'variable.parameter'],
      [/url/i, 'variable.parameter'],
      [/publisher/i, 'variable.parameter'],
      [/editor/i, 'variable.parameter'],
      [/booktitle/i, 'variable.parameter'],
      [/address/i, 'variable.parameter'],
      [/month/i, 'variable.parameter'],
      [/note/i, 'variable.parameter'],
      [/number/i, 'variable.parameter'],
      [/series/i, 'variable.parameter'],
      [/type/i, 'variable.parameter'],
      [/chapter/i, 'variable.parameter'],
      [/institution/i, 'variable.parameter'],
      [/school/i, 'variable.parameter'],
      [/howpublished/i, 'variable.parameter'],
      [/organization/i, 'variable.parameter'],
      [/key/i, 'variable.parameter'],
      [/annote/i, 'variable.parameter'],
      [/crossref/i, 'variable.parameter'],
      [/edition/i, 'variable.parameter'],
      [/eprint/i, 'variable.parameter'],

      // Equals sign after field
      [/=/, 'operator'],

      // String values in braces or quotes
      [/"/, { token: 'string', next: '@stringDouble' }],
      [/{/, { token: 'string', next: '@stringBraced' }],

      // Numbers
      [/-?\d+/, 'number'],

      // Concatenation operator: #
      [/#/, 'operator'],

      // Delimiters
      [/\{/, 'delimiter.bracket'],
      [/\}/, 'delimiter.bracket'],
      [/\(/, 'delimiter.parenthesis'],
      [/\)/, 'delimiter.parenthesis'],
      [/,/, 'delimiter.comma'],

      // Whitespace
      [/\s+/, 'white'],
    ],

    stringDouble: [
      // Escaped quote: \"
      [/\\"/, 'string.escape'],
      // Other escaped characters
      [/\\./, 'string.escape'],
      // Any characters except quote and backslash (including braces)
      [/[^\\"]/, 'string'],
      // Closing quote
      [/"/, { token: 'string', next: '@pop' }],
    ],

    stringBraced: [
      // Match LaTeX commands with their brace arguments as a unit FIRST
      // This handles \"{a}, \'{e}, \^{o}, etc.
      [/\\["'\^`~=.][ \t]*\{[^}]*\}/, 'string.escape'],
      // Match escaped characters: \", \{, \}, etc.
      [/\\./, 'string.escape'],
      // Closing brace - pops back to root (must come before generic [])
      [/\}/, { token: 'string', next: '@pop' }],
      // Opening brace - part of string content
      [/\{/, 'string'],
      // Any other character
      [/[^\\{}]/, 'string'],
    ],
  },
};
