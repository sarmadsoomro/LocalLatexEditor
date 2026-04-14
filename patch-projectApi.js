const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'apps/frontend/src/services/projectApi.ts');
let content = fs.readFileSync(apiPath, 'utf8');

const newMethods = `
  async createFile(id: string, filePath: string, isDir: boolean = false): Promise<FileTreeResponse> {
    return api.post<FileTreeResponse>(\`/api/projects/\${id}/files\`, { path: filePath, isDir });
  },

  async uploadFile(id: string, filePath: string, file: File): Promise<FileTreeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', filePath);

    const response = await fetch(\`/api/projects/\${id}/files/upload\`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Failed to upload file';
      try {
        const error = await response.json();
        if (error.error?.message) errorMsg = error.error.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return response.json();
  },
`;

content = content.replace('async getProjectFiles(id: string)', newMethods + '\n  async getProjectFiles(id: string)');
fs.writeFileSync(apiPath, content);
