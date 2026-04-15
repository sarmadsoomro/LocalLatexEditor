import {
  SettingsSection,
  ToggleSetting,
  SelectSetting,
  SettingItem,
} from './SettingsComponents';
import { useSettingsStore } from '@/stores';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function UISettings() {
  const ui = useSettingsStore((state) => state.ui);
  const updateUISettings = useSettingsStore((state) => state.updateUISettings);
  const resetUISettings = useSettingsStore((state) => state.resetUISettings);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Appearance"
        description="Configure the application theme"
      >
        <SettingItem>
          <SelectSetting
            label="Theme"
            value={ui.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => updateUISettings({ theme: theme as 'light' | 'dark' | 'system' })}
            description="Choose your preferred color scheme"
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="File Explorer"
        description="Configure file tree display options"
      >
        <SettingItem>
          <ToggleSetting
            label="Show Hidden Files"
            description="Display files and folders starting with a dot"
            checked={ui.showHiddenFiles}
            onChange={(showHiddenFiles) => updateUISettings({ showHiddenFiles })}
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Show Compiled Files"
            description="Display auxiliary files (.aux, .log, .out)"
            checked={ui.showCompiledFiles}
            onChange={(showCompiledFiles) => updateUISettings({ showCompiledFiles })}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Confirmations"
        description="Configure confirmation dialogs"
      >
        <SettingItem>
          <ToggleSetting
            label="Confirm Delete"
            description="Show confirmation before deleting files or folders"
            checked={ui.confirmDelete}
            onChange={(confirmDelete) => updateUISettings({ confirmDelete })}
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Confirm Close Unsaved"
            description="Show warning when closing files with unsaved changes"
            checked={ui.confirmCloseUnsaved}
            onChange={(confirmCloseUnsaved) => updateUISettings({ confirmCloseUnsaved })}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Reset"
        description="Reset UI settings to defaults"
      >
        <SettingItem>
          <button
            type="button"
            onClick={() => resetUISettings()}
            className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
          >
            Reset UI Settings
          </button>
        </SettingItem>
      </SettingsSection>
    </div>
  );
}