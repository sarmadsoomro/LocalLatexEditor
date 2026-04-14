import { parseLaTeXLog } from './src/services/logParser';

const log = `
This is pdfTeX
(./main.tex
! Undefined control sequence.
l.12 \\bgn
         {document}
`;

const result = parseLaTeXLog(log);
console.log(JSON.stringify(result, null, 2));
