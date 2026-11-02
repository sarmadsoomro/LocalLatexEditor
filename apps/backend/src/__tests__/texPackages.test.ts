/**
 * Finding and installing missing LaTeX packages. A stand-in `tlmgr` script on
 * PATH records its arguments, so no network or real TeX Live is needed.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  adminScript,
  installFailureMessage,
  parseTlmgrSearch,
} from '../services/texPackageService.js';

const HOST = '127.0.0.1:3001';
const token = 'ab'.repeat(32);
const posix = process.platform !== 'win32';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texcraft-pkg-'));
const bin = path.join(root, 'bin');
const tlroot = path.join(root, 'texlive');
const log = path.join(root, 'tlmgr.log');
process.env.LATEX_EDITOR_PROJECTS_DIR = path.join(root, 'projects');
fs.mkdirSync(process.env.LATEX_EDITOR_PROJECTS_DIR);

const STUB = `#!/bin/sh
echo "$@" >> "$TLMGR_LOG"
case "$1" in
  --version) echo "tlmgr revision 1"; echo "tlmgr using installation: $TLROOT" ;;
  search) printf 'tlmgr: package repository https://example.org (verified)\\nalgorithms:\\n\\ttexmf-dist/tex/latex/algorithms/algorithmic.sty\\n' ;;
  install)
    if [ -f "$TLROOT/needself" ] && [ ! -f "$TLROOT/selfdone" ]; then echo "tlmgr itself needs to be updated"; exit 1; fi
    if [ "$2" = "nosuchpkg" ]; then echo "tlmgr install: package nosuchpkg not present in repository."; exit 1; fi
    echo "[1/1] install: $2" ;;
  update) touch "$TLROOT/selfdone" ;;
esac
`;

let app: Express;
const savedPath = process.env.PATH;
const post = (url: string, body: object): request.Test =>
  request(app).post(url).set('Host', HOST).set('X-TexCraft-Token', token).send(body);
const calls = (): string[] => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : []);

beforeAll(async () => {
  fs.mkdirSync(bin);
  fs.mkdirSync(tlroot);
  fs.writeFileSync(path.join(bin, 'tlmgr'), STUB, { mode: 0o755 });
  process.env.PATH = `${bin}${path.delimiter}${savedPath ?? ''}`;
  process.env.TLMGR_LOG = log;
  process.env.TLROOT = tlroot;
  const mod = await import('../index.js');
  app = mod.createApp(token, 3001);
});

afterAll(() => {
  process.env.PATH = savedPath;
});

beforeEach(() => {
  fs.rmSync(log, { force: true });
  process.env.TLROOT = tlroot;
  fs.chmodSync(tlroot, 0o755);
  for (const f of ['needself', 'selfdone']) fs.rmSync(path.join(tlroot, f), { force: true });
});

describe('parseTlmgrSearch', () => {
  it('finds the package that ships the file', () => {
    const out = 'tlmgr: package repository x (verified)\nfoo:\n\ttexmf-dist/tex/latex/foo/bar.sty\nalgorithms:\n\ttexmf-dist/tex/latex/algorithms/algorithmic.sty\n';
    expect(parseTlmgrSearch(out, 'algorithmic.sty')).toBe('algorithms');
    expect(parseTlmgrSearch(out, 'lipsum.sty')).toBeNull();
  });

  it('does not match a file that only ends with the same name', () => {
    expect(parseTlmgrSearch('x:\n\ttexmf-dist/tex/latex/x/notlipsum.sty\n', 'lipsum.sty')).toBeNull();
  });
});

describe('adminScript', () => {
  it('builds the macOS admin command from the tlmgr path and package', () => {
    expect(adminScript('/Library/TeX/texbin/tlmgr', 'lipsum')).toBe(
      'do shell script "\'/Library/TeX/texbin/tlmgr\' install lipsum || (\'/Library/TeX/texbin/tlmgr\' update --self && \'/Library/TeX/texbin/tlmgr\' install lipsum)" with administrator privileges',
    );
  });
});

describe('installFailureMessage', () => {
  it('explains an outdated TeX Live', () => {
    expect(installFailureMessage('lipsum', 'Local TeX Live (2023) is older than remote repository (2025).')).toMatch(/older than the online/);
  });
  it('explains an unknown package', () => {
    expect(installFailureMessage('x', 'package x not present in repository.')).toMatch(/no package with that name/);
  });
});

describe.skipIf(!posix)('POST /api/system/packages', () => {
  it('rejects a file name that is not a package file', async () => {
    for (const file of ['chapter1.tex', '../evil.sty', 'a b.sty', '$(rm).sty', "x'.sty"]) {
      const res = await post('/api/system/packages/lookup', { file });
      expect(res.status, file).toBe(400);
    }
    expect(calls()).toEqual([]);
  });

  it('rejects a package name with shell characters', async () => {
    const res = await post('/api/system/packages/install', { file: 'lipsum.sty', package: 'lipsum;rm -rf ~' });
    expect(res.status).toBe(400);
    expect(calls()).toEqual([]);
  });

  it('finds the package for a file and installs it when TeX Live is writable', async () => {
    const lookup = await post('/api/system/packages/lookup', { file: 'algorithmic.sty' });
    expect(lookup.status).toBe(200);
    expect(lookup.body.data.lookup).toMatchObject({
      package: 'algorithms',
      manager: 'tlmgr',
      method: 'install',
      command: 'tlmgr install algorithms',
    });

    const res = await post('/api/system/packages/install', { file: 'algorithmic.sty', package: 'algorithms' });
    expect(res.status).toBe(200);
    expect(calls()).toContain('install algorithms');
  });

  it('updates tlmgr itself first when it asks to', async () => {
    fs.writeFileSync(path.join(tlroot, 'needself'), '');
    const res = await post('/api/system/packages/install', { file: 'lipsum.sty', package: 'lipsum' });
    expect(res.status).toBe(200);
    const c = calls();
    expect(c.indexOf('update --self')).toBeGreaterThan(-1);
    expect(c.lastIndexOf('install lipsum')).toBeGreaterThan(c.indexOf('update --self'));
  });

  it('reports a failed install with a readable message', async () => {
    const res = await post('/api/system/packages/install', { file: 'nosuchpkg.sty', package: 'nosuchpkg' });
    expect(res.status).toBe(502);
    expect(res.body.error.message).toMatch(/no package with that name/);
  });

  it.skipIf(process.platform === 'darwin' || process.getuid?.() === 0)(
    'gives a command to run when TeX Live is read-only',
    async () => {
      fs.chmodSync(tlroot, 0o555);
      const lookup = await post('/api/system/packages/lookup', { file: 'lipsum.sty' });
      expect(lookup.body.data.lookup).toMatchObject({ method: 'manual', command: 'sudo tlmgr install lipsum' });
      const res = await post('/api/system/packages/install', { file: 'lipsum.sty', package: 'lipsum' });
      expect(res.status).toBe(409);
      expect(calls()).not.toContain('install lipsum');
    },
  );

  it('points Debian and Ubuntu TeX Live to apt', async () => {
    process.env.TLROOT = '/usr/share/texlive';
    const lookup = await post('/api/system/packages/lookup', { file: 'lipsum.sty' });
    expect(lookup.body.data.lookup).toMatchObject({ method: 'manual', command: 'sudo apt install texlive-latex-extra' });
    const res = await post('/api/system/packages/install', { file: 'lipsum.sty', package: 'lipsum' });
    expect(res.status).toBe(409);
    expect(calls().some((c) => c.startsWith('install'))).toBe(false);
  });
});
