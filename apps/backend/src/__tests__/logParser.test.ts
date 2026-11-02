import { describe, expect, it } from 'vitest';

import { currentFileAt, parseLaTeXLog } from '../services/logParser.js';

// Trimmed from a real pdflatex log.
const LOG = `This is pdfTeX, Version 3.141592653-2.6-1.40.25 (TeX Live 2023/Debian)
(./main.tex
LaTeX2e <2023-11-01> patch level 1
(/usr/share/texlive/texmf-dist/tex/latex/base/article.cls
Document Class: article 2023/05/17 v1.4n Standard LaTeX document class
(/usr/share/texlive/texmf-dist/tex/latex/base/size10.clo))
(output/main.aux)
(./chapters/one.tex
! Undefined control sequence.
l.3 Third line has \\notacommand
                                here.
The control sequence at the end of the top line
of your error message was never \\def'ed.

) [1] (output/main.aux) )
Output written on output/main.pdf (1 page, 13614 bytes).
`;

describe('parseLaTeXLog', () => {
  it('reads the line number when TeX prints source text after l.N', () => {
    const { errors } = parseLaTeXLog(LOG);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Undefined control sequence.');
    expect(errors[0].line).toBe(3);
  });

  it('attributes the error to the file TeX was reading', () => {
    expect(parseLaTeXLog(LOG).errors[0].file).toBe('chapters/one.tex');
  });

  it('still reads a bare l.N line', () => {
    const { errors } = parseLaTeXLog('(./main.tex\n! Missing $ inserted.\n<inserted text>\n$\nl.12\n\n)');
    expect(errors[0].line).toBe(12);
    expect(errors[0].file).toBe('main.tex');
  });
});

describe('currentFileAt', () => {
  it('tracks nested opens and closes', () => {
    const lines = LOG.split('\n');
    expect(currentFileAt(lines, 3)).toBe('main.tex');
    expect(currentFileAt(lines, 4)).toMatch(/article\.cls$/);
    expect(currentFileAt(lines, 6)).toBe('main.tex');
    expect(currentFileAt(lines, 8)).toBe('chapters/one.tex');
  });
});
