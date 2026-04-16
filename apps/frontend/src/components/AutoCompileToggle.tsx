interface AutoCompileToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AutoCompileToggle({ enabled, onChange }: AutoCompileToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
        enabled
          ? 'text-primary bg-primary/10 hover:bg-primary/20'
          : 'text-muted bg-surface border border-border hover:bg-surface-hover'
      }`}
      title={enabled ? 'Auto-compile: On (compiles after save)' : 'Auto-compile: Off'}
      aria-pressed={enabled}
    >
      {enabled ? (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Auto
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Auto
        </>
      )}
    </button>
  );
}

export default AutoCompileToggle;
