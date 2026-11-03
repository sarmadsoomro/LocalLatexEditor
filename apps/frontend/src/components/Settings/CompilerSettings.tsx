import { useSettingsStore } from '@/stores';
import type { CompilerSettings as CompilerSettingsType } from '@/types/settings';

import {
  SettingsSection,
  ToggleSetting,
  SelectSetting,
  SettingItem,
  SliderSetting,
} from './SettingsComponents';

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
      </SettingsSection>

      <SettingsSection
        title="Compilation Options"
        description="TexCraft keeps auxiliary files between compiles and only reruns LaTeX and BibTeX/Biber when needed (via latexmk, if installed). Use Compile ▾ → Clean build to rebuild from scratch."
      >
        <SettingItem>
          <SliderSetting
            label="Compile timeout"
            value={compiler.compileTimeoutSeconds}
            min={30}
            max={1800}
            step={30}
            unit=" s"
            onChange={(compileTimeoutSeconds) => updateCompilerSettings({ compileTimeoutSeconds })}
            description="Maximum time for one whole compile, all passes included. Raise it for very long theses or heavy TikZ."
          />
        </SettingItem>
        <SettingItem>
          <ToggleSetting
            label="Shell escape"
            description="Trusts the document: it can run programs, read files outside the project, and use a latexmkrc that came with it. Needed for minted and some SVG/gnuplot packages. Only enable it for documents you trust."
            checked={compiler.shellEscape}
            onChange={(shellEscape) => updateCompilerSettings({ shellEscape })}
          />
        </SettingItem>
        {compiler.shellEscape && (
          <p
            role="alert"
            className="text-xs rounded-lg border px-3 py-2"
            style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
          >
            Shell escape is on. A document you did not write can now run any command as you. Turn it off when you no longer need it.
          </p>
        )}
      </SettingsSection>
    </div>
  );
}