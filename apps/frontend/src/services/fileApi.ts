import { api } from './api';

export interface FileContentResponse {
  content: string;
}

export interface SaveFileRequest {
  content: string;
}

export interface SaveFileResponse {
  success: boolean;
  path: string;
  lastModified: string;
}

export interface CreateFileRequest {
  path: string;
  content?: string;
}

export interface CreateFileResponse {
  success: boolean;
  path: string;
}

export interface DeleteFileResponse {
  success: boolean;
  path: string;
}

export const fileApi = {
  async getFile(projectId: string, filePath: string): Promise<FileContentResponse> {
    const encodedPath = encodeURIComponent(filePath);
    return api.get<FileContentResponse>(`/api/projects/${projectId}/files/${encodedPath}`);
  },

  async saveFile(
    projectId: string,
    filePath: string,
    content: string
  ): Promise<SaveFileResponse> {
    const encodedPath = encodeURIComponent(filePath);
    return api.put<SaveFileResponse>(`/api/projects/${projectId}/files/${encodedPath}`, { content });
  },

  async createFile(
    projectId: string,
    filePath: string,
    content: string = ''
  ): Promise<CreateFileResponse> {
    return api.post<CreateFileResponse>(`/api/projects/${projectId}/files`, {
      path: filePath,
      content,
    });
  },

  async deleteFile(projectId: string, filePath: string): Promise<DeleteFileResponse> {
    const encodedPath = encodeURIComponent(filePath);
    return api.delete<DeleteFileResponse>(`/api/projects/${projectId}/files/${encodedPath}`);
  },
};