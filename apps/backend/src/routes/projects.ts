import { Router, type Router as RouterType } from 'express';
import { createSuccessResponse } from '../types/response.js';
import {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  importProject,
  getProjectFiles,
  updateProjectLastOpened,
  renameProject,
  updateLastOpened,
} from '../services/projectService.js';
import { exportProjectAsZip } from '../services/exportService.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  createProjectSchema,
  projectIdSchema,
  importProjectSchema,
  renameProjectSchema,
} from '../validators/project.js';
import type { CreateProjectInput, ProjectIdInput, ImportProjectInput, RenameProjectInput } from '../validators/project.js';

const router: RouterType = Router();

router.get('/', async (_req, res, next) => {
  try {
    const projects = await listProjects();
    res.json(createSuccessResponse({ projects }));
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  validateBody<CreateProjectInput>(createProjectSchema),
  async (req, res, next) => {
    try {
      const project = await createProject(req.body);
      res.status(201).json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      const project = await getProject(req.params.id);
      await updateProjectLastOpened(req.params.id);
      res.json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      await deleteProject(req.params.id);
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/import',
  validateBody<ImportProjectInput>(importProjectSchema),
  async (req, res, next) => {
    try {
      const project = await importProject(req.body.sourcePath, req.body.name);
      res.status(201).json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/files',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      const files = await getProjectFiles(req.params.id);
      res.json(createSuccessResponse({ files }));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/export',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      await exportProjectAsZip(req.params.id, res);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  validateParams<ProjectIdInput>(projectIdSchema),
  validateBody<RenameProjectInput>(renameProjectSchema),
  async (req, res, next) => {
    try {
      const project = await renameProject(req.params.id, req.body.name);
      res.json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);

// PATCH endpoint for updating lastOpened
router.patch(
  '/:id/last-opened',
  validateParams<ProjectIdInput>(projectIdSchema),
  async (req, res, next) => {
    try {
      const project = await updateLastOpened(req.params.id);
      res.json(createSuccessResponse({ project }));
    } catch (error) {
      next(error);
    }
  }
);

import fileRoutes from './files.js';
router.use('/:id/files', fileRoutes);

export default router;
