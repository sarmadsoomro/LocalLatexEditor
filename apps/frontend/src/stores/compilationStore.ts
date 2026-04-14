import { create } from "zustand";
import type { CompilationResult } from "@local-latex-editor/shared-types";
import { compilationApi } from "../services/compilationApi";

type CompilationStatus = "idle" | "compiling" | "success" | "error";

const POLL_INTERVAL_MS = 1000;

interface CompilationState {
  isCompiling: boolean;
  jobId: string | null;
  status: CompilationStatus;
  logs: string[];
  result: CompilationResult | null;
  progress: number;
  // Internal polling state (not exposed to consumers)
  _pollIntervalId: ReturnType<typeof setInterval> | null;

  startCompilation: (jobId: string) => void;
  addLog: (line: string) => void;
  setLogs: (logOutput: string) => void;
  setProgress: (progress: number) => void;
  setSuccess: (result: CompilationResult) => void;
  setError: (result: CompilationResult) => void;
  reset: () => void;
  clearLogs: () => void;
  // New polling actions
  _startPolling: (jobId: string) => void;
  _stopPolling: () => void;
}

const initialState = {
  isCompiling: false,
  jobId: null,
  status: "idle" as CompilationStatus,
  logs: [] as string[],
  result: null as CompilationResult | null,
  progress: 0,
  _pollIntervalId: null,
};

export const useCompilationStore = create<CompilationState>((set, get) => ({
  ...initialState,

  startCompilation: (jobId) => {
    // Stop any existing polling first
    get()._stopPolling();
    set({
      isCompiling: true,
      jobId,
      status: "compiling",
      progress: 0,
      logs: [],
      result: null,
    });
    // Start polling for this job
    get()._startPolling(jobId);
  },

  addLog: (line) =>
    set((state) => ({
      logs: [...state.logs, line],
    })),

  setLogs: (logOutput) =>
    set(() => ({
      logs: logOutput ? logOutput.split("\n") : [],
    })),

  setProgress: (progress) =>
    set(() => ({
      progress,
    })),

  setSuccess: (result) => {
    get()._stopPolling();
    set({
      isCompiling: false,
      status: "success",
      result,
      progress: 100,
    });
  },

  setError: (result) => {
    get()._stopPolling();
    set({
      isCompiling: false,
      status: "error",
      result,
    });
  },

  reset: () => {
    get()._stopPolling();
    set(initialState);
  },

  clearLogs: () =>
    set(() => ({
      logs: [],
    })),

  // Private polling logic - only used internally
  _stopPolling: () => {
    const { _pollIntervalId } = get();
    if (_pollIntervalId) {
      clearInterval(_pollIntervalId);
    }
    set({ _pollIntervalId: null });
  },

  _startPolling: (jobId) => {
    // Clear any existing poll
    get()._stopPolling();

    const poll = async () => {
      try {
        const statusResponse = await compilationApi.getStatus(jobId);

        if (statusResponse.progress !== undefined) {
          get().setProgress(statusResponse.progress);
        }

        if (statusResponse.status === "complete" && statusResponse.result) {
          if (statusResponse.result.logOutput) {
            get().setLogs(statusResponse.result.logOutput);
          }
          get().setSuccess(statusResponse.result);
        } else if (
          statusResponse.status === "failed" &&
          statusResponse.result
        ) {
          if (statusResponse.result.logOutput) {
            get().setLogs(statusResponse.result.logOutput);
          }
          get().setError(statusResponse.result);
        } else if (statusResponse.status === "failed") {
          get().setError({
            success: false,
            logOutput: "Compilation failed",
            errors: [],
            warnings: [],
            duration: 0,
          });
        }
      } catch (error) {
        console.error("Error polling compilation status:", error);
      }
    };

    // Poll immediately, then on interval
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    set({ _pollIntervalId: intervalId });
  },
}));
