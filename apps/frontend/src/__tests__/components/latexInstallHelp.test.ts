import { describe, expect, it } from "vitest";

import { latexInstallHelp } from "../../components/latexInstallHelp";

describe("latexInstallHelp", () => {
  it("recommends MiKTeX on Windows", () => {
    const help = latexInstallHelp("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 TexCraft/0.3.0 Electron/44.9.0");
    expect(help.os).toBe("windows");
    expect(help.name).toBe("MiKTeX");
  });

  it("recommends MacTeX on macOS", () => {
    const help = latexInstallHelp("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15");
    expect(help.os).toBe("macos");
    expect(help.url).toContain("mactex");
  });

  it("falls back to TeX Live elsewhere", () => {
    const help = latexInstallHelp("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36");
    expect(help.os).toBe("linux");
    expect(help.hint).toContain("apt install");
  });
});
