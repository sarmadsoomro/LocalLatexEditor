import type { CompilerSettings as CompilerSettingsType } from '@/types/settings';
import {
  SettingsSection,
  ToggleSetting,
  SelectSetting,
  SettingItem,
} from './SettingsComponents';
import { useSettingsStore } from '@/stores';

const ENGINE_OPTIONS = [
  { value: 'pdflatex', label: 'PDFLaTeX' },
  { value: 'xelatex', label: 'XeLaTeX' },
  { value: 'lualatex', label: 'LuaLaTeX' },
];

export function CompilerSettings() {
  const compiler = useSettingsStore((state) => state.compiler);
  const updateCompilerSettings = useSettingsStore((state) => state.updateCompilerSettings);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Compiler Engine"
        description="Configure the default LaTeX compilation engine"
      >
        <SettingItem>
          <SelectSetting
            label="Default Engine"
            value={compiler.defaultEngine}
            options={ENGINE_OPTIONS}
            onChange={(defaultEngine) =>
              updateCompilerSettings({ defaultEngine: defaultEngine as CompilerSettingsType['defaultEngine'] })
            }
            description="The LaTeX engine used for compiling documents"
          />
        </SettingItem>
        <SettingItem>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">Output Directory</label>
            <input
              type="text"
              value={compiler.outputDirectory}
              onChange={(e) => updateCompilerSettings({ outputDirectory: e.target.value })}
              placeholder="output"
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 bg-surface dark:bg-gray-800 text-heading border-border dark:border-gray-600 hover:border-primary-light"
            />
            <p className="text-xs text-muted">Directory where compiled PDF files are saved</p>
          </div>
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Compilation Options"
        description="Configure compilation behavior"
      >
        <SettingItem>
          <ToggleSetting
            label="SyncTeX"
            description="Generate SyncTeX file for PDF-to-source navigation"
            checked={compiler.synctex}
            onChange={(synctex) => updateCompilerSettings({ synctex })}
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Draft Mode"
            description="Enable draft mode for faster compilation (lower quality output)"
            checked={compiler.draftMode}
            onChange={(draftMode) => updateCompilerSettings({ draftMode })}
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Shell Escape"
            description="Enable shell escape (security risk: allows arbitrary code execution)"
            checked={compiler.shellEscape}
            onChange={(shellEscape) => updateCompilerSettings({ shellEscape })}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        title="Additional Arguments"
        description="Pass extra command-line arguments to the compiler"
      >
        <SettingItem>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">Additional Arguments</label>
            <input
              type="text"
              value={compiler.additionalArgs.join(' ')}
              onChange={(e) => {
                const value = e.target.value.trim();
                const args = value ? value.split(/\s+/) : [];
                updateCompilerSettings({ additionalArgs: args });
              }}
              placeholder="Enter space-separated arguments"
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 bg-surface dark:bg-gray-800 text-heading border-border dark:border-gray-600 hover:border-primary-light"
            />
            <p className="text-xs text-muted">Space-separated compiler arguments (e.g., &quot;-halt-on-error&quot;)</p>
          </div>
        </SettingItem>
      </SettingsSection>
    </div>
  );
}