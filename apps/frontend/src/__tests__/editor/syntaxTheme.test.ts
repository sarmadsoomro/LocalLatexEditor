import { describe, expect, it } from 'vitest';

import { resolveSyntaxTheme } from '../../editor/latexThemes';

describe('resolveSyntaxTheme', () => {
  it('follows the app theme for auto', () => {
    expect(resolveSyntaxTheme('auto', false)).toBe('latex-light');
    expect(resolveSyntaxTheme('auto', true)).toBe('latex-dark');
  });

  it('keeps a theme the user picked, in either mode', () => {
    expect(resolveSyntaxTheme('dracula', false)).toBe('dracula');
    expect(resolveSyntaxTheme('github-light', true)).toBe('github-light');
  });

  it('falls back to LaTeX Light for an unknown id', () => {
    expect(resolveSyntaxTheme('gone-theme', true)).toBe('latex-light');
  });
});
