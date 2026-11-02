export interface LatexInstallHelp {
  os: "macos" | "windows" | "linux";
  /** distribution to recommend */
  name: string;
  url: string;
  /** one line on how to install it */
  hint: string;
}

/** Which LaTeX distribution to point a student at, from the browser's user agent. */
export function latexInstallHelp(userAgent: string): LatexInstallHelp {
  if (/Windows/i.test(userAgent)) {
    return {
      os: "windows",
      name: "MiKTeX",
      url: "https://miktex.org/download",
      hint: "Run the installer and keep \"install missing packages on the fly\" set to Yes.",
    };
  }
  if (/Mac OS X|Macintosh/i.test(userAgent)) {
    return {
      os: "macos",
      name: "MacTeX",
      url: "https://www.tug.org/mactex/",
      hint: "Download MacTeX.pkg and open it. It is large (about 6 GB); BasicTeX is a smaller option.",
    };
  }
  return {
    os: "linux",
    name: "TeX Live",
    url: "https://www.tug.org/texlive/",
    hint: "On Ubuntu or Debian: sudo apt install texlive-latex-extra latexmk biber",
  };
}
