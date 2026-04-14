export type FileType = 'tex' | 'bib' | 'cls' | 'sty' | 'pdf' | 'image' | 'other';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  fileType?: FileType;
  size?: number;
  modifiedAt: string;
  children?: FileNode[];
}

export interface FileTreeResponse {
  projectId: string;
  files: FileNode[];
}

export function getFileTypeFromExtension(filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'tex':
      return 'tex';
    case 'bib':
      return 'bib';
    case 'cls':
      return 'cls';
    case 'sty':
      return 'sty';
    case 'pdf':
      return 'pdf';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'bmp':
    case 'webp':
      return 'image';
    default:
      return 'other';
  }
}

export function isEditableFile(fileType: FileType): boolean {
  return ['tex', 'bib', 'cls', 'sty', 'other'].includes(fileType);
}
