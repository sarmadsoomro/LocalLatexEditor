import { promises as fs } from 'fs';
import path from 'path';

const PROJECTS_DIR = process.env.LATEX_EDITOR_PROJECTS_DIR || path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.latex-editor',
  'projects'
);

export const storageConfig = {
  projectsDir: PROJECTS_DIR,
  tempDir: path.join(PROJECTS_DIR, '..', 'temp'),
};

export async function ensureStorageDirectories(): Promise<void> {
  await fs.mkdir(storageConfig.projectsDir, { recursive: true });
  await fs.mkdir(storageConfig.tempDir, { recursive: true });
}

export function getProjectPath(projectId: string): string {
  return path.join(storageConfig.projectsDir, projectId);
}

export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
