import { useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { projectApi } from '../services/projectApi';

export function useProjects() {
  const { projects, setProjects, isLoading, setLoading, error, setError } = useProjectStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.listProjects();
      setProjects(data.projects);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError]);

  useEffect(() => {
    if (!hasLoaded) {
      fetchProjects();
    }
  }, [hasLoaded, fetchProjects]);

  const refetch = useCallback(() => {
    setHasLoaded(false);
  }, []);

  return {
    projects,
    isLoading,
    error,
    refetch,
  };
}

export function useProject(id: string | null) {
  const {
    currentProject,
    fileTree,
    setCurrentProject,
    setFileTree,
    setLoading,
    setError,
  } = useProjectStore();

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      setCurrentProject(null);
      setFileTree(null);
      setHasLoaded(false);
      return;
    }

    if (hasLoaded) return;

    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectData, filesData] = await Promise.all([
          projectApi.getProject(id),
          projectApi.getProjectFiles(id),
        ]);
        setCurrentProject(projectData.project);
        setFileTree(filesData.files);
        setHasLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, hasLoaded, setCurrentProject, setFileTree, setLoading, setError]);

  const refetch = useCallback(() => {
    setHasLoaded(false);
  }, []);

  return {
    project: currentProject,
    fileTree,
    refetch,
  };
}
