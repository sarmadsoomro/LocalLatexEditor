import type {
  CompilationError,
  CompilationWarning,
  AutoFix,
} from "@local-latex-editor/shared-types";

export interface ParsedLogResult {
  errors: CompilationError[];
  warnings: CompilationWarning[];
}

const PATTERNS = {
  latexErrorWithLine: /^!\s+(.+?)\n\s*l\.(\d+)(?:\s+(.+))?$/m,
  latexErrorFileNotFound: /^!\s+LaTeX Error:\s*(.+)$/m,
  fileLineError: /^(.+?):(\d+):\s*(.+)$/m,
  warningCitation:
    /^Warning:\s*Citation\s+`([^']+)'\s+on\s+page\s+\d+\s+undefined$/m,
  warningReference:
    /^LaTeX Warning:\s*Reference\s+`([^']+)'\s+on\s+page\s+\d+\s+undefined$/m,
  warningUndefined: /^LaTeX Warning:\s*(.+?)\s+on\s+page\s+\d+\s+undefined$/m,
  overfullHbox:
    /^Overfull\s+\\hbox\s+\([^)]+\)\s+in\s+paragraph\s+at\s+lines\s+(\d+)--(\d+)$/m,
  underfullHbox:
    /^Underfull\s+\\hbox\s+\([^)]+\)\s+in\s+paragraph\s+at\s+lines\s+(\d+)--(\d+)$/m,
  missingInserted:
    /^!\s+Missing \$ inserted\.\s*$\n(?:<inserted text>\s*(.+?)\s*$\n)?\s*l\.(\d+)/m,
  lineOnly: /^\s*l\.(\d+)(?:\s+(.+))?$/m,
  extractFilePath: /^((?:\.\/)?[^\s:]+)/,
};

interface RawErrorBlock {
  errorType: string;
  line: number | null;
  file: string | null;
  message: string;
  context: string[];
}

function extractFileFromContext(contextLines: string[]): string | null {
  for (const line of contextLines.reverse()) {
    const match = line.match(PATTERNS.extractFilePath);
    if (
      match &&
      (match[1].startsWith("./") ||
        match[1].startsWith("../") ||
        match[1].startsWith("/"))
    ) {
      return match[1];
    }
  }
  return null;
}

function generateAutoFixes(
  errorType: string,
  message: string,
  line: number,
  context: string[],
): AutoFix[] | undefined {
  const fixes: AutoFix[] = [];
  const fullContext = context.join(" ");

  if (
    message.includes("\\includegraphics") ||
    errorType.includes("\\includegraphics")
  ) {
    fixes.push({
      title: "Add \\usepackage{graphicx}",
      line: 1,
      insertText: "\\usepackage{graphicx}\n",
      type: "insert",
    });
  }

  if (
    message.includes("Environment align undefined") ||
    message.includes("Environment equation undefined") ||
    message.includes("Environment pmatrix undefined")
  ) {
    fixes.push({
      title: "Add \\usepackage{amsmath}",
      line: 1,
      insertText: "\\usepackage{amsmath}\n",
      type: "insert",
    });
  }

  if (
    (message.includes("Undefined control sequence") ||
      errorType.includes("Undefined control sequence")) &&
    (message.includes("\\bgn") || fullContext.includes("\\bgn"))
  ) {
    fixes.push({
      title: "Change \\bgn to \\begin",
      line: line,
      insertText: "\\begin",
      type: "replace",
      matchText: "\\bgn",
    });
  }

  if (
    message.includes("Missing \\begin{document}") ||
    errorType.includes("Missing \\begin{document}")
  ) {
    fixes.push({
      title: "Add \\begin{document}",
      line: line,
      insertText: "\\begin{document}\n",
      type: "insert",
    });
  }

  if (
    errorType.includes("Missing $ inserted") ||
    message.includes("Missing $ inserted")
  ) {
    fixes.push({
      title: "Wrap in math mode ($...$)",
      line: line,
      insertText: "$",
      type: "insert",
    });
  }

  return fixes.length > 0 ? fixes : undefined;
}

function parseErrorBlock(
  lines: string[],
  startIndex: number,
): { error: RawErrorBlock; endIndex: number } {
  const contextLines: string[] = [];
  let currentIndex = startIndex;
  let errorType = "";
  let message = "";
  let line: number | null = null;
  let file: string | null = null;

  if (lines[currentIndex]?.startsWith("!")) {
    errorType = lines[currentIndex].substring(1).trim();
    message = errorType;
    currentIndex++;
  }

  while (currentIndex < lines.length) {
    const currentLine = lines[currentIndex];

    // Match standalone line number patterns like "l.58" or "l.58 8"
    const lineMatch = currentLine.match(/^l\.(\d+)(?:\s+(\d+))?$/);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
      currentIndex++;
      break;
    }

    // Match file:line:message patterns
    const fileLineMatch = currentLine.match(/^(.+?):(\d+):\s*(.+)$/);
    if (fileLineMatch) {
      file = fileLineMatch[1];
      line = parseInt(fileLineMatch[2], 10);
      message = fileLineMatch[3];
      currentIndex++;
      break;
    }

    // End of error block - encountered another error marker
    if (currentLine?.startsWith("!")) {
      break;
    }

    // Skip blank lines when looking for line number
    if (currentLine?.trim() === "") {
      currentIndex++;
      continue;
    }

    // Collect context lines and look for file:line:message patterns
    if (currentLine) {
      contextLines.push(currentLine);

      const inlineMatch = currentLine.match(/^(.+?):(\d+):\s*(.+)$/);
      if (inlineMatch) {
        file = inlineMatch[1];
        line = parseInt(inlineMatch[2], 10);
        message = inlineMatch[3];
      }
    }

    currentIndex++;
  }

  if (!file) {
    file = extractFileFromContext(contextLines);
  }

  return {
    error: {
      errorType,
      line,
      file,
      message,
      context: contextLines,
    },
    endIndex: currentIndex,
  };
}

function toCompilationError(block: RawErrorBlock): CompilationError | null {
  const fixes = generateAutoFixes(
    block.errorType,
    block.message,
    block.line || 0,
    block.context,
  );

  return {
    line: block.line || 0, // Fallback to 0 if line is null so error is not swallowed
    column: 0,
    message: block.message,
    type: "error",
    file: block.file || undefined,
    fixes,
  };
}

/**
 * Parses LaTeX compilation log output and extracts errors and warnings.
 *
 * Supports common LaTeX log patterns including:
 * - Error blocks starting with ! followed by line numbers
 * - File:line:message format errors
 * - Citation and reference warnings
 * - Overfull/underfull hbox warnings
 *
 * @param logOutput - Raw LaTeX compilation log as a string
 * @returns Structured result containing arrays of CompilationError and CompilationWarning
 */
export function parseLaTeXLog(logOutput: string): ParsedLogResult {
  const errors: CompilationError[] = [];
  const warnings: CompilationWarning[] = [];
  const lines = logOutput.split("\n");

  let i = 0;
  const processedRanges: Array<{ start: number; end: number }> = [];

  function wasProcessed(start: number, end: number): boolean {
    return processedRanges.some(
      (range) => start >= range.start && end <= range.end,
    );
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (
      processedRanges.length > 0 &&
      i <= processedRanges[processedRanges.length - 1].end
    ) {
      i++;
      continue;
    }

    const latexErrorMatch = trimmedLine.match(/^!\s+(.+?)$/);
    if (latexErrorMatch) {
      const blockResult = parseErrorBlock(lines, i);
      processedRanges.push({ start: i, end: blockResult.endIndex });

      const compilationError = toCompilationError(blockResult.error);
      if (compilationError) {
        errors.push(compilationError);
      } else if (blockResult.error.errorType) {
        errors.push({
          line: 0,
          column: 0,
          message: blockResult.error.errorType,
          type: "error",
          file: blockResult.error.file || undefined,
        });
      }
      i = blockResult.endIndex;
      continue;
    }

    const fileLineMatch = trimmedLine.match(
      /^(?:\.\/|\.\.\/|\/)?[^\s:]+:\d+:\s*(.+)$/,
    );
    if (fileLineMatch) {
      const fullMatch = trimmedLine.match(
        /^((?:\.\/|\.\.\/|\/)?[^\s:]+):(\d+):\s*(.+)$/,
      );
      if (fullMatch && !wasProcessed(i, i)) {
        const line = parseInt(fullMatch[2], 10);
        const message = fullMatch[3];
        errors.push({
          line,
          column: 0,
          message,
          type: "error",
          file: fullMatch[1],
          fixes: generateAutoFixes(message, message, line, [trimmedLine]),
        });
        processedRanges.push({ start: i, end: i });
      }
      i++;
      continue;
    }

    const citationMatch = trimmedLine.match(
      /^Warning:\s*Citation\s+`([^']+)'\s+on\s+page\s+(\d+)\s+undefined$/,
    );
    if (citationMatch) {
      warnings.push({
        line: 0,
        message: `Citation '${citationMatch[1]}' on page ${citationMatch[2]} undefined`,
        file: undefined,
      });
      i++;
      continue;
    }

    const refMatch = trimmedLine.match(
      /^LaTeX Warning:\s*Reference\s+`([^']+)'\s+on\s+page\s+(\d+)\s+undefined$/,
    );
    if (refMatch) {
      warnings.push({
        line: 0,
        message: `Reference '${refMatch[1]}' on page ${refMatch[2]} undefined`,
        file: undefined,
      });
      i++;
      continue;
    }

    const genericWarningMatch = trimmedLine.match(
      /^LaTeX Warning:\s*(.+?)\s+on\s+page\s+\d+\s+undefined$/,
    );
    if (genericWarningMatch) {
      warnings.push({
        line: 0,
        message: genericWarningMatch[1],
        file: undefined,
      });
      i++;
      continue;
    }

    const overfullMatch = trimmedLine.match(
      /^Overfull\s+\\hbox\s+\([^)]+\)\s+in\s+paragraph\s+at\s+lines\s+(\d+)--(\d+)$/,
    );
    if (overfullMatch) {
      warnings.push({
        line: parseInt(overfullMatch[1], 10),
        message: `Overfull \\hbox in paragraph at lines ${overfullMatch[1]}--${overfullMatch[2]}`,
        file: undefined,
      });
      i++;
      continue;
    }

    const underfullMatch = trimmedLine.match(
      /^Underfull\s+\\hbox\s+\([^)]+\)\s+in\s+paragraph\s+at\s+lines\s+(\d+)--(\d+)$/,
    );
    if (underfullMatch) {
      warnings.push({
        line: parseInt(underfullMatch[1], 10),
        message: `Underfull \\hbox in paragraph at lines ${underfullMatch[1]}--${underfullMatch[2]}`,
        file: undefined,
      });
      i++;
      continue;
    }

    i++;
  }

  return { errors, warnings };
}

export default parseLaTeXLog;
