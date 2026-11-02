import type { CompilationError } from '@local-latex-editor/shared-types';
import { describe, expect, it } from 'vitest';

import { missingPackageFiles } from '../../utils/missingPackages';

const err = (message: string): CompilationError => ({ line: 0, column: 0, message, type: 'error' });

describe('missingPackageFiles', () => {
  it('finds missing package and class files', () => {
    expect(
      missingPackageFiles([
        err("LaTeX Error: File `lipsum.sty' not found."),
        err("LaTeX Error: File `cas-dc.cls' not found."),
        err("LaTeX Error: File `lipsum.sty' not found."),
        err('Undefined control sequence.'),
      ]),
    ).toEqual(['lipsum.sty', 'cas-dc.cls']);
  });

  it('ignores missing .tex files and odd names', () => {
    expect(missingPackageFiles([err("LaTeX Error: File `chapter1.tex' not found.")])).toEqual([]);
    expect(missingPackageFiles([err("LaTeX Error: File `../x.sty' not found.")])).toEqual([]);
  });
});
