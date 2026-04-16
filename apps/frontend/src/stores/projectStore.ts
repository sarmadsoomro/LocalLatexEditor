import { create } from 'zustand';
import type { ProjectWithMetadata, FileNode, ProjectFilter, ProjectStatus } from '@local-latex-editor/shared-types';
import { projectApi } from '../services/projectApi';

interface ProjectState {
  // Data
  projects: ProjectWithMetadata[];
  currentProject: ProjectWithMetadata | null;
  fileTree: FileNode[] | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  currentFilter: ProjectFilter;

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
  setCurrentFilter: (filter: ProjectFilter) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  permanentlyDeleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  // Initial state
  projects: [],
  currentProject: null,
  fileTree: null,
  isLoading: false,
  error: null,
  currentFilter: 'all',

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

  setCurrentFilter: (filter) => set({ currentFilter: filter }),

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

  updateProjectStatus: async (id, status) => {
    const { projects, currentProject } = useProjectStore.getState();

    // Optimistic update
    const previousProjects = [...projects];
    const optimisticProjects = projects.map((p) =>
      p.id === id
        ? { ...p, metadata: { ...p.metadata, status } }
        : p
    );

    set({
      projects: optimisticProjects,
      currentProject:
        currentProject?.id === id
          ? { ...currentProject, metadata: { ...currentProject.metadata, status } }
          : currentProject,
    });

    try {
      await projectApi.updateStatus(id, status);
    } catch (error) {
      // Rollback on error
      set({
        projects: previousProjects,
        currentProject,
      });
      throw error;
    }
  },

  restoreProject: async (id) => {
    const response = await projectApi.restoreProject(id);
    set((state) => ({
      projects: [response.project, ...state.projects],
    }));
  },

  permanentlyDeleteProject: async (id) => {
    await projectApi.permanentlyDeleteProject(id);
    // No need to update state as trashed projects are in a separate view
  },
}));

// Selectors (for use outside components or with useShallow)

export const selectRecentProjects = (state: ProjectState) => {
  return [...state.projects]
    .filter((p) => p.metadata?.lastOpened)
    .sort((a, b) => {
      const dateA = new Date(a.metadata!.lastOpened!).getTime();
      const dateB = new Date(b.metadata!.lastOpened!).getTime();
      return dateB - dateA;
    });
};

export const selectSortedProjects = (state: ProjectState) => {
  return [...state.projects].sort((a, b) => {
    // Sort by lastOpened (most recent first), then by name
    if (a.metadata?.lastOpened && b.metadata?.lastOpened) {
      const dateDiff = new Date(b.metadata.lastOpened).getTime() - new Date(a.metadata.lastOpened).getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    if (a.metadata?.lastOpened && !b.metadata?.lastOpened) return -1;
    if (!a.metadata?.lastOpened && b.metadata?.lastOpened) return 1;
    return a.name.localeCompare(b.name);
  });
};

export const selectFilteredProjects = (state: ProjectState) => {
  const { projects, currentFilter } = state;

  switch (currentFilter) {
    case 'published':
      return projects.filter((p) => p.metadata.status === 'published');
    case 'in_progress':
      return projects.filter((p) => p.metadata.status === 'in_progress');
    case 'draft':
      return projects.filter((p) => !p.metadata.status || p.metadata.status === 'draft');
    case 'your_projects':
    case 'all':
    default:
      return projects;
  }
};
