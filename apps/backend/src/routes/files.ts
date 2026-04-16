import { Router, type Router as RouterType } from "express";
import { promises as fs } from "fs";
import path from "path";
import multer from "multer";
import { z } from "zod";
import { getProject, getProjectFiles } from "../services/projectService.js";
import { getProjectPath } from "../config/storage.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { projectIdSchema } from "../validators/project.js";
import { createSuccessResponse } from "../types/response.js";
import { NotFoundError, ValidationError } from "../types/error.js";

const router: RouterType = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

export const filePathParamsSchema = z.object({
  id: z.string().regex(/^proj_[a-zA-Z0-9_-]+$/, "Invalid project ID format"),
  path: z.string().min(1, "File path is required"),
});

export const createFileBodySchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string().optional(),
  isDir: z.boolean().optional(),
});

export const renameFileBodySchema = z.object({
  newPath: z.string().min(1, "New path is required"),
});

export const moveFileBodySchema = z.object({
  targetPath: z.string().min(1, "Target path is required"),
});

export const writeFileBodySchema = z.object({
  content: z.string().min(1, "File content is required"),
});

export type FilePathParams = z.infer<typeof filePathParamsSchema>;
export type CreateFileBody = z.infer<typeof createFileBodySchema>;
export type WriteFileInput = z.infer<typeof writeFileBodySchema>;

async function resolveProjectFilePath(
  projectId: string,
  filePath: string,
): Promise<{ absolutePath: string; projectPath: string }> {
  await getProject(projectId);
  const projectPath = getProjectPath(projectId);

  const decodedPath = decodeURIComponent(filePath);
  const absolutePath = path.join(projectPath, decodedPath);

  const normalizedPath = path.normalize(absolutePath);

  const relativePath = path.relative(projectPath, normalizedPath);
  const isOutsideProject = relativePath.startsWith('..') || path.isAbsolute(relativePath);

  if (isOutsideProject || (!normalizedPath.startsWith(projectPath) && normalizedPath !== projectPath)) {
    throw new ValidationError(
      "Invalid file path: directory traversal detected",
    );
  }

  return { absolutePath: normalizedPath, projectPath };
}

router.post(
  "/",
  validateParams<{ id: string }>(projectIdSchema),
  validateBody<CreateFileBody>(createFileBodySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { path: filePath, content = "", isDir = false } = req.body;
      const { absolutePath } = await resolveProjectFilePath(id, filePath);

      try {
        await fs.access(absolutePath);
        throw new ValidationError("File already exists", { path: filePath });
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          if ((error as Error).message?.includes("already exists")) {
            throw error;
          }
        }
      }

      if (isDir) {
        await fs.mkdir(absolutePath, { recursive: true });
      } else {
        const parentDir = path.dirname(absolutePath);
        await fs.mkdir(parentDir, { recursive: true });
        await fs.writeFile(absolutePath, content, "utf-8");
      }
      res.status(201).json(createSuccessResponse({ path: filePath }));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/upload",
  validateParams<{ id: string }>(projectIdSchema),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const filePath = req.body.path;

      if (!req.file) {
        throw new ValidationError("No file uploaded");
      }
      if (!filePath) {
        throw new ValidationError("File path is required");
      }

      const { absolutePath } = await resolveProjectFilePath(id, filePath);

      const parentDir = path.dirname(absolutePath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(absolutePath, req.file.buffer);

      res.status(201).json(createSuccessResponse({ path: filePath }));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:path(*)",
  validateParams<FilePathParams>(filePathParamsSchema),
  async (req, res, next) => {
    try {
      const { id, path: filePath } = req.params;
      console.log(`[FILE READ] Request: project=${id}, path=${filePath}`);
      
      const { absolutePath } = await resolveProjectFilePath(id, filePath);
      console.log(`[FILE READ] Absolute path: ${absolutePath}`);

      try {
        const stats = await fs.stat(absolutePath);

        if (stats.isDirectory()) {
          const files = await getProjectFiles(id);
          const normalizedPath = decodeURIComponent(filePath);

          if (normalizedPath === "" || normalizedPath === "/") {
            res.json(createSuccessResponse({ files }));
          } else {
            const cleanPath = normalizedPath.replace(/^\/|\/$/g, "");
            const findInTree = (
              nodes: typeof files,
              targetPath: string,
            ): typeof files | null => {
              for (const node of nodes) {
                if (node.path === targetPath && node.type === "directory") {
                  return node.children || [];
                }
                if (node.children) {
                  const found = findInTree(node.children, targetPath);
                  if (found) return found;
                }
              }
              return null;
            };
            const dirFiles = findInTree(files, cleanPath) || [];
            res.json(createSuccessResponse({ files: dirFiles }));
          }
        } else {
          const content = await fs.readFile(absolutePath, "utf-8");
          console.log(`[FILE READ] Success: read ${content.length} bytes from ${absolutePath}`);
          console.log(`[FILE READ] Content preview: ${content.substring(0, 100)}...`);
          res.json(createSuccessResponse({ content }));
        }
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          throw new NotFoundError("File", filePath);
        }
        if ((error as NodeJS.ErrnoException).code === "EISDIR") {
          throw new ValidationError("Path is a directory, not a file");
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:path(*)",
  validateParams<FilePathParams>(filePathParamsSchema),
  validateBody<WriteFileInput>(writeFileBodySchema),
  async (req, res, next) => {
    try {
      const { id, path: filePath } = req.params;
      const { content } = req.body;
      
      console.log(`[FILE WRITE] Request: project=${id}, path=${filePath}, contentLength=${content?.length || 0}`);
      
      const { absolutePath } = await resolveProjectFilePath(id, filePath);
      console.log(`[FILE WRITE] Absolute path: ${absolutePath}`);

      const parentDir = path.dirname(absolutePath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(absolutePath, content, "utf-8");
      
      console.log(`[FILE WRITE] Success: wrote ${content.length} bytes to ${absolutePath}`);

      res.status(204).send();
    } catch (error) {
      console.error(`[FILE WRITE] Error:`, error);
      next(error);
    }
  },
);

router.post(
  "/:path(*)/rename",
  validateParams<FilePathParams>(filePathParamsSchema),
  validateBody<{ newPath: string }>(renameFileBodySchema),
  async (req, res, next) => {
    try {
      const { id, path: oldPath } = req.params;
      const { newPath } = req.body;
      const { absolutePath: oldAbsolutePath } = await resolveProjectFilePath(
        id,
        oldPath,
      );
      const { absolutePath: newAbsolutePath } = await resolveProjectFilePath(
        id,
        newPath,
      );

      await fs.rename(oldAbsolutePath, newAbsolutePath);
      res.status(200).json(createSuccessResponse({ path: newPath }));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:path(*)/move",
  validateParams<FilePathParams>(filePathParamsSchema),
  validateBody<{ targetPath: string }>(moveFileBodySchema),
  async (req, res, next) => {
    try {
      const { id, path: sourcePath } = req.params;
      const { targetPath } = req.body;
      const { absolutePath: sourceAbsolutePath } = await resolveProjectFilePath(
        id,
        sourcePath,
      );
      const { absolutePath: targetAbsolutePath } = await resolveProjectFilePath(
        id,
        targetPath,
      );

      await fs.rename(sourceAbsolutePath, targetAbsolutePath);
      res.status(200).json(createSuccessResponse({ path: targetPath }));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:path(*)",
  validateParams<FilePathParams>(filePathParamsSchema),
  async (req, res, next) => {
    try {
      const { id, path: filePath } = req.params;
      const { absolutePath } = await resolveProjectFilePath(id, filePath);

      try {
        const stats = await fs.stat(absolutePath);

        if (stats.isDirectory()) {
          await fs.rm(absolutePath, { recursive: true, force: true });
        } else {
          await fs.unlink(absolutePath);
        }

        res.status(204).send();
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          throw new NotFoundError("File", filePath);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },
);

export default router;
