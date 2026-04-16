import { api } from "./api";
import type {
  CreateProjectResponse,
  ListProjectsResponse,
  GetProjectResponse,
  FileTreeResponse,
  Template,
  ProjectWithMetadata,
  ProjectFilter,
  ProjectStatus,
} from "@local-latex-editor/shared-types";

export const projectApi = {
  async listProjects(filter?: ProjectFilter): Promise<ListProjectsResponse> {
    const queryParams = filter && filter !== 'all' && filter !== 'trash'
      ? `?filter=${filter}`
      : '';
    return api.get<ListProjectsResponse>(`/api/projects${queryParams}`);
  },

  async listTrashedProjects(): Promise<ListProjectsResponse> {
    return api.get<ListProjectsResponse>("/api/projects/trash");
  },

  async restoreProject(id: string): Promise<GetProjectResponse> {
    return api.post<GetProjectResponse>(`/api/projects/${id}/restore`, {});
  },

  async permanentlyDeleteProject(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/projects/${id}/permanent`);
  },

  async updateStatus(id: string, status: ProjectStatus): Promise<GetProjectResponse> {
    return api.put<GetProjectResponse>(`/api/projects/${id}/status`, { status });
  },

  async getProject(id: string): Promise<GetProjectResponse> {
    return api.get<GetProjectResponse>(`/api/projects/${id}`);
  },

  async createProject(
    name: string,
    template: Template,
  ): Promise<CreateProjectResponse> {
    return api.post<CreateProjectResponse>("/api/projects", { name, template });
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/projects/${id}`);
  },

  async renameProject(
    id: string,
    name: string,
  ): Promise<{ project: ProjectWithMetadata }> {
    return api.put<{ project: ProjectWithMetadata }>(`/api/projects/${id}`, {
      name,
    });
  },

  async importProject(
    sourcePath: string,
    name: string,
  ): Promise<CreateProjectResponse> {
    return api.post<CreateProjectResponse>("/api/projects/import", {
      sourcePath,
      name,
    });
  },

  async importZip(file: File, name: string): Promise<CreateProjectResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const response = await fetch("/api/import-zip", {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const apiResponse = (await response.json()) as {
        success: boolean;
        data: CreateProjectResponse;
        error: { code: string; message: string } | null;
      };

      if (!apiResponse.success) {
        throw new Error(
          apiResponse.error?.message || "Failed to import ZIP file",
        );
      }

      return apiResponse.data;
    }

    throw new Error("Invalid response from server");
  },

  async createFile(
    id: string,
    filePath: string,
    isDir: boolean = false,
  ): Promise<FileTreeResponse> {
    return api.post<FileTreeResponse>(`/api/projects/${id}/files`, {
      path: filePath,
      isDir,
    });
  },

  async uploadFile(
    id: string,
    filePath: string,
    file: File,
  ): Promise<FileTreeResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", filePath);

    const response = await fetch(`/api/projects/${id}/files/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = "Failed to upload file";
      try {
        const error = await response.json();
        if (error.error?.message) errorMsg = error.error.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return response.json();
  },

  async getProjectFiles(id: string): Promise<FileTreeResponse> {
    return api.get<FileTreeResponse>(`/api/projects/${id}/files`);
  },

  async deleteFile(projectId: string, filePath: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(
      `/api/projects/${projectId}/files/${encodeURIComponent(filePath)}`,
    );
  },

  async renameFile(
    projectId: string,
    oldPath: string,
    newPath: string,
  ): Promise<FileTreeResponse> {
    return api.post<FileTreeResponse>(
      `/api/projects/${projectId}/files/${encodeURIComponent(oldPath)}/rename`,
      { newPath },
    );
  },

  async moveFile(
    projectId: string,
    sourcePath: string,
    targetPath: string,
  ): Promise<FileTreeResponse> {
    return api.post<FileTreeResponse>(
      `/api/projects/${projectId}/files/${encodeURIComponent(sourcePath)}/move`,
      { targetPath },
    );
  },

  async exportProject(projectId: string, projectName: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/export`);

    if (!response.ok) {
      let errorMsg = "Failed to export project";
      try {
        const error = await response.json();
        if (error.error?.message) errorMsg = error.error.message;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    // Get the blob from response
    const blob = await response.blob();

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filename = `${safeProjectName}_${date}.zip`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    window.URL.revokeObjectURL(url);
  },

  updateLastOpened: async (projectId: string): Promise<ProjectWithMetadata> => {
    const response = await api.patch<GetProjectResponse>(`/api/projects/${projectId}/last-opened`);
    return response.project;
  },
};
