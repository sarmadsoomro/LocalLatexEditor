import fs from 'fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'path';

import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import unzipper from 'unzipper';
import { z } from 'zod';

import { storageConfig } from '../config/storage.js';
import { validateBody } from '../middleware/validate.js';
import { importProject } from '../services/projectService.js';
import { ValidationError } from '../types/error.js';
import { createSuccessResponse } from '../types/response.js';

const router: RouterType = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tempDir = path.join(storageConfig.tempDir, 'uploads');
      fs.mkdirSync(tempDir, { recursive: true });
      cb(null, tempDir);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${nanoid(12)}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.zip', '.tex', '.bib', '.cls', '.sty'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip' || allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only ZIP files are allowed for import.'));
    }
  },
});

const importZipBodySchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export type ImportZipBody = z.infer<typeof importZipBodySchema>;

type ZipEntry = {
  path: string;
  type: string;
  externalFileAttributes?: number;
  stream: () => NodeJS.ReadableStream;
};

const DEFAULT_MAX_ENTRIES = 5000;
const DEFAULT_MAX_UNCOMPRESSED_BYTES = 500 * 1024 * 1024;

function zipLimits(): { maxEntries: number; maxBytes: number } {
  // shortcut: env overrides exist so tests can reject a small zip, drop them if limits become settings
  const entries = Number(process.env.LATEX_EDITOR_ZIP_MAX_ENTRIES);
  const bytes = Number(process.env.LATEX_EDITOR_ZIP_MAX_BYTES);
  return {
    maxEntries: Number.isFinite(entries) && entries > 0 ? entries : DEFAULT_MAX_ENTRIES,
    maxBytes: Number.isFinite(bytes) && bytes > 0 ? bytes : DEFAULT_MAX_UNCOMPRESSED_BYTES,
  };
}

function isZipSymlink(entry: ZipEntry): boolean {
  const mode = (entry.externalFileAttributes ?? 0) >>> 16;
  return (mode & 0o170000) === 0o120000;
}

function resolveZipEntry(extractDir: string, entryPath: string): string {
  if (!entryPath || entryPath.includes('\0')) {
    throw new ValidationError('Zip entry path is not allowed');
  }
  if (path.isAbsolute(entryPath) || path.win32.isAbsolute(entryPath)) {
    throw new ValidationError('Zip entry path is absolute');
  }
  const root = path.resolve(extractDir);
  const dest = path.resolve(root, entryPath);
  if (dest !== root && !dest.startsWith(root + path.sep)) {
    throw new ValidationError('Zip entry escapes the extract directory');
  }
  return dest;
}

async function extractZip(zipPath: string, extractDir: string): Promise<void> {
  const { maxEntries, maxBytes } = zipLimits();
  const directory = await unzipper.Open.file(zipPath);
  const entries = directory.files as ZipEntry[];
  if (entries.length > maxEntries) {
    throw new ValidationError(`Zip has more than ${maxEntries} entries`);
  }

  let written = 0;
  for (const entry of entries) {
    if (isZipSymlink(entry)) {
      throw new ValidationError('Zip entry is a symlink');
    }
    const dest = resolveZipEntry(extractDir, entry.path);
    const isDirectory = entry.type === 'Directory' || /[/\\]$/.test(entry.path);
    if (isDirectory) {
      fs.mkdirSync(dest, { recursive: true });
      continue;
    }
    if (dest === path.resolve(extractDir)) {
      throw new ValidationError('Zip entry path is not allowed');
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await pipeline(
      entry.stream(),
      new Transform({
        transform(chunk: Buffer, _encoding, callback): void {
          written += chunk.length;
          if (written > maxBytes) {
            callback(new ValidationError('Zip exceeds the uncompressed size limit'));
            return;
          }
          callback(null, chunk);
        },
      }),
      fs.createWriteStream(dest),
    );
  }
}

function findExtractedRoot(extractDir: string): string {
  const entries = fs.readdirSync(extractDir, { withFileTypes: true });
  
  // Filter out macOS metadata directories and hidden files
  const relevantEntries = entries.filter(e => 
    e.name !== '__MACOSX' && 
    e.name !== '.DS_Store' &&
    !e.name.startsWith('.')
  );
  
  // If there's a single directory that contains .tex files, use its contents as root
  if (relevantEntries.length === 1 && relevantEntries[0].isDirectory()) {
    const singleDir = path.join(extractDir, relevantEntries[0].name);
    const subEntries = fs.readdirSync(singleDir);
    if (subEntries.some(e => e.endsWith('.tex'))) {
      return singleDir;
    }
  }
  
  return extractDir;
}

router.post(
  '/import-zip',
  upload.single('file'),
  validateBody<ImportZipBody>(importZipBodySchema),
  async (req, res, next) => {
    const zipFilePath = req.file?.path;
    
    if (!zipFilePath) {
      return next(new ValidationError('No ZIP file provided'));
    }

    try {
      const { name } = req.body;
      
      const extractDir = path.join(storageConfig.tempDir, 'extracted', nanoid(12));
      fs.mkdirSync(extractDir, { recursive: true });

      try {
        await extractZip(zipFilePath, extractDir);
        
        const projectRoot = findExtractedRoot(extractDir);
        
        const project = await importProject(projectRoot, name);
        
        res.status(201).json(createSuccessResponse({ project }));
      } finally {
        try {
          fs.rmSync(zipFilePath, { force: true });
          fs.rmSync(extractDir, { recursive: true, force: true });
        } catch {
          /* cleanup is best-effort */
        }
      }
    } catch (error) {
      try {
        fs.rmSync(zipFilePath, { force: true });
      } catch {
        /* cleanup is best-effort */
      }
      next(error);
    }
  }
);

export default router;
