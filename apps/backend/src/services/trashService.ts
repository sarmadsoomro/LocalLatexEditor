import { promises as fs } from 'fs';
import path from 'path';

import type { ProjectWithMetadata } from '@local-latex-editor/shared-types';

import { storageConfig } from '../config/storage.js';
import { AppError, NotFoundError } from '../types/error.js';

import { loadProjectsMetadata, saveProjectsMetadata } from './projectService.js';

export async function listTrashedProjects(): Promise<ProjectWithMetadata[]> {
  const projects = await loadProjectsMetadata();
  return projects
    .filter((p) => p.metadata.deletedAt !== null && p.metadata.deletedAt !== undefined)
    .sort((a, b) => {
      const dateA = new Date(a.metadata.deletedAt!).getTime();
      const dateB = new Date(b.metadata.deletedAt!).getTime();
      return dateB - dateA; // Most recently deleted first
    });
}

export async function restoreProject(id: string): Promise<ProjectWithMetadata> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);

  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }

  if (!projects[projectIndex].metadata.deletedAt) {
    throw new Error('Project is not in trash');
  }

  const updatedProject = {
    ...projects[projectIndex],
    metadata: {
      ...projects[projectIndex].metadata,
      deletedAt: null,
    },
    updatedAt: new Date().toISOString(),
  };

  projects[projectIndex] = updatedProject;
  await saveProjectsMetadata(projects);

  return updatedProject;
}

/**
 * Whether `folder` is a project folder TexCraft created: a direct child of the
 * projects directory named proj_<id>. Anything else is never deleted.
 */
export function isOwnProjectFolder(folder: string): boolean {
  const rel = path.relative(path.resolve(storageConfig.projectsDir), path.resolve(folder));
  return /^proj_[A-Za-z0-9_-]+$/.test(rel);
}

/**
 * Remove a project from the trash for good: its folder and all files in it,
 * then its entry in the list. A folder that is already gone is fine.
 */
export async function permanentlyDeleteProject(id: string): Promise<void> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);

  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }

  const project = projects[projectIndex];
  if (!project.metadata.deletedAt) {
    throw new AppError('NOT_IN_TRASH', 'Move the project to the trash before deleting it permanently', 409);
  }

  // Delete the files first: if that fails, the project stays in the trash and
  // the user can try again, instead of leaving an orphaned folder behind.
  if (isOwnProjectFolder(project.path)) {
    try {
      await fs.rm(project.path, { recursive: true, force: true });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      throw new AppError(
        'DELETE_FAILED',
        code === 'EACCES' || code === 'EPERM'
          ? `TexCraft is not allowed to delete ${project.path}. Delete the folder yourself, then try again.`
          : `Could not delete ${project.path}: ${(error as Error).message}`,
        code === 'EACCES' || code === 'EPERM' ? 403 : 500,
      );
    }
  }

  projects.splice(projectIndex, 1);
  await saveProjectsMetadata(projects);
}
