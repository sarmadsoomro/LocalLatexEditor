import { useCallback } from "react";
import { useCompilationStore } from "../stores/compilationStore";
import { useProjectStore } from "../stores/projectStore";
import { useSettingsStore } from "../stores/settingsStore";
import { compilationApi } from "../services/compilationApi";
import { shallow } from "zustand/shallow";

export interface UseCompilationReturn {
  isCompiling: boolean;
  status: "idle" | "compiling" | "success" | "error";
  logs: string[];
  result: ReturnType<typeof useCompilationStore.getState>["result"];
  progress: number;
  compile: () => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export function useCompilation(): UseCompilationReturn {
  const {
    isCompiling,
    status,
    logs,
    result,
    progress,
    jobId,
    startCompilation,
    setError,
    reset: resetStore,
  } = useCompilationStore(
    (state) => ({
      isCompiling: state.isCompiling,
      status: state.status,
      logs: state.logs,
      result: state.result,
      progress: state.progress,
      jobId: state.jobId,
      startCompilation: state.startCompilation,
      setError: state.setError,
      reset: state.reset,
    }),
    shallow,
  );

  const currentProject = useProjectStore((state) => state.currentProject);
  const compilerSettings = useSettingsStore((state) => ({
    engine: state.compiler.defaultEngine,
    synctex: state.compiler.synctex,
    draftMode: state.compiler.draftMode,
    shellEscape: state.compiler.shellEscape,
    additionalArgs: state.compiler.additionalArgs,
  }));

  const compile = useCallback(async () => {
    if (!currentProject) {
      console.error("No project selected for compilation");
      return;
    }

    try {
      const response = await compilationApi.compile(
        currentProject.id,
        compilerSettings.engine,
        currentProject.metadata?.mainFile,
        {
          synctex: compilerSettings.synctex,
          draftMode: compilerSettings.draftMode,
          shellEscape: compilerSettings.shellEscape,
          additionalArgs: compilerSettings.additionalArgs,
        },
      );
      startCompilation(response.jobId);
    } catch (error) {
      console.error("Failed to start compilation:", error);
      setError({
        success: false,
        logOutput:
          error instanceof Error
            ? error.message
            : "Failed to start compilation",
        errors: [],
        warnings: [],
        duration: 0,
      });
    }
  }, [currentProject, compilerSettings, startCompilation, setError]);

  const cancel = useCallback(async () => {
    if (!jobId) {
      return;
    }

    try {
      await compilationApi.cancel(jobId);
    } catch (error) {
      console.error("Failed to cancel compilation:", error);
    } finally {
      resetStore();
    }
  }, [jobId, resetStore]);

  const reset = useCallback(() => {
    resetStore();
  }, [resetStore]);

  return {
    isCompiling,
    status,
    logs,
    result,
    progress,
    compile,
    cancel,
    reset,
  };
}
