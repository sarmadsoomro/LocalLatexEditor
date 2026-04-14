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
    <div className="flex flex-col h-full bg-gray-50">
      {errors.length > 0 && (
        <div className="border-b border-gray-200 bg-red-50 max-h-48 overflow-auto">
          <div className="px-4 py-2 border-b border-red-200 bg-red-100 sticky top-0">
            <span className="text-sm font-semibold text-red-800">
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-red-100">
            {errors.map((error, idx) => (
              <div
                key={idx}
                onClick={() => handleErrorClick(error)}
                className={`
                  px-4 py-2 cursor-pointer transition-colors
                  ${selectedError === error ? 'bg-red-200' : 'hover:bg-red-100'}
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800">
                    Line {error.line || '?'}
                  </span>
                  {error.file && (
                    <span className="text-xs text-red-700 truncate">
                      {error.file}
                    </span>
                  )}
                </div>
                <p className="text-sm text-red-800 font-mono">
                  {error.message}
                </p>
                {error.fixes && error.fixes.length > 0 && selectedError === error && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <span className="text-xs font-medium text-red-700">Suggestions:</span>
                    <ul className="mt-1 space-y-1">
                      {error.fixes.map((fix, fixIdx) => (
                        <li key={fixIdx} className="text-xs text-red-700">
                          • {fix.title}
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

      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-white">
        <span className="text-sm font-medium text-gray-700">Compilation Log</span>
        {hasErrors && (
          <span className="flex items-center gap-1 text-sm text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </span>
        )}
        {hasWarnings && (
          <span className="flex items-center gap-1 text-sm text-yellow-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No compilation logs yet
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((line, index) => (
              <div
                key={index}
                className="flex items-start py-0.5 px-2 -mx-2 rounded hover:bg-gray-100"
              >
                <span className="select-none text-gray-400 w-8 text-right mr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all text-gray-700">
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