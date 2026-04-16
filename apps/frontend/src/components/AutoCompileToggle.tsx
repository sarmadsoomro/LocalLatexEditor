interface AutoCompileToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AutoCompileToggle({ enabled, onChange }: AutoCompileToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center px-3 py-1.5 text-sm font-bold rounded-xl transition-all shadow-soft-sm cursor-pointer border ${
        enabled
          ? "text-cta bg-cta/5 border-cta/20 hover:bg-cta/10 shadow-cta"
          : "text-muted bg-surface border-border hover:bg-surface-hover"
      }`}
      title={enabled ? "Auto-compile: On (compiles after save)" : "Auto-compile: Off"}
      aria-pressed={enabled}
    >
      <div className={`relative w-8 h-4 rounded-full transition-colors mr-2 ${enabled ? "bg-cta" : "bg-muted/30"}`}>
        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      Auto
    </button>
  );
}

export default AutoCompileToggle;
