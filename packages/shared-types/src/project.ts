import type { Project } from './index';

export type Template = 'article' | 'report' | 'book' | 'beamer' | 'letter' | 'empty';

export type ProjectStatus = 'draft' | 'in_progress' | 'published';

export interface ProjectMetadata {
  mainFile: string;
  template: Template;
  lastOpened?: Date;
  fileCount: number;
  totalSize: number;
  status: ProjectStatus;
  deletedAt?: string | null;
}

export interface ProjectSettings {
  compiler: 'pdflatex' | 'xelatex' | 'lualatex';
  outputDirectory: string;
  bibliographyTool?: 'bibtex' | 'biber';
}

export interface ProjectWithMetadata extends Project {
  metadata: ProjectMetadata;
  settings: ProjectSettings;
}

export interface CreateProjectRequest {
  name: string;
  template?: Template;
  description?: string;
}

export interface CreateProjectResponse {
  project: ProjectWithMetadata;
}

export interface ListProjectsResponse {
  projects: ProjectWithMetadata[];
}

export interface GetProjectResponse {
  project: ProjectWithMetadata;
}

export type ProjectFilter = 'all' | 'your_projects' | 'draft' | 'published' | 'in_progress' | 'trash';

export interface ListProjectsQuery {
  filter?: ProjectFilter;
}

export interface TrashProjectResponse {
  project: ProjectWithMetadata;
}

export interface ListTrashResponse {
  projects: ProjectWithMetadata[];
}
