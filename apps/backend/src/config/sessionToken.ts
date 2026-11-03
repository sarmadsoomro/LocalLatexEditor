import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SESSION_TOKEN_PLACEHOLDER = '__TEXCRAFT_SESSION_TOKEN__';

export function sessionTokenFile(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.latex-editor', '.session-token');
}

/**
 * Token handed over by the desktop app (TEXCRAFT_SESSION_TOKEN). The desktop
 * shell adds it to each request itself, so it never appears in the page, where
 * any program that can reach 127.0.0.1 could read it.
 */
export function shellSessionToken(): string | null {
  const token = process.env.TEXCRAFT_SESSION_TOKEN ?? '';
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
}

export function createSessionToken(): string {
  const fromShell = shellSessionToken();
  if (fromShell) return fromShell;
  const token = crypto.randomBytes(32).toString('hex');
  const file = sessionTokenFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${token}\n`, { mode: 0o600 });
  fs.chmodSync(file, 0o600);
  return token;
}

export function injectSessionToken(html: string, token: string): string {
  return html.replaceAll(SESSION_TOKEN_PLACEHOLDER, token);
}
