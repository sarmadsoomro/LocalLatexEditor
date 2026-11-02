import { Router } from "express";
import { z } from "zod";

import { validateBody } from "../middleware/validate.js";
import {
  installPackage,
  lookupPackage,
  PACKAGE_FILE_PATTERN,
  PACKAGE_NAME_PATTERN,
} from "../services/texPackageService.js";
import { createSuccessResponse } from "../types/response.js";

const fileSchema = z.string().regex(PACKAGE_FILE_PATTERN, "Not a LaTeX package file name");

export const lookupSchema = z.object({ file: fileSchema });
export const installSchema = z.object({
  file: fileSchema,
  package: z.string().regex(PACKAGE_NAME_PATTERN, "Not a valid package name"),
});

const router: Router = Router();

/** Which package provides a missing file, and how it can be installed here. */
router.post("/lookup", validateBody(lookupSchema), async (req, res, next) => {
  try {
    const { file } = req.body as z.infer<typeof lookupSchema>;
    res.json(createSuccessResponse({ lookup: await lookupPackage(file) }));
  } catch (error) {
    next(error);
  }
});

/** Install a package. Only for lookups whose method is "install" or "admin". */
router.post("/install", validateBody(installSchema), async (req, res, next) => {
  try {
    const { file, package: pkg } = req.body as z.infer<typeof installSchema>;
    res.json(createSuccessResponse({ result: await installPackage(file, pkg) }));
  } catch (error) {
    next(error);
  }
});

export default router;
