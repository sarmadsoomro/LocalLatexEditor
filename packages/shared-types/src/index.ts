export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  mainFile?: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  path: string;
  content: string;
  type: "tex" | "bib" | "cls" | "sty" | "pdf" | "image" | "other";
  isDirty: boolean;
  lastModified: string;
}

export interface CompilationResult {
  success: boolean;
  outputPath?: string;
  logOutput: string;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  duration: number;
}

export interface AutoFix {
  title: string;
  line: number;
  insertText: string;
  type: "replace" | "insert";
  matchText?: string;
}

export interface CompilationError {
  line: number;
  column: number;
  message: string;
  type: "error" | "warning";
  file?: string;
  fixes?: AutoFix[];
}

export interface CompilationWarning {
  line: number;
  message: string;
  file?: string;
}

export interface EditorState {
  currentProjectId: string | null;
  openFiles: string[];
  activeFileId: string | null;
  dirtyFiles: Set<string>;
}

export interface CompilationState {
  isCompiling: boolean;
  lastResult?: CompilationResult;
  currentJobId?: string;
}

export * from "./api";
export * from "./project";
export * from "./file";
