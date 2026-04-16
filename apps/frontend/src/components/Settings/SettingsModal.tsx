import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { SettingsTabs, type TabId } from './SettingsTabs';
import { EditorSettings } from './EditorSettings';
import { CompilerSettings } from './CompilerSettings';
import { UISettings } from './UISettings';
import { AboutSection } from './AboutSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('editor');

  if (!isOpen) return null;

  const handleResetAll = () => {
    // Reset all settings to defaults
    // This will be connected to the settings store
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return <EditorSettings />;
      case 'compiler':
        return <CompilerSettings />;
      case 'ui':
        return <UISettings />;
      case 'shortcuts':
        return (
          <div className="flex items-center justify-center h-full text-muted">
            <p>Keyboard shortcuts coming soon</p>
          </div>
        );
      case 'about':
        return <AboutSection />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative bg-white dark:bg-surface rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] mx-4 flex flex-col overflow-hidden animate-fade-in"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-gray-700">
          <h1
            id="settings-title"
            className="text-xl font-semibold text-heading dark:text-heading"
          >
            Settings
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted hover:text-heading dark:hover:text-heading hover:bg-surface-hover dark:hover:bg-gray-800 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reset All</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-heading dark:hover:text-heading hover:bg-surface-hover dark:hover:bg-gray-800 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-56 border-r border-border dark:border-gray-700 p-4">
            <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </aside>

          <main
            id={`${activeTab}-panel`}
            role="tabpanel"
            className="flex-1 overflow-y-auto p-6"
          >
            {renderTabContent()}
          </main>
        </div>

        <footer className="flex justify-end px-6 py-4 border-t border-border dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
