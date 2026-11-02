import { describe, expect, it } from "vitest";

import { pathWithTex, texSearchDirs, type TexPathEnv } from "../texPath";

function fake(over: Partial<TexPathEnv> & { dirs?: string[]; listings?: Record<string, string[]> }): TexPathEnv {
  const dirs = new Set(over.dirs ?? []);
  return {
    platform: "darwin",
    arch: "arm64",
    home: "/Users/student",
    env: {},
    listDir: (dir) => over.listings?.[dir] ?? [],
    isDir: (dir) => dirs.has(dir),
    ...over,
  };
}

describe("pathWithTex", () => {
  it("adds MacTeX to the bare PATH a Finder-launched app gets", () => {
    const t = fake({ env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin" }, dirs: ["/Library/TeX/texbin", "/opt/homebrew/bin"] });
    expect(pathWithTex(t)).toBe("/usr/bin:/bin:/usr/sbin:/sbin:/Library/TeX/texbin:/opt/homebrew/bin");
  });

  it("keeps the user's order and skips folders already on PATH", () => {
    const t = fake({ env: { PATH: "/opt/homebrew/bin/:/usr/bin" }, dirs: ["/Library/TeX/texbin", "/opt/homebrew/bin"] });
    expect(pathWithTex(t)).toBe("/opt/homebrew/bin/:/usr/bin:/Library/TeX/texbin");
  });

  it("skips folders that do not exist", () => {
    const t = fake({ env: { PATH: "/usr/bin" } });
    expect(pathWithTex(t)).toBe("/usr/bin");
  });

  it("prefers the newest TeX Live year", () => {
    const t = fake({
      platform: "linux",
      arch: "x64",
      home: "/home/student",
      listings: { "/usr/local/texlive": ["2024", "texmf-local", "2026", "2025"] },
    });
    const dirs = texSearchDirs(t);
    expect(dirs.indexOf("/usr/local/texlive/2026/bin/x86_64-linux")).toBeLessThan(
      dirs.indexOf("/usr/local/texlive/2024/bin/x86_64-linux"),
    );
    expect(dirs).not.toContain("/usr/local/texlive/texmf-local/bin/x86_64-linux");
  });

  it("finds MiKTeX on Windows, reading Path and comparing case-insensitively", () => {
    const miktex = "C:\\Users\\student\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64";
    const t = fake({
      platform: "win32",
      arch: "x64",
      home: "C:\\Users\\student",
      env: { Path: "C:\\Windows\\system32;c:\\program files\\miktex\\miktex\\bin\\x64\\", LOCALAPPDATA: "C:\\Users\\student\\AppData\\Local" },
      dirs: [miktex, "C:\\Program Files\\MiKTeX\\miktex\\bin\\x64"],
    });
    expect(pathWithTex(t)).toBe(["C:\\Windows\\system32", "c:\\program files\\miktex\\miktex\\bin\\x64\\", miktex].join(";"));
  });

  it("finds TeX Live on Windows under bin\\windows", () => {
    const t = fake({ platform: "win32", arch: "x64", home: "C:\\Users\\s", listings: { "C:\\texlive": ["2025"] } });
    expect(texSearchDirs(t)).toContain("C:\\texlive\\2025\\bin\\windows");
  });
});
