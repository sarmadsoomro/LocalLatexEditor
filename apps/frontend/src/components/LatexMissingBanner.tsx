import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { compilationApi } from "../services/compilationApi";

import { latexInstallHelp } from "./latexInstallHelp";

/**
 * Shown when the backend finds no LaTeX engine, so students learn why
 * compiling fails before they try, and where to get one for their OS.
 */
export function LatexMissingBanner() {
  const [missing, setMissing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const result = await compilationApi.checkLatexInstallation();
      setMissing(!result.latexInstalled);
    } catch {
      // backend unreachable or session expired: other notices cover that
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  if (!missing || dismissed) return null;
  const help = latexInstallHelp(navigator.userAgent);

  return (
    <div
      role="status"
      // #root is a flex row, so float above the page instead of taking a row in it
      className="fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm text-heading shadow-lg"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <span className="font-semibold">LaTeX is not installed, so PDFs cannot be built yet.</span>
      <span className="text-secondary">
        Install{" "}
        <a href={help.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-cta underline">
          {help.name}
        </a>
        . {help.hint}
      </span>
      <span className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => void check()}
          disabled={checking}
          className="rounded border border-border bg-surface px-2 py-0.5 text-xs font-semibold hover:bg-surface-hover disabled:opacity-60"
        >
          {checking ? "Checking..." : "Check again"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded p-1 text-secondary hover:bg-surface-hover"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
