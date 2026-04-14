import path from 'path';
import { promises as fs } from 'fs';
import { getProjectPath } from '../config/storage.js';

const AUXILIARY_EXTENSIONS = [
  '.aux', '.log', '.out', '.toc', '.bbl', '.blg', '.bcf',
  '.synctex.gz', '.fls', '.fdb_latexmk', '.run.xml', '.nav', '.snm',
];

const SOURCE_EXTENSIONS = ['.tex', '.bib', '.cls', '.sty', '.pdf'];

export interface CleanupOptions {
  keepPdf?: boolean;
  dryRun?: boolean;
}

export interface CleanupResult {
  deleted: string[];
  preserved: string[];
  deletedSize: number;
}

export interface AuxiliaryFilesInfo {
  files: string[];
  totalSize: number;
}

export function isAuxiliaryFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return AUXILIARY_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext.toLowerCase()));
}

function isSourceFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return SOURCE_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext.toLowerCase()));
}

export async function listAuxiliaryFiles(projectPath: string): Promise<AuxiliaryFilesInfo> {
  const files: string[] = [];
  let totalSize = 0;

  async function walk(dir: string, relativePath: string = ''): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath, relativeFilePath);
        } else if (isAuxiliaryFile(entry.name)) {
          try {
            const stats = await fs.stat(fullPath);
            files.push(relativeFilePath);
            totalSize += stats.size;
          } catch {
            // inaccessible
          }
        }
      }
    } catch {
      // inaccessible
    }
  }

  await walk(projectPath);
  return { files, totalSize };
}

export async function cleanupAuxiliaryFiles(
  projectId: string,
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const { keepPdf = true, dryRun = false } = options;

  const projectPath = getProjectPath(projectId);
  const deleted: string[] = [];
  const preserved: string[] = [];
  let deletedSize = 0;

  async function walk(dir: string, relativePath: string = ''): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath, relativeFilePath);
        } else {
          const isAuxiliary = isAuxiliaryFile(entry.name);
          const isSource = isSourceFile(entry.name);
          const isPdf = entry.name.toLowerCase().endsWith('.pdf');
          const shouldSkipPdf = isPdf && keepPdf;

          if (isSource || shouldSkipPdf) {
            preserved.push(relativeFilePath);
          } else if (isAuxiliary) {
            if (!dryRun) {
              try {
                const stats = await fs.stat(fullPath);
                deletedSize += stats.size;
                await fs.unlink(fullPath);
                deleted.push(relativeFilePath);
              } catch (error) {
                console.error(`Failed to delete ${relativeFilePath}:`, error);
                preserved.push(relativeFilePath);
              }
            } else {
              try {
                const stats = await fs.stat(fullPath);
                deletedSize += stats.size;
                deleted.push(relativeFilePath);
              } catch {
                // inaccessible
              }
            }
          } else {
            preserved.push(relativeFilePath);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${dir}:`, error);
    }
  }

  await walk(projectPath);
  return { deleted, preserved, deletedSize };
}
