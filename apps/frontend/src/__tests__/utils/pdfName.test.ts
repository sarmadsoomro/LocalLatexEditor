import { describe, expect, it } from 'vitest';

import { pdfNameFor } from '../../utils/pdfName';

describe('pdfNameFor', () => {
  it('names the PDF after the main file', () => {
    expect(pdfNameFor('main.tex')).toBe('main.pdf');
    expect(pdfNameFor('cas-sc-sample.tex')).toBe('cas-sc-sample.pdf');
  });

  it('drops folders, with either separator', () => {
    expect(pdfNameFor('paper/thesis.tex')).toBe('thesis.pdf');
    expect(pdfNameFor('paper\\thesis.TEX')).toBe('thesis.pdf');
  });

  it('falls back to main.pdf', () => {
    expect(pdfNameFor(undefined)).toBe('main.pdf');
    expect(pdfNameFor('')).toBe('main.pdf');
  });
});
