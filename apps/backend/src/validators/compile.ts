import { z } from 'zod';

const engines = ['pdflatex', 'xelatex', 'lualatex'] as const;

export const compileBodySchema = z.object({
  engine: z.enum(engines).optional().default('pdflatex'),
  mainFile: z.string().optional(),
});

export const compileParamsSchema = z.object({
  id: z.string().regex(/^proj_[a-zA-Z0-9_-]+$/, 'Invalid project ID format'),
});

export type CompileBody = z.infer<typeof compileBodySchema>;
export type CompileParams = z.infer<typeof compileParamsSchema>;
