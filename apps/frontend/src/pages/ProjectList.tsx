import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "../components/ProjectCard";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { ImportProjectDialog } from "../components/ImportProjectDialog";
import { ThemeToggle } from "../components/ThemeToggle";
import { useToast } from "../components/Toast";
import { useProjectStore, selectSortedProjects } from "../stores/projectStore";
import { projectApi } from "../services/projectApi";
import { RecentProjects } from "../components/RecentProjects";
import type { Template } from "@local-latex-editor/shared-types";
import { Search, Plus, Download, AlertCircle, X, FilePlus } from "lucide-react";

export function ProjectList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { projects, setProjects, isLoading, setLoading, error, setError } =
    useProjectStore();
  const sortedProjects = useProjectStore(selectSortedProjects);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.listProjects();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      addToast("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (name: string, template: Template) => {
    try {
      const data = await projectApi.createProject(name, template);
      setProjects([data.project, ...projects]);
      setIsCreateDialogOpen(false);
      addToast("Project created successfully", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to create project",
        "error",
      );
    }
  };

  const handleImportProject = async (sourcePath: string, name: string) => {
    try {
      const data = await projectApi.importProject(sourcePath, name);
      setProjects([data.project, ...projects]);
      setIsImportDialogOpen(false);
      addToast("Project imported successfully", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to import project",
        "error",
      );
    }
  };

  const handleImportZip = async (file: File, name: string) => {
    try {
      const data = await projectApi.importZip(file, name);
      setProjects([data.project, ...projects]);
      setIsImportDialogOpen(false);
      addToast("Project imported successfully", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to import ZIP file",
        "error",
      );
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      await projectApi.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      addToast("Project deleted successfully", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to delete project",
        "error",
      );
    }
  };

  const handleExportProject = async (projectId: string, projectName: string) => {
    setExportingProjectId(projectId);
    try {
      await projectApi.exportProject(projectId, projectName);
      addToast("Project exported successfully", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export project";
      addToast(message, "error");
    } finally {
      setExportingProjectId(null);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    // Update lastOpened timestamp before navigating
    await projectApi.updateLastOpened(projectId);
    navigate(`/project/${projectId}`);
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return sortedProjects;
    const query = searchQuery.toLowerCase();
    return sortedProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.metadata.template.toLowerCase().includes(query) ||
        p.path.toLowerCase().includes(query)
    );
  }, [sortedProjects, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <header className="bg-surface shadow-sm border-b border-border sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary/20 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="font-heading text-2xl font-bold text-heading">
                  TexCraft
                </h1>
                <p className="text-xs text-muted font-medium">Local LaTeX Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsImportDialogOpen(true)}
                className="hidden sm:flex items-center justify-center px-4 py-2 text-sm font-medium text-secondary bg-surface border border-border rounded-lg 
                  hover:bg-surface-hover hover:border-primary-light hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  transition-all duration-base cursor-pointer"
                aria-label="Import existing project"
              >
                <Download className="w-4 h-4 mr-2 text-muted" />
                Import
              </button>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white gradient-cta rounded-lg
                  hover:shadow-cta shadow-md
                  focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2
                  transition-all duration-base active:scale-[0.98] cursor-pointer"
                aria-label="Create new project"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <h2 className="sr-only">Projects</h2>

        {error && (
          <div
            className="mb-6 p-4 bg-error-light/10 border border-error/20 rounded-xl text-error animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="flex-1 font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-error hover:bg-error/10 p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss error message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-24"
            role="status"
            aria-label="Loading projects"
          >
            <div className="relative">
              <div
                className="animate-spin rounded-full h-12 w-12 border-4 border-primary/10 border-t-primary"
                aria-hidden="true"
              ></div>
            </div>
            <span className="mt-4 text-muted font-medium animate-pulse">Scanning your projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-8 shadow-inner">
              <FilePlus className="h-12 w-12 text-primary opacity-80" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-heading mb-3">
              Your workspace is empty
            </h3>
            <p className="text-secondary max-w-sm mx-auto leading-relaxed">
              Start your next masterpiece by creating a new project or importing an existing one.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setIsImportDialogOpen(true)}
                className="px-6 py-2.5 text-sm font-semibold text-secondary bg-surface border border-border rounded-xl hover:bg-surface-hover hover:border-primary-light transition-all duration-base cursor-pointer shadow-sm"
              >
                Import Project
              </button>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-6 py-2.5 text-sm font-semibold text-white gradient-cta rounded-xl hover:shadow-cta transition-all duration-base cursor-pointer shadow-md"
              >
                Create New Project
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Recent Projects Section - only show if not searching */}
            {!searchQuery && (
              <section className="animate-fade-in">
                <RecentProjects
                  projects={projects}
                  onOpenProject={handleOpenProject}
                  maxItems={6}
                />
              </section>
            )}

            {/* All Projects Section */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-heading">
                    {searchQuery ? 'Search Results' : 'All Projects'}
                  </h2>
                  <p className="text-xs text-muted font-medium mt-1">
                    {filteredProjects.length} of {projects.length} projects
                  </p>
                </div>

                <div className="relative group max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search projects by name, template..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-heading transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-surface/50 rounded-3xl border border-dashed border-border animate-fade-in">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted opacity-20" />
                  <p className="text-heading font-medium">No projects match your search</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-sm text-primary font-bold hover:underline"
                  >
                    Clear search query
                  </button>
                </div>
              ) : (
                <ul
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                  role="list"
                  aria-label="Project list"
                >
                  {filteredProjects.map((project, index) => (
                    <li
                      key={project.id}
                      className="relative animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <ProjectCard
                        project={project}
                        onClick={() => handleOpenProject(project.id)}
                        onDelete={() => handleDeleteProject(project.id)}
                        onExport={() => handleExportProject(project.id, project.name)}
                        isExporting={exportingProjectId === project.id}
                      />
                      {deleteConfirmId === project.id && (
                        <div
                          className="absolute inset-0 bg-surface/95 backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-6 animate-fade-in z-10 shadow-2xl border border-error/20"
                          role="alertdialog"
                          aria-modal="true"
                          aria-labelledby={`delete-title-${project.id}`}
                          aria-describedby={`delete-desc-${project.id}`}
                        >
                          <div className="w-14 h-14 rounded-full bg-error-light/20 flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-error" />
                          </div>
                          <p
                            id={`delete-title-${project.id}`}
                            className="text-base text-heading mb-2 text-center font-bold"
                          >
                            Delete project?
                          </p>
                          <p
                            id={`delete-desc-${project.id}`}
                            className="text-xs text-muted mb-6 text-center leading-relaxed"
                          >
                            This will permanently remove "{project.name}" and all its files. This cannot be undone.
                          </p>
                          <div className="flex gap-3 w-full">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 py-2 text-sm font-bold text-secondary hover:text-heading hover:bg-surface-hover rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-fast cursor-pointer border border-border"
                              autoFocus
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="flex-1 py-2 text-sm font-bold text-white bg-error hover:bg-error/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-error transition-all duration-fast active:scale-[0.98] cursor-pointer shadow-lg shadow-error/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={handleCreateProject}
      />

      <ImportProjectDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportProject}
        onImportZip={handleImportZip}
      />

      <footer className="mt-auto py-6 px-8 border-t border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-muted">
          <div className="flex items-center gap-3">
            <span className="font-bold text-heading tracking-tight">TexCraft</span>
            <span className="text-border">|</span>
            <span>The Local LaTeX Editor</span>
          </div>
          <p className="opacity-80">Copyright &copy; 2026 Sarmad Soomro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
