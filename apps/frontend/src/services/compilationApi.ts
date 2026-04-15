import { api } from "./api";
import type {
  CompileRequest,
  CompileResponse,
  GetCompileStatusResponse,
} from "@local-latex-editor/shared-types";

interface LatexCheckResponse {
  latexInstalled: boolean;
  engines: Array<{ engine: string; installed: boolean; version?: string }>;
  message: string;
}

interface CompileOptions {
  synctex?: boolean;
  draftMode?: boolean;
  shellEscape?: boolean;
  additionalArgs?: string[];
}

export const compilationApi = {
  async compile(
    projectId: string,
    engine?: CompileRequest["engine"],
    mainFile?: string,
    options?: CompileOptions,
  ): Promise<CompileResponse> {
    return api.post<CompileResponse>(`/api/projects/${projectId}/compile`, {
      projectId,
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
