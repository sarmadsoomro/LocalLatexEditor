import { useEffect, useState } from "react";
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

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="bg-surface dark:bg-surface shadow-sm border-b border-border dark:border-border-light sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary">
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
                <h1 className="font-heading text-2xl font-bold text-heading dark:text-heading">
                  LaTeX Editor
                </h1>
                <p className="text-xs text-muted">Local document editing</p>
                <p className="mt-1 text-xs text-primary font-medium">
                  {projects.length} project{projects.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <ThemeToggle />
              <button
                onClick={() => setIsImportDialogOpen(true)}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-secondary bg-surface border border-border rounded-lg 
                  hover:bg-surface-hover hover:border-primary-light hover:shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  transition-all duration-150 cursor-pointer"
                aria-label="Import existing project"
              >
                <svg
                  className="w-4 h-4 mr-2 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import
              </button>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white gradient-cta rounded-lg
                  hover:shadow-lg hover:shadow-cta
                  focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2
                  transition-all duration-150 active:scale-[0.98] cursor-pointer"
                aria-label="Create new project"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="sr-only">Projects</h2>

        {error && (
          <div
            className="mb-6 p-4 bg-error-light border border-red-200 dark:border-red-800 rounded-xl text-error dark:text-red-300 animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-3"
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
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-error hover:text-red-700 dark:hover:text-red-200 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                aria-label="Dismiss error message"
              >
                <svg
                  className="w-4 h-4"
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
          </div>
        )}

        {isLoading ? (
          <div
            className="flex items-center justify-center py-16"
            role="status"
            aria-label="Loading projects"
          >
            <div className="relative">
              <div
                className="animate-spin rounded-full h-10 w-10 border-2 border-border-light border-t-primary"
                aria-hidden="true"
              ></div>
            </div>
            <span className="ml-3 text-muted">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center mb-6">
              <svg
                className="h-10 w-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-semibold text-heading dark:text-heading">
              No projects yet
            </h3>
            <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
              Get started by creating a new project or importing an existing one
              from your local machine.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setIsImportDialogOpen(true)}
                className="px-4 py-2 text-sm font-medium text-secondary bg-surface border border-border rounded-lg hover:bg-surface-hover hover:border-primary-light transition-all duration-150 cursor-pointer"
              >
                Import Project
              </button>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white gradient-cta rounded-lg hover:shadow-lg hover:shadow-cta transition-all duration-150 cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Recent Projects Section */}
            <section className="mb-12">
              <RecentProjects
                projects={projects}
                onOpenProject={handleOpenProject}
                maxItems={6}
              />
            </section>

            {/* All Projects Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  All Projects
                </h2>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </span>
              </div>

          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
            role="list"
            aria-label="Project list"
          >
            {sortedProjects.map((project, index) => (
              <li
                key={project.id}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
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
                    className="absolute inset-0 bg-surface/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 animate-fade-in z-10"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby={`delete-title-${project.id}`}
                    aria-describedby={`delete-desc-${project.id}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-error-light flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-error"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <p
                      id={`delete-title-${project.id}`}
                      className="text-sm text-heading dark:text-heading mb-2 text-center font-heading font-medium"
                    >
                      Delete project?
                    </p>
                    <p
                      id={`delete-desc-${project.id}`}
                      className="text-xs text-muted mb-4 text-center"
                    >
                      This cannot be undone.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-4 py-1.5 text-sm text-secondary hover:text-heading hover:bg-surface-hover dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-100 cursor-pointer"
                        autoFocus
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-4 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-100 active:scale-[0.98] cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
            </section>
          </>
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
    </div>
  );
}
