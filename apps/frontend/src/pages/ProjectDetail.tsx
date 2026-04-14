import { useEffect, useState, useCallback, useRef, lazy, Suspense, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileTree } from "../components/FileTree";
import { EditorArea } from "../components/Editor";
import CompileControls from "../components/CompileControls";
import { ResizableSplitPane } from "../components/ResizableSplitPane";
import { UnsavedChangesDialog } from "../components/Dialogs";
import { ThemeToggle } from "../components/ThemeToggle";
import { useToast } from "../components/Toast";
import LogViewer from "../components/LogViewer";
import { EditableProjectName } from "../components/EditableProjectName";
import { useProjectStore } from "../stores/projectStore";
import { useEditorStore } from "../stores/editorStore";
import { useFileOperations } from "../hooks/useFileOperations";
import { useEditorShortcuts } from "../hooks/useKeyboardShortcuts";
import { useUnsavedChangesWarning } from "../hooks/useBeforeUnload";
import { useCompilation } from "../hooks/useCompilation";
import { useAutoCompile } from "../hooks/useAutoCompile";
import { projectApi } from "../services/projectApi";
import { compilationApi } from "../services/compilationApi";
import type { FileNode } from "@local-latex-editor/shared-types";
import { shallow } from "zustand/shallow";

const PDFPreview = lazy(() =>
  import("../components/PDFPreview").then((m) => ({ default: m.PDFPreview })),
);

function ComponentLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-surface">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-light dark:border-gray-600 border-t-primary"></div>
        <span className="text-sm text-muted">Loading...</span>
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = id || "";
  const { addToast } = useToast();

  const {
    currentProject,
    fileTree,
    setCurrentProject,
    setFileTree,
    renameProject,
    isLoading,
    setLoading,
    error,
    setError,
  } = useProjectStore(
    (state) => ({
      currentProject: state.currentProject,
      fileTree: state.fileTree,
      setCurrentProject: state.setCurrentProject,
      setFileTree: state.setFileTree,
      renameProject: state.renameProject,
      isLoading: state.isLoading,
      setLoading: state.setLoading,
      error: state.error,
      setError: state.setError,
    }),
    shallow,
  );

  const { activeFileId, openFiles, setActiveFile, closeFile, closeAllFiles } =
    useEditorStore(
      (state) => ({
        activeFileId: state.activeFileId,
        openFiles: state.openFiles,
        setActiveFile: state.setActiveFile,
        closeFile: state.closeFile,
        closeAllFiles: state.closeAllFiles,
      }),
      shallow,
    );

  const {
    openFile,
    saveFile,
    updateFileContent,
    hasUnsavedChanges,
    getLanguage,
    activeFile,
  } = useFileOperations();

  const { isCompiling, status, result, compile, cancel } = useCompilation();
  const { triggerAutoCompile } = useAutoCompile();
  const [compiler, setCompiler] = useState("pdflatex");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [autoCompileEnabled, setAutoCompileEnabled] = useState(() => {
    const saved = localStorage.getItem("latex-editor-auto-compile");
    return saved ? saved === "true" : true;
  });
  // Stable refs for callbacks used inside effects, to avoid effect re-runs
  // when the callback references change (e.g. compile changes when currentProject changes).
  const compileRef = useRef(compile);
  compileRef.current = compile;
  const openFileRef = useRef(openFile);
  openFileRef.current = openFile;

  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [fileToClose, setFileToClose] = useState<string | null>(null);

  useUnsavedChangesWarning(hasUnsavedChanges);

  // Track which project has been auto-loaded to prevent duplicate triggers.
  // Reset when projectId changes so navigating to a different project
  // (or back to the same one) triggers a fresh auto-load.
  const autoLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (projectId) {
      // Reset auto-load guard for new project navigation
      autoLoadedRef.current = null;
      loadProject(projectId);
    }
    return () => {
      closeAllFiles();
    };
  }, [projectId]);

  // Auto-open main file when project is loaded.
  // Uses a ref guard to prevent duplicate triggers from React re-renders
  // while allowing re-trigger when navigating to a different project.
  useEffect(() => {
    if (!currentProject || autoLoadedRef.current === projectId) {
      return;
    }

    autoLoadedRef.current = projectId;

    const doAutoLoad = async () => {
      try {
        const mainFilePath = currentProject.metadata?.mainFile;
        if (mainFilePath) {
          await openFileRef.current(projectId, mainFilePath);
        }

        if (autoCompileEnabled) {
          await compileRef.current();
        }
      } catch (err) {
        console.error("Failed to auto-load main file on project open:", err);
      }
    };

    doAutoLoad();
  }, [currentProject, autoCompileEnabled, projectId]);

  useEffect(() => {
    if (status === "success" && result?.success) {
      setPdfRefreshKey((prev) => prev + 1);
    }
  }, [status, result]);

  const loadProject = async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [projectData, filesData] = await Promise.all([
        projectApi.getProject(pid),
        projectApi.getProjectFiles(pid),
      ]);
      setCurrentProject(projectData.project);
      setFileTree(filesData.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = useCallback((file: FileNode) => {
    setSelectedFileId(file.id);
  }, []);

  const handleFileOpen = useCallback(
    async (file: FileNode) => {
      if (file.type === "file") {
        try {
          await openFile(projectId, file.path);
        } catch (err) {
          console.error("Failed to open file:", err);
          addToast("Failed to open file", "error");
        }
      }
    },
    [projectId, openFile, addToast],
  );

  const handleTabClick = useCallback(
    (fileId: string) => {
      startTransition(() => {
        setActiveFile(fileId);
      });
    },
    [setActiveFile],
  );

  const handleTabCloseRequest = useCallback(
    (fileId: string) => {
      const file = openFiles.find((f) => f.id === fileId);
      if (file?.isDirty) {
        setFileToClose(fileId);
        setPendingAction(() => () => closeFile(fileId));
        setUnsavedDialogOpen(true);
      } else {
        closeFile(fileId);
      }
    },
    [openFiles, closeFile],
  );

  const handleUnsavedSave = useCallback(async () => {
    if (activeFileId && projectId) {
      try {
        await saveFile(activeFileId, projectId);
        setUnsavedDialogOpen(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
          setFileToClose(null);
        }
        addToast("File saved successfully", "success");
      } catch (err) {
        addToast("Failed to save file", "error");
      }
    }
  }, [activeFileId, projectId, saveFile, pendingAction, addToast]);

  const handleUnsavedDiscard = useCallback(() => {
    setUnsavedDialogOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
      setFileToClose(null);
    }
  }, [pendingAction]);

  const handleUnsavedCancel = useCallback(() => {
    setUnsavedDialogOpen(false);
    setPendingAction(null);
    setFileToClose(null);
  }, []);

  const handleEditorChange = useCallback(
    (value: string) => {
      if (activeFileId) {
        updateFileContent(activeFileId, value);
      }
    },
    [activeFileId, updateFileContent],
  );

  const handleCompile = useCallback(async () => {
    if (activeFileId && activeFile?.isDirty) {
      try {
        await saveFile(activeFileId, projectId);
        addToast("File saved successfully", "success");
      } catch (err) {
        addToast("Failed to save file", "error");
        return;
      }
    }
    await compile();
  }, [activeFileId, activeFile, saveFile, projectId, compile, addToast]);

  const handleSave = useCallback(async () => {
    if (activeFileId && projectId) {
      try {
        await saveFile(activeFileId, projectId);
        addToast("File saved successfully", "success");
        if (autoCompileEnabled) {
          triggerAutoCompile();
        }
      } catch (err) {
        addToast("Failed to save file", "error");
      }
    }
  }, [activeFileId, projectId, saveFile, addToast, autoCompileEnabled, triggerAutoCompile]);

  const handleCancel = useCallback(async () => {
    await cancel();
  }, [cancel]);

  const handleEngineChange = useCallback((engine: string) => {
    setCompiler(engine);
  }, []);

  useEditorShortcuts(
    handleSave,
    () => {
      if (activeFileId) {
        handleTabCloseRequest(activeFileId);
      }
    },
    () => {
      const currentIndex = openFiles.findIndex((f) => f.id === activeFileId);
      if (currentIndex >= 0 && currentIndex < openFiles.length - 1) {
        startTransition(() => {
          setActiveFile(openFiles[currentIndex + 1].id);
        });
      }
    },
    () => {
      const currentIndex = openFiles.findIndex((f) => f.id === activeFileId);
      if (currentIndex > 0) {
        startTransition(() => {
          setActiveFile(openFiles[currentIndex - 1].id);
        });
      }
    },
    handleCompile,
  );

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => navigate("/"));
      setUnsavedDialogOpen(true);
    } else {
      navigate("/");
    }
  }, [hasUnsavedChanges, navigate]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!currentProject) return;

    setIsExporting(true);
    try {
      await projectApi.exportProject(currentProject.id, currentProject.name);
      addToast("Project exported successfully", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export project";
      addToast(message, "error");
    } finally {
      setIsExporting(false);
    }
  }, [currentProject, addToast]);

  const tabs = openFiles.map((file) => ({
    id: file.id,
    name: file.name,
    isDirty: file.isDirty,
    isActive: file.id === activeFileId,
  }));

  const showPreviewPane = Boolean(result?.success);
  const currentContent = activeFile?.content || "";
  const currentLanguage = activeFileId ? getLanguage(activeFileId) : "latex";

  const fileToCloseName = fileToClose
    ? openFiles.find((f) => f.id === fileToClose)?.name
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border-light border-t-primary"></div>
          <span className="mt-3 text-sm text-muted">Loading project...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-surface dark:bg-surface rounded-2xl shadow-lg p-8 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-light flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-error"
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
          </div>
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
      <header className="bg-surface dark:bg-surface shadow-sm border-b border-border dark:border-border-light sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-muted hover:text-heading hover:bg-surface-hover dark:hover:bg-gray-700 rounded-lg transition-all duration-100 cursor-pointer"
              aria-label="Back to projects"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="font-heading text-xl font-semibold text-heading dark:text-heading">
                {currentProject ? (
                  <EditableProjectName
                    projectId={currentProject.id}
                    initialName={currentProject.name}
                    onRename={async (newName) => {
                      await renameProject(currentProject.id, newName);
                    }}
                    size="lg"
                    className="text-[#134E4A] dark:text-heading"
                  />
                ) : (
                  "Loading..."
                )}
              </h1>
              {currentProject && (
                <p className="text-sm text-muted">
                  {currentProject.metadata.mainFile} •{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-light">
                    {currentProject.metadata.template}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-cta font-medium">
                      • Unsaved changes
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              onClick={handleSave}
              disabled={!activeFile?.isDirty}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98] whitespace-nowrap cursor-pointer ${
                activeFile?.isDirty
                  ? "text-white bg-primary hover:bg-primary-dark hover:shadow-md hover:shadow-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  : "text-muted bg-border-light dark:bg-gray-700 cursor-not-allowed"
              }`}
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save
              <span className="ml-1 text-xs opacity-75">(Ctrl+S)</span>
            </button>

            <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-secondary cursor-pointer hover:bg-surface-hover dark:hover:bg-gray-700 border border-border dark:border-gray-600 rounded-lg transition-colors whitespace-nowrap">
              <input
                type="checkbox"
                checked={autoCompileEnabled}
                onChange={(e) => {
                  setAutoCompileEnabled(e.target.checked);
                  localStorage.setItem(
                    "latex-editor-auto-compile",
                    e.target.checked.toString(),
                  );
                }}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
              />
              <span>Auto-compile</span>
            </label>

            <CompileControls
              isCompiling={isCompiling}
              status={status}
              engine={compiler}
              onCompile={handleCompile}
              onCancel={handleCancel}
              onEngineChange={handleEngineChange}
            />

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-secondary bg-surface border border-border dark:border-gray-600 rounded-lg hover:bg-surface-hover hover:border-primary-light transition-all duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Export as ZIP"
            >
              {isExporting ? (
                <span className="inline-block w-4 h-4 mr-1.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              )}
              Export
            </button>

            <span className="sr-only" aria-live="polite">
              {status}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <aside className="w-64 bg-surface dark:bg-surface border-r border-border dark:border-border-light overflow-y-auto flex-shrink-0 min-h-0">
            <div className="p-3 border-b border-border dark:border-border-light bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <h2 className="text-sm font-heading font-medium text-heading dark:text-heading flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Files
              </h2>
            </div>
            {fileTree && (
              <FileTree
                projectId={projectId}
                onRefresh={() => loadProject(projectId)}
                files={fileTree}
                onFileSelect={handleFileSelect}
                onFileOpen={handleFileOpen}
                selectedFileId={selectedFileId || undefined}
              />
            )}
          </aside>

          {showPreviewPane && !(result?.errors?.length || result?.warnings?.length) ? (
            <ResizableSplitPane
              leftPane={
                <EditorArea
                  tabs={tabs}
                  activeFileId={activeFileId}
                  content={currentContent}
                  language={currentLanguage}
                  onTabClick={handleTabClick}
                  onTabClose={handleTabCloseRequest}
                  onContentChange={handleEditorChange}
                  onSave={handleSave}
                />
              }
              rightPane={
                <Suspense fallback={<ComponentLoader />}>
                  <PDFPreview
                    pdfUrl={compilationApi.getPdfUrl(projectId, pdfRefreshKey)}
                    refreshKey={pdfRefreshKey}
                    projectId={projectId}
                  />
                </Suspense>
              }
              defaultSplit={50}
              minLeftWidth={150}
              minRightWidth={150}
              storageKey={`latex-editor-split-${projectId}`}
              className="flex-1"
            />
          ) : (
            <ResizableSplitPane
              leftPane={
                <EditorArea
                  tabs={tabs}
                  activeFileId={activeFileId}
                  content={currentContent}
                  language={currentLanguage}
                  onTabClick={handleTabClick}
                  onTabClose={handleTabCloseRequest}
                  onContentChange={handleEditorChange}
                  onSave={handleSave}
                  showHint={!showPreviewPane}
                />
              }
              rightPane={
                <LogViewer
                  logs={result?.logOutput?.split('\n') || []}
                  errors={result?.errors || []}
                  warnings={result?.warnings || []}
                />
              }
              defaultSplit={60}
              minLeftWidth={150}
              minRightWidth={150}
              storageKey={`latex-editor-error-split-${projectId}`}
              className="flex-1"
            />
          )}
        </div>

        <UnsavedChangesDialog
          isOpen={unsavedDialogOpen}
          fileName={fileToCloseName}
          onSave={handleUnsavedSave}
          onDiscard={handleUnsavedDiscard}
          onCancel={handleUnsavedCancel}
        />
      </div>
    </div>
  );
}
