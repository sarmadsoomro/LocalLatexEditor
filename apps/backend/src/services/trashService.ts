import type { ProjectWithMetadata } from '@local-latex-editor/shared-types';
import { NotFoundError } from '../types/error.js';
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

export async function permanentlyDeleteProject(id: string): Promise<void> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);

  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }

  if (!projects[projectIndex].metadata.deletedAt) {
    throw new Error('Project must be in trash before permanent deletion');
  }

  // Remove from metadata
  projects.splice(projectIndex, 1);
  await saveProjectsMetadata(projects);

  // Note: We intentionally do not delete files from disk
  // to allow for potential data recovery. Files can be cleaned up separately.
}
