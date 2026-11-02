/**
 * Where TeX distributions put their binaries.
 *
 * Apps opened from Finder, the Dock or a Linux desktop launcher do not get the
 * PATH a terminal has (macOS gives GUI apps only /usr/bin:/bin:/usr/sbin:/sbin),
 * so pdflatex is "missing" even though MacTeX or TeX Live is installed. The
 * desktop app appends these folders, when they exist, to the backend's PATH.
 * Folders already on PATH keep their place, so the user's own PATH still wins.
 */
import path from "node:path";

export interface TexPathEnv {
  platform: NodeJS.Platform;
  arch: string;
  home: string;
  env: Record<string, string | undefined>;
  /** directory names inside `dir`, or [] when it does not exist */
  listDir: (dir: string) => string[];
  isDir: (dir: string) => boolean;
}

/** TeX Live installs into one folder per year; newest first. */
function texLiveYears(root: string, t: TexPathEnv): string[] {
  const p = t.platform === "win32" ? path.win32 : path.posix;
  return t.listDir(root)
    .filter((name) => /^\d{4}$/.test(name))
    .sort()
    .reverse()
    .map((year) => p.join(root, year));
}

export function texSearchDirs(t: TexPathEnv): string[] {
  const p = t.platform === "win32" ? path.win32 : path.posix;
  const dirs: string[] = [];

  if (t.platform === "darwin") {
    // MacTeX and BasicTeX install this symlink to the active TeX Live year
    dirs.push("/Library/TeX/texbin");
    for (const year of texLiveYears("/usr/local/texlive", t)) {
      dirs.push(p.join(year, "bin", "universal-darwin"));
    }
    dirs.push(p.join(t.home, "Library", "TinyTeX", "bin", "universal-darwin"));
    // Homebrew (Apple silicon, then Intel) and MacPorts, for latexmk/biber/tectonic
    dirs.push("/opt/homebrew/bin", "/usr/local/bin", "/opt/local/bin");
  } else if (t.platform === "win32") {
    const local = t.env.LOCALAPPDATA ?? p.join(t.home, "AppData", "Local");
    const roaming = t.env.APPDATA ?? p.join(t.home, "AppData", "Roaming");
    const programFiles = t.env.ProgramFiles ?? "C:\\Program Files";
    // MiKTeX, per-user then all-users install
    dirs.push(p.join(local, "Programs", "MiKTeX", "miktex", "bin", "x64"));
    dirs.push(p.join(programFiles, "MiKTeX", "miktex", "bin", "x64"));
    // TeX Live: bin\windows since 2023, bin\win32 / bin\win64 before
    for (const year of texLiveYears("C:\\texlive", t)) {
      for (const sub of ["windows", "win64", "win32"]) dirs.push(p.join(year, "bin", sub));
    }
    dirs.push(p.join(roaming, "TinyTeX", "bin", "windows"));
  } else {
    const arch = t.arch === "arm64" ? "aarch64-linux" : "x86_64-linux";
    for (const year of texLiveYears("/usr/local/texlive", t)) {
      dirs.push(p.join(year, "bin", arch));
    }
    dirs.push(p.join(t.home, ".TinyTeX", "bin", arch));
    dirs.push("/usr/local/bin", "/usr/bin");
  }
  return dirs;
}

/** PATH with the existing TeX folders appended (no duplicates, original order kept). */
export function pathWithTex(t: TexPathEnv): string {
  const delimiter = t.platform === "win32" ? ";" : ":";
  // Windows keeps it as "Path"; read whichever spelling is there
  const current = t.env.PATH ?? t.env.Path ?? "";
  const parts = current.split(delimiter).filter(Boolean);
  const norm = (d: string): string => (t.platform === "win32" ? d.toLowerCase().replace(/\\+$/, "") : d.replace(/\/+$/, ""));
  const seen = new Set(parts.map(norm));
  for (const dir of texSearchDirs(t)) {
    if (!seen.has(norm(dir)) && t.isDir(dir)) {
      parts.push(dir);
      seen.add(norm(dir));
    }
  }
  return parts.join(delimiter);
}
