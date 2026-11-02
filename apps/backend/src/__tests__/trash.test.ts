/**
 * DELETE /api/projects/:id/permanent removes the project's folder and its entry.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-trash-'));
process.env.LATEX_EDITOR_PROJECTS_DIR = path.join(root, 'projects');
fs.mkdirSync(process.env.LATEX_EDITOR_PROJECTS_DIR);

const HOST = '127.0.0.1:3001';
const token = 'cd'.repeat(32);
let app: Express;

const call = (method: 'delete' | 'get', url: string): request.Test =>
  request(app)[method](url).set('Host', HOST).set('X-TexCraft-Token', token);

async function trashedProject(name: string): Promise<{ id: string; path: string }> {
  const { createProject, deleteProject } = await import('../services/projectService.js');
  const project = await createProject({ name, template: 'article' });
  await deleteProject(project.id);
  return { id: project.id, path: project.path };
}

async function listed(id: string): Promise<boolean> {
  const { loadProjectsMetadata } = await import('../services/projectService.js');
  return (await loadProjectsMetadata()).some((p) => p.id === id);
}

beforeAll(async () => {
  const mod = await import('../index.js');
  app = mod.createApp(token, 3001);
});

describe('DELETE /api/projects/:id/permanent', () => {
  it('deletes the project folder and removes it from the list', async () => {
    const p = await trashedProject('to delete');
    fs.mkdirSync(path.join(p.path, 'chapters'));
    fs.writeFileSync(path.join(p.path, 'chapters', 'one.tex'), 'x');
    const res = await call('delete', `/api/projects/${p.id}/permanent`);
    expect(res.status).toBe(200);
    expect(fs.existsSync(p.path)).toBe(false);
    expect(await listed(p.id)).toBe(false);
  });

  it('removes the entry when the folder is already gone', async () => {
    const p = await trashedProject('folder gone');
    fs.rmSync(p.path, { recursive: true });
    const res = await call('delete', `/api/projects/${p.id}/permanent`);
    expect(res.status).toBe(200);
    expect(await listed(p.id)).toBe(false);
  });

  it('never deletes a folder outside the projects directory', async () => {
    const p = await trashedProject('outside');
    const outside = path.join(root, 'precious');
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, 'keep.tex'), 'x');
    const { loadProjectsMetadata, saveProjectsMetadata } = await import('../services/projectService.js');
    const projects = await loadProjectsMetadata();
    const entry = projects.find((x) => x.id === p.id);
    if (!entry) throw new Error('missing entry');
    entry.path = outside;
    await saveProjectsMetadata(projects);

    const res = await call('delete', `/api/projects/${p.id}/permanent`);
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(outside, 'keep.tex'))).toBe(true);
    expect(await listed(p.id)).toBe(false);
  });

  it('refuses a project that is not in the trash', async () => {
    const { createProject } = await import('../services/projectService.js');
    const project = await createProject({ name: 'not trashed', template: 'article' });
    const res = await call('delete', `/api/projects/${project.id}/permanent`);
    expect(res.status).toBe(409);
    expect(fs.existsSync(project.path)).toBe(true);
  });
});

describe('isOwnProjectFolder', () => {
  it('accepts only proj_ folders directly inside the projects directory', async () => {
    const { isOwnProjectFolder } = await import('../services/trashService.js');
    const dir = process.env.LATEX_EDITOR_PROJECTS_DIR as string;
    expect(isOwnProjectFolder(path.join(dir, 'proj_abc123'))).toBe(true);
    expect(isOwnProjectFolder(dir)).toBe(false);
    expect(isOwnProjectFolder(path.join(dir, 'proj_abc', 'sub'))).toBe(false);
    expect(isOwnProjectFolder(path.join(dir, '..'))).toBe(false);
    expect(isOwnProjectFolder(path.join(dir, 'other'))).toBe(false);
    expect(isOwnProjectFolder(os.homedir())).toBe(false);
  });
});
