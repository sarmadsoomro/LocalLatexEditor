import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { createSuccessResponse } from '../types/response.js';
import { validateBody } from '../middleware/validate.js';
import { importProject } from '../services/projectService.js';
import { ValidationError } from '../types/error.js';

const router: RouterType = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tempDir = path.join(process.cwd(), 'temp', 'uploads');
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

async function extractZip(zipPath: string, extractDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .on('close', () => resolve())
      .on('error', (error) => reject(error));
  });
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
      
      const extractDir = path.join(
        process.cwd(),
        'temp',
        'extracted',
        nanoid(12)
      );
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
        } catch {}
      }
    } catch (error) {
      try {
        fs.rmSync(zipFilePath, { force: true });
      } catch {}
      next(error);
    }
  }
);

export default router;
