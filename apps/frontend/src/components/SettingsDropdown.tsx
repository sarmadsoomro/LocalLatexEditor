import { useState, useRef, useEffect, ReactNode } from 'react';

interface SettingsDropdownProps {
  children: ReactNode;
  engine?: string;
  onEngineChange?: (engine: string) => void;
}

const ENGINES = [
  { value: 'pdflatex', label: 'pdfLaTeX' },
  { value: 'xelatex', label: 'XeLaTeX' },
  { value: 'lualatex', label: 'LuaLaTeX' },
];

export function SettingsDropdown({
  children,
  engine,
  onEngineChange,
}: SettingsDropdownProps) {
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted hover:text-heading hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
        aria-label="Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
          {children}
          
          {engine && onEngineChange && (
            <>
              <div className="border-t border-border my-1" />
              <div className="px-4 py-2 text-xs text-muted uppercase tracking-wider">
                Engine
              </div>
              {ENGINES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => {
                    onEngineChange(e.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-surface-hover transition-colors ${
                    engine === e.value ? 'text-primary font-medium' : 'text-secondary'
                  }`}
                >
                  <div className="flex items-center">
                    {engine === e.value && (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {(!engine || engine !== e.value) && <span className="w-4 mr-2" />}
                    {e.label}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsDropdown;
