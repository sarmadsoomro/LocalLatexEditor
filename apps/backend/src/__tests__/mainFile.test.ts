/**
 * PUT /api/projects/:id/main-file chooses which .tex file compiles.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-mainfile-'));
process.env.LATEX_EDITOR_PROJECTS_DIR = path.join(root, 'projects');
fs.mkdirSync(process.env.LATEX_EDITOR_PROJECTS_DIR);

const HOST = '127.0.0.1:3001';
const token = 'ef'.repeat(32);
let app: Express;
let projectId = '';

const put = (mainFile: unknown): request.Test =>
  request(app)
    .put(`/api/projects/${projectId}/main-file`)
    .set('Host', HOST)
    .set('X-TexCraft-Token', token)
    .send({ mainFile });

beforeAll(async () => {
  const mod = await import('../index.js');
  app = mod.createApp(token, 3001);
  const { createProject } = await import('../services/projectService.js');
  const project = await createProject({ name: 'main file', template: 'article' });
  projectId = project.id;
  fs.mkdirSync(path.join(project.path, 'paper'));
  fs.writeFileSync(path.join(project.path, 'paper', 'single.tex'), '\\documentclass{article}');
  fs.writeFileSync(path.join(project.path, 'refs.bib'), '');
  fs.writeFileSync(path.join(root, 'outside.tex'), '');
});

describe('PUT /api/projects/:id/main-file', () => {
  it('sets a .tex file in a subfolder and saves it', async () => {
    const res = await put('paper/single.tex');
    expect(res.status).toBe(200);
    expect(res.body.data.project.metadata.mainFile).toBe('paper/single.tex');

    const again = await request(app).get(`/api/projects/${projectId}`).set('Host', HOST).set('X-TexCraft-Token', token);
    expect(again.body.data.project.metadata.mainFile).toBe('paper/single.tex');
  });

  it('rejects a file that is not .tex', async () => {
    expect((await put('refs.bib')).status).toBe(400);
  });

  it('rejects a path outside the project', async () => {
    expect((await put('../../outside.tex')).status).toBe(400);
    expect((await put(path.join(root, 'outside.tex'))).status).toBe(400);
  });

  it('returns 404 for a missing file and 400 for no file', async () => {
    expect((await put('nope.tex')).status).toBe(404);
    expect((await put('')).status).toBe(400);
  });

  it('needs the token', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/main-file`)
      .set('Host', HOST)
      .send({ mainFile: 'main.tex' });
    expect(res.status).toBe(401);
  });
});
