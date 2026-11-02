/** The PDF a main file compiles to: "chapters/thesis.tex" -> "thesis.pdf". */
export function pdfNameFor(mainFile: string | undefined): string {
  const base = (mainFile || "main.tex").split(/[\\/]/).pop() || "main.tex";
  return `${base.replace(/\.tex$/i, "") || "document"}.pdf`;
}
