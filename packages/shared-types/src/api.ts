export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
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
  status: 'pending' | 'compiling' | 'complete' | 'failed' | 'cancelled';
}

export interface GetCompileStatusResponse {
  jobId: string;
  status: 'pending' | 'compiling' | 'complete' | 'failed' | 'cancelled';
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

import type { ProjectFile, CompilationResult } from './index';