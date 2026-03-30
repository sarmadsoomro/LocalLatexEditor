export interface CreateProjectRequest {
  name: string;
  template?: string;
}

export interface CreateProjectResponse {
  project: Project;
}

export interface GetProjectResponse {
  project: Project;
  files: ProjectFile[];
}

export interface UpdateFileRequest {
  content: string;
  version?: number;
}

export interface UpdateFileResponse {
  file: ProjectFile;
  version: number;
}

export interface CompileRequest {
  projectId: string;
  engine?: 'pdflatex' | 'xelatex' | 'lualatex';
  mainFile?: string;
}

export interface CompileResponse {
  jobId: string;
  status: 'queued' | 'compiling' | 'completed' | 'error';
}

export interface GetCompileStatusResponse {
  jobId: string;
  status: 'queued' | 'compiling' | 'completed' | 'error';
  result?: CompilationResult;
  progress?: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

import type { Project, ProjectFile, CompilationResult } from './index';
