import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildFileTree } from '../services/fileSystemService.js';
import { folderError } from '../services/projectService.js';
import { AppError } from '../types/error.js';

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'texcraft-tree-'));
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('buildFileTree', () => {
  it('lists folders first, then files', async () => {
    await fs.mkdir(path.join(dir, 'chapters'));
    await fs.writeFile(path.join(dir, 'chapters', 'one.tex'), 'x');
    await fs.writeFile(path.join(dir, 'main.tex'), 'x');

    const tree = await buildFileTree(dir);
    expect(tree.map((n) => n.name)).toEqual(['chapters', 'main.tex']);
    expect(tree[0].children?.map((n) => n.path)).toEqual([path.join('chapters', 'one.tex')]);
  });

  it.skipIf(process.platform === 'win32')('skips a broken symlink instead of failing', async () => {
    await fs.writeFile(path.join(dir, 'main.tex'), 'x');
    await fs.symlink(path.join(dir, 'gone.tex'), path.join(dir, 'broken.tex'));

    const tree = await buildFileTree(dir);
    expect(tree.map((n) => n.name)).toEqual(['main.tex']);
  });

  it.skipIf(process.platform === 'win32')('does not follow a symlinked folder into a loop', async () => {
    await fs.symlink(dir, path.join(dir, 'loop'));

    const tree = await buildFileTree(dir);
    expect(tree).toEqual([expect.objectContaining({ name: 'loop', type: 'directory', children: [] })]);
  });
});

describe('folderError', () => {
  it('explains a missing project folder', async () => {
    const missing = path.join(dir, 'nope');
    const error = await buildFileTree(missing).catch((e: unknown) => folderError(e, missing));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('PROJECT_FOLDER_MISSING');
    expect((error as AppError).statusCode).toBe(404);
    expect((error as AppError).message).toContain(missing);
  });

  it('explains a permission error', () => {
    const error = folderError(Object.assign(new Error('x'), { code: 'EPERM' }), '/somewhere');
    expect((error as AppError).code).toBe('PERMISSION_DENIED');
    expect((error as AppError).statusCode).toBe(403);
  });

  it('passes other errors through', () => {
    const original = new Error('boom');
    expect(folderError(original, '/x')).toBe(original);
  });
});
