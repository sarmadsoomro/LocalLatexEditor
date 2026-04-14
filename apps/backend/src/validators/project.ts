import { z } from 'zod';
import type { Template } from '@local-latex-editor/shared-types';

const templates: Template[] = ['article', 'report', 'book', 'beamer', 'letter', 'empty'];

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .regex(
      /^[^<>:"\\/|?*]+$/,
      'Project name contains invalid characters'
    ),
  template: z.enum(templates as [string, ...string[]]).optional(),
  description: z.string().max(500).optional(),
});

export const projectIdSchema = z.object({
  id: z.string().regex(/^proj_[a-zA-Z0-9_-]+$/, 'Invalid project ID format'),
});

export const importProjectSchema = z.object({
  sourcePath: z.string().min(1, 'Source path is required'),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type ImportProjectInput = z.infer<typeof importProjectSchema>;
