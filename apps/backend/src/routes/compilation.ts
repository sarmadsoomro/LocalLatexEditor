import { spawn } from "child_process";
import { promises as fs, createReadStream } from "fs";
import path from "path";

import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getProjectPath } from "../config/storage.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { compileProject, hasLatexmk, type CompileOptions } from "../services/compilationService.js";
import { CompileQueue, type QueuedCompile } from "../services/compileQueue.js";
import { jobStore, JobStatus } from "../services/jobStore.js";
import { getProject } from "../services/projectService.js";
import { NotFoundError } from "../types/error.js";
import { createSuccessResponse } from "../types/response.js";
import {
  compileBodySchema,
  compileParamsSchema,
  type CompileBody,
} from "../validators/compile.js";

const jobIdParamsSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const router: Router = Router({ mergeParams: true });

type CompileJobOptions = CompileOptions & { engine: CompileOptions["engine"] };

async function runCompileJob(projectId: string, job: QueuedCompile<CompileJobOptions>): Promise<void> {
  const { jobId, options } = job;
  const base: JobStatus = {
    jobId,
    projectId,
    status: "compiling",
    progress: 10,
    createdAt: (await jobStore.get(jobId))?.createdAt ?? new Date(),
  };
  await jobStore.set(jobId, base);

  try {
    const result = await compileProject(projectId, options);
    await jobStore.set(jobId, {
      ...base,
      status: result.success ? "complete" : "failed",
      progress: 100,
      result: {
        success: result.success,
        outputPath: result.outputPath,
        logOutput: result.logOutput,
        errors: result.errors,
        warnings: result.warnings.map((w) => ({
          line: w.line,
          column: 0,
          message: w.message,
          type: "warning" as const,
        })),
        duration: result.duration,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compilation failed";
    await jobStore.set(jobId, {
      ...base,
      status: "failed",
      progress: 100,
      result: {
        success: false,
        logOutput: message,
        errors: [{ line: 0, column: 0, message, type: "error" }],
        warnings: [],
        duration: 0,
      },
    });
  }
}

export const compileQueue = new CompileQueue<CompileJobOptions>(runCompileJob);

router.post(
  "/compile",
  validateParams(compileParamsSchema),
  validateBody(compileBodySchema),
  async (req, res, next) => {
    try {
      const { id: projectId } = req.params;
      const body = req.body as CompileBody;

      await getProject(projectId);

      const options: CompileJobOptions = {
        engine: body.engine,
        mainFile: body.mainFile,
        clean: body.clean,
        shellEscape: body.shellEscape,
        timeoutMs: body.timeoutSeconds * 1000,
      };

      const newJobId = nanoid();
      const queued = compileQueue.enqueue(projectId, newJobId, options);
      if (queued.state !== "joined") {
        // "started" jobs are overwritten by runCompileJob almost immediately;
        // "queued" ones stay pending until the running compile finishes.
        await jobStore.set(queued.jobId, {
          jobId: queued.jobId,
          projectId,
          status: queued.state === "queued" ? "pending" : "compiling",
          progress: 0,
          createdAt: new Date(),
        });
      }

      res
        .status(202)
        .json(createSuccessResponse({ jobId: queued.jobId, status: queued.state === "started" ? "compiling" : "pending" }));
    } catch (error) {
      next(error);
    }
  },
);

export default router;

export const compilationJobRouter: Router = Router();

compilationJobRouter.get(
  "/:jobId/status",
  validateParams(jobIdParamsSchema),
  async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await jobStore.get(jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }

    res.json(
      createSuccessResponse({
        jobId: job.jobId,
        projectId: job.projectId,
        status: job.status,
        progress: job.progress,
        result: job.result || null,
        createdAt: job.createdAt,
      }),
    );
  } catch (error) {
    next(error);
  }
});

compilationJobRouter.post(
  "/:jobId/cancel",
  validateParams(jobIdParamsSchema),
  async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await jobStore.get(jobId);
    if (!job) {
      throw new NotFoundError("Job", jobId);
    }

    await jobStore.set(jobId, { ...job, status: "cancelled" });

    res.json(
      createSuccessResponse({
        jobId,
        status: "cancelled",
        message: "Compilation job cancelled",
      }),
    );
  } catch (error) {
    next(error);
  }
});

export const projectPdfRouter: Router = Router({ mergeParams: true });

projectPdfRouter.get(
  "/pdf",
  validateParams(compileParamsSchema),
  async (req, res, next) => {
    try {
      const { id: projectId } = req.params;

      const project = await getProject(projectId);

      const projectPath = getProjectPath(projectId);
      const outputDir = path.join(projectPath, "output");

      const mainFile = project.metadata?.mainFile || "main.tex";
      const mainFileBasename = path.basename(mainFile, ".tex");
      const pdfPath = path.join(outputDir, `${mainFileBasename}.pdf`);

      try {
        await fs.access(pdfPath);
      } catch {
        throw new NotFoundError("PDF", `${mainFileBasename}.pdf`);
      }

      const stat = await fs.stat(pdfPath);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${projectId}-${mainFileBasename}.pdf"`,
      );
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const readStream = createReadStream(pdfPath);
      readStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

export const systemCheckRouter: Router = Router();

interface EngineStatus {
  engine: string;
  installed: boolean;
  version?: string;
}

async function checkEngine(engine: string): Promise<EngineStatus> {
  return new Promise((resolve) => {
    const childProcess = spawn(engine, ["--version"], {
      shell: false,
    });

    let stdout = "";

    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    const timeout = setTimeout(() => {
      childProcess.kill();
      resolve({ engine, installed: false });
    }, 5000);

    childProcess.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        const version = stdout.split("\n")[0]?.trim();
        resolve({ engine, installed: true, version });
      } else {
        resolve({ engine, installed: false });
      }
    });

    childProcess.on("error", () => {
      clearTimeout(timeout);
      resolve({ engine, installed: false });
    });
  });
}

systemCheckRouter.get("/system/latex-check", async (_req, res) => {
  const engines = ["pdflatex", "xelatex", "lualatex"];
  const results = await Promise.all(engines.map(checkEngine));

  const anyInstalled = results.some((r) => r.installed);
  const tools = await Promise.all(["latexmk", "biber", "bibtex", "synctex"].map(checkEngine));

  res.json(
    createSuccessResponse({
      latexInstalled: anyInstalled,
      engines: results,
      tools,
      // latexmk = incremental builds; without it TexCraft runs a fixed number of passes
      incrementalBuilds: await hasLatexmk(),
      message: anyInstalled
        ? "LaTeX is installed and ready"
        : "No LaTeX engine found. Please install TeX Live, MiKTeX, or MacTeX.",
    }),
  );
});
