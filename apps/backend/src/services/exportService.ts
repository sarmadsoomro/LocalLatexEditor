import { Response } from 'express';
import archiver from 'archiver';
import { promises as fs } from 'fs';
import path from 'path';
import { getProjectPath } from '../config/storage.js';
import { getProject } from './projectService.js';
import { NotFoundError, InternalError } from '../types/error.js';

// Patterns to exclude from ZIP export
const EXCLUDED_PATTERNS = [
  /^output\//,           // output directory
  /\.aux$/,             // LaTeX auxiliary files
  /\.log$/,             // LaTeX log files
  /\.out$/,             // LaTeX output files
  /\.toc$/,             // Table of contents
  /\.lof$/,             // List of figures
  /\.lot$/,             // List of tables
  /\.synctex\.gz$/,     // SyncTeX data
  /^\.DS_Store$/,        // macOS metadata
  /^Thumbs\.db$/,        // Windows metadata
];

/**
 * Check if a file should be excluded from ZIP export
 */
function shouldExcludeFile(filePath: string): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
 * Recursively collect files from project directory
 */
async function collectFiles(
  dirPath: string,
  relativePath: string = ''
): Promise<Array<{ absolutePath: string; relativePath: string }>> {
  const files: Array<{ absolutePath: string; relativePath: string }> = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryRelativePath = path.join(relativePath, entry.name);
    const entryAbsolutePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively collect from subdirectory
      const subFiles = await collectFiles(entryAbsolutePath, entryRelativePath);
      files.push(...subFiles);
    } else if (!shouldExcludeFile(entryRelativePath)) {
      files.push({
        absolutePath: entryAbsolutePath,
        relativePath: entryRelativePath,
      });
    }
  }

  return files;
}

/**
 * Export a project as a ZIP file, streamed directly to the response
 */
export async function exportProjectAsZip(
  projectId: string,
  res: Response
): Promise<void> {
  // Verify project exists and get metadata
  const project = await getProject(projectId);
  const projectPath = getProjectPath(projectId);

  // Check if project directory exists
  try {
    await fs.access(projectPath);
  } catch {
    throw new NotFoundError('Project directory', projectId);
  }

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const safeProjectName = project.name.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const filename = `${safeProjectName}_${date}.zip`;

  // Set response headers
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Create archiver instance
  const archive = archiver('zip', {
    zlib: { level: 6 }, // Compression level (0-9)
  });

  // Handle archive errors
  archive.on('error', (err) => {
    throw new InternalError(`ZIP generation failed: ${err.message}`);
  });

  // Pipe archive to response
  archive.pipe(res);

  // Collect and add files to archive
  const files = await collectFiles(projectPath);

  for (const file of files) {
    archive.file(file.absolutePath, { name: file.relativePath });
  }

  // Finalize archive
  await archive.finalize();
}
