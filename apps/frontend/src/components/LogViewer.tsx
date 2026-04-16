import { useEffect, useRef, useState } from 'react';
import type { CompilationError, CompilationWarning } from '@local-latex-editor/shared-types';

interface LogViewerProps {
  logs: string[];
  errors: CompilationError[];
  warnings: CompilationWarning[];
  onErrorClick?: (error: CompilationError) => void;
}

export default function LogViewer({
  logs,
  errors,
  warnings,
  onErrorClick,
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedError, setSelectedError] = useState<CompilationError | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleErrorClick = (error: CompilationError) => {
    setSelectedError(selectedError === error ? null : error);
    onErrorClick?.(error);
  };

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {errors.length > 0 && (
        <div className="border-b border-border bg-error/5 max-h-48 overflow-auto">
          <div className="px-4 py-2 border-b border-error/10 bg-error/5 sticky top-0 flex items-center justify-between backdrop-blur-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-error">
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-error/10">
            {errors.map((error, idx) => (
              <div
                key={idx}
                onClick={() => handleErrorClick(error)}
                className={`
                  px-4 py-4 cursor-pointer transition-all duration-fast
                  ${selectedError === error ? 'bg-error/10' : 'hover:bg-error/5'}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-error text-white">
                    Line {error.line || '?'}
                  </span>
                  {error.file && (
                    <span className="text-sm font-medium text-error/80 truncate">
                      {error.file}
                    </span>
                  )}
                </div>
                <p className="text-sm text-error font-mono leading-relaxed">
                  {error.message}
                </p>
                {error.fixes && error.fixes.length > 0 && selectedError === error && (
                  <div className="mt-3 pt-3 border-t border-error/10 animate-fade-in">
                    <span className="text-xs font-bold uppercase tracking-wider text-error/70">Suggestions:</span>
                    <ul className="mt-2 space-y-1.5">
                      {error.fixes.map((fix, fixIdx) => (
                        <li key={fixIdx} className="text-sm text-error/80 flex items-start gap-2">
                          <span className="text-error/50 mt-1">•</span>
                          {fix.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-surface">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Compilation Log</span>
        <div className="flex items-center gap-3 ml-auto">
          {hasErrors && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-error">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              {errors.length} ERROR{errors.length !== 1 ? 'S' : ''}
            </span>
          )}
          {hasWarnings && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-warning">
              <div className="w-2 h-2 rounded-full bg-warning" />
              {warnings.length} WARNING{warnings.length !== 1 ? 'S' : ''}
            </span>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-muted text-center py-12 animate-fade-in opacity-60">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No compilation logs yet
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((line, index) => (
              <div
                key={index}
                className="flex items-start py-0.5 px-2 -mx-2 rounded hover:bg-surface-hover transition-colors group"
              >
                <span className="select-none text-muted/50 group-hover:text-muted w-10 text-right mr-4 flex-shrink-0 tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all text-secondary">
                  {line}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
