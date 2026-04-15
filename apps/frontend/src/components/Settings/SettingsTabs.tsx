import { FileEdit, Terminal, Palette, Keyboard } from 'lucide-react';

export type TabId = 'editor' | 'compiler' | 'ui' | 'shortcuts';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof FileEdit;
}

const TABS: Tab[] = [
  { id: 'editor', label: 'Editor', icon: FileEdit },
  { id: 'compiler', label: 'Compiler', icon: Terminal },
  { id: 'ui', label: 'Appearance', icon: Palette },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
];

interface SettingsTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <nav className="flex flex-col gap-1" role="tablist">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isActive
                ? 'bg-primary text-white'
                : 'text-muted hover:text-heading hover:bg-surface-hover dark:hover:bg-gray-800'
            }`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
