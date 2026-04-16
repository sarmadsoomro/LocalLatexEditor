import { useState, useRef, useEffect } from 'react';

interface CompileButtonProps {
  onClick: () => void;
  isCompiling: boolean;
  engine: string;
  onEngineChange: (engine: string) => void;
}

const ENGINES = [
  { value: 'pdflatex', label: 'pdfLaTeX' },
  { value: 'xelatex', label: 'XeLaTeX' },
  { value: 'lualatex', label: 'LuaLaTeX' },
];

export function CompileButton({
  onClick,
  isCompiling,
  engine,
  onEngineChange,
}: CompileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center">
      <button
        onClick={onClick}
        disabled={isCompiling}
        className="flex items-center px-4 py-1.5 text-sm font-bold text-white bg-cta hover:bg-cta-dark rounded-l-xl transition-all shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Compile (Ctrl+B)"
      >
        {isCompiling ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Compiling...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Compile
          </>
        )}
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1.5 text-sm font-bold text-white bg-cta hover:bg-cta-dark border-l border-white/10 rounded-r-xl transition-all shadow-soft-md cursor-pointer"
          aria-label="Select engine"
          aria-expanded={isOpen}
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-xl shadow-soft-xl py-1.5 min-w-[140px] z-50 animate-fade-in">
            {ENGINES.map((e) => (
              <button
                key={e.value}
                onClick={() => {
                  onEngineChange(e.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-cta/5 transition-colors ${
                  engine === e.value ? 'text-cta font-bold bg-cta/5' : 'text-secondary'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompileButton;
