/**
 * Real compiles. These need a TeX installation and are skipped without one,
 * unless TEXCRAFT_REQUIRE_TEX=1 (set in CI's compile job), which makes a
 * missing TeX a failure instead of a silent skip.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-compile-'));
process.env.LATEX_EDITOR_PROJECTS_DIR = path.join(root, 'projects');
fs.mkdirSync(process.env.LATEX_EDITOR_PROJECTS_DIR);

function installed(cmd: string): boolean {
  return spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0;
}

const hasTex = installed('pdflatex');
const hasLatexmkBin = installed('latexmk');
const hasBiber = installed('biber');
const isPosix = process.platform !== 'win32';

if (process.env.TEXCRAFT_REQUIRE_TEX === '1' && !(hasTex && hasLatexmkBin && hasBiber)) {
  throw new Error('TEXCRAFT_REQUIRE_TEX=1 but pdflatex, latexmk or biber is missing');
}

// Imported in beforeAll, after LATEX_EDITOR_PROJECTS_DIR is set: storage reads it at load time.
type ServiceModule = typeof import('../services/compilationService.js');
type ProjectsModule = typeof import('../services/projectService.js');
const svc = {} as {
  compileProject: ServiceModule['compileProject'];
  resetLatexmkCheck: ServiceModule['resetLatexmkCheck'];
  detectBibliography: ServiceModule['detectBibliography'];
};
const projects = {} as { createProject: ProjectsModule['createProject'] };
let counter = 0;

async function makeProject(files: Record<string, string>): Promise<{ id: string; dir: string }> {
  counter += 1;
  const project = await projects.createProject({ name: `compile test ${counter}`, template: 'empty' });
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(project.path, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return { id: project.id, dir: project.path };
}

const ARTICLE = String.raw`\documentclass{article}
\begin{document}
\section{Intro}\label{s:intro}
Hello from section~\ref{s:intro}.
\end{document}
`;

const BIBLATEX = String.raw`\documentclass{article}
\usepackage[backend=biber]{biblatex}
\addbibresource{refs/library.bib}
\begin{document}
As shown by \cite{knuth1984}.
\printbibliography
\end{document}
`;

const BIB = `@book{knuth1984,
  author = {Donald E. Knuth},
  title = {The TeXbook},
  year = {1984},
  publisher = {Addison-Wesley}
}
`;

/** About 150 pages split over \input chapters, with cross-references and a TOC. */
function longDocument(): Record<string, string> {
  const sentence =
    'This sentence exists to fill pages so that the compile behaves like a real thesis chapter with plenty of text. ';
  const paragraph = sentence.repeat(9);
  const files: Record<string, string> = {};
  const inputs: string[] = [];
  for (let c = 1; c <= 15; c++) {
    const body: string[] = [`\\section{Chapter ${c}}\\label{ch:${c}}`];
    for (let s = 1; s <= 5; s++) {
      body.push(`\\subsection{Part ${c}.${s}}`);
      for (let p = 0; p < 6; p++) body.push(paragraph, '');
      body.push(`See section~\\ref{ch:${c === 1 ? 15 : c - 1}} and equation \\eqref{eq:${c}-${s}}.`);
      body.push(`\\begin{equation}\\label{eq:${c}-${s}} e^{i\\pi} + ${c} = ${s} \\end{equation}`);
    }
    if (c === 8) body.push('MARKER alpha');
    files[`chapters/ch${c}.tex`] = body.join('\n');
    inputs.push(`\\input{chapters/ch${c}}`);
  }
  files['main.tex'] = [
    '\\documentclass{article}',
    '\\usepackage{amsmath}',
    '\\begin{document}',
    '\\tableofcontents',
    ...inputs,
    '\\end{document}',
    '',
  ].join('\n');
  return files;
}

beforeAll(async () => {
  const service = await import('../services/compilationService.js');
  svc.compileProject = service.compileProject;
  svc.resetLatexmkCheck = service.resetLatexmkCheck;
  svc.detectBibliography = service.detectBibliography;
  projects.createProject = (await import('../services/projectService.js')).createProject;
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe.skipIf(!hasTex || !hasLatexmkBin)('compileProject with latexmk', () => {
  it('builds a PDF and a SyncTeX file', async () => {
    const { id, dir } = await makeProject({ 'main.tex': ARTICLE });
    const result = await svc.compileProject(id);
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(dir, 'output', 'main.pdf'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'output', 'main.synctex.gz'))).toBe(true);
  }, 120_000);

  it.skipIf(!hasBiber)('runs biber for biblatex with a .bib in a subfolder', async () => {
    const { id, dir } = await makeProject({ 'main.tex': BIBLATEX, 'refs/library.bib': BIB });
    const result = await svc.compileProject(id);
    expect(result.success).toBe(true);
    const bbl = fs.readFileSync(path.join(dir, 'output', 'main.bbl'), 'utf8');
    expect(bbl).toContain('knuth1984');
    expect(result.warnings.some((w) => /undefined/i.test(w.message))).toBe(false);
  }, 120_000);

  it('reports the file and line of an error inside an \\input file', async () => {
    const { id } = await makeProject({
      'main.tex': '\\documentclass{article}\n\\begin{document}\n\\input{chapters/one}\n\\end{document}\n',
      'chapters/one.tex': 'First line.\n\nThird line has \\notacommand here.\n',
    });
    const result = await svc.compileProject(id);
    expect(result.success).toBe(false);
    const err = result.errors[0];
    expect(err.message).toMatch(/Undefined control sequence/);
    expect(err.line).toBe(3);
    expect(err.file ?? '').toMatch(/one(\.tex)?$/);
  }, 120_000);

  it('handles \\include into subfolders', async () => {
    const { id } = await makeProject({
      'main.tex': '\\documentclass{report}\n\\begin{document}\n\\tableofcontents\n\\include{chapters/intro}\n\\end{document}\n',
      'chapters/intro.tex': '\\chapter{Intro}\\label{c:intro}See chapter~\\ref{c:intro}.\n',
    });
    const result = await svc.compileProject(id);
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
  }, 120_000);

  it('recompiles a one-line change in a long document faster than a clean build', async () => {
    const { id, dir } = await makeProject(longDocument());

    const clean = await svc.compileProject(id, { clean: true, timeoutMs: 600_000 });
    expect(clean.errors).toEqual([]);
    expect(clean.success).toBe(true);

    // Same-length edit: page breaks and labels stay put, as with most typing.
    const ch = path.join(dir, 'chapters', 'ch8.tex');
    fs.writeFileSync(ch, fs.readFileSync(ch, 'utf8').replace('MARKER alpha', 'MARKER gamma'));

    const incremental = await svc.compileProject(id, { timeoutMs: 600_000 });
    expect(incremental.success).toBe(true);

    console.log(
      `[timing] ~150-page document: clean build ${clean.duration} ms, incremental after one-line change ${incremental.duration} ms`,
    );
    expect(incremental.duration).toBeLessThan(clean.duration);
  }, 600_000);

  it('rebuilds automatically when a stale .aux breaks the compile', async () => {
    const { id, dir } = await makeProject({ 'main.tex': ARTICLE });
    expect((await svc.compileProject(id)).success).toBe(true);

    fs.writeFileSync(path.join(dir, 'output', 'main.aux'), '\\relax\n\\newlabel{s:intro}{{1}{1}\n\\@broken{\n');
    fs.appendFileSync(path.join(dir, 'main.tex'), '% touched\n');

    const result = await svc.compileProject(id);
    expect(result.success).toBe(true);
    expect(result.logOutput).toContain('rebuilt from scratch');
  }, 120_000);

  it.skipIf(!isPosix)('stops at the timeout and kills the whole process tree', async () => {
    const { id, dir } = await makeProject({
      'main.tex': '\\documentclass{article}\n\\begin{document}\n\\def\\spin{\\spin}\\spin\n\\end{document}\n',
    });
    await expect(svc.compileProject(id, { timeoutMs: 3000 })).rejects.toThrow(/timed out after 3 seconds/);
    await new Promise((r) => setTimeout(r, 500));
    const ps = execFileSync('ps', ['-eo', 'args']).toString();
    expect(ps.includes(dir)).toBe(false);
  }, 60_000);

  it.skipIf(!isPosix)('passes -shell-escape only when asked', async () => {
    const doc =
      '\\documentclass{article}\n\\begin{document}\n\\immediate\\write18{touch escaped-marker}\nx\n\\end{document}\n';
    const off = await makeProject({ 'main.tex': doc });
    await svc.compileProject(off.id);
    expect(fs.existsSync(path.join(off.dir, 'escaped-marker'))).toBe(false);

    const on = await makeProject({ 'main.tex': doc });
    await svc.compileProject(on.id, { shellEscape: true });
    expect(fs.existsSync(path.join(on.dir, 'escaped-marker'))).toBe(true);
  }, 120_000);
});

describe.skipIf(!hasTex || !hasBiber)('compileProject without latexmk (fallback)', () => {
  beforeAll(() => {
    process.env.TEXCRAFT_DISABLE_LATEXMK = '1';
    svc.resetLatexmkCheck();
  });
  afterAll(() => {
    delete process.env.TEXCRAFT_DISABLE_LATEXMK;
    svc.resetLatexmkCheck();
  });

  it('builds a biblatex document with manual passes', async () => {
    const { id, dir } = await makeProject({ 'main.tex': BIBLATEX, 'refs/library.bib': BIB });
    const result = await svc.compileProject(id);
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(fs.readFileSync(path.join(dir, 'output', 'main.bbl'), 'utf8')).toContain('knuth1984');
    expect(fs.existsSync(path.join(dir, 'output', 'main.synctex.gz'))).toBe(true);
  }, 120_000);
});

describe('detectBibliography', () => {
  it('detects biber, bibtex, and ignores commented-out lines', async () => {
    const dir = fs.mkdtempSync(path.join(root, 'bib-'));
    const check = async (content: string): Promise<string | null> => {
      fs.writeFileSync(path.join(dir, 'main.tex'), content);
      return svc.detectBibliography(dir, 'main.tex');
    };
    expect(await check('\\usepackage[style=apa]{biblatex}')).toBe('biber');
    expect(await check('\\usepackage[backend=bibtex]{biblatex}')).toBe('bibtex');
    expect(await check('\\bibliography{refs}')).toBe('bibtex');
    expect(await check('% \\bibliography{refs}\nno bib here')).toBe(null);
  });
});
