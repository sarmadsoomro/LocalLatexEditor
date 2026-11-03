import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

import type { CompilationResult } from "@local-latex-editor/shared-types";

import { ValidationError, InternalError } from "../types/error.js";

import { parseLaTeXLog } from "./logParser.js";
import { getProject } from "./projectService.js";

export type LatexEngine = "pdflatex" | "xelatex" | "lualatex";

export interface CompileOptions {
  engine?: LatexEngine;
  mainFile?: string;
  /** Delete everything in output/ first (a full rebuild). */
  clean?: boolean;
  /** Pass -shell-escape. Off by default; only for documents the user trusts. */
  shellEscape?: boolean;
  /** Total time budget for the whole compile, all passes included. */
  timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 300_000;
export const MIN_TIMEOUT_MS = 30_000;
export const MAX_TIMEOUT_MS = 1_800_000;

const LATEXMK_ENGINE_FLAG: Record<LatexEngine, string> = {
  pdflatex: "-pdf",
  xelatex: "-xelatex",
  lualatex: "-lualatex",
};

let latexmkAvailable: Promise<boolean> | null = null;

/** Whether latexmk is on PATH. Checked once per process. TEXCRAFT_DISABLE_LATEXMK=1 forces the fallback. */
export function hasLatexmk(): Promise<boolean> {
  if (process.env.TEXCRAFT_DISABLE_LATEXMK === "1") return Promise.resolve(false);
  if (!latexmkAvailable) {
    latexmkAvailable = new Promise((resolve) => {
      const child = spawn("latexmk", ["-v"], { shell: false, stdio: "ignore" });
      const timer = setTimeout(() => {
        child.kill();
        resolve(false);
      }, 5000);
      child.on("error", () => {
        clearTimeout(timer);
        resolve(false);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve(code === 0);
      });
    });
  }
  return latexmkAvailable;
}

/** Test hook: forget the cached latexmk check. */
export function resetLatexmkCheck(): void {
  latexmkAvailable = null;
}

interface ProcessResult {
  output: string;
  exitCode: number;
}

class Deadline {
  private readonly endsAt: number;
  constructor(readonly totalMs: number) {
    this.endsAt = Date.now() + totalMs;
  }
  remaining(): number {
    return this.endsAt - Date.now();
  }
  timeoutError(): InternalError {
    return new InternalError(
      `Compilation timed out after ${Math.round(this.totalMs / 1000)} seconds. ` +
        "Increase the compile timeout in Settings → Compiler for very long documents.",
    );
  }
}

/**
 * Environment for TeX and its tools. Unless the user trusts the document
 * (shell-escape on), TeX Live may only read and write files inside the
 * project: openin_any=p stops \input{/home/me/.ssh/id_rsa} from copying a
 * private file into the PDF. MiKTeX ignores these variables.
 */
export function texEnv(trusted: boolean, base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  if (trusted) return base;
  return { ...base, openin_any: "p", openout_any: "p" };
}

/**
 * The main file as a path relative to the project. It must be a .tex file
 * inside the project, and must not start with "-", which latexmk and the
 * engines would read as an option.
 */
export function safeMainFile(projectPath: string, mainFile: string): string {
  const relative = path.normalize(mainFile).replace(/\\/g, "/").replace(/^\.\//, "");
  const inside = path.relative(projectPath, path.resolve(projectPath, relative));
  if (
    inside === "" ||
    inside.startsWith("..") ||
    path.isAbsolute(inside) ||
    path.isAbsolute(relative) ||
    relative.startsWith("-") ||
    relative.includes("\0") ||
    path.extname(relative).toLowerCase() !== ".tex"
  ) {
    throw new ValidationError(`Main file "${mainFile}" must be a .tex file inside the project`);
  }
  return relative;
}

/** Kill a process and everything it started (latexmk spawns pdflatex, biber, ...). */
function killTree(pid: number | undefined): void {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { shell: false, stdio: "ignore" }).on(
      "error",
      () => undefined,
    );
    return;
  }
  try {
    // negative pid = the whole process group (the child was spawned detached)
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* already gone */
    }
  }
}

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  deadline: Deadline,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const remaining = deadline.remaining();
    if (remaining <= 0) {
      reject(deadline.timeoutError());
      return;
    }

    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      // own process group on POSIX so a timeout can kill grandchildren too
      detached: process.platform !== "win32",
    });

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      output += data.toString();
    });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child.pid);
    }, remaining);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(deadline.timeoutError());
        return;
      }
      resolve({ output, exitCode: code ?? 1 });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new InternalError(
            `"${command}" was not found. Install a LaTeX distribution (TeX Live, MacTeX or MiKTeX) and make sure ${command} is on PATH.`,
          ),
        );
      } else {
        reject(new InternalError(`Failed to run ${command}: ${err.message}`));
      }
    });
  });
}

/**
 * pdflatex cannot write output/chapters/ch1.aux for \include{chapters/ch1}
 * unless output/chapters exists. Mirror the project's folders into output/.
 */
async function mirrorSubdirectories(projectPath: string, outputDir: string, rel = ""): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(path.join(projectPath, rel), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    if (rel === "" && entry.name === "output") continue;
    const sub = path.join(rel, entry.name);
    await fs.mkdir(path.join(outputDir, sub), { recursive: true });
    await mirrorSubdirectories(projectPath, outputDir, sub);
  }
}

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compiles a LaTeX project to PDF.
 *
 * Uses latexmk when it is installed: it keeps auxiliary files between runs and
 * only reruns LaTeX/BibTeX/Biber as often as needed, so a one-line change in a
 * long document does not trigger a full rebuild. Without latexmk it falls back
 * to running the engine (and BibTeX/Biber) a fixed number of times.
 */
export async function compileProject(
  projectId: string,
  options: CompileOptions = {},
): Promise<CompilationResult> {
  const startTime = Date.now();

  const project = await getProject(projectId);
  const projectPath = project.path;

  const mainFile = safeMainFile(projectPath, options.mainFile || project.metadata?.mainFile || "main.tex");
  const mainFilePath = path.join(projectPath, mainFile);
  if (!(await exists(mainFilePath))) {
    throw new ValidationError(`Main file "${mainFile}" not found in project`);
  }

  const engine: LatexEngine = options.engine || (project.settings?.compiler as LatexEngine) || "pdflatex";
  const timeoutMs = Math.min(
    Math.max(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1000),
    MAX_TIMEOUT_MS,
  );
  const outputDir = path.join(projectPath, "output");
  const mainBase = path.basename(mainFile, ".tex");

  if (options.clean) {
    await fs.rm(outputDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
  await fs.mkdir(outputDir, { recursive: true });
  await mirrorSubdirectories(projectPath, outputDir);

  const shellEscape = options.shellEscape === true;
  const run = async (): Promise<{ logOutput: string; exitCode: number }> => {
    // one budget for the whole compile, including an automatic rebuild
    const deadline = new Deadline(timeoutMs - (Date.now() - startTime));
    return (await hasLatexmk())
      ? runLatexmk(projectPath, mainFile, engine, outputDir, shellEscape, deadline)
      : runManualPasses(projectPath, mainFile, engine, outputDir, shellEscape, deadline);
  };

  let { logOutput, exitCode } = await run();
  let result = await collectResult(outputDir, mainBase, logOutput, exitCode);

  // A broken .aux from an earlier failed run can make every later run fail,
  // even after the source is fixed. Rebuild once from scratch.
  if (!result.success && !options.clean && (await staleAuxSuspected(outputDir, mainBase, result))) {
    await fs.rm(outputDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    await fs.mkdir(outputDir, { recursive: true });
    await mirrorSubdirectories(projectPath, outputDir);
    ({ logOutput, exitCode } = await run());
    logOutput = "TexCraft: stale auxiliary files detected, rebuilt from scratch.\n\n" + logOutput;
    result = await collectResult(outputDir, mainBase, logOutput, exitCode);
  }

  return { ...result, duration: Date.now() - startTime };
}

/**
 * True when the first error was raised while reading an .aux file. TeX
 * usually closes the .aux before reporting, so the error follows directly
 * after "(output/main.aux)" in the log.
 */
async function staleAuxSuspected(
  outputDir: string,
  mainBase: string,
  result: Omit<CompilationResult, "duration">,
): Promise<boolean> {
  if (result.errors.some((e) => e.file?.endsWith(".aux"))) return true;
  const log = await readIfExists(path.join(outputDir, `${mainBase}.log`));
  if (!log) return false;
  const lines = log.split("\n");
  const firstError = lines.findIndex((line) => line.startsWith("! "));
  if (firstError < 0) return false;
  return lines.slice(Math.max(0, firstError - 4), firstError).some((line) => /\.aux\)?\s*$/.test(line));
}

async function collectResult(
  outputDir: string,
  mainBase: string,
  logOutput: string,
  exitCode: number,
): Promise<Omit<CompilationResult, "duration">> {
  // The engine's own .log for the last pass is the most reliable source of
  // errors: latexmk's console output repeats them once per pass.
  const engineLog = await readIfExists(path.join(outputDir, `${mainBase}.log`));
  const parsed = parseLaTeXLog(engineLog ?? logOutput);

  // "Fatal error occurred" with no line is a consequence of an earlier error.
  parsed.errors = parsed.errors.filter(
    (e) => !(e.message.includes("Fatal error occurred") && e.line === 0),
  );

  const outputPath = path.join(outputDir, `${mainBase}.pdf`);
  const pdfExists = await exists(outputPath);

  // Show LaTeX's own log first (what students search for), then latexmk's summary.
  if (engineLog && engineLog !== logOutput) {
    logOutput = `${engineLog.trimEnd()}\n\n=== Build tool output ===\n${logOutput}`;
  }

  const failed = exitCode !== 0 || !pdfExists;
  if (failed && parsed.errors.length === 0) {
    parsed.errors.push({
      line: 1,
      column: 1,
      message: pdfExists
        ? "Compilation reported a problem, but no specific LaTeX error was found in the log. See the full log for details."
        : "Compilation failed and no PDF was produced. See the full log for details.",
      type: "error",
    });
  }

  return {
    success: pdfExists && !failed && parsed.errors.length === 0,
    outputPath: pdfExists ? outputPath : undefined,
    logOutput,
    errors: parsed.errors,
    warnings: parsed.warnings,
  };
}

async function runLatexmk(
  projectPath: string,
  mainFile: string,
  engine: LatexEngine,
  outputDir: string,
  shellEscape: boolean,
  deadline: Deadline,
): Promise<{ logOutput: string; exitCode: number }> {
  const args = [
    // A latexmkrc in the project is Perl that latexmk runs. A downloaded
    // project must not run code on Compile, so ignore every rc file unless
    // the user trusts the document.
    ...(shellEscape ? [] : ["-norc"]),
    LATEXMK_ENGINE_FLAG[engine],
    "-interaction=nonstopmode",
    "-synctex=1",
    `-outdir=${outputDir}`,
  ];
  if (shellEscape) args.push("-shell-escape");
  args.push(mainFile);

  const result = await runProcess("latexmk", args, projectPath, deadline, texEnv(shellEscape));
  return { logOutput: result.output, exitCode: result.exitCode };
}

/** Fallback when latexmk is not installed: engine, BibTeX/Biber if needed, then engine again. */
async function runManualPasses(
  projectPath: string,
  mainFile: string,
  engine: LatexEngine,
  outputDir: string,
  shellEscape: boolean,
  deadline: Deadline,
): Promise<{ logOutput: string; exitCode: number }> {
  const mainBase = path.basename(mainFile, ".tex");
  const engineArgs = [
    "-interaction=nonstopmode",
    "-synctex=1",
    `-output-directory=${outputDir}`,
  ];
  if (shellEscape) engineArgs.push("-shell-escape");
  engineArgs.push(mainFile);

  const pass = (): Promise<ProcessResult> => runProcess(engine, engineArgs, projectPath, deadline, texEnv(shellEscape));

  let logOutput = "";
  const first = await pass();
  logOutput += first.output;
  if (first.exitCode !== 0) {
    return { logOutput, exitCode: first.exitCode };
  }

  const bib = await detectBibliography(projectPath, mainFile);
  if (bib) {
    const bibResult = await runBibliography(bib, projectPath, outputDir, mainBase, shellEscape, deadline);
    logOutput += `\n=== ${bib.toUpperCase()} ===\n` + bibResult.output;
  }

  // Two more passes resolve citations, references and the table of contents.
  const passes = bib ? 2 : 1;
  let last = first;
  for (let i = 0; i < passes; i++) {
    last = await pass();
    logOutput += "\n" + last.output;
    if (last.exitCode !== 0) break;
  }
  return { logOutput, exitCode: last.exitCode };
}

/** Returns which bibliography tool the main file needs, if any. */
export async function detectBibliography(
  projectPath: string,
  mainFile: string,
): Promise<"biber" | "bibtex" | null> {
  const content = await readIfExists(path.join(projectPath, mainFile));
  if (!content) return null;
  const uncommented = content
    .split("\n")
    .map((line) => line.replace(/(^|[^\\])%.*$/, "$1"))
    .join("\n");
  if (/\\usepackage(\[[^\]]*\])?\{[^}]*\bbiblatex\b[^}]*\}/.test(uncommented)) {
    return /backend\s*=\s*bibtex/.test(uncommented) ? "bibtex" : "biber";
  }
  if (/\\bibliography\{/.test(uncommented)) return "bibtex";
  return null;
}

async function runBibliography(
  tool: "biber" | "bibtex",
  projectPath: string,
  outputDir: string,
  mainBase: string,
  trusted: boolean,
  deadline: Deadline,
): Promise<ProcessResult> {
  // Both tools run inside output/ (where the .aux/.bcf live) and find .bib
  // files in the project folder through BIBINPUTS. Copy .bib files as well:
  // some Biber builds ignore BIBINPUTS for relative \addbibresource paths.
  await copyBibFiles(projectPath, outputDir);
  const env = {
    ...texEnv(trusted),
    BIBINPUTS: [projectPath, outputDir, process.env.BIBINPUTS ?? ""].join(path.delimiter),
  };
  try {
    return await runProcess(tool, [mainBase], outputDir, deadline, env);
  } catch (error) {
    // A missing bibliography tool should not hide the PDF; report it in the log.
    if (error instanceof InternalError && error.message.includes("was not found")) {
      return { output: `Warning: ${error.message}`, exitCode: 1 };
    }
    throw error;
  }
}

async function copyBibFiles(projectPath: string, outputDir: string, rel = ""): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(path.join(projectPath, rel), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const sub = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || (rel === "" && entry.name === "output")) continue;
      await copyBibFiles(projectPath, outputDir, sub);
    } else if (entry.name.endsWith(".bib")) {
      await fs.mkdir(path.join(outputDir, rel), { recursive: true });
      await fs.copyFile(path.join(projectPath, sub), path.join(outputDir, sub));
    }
  }
}

export default compileProject;
