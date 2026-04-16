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
import { Search, Plus, AlertCircle, X, FilePlus } from "lucide-react";

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
    const query = searchQuery.toLowerCase();
    
    // Filter by search query if exists
    let results = sortedProjects;
    if (query.trim()) {
      results = sortedProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.metadata.template.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );
    }

    // If not searching, exclude the top 3 recent projects from the main list to avoid duplication
    if (!query.trim()) {
      const recentIds = sortedProjects
        .filter((p) => p.metadata?.lastOpened)
        .sort((a, b) => {
          const dateA = new Date(a.metadata.lastOpened!).getTime();
          const dateB = new Date(b.metadata.lastOpened!).getTime();
          return dateB - dateA;
        })
        .slice(0, 3)
        .map(p => p.id);
      
      results = results.filter(p => !recentIds.includes(p.id));
    }

    return results;
  }, [sortedProjects, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-background flex flex-col font-body selection:bg-cta/20 selection:text-cta-dark">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Workspace Navbar */}
      <nav className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-soft-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-heading text-xl font-black text-primary dark:text-white tracking-tight">
                TexCraft
              </span>
            </div>

            {/* Global Search - Positioned like Overleaf */}
            <div className="flex-1 max-w-2xl relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <Search className="w-4 h-4 text-muted group-focus-within:text-cta transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search your projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2 bg-background/50 border border-border rounded-xl focus:bg-surface focus:border-cta/50 focus:outline-none focus:ring-4 focus:ring-cta/5 transition-all text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-heading transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="w-full flex-1 flex flex-col">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 flex-1 flex gap-8 py-8">
          
          {/* Sidebar Navigation - Overleaf Style */}
          <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-cta bg-cta/5 rounded-xl border border-cta/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              All Projects
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-secondary hover:bg-surface-hover rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Projects
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-secondary hover:bg-surface-hover rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Trash
            </button>
            
            <div className="my-4 h-px bg-border mx-2" />
            
            <p className="px-4 text-[10px] font-black text-muted uppercase tracking-widest mb-2">Filters</p>
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-secondary hover:bg-surface-hover rounded-xl transition-all">
              <span className="w-2 h-2 rounded-full bg-success" />
              Published
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-secondary hover:bg-surface-hover rounded-xl transition-all">
              <span className="w-2 h-2 rounded-full bg-warning" />
              In Progress
            </button>
          </aside>

          {/* Project List Content */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="mb-8 p-4 bg-error-light border border-error/20 rounded-2xl text-error animate-fade-in flex items-center shadow-soft-md" role="alert">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="flex-1 font-bold text-sm">{error}</span>
                <button onClick={() => setError(null)} className="ml-4 p-1 hover:bg-error/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 border-4 border-cta/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-cta border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="mt-6 text-sm font-bold text-muted tracking-widest uppercase opacity-40">Loading Workspace</span>
              </div>
            ) : projects.length === 0 ? (
              <div id="main-content" className="text-center py-24 bg-surface rounded-[2rem] border-2 border-dashed border-border animate-fade-in shadow-inner outline-none" tabIndex={-1}>
                <div className="w-24 h-24 mx-auto rounded-3xl bg-primary/5 flex items-center justify-center mb-8">
                  <FilePlus className="h-10 w-10 text-primary/30" />
                </div>
                <h3 className="text-3xl font-black text-heading mb-4">No Projects Found</h3>
                <p className="text-lg text-secondary max-w-sm mx-auto mb-10 opacity-70">
                  Your workspace is currently empty. Create or import a LaTeX project to begin writing.
                </p>
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="px-8 py-3 text-base font-bold text-white bg-cta rounded-2xl hover:bg-cta-dark shadow-soft-lg transition-all"
                >
                  Create New Project
                </button>
              </div>
            ) : (
              <div id="main-content" className="space-y-12 outline-none" tabIndex={-1}>
                {/* Header Context */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <h1 className="text-3xl font-black text-heading tracking-tight">
                      {searchQuery ? "Search Results" : "All Projects"}
                    </h1>
                    <p className="text-sm text-secondary font-medium mt-1 opacity-60">
                      Managing <span className="text-primary font-bold">{projects.length} documents</span> in your local workspace
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsImportDialogOpen(true)}
                      className="px-4 py-2 text-sm font-bold text-secondary bg-surface border border-border rounded-xl hover:border-cta transition-all"
                    >
                      Import ZIP
                    </button>
                    <button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="px-4 py-2 text-sm font-bold text-white bg-cta rounded-xl hover:bg-cta-dark transition-all"
                    >
                      New Project
                    </button>
                  </div>
                </div>

                {/* Recent Projects Section */}
                {!searchQuery && (
                  <section className="animate-fade-in">
                    <RecentProjects
                      projects={projects}
                      onOpenProject={handleOpenProject}
                      maxItems={3}
                    />
                  </section>
                )}

                {/* Main Grid Section */}
                <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                  {!searchQuery && (
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Project Library</h2>
                    </div>
                  )}

                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-border">
                      <Search className="w-16 h-16 mx-auto mb-6 text-muted/10" />
                      <p className="text-xl font-bold text-heading opacity-40">No projects match your search.</p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-sm text-cta font-black hover:underline underline-offset-8"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredProjects.map((project, index) => (
                        <li
                          key={project.id}
                          className="relative animate-fade-in"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <ProjectCard
                            project={project}
                            onClick={() => handleOpenProject(project.id)}
                            onDelete={() => handleDeleteProject(project.id)}
                            onExport={() => handleExportProject(project.id, project.name)}
                            isExporting={exportingProjectId === project.id}
                          />
                          {deleteConfirmId === project.id && (
                            <div className="absolute inset-0 bg-surface/98 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-8 animate-fade-in z-20 shadow-soft-xl border border-error/20">
                              <AlertCircle className="w-8 h-8 text-error mb-4" />
                              <p className="text-lg font-black text-heading mb-6 text-center">
                                Delete "{project.name}"?
                              </p>
                              <div className="flex gap-3 w-full">
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="flex-1 py-2.5 text-xs font-bold text-secondary hover:bg-border/30 rounded-xl transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="flex-1 py-2.5 text-xs font-bold text-white bg-error hover:bg-error/90 rounded-xl shadow-soft-md transition-all"
                                >
                                  Confirm
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
          </div>
        </div>
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

      <footer className="py-8 border-t border-border bg-surface/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex justify-between items-center text-xs font-bold text-muted opacity-60">
          <p>&copy; 2026 TexCraft Editor</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cta transition-colors">Privacy</a>
            <a href="#" className="hover:text-cta transition-colors">Terms</a>
            <a href="#" className="hover:text-cta transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
