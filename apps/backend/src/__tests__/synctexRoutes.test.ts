/**
 * SyncTeX over HTTP on real compiles. Skipped without TeX, like compile.test.ts.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-synctex-'));
process.env.LATEX_EDITOR_PROJECTS_DIR = path.join(root, 'projects');
fs.mkdirSync(process.env.LATEX_EDITOR_PROJECTS_DIR);

const hasTex =
  spawnSync('pdflatex', ['--version'], { stdio: 'ignore' }).status === 0 &&
  spawnSync('latexmk', ['--version'], { stdio: 'ignore' }).status === 0;
if (process.env.TEXCRAFT_REQUIRE_TEX === '1' && !hasTex) {
  throw new Error('TEXCRAFT_REQUIRE_TEX=1 but pdflatex or latexmk is missing');
}

const hasSynctexCli = spawnSync('synctex', ['help'], { stdio: 'ignore' }).error === undefined;

const HOST = '127.0.0.1:3001';
const token = 'cd'.repeat(32);
let app: Express;
let projectId = '';
let projectDir = '';

// Three chapters in a subfolder, long enough to span several pages.
function chapter(n: number): string {
  const lines = [`\\section{Chapter ${n}}`];
  for (let p = 1; p <= 12; p++) {
    lines.push(`Paragraph ${p} of chapter ${n}. ` + 'Filler words make this paragraph span a few lines of output. '.repeat(6), '');
  }
  return lines.join('\n');
}

const get = (url: string): request.Test => request(app).get(url).set('Host', HOST).set('X-TexCraft-Token', token);

beforeAll(async () => {
  if (!hasTex) return;
  const mod = await import('../index.js');
  app = mod.createApp(token, 3001);
  const { createProject } = await import('../services/projectService.js');
  const { compileProject } = await import('../services/compilationService.js');
  const project = await createProject({ name: 'synctex routes', template: 'empty' });
  projectId = project.id;
  projectDir = project.path;
  fs.mkdirSync(path.join(project.path, 'chapters'));
  fs.writeFileSync(
    path.join(project.path, 'main.tex'),
    '\\documentclass{article}\n\\begin{document}\n\\input{chapters/ch1}\n\\input{chapters/ch2}\n\\input{chapters/ch3}\n\\end{document}\n',
  );
  for (const n of [1, 2, 3]) fs.writeFileSync(path.join(project.path, 'chapters', `ch${n}.tex`), chapter(n));
  const result = await compileProject(projectId);
  expect(result.success).toBe(true);
}, 120_000);

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe.skipIf(!hasTex)('SyncTeX routes on a real compile', () => {
  it('round-trips source -> PDF -> source across files and pages', async () => {
    const pagesSeen = new Set<number>();
    for (const [file, line] of [
      ['chapters/ch1.tex', 3],
      ['chapters/ch2.tex', 11],
      ['chapters/ch3.tex', 23],
      ['chapters/ch3.tex', 1],
    ] as const) {
      const fwd = await get(`/api/projects/${projectId}/synctex/forward?file=${file}&line=${line}`);
      expect(fwd.status).toBe(200);
      const { page, rects } = fwd.body.data;
      pagesSeen.add(page);
      const r = rects[0];
      // click in the middle of the first highlighted box
      const inv = await get(
        `/api/projects/${projectId}/synctex/inverse?page=${page}&x=${r.x + r.width / 2}&y=${r.y + r.height / 2}`,
      );
      expect(inv.status).toBe(200);
      expect(inv.body.data.file).toBe(file);
      // a paragraph spans several source lines' worth of output; TeX tags lines within a paragraph loosely
      expect(Math.abs(inv.body.data.line - line)).toBeLessThanOrEqual(1);
    }
    expect(pagesSeen.size).toBeGreaterThan(1);
  });

  // Compare with the reference implementation on every line of a chapter.
  it.skipIf(!hasSynctexCli)('agrees with the synctex CLI on every line, both directions', async () => {
    const cliView = (file: string, line: number): { page: number; v: number } => {
      const out = execFileSync('synctex', ['view', '-i', `${line}:1:${file}`, '-o', 'output/main.pdf'], { cwd: projectDir }).toString();
      return { page: Number(out.match(/^Page:(\d+)/m)![1]), v: Number(out.match(/^v:([\d.]+)/m)![1]) };
    };
    const cliEdit = (page: number, x: number, y: number): { file: string; line: number } => {
      const out = execFileSync('synctex', ['edit', '-o', `${page}:${x}:${y}:output/main.pdf`], { cwd: projectDir }).toString();
      const file = path.relative(projectDir, path.resolve(out.match(/^Input:(.*)$/m)![1])).split(path.sep).join('/');
      return { file, line: Number(out.match(/^Line:(\d+)/m)![1]) };
    };

    let forwardChecked = 0;
    let inverseChecked = 0;
    for (const file of ['chapters/ch2.tex', 'chapters/ch3.tex']) {
      // line 1 is the \section, even lines are paragraphs, odd lines > 1 are blank
      // (on blank lines the CLI itself is inconsistent about which neighbour it picks)
      for (const line of [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]) {
        const res = await get(`/api/projects/${projectId}/synctex/forward?file=${file}&line=${line}`);
        expect(res.status).toBe(200);
        const ours = res.body.data as { page: number; rects: Array<{ x: number; y: number; width: number; height: number }> };
        const cli = cliView(file, line);
        // the CLI's box must be one of the boxes we highlight
        expect(ours.page, `${file}:${line} page`).toBe(cli.page);
        expect(
          ours.rects.some((r) => Math.abs(r.y + r.height - cli.v) < 4 || (cli.v >= r.y && cli.v <= r.y + r.height + 4)),
          `${file}:${line} CLI baseline ${cli.v} not in ${JSON.stringify(ours.rects.map((r) => [r.y, r.height]))}`,
        ).toBe(true);
        forwardChecked++;

        for (const r of ours.rects) {
          const x = r.x + r.width / 3;
          const y = r.y + r.height / 2;
          const inv = await get(`/api/projects/${projectId}/synctex/inverse?page=${ours.page}&x=${x}&y=${y}`);
          expect(inv.status).toBe(200);
          expect(inv.body.data, `inverse at page ${ours.page} (${x}, ${y})`).toEqual(cliEdit(ours.page, x, y));
          inverseChecked++;
        }
      }
    }
    expect(forwardChecked).toBe(26);
    expect(inverseChecked).toBeGreaterThan(26);
  });

  it('rejects paths outside the project', async () => {
    const res = await get(`/api/projects/${projectId}/synctex/forward?file=../../etc/passwd&line=1`);
    expect(res.status).toBe(400);
  });

  it('returns 404 for a file that is not in the document', async () => {
    const res = await get(`/api/projects/${projectId}/synctex/forward?file=notes.tex&line=1`);
    expect(res.status).toBe(404);
  });

  it('validates the query', async () => {
    const res = await get(`/api/projects/${projectId}/synctex/inverse?page=0&x=a&y=1`);
    expect(res.status).toBe(400);
  });

  it('requires the API token', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/synctex/inverse?page=1&x=1&y=1`).set('Host', HOST);
    expect(res.status).toBe(401);
  });

  it('returns 404 before the first compile', async () => {
    const { createProject } = await import('../services/projectService.js');
    const fresh = await createProject({ name: 'never compiled', template: 'empty' });
    const res = await get(`/api/projects/${fresh.id}/synctex/inverse?page=1&x=1&y=1`);
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/Compile the project first/);
  });
});
