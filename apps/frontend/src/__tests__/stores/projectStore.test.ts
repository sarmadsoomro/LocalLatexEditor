import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../../stores/projectStore';
import type { ProjectWithMetadata, FileNode } from '@local-latex-editor/shared-types';

const createMockProject = (id: string, name: string): ProjectWithMetadata => ({
  id,
  name,
  path: `/projects/${id}`,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  metadata: {
    mainFile: 'main.tex',
    template: 'article',
    fileCount: 1,
    totalSize: 1024,
    status: 'draft',
    deletedAt: null,
  },
  settings: {
    compiler: 'pdflatex',
    outputDirectory: 'build',
  },
});

beforeEach(() => {
  const store = useProjectStore.getState();
  store.setProjects([]);
  store.setCurrentProject(null);
  store.setFileTree(null);
  store.setLoading(false);
  store.clearError();
});

describe('ProjectStore', () => {
  describe('setProjects', () => {
    it('should set projects list', () => {
      const store = useProjectStore.getState();
      const projects: ProjectWithMetadata[] = [createMockProject('proj_1', 'Project 1')];

      store.setProjects(projects);

      expect(useProjectStore.getState().projects).toEqual(projects);
    });
  });

  describe('setCurrentProject', () => {
    it('should set current project', () => {
      const store = useProjectStore.getState();
      const project = createMockProject('proj_1', 'Project 1');

      store.setCurrentProject(project);

      expect(useProjectStore.getState().currentProject).toEqual(project);
    });

    it('should clear file tree when setting null project', () => {
      const store = useProjectStore.getState();
      const fileTree: FileNode[] = [
        {
          id: 'file_1',
          name: 'main.tex',
          path: 'main.tex',
          type: 'file',
          modifiedAt: '2024-01-15T10:00:00Z',
        },
      ];

      store.setFileTree(fileTree);
      store.setCurrentProject(null);

      expect(useProjectStore.getState().fileTree).toBeNull();
    });
  });

  describe('addProject', () => {
    it('should add project to the beginning of list', () => {
      const store = useProjectStore.getState();
      const project1 = createMockProject('proj_1', 'Project 1');
      const project2 = createMockProject('proj_2', 'Project 2');

      store.addProject(project1);
      store.addProject(project2);

      expect(useProjectStore.getState().projects).toEqual([project2, project1]);
    });
  });

  describe('removeProject', () => {
    it('should remove project by id', () => {
      const store = useProjectStore.getState();
      const project = createMockProject('proj_1', 'Project 1');
      store.addProject(project);

      store.removeProject('proj_1');

      expect(useProjectStore.getState().projects).toHaveLength(0);
    });

    it('should clear current project if it is removed', () => {
      const store = useProjectStore.getState();
      const project = createMockProject('proj_1', 'Project 1');
      store.addProject(project);
      store.setCurrentProject(project);

      store.removeProject('proj_1');

      expect(useProjectStore.getState().currentProject).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update project properties', () => {
      const store = useProjectStore.getState();
      const project = createMockProject('proj_1', 'Project 1');
      store.addProject(project);

      store.updateProject('proj_1', { name: 'Updated Project' });

      expect(useProjectStore.getState().projects[0].name).toBe('Updated Project');
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = useProjectStore.getState();

      store.setLoading(true);

      expect(useProjectStore.getState().isLoading).toBe(true);
    });
  });

  describe('setError and clearError', () => {
    it('should set error message', () => {
      const store = useProjectStore.getState();

      store.setError('Something went wrong');

      expect(useProjectStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error message', () => {
      const store = useProjectStore.getState();
      store.setError('Something went wrong');

      store.clearError();

      expect(useProjectStore.getState().error).toBeNull();
    });
  });
});