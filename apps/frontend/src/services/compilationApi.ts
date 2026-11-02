import type {
  CompileRequest,
  CompileResponse,
  GetCompileStatusResponse,
} from "@local-latex-editor/shared-types";

import { api } from "./api";

export interface LatexCheckResponse {
  latexInstalled: boolean;
  engines: Array<{ engine: string; installed: boolean; version?: string }>;
  tools: Array<{ engine: string; installed: boolean; version?: string }>;
  incrementalBuilds: boolean;
  message: string;
}

export interface CompileOptions {
  /** Delete auxiliary files first and rebuild everything. */
  clean?: boolean;
  shellEscape?: boolean;
  timeoutSeconds?: number;
}

export const compilationApi = {
  async compile(
    projectId: string,
    engine?: CompileRequest["engine"],
    mainFile?: string,
    options?: CompileOptions,
  ): Promise<CompileResponse> {
    return api.post<CompileResponse>(`/api/projects/${projectId}/compile`, {
      engine,
      mainFile,
      ...options,
    });
  },

  async getStatus(jobId: string): Promise<GetCompileStatusResponse> {
    return api.get<GetCompileStatusResponse>(`/api/compile/${jobId}/status`);
  },

  async cancel(jobId: string): Promise<void> {
    return api.post<void>(`/api/compile/${jobId}/cancel`, {});
  },

  async checkLatexInstallation(): Promise<LatexCheckResponse> {
    return api.get<LatexCheckResponse>("/api/system/latex-check");
  },

  getPdfUrl(projectId: string, refreshKey?: number): string {
    const base = `/api/projects/${projectId}/pdf`;
    return refreshKey ? `${base}?v=${refreshKey}` : base;
  },
};
