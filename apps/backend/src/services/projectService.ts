import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type {
  ProjectWithMetadata,
  CreateProjectRequest,
  FileNode,
  Template,
} from '@local-latex-editor/shared-types';
import { storageConfig, getProjectPath } from '../config/storage.js';
import { buildFileTree, getProjectStats } from './fileSystemService.js';
import { getTemplate } from './templates.js';
import { ValidationError, NotFoundError, ConflictError } from '../types/error.js';

const PROJECTS_METADATA_FILE = path.join(storageConfig.projectsDir, '..', 'projects.json');
const PROJECTS_CACHE_TTL_MS = 3000;

interface StoredProject extends ProjectWithMetadata {}

let projectsMetadataCache: StoredProject[] | null = null;
let projectsMetadataCacheAt = 0;

async function loadProjectsMetadata(forceRefresh = false): Promise<StoredProject[]> {
  const cachedProjects = projectsMetadataCache;
  const cacheIsFresh =
    !forceRefresh &&
    cachedProjects !== null &&
    Date.now() - projectsMetadataCacheAt < PROJECTS_CACHE_TTL_MS;

  if (cacheIsFresh && cachedProjects) {
    return cachedProjects;
  }

  try {
    const data = await fs.readFile(PROJECTS_METADATA_FILE, 'utf-8');
    const parsed = JSON.parse(data) as StoredProject[];
    projectsMetadataCache = parsed;
    projectsMetadataCacheAt = Date.now();
    return parsed;
  } catch {
    projectsMetadataCache = [];
    projectsMetadataCacheAt = Date.now();
    return [];
  }
}

async function saveProjectsMetadata(projects: StoredProject[]): Promise<void> {
  await fs.mkdir(path.dirname(PROJECTS_METADATA_FILE), { recursive: true });
  
  const tempFile = `${PROJECTS_METADATA_FILE}.tmp.${nanoid()}`;
  const jsonContent = JSON.stringify(projects, null, 2);
  
  try {
    await fs.writeFile(tempFile, jsonContent, 'utf-8');
    await fs.rename(tempFile, PROJECTS_METADATA_FILE);
    projectsMetadataCache = projects;
    projectsMetadataCacheAt = Date.now();
  } catch (error) {
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw error;
  }
}

export async function listProjects(): Promise<ProjectWithMetadata[]> {
  return loadProjectsMetadata();
}

export async function getProject(id: string): Promise<ProjectWithMetadata> {
  const projects = await loadProjectsMetadata();
  const project = projects.find((p) => p.id === id);
  
  if (!project) {
    throw new NotFoundError('Project', id);
  }
  
  return project;
}

export async function createProject(request: CreateProjectRequest): Promise<ProjectWithMetadata> {
  const { name, template = 'article' } = request;
  
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Project name is required');
  }
  
  if (name.length > 100) {
    throw new ValidationError('Project name must be less than 100 characters');
  }
  
  const invalidChars = /[<>:"\/\\|?*]/;
  if (invalidChars.test(name)) {
    throw new ValidationError('Project name contains invalid characters');
  }
  
  const projects = await loadProjectsMetadata();
  const existingProject = projects.find((p) => p.name === name);
  
  if (existingProject) {
    throw new ConflictError(`Project with name "${name}" already exists`);
  }
  
  const id = `proj_${nanoid(12)}`;
  const projectPath = getProjectPath(id);
  
  await fs.mkdir(projectPath, { recursive: true });
  await fs.mkdir(path.join(projectPath, 'assets'), { recursive: true });
  
  const mainFileName = 'main.tex';
  const mainFilePath = path.join(projectPath, mainFileName);
  const templateContent = getTemplate(template);
  
  if (templateContent) {
    await fs.writeFile(mainFilePath, templateContent, 'utf-8');
  } else {
    await fs.writeFile(mainFilePath, '', 'utf-8');
  }
  
  const now = new Date().toISOString();
  const stats = await getProjectStats(projectPath);
  
  const project: ProjectWithMetadata = {
    id,
    name: name.trim(),
    path: projectPath,
    createdAt: now,
    updatedAt: now,
    metadata: {
      mainFile: mainFileName,
      template: template as Template,
      lastOpened: new Date(),
      fileCount: stats.fileCount,
      totalSize: stats.totalSize,
    },
    settings: {
      compiler: 'pdflatex',
      outputDirectory: './output',
    },
  };
  
  projects.push(project);
  await saveProjectsMetadata(projects);
  
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  const project = projects[projectIndex];
  
  try {
    await fs.rm(project.path, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to delete project directory:', error);
  }
  
  projects.splice(projectIndex, 1);
  await saveProjectsMetadata(projects);
}

export async function importProject(sourcePath: string, name: string): Promise<ProjectWithMetadata> {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Project name is required');
  }
  
  try {
    await fs.access(sourcePath);
  } catch {
    throw new ValidationError(`Source path "${sourcePath}" does not exist`);
  }
  
  const stats = await fs.stat(sourcePath);
  if (!stats.isDirectory()) {
    throw new ValidationError('Source path must be a directory');
  }
  
  const projects = await loadProjectsMetadata();
  const existingProject = projects.find((p) => p.name === name);
  
  if (existingProject) {
    throw new ConflictError(`Project with name "${name}" already exists`);
  }
  
  const id = `proj_${nanoid(12)}`;
  const projectPath = getProjectPath(id);
  
  await fs.mkdir(projectPath, { recursive: true });
  
  await copyDirectory(sourcePath, projectPath);
  
  const projectStats = await getProjectStats(projectPath);
  const mainFile = await detectMainFile(projectPath);
  
  const now = new Date().toISOString();
  
  const project: ProjectWithMetadata = {
    id,
    name: name.trim(),
    path: projectPath,
    createdAt: now,
    updatedAt: now,
    metadata: {
      mainFile,
      template: 'empty',
      lastOpened: new Date(),
      fileCount: projectStats.fileCount,
      totalSize: projectStats.totalSize,
    },
    settings: {
      compiler: 'pdflatex',
      outputDirectory: './output',
    },
  };
  
  projects.push(project);
  await saveProjectsMetadata(projects);
  
  return project;
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

async function detectMainFile(projectPath: string): Promise<string> {
  const commonNames = ['main.tex', 'document.tex', 'thesis.tex', 'paper.tex'];
  
  for (const name of commonNames) {
    try {
      await fs.access(path.join(projectPath, name));
      return name;
    } catch {
      continue;
    }
  }
  
  const entries = await fs.readdir(projectPath);
  const texFiles = entries.filter((e) => e.endsWith('.tex'));
  
  if (texFiles.length > 0) {
    return texFiles[0];
  }
  
  return 'main.tex';
}

export async function getProjectFiles(id: string): Promise<FileNode[]> {
  const project = await getProject(id);
  return buildFileTree(project.path);
}

export async function updateProjectLastOpened(id: string): Promise<void> {
  const projects = await loadProjectsMetadata();
  const project = projects.find((p) => p.id === id);
  
  if (project) {
    project.metadata.lastOpened = new Date();
    await saveProjectsMetadata(projects);
  }
}

export async function updateLastOpened(projectId: string): Promise<ProjectWithMetadata> {
  const projects = await loadProjectsMetadata();
  const project = projects.find((p) => p.id === projectId);
  
  if (!project) {
    throw new NotFoundError('Project', projectId);
  }
  
  project.metadata.lastOpened = new Date();
  project.updatedAt = new Date().toISOString();
  await saveProjectsMetadata(projects);
  
  return project;
}

export async function renameProject(id: string, newName: string): Promise<ProjectWithMetadata> {
  // Validate name format
  if (!newName || newName.trim().length === 0) {
    throw new ValidationError('Project name is required');
  }
  
  if (newName.length > 100) {
    throw new ValidationError('Project name must be less than 100 characters');
  }
  
  const invalidChars = /[<>:"\/\\|?*]/;
  if (invalidChars.test(newName)) {
    throw new ValidationError('Project name contains invalid characters');
  }
  
  const projects = await loadProjectsMetadata();
  const projectIndex = projects.findIndex((p) => p.id === id);
  
  if (projectIndex === -1) {
    throw new NotFoundError('Project', id);
  }
  
  // Check for name conflicts (case-insensitive, exclude self)
  const trimmedName = newName.trim();
  const existingProject = projects.find(
    (p) => p.id !== id && p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  
  if (existingProject) {
    throw new ConflictError(`Project with name "${trimmedName}" already exists`);
  }
  
  // Update project
  const project = projects[projectIndex];
  project.name = trimmedName;
  project.updatedAt = new Date().toISOString();
  
  await saveProjectsMetadata(projects);
  
  return project;
}
