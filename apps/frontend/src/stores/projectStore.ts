import { create } from 'zustand';
import type { ProjectWithMetadata, FileNode } from '@local-latex-editor/shared-types';
import { projectApi } from '../services/projectApi';

interface ProjectState {
  // Data
  projects: ProjectWithMetadata[];
  currentProject: ProjectWithMetadata | null;
  fileTree: FileNode[] | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: ProjectWithMetadata[]) => void;
  setCurrentProject: (project: ProjectWithMetadata | null) => void;
  setFileTree: (tree: FileNode[] | null) => void;
  addProject: (project: ProjectWithMetadata) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<ProjectWithMetadata>) => void;
  renameProject: (id: string, newName: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  // Initial state
  projects: [],
  currentProject: null,
  fileTree: null,
  isLoading: false,
  error: null,

  // Actions
  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) =>
    set({
      currentProject: project,
      // Clear file tree only when deselecting a project (navigating away).
      // When switching projects, loadProject calls setFileTree right after
      // setCurrentProject, so clearing here would cause a flash of empty state.
      ...(project === null ? { fileTree: null } : {}),
    }),

  setFileTree: (fileTree) => set({ fileTree }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject:
        state.currentProject?.id === id ? null : state.currentProject,
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  renameProject: async (id, newName) => {
    const { projects, currentProject } = useProjectStore.getState();

    // Optimistic update - update UI immediately
    const previousProjects = [...projects];
    const optimisticProjects = projects.map((p) =>
      p.id === id
        ? { ...p, name: newName, updatedAt: new Date().toISOString() }
        : p,
    );

    set({
      projects: optimisticProjects,
      currentProject:
        currentProject?.id === id
          ? { ...currentProject, name: newName, updatedAt: new Date().toISOString() }
          : currentProject,
    });

    try {
      const response = await projectApi.renameProject(id, newName);

      // Update with server response (ensures timestamp precision)
      set({
        projects: optimisticProjects.map((p) =>
          p.id === id ? response.project : p,
        ),
        currentProject:
          currentProject?.id === id ? response.project : currentProject,
      });
    } catch (error) {
      // Rollback on error
      set({
        projects: previousProjects,
        currentProject:
          currentProject?.id === id ? currentProject : useProjectStore.getState().currentProject,
      });
      throw error;
    }
  },
}));
