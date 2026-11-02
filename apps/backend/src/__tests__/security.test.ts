import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-security-'));
const projectsDir = path.join(root, 'projects');
fs.mkdirSync(projectsDir);
process.env.LATEX_EDITOR_PROJECTS_DIR = projectsDir;

const HOST = '127.0.0.1:3001';
const token = 'ab'.repeat(32);

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function zipStored(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const crc = crc32(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const localRecord = Buffer.concat([local, name, entry.data]);
    locals.push(localRecord);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 38);
    central.writeUInt16LE(0o100644, 40);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += localRecord.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, end]);
}

describe('API security', () => {
  let app: Express;

  beforeAll(async () => {
    const mod = await import('../index.ts');
    app = mod.createApp(token, 3001);
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function call(method: 'get' | 'post', url: string): request.Test {
    return request(app)[method](url).set('Host', HOST).set('X-TexCraft-Token', token);
  }

  it('rejects a missing token', async () => {
    const res = await request(app).get('/api/projects').set('Host', HOST);
    expect(res.status).toBe(401);
  });

  it('rejects a wrong token', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Host', HOST)
      .set('X-TexCraft-Token', 'cd'.repeat(32));
    expect(res.status).toBe(401);
  });

  it('rejects a wrong-length token without crashing', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Host', HOST)
      .set('X-TexCraft-Token', 'short');
    expect(res.status).toBe(401);
  });

  it('rejects a non-loopback Host', async () => {
    const res = await request(app)
      .get('/health')
      .set('Host', 'evil.example:3001')
      .set('X-TexCraft-Token', token);
    expect(res.status).toBe(403);
  });

  it('allows /health without a token', async () => {
    const res = await request(app).get('/health').set('Host', HOST);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects a zip entry that escapes the extract directory', async () => {
    const res = await call('post', '/api/import-zip')
      .field('name', 'Slip')
      .attach('file', zipStored([{ name: '../evil.txt', data: Buffer.from('nope') }]), 'slip.zip');
    expect(res.status).toBe(400);
    expect(fs.existsSync(path.join(root, 'evil.txt'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'temp', 'evil.txt'))).toBe(false);
  });

  it('rejects an absolute zip entry', async () => {
    const res = await call('post', '/api/import-zip')
      .field('name', 'Absolute')
      .attach('file', zipStored([{ name: '/tmp/evil.txt', data: Buffer.from('nope') }]), 'abs.zip');
    expect(res.status).toBe(400);
    expect(fs.existsSync('/tmp/evil.txt')).toBe(false);
  });

  it('rejects a zip with too many entries', async () => {
    const entries = Array.from({ length: 5001 }, (_, i) => ({
      name: `f${i}.tex`,
      data: Buffer.from('x'),
    }));
    const res = await call('post', '/api/import-zip')
      .field('name', 'Too Many')
      .attach('file', zipStored(entries), 'many.zip');
    expect(res.status).toBe(400);
  });

  it('rejects a zip over the uncompressed size limit', async () => {
    process.env.LATEX_EDITOR_ZIP_MAX_BYTES = '8';
    try {
      const res = await call('post', '/api/import-zip')
        .field('name', 'Too Big')
        .attach('file', zipStored([{ name: 'main.tex', data: Buffer.from('0123456789abcdef') }]), 'big.zip');
      expect(res.status).toBe(400);
    } finally {
      delete process.env.LATEX_EDITOR_ZIP_MAX_BYTES;
    }
  });

  it('imports a normal zip', async () => {
    const res = await call('post', '/api/import-zip')
      .field('name', 'Normal Zip')
      .attach('file', zipStored([{ name: 'main.tex', data: Buffer.from('\\documentclass{article}') }]), 'ok.zip');
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.name).toBe('Normal Zip');
  });
});
