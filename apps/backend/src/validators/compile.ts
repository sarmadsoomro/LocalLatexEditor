import { z } from 'zod';

const engines = ['pdflatex', 'xelatex', 'lualatex'] as const;

export const compileBodySchema = z.object({
  engine: z.enum(engines).optional().default('pdflatex'),
  mainFile: z.string().optional(),
  /** Delete auxiliary files first and rebuild everything. */
  clean: z.boolean().optional().default(false),
  /** Pass -shell-escape (needed by minted and a few other packages). */
  shellEscape: z.boolean().optional().default(false),
  /** Total compile time budget in seconds. */
  timeoutSeconds: z.number().int().min(30).max(1800).optional().default(300),
});

export const compileParamsSchema = z.object({
  id: z.string().regex(/^proj_[a-zA-Z0-9_-]+$/, 'Invalid project ID format'),
});

export type CompileBody = z.infer<typeof compileBodySchema>;
export type CompileParams = z.infer<typeof compileParamsSchema>;
