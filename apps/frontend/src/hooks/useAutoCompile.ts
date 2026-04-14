import { useEffect, useRef, useCallback } from "react";
import { useCompilationStore } from "../stores/compilationStore";
import { compilationApi } from "../services/compilationApi";
import { useProjectStore } from "../stores/projectStore";
import { shallow } from "zustand/shallow";

const AUTO_COMPILE_DELAY_MS = 2000;
const AUTO_COMPILE_MIN_INTERVAL_MS = 8000;
const MAX_QUEUE_SIZE = 10;

export function useAutoCompile() {
  const { isCompiling, startCompilation, setError } = useCompilationStore(
    (state) => ({
      isCompiling: state.isCompiling,
      startCompilation: state.startCompilation,
      setError: state.setError,
    }),
    shallow,
  );

  const currentProject = useProjectStore((state) => state.currentProject);
  const autoCompileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasPendingChangesRef = useRef(false);
  const queuedDuringCompileRef = useRef(false);
  const lastCompileStartAtRef = useRef(0);
  const queueSizeRef = useRef(0);

  const clearAutoCompileTimeout = useCallback(() => {
    if (autoCompileTimeoutRef.current) {
      clearTimeout(autoCompileTimeoutRef.current);
      autoCompileTimeoutRef.current = null;
    }
  }, []);

  const executeCompile = useCallback(async () => {
    if (!currentProject) {
      return;
    }

    if (isCompiling) {
      queuedDuringCompileRef.current = true;
      return;
    }

    const now = Date.now();
    const elapsedSinceLastCompile = now - lastCompileStartAtRef.current;
    if (
      lastCompileStartAtRef.current > 0 &&
      elapsedSinceLastCompile < AUTO_COMPILE_MIN_INTERVAL_MS
    ) {
      const remaining = AUTO_COMPILE_MIN_INTERVAL_MS - elapsedSinceLastCompile;
      clearAutoCompileTimeout();
      autoCompileTimeoutRef.current = setTimeout(() => {
        void executeCompile();
      }, remaining);
      return;
    }

    hasPendingChangesRef.current = false;
    queuedDuringCompileRef.current = false;
    lastCompileStartAtRef.current = now;

    try {
      const response = await compilationApi.compile(
        currentProject.id,
        currentProject.settings?.compiler,
        currentProject.metadata?.mainFile,
      );
      startCompilation(response.jobId);
    } catch (error) {
      console.error("Failed to start auto-compilation:", error);
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
    } finally {
      queueSizeRef.current = Math.max(0, queueSizeRef.current - 1);
    }
  }, [currentProject, isCompiling, startCompilation, setError]);

  const triggerAutoCompile = useCallback(() => {
    if (!currentProject) return;

    if (queueSizeRef.current >= MAX_QUEUE_SIZE) {
      return;
    }

    hasPendingChangesRef.current = true;
    clearAutoCompileTimeout();

    autoCompileTimeoutRef.current = setTimeout(() => {
      if (hasPendingChangesRef.current && !isCompiling) {
        queueSizeRef.current += 1;
        executeCompile();
      }
    }, AUTO_COMPILE_DELAY_MS);
  }, [currentProject, isCompiling, executeCompile, clearAutoCompileTimeout]);

  useEffect(() => {
    if (isCompiling) {
      return;
    }

    if (queuedDuringCompileRef.current || hasPendingChangesRef.current) {
      clearAutoCompileTimeout();
      autoCompileTimeoutRef.current = setTimeout(() => {
        void executeCompile();
      }, AUTO_COMPILE_DELAY_MS);
    }
  }, [isCompiling, executeCompile, clearAutoCompileTimeout]);

  const cancelAutoCompile = useCallback(() => {
    clearAutoCompileTimeout();
    hasPendingChangesRef.current = false;
    queuedDuringCompileRef.current = false;
    queueSizeRef.current = 0;
  }, [clearAutoCompileTimeout]);

  useEffect(() => {
    return () => {
      clearAutoCompileTimeout();
    };
  }, [clearAutoCompileTimeout]);

  return {
    triggerAutoCompile,
    cancelAutoCompile,
    hasPendingChanges: () => hasPendingChangesRef.current,
  };
}
