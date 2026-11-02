import { Check, Copy, Download, Package } from "lucide-react";
import { useEffect, useState } from "react";

import { ApiError } from "../services/api";
import { packageApi, type PackageLookup } from "../services/packageApi";

import { useToast } from "./Toast";

interface MissingPackageNoticeProps {
  files: string[];
  /** Called after a package installed, to compile again. */
  onInstalled?: () => void;
}

/** One notice per missing package file, offering to install it. */
export function MissingPackageNotice({ files, onInstalled }: MissingPackageNoticeProps) {
  return (
    <div className="border-b border-border bg-cta/5">
      {files.map((file) => (
        <MissingPackage key={file} file={file} onInstalled={onInstalled} />
      ))}
    </div>
  );
}

type State =
  | { kind: "looking" }
  | { kind: "ready"; lookup: PackageLookup }
  | { kind: "installing"; lookup: PackageLookup }
  | { kind: "installed"; lookup: PackageLookup }
  | { kind: "failed"; lookup: PackageLookup | null; message: string; details?: string };

function MissingPackage({ file, onInstalled }: { file: string; onInstalled?: () => void }) {
  const [state, setState] = useState<State>({ kind: "looking" });
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "looking" });
    packageApi
      .lookup(file)
      .then((lookup) => !cancelled && setState({ kind: "ready", lookup }))
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ kind: "failed", lookup: null, message: err instanceof Error ? err.message : "Lookup failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const install = async (lookup: PackageLookup): Promise<void> => {
    setState({ kind: "installing", lookup });
    try {
      await packageApi.install(file, lookup.package);
      setState({ kind: "installed", lookup });
      addToast(`Installed ${lookup.package}. Compiling again.`, "success");
      onInstalled?.();
    } catch (err) {
      if (err instanceof ApiError && err.code === "INSTALL_CANCELLED") {
        setState({ kind: "ready", lookup });
        return;
      }
      const details = err instanceof ApiError && typeof err.details?.output === "string" ? err.details.output : undefined;
      setState({ kind: "failed", lookup, message: err instanceof Error ? err.message : "Install failed", details });
    }
  };

  const lookup = state.kind === "looking" ? null : state.lookup;
  const pkg = lookup?.package ?? file.replace(/\.[^.]+$/, "");

  return (
    <div className="px-4 py-3 border-b border-border/50 last:border-b-0" aria-live="polite">
      <div className="flex items-start gap-3">
        <Package className="w-4 h-4 mt-0.5 text-cta shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-heading">
            {state.kind === "installed" ? (
              <>
                <strong>{pkg}</strong> is installed.
              </>
            ) : (
              <>
                The LaTeX package <strong>{pkg}</strong> is not installed
                {pkg !== file.replace(/\.[^.]+$/, "") && <span className="text-muted"> (it provides {file})</span>}.
              </>
            )}
          </p>

          {state.kind === "looking" && <p className="text-xs text-muted">Looking it up…</p>}

          {lookup?.note && state.kind !== "installed" && <p className="text-xs text-muted">{lookup.note}</p>}

          {(state.kind === "ready" || state.kind === "installing") && lookup && lookup.method !== "manual" && (
            <button
              type="button"
              onClick={() => void install(lookup)}
              disabled={state.kind === "installing"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-cta rounded-lg hover:bg-cta/90 disabled:opacity-60 disabled:cursor-wait transition-colors"
            >
              {state.kind === "installing" ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Installing {pkg}… this can take a minute
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Install {pkg}
                </>
              )}
            </button>
          )}

          {state.kind === "failed" && <p className="text-xs text-error">{state.message}</p>}

          {lookup?.command &&
            ((state.kind === "ready" && lookup.method === "manual") || state.kind === "failed") && (
              <CommandLine command={lookup.command} />
            )}

          {state.kind === "failed" && state.lookup && state.lookup.method !== "manual" && (
            <button
              type="button"
              onClick={() => void install(state.lookup as PackageLookup)}
              className="text-xs font-bold text-cta hover:underline"
            >
              Try again
            </button>
          )}

          {state.kind === "failed" && state.details && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted">Details</summary>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted">
                {state.details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function CommandLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the command is still selectable
    }
  };
  return (
    <div>
      <p className="text-xs text-muted mb-1">Run this in a terminal, then compile again:</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
        <code className="flex-1 min-w-0 truncate font-mono text-xs text-heading select-all" title={command}>
          {command}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="p-1 text-muted hover:text-cta rounded"
          aria-label={copied ? "Copied" : "Copy command"}
          title={copied ? "Copied" : "Copy command"}
        >
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
