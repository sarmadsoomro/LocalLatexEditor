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
 */
export const bibtexTokenizer: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.bibtex',

  // Entry types in BibTeX
  entryTypes: [
    'article', 'book', 'booklet', 'conference', 'inbook', 'incollection',
    'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis',
    'proceedings', 'techreport', 'unpublished', 'string', 'preamble', 'comment'
  ],

  // Common fields in BibTeX
  fields: [
    'address', 'annote', 'author', 'booktitle', 'chapter', 'crossref',
    'doi', 'edition', 'editor', 'eprint', 'howpublished', 'institution',
    'journal', 'key', 'month', 'note', 'number', 'organization', 'pages',
    'publisher', 'school', 'series', 'title', 'type', 'url', 'volume', 'year'
  ],

  tokenizer: {
    root: [
      // Comments: % to end of line (less common in BibTeX but valid)
      [/%.*$/, 'comment'],

      // Entry type: @article, @book, etc.
      [/(@)([a-zA-Z]+)/, {
        cases: {
          '@comment': ['operator', 'comment'],
          '@preamble': ['operator', 'keyword'],
          '@string': ['operator', 'keyword'],
          '@entryTypes': ['operator', 'keyword'],
          '@default': ['operator', 'keyword']
        }
      }],

      // Citation key: @article{key123,
      [/{([a-zA-Z0-9_:.+\/-]+)/, 'tag'],

      // Fields: author =, title =, etc.
      [/([a-zA-Z]+)(\s*)(=)/, {
        cases: {
          '@fields': ['variable.parameter', 'white', 'operator'],
          '@default': ['identifier', 'white', 'operator']
        }
      }],

      // String values in braces
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
      [/"/, { token: 'string', next: '@pop' }],
      [/\\./, 'string.escape'],
      [/[^\\"]+/, 'string'],
    ],

    stringBraced: [
      [/\}/, { token: 'string', next: '@pop' }],
      [/\{/, { token: 'string', next: '@stringBraced' }],
      [/\\./, 'string.escape'],
      [/[^\\{}]+/, 'string'],
    ],
  },
};
