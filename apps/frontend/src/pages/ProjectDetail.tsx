import { useEffect, useState, useCallback, useRef, lazy, Suspense, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileTree } from "../components/FileTree";
import { EditorArea } from "../components/Editor";
import { ResizableSplitPane } from "../components/ResizableSplitPane";
import { UnsavedChangesDialog } from "../components/Dialogs";
import { ThemeToggle } from "../components/ThemeToggle";
import { useToast } from "../components/Toast";
import { CompileButton } from "../components/CompileButton";
import { AutoCompileToggle } from "../components/AutoCompileToggle";
import { SettingsDropdown } from "../components/SettingsDropdown";
import LogViewer from "../components/LogViewer";
import { EditableProjectName } from "../components/EditableProjectName";
import { SettingsModal } from "../components/Settings/SettingsModal";
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

  const { isCompiling, status, result, compile } = useCompilation();
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  useEffect(() => {
    // Update last opened when project is opened
    if (projectId) {
      projectApi.updateLastOpened(projectId).catch(console.error);
    }
  }, [projectId]);

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
    <div className="w-full h-screen bg-background flex flex-col overflow-hidden font-body selection:bg-cta/20">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* IDE-Grade Workspace Navbar */}
      <header className="bg-surface border-b border-border z-30 shadow-soft-sm h-14 flex items-center px-4 shrink-0 relative">
        <div className="flex items-center gap-4 w-full justify-between">
          
          {/* Left: Project & File Context */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={handleBack}
              className="p-1.5 text-muted hover:text-cta hover:bg-cta/5 rounded-lg transition-all shrink-0"
              aria-label="Back to projects"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="w-px h-6 bg-border mx-1 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              {/* Breadcrumb Path */}
              <div className="hidden sm:flex items-center text-[11px] font-black text-muted uppercase tracking-[0.15em] shrink-0">
                <span className="opacity-40">Projects</span>
                <span className="mx-2 text-[14px] leading-none opacity-20">/</span>
              </div>
              
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="font-heading text-base font-black text-heading truncate leading-tight">
                  {currentProject ? (
                    <EditableProjectName
                      projectId={currentProject.id}
                      initialName={currentProject.name}
                      onRename={async (newName) => {
                        await renameProject(currentProject.id, newName);
                      }}
                      size="lg"
                    />
                  ) : (
                    "Loading..."
                  )}
                </h1>
                {activeFile && (
                  <div className="flex items-center shrink-0">
                    <span className="mx-2 text-[14px] leading-none opacity-20">/</span>
                    <span className="text-sm font-bold text-cta truncate max-w-[200px]">{activeFile.name}</span>
                  </div>
                )}
                {hasUnsavedChanges && (
                  <div className="w-2 h-2 rounded-full bg-cta animate-pulse shrink-0 ml-1" title="Unsaved changes" />
                )}
              </div>
            </div>
          </div>

          {/* Center: Primary Build Actions (IDE Cluster) */}
          <div className="flex items-center bg-background border border-border rounded-xl p-1 shadow-inner shrink-0">
            <button
              onClick={handleSave}
              disabled={!activeFile?.isDirty}
              className={`flex items-center px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                activeFile?.isDirty
                  ? "text-white bg-primary shadow-soft-md hover:scale-[1.02]"
                  : "text-muted bg-transparent opacity-40 cursor-not-allowed"
              }`}
            >
              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            <CompileButton
              onClick={handleCompile}
              isCompiling={isCompiling}
              engine={compiler}
              onEngineChange={handleEngineChange}
            />

            <div className="w-px h-4 bg-border mx-1" />

            <AutoCompileToggle
              enabled={autoCompileEnabled}
              onChange={(enabled) => {
                setAutoCompileEnabled(enabled);
                localStorage.setItem("latex-editor-auto-compile", enabled.toString());
              }}
            />
          </div>

          {/* Right: Management & Environment */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="hidden xl:flex items-center px-3 py-1.5 text-xs font-black text-secondary bg-surface border border-border rounded-lg hover:border-cta hover:text-cta transition-all disabled:opacity-50"
              title="Export as ZIP"
            >
              {isExporting ? (
                <span className="w-4 h-4 mr-2 border-2 border-cta border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Export
            </button>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            <SettingsDropdown>
              <div className="px-4 py-2">
                <ThemeToggle />
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full px-4 py-2 text-xs font-bold text-left text-secondary hover:bg-cta/5 hover:text-cta transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Editor Settings
              </button>
            </SettingsDropdown>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <aside className="w-64 bg-surface border-r border-border overflow-y-auto flex-shrink-0 min-h-0 flex flex-col">
            <div className="p-3 border-b border-border bg-background/50">
              <h2 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-primary/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Project Explorer
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

          <main id="main-content" className="flex-1 min-w-0 flex overflow-hidden outline-none" tabIndex={-1}>
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
              </main>
              </div>
        <UnsavedChangesDialog
          isOpen={unsavedDialogOpen}
          fileName={fileToCloseName}
          onSave={handleUnsavedSave}
          onDiscard={handleUnsavedDiscard}
          onCancel={handleUnsavedCancel}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
