import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-token-'));
const dist = path.join(root, 'dist');
fs.mkdirSync(dist);
fs.writeFileSync(
  path.join(dist, 'index.html'),
  '<script>window.__TEXCRAFT_TOKEN__="__TEXCRAFT_SESSION_TOKEN__";</script>',
);
process.env.TEXCRAFT_FRONTEND_DIST = dist;
process.env.LATEX_EDITOR_PROJECTS_DIR = path.join(root, 'projects');

const HOST = '127.0.0.1:3001';
const token = 'ef'.repeat(32);
const savedHome = process.env.HOME;

afterEach(() => {
  delete process.env.TEXCRAFT_SESSION_TOKEN;
  process.env.HOME = savedHome;
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('token in the served page', () => {
  it('is in the page by default, for the browser version', async () => {
    const { createApp } = await import('../index.js');
    const res = await request(createApp(token, 3001)).get('/').set('Host', HOST);
    expect(res.status).toBe(200);
    expect(res.text).toContain(token);
  });

  it('is left out when the desktop app adds it to requests itself', async () => {
    const { createApp } = await import('../index.js');
    const app = createApp(token, 3001, { tokenInPage: false });
    const page = await request(app).get('/').set('Host', HOST);
    expect(page.status).toBe(200);
    expect(page.text).not.toContain(token);
    expect(page.text).toContain('window.__TEXCRAFT_TOKEN__=""');
    // so a program that only loads the page cannot call the API
    const api = await request(app).get('/api/projects').set('Host', HOST);
    expect(api.status).toBe(401);
  });
});

describe('token handed over by the desktop app', () => {
  it('is used as is and not written to disk', async () => {
    const home = fs.mkdtempSync(path.join(root, 'home-'));
    process.env.HOME = home;
    process.env.TEXCRAFT_SESSION_TOKEN = token;
    const { createSessionToken, shellSessionToken } = await import('../config/sessionToken.js');
    expect(shellSessionToken()).toBe(token);
    expect(createSessionToken()).toBe(token);
    expect(fs.existsSync(path.join(home, '.latex-editor', '.session-token'))).toBe(false);
  });

  it('is ignored unless it is 64 hex characters', async () => {
    const home = fs.mkdtempSync(path.join(root, 'home-'));
    process.env.HOME = home;
    process.env.TEXCRAFT_SESSION_TOKEN = 'short';
    const { createSessionToken, shellSessionToken } = await import('../config/sessionToken.js');
    expect(shellSessionToken()).toBeNull();
    const created = createSessionToken();
    expect(created).toMatch(/^[0-9a-f]{64}$/);
    expect(created).not.toBe('short');
  });
});
