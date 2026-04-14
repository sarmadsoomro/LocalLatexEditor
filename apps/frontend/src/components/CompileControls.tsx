interface CompileControlsProps {
  isCompiling: boolean;
  status: string;
  engine: string;
  onCompile: () => void;
  onCancel: () => void;
  onEngineChange: (engine: string) => void;
}

const engines = [
  { value: "pdflatex", label: "pdfLaTeX" },
  { value: "xelatex", label: "XeLaTeX" },
  { value: "lualatex", label: "LuaLaTeX" },
];

function CompileControls({
  isCompiling,
  status,
  engine,
  onCompile,
  onCancel,
  onEngineChange,
}: CompileControlsProps) {
  const getStatusStyle = () => {
    const normalizedStatus = status.toLowerCase();

    if (isCompiling) {
      return "bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-light border-primary-light dark:border-primary animate-pulse-soft";
    }
    if (
      normalizedStatus.includes("error") ||
      normalizedStatus.includes("fail")
    ) {
      return "bg-error-light text-error border-red-200 dark:border-red-800";
    }
    if (
      normalizedStatus.includes("success") ||
      normalizedStatus.includes("complete")
    ) {
      return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
    }
    return "bg-border-light dark:bg-gray-800 text-muted border-border dark:border-gray-700";
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {status && (
        <span
          role="status"
          aria-live="polite"
          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-150 ${getStatusStyle()}`}
        >
          {isCompiling && (
            <span className="inline-flex items-center">
              <svg
                className="animate-spin -ml-0.5 mr-1.5 h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {status}
            </span>
          )}
          {!isCompiling && status}
        </span>
      )}

      <label htmlFor="compile-engine" className="sr-only">
        Compilation engine
      </label>
      <select
        id="compile-engine"
        value={engine}
        onChange={(e) => onEngineChange(e.target.value)}
        disabled={isCompiling}
        className={`px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 cursor-pointer ${
          isCompiling
            ? "bg-border-light dark:bg-gray-800 text-muted cursor-not-allowed border-border dark:border-gray-700"
            : "bg-surface dark:bg-gray-800 text-heading dark:text-heading border-border dark:border-gray-600 hover:border-primary-light"
        }`}
      >
        {engines.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>

      {isCompiling ? (
        <button
          onClick={onCancel}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-error-light dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg 
            hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500
            transition-all duration-150 cursor-pointer"
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Cancel
        </button>
      ) : (
        <button
          onClick={onCompile}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg 
            hover:bg-primary-dark hover:shadow-md hover:shadow-primary
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Compile PDF
        </button>
      )}
    </div>
  );
}

export default CompileControls;
