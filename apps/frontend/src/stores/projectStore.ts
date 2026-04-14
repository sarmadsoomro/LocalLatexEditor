import { create } from 'zustand';
import type { ProjectWithMetadata, FileNode } from '@local-latex-editor/shared-types';

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
}));
