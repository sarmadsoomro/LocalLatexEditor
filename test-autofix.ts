import { parseLaTeXLog } from './apps/backend/src/services/logParser';

const log = `
This is pdfTeX, Version 3.141592653-2.6-1.40.24 (TeX Live 2022) (preloaded format=pdflatex)
 restricted \\write18 enabled.
entering extended mode
(./main.tex
LaTeX2e <2022-11-01> patch level 1

! Undefined control sequence.
l.12 \\includegraphics
                     {example-image}
The control sequence at the end of the top line
of your error message was never \\def'ed.
`;

const result = parseLaTeXLog(log);
console.log(JSON.stringify(result, null, 2));
