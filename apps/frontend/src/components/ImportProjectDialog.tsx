import { useState, useRef, useCallback, useEffect } from "react";

interface ImportProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sourcePath: string, name: string) => void;
  onImportZip: (file: File, name: string) => void;
}

type ImportMode = "path" | "zip";

export function ImportProjectDialog({
  isOpen,
  onClose,
  onImport,
  onImportZip,
}: ImportProjectDialogProps) {
  // Early return BEFORE hooks to prevent hooks count mismatch
  if (!isOpen) return null;

  const [mode, setMode] = useState<ImportMode>("path");
  const [sourcePath, setSourcePath] = useState("");
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        pathInputRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTab);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setSourcePath("");
    setName("");
    setSelectedFile(null);
    setError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndSubmit = () => {
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (mode === "path") {
      if (!sourcePath.trim()) {
        setError("Source path is required");
        return;
      }
      onImport(sourcePath.trim(), name.trim());
    } else {
      if (!selectedFile) {
        setError("Please select a ZIP file");
        return;
      }
      onImportZip(selectedFile, name.trim());
    }

    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit();
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/zip" && !file.name.endsWith(".zip")) {
      setError("Please select a valid ZIP file");
      return;
    }
    setSelectedFile(file);
    setError(null);
    if (!name) {
      const baseName = file.name.replace(/\.zip$/i, "");
      setName(baseName);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in"
        role="document"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary-50 to-surface dark:from-primary-900/10">
          <div>
            <h2
              id="import-dialog-title"
              className="font-heading text-xl font-semibold text-heading"
            >
              Import Project
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Import from directory or ZIP file
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-muted hover:text-heading hover:bg-surface-hover transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div
              className="mb-4 p-3 bg-error-light/10 border border-error/20 text-error rounded-lg text-sm animate-fade-in"
              role="alert"
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div
              className="flex space-x-1 bg-border-light p-1 rounded-xl"
              role="tablist"
              aria-label="Import method"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "path"}
                aria-controls="path-panel"
                id="path-tab"
                onClick={() => setMode("path")}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer
                  ${
                    mode === "path"
                      ? "bg-surface text-primary shadow-sm ring-1 ring-border"
                      : "text-muted hover:text-secondary"
                  }`}
              >
                From Directory
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "zip"}
                aria-controls="zip-panel"
                id="zip-tab"
                onClick={() => setMode("zip")}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer
                  ${
                    mode === "zip"
                      ? "bg-surface text-primary shadow-sm ring-1 ring-border"
                      : "text-muted hover:text-secondary"
                  }`}
              >
                From ZIP File
              </button>
            </div>
          </div>

          {mode === "path" ? (
            <div
              id="path-panel"
              role="tabpanel"
              aria-labelledby="path-tab"
              className="mb-4"
            >
              <label
                htmlFor="source-path"
                className="block text-sm font-medium text-heading mb-1.5"
              >
                Source Directory Path
              </label>
              <input
                id="source-path"
                ref={pathInputRef}
                type="text"
                value={sourcePath}
                onChange={(e) => {
                  setSourcePath(e.target.value);
                  if (!name && e.target.value) {
                    const parts = e.target.value.split(/[/\\]/);
                    const lastPart = parts[parts.length - 1];
                    if (lastPart) setName(lastPart);
                  }
                }}
                placeholder="/path/to/existing/project"
                className="w-full px-3.5 py-2.5 border border-border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  placeholder:text-muted text-heading font-mono text-sm bg-surface
                  transition-all duration-fast"
                aria-required="true"
              />
              <p className="mt-1.5 text-xs text-muted">
                Enter the full path to the directory containing your LaTeX files
              </p>
            </div>
          ) : (
            <div
              id="zip-panel"
              role="tabpanel"
              aria-labelledby="zip-tab"
              className="mb-4"
            >
              <label className="block text-sm font-medium text-heading mb-1.5">
                Upload ZIP File
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-primary
                  ${
                    isDragging
                      ? "border-primary bg-primary-50 dark:bg-primary-900/10 scale-[1.02]"
                      : selectedFile
                        ? "border-success bg-success/5"
                        : "border-border hover:border-primary-light hover:bg-surface-hover"
                  }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label={
                  selectedFile
                    ? `Selected file: ${selectedFile.name}`
                    : "Click or drag to upload ZIP file"
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  aria-hidden="true"
                />
                {selectedFile ? (
                  <div className="animate-fade-in">
                    <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-heading">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-3 text-xs text-error hover:text-error/80 px-2 py-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3 3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-heading">
                      Drop your ZIP file here, or click to browse
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Supports .zip files up to 100MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-heading mb-1.5"
            >
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Imported Project"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                placeholder:text-muted text-heading bg-surface
                transition-all duration-fast"
              aria-required="true"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-secondary bg-surface border border-border rounded-lg 
                hover:bg-surface-hover hover:border-muted
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                transition-all duration-fast cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-cta rounded-lg
                hover:bg-cta-dark hover:shadow-cta
                focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2
                transition-all duration-fast active:scale-[0.98] cursor-pointer"
            >
              Import Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
