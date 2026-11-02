/**
 * Find and install LaTeX packages that a compile reported missing
 * ("LaTeX Error: File `lipsum.sty' not found").
 *
 * TeX Live (MacTeX, BasicTeX, TinyTeX, upstream TeX Live) installs with tlmgr.
 * When the installation folder is writable (TinyTeX, a user install), tlmgr runs
 * directly. On macOS a system install (/usr/local/texlive) needs an administrator:
 * the install goes through the standard macOS password prompt (osascript), so
 * TexCraft never sees the password. Debian/Ubuntu TeX Live and other read-only
 * installs get a command to run instead. MiKTeX installs per user with its own
 * package manager.
 *
 * Nothing here goes through a shell, except the one macOS admin command, which
 * is built only from a validated absolute tlmgr path and a validated package name.
 */
import { spawn } from "child_process";
import { promises as fs, constants as fsConstants } from "fs";
import path from "path";

import { AppError, ValidationError } from "../types/error.js";

/** Files a missing package can provide. `.tex` is left out: that is usually the user's own \input. */
export const PACKAGE_FILE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,99}\.(sty|cls|bst|def|clo|fd|cfg|ldf|cbx|bbx|lbx)$/;
export const PACKAGE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,99}$/;
/** Characters allowed in the tlmgr path we hand to the macOS admin prompt. */
const SAFE_PATH_PATTERN = /^\/[A-Za-z0-9 _./+-]+$/;

export type PackageManager = "tlmgr" | "miktex" | "none";
/** install: TexCraft runs it. admin: TexCraft runs it after the macOS password prompt. manual: the user runs `command`. */
export type InstallMethod = "install" | "admin" | "manual";

export interface PackageLookup {
  file: string;
  /** The package that provides the file (a best guess when the online search is unavailable). */
  package: string;
  manager: PackageManager;
  method: InstallMethod;
  /** The command that installs it, to show the user (and to run for "manual"). */
  command: string;
  /** Extra advice for the user, such as why it must be run by hand. */
  note?: string;
}

export interface InstallResult {
  package: string;
  output: string;
}

interface RunResult {
  code: number;
  output: string;
}

const LOOKUP_TIMEOUT_MS = 60_000;
const INSTALL_TIMEOUT_MS = 10 * 60_000;

function run(cmd: string, args: string[], timeoutMs: number): Promise<RunResult> {
  return new Promise((resolve) => {
    let output = "";
    let settled = false;
    const finish = (r: RunResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };
    let child;
    try {
      child = spawn(cmd, args, { shell: false, windowsHide: true });
    } catch (err) {
      resolve({ code: -1, output: err instanceof Error ? err.message : String(err) });
      return;
    }
    const timer = setTimeout(() => {
      child.kill();
      finish({ code: -1, output: `${output}\nTimed out after ${Math.round(timeoutMs / 1000)} seconds.` });
    }, timeoutMs);
    child.stdout?.on("data", (d: Buffer) => (output += d.toString()));
    child.stderr?.on("data", (d: Buffer) => (output += d.toString()));
    child.on("error", (err) => finish({ code: -1, output: `${output}${err.message}` }));
    child.on("close", (code) => finish({ code: code ?? -1, output }));
  });
}

/** Absolute path of an executable on PATH, or null. */
export async function findExecutable(name: string): Promise<string | null> {
  const dirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  const exts = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext.toLowerCase());
      try {
        await fs.access(candidate, process.platform === "win32" ? fsConstants.F_OK : fsConstants.X_OK);
        return candidate;
      } catch {
        // keep looking
      }
    }
  }
  return null;
}

async function isWritable(dir: string): Promise<boolean> {
  try {
    await fs.access(dir, fsConstants.W_OK);
    return true;
  } catch {
    return false;
  }
}

interface TexLiveInfo {
  tlmgr: string;
  /** The TeX Live root, from "tlmgr using installation: <root>". */
  root: string | null;
}

async function texLive(): Promise<TexLiveInfo | null> {
  const tlmgr = await findExecutable("tlmgr");
  if (!tlmgr) return null;
  const { output } = await run(tlmgr, ["--version"], 15_000);
  const root = /using installation:\s*(.+)/.exec(output)?.[1]?.trim() ?? null;
  return { tlmgr, root };
}

/** Debian and Ubuntu ship TeX Live in /usr/share/texlive and manage it with apt. */
function isDistroTexLive(root: string | null): boolean {
  return root !== null && root.replace(/\\/g, "/").startsWith("/usr/share/texlive");
}

/**
 * Package that ships `file`, from `tlmgr search --global --file`. Output looks like
 *   lipsum:
 *   \ttexmf-dist/tex/latex/lipsum/lipsum.sty
 */
export function parseTlmgrSearch(output: string, file: string): string | null {
  let current: string | null = null;
  for (const raw of output.split(/\r?\n/)) {
    const pkg = /^([A-Za-z0-9][A-Za-z0-9._+-]*):\s*$/.exec(raw);
    if (pkg) {
      current = pkg[1] ?? null;
      continue;
    }
    if (current && /^\s/.test(raw) && path.posix.basename(raw.trim()) === file) {
      // "collection-..." and "scheme-..." never ship files themselves; skip just in case
      if (!/^(collection|scheme)-/.test(current)) return current;
    }
  }
  return null;
}

function baseName(file: string): string {
  return file.replace(/\.[^.]+$/, "");
}

export async function lookupPackage(file: string): Promise<PackageLookup> {
  if (!PACKAGE_FILE_PATTERN.test(file)) {
    throw new ValidationError(`"${file}" is not a LaTeX package file name`);
  }

  const tl = await texLive();
  if (tl) {
    if (isDistroTexLive(tl.root)) {
      return {
        file,
        package: baseName(file),
        manager: "tlmgr",
        method: "manual",
        command: "sudo apt install texlive-latex-extra",
        note:
          "Your LaTeX is managed by the system package manager. texlive-latex-extra has most packages; " +
          "if it is still missing, texlive-full has all of them (sudo apt install texlive-full).",
      };
    }

    const found = await run(tl.tlmgr, ["search", "--global", "--file", `/${file}`], LOOKUP_TIMEOUT_MS);
    const pkg = (found.code === 0 && parseTlmgrSearch(found.output, file)) || baseName(file);
    const writable = tl.root ? await isWritable(tl.root) : false;
    if (writable) {
      return { file, package: pkg, manager: "tlmgr", method: "install", command: `tlmgr install ${pkg}` };
    }
    if (process.platform === "darwin" && SAFE_PATH_PATTERN.test(tl.tlmgr)) {
      return {
        file,
        package: pkg,
        manager: "tlmgr",
        method: "admin",
        command: `sudo tlmgr install ${pkg}`,
        note: "macOS will ask for your password, because LaTeX is installed for all users.",
      };
    }
    return { file, package: pkg, manager: "tlmgr", method: "manual", command: `sudo tlmgr install ${pkg}` };
  }

  const miktex = await findExecutable("miktex");
  if (miktex) {
    const pkg = baseName(file);
    return { file, package: pkg, manager: "miktex", method: "install", command: `miktex packages install ${pkg}` };
  }

  return {
    file,
    package: baseName(file),
    manager: "none",
    method: "manual",
    command: "",
    note: "TexCraft could not find tlmgr or MiKTeX. Install the package with your LaTeX distribution's package manager.",
  };
}

/** AppleScript string literal for a shell command. Inputs are validated, so there is nothing to escape. */
export function adminScript(tlmgr: string, pkg: string): string {
  const t = `'${tlmgr}'`;
  // An old tlmgr refuses to install until it has updated itself.
  const shell = `${t} install ${pkg} || (${t} update --self && ${t} install ${pkg})`;
  return `do shell script "${shell}" with administrator privileges`;
}

const NEEDS_SELF_UPDATE = /tlmgr itself needs to be updated/i;

let installing = false;

export async function installPackage(file: string, pkg: string): Promise<InstallResult> {
  if (!PACKAGE_NAME_PATTERN.test(pkg)) {
    throw new ValidationError(`"${pkg}" is not a valid package name`);
  }
  // Re-derive the method on the server: never trust the page to say how to run things.
  const lookup = await lookupPackage(file);
  if (lookup.method === "manual") {
    throw new AppError("INSTALL_MANUAL", `Run this in a terminal to install ${pkg}: ${lookup.command}`, 409, {
      command: lookup.command,
    });
  }
  if (installing) {
    throw new AppError("INSTALL_BUSY", "Another package is being installed. Try again when it finishes.", 409);
  }
  installing = true;
  try {
    let result: RunResult;
    if (lookup.manager === "miktex") {
      const miktex = (await findExecutable("miktex")) as string;
      result = await run(miktex, ["packages", "install", pkg], INSTALL_TIMEOUT_MS);
    } else {
      const tl = (await texLive()) as TexLiveInfo;
      if (lookup.method === "admin") {
        result = await run("osascript", ["-e", adminScript(tl.tlmgr, pkg)], INSTALL_TIMEOUT_MS);
        if (result.code !== 0 && /User cancel+ed|\(-128\)/i.test(result.output)) {
          throw new AppError("INSTALL_CANCELLED", "Install cancelled.", 400);
        }
      } else {
        result = await run(tl.tlmgr, ["install", pkg], INSTALL_TIMEOUT_MS);
        if (result.code !== 0 && NEEDS_SELF_UPDATE.test(result.output)) {
          const self = await run(tl.tlmgr, ["update", "--self"], INSTALL_TIMEOUT_MS);
          result = self.code === 0 ? await run(tl.tlmgr, ["install", pkg], INSTALL_TIMEOUT_MS) : self;
        }
      }
    }
    if (result.code !== 0) {
      throw new AppError("INSTALL_FAILED", installFailureMessage(pkg, result.output), 502, {
        output: result.output.slice(-4000),
        command: lookup.command,
      });
    }
    return { package: pkg, output: result.output.slice(-4000) };
  } finally {
    installing = false;
  }
}

/** A short, actionable reason from tlmgr's output. */
export function installFailureMessage(pkg: string, output: string): string {
  if (/is older than remote repository|Cross release updates are only supported/i.test(output)) {
    return (
      `Could not install ${pkg}: your TeX Live is older than the online package server, which only serves the newest year. ` +
      "Install the current MacTeX or TeX Live, then try again."
    );
  }
  if (/package .* not present in repository|no installable package/i.test(output)) {
    return `Could not install ${pkg}: no package with that name. Search for the file at ctan.org and install the package it belongs to.`;
  }
  if (/unable to|could not|cannot (connect|download)|timed? ?out|network/i.test(output)) {
    return `Could not install ${pkg}: the download failed. Check your internet connection and try again.`;
  }
  return `Could not install ${pkg}. See the details below.`;
}
