import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { z } from "zod";

import { validateParams, validateQuery } from "../middleware/validate.js";
import { getProject } from "../services/projectService.js";
import { forwardSearch, inverseSearch, loadSynctex, type SynctexData } from "../services/synctexService.js";
import { AppError, ValidationError } from "../types/error.js";
import { createSuccessResponse } from "../types/response.js";
import { compileParamsSchema } from "../validators/compile.js";

const router: Router = Router({ mergeParams: true });

const notFound = (message: string): AppError => new AppError("NOT_FOUND", message, 404);

const forwardQuerySchema = z.object({
  file: z.string().min(1),
  line: z.coerce.number().int().min(1),
});

const inverseQuerySchema = z.object({
  page: z.coerce.number().int().min(1),
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
});

interface ProjectSync {
  roots: string[];
  data: SynctexData;
}

async function projectSync(projectId: string): Promise<ProjectSync> {
  const project = await getProject(projectId);
  const mainFile = project.metadata?.mainFile || "main.tex";
  const data = await loadSynctex(path.join(project.path, "output"), path.basename(mainFile, ".tex"));
  if (!data) {
    throw notFound("No SyncTeX data yet. Compile the project first.");
  }
  // TeX may record the real path (e.g. /private/var on macOS) instead of the
  // path we stored, so accept both spellings of the project folder.
  const roots = [path.resolve(project.path)];
  try {
    const real = await fs.realpath(project.path);
    if (!roots.includes(real)) roots.push(real);
  } catch {
    /* project folder missing: getProject would have failed already */
  }
  return { roots, data };
}

function relativeInside(roots: string[], absFile: string): string | null {
  for (const root of roots) {
    const rel = path.relative(root, absFile);
    if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) return rel.split(path.sep).join("/");
  }
  return null;
}

/** GET /api/projects/:id/synctex/forward?file=chapters/one.tex&line=12 */
router.get("/synctex/forward", validateParams(compileParamsSchema), validateQuery(forwardQuerySchema), async (req, res, next) => {
  try {
    const { file, line } = res.locals.query as z.infer<typeof forwardQuerySchema>;
    const { roots, data } = await projectSync(req.params.id);

    let result = null;
    for (const root of roots) {
      const abs = path.resolve(root, file);
      if (relativeInside([root], abs) === null) {
        throw new ValidationError("File must be inside the project");
      }
      result = forwardSearch(data, abs, line);
      if (result) break;
    }
    if (!result) {
      throw notFound(`No PDF location for ${file}:${line}. Is this file part of the compiled document, and was it saved and compiled?`);
    }
    res.json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
});

/** GET /api/projects/:id/synctex/inverse?page=1&x=120.5&y=300 (PDF points, origin top-left) */
router.get("/synctex/inverse", validateParams(compileParamsSchema), validateQuery(inverseQuerySchema), async (req, res, next) => {
  try {
    const { page, x, y } = res.locals.query as z.infer<typeof inverseQuerySchema>;
    const { roots, data } = await projectSync(req.params.id);

    // only ever answer with files inside the project, never a package's .sty
    const result = inverseSearch(data, page, x, y, (abs) => relativeInside(roots, abs) !== null);
    const rel = result ? relativeInside(roots, result.file) : null;
    if (!result || !rel) {
      throw notFound(`No source location in this project for that point on page ${page}.`);
    }
    res.json(createSuccessResponse({ file: rel, line: result.line }));
  } catch (error) {
    next(error);
  }
});

export default router;
