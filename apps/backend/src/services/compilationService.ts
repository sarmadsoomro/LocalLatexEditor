import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import type { CompilationResult } from "@local-latex-editor/shared-types";
import { getProject } from "./projectService.js";
import { parseLaTeXLog } from "./logParser.js";
import { ValidationError, InternalError } from "../types/error.js";

export interface CompileOptions {
  engine?: "pdflatex" | "xelatex" | "lualatex";
  mainFile?: string;
}

const DEFAULT_TIMEOUT_MS = 120000;

/**
 * Compiles a LaTeX project to PDF.
 * Runs two passes for cross-references and optionally runs BibTeX.
 */
export async function compileProject(
  projectId: string,
  options: CompileOptions = {},
): Promise<CompilationResult> {
  const startTime = Date.now();

  const project = await getProject(projectId);
  const projectPath = project.path;

  const mainFile = options.mainFile || project.metadata?.mainFile || "main.tex";
  const mainFilePath = path.join(projectPath, mainFile);

  try {
    await fs.access(mainFilePath);
  } catch {
    throw new ValidationError(`Main file "${mainFile}" not found in project`);
  }

  const engine = options.engine || project.settings?.compiler || "pdflatex";
  const outputDir = path.join(projectPath, "output");
  await fs.mkdir(outputDir, { recursive: true });
  const mainFileBasename = path.basename(mainFile, ".tex");

  // Clean LaTeX intermediate files to avoid stale file issues
  const intermediateExtensions = [".aux", ".log", ".toc", ".bbl", ".blg", ".out", ".nav", ".snm"];
  try {
    const existingFiles = await fs.readdir(outputDir);
    for (const file of existingFiles) {
      if (intermediateExtensions.some(ext => file.endsWith(ext))) {
        await fs.unlink(path.join(outputDir, file));
      }
    }
  } catch {
    // Directory might not exist, that's fine
  }

  let logOutput = "";

  const result1 = await runLatexPass(projectPath, mainFile, engine, outputDir);
  logOutput += result1.output;

  const needsBibTeX = await detectBibTeX(projectPath, mainFile);
  
  // Debug: List all .bib files in project directory
  try {
    const projectFiles = await fs.readdir(projectPath);
    const bibFilesInProject = projectFiles.filter(f => f.endsWith('.bib'));
    logOutput += `\n=== BIB FILES IN PROJECT DIR: ${bibFilesInProject.join(', ') || 'NONE'} ===\n`;
  } catch {
    logOutput += "\n=== COULD NOT LIST PROJECT DIRECTORY ===\n";
  }
  
  let bblCreated = false;
  if (needsBibTeX && result1.exitCode === 0) {
    // Copy .bib files to output directory so biber can find them
    try {
      const files = await fs.readdir(projectPath);
      for (const file of files) {
        if (file.endsWith('.bib')) {
          const srcPath = path.join(projectPath, file);
          const destPath = path.join(outputDir, file);
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch {
      // Ignore errors copying .bib files
    }
    
    const bibResult = await runBibTeX(projectPath, mainFile, engine);
    logOutput += "\n=== BIBLIOGRAPHY PROCESSING ===\n" + bibResult.output;
    
    // Check if .bbl file was created and its size
    const bblPath = path.join(outputDir, `${mainFileBasename}.bbl`);
    try {
      await fs.access(bblPath);
      const bblStats = await fs.stat(bblPath);
      bblCreated = true;
      logOutput += `\n=== BBL FILE CREATED SUCCESSFULLY (size: ${bblStats.size} bytes) ===\n`;
      
      // If bbl is very small, it might be empty
      if (bblStats.size < 100) {
        const bblContent = await fs.readFile(bblPath, 'utf-8');
        logOutput += `\n=== BBL CONTENT (first 500 chars): ===\n${bblContent.substring(0, 500)}\n`;
      }
    } catch {
      logOutput += "\n=== WARNING: BBL FILE NOT CREATED ===\n";
    }
    
    // List all .bib files in output directory
    try {
      const outputFiles = await fs.readdir(outputDir);
      const bibFilesInOutput = outputFiles.filter(f => f.endsWith('.bib'));
      logOutput += `\n=== BIB FILES IN OUTPUT DIR: ${bibFilesInOutput.join(', ') || 'NONE'} ===\n`;
    } catch {
      logOutput += "\n=== COULD NOT LIST OUTPUT DIRECTORY ===\n";
    }
  }

  let result2;
  if (
    result1.exitCode === 0 ||
    logOutput.includes("Warning: Label(s) may have changed")
  ) {
    result2 = await runLatexPass(projectPath, mainFile, engine, outputDir);
    logOutput += "\n" + result2.output;
  }

  if (needsBibTeX && result2 && result2.exitCode === 0) {
    if (!bblCreated) {
      logOutput += "\n=== WARNING: Running LaTeX pass without .bbl file - citations may not appear ===\n";
    }
    const result3 = await runLatexPass(projectPath, mainFile, engine, outputDir);
    logOutput += "\n" + result3.output;
  }

  const parsed = parseLaTeXLog(logOutput);

  const outputPath = path.join(outputDir, `${mainFileBasename}.pdf`);

  let pdfExists = false;
  try {
    await fs.access(outputPath);
    pdfExists = true;
  } catch {
    pdfExists = false;
  }

  const failed =
    (result1.exitCode !== 0 || (result2 && result2.exitCode !== 0)) &&
    !pdfExists;
  if (failed && parsed.errors.length === 0) {
    parsed.errors.push({
      line: 1,
      column: 1,
      message:
        "Compilation failed, but no specific LaTeX error was found in the logs.",
      type: "error",
    });
  }

  // Filter out "Fatal error occurred" errors that don't have a line number
  // as they're a consequence of earlier errors, not independent issues
  parsed.errors = parsed.errors.filter(e => {
    if (e.message.includes("Fatal error occurred") && e.line === 0) {
      return false;
    }
    return true;
  });

  const duration = Date.now() - startTime;

  return {
    success: pdfExists && parsed.errors.length === 0 && !failed,
    outputPath: pdfExists ? outputPath : undefined,
    logOutput,
    errors: parsed.errors,
    warnings: parsed.warnings,
    duration,
  };
}

async function runLatexPass(
  projectPath: string,
  mainFile: string,
  engine: string,
  outputDir: string,
): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const args = [
      "-interaction=nonstopmode",
      "-halt-on-error",
      `-output-directory=${outputDir}`,
      mainFile,
    ];

    const childProcess = spawn(engine, args, {
      cwd: projectPath,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      childProcess.kill();
      reject(
        new InternalError(
          `Compilation timed out after ${DEFAULT_TIMEOUT_MS / 1000} seconds`,
        ),
      );
    }, DEFAULT_TIMEOUT_MS);

    childProcess.on("close", (code) => {
      clearTimeout(timeout);
      const output = stdout + "\n" + stderr;
      resolve({ output, exitCode: code ?? 1 });
    });

    childProcess.on("error", (err) => {
      clearTimeout(timeout);
      if (err.message.includes("ENOENT")) {
        reject(
          new InternalError(
            `LaTeX engine "${engine}" not found. Please ensure ${engine} is installed and in PATH.`,
          ),
        );
      } else {
        reject(new InternalError(`Failed to run ${engine}: ${err.message}`));
      }
    });
  });
}

/**
 * Detects if a LaTeX project requires BibTeX/Biber processing.
 */
export async function detectBibTeX(
  projectPath: string,
  mainFile: string,
): Promise<boolean> {
  const mainFilePath = path.join(projectPath, mainFile);

  try {
    const content = await fs.readFile(mainFilePath, "utf-8");

    const hasBiblatex =
      content.includes("\\usepackage{biblatex}") ||
      (content.includes("\\usepackage[") && content.includes("biblatex"));
    const hasCite = content.includes("\\cite{");
    const hasBibliography = content.includes("\\bibliography{");
    const hasAddBibresource = content.includes("\\addbibresource{");

    return hasBiblatex || hasCite || hasBibliography || hasAddBibresource;
  } catch {
    return false;
  }
}

/**
 * Runs BibTeX or Biber for bibliography processing.
 */
export async function runBibTeX(
  projectPath: string,
  mainFile: string,
  _engine: string,
): Promise<{ output: string; success: boolean }> {
  const mainFileBasename = path.basename(mainFile, ".tex");
  const outputDir = path.join(projectPath, "output");
  const mainFilePath = path.join(projectPath, mainFile);

  let useBiber = false;

  try {
    const content = await fs.readFile(mainFilePath, "utf-8");
    useBiber =
      content.includes("\\usepackage{biblatex}") ||
      (content.includes("\\usepackage[") && content.includes("biblatex"));
  } catch {
    useBiber = false;
  }

  const bibtexEngine = useBiber ? "biber" : "bibtex";
  const args = [mainFileBasename];

  return new Promise((resolve, reject) => {
    const childProcess = spawn(bibtexEngine, args, {
      cwd: outputDir,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      childProcess.kill();
      reject(
        new InternalError(
          `BibTeX timed out after ${DEFAULT_TIMEOUT_MS / 1000} seconds`,
        ),
      );
    }, DEFAULT_TIMEOUT_MS);

    childProcess.on("close", (code) => {
      clearTimeout(timeout);
      const output = stdout + "\n" + stderr;
      resolve({ output, success: code === 0 });
    });

    childProcess.on("error", (err) => {
      clearTimeout(timeout);
      if (err.message.includes("ENOENT")) {
        console.warn(
          `BibTeX engine "${bibtexEngine}" not found, skipping bibliography processing`,
        );
        resolve({ output: `Warning: ${bibtexEngine} not found`, success: false });
      } else {
        reject(
          new InternalError(`Failed to run ${bibtexEngine}: ${err.message}`),
        );
      }
    });
  });
}

export default compileProject;
