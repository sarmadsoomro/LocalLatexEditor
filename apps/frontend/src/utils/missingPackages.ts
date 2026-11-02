import type { CompilationError } from "@local-latex-editor/shared-types";

// Same file types the backend accepts. `.tex` is left out: a missing .tex is
// usually the user's own \input, not a package.
const MISSING_FILE = /File `([A-Za-z0-9][A-Za-z0-9._+-]{0,99}\.(?:sty|cls|bst|def|clo|fd|cfg|ldf|cbx|bbx|lbx))' not found/;

/** Package files a compile reported missing, in order, without duplicates. */
export function missingPackageFiles(errors: CompilationError[]): string[] {
  const files: string[] = [];
  for (const e of errors) {
    const file = MISSING_FILE.exec(e.message)?.[1];
    if (file && !files.includes(file)) files.push(file);
  }
  return files;
}
