import { promises as fs } from 'fs';
import path from 'path';

import type { FileNode } from '@local-latex-editor/shared-types';
import { getFileTypeFromExtension } from '@local-latex-editor/shared-types';

/**
 * The project's files and folders. An entry that cannot be read (a broken
 * symlink, a file the OS will not let us stat) is left out instead of failing
 * the whole tree, so one bad file cannot stop a project from opening.
 */
export async function buildFileTree(projectPath: string, relativePath: string = ''): Promise<FileNode[]> {
  const fullPath = path.join(projectPath, relativePath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });

  const nodes = (
    await Promise.all(
      entries.map(async (entry): Promise<FileNode | null> => {
        const entryPath = path.join(relativePath, entry.name);
        const fullEntryPath = path.join(fullPath, entry.name);
        try {
          // stat follows symlinks; a broken one throws and is skipped
          const stats = await fs.stat(fullEntryPath);
          const isDirectory = stats.isDirectory();

          const node: FileNode = {
            id: Buffer.from(entryPath).toString('base64'),
            name: entry.name,
            path: entryPath,
            type: isDirectory ? 'directory' : 'file',
            modifiedAt: stats.mtime.toISOString(),
          };

          if (isDirectory) {
            // a symlinked folder could point back up the tree; list it empty
            node.children = entry.isSymbolicLink() ? [] : await buildFileTree(projectPath, entryPath);
          } else {
            node.fileType = getFileTypeFromExtension(entry.name);
            node.size = stats.size;
          }

          return node;
        } catch {
          return null;
        }
      }),
    )
  )
    .filter((node): node is FileNode => node !== null)
    .sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

  return nodes;
}

export async function getFileContent(projectPath: string, filePath: string): Promise<string> {
  const fullPath = path.join(projectPath, filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
}

export async function saveFileContent(
  projectPath: string,
  filePath: string,
  content: string
): Promise<void> {
  const fullPath = path.join(projectPath, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
}

export async function deleteFile(projectPath: string, filePath: string): Promise<void> {
  const fullPath = path.join(projectPath, filePath);
  await fs.unlink(fullPath);
}

export async function fileExists(projectPath: string, filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(projectPath, filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function getProjectStats(projectPath: string): Promise<{ fileCount: number; totalSize: number }> {
  let fileCount = 0;
  let totalSize = 0;
  
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        fileCount++;
        totalSize += stats.size;
      }
    }
  }
  
  await walk(projectPath);
  return { fileCount, totalSize };
}
