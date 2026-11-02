import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { forwardSearch, inverseSearch, parseSynctex } from '../services/synctexService.js';

// Real pdflatex output for:
//   main.tex:            \section{Intro} (line 3), "First paragraph in main." (line 4), \input{chapters/one} (line 6)
//   chapters/one.tex:    "Line one of chapter." (line 1), "Third line text here." (line 3)
// with the project folder renamed to /proj.
const data = parseSynctex(fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.synctex'), 'utf8'));
const MAIN = path.resolve('/proj/main.tex');
const ONE = path.resolve('/proj/chapters/one.tex');

describe.skipIf(process.platform === 'win32')('synctex parser vs the synctex CLI (TeX Live 2023)', () => {
  it('maps the input tags, removing "/./"', () => {
    expect([...data.inputs.values()]).toContain(MAIN);
    expect([...data.inputs.values()]).toContain(ONE);
  });

  // Expected numbers are what `synctex view -i line:1:file -o main.pdf` printed (h, v, W, H).
  it.each([
    [ONE, 3, 133.768356, 180.49588, 343.71106, 6.918498],
    [MAIN, 4, 133.768356, 158.52272, 343.71106, 8.855677],
    [ONE, 1, 133.768356, 170.47789, 343.71106, 8.855677],
  ])('forward %s:%i matches the CLI', (file, line, h, v, w, height) => {
    const result = forwardSearch(data, file, line)!;
    expect(result.page).toBe(1);
    const r = result.rects[0];
    expect(r.x).toBeCloseTo(h, 3);
    expect(r.y).toBeCloseTo(v - height, 3);
    expect(r.width).toBeCloseTo(w, 3);
  });

  // Expected answers are what `synctex edit -o page:x:y:main.pdf` printed.
  it.each([
    [150, 178, ONE, 3],
    [140, 134, MAIN, 3],
    [300, 169, ONE, 1],
  ])('inverse (%d, %d) matches the CLI', (x, y, file, line) => {
    expect(inverseSearch(data, 1, x, y)).toEqual({ file, line });
  });

  it('maps a blank line to the paragraph that ends there (same as the CLI for main.tex:5)', () => {
    const result = forwardSearch(data, MAIN, 5)!;
    expect(result.rects[0].y).toBeCloseTo(158.52272 - 8.855677, 3);
  });

  it('falls back to the last line with output when the line is past the end', () => {
    const result = forwardSearch(data, ONE, 40)!;
    expect(result.page).toBe(1);
    expect(result.rects[0].y).toBeCloseTo(180.49588 - 6.918498, 3);
  });

  it('returns null for a file that is not part of the document', () => {
    expect(forwardSearch(data, path.resolve('/proj/notes.tex'), 1)).toBeNull();
  });

  it('picks the nearest line when the click is in the margin', () => {
    const result = inverseSearch(data, 1, 20, 179);
    expect(result).toEqual({ file: ONE, line: 3 });
  });

  it('skips files the caller does not accept', () => {
    // pretend chapters/one.tex were outside the project: fall back to the enclosing box from main.tex
    const result = inverseSearch(data, 1, 150, 178, (f) => f === MAIN);
    expect(result?.file).toBe(MAIN);
  });

  it('returns null for a page without content', () => {
    expect(inverseSearch(data, 99, 100, 100)).toBeNull();
  });
});
